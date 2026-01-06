/**
 * Chat API with RAG Support
 * =========================
 * Handles chat messages with optional file attachments.
 * Uses RAG (Retrieval-Augmented Generation) to provide context-aware responses.
 */

import { type RequestEvent } from '@sveltejs/kit';
import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { env } from '$env/dynamic/private';
import {
	createConversation,
	getConversation,
	saveMessage,
	getMessagesForAI,
	updateConversationTitle,
	getLastActiveMessage
} from '$lib/server/chat/index.js';
import {
	createDocument,
	processDocument,
	isSupportedMimeType,
	getFileExtensions,
	updateDocumentStatus
} from '$lib/server/documents/index.js';
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

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const POST = async (event: RequestEvent) => {
	const session = event.locals.session;

	if (!session?.user?.id) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
		// Parse form data (supports both JSON and FormData)
		let userMessage: string;
		let conversationId: string | null = null;
		let file: File | null = null;

		const contentType = event.request.headers.get('content-type') || '';

		if (contentType.includes('multipart/form-data')) {
			const formData = await event.request.formData();
			userMessage = (formData.get('message') as string) || '';
			conversationId = formData.get('conversationId') as string | null;
			file = formData.get('file') as File | null;
		} else {
			const body = await event.request.json();
			userMessage = body.message || '';
			conversationId = body.conversationId || null;
		}

		// Validate message
		if (!userMessage.trim() && !file) {
			return new Response(JSON.stringify({ error: 'Message or file is required' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Validate file if provided
		if (file) {
			if (file.size > MAX_FILE_SIZE) {
				return new Response(
					JSON.stringify({ error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` }),
					{ status: 400, headers: { 'Content-Type': 'application/json' } }
				);
			}

			if (!isSupportedMimeType(file.type)) {
				return new Response(
					JSON.stringify({
						error: `Unsupported file type. Supported: ${getFileExtensions()}`
					}),
					{ status: 400, headers: { 'Content-Type': 'application/json' } }
				);
			}
		}

		// Get or create conversation
		let isNewConversation = false;

		if (conversationId) {
			const existingConversation = await getConversation(conversationId, session.user.id);
			if (!existingConversation) {
				return new Response(JSON.stringify({ error: 'Conversation not found' }), {
					status: 404,
					headers: { 'Content-Type': 'application/json' }
				});
			}
		} else {
			const newConversation = await createConversation(session.user.id);
			conversationId = newConversation.id;
			isNewConversation = true;
		}

		// Process file SYNCHRONOUSLY if provided (wait for it to complete)
		let documentInfo: { id: string; name: string; status: string } | null = null;

		if (file) {
			const filename = `${crypto.randomUUID()}-${file.name}`;
			const document = await createDocument(
				session.user.id,
				conversationId,
				filename,
				file.name,
				file.type,
				file.size
			);

			documentInfo = {
				id: document.id,
				name: file.name,
				status: 'processing'
			};

			// Read file content
			const textContent = await file.text();

			// Process document SYNCHRONOUSLY - wait for completion before continuing
			try {
				await processDocument(document.id, session.user.id, textContent);
				documentInfo.status = 'ready';
			} catch (error) {
				console.error(`Failed to process document ${document.id}:`, error);
				documentInfo.status = 'error';
			}
		}

		// Get the last message to use as parent for proper tree structure
		const lastMessage = await getLastActiveMessage(conversationId, session.user.id);
		const parentId = lastMessage?.id || null;

		// Save user message with parent reference
const savedUserMessage = await saveMessage(
	conversationId,
	session.user.id,
	'user',
	userMessage || '', // Empty content is fine, document UI will show the file
	undefined,
	parentId
);

		// Search for relevant context from conversation documents
		// Now the uploaded file has been processed, so we can search it
		let retrievedChunks: RetrievedChunk[] = [];
		let contextPrompt = userMessage;

		if (userMessage.trim()) {
			try {
				retrievedChunks = await searchSimilarChunks(
					userMessage,
					session.user.id,
					conversationId,
					{ limit: 5, minSimilarity: 0.3 }
				);

				if (retrievedChunks.length > 0) {
					const context = formatChunksAsContext(retrievedChunks);
					contextPrompt = buildRAGPrompt(userMessage, context);
				}
			} catch (error) {
				console.error('Error searching for context:', error);
			}
		}

		// Get conversation history for AI context
		const conversationHistory = await getMessagesForAI(conversationId, session.user.id);

		// Build messages array for AI
		const messages = [
			...(conversationHistory || []).slice(0, -1),
			{ role: 'user' as const, content: contextPrompt }
		];

		// System prompt
		const systemPrompt = `You are a helpful, friendly assistant. Be concise but thorough in your responses.

${retrievedChunks.length > 0 ? `The user has uploaded documents to this conversation. When answering questions, use the provided context from their documents and cite sources using [Source X] notation where X is the source number.

If the context doesn't contain relevant information for the question, you can use your general knowledge but mention that the information wasn't found in their documents.` : file ? `The user just uploaded a file named "${file.name}". Acknowledge that you've received and processed the document, then answer their question based on its content.` : 'Remember the context of the conversation.'}

You can use Markdown formatting for code blocks, lists, and emphasis when appropriate.`;

		// Stream the response
		const result = streamText({
			model: google('gemini-2.5-flash'),
			system: systemPrompt,
			messages
		});

		// Create streaming response
		const encoder = new TextEncoder();
		let fullResponse = '';

		const stream = new ReadableStream({
			async start(controller) {
				try {
					// Send initial data
					const initData = {
						conversationId,
						isNewConversation,
						document: documentInfo,
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

					// Save assistant message with user message as parent
					await saveMessage(
						conversationId!,
						session.user.id,
						'assistant',
						fullResponse,
						retrievedChunks.length > 0 ? getChunkIdsJson(retrievedChunks) : undefined,
						savedUserMessage.id
					);

					// Generate title for new conversations
					if (isNewConversation && userMessage.trim()) {
						try {
							const titleResult = await streamText({
								model: google('gemini-2.5-flash'),
								messages: [
									{
										role: 'user',
										content: `Generate a short title (max 5 words) for a conversation that starts with this message: "${userMessage.slice(0, 100)}". Reply with just the title, no quotes or punctuation.`
									}
								]
							});

							let title = '';
							for await (const chunk of titleResult.textStream) {
								title += chunk;
							}
							title = title.trim().slice(0, 50);

							if (title) {
								await updateConversationTitle(conversationId!, session.user.id, title);
								controller.enqueue(encoder.encode(`data: ${JSON.stringify({ title })}\n\n`));
							}
						} catch (titleError) {
							console.error('Error generating title:', titleError);
						}
					}

					// Send done signal
					controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
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
		console.error('Chat error:', error);
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};