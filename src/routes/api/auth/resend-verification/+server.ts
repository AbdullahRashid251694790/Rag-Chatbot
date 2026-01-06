import { json, type RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { users, verificationTokens } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { sendVerificationEmail } from '$lib/server/email.js';

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

		if (!user) {
			// Don't reveal if user exists
			return json({ success: true, message: 'If an account exists, a verification email has been sent' });
		}

		if (user.emailVerified) {
			return json({ error: 'Email is already verified' }, { status: 400 });
		}

		// Delete any existing verification tokens for this email
		await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email));

		// Create new verification token
		const token = crypto.randomUUID();
		const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

		await db.insert(verificationTokens).values({
			identifier: email,
			token,
			expires
		});

		// Send verification email
		await sendVerificationEmail(email, token);

		return json({ success: true, message: 'Verification email sent' });
	} catch (error) {
		console.error('Resend verification error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};