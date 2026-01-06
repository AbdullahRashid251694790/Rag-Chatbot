/**
 * Chat Service with Tree Structure Support (ChatGPT-style)
 * ========================================================
 * 
 * Tree Structure:
 * - User messages and AI replies are linked as parent-child
 * - User message → AI reply (AI reply's parent is the user message)
 * - When editing a user message, a NEW user message is created as sibling
 * - The new AI reply becomes child of the new user message
 * 
 * Example:
 * User1 → AI1 → User2 → AI2
 *               ↓ (edit User2)
 *         User2' → AI2'
 * 
 * User2 and User2' are siblings (same parent: AI1)
 * AI2 is child of User2, AI2' is child of User2'
 */

import { db } from '../db/index.js';
import { chatConversations, chatMessages, documents } from '../db/schema.js';
import { eq, and, desc, asc, isNull } from 'drizzle-orm';

/**
 * Create a new conversation
 */
export async function createConversation(userId: string, title?: string) {
	const [conversation] = await db
		.insert(chatConversations)
		.values({
			userId,
			title: title || 'New Chat'
		})
		.returning();

	return conversation;
}

/**
 * Get all conversations for a user
 */
export async function getUserConversations(userId: string) {
	return await db
		.select()
		.from(chatConversations)
		.where(eq(chatConversations.userId, userId))
		.orderBy(desc(chatConversations.updatedAt));
}

/**
 * Get a conversation by ID (with ownership check)
 */
export async function getConversation(conversationId: string, userId: string) {
	const [conversation] = await db
		.select()
		.from(chatConversations)
		.where(and(eq(chatConversations.id, conversationId), eq(chatConversations.userId, userId)))
		.limit(1);

	return conversation || null;
}

/**
 * Get messages for a conversation (only active branch) with branch info and document info
 */
export async function getConversationMessages(conversationId: string, userId: string) {
	const conversation = await getConversation(conversationId, userId);
	if (!conversation) return null;

	// Get all messages
	const allMessages = await db
		.select()
		.from(chatMessages)
		.where(
			and(
				eq(chatMessages.conversationId, conversationId),
				eq(chatMessages.userId, userId)
			)
		)
		.orderBy(asc(chatMessages.createdAt));

	if (allMessages.length === 0) return [];

	// Get all documents for this conversation
	const conversationDocuments = await db
		.select()
		.from(documents)
		.where(eq(documents.conversationId, conversationId));

	// Build the active path through the tree
	const activePath = buildActivePath(allMessages);

	// Add branch info and document info to messages
	const messagesWithInfo = activePath.map((message) => {
		// Find siblings (messages with same parent AND same role)
		const siblings = allMessages.filter((m) => {
			if (m.role !== message.role) return false;
			
			if (message.parentId === null) {
				return m.parentId === null;
			}
			return m.parentId === message.parentId;
		});

		// Sort siblings by branchIndex or createdAt
		siblings.sort((a, b) => (a.branchIndex || 0) - (b.branchIndex || 0));

		const currentIndex = siblings.findIndex((s) => s.id === message.id);
		const totalBranches = siblings.length;

		// Find document for this message (if user message)
		let documentInfo = null;
		if (message.role === 'user') {
			// Find document uploaded around the same time as this message
			for (const doc of conversationDocuments) {
				const docTime = new Date(doc.createdAt).getTime();
				const msgTime = new Date(message.createdAt).getTime();
				// If document was created within 10 seconds of message
				if (Math.abs(docTime - msgTime) < 10000) {
					documentInfo = {
						id: doc.id,
						name: doc.originalName,
						status: doc.status
					};
					break;
				}
			}
		}

		return {
			...message,
			branchInfo: totalBranches > 1 ? {
				currentBranch: currentIndex + 1,
				totalBranches,
				previousId: currentIndex > 0 ? siblings[currentIndex - 1].id : null,
				nextId: currentIndex < totalBranches - 1 ? siblings[currentIndex + 1].id : null
			} : null,
			document: documentInfo
		};
	});

	return messagesWithInfo;
}

/**
 * Build the active path through the message tree
 */
function buildActivePath(messages: any[]): any[] {
	if (messages.length === 0) return [];

	// Find root messages (no parent) - should be first user message
	const rootMessages = messages.filter((m) => !m.parentId);
	
	if (rootMessages.length === 0) {
		// Fallback for old data without tree structure
		return messages;
	}

	// Start with the active root (or first root)
	let currentMessage = rootMessages.find((m) => m.isActive === 1) || rootMessages[0];
	const path: any[] = [currentMessage];

	// Follow the active path through the tree
	while (true) {
		const children = messages.filter((m) => m.parentId === currentMessage.id);
		if (children.length === 0) break;

		// Find the active child (or most recent)
		const activeChild = children.find((m) => m.isActive === 1) || 
		                    children.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
		path.push(activeChild);
		currentMessage = activeChild;
	}

	return path;
}

/**
 * Get branch info for a message (for navigation)
 */
