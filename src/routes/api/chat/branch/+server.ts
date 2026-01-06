/**
 * Branch Navigation API
 * =====================
 * Handles switching between conversation branches.
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import {
	switchBranch,
	getMessageBranchInfo,
	getConversationMessages
} from '$lib/server/chat/index.js';

/**
 * POST /api/chat/branch
 * Switch to a different branch
 */
export const POST = async (event: RequestEvent) => {
	const session = event.locals.session;

	if (!session?.user?.id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { messageId, conversationId } = await event.request.json();

		if (!messageId || !conversationId) {
			return json({ error: 'Message ID and Conversation ID are required' }, { status: 400 });
		}

		// Switch to the branch
		const message = await switchBranch(messageId, session.user.id);

		if (!message) {
			return json({ error: 'Message not found' }, { status: 404 });
		}

		// Get updated messages for the conversation (with branch info)
		const messages = await getConversationMessages(conversationId, session.user.id);

		return json({
			success: true,
			messages: messages || []
		});
	} catch (error) {
		console.error('Branch switch error:', error);
		return json({ error: 'Failed to switch branch' }, { status: 500 });
	}
};

/**
 * GET /api/chat/branch?messageId=xxx
 * Get branch info for a message
 */
export const GET = async (event: RequestEvent) => {
	const session = event.locals.session;

	if (!session?.user?.id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const messageId = event.url.searchParams.get('messageId');

		if (!messageId) {
			return json({ error: 'Message ID is required' }, { status: 400 });
		}

		const branchInfo = await getMessageBranchInfo(messageId, session.user.id);

		if (!branchInfo) {
			return json({ error: 'Message not found' }, { status: 404 });
		}

		return json({ branchInfo });
	} catch (error) {
		console.error('Branch info error:', error);
		return json({ error: 'Failed to get branch info' }, { status: 500 });
	}
};