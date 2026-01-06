import { json, type RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { users, verificationTokens } from '$lib/server/db/schema.js';
import { eq, and } from 'drizzle-orm';

export const POST = async ({ request }: RequestEvent) => {
	try {
		const { token } = await request.json();

		if (!token) {
			return json({ error: 'Token is required' }, { status: 400 });
		}

		// Find the verification token
		const verificationToken = await db.query.verificationTokens.findFirst({
			where: eq(verificationTokens.token, token)
		});

		if (!verificationToken) {
			return json({ error: 'Invalid or expired verification link' }, { status: 400 });
		}

		// Check if token is expired
		if (verificationToken.expires < new Date()) {
			// Delete expired token
			await db.delete(verificationTokens).where(
				and(
					eq(verificationTokens.identifier, verificationToken.identifier),
					eq(verificationTokens.token, token)
				)
			);
			return json({ error: 'Verification link has expired' }, { status: 400 });
		}

		// Update user's emailVerified field
		await db
			.update(users)
			.set({ emailVerified: new Date() })
			.where(eq(users.email, verificationToken.identifier));

		// Delete the used token
		await db.delete(verificationTokens).where(
			and(
				eq(verificationTokens.identifier, verificationToken.identifier),
				eq(verificationTokens.token, token)
			)
		);

		return json({ success: true, message: 'Email verified successfully' });
	} catch (error) {
		console.error('Email verification error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};