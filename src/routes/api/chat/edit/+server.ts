/**
 * Edit Message API
 * ================
 * Creates a new branch when user edits a previous message.
 * The new message becomes a sibling of the original (same parent).
 */

import { type RequestEvent } from '@sveltejs/kit';
import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db/index.js';
import { chatMessages } from '$lib/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import {
	getConversation,
	saveMessageInBranch,
	saveMessage
} from '$lib/server/chat/index.js';
import {
	searchSimilarChunks,
	formatChunksAsContext,
	buildRAGPrompt,
	getChunkIdsJson,
	type RetrievedChunk
} from '$lib/server/retrieval/index.js';

const google = createGoogleGenerativeAI({
	apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY
});

export const POST = async (event: RequestEvent) => {
	const session = event.locals.session;

	if (!session?.user?.id) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
		const { conversationId, messageId, newContent } = await event.request.json();

		if (!conversationId || !messageId || !newContent?.trim()) {
			return new Response(
				JSON.stringify({ error: 'Conversation ID, message ID, and new content are required' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Verify conversation ownership
		const conversation = await getConversation(conversationId, session.user.id);
		if (!conversation) {
			return new Response(JSON.stringify({ error: 'Conversation not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Get the original message to find its parent
		const [originalMessage] = await db
			.select()
			.from(chatMessages)
			.where(and(eq(chatMessages.id, messageId), eq(chatMessages.userId, session.user.id)))
			.limit(1);

		if (!originalMessage) {
			return new Response(JSON.stringify({ error: 'Message not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// The edited message is a sibling of the original (same parent)
		const parentId = originalMessage.parentId;

		// Create the edited user message as a new branch (sibling to original)
		const editedMessage = await saveMessageInBranch(
			conversationId,
			session.user.id,
			'user',
			newContent.trim(),
			parentId
		);

		// Search for relevant context
		let retrievedChunks: RetrievedChunk[] = [];
		let contextPrompt = newContent.trim();

		try {
			retrievedChunks = await searchSimilarChunks(
				newContent.trim(),
				session.user.id,
				conversationId,
				{ limit: 5, minSimilarity: 0.3 }
			);

			if (retrievedChunks.length > 0) {
				const context = formatChunksAsContext(retrievedChunks);
				contextPrompt = buildRAGPrompt(newContent.trim(), context);
			}
		} catch (error) {
			console.error('Error searching for context:', error);
		}

		// System prompt
		const systemPrompt = `You are a helpful, friendly assistant. Be concise but thorough in your responses.

${retrievedChunks.length > 0 ? `The user has uploaded documents to this conversation. When answering questions, use the provided context from their documents and cite sources using [Source X] notation where X is the source number.` : ''}

You can use Markdown formatting for code blocks, lists, and emphasis when appropriate.`;

		// Generate AI response
		const result = streamText({
			model: google('gemini-2.5-flash'),
			system: systemPrompt,
			messages: [{ role: 'user', content: contextPrompt }]
		});

		// Stream the response
		const encoder = new TextEncoder();
		let fullResponse = '';

		const stream = new ReadableStream({
			async start(controller) {
				try {
					// Send initial data
					const initData = {
						editedMessageId: editedMessage.id,
						citations: retrievedChunks.map((chunk, index) => ({
							sourceIndex: index + 1,
							documentName: chunk.documentName
						}))
					};
					controller.enqueue(encoder.encode(`data: ${JSON.stringify(initData)}\n\n`));

					// Stream text chunks
					for await (const chunk of result.textStream) {
						fullResponse += chunk;
						controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
					}

					// Save AI response as CHILD of the edited user message
					const assistantMessage = await saveMessage(
						conversationId,
						session.user.id,
						'assistant',
						fullResponse,
						retrievedChunks.length > 0 ? getChunkIdsJson(retrievedChunks) : undefined,
						editedMessage.id // AI reply is child of the edited user message
					);

					// Send done signal
					controller.enqueue(
						encoder.encode(
							`data: ${JSON.stringify({ done: true, assistantMessageId: assistantMessage.id })}\n\n`
						)
					);
					controller.close();
				} catch (error) {
					console.error('Streaming error:', error);
					controller.enqueue(
						encoder.encode(`data: ${JSON.stringify({ error: 'Failed to generate response' })}\n\n`)
					);
					controller.close();
				}
			}
		});

		return new Response(stream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive'
			}
		});
	} catch (error) {
		console.error('Edit error:', error);
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};