export async function getMessageBranchInfo(messageId: string, userId: string) {
	const [message] = await db
		.select()
		.from(chatMessages)
		.where(and(eq(chatMessages.id, messageId), eq(chatMessages.userId, userId)))
		.limit(1);

	if (!message) return null;

	// Get siblings (same parent, same role)
	let siblings;
	if (message.parentId) {
		siblings = await db
			.select()
			.from(chatMessages)
			.where(
				and(
					eq(chatMessages.parentId, message.parentId),
					eq(chatMessages.role, message.role),
					eq(chatMessages.userId, userId)
				)
			)
			.orderBy(asc(chatMessages.branchIndex));
	} else {
		siblings = await db
			.select()
			.from(chatMessages)
			.where(
				and(
					isNull(chatMessages.parentId),
					eq(chatMessages.role, message.role),
					eq(chatMessages.conversationId, message.conversationId),
					eq(chatMessages.userId, userId)
				)
			)
			.orderBy(asc(chatMessages.branchIndex));
	}

	const currentIndex = siblings.findIndex((s) => s.id === messageId);
	const totalBranches = siblings.length;

	return {
		messageId,
		currentBranch: currentIndex + 1,
		totalBranches,
		hasPrevious: currentIndex > 0,
		hasNext: currentIndex < totalBranches - 1,
		previousId: currentIndex > 0 ? siblings[currentIndex - 1].id : null,
		nextId: currentIndex < totalBranches - 1 ? siblings[currentIndex + 1].id : null
	};
}

/**
 * Save a new message with proper tree structure
 */
export async function saveMessage(
	conversationId: string,
	userId: string,
	role: 'user' | 'assistant',
	content: string,
	contextChunkIds?: string,
	parentId?: string | null
) {
	// Update conversation's updatedAt timestamp
	await db
		.update(chatConversations)
		.set({ updatedAt: new Date() })
		.where(eq(chatConversations.id, conversationId));

	// Determine branch index (for siblings with same parent and role)
	let branchIndex = 0;
	if (parentId) {
		const existingSiblings = await db
			.select()
			.from(chatMessages)
			.where(
				and(
					eq(chatMessages.parentId, parentId),
					eq(chatMessages.role, role)
				)
			);
		branchIndex = existingSiblings.length;
	}

	// Generate branch ID
	const branchId = crypto.randomUUID();

	// Insert the message
	const [message] = await db
		.insert(chatMessages)
		.values({
			conversationId,
			userId,
			role,
			content,
			contextChunkIds: contextChunkIds || null,
			parentId: parentId || null,
			branchId,
			branchIndex,
			isActive: 1
		})
		.returning();

	return message;
}

/**
 * Save a message as part of a new branch (for edit)
 * This creates a sibling to the original message
 */
export async function saveMessageInBranch(
	conversationId: string,
	userId: string,
	role: 'user' | 'assistant',
	content: string,
	parentId: string | null,
	contextChunkIds?: string
) {
	const actualParentId = parentId === '' ? null : parentId;

	// Deactivate sibling branches (same parent and same role)
	if (actualParentId) {
		await db
			.update(chatMessages)
			.set({ isActive: 0 })
			.where(
				and(
					eq(chatMessages.parentId, actualParentId),
					eq(chatMessages.role, role)
				)
			);
	} else {
		await db
			.update(chatMessages)
			.set({ isActive: 0 })
			.where(
				and(
					eq(chatMessages.conversationId, conversationId),
					eq(chatMessages.userId, userId),
					eq(chatMessages.role, role),
					isNull(chatMessages.parentId)
				)
			);
	}

	// Also deactivate all descendants of siblings
	await deactivateDescendants(conversationId, userId, actualParentId, role);

	// Count existing siblings to get branch index
	let siblings;
	if (actualParentId) {
		siblings = await db
			.select()
			.from(chatMessages)
			.where(
				and(
					eq(chatMessages.parentId, actualParentId),
					eq(chatMessages.role, role)
				)
			);
	} else {
		siblings = await db
			.select()
			.from(chatMessages)
			.where(
				and(
					eq(chatMessages.conversationId, conversationId),
					eq(chatMessages.userId, userId),
					eq(chatMessages.role, role),
					isNull(chatMessages.parentId)
				)
			);
	}

	const branchIndex = siblings.length;
	const branchId = crypto.randomUUID();

	// Insert the new message as active
	const [message] = await db
		.insert(chatMessages)
		.values({
			conversationId,
			userId,
			role,
			content,
			contextChunkIds: contextChunkIds || null,
			parentId: actualParentId,
			branchId,
			branchIndex,
			isActive: 1
		})
		.returning();

	// Update conversation timestamp
	await db
		.update(chatConversations)
		.set({ updatedAt: new Date() })
		.where(eq(chatConversations.id, conversationId));

	return message;
}

/**
 * Deactivate all descendants of inactive siblings
 */
