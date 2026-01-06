import { json, type RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { users } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { createSession, setSessionCookie } from '$lib/server/session.js';

export const POST = async (event: RequestEvent) => {
	try {
		const { email, password } = await event.request.json();

		if (!email || !password) {
			return json({ error: 'Email and password are required' }, { status: 400 });
		}

		const user = await db.query.users.findFirst({
			where: eq(users.email, email)
		});

		if (!user || !user.password) {
			return json({ error: 'Invalid email or password' }, { status: 401 });
		}

		const isValidPassword = await bcrypt.compare(password, user.password);

		if (!isValidPassword) {
			return json({ error: 'Invalid email or password' }, { status: 401 });
		}

		// Check if user is disabled
		if (user.status === 'disabled') {
			return json({ error: 'Your account has been disabled. Please contact an administrator.' }, { status: 403 });
		}

		// Check if email is verified
		// if (!user.emailVerified) {
		// 	return json({
		// 		error: 'Please verify your email before signing in',
		// 		needsVerification: true,
		// 		email: user.email
		// 	}, { status: 403 });
		// }

		const sessionToken = await createSession(user.id);
		setSessionCookie(event, sessionToken);

		return json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
	} catch (error) {
		console.error('Login error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};