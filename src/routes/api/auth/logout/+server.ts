import { json, type RequestEvent } from '@sveltejs/kit';
import { deleteSession, getSessionToken, deleteSessionCookie } from '$lib/server/session.js';

export const POST = async (event: RequestEvent) => {
	try {
		const sessionToken = getSessionToken(event);
		
		if (sessionToken) {
			await deleteSession(sessionToken);
		}
		
		deleteSessionCookie(event);

		return json({ success: true });
	} catch (error) {
		console.error('Logout error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};