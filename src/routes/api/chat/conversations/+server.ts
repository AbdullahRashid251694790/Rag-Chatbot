import { json, type RequestEvent } from '@sveltejs/kit';
import { getUserConversations } from '$lib/server/chat/index.js';

export const GET = async (event: RequestEvent) => {
	const session = event.locals.session;

	if (!session?.user?.id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const conversations = await getUserConversations(session.user.id);
		return json({ conversations });
	} catch (error) {
		console.error('Get conversations error:', error);
		return json({ error: 'Failed to fetch conversations' }, { status: 500 });
	}
};