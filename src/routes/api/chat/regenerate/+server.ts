/**
 * Regenerate API
 * ==============
 * Regenerates the last AI response in a conversation.
 * Creates a new AI response as a sibling to the old one (same parent).
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
	saveMessageInBranch
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
		const { conversationId, messageId } = await event.request.json();

		if (!conversationId) {
			return new Response(JSON.stringify({ error: 'Conversation ID is required' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Verify conversation ownership
		const conversation = await getConversation(conversationId, session.user.id);
		if (!conversation) {
			return new Response(JSON.stringify({ error: 'Conversation not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Get the AI message being regenerated
		const [aiMessage] = await db
			.select()
			.from(chatMessages)
			.where(
				and(
					eq(chatMessages.id, messageId),
					eq(chatMessages.userId, session.user.id),
					eq(chatMessages.role, 'assistant')
				)
			)
			.limit(1);

		if (!aiMessage) {
			return new Response(JSON.stringify({ error: 'AI message not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// The parent of the AI message is the user message
		const userMessageId = aiMessage.parentId;

		if (!userMessageId) {
			return new Response(JSON.stringify({ error: 'Parent user message not found' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Get the user message content
		const [userMessage] = await db
			.select()
			.from(chatMessages)
			.where(eq(chatMessages.id, userMessageId))
			.limit(1);

		if (!userMessage) {
			return new Response(JSON.stringify({ error: 'User message not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Search for relevant context
		let retrievedChunks: RetrievedChunk[] = [];
		let contextPrompt = userMessage.content;

		try {
			retrievedChunks = await searchSimilarChunks(
				userMessage.content,
				session.user.id,
				conversationId,
				{ limit: 5, minSimilarity: 0.3 }
			);

			if (retrievedChunks.length > 0) {
				const context = formatChunksAsContext(retrievedChunks);
				contextPrompt = buildRAGPrompt(userMessage.content, context);
			}
		} catch (error) {
			console.error('Error searching for context:', error);
		}

		// System prompt
		const systemPrompt = `You are a helpful, friendly assistant. Be concise but thorough in your responses.

${retrievedChunks.length > 0 ? `The user has uploaded documents to this conversation. When answering questions, use the provided context from their documents and cite sources using [Source X] notation where X is the source number.

If the context doesn't contain relevant information for the question, you can use your general knowledge but mention that the information wasn't found in their documents.` : 'Remember the context of the conversation.'}

You can use Markdown formatting for code blocks, lists, and emphasis when appropriate.`;

		// Stream the response
		const result = streamText({
			model: google('gemini-2.5-flash'),
			system: systemPrompt,
			messages: [{ role: 'user', content: contextPrompt }]
		});

		// Create streaming response
		const encoder = new TextEncoder();
		let fullResponse = '';

		const stream = new ReadableStream({
			async start(controller) {
				try {
					// Send initial data
					const initData = {
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

					// Save new AI message as sibling to the old one (same parent: user message)
					const newAiMessage = await saveMessageInBranch(
						conversationId,
						session.user.id,
						'assistant',
						fullResponse,
						userMessageId, // Parent is the user message
						retrievedChunks.length > 0 ? getChunkIdsJson(retrievedChunks) : undefined
					);

					// Send done signal with new message ID
					controller.enqueue(
						encoder.encode(
							`data: ${JSON.stringify({ done: true, messageId: newAiMessage.id })}\n\n`
						)
					);
					controller.close();
				} catch (error) {
					console.error('Streaming error:', error);
					controller.enqueue(
						encoder.encode(`data: ${JSON.stringify({ error: 'Failed to regenerate response' })}\n\n`)
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
		console.error('Regenerate error:', error);
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};