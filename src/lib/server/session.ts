import { db } from './db/index.js';
import { sessions, users } from './db/schema.js';
import { eq } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';

export async function createSession(userId: string): Promise<string> {
	const sessionToken = crypto.randomUUID();
	const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

	await db.insert(sessions).values({
		sessionToken,
		userId,
		expires
	});

	return sessionToken;
}

export async function getSession(sessionToken: string) {
	const session = await db.query.sessions.findFirst({
		where: eq(sessions.sessionToken, sessionToken)
	});

	if (!session || session.expires < new Date()) {
		if (session) {
			await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
		}
		return null;
	}

	const user = await db.query.users.findFirst({
		where: eq(users.id, session.userId)
	});

	if (!user) return null;

	// Check if user is disabled
	if (user.status === 'disabled') {
		await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
		return null;
	}

	return { session, user };
}

export async function deleteSession(sessionToken: string) {
	await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
}

export function getSessionToken(event: RequestEvent): string | undefined {
	return event.cookies.get('session_token');
}

export function setSessionCookie(event: RequestEvent, sessionToken: string) {
	event.cookies.set('session_token', sessionToken, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: 30 * 24 * 60 * 60 // 30 days
	});
}

export function deleteSessionCookie(event: RequestEvent) {
	event.cookies.delete('session_token', { path: '/' });
}