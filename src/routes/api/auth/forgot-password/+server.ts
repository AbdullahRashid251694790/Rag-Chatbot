import { json, type RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { users, passwordResetTokens } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { sendPasswordResetEmail } from '$lib/server/email.js';

export const POST = async ({ request }: RequestEvent) => {
	try {
		const { email } = await request.json();

		if (!email) {
			return json({ error: 'Email is required' }, { status: 400 });
		}

		// Find user
		const user = await db.query.users.findFirst({
			where: eq(users.email, email)
		});

		// Always return success to prevent email enumeration
		if (!user) {
			return json({ success: true, message: 'If an account exists, a password reset email has been sent' });
		}

		// Delete any existing reset tokens for this user
		await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));

		// Create new reset token
		const token = crypto.randomUUID();
		const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

		await db.insert(passwordResetTokens).values({
			userId: user.id,
			token,
			expires
		});

		// Send reset email
		await sendPasswordResetEmail(email, token);

		return json({ success: true, message: 'If an account exists, a password reset email has been sent' });
	} catch (error) {
		console.error('Forgot password error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};