/**
 * Retrieval Service (Conversation-Scoped)
 * =======================================
 * Searches for similar document chunks within a conversation's documents.
 */

import { db } from '../db/index.js';
import { documentChunks, documents } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { generateEmbedding, formatForPgVector } from '../embeddings/index.js';

/**
 * A retrieved chunk with relevance score
 */
export interface RetrievedChunk {
	id: string;
	documentId: string;
	documentName: string;
	content: string;
	chunkIndex: number;
	similarity: number;
}

/**
 * Options for retrieval
 */
export interface RetrievalOptions {
	limit?: number;
	minSimilarity?: number;
}

/**
 * Search for document chunks similar to the query within a conversation
 */
export async function searchSimilarChunks(
	query: string,
	userId: string,
	conversationId: string,
	options: RetrievalOptions = {}
): Promise<RetrievedChunk[]> {
	const { limit = 5, minSimilarity = 0.3 } = options;

	// Check if conversation has any documents
	const conversationDocs = await db
		.select({ id: documents.id })
		.from(documents)
		.where(
			and(
				eq(documents.conversationId, conversationId),
				eq(documents.userId, userId),
				eq(documents.status, 'ready')
			)
		)
		.limit(1);

	if (conversationDocs.length === 0) {
		return [];
	}

	// Generate embedding for the query
	const queryEmbedding = await generateEmbedding(query);
	const queryVector = formatForPgVector(queryEmbedding);

	// Search for similar chunks in this conversation's documents
	const results = await db
		.select({
			id: documentChunks.id,
			documentId: documentChunks.documentId,
			documentName: documents.originalName,
			content: documentChunks.content,
			chunkIndex: documentChunks.chunkIndex,
			similarity: sql<number>`1 - (${documentChunks.embedding} <=> ${queryVector}::vector)`
		})
		.from(documentChunks)
		.innerJoin(documents, eq(documentChunks.documentId, documents.id))
		.where(
			and(
				eq(documents.conversationId, conversationId),
				eq(documentChunks.userId, userId),
				eq(documents.status, 'ready')
			)
		)
		.orderBy(sql`${documentChunks.embedding} <=> ${queryVector}::vector`)
		.limit(limit);

	return results
		.filter((r) => r.similarity >= minSimilarity)
		.map((r) => ({
			id: r.id,
			documentId: r.documentId,
			documentName: r.documentName,
			content: r.content,
			chunkIndex: r.chunkIndex,
			similarity: r.similarity
		}));
}

/**
 * Format retrieved chunks into context for the AI
 */
export function formatChunksAsContext(chunks: RetrievedChunk[]): string {
	if (chunks.length === 0) {
		return '';
	}

	return chunks
		.map((chunk, index) => {
			const sourceLabel = `[Source ${index + 1}: ${chunk.documentName}]`;
			return `${sourceLabel}\n${chunk.content}`;
		})
		.join('\n\n');
}

/**
 * Build a RAG-enhanced prompt with context
 */
export function buildRAGPrompt(userMessage: string, context: string): string {
	if (!context) {
		return userMessage;
	}

	return `I have attached some documents to this conversation. Use the following context from my documents to help answer my question. If the context doesn't contain relevant information, you can use your general knowledge but mention that.

CONTEXT FROM MY DOCUMENTS:
${context}

MY QUESTION:
${userMessage}

Please provide a helpful answer. When using information from the documents, cite the source using [Source X] notation.`;
}

/**
 * Get the IDs of chunks used for storage
 */
export function getChunkIdsJson(chunks: RetrievedChunk[]): string {
	return JSON.stringify(chunks.map((c) => c.id));
}