async function deactivateDescendants(
	conversationId: string,
	userId: string,
	parentId: string | null,
	role: 'user' | 'assistant'
) {
	// Get all siblings that are now inactive
	let inactiveSiblings;
	if (parentId) {
		inactiveSiblings = await db
			.select()
			.from(chatMessages)
			.where(
				and(
					eq(chatMessages.parentId, parentId),
					eq(chatMessages.role, role),
					eq(chatMessages.isActive, 0)
				)
			);
	} else {
		inactiveSiblings = await db
			.select()
			.from(chatMessages)
			.where(
				and(
					eq(chatMessages.conversationId, conversationId),
					eq(chatMessages.userId, userId),
					eq(chatMessages.role, role),
					isNull(chatMessages.parentId),
					eq(chatMessages.isActive, 0)
				)
			);
	}

	// Recursively deactivate all descendants
	for (const sibling of inactiveSiblings) {
		await deactivateAllDescendants(sibling.id);
	}
}

/**
 * Recursively deactivate all descendants of a message
 */
async function deactivateAllDescendants(messageId: string) {
	const children = await db
		.select()
		.from(chatMessages)
		.where(eq(chatMessages.parentId, messageId));

	for (const child of children) {
		await db
			.update(chatMessages)
			.set({ isActive: 0 })
			.where(eq(chatMessages.id, child.id));
		
		await deactivateAllDescendants(child.id);
	}
}

/**
 * Switch to a different branch
 */
export async function switchBranch(messageId: string, userId: string) {
	// Get the message
	const [message] = await db
		.select()
		.from(chatMessages)
		.where(and(eq(chatMessages.id, messageId), eq(chatMessages.userId, userId)))
		.limit(1);

	if (!message) return null;

	const conversationId = message.conversationId;

	// Deactivate all siblings (same parent, same role)
	if (message.parentId) {
		await db
			.update(chatMessages)
			.set({ isActive: 0 })
			.where(
				and(
					eq(chatMessages.parentId, message.parentId),
					eq(chatMessages.role, message.role)
				)
			);
	} else {
		await db
			.update(chatMessages)
			.set({ isActive: 0 })
			.where(
				and(
					eq(chatMessages.conversationId, conversationId),
					eq(chatMessages.userId, userId),
					eq(chatMessages.role, message.role),
					isNull(chatMessages.parentId)
				)
			);
	}

	// Activate this message and all its descendants
	await activateBranch(messageId, userId);

	return message;
}

/**
 * Recursively activate a branch and its descendants
 */
async function activateBranch(messageId: string, userId: string) {
	// Activate this message
	await db
		.update(chatMessages)
		.set({ isActive: 1 })
		.where(and(eq(chatMessages.id, messageId), eq(chatMessages.userId, userId)));

	// Find children and activate them
	const children = await db
		.select()
		.from(chatMessages)
		.where(eq(chatMessages.parentId, messageId))
		.orderBy(desc(chatMessages.createdAt));

	if (children.length > 0) {
		// Activate the previously active child, or most recent one
		const activeChild = children.find((c) => c.isActive === 1) || children[0];
		
		// Deactivate siblings first
		for (const child of children) {
			if (child.id !== activeChild.id) {
				await db
					.update(chatMessages)
					.set({ isActive: 0 })
					.where(eq(chatMessages.id, child.id));
			}
		}
		
		await activateBranch(activeChild.id, userId);
	}
}

/**
 * Get messages formatted for AI context
 */
export async function getMessagesForAI(conversationId: string, userId: string) {
	const messages = await getConversationMessages(conversationId, userId);
	if (!messages) return null;

	return messages.map((m) => ({
		role: m.role as 'user' | 'assistant',
		content: m.content
	}));
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(
	conversationId: string,
	userId: string,
	title: string
) {
	await db
		.update(chatConversations)
		.set({ title, updatedAt: new Date() })
		.where(and(eq(chatConversations.id, conversationId), eq(chatConversations.userId, userId)));
}

/**
 * Delete a conversation
 */
export async function deleteConversation(conversationId: string, userId: string) {
	const result = await db
		.delete(chatConversations)
		.where(and(eq(chatConversations.id, conversationId), eq(chatConversations.userId, userId)))
		.returning();

	return result.length > 0;
}

/**
 * Get the last message in active path
 */
export async function getLastActiveMessage(conversationId: string, userId: string) {
	const messages = await getConversationMessages(conversationId, userId);
	if (!messages || messages.length === 0) return null;
	return messages[messages.length - 1];
}

/**
 * Get parent message
 */
export async function getParentMessage(messageId: string, userId: string) {
	const [message] = await db
		.select()
		.from(chatMessages)
		.where(and(eq(chatMessages.id, messageId), eq(chatMessages.userId, userId)))
		.limit(1);

	if (!message || !message.parentId) return null;

	const [parent] = await db
		.select()
		.from(chatMessages)
		.where(eq(chatMessages.id, message.parentId))
		.limit(1);

	return parent || null;
}