/**
 * Embedding Service
 * =================
 * This service communicates with the Python Embedding API
 * to generate vector embeddings for text.
 * 
 * Embeddings are numerical representations of text that capture
 * semantic meaning. Similar texts have similar embeddings.
 */

import { env } from '$env/dynamic/private';

// Get the embedding API URL from environment
const EMBEDDING_API_URL = env.EMBEDDING_API_URL || 'http://localhost:8000';

// Embedding dimension (must match the Python model)
export const EMBEDDING_DIMENSION = 384;

/**
 * Response from the embedding API for a single text
 */
interface EmbedResponse {
	embedding: number[];
	dimension: number;
}

/**
 * Response from the embedding API for batch texts
 */
interface EmbedBatchResponse {
	embeddings: number[][];
	dimension: number;
	count: number;
}

/**
 * Health check response from embedding API
 */
interface HealthResponse {
	status: string;
	model: string;
	dimension: number;
}

/**
 * Custom error for embedding service failures
 */
export class EmbeddingError extends Error {
	constructor(
		message: string,
		public statusCode?: number,
		public details?: string
	) {
		super(message);
		this.name = 'EmbeddingError';
	}
}

/**
 * Check if the embedding service is healthy
 * 
 * @returns Health status of the embedding service
 * @throws EmbeddingError if service is unavailable
 * 
 * @example
 * const health = await checkEmbeddingHealth();
 * console.log(health.status); // "healthy"
 */
export async function checkEmbeddingHealth(): Promise<HealthResponse> {
	try {
		const response = await fetch(`${EMBEDDING_API_URL}/health`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new EmbeddingError(
				'Embedding service health check failed',
				response.status
			);
		}

		return await response.json();
	} catch (error) {
		if (error instanceof EmbeddingError) {
			throw error;
		}
		throw new EmbeddingError(
			'Embedding service is unavailable',
			503,
			error instanceof Error ? error.message : 'Unknown error'
		);
	}
}

/**
 * Generate embedding for a single text
 * 
 * @param text - The text to embed
 * @returns Array of numbers representing the embedding vector
 * @throws EmbeddingError if generation fails
 * 
 * @example
 * const embedding = await generateEmbedding("Hello, world!");
 * console.log(embedding.length); // 384
 */
export async function generateEmbedding(text: string): Promise<number[]> {
	// Validate input
	if (!text || typeof text !== 'string') {
		throw new EmbeddingError('Text is required and must be a string');
	}

	const trimmedText = text.trim();
	if (trimmedText.length === 0) {
		throw new EmbeddingError('Text cannot be empty');
	}

	try {
		const response = await fetch(`${EMBEDDING_API_URL}/embed`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ text: trimmedText })
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new EmbeddingError(
				errorData.detail || 'Failed to generate embedding',
				response.status
			);
		}

		const data: EmbedResponse = await response.json();

		// Validate response
		if (!data.embedding || !Array.isArray(data.embedding)) {
			throw new EmbeddingError('Invalid response from embedding service');
		}

		if (data.embedding.length !== EMBEDDING_DIMENSION) {
			throw new EmbeddingError(
				`Unexpected embedding dimension: ${data.embedding.length}, expected ${EMBEDDING_DIMENSION}`
			);
		}

		return data.embedding;
	} catch (error) {
		if (error instanceof EmbeddingError) {
			throw error;
		}
		throw new EmbeddingError(
			'Failed to connect to embedding service',
			503,
			error instanceof Error ? error.message : 'Unknown error'
		);
	}
}

/**
 * Generate embeddings for multiple texts in a single request
 * More efficient than calling generateEmbedding multiple times
 * 
 * @param texts - Array of texts to embed (max 100)
 * @returns Array of embedding vectors
 * @throws EmbeddingError if generation fails
 * 
 * @example
 * const embeddings = await generateEmbeddingsBatch([
 *   "First chunk of text",
 *   "Second chunk of text"
 * ]);
 * console.log(embeddings.length); // 2
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
	// Validate input
	if (!texts || !Array.isArray(texts)) {
		throw new EmbeddingError('Texts must be an array');
	}

	if (texts.length === 0) {
		throw new EmbeddingError('Texts array cannot be empty');
	}

	if (texts.length > 100) {
		throw new EmbeddingError('Maximum 100 texts per batch');
	}

	// Filter and validate texts
	const validTexts = texts
		.map((t) => (typeof t === 'string' ? t.trim() : ''))
		.filter((t) => t.length > 0);

	if (validTexts.length === 0) {
		throw new EmbeddingError('All texts are empty');
	}

	try {
		const response = await fetch(`${EMBEDDING_API_URL}/embed/batch`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ texts: validTexts })
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new EmbeddingError(
				errorData.detail || 'Failed to generate embeddings batch',
				response.status
			);
		}

		const data: EmbedBatchResponse = await response.json();

		// Validate response
		if (!data.embeddings || !Array.isArray(data.embeddings)) {
			throw new EmbeddingError('Invalid response from embedding service');
		}

		// Validate each embedding dimension
		for (const embedding of data.embeddings) {
			if (embedding.length !== EMBEDDING_DIMENSION) {
				throw new EmbeddingError(
					`Unexpected embedding dimension: ${embedding.length}, expected ${EMBEDDING_DIMENSION}`
				);
			}
		}

		return data.embeddings;
	} catch (error) {
		if (error instanceof EmbeddingError) {
			throw error;
		}
		throw new EmbeddingError(
			'Failed to connect to embedding service',
			503,
			error instanceof Error ? error.message : 'Unknown error'
		);
	}
}

/**
 * Format embedding array for PostgreSQL vector type
 * Converts JavaScript array to PostgreSQL vector string format
 * 
 * @param embedding - Array of numbers
 * @returns String in format "[0.1,0.2,0.3,...]"
 * 
 * @example
 * const pgVector = formatForPgVector([0.1, 0.2, 0.3]);
 * console.log(pgVector); // "[0.1,0.2,0.3]"
 */
export function formatForPgVector(embedding: number[]): string {
	return `[${embedding.join(',')}]`;
}

/**
 * Parse PostgreSQL vector string to JavaScript array
 * 
 * @param pgVector - String in format "[0.1,0.2,0.3,...]"
 * @returns Array of numbers
 * 
 * @example
 * const array = parseFromPgVector("[0.1,0.2,0.3]");
 * console.log(array); // [0.1, 0.2, 0.3]
 */
export function parseFromPgVector(pgVector: string): number[] {
	// Remove brackets and split by comma
	const cleaned = pgVector.replace(/^\[|\]$/g, '');
	return cleaned.split(',').map(Number);
}

/**
 * Calculate cosine similarity between two embeddings
 * Returns a value between -1 and 1, where 1 means identical
 * 
 * @param embedding1 - First embedding vector
 * @param embedding2 - Second embedding vector
 * @returns Similarity score between -1 and 1
 * 
 * @example
 * const similarity = cosineSimilarity(embedding1, embedding2);
 * console.log(similarity); // 0.95 (very similar)
 */
export function cosineSimilarity(embedding1: number[], embedding2: number[]): number {
	if (embedding1.length !== embedding2.length) {
		throw new Error('Embeddings must have the same dimension');
	}

	let dotProduct = 0;
	let norm1 = 0;
	let norm2 = 0;

	for (let i = 0; i < embedding1.length; i++) {
		dotProduct += embedding1[i] * embedding2[i];
		norm1 += embedding1[i] * embedding1[i];
		norm2 += embedding2[i] * embedding2[i];
	}

	const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
	
	if (magnitude === 0) {
		return 0;
	}

	return dotProduct / magnitude;
}