import { json, type RequestEvent } from '@sveltejs/kit';
import {
	getConversation,
	getConversationMessages,
	deleteConversation,
	updateConversationTitle
} from '$lib/server/chat/index.js';

export const GET = async (event: RequestEvent) => {
	const session = event.locals.session;

	if (!session?.user?.id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const conversationId = event.params.id;

	if (!conversationId) {
		return json({ error: 'Conversation ID is required' }, { status: 400 });
	}

	try {
		const conversation = await getConversation(conversationId, session.user.id);

		if (!conversation) {
			return json({ error: 'Conversation not found' }, { status: 404 });
		}

		const messages = await getConversationMessages(conversationId, session.user.id);

		return json({
			conversation,
			messages: messages || []
		});
	} catch (error) {
		console.error('Error fetching conversation:', error);
		return json({ error: 'Failed to fetch conversation' }, { status: 500 });
	}
};

export const PATCH = async (event: RequestEvent) => {
	const session = event.locals.session;

	if (!session?.user?.id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const conversationId = event.params.id;

	if (!conversationId) {
		return json({ error: 'Conversation ID is required' }, { status: 400 });
	}

	try {
		const { title } = await event.request.json();

		if (!title?.trim()) {
			return json({ error: 'Title is required' }, { status: 400 });
		}

		// Verify conversation exists and belongs to user
		const conversation = await getConversation(conversationId, session.user.id);
		if (!conversation) {
			return json({ error: 'Conversation not found' }, { status: 404 });
		}

		// Update the title
		await updateConversationTitle(conversationId, session.user.id, title.trim());

		return json({ success: true, title: title.trim() });
	} catch (error) {
		console.error('Error renaming conversation:', error);
		return json({ error: 'Failed to rename conversation' }, { status: 500 });
	}
};

export const DELETE = async (event: RequestEvent) => {
	const session = event.locals.session;

	if (!session?.user?.id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const conversationId = event.params.id;

	if (!conversationId) {
		return json({ error: 'Conversation ID is required' }, { status: 400 });
	}

	try {
		const deleted = await deleteConversation(conversationId, session.user.id);

		if (!deleted) {
			return json({ error: 'Conversation not found' }, { status: 404 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting conversation:', error);
		return json({ error: 'Failed to delete conversation' }, { status: 500 });
	}
};