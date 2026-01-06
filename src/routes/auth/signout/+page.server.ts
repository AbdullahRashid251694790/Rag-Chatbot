import { redirect, type RequestEvent } from '@sveltejs/kit';
import { deleteSession, getSessionToken, deleteSessionCookie } from '$lib/server/session.js';

export const actions = {
	default: async (event: RequestEvent) => {
		const sessionToken = getSessionToken(event);
		
		if (sessionToken) {
			await deleteSession(sessionToken);
		}
		
		deleteSessionCookie(event);
		throw redirect(303, '/');
	}
};