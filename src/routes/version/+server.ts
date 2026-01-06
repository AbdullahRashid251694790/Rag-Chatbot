import { json, type RequestEvent } from '@sveltejs/kit';

export const GET = async (event: RequestEvent) => {
	return json({
		version: '3.0.0',
		name: 'AuthApp with RAG',
		features: [
			'Authentication (Email/Password)',
			'OAuth (Google, GitHub)',
			'Admin Dashboard',
			'AI Chat with Gemini',
			'RAG with pgvector',
			'Document Ingestion',
			'Streaming Responses',
			'Tree-Structured Chat History'
		],
		environment: process.env.NODE_ENV || 'development'
	});
};