/**
 * Document Service (Chat-Based)
 * =============================
 * Handles document upload, parsing, chunking, and embedding storage
 * for documents attached directly to chat conversations.
 */

import { db } from '../db/index.js';
import { documents, documentChunks } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { generateEmbeddingsBatch } from '../embeddings/index.js';

/**
 * Configuration for text chunking
 */
export interface ChunkingConfig {
	maxChunkSize?: number;
	chunkOverlap?: number;
	minChunkSize?: number;
}

const DEFAULT_CHUNKING_CONFIG: Required<ChunkingConfig> = {
	maxChunkSize: 1000,
	chunkOverlap: 200,
	minChunkSize: 100
};

/**
 * Create a new document record linked to a conversation
 */
export async function createDocument(
	userId: string,
	conversationId: string,
	filename: string,
	originalName: string,
	mimeType: string,
	fileSize: number
) {
	const [doc] = await db
		.insert(documents)
		.values({
			userId,
			conversationId,
			filename,
			originalName,
			mimeType,
			fileSize,
			status: 'processing'
		})
		.returning();

	return doc;
}

/**
 * Update document status
 */
export async function updateDocumentStatus(
	documentId: string,
	status: 'processing' | 'ready' | 'error',
	errorMessage?: string,
	chunkCount?: number
) {
	await db
		.update(documents)
		.set({
			status,
			errorMessage: errorMessage || null,
			chunkCount: chunkCount ?? undefined,
			updatedAt: new Date()
		})
		.where(eq(documents.id, documentId));
}

/**
 * Get all documents for a conversation
 */
export async function getConversationDocuments(conversationId: string, userId: string) {
	return await db
		.select()
		.from(documents)
		.where(and(eq(documents.conversationId, conversationId), eq(documents.userId, userId)))
		.orderBy(desc(documents.createdAt));
}

/**
 * Get a single document by ID
 */
export async function getDocument(documentId: string, userId: string) {
	const [doc] = await db
		.select()
		.from(documents)
		.where(and(eq(documents.id, documentId), eq(documents.userId, userId)))
		.limit(1);

	return doc || null;
}

/**
 * Delete a document and all its chunks
 */
export async function deleteDocument(documentId: string, userId: string) {
	const result = await db
		.delete(documents)
		.where(and(eq(documents.id, documentId), eq(documents.userId, userId)))
		.returning();

	return result.length > 0;
}

/**
 * Split text into overlapping chunks
 */
export function chunkText(text: string, config: ChunkingConfig = {}): string[] {
	const { maxChunkSize, chunkOverlap, minChunkSize } = {
		...DEFAULT_CHUNKING_CONFIG,
		...config
	};

	const normalizedText = text.replace(/\r\n/g, '\n').trim();

	if (normalizedText.length <= maxChunkSize) {
		return [normalizedText];
	}

	const chunks: string[] = [];
	let currentPosition = 0;

	while (currentPosition < normalizedText.length) {
		let endPosition = Math.min(currentPosition + maxChunkSize, normalizedText.length);

		if (endPosition < normalizedText.length) {
			let breakPoint = normalizedText.lastIndexOf('\n\n', endPosition);

			if (breakPoint <= currentPosition) {
				const sentenceBreaks = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];
				for (const sep of sentenceBreaks) {
					const pos = normalizedText.lastIndexOf(sep, endPosition);
					if (pos > currentPosition && pos > breakPoint) {
						breakPoint = pos + sep.length - 1;
					}
				}
			}

			if (breakPoint <= currentPosition) {
				breakPoint = normalizedText.lastIndexOf(' ', endPosition);
			}

			if (breakPoint > currentPosition) {
				endPosition = breakPoint;
			}
		}

		const chunk = normalizedText.slice(currentPosition, endPosition).trim();

		if (chunk.length >= minChunkSize) {
			chunks.push(chunk);
		}

		const nextPosition = endPosition - chunkOverlap;

		if (nextPosition <= currentPosition) {
			currentPosition = endPosition;
		} else {
			currentPosition = nextPosition;
		}
	}

	return chunks;
}

/**
 * Process a document: chunk text and generate embeddings
 */
export async function processDocument(
	documentId: string,
	userId: string,
	textContent: string,
	config: ChunkingConfig = {}
): Promise<void> {
	try {
		const chunks = chunkText(textContent, config);

		if (chunks.length === 0) {
			await updateDocumentStatus(documentId, 'error', 'No valid text content found');
			return;
		}

		const BATCH_SIZE = 50;
		const allChunkData: Array<{
			content: string;
			chunkIndex: number;
			embedding: number[];
		}> = [];

		for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
			const batch = chunks.slice(i, i + BATCH_SIZE);
			const embeddings = await generateEmbeddingsBatch(batch);

			for (let j = 0; j < batch.length; j++) {
				allChunkData.push({
					content: batch[j],
					chunkIndex: i + j,
					embedding: embeddings[j]
				});
			}
		}

		const chunkRecords = allChunkData.map((chunk) => ({
			documentId,
			userId,
			content: chunk.content,
			chunkIndex: chunk.chunkIndex,
			charCount: chunk.content.length,
			tokenCount: Math.ceil(chunk.content.length / 4),
			embedding: chunk.embedding
		}));

		const INSERT_BATCH_SIZE = 100;
		for (let i = 0; i < chunkRecords.length; i += INSERT_BATCH_SIZE) {
			const batch = chunkRecords.slice(i, i + INSERT_BATCH_SIZE);
			await db.insert(documentChunks).values(batch);
		}

		await updateDocumentStatus(documentId, 'ready', undefined, chunks.length);
	} catch (error) {
		console.error('Document processing error:', error);
		await updateDocumentStatus(
			documentId,
			'error',
			error instanceof Error ? error.message : 'Unknown error during processing'
		);
		throw error;
	}
}

/**
 * Get supported MIME types for upload
 */
export function getSupportedMimeTypes(): string[] {
	return ['text/plain', 'text/markdown', 'text/csv', 'application/json'];
}

/**
 * Check if a MIME type is supported
 */
export function isSupportedMimeType(mimeType: string): boolean {
	return getSupportedMimeTypes().includes(mimeType);
}

/**
 * Get file extension display
 */
export function getFileExtensions(): string {
	return '.txt, .md, .csv, .json';
}