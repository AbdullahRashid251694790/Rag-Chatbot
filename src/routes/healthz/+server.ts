import { json, type RequestEvent } from '@sveltejs/kit';
import { checkEmbeddingHealth } from '$lib/server/embeddings/index.js';

export const GET = async (event: RequestEvent) => {
	const health = {
		status: 'healthy',
		timestamp: new Date().toISOString(),
		services: {
			app: 'healthy',
			database: 'unknown',
			embeddings: 'unknown'
		}
	};

	// Check database connection
	try {
		const { db } = await import('$lib/server/db/index.js');
		const { sql } = await import('drizzle-orm');
		await db.execute(sql`SELECT 1`);
		health.services.database = 'healthy';
	} catch (error) {
		health.services.database = 'unhealthy';
		health.status = 'degraded';
	}

	// Check embedding service
	try {
		const embeddingHealth = await checkEmbeddingHealth();
		health.services.embeddings = embeddingHealth.status;
	} catch (error) {
		health.services.embeddings = 'unhealthy';
		health.status = 'degraded';
	}

	const statusCode = health.status === 'healthy' ? 200 : 503;
	return json(health, { status: statusCode });
};