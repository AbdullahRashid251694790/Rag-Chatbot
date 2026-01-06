import { json, type RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { users, passwordResetTokens } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const POST = async ({ request }: RequestEvent) => {
	try {
		const { token, password } = await request.json();

		if (!token || !password) {
			return json({ error: 'Token and password are required' }, { status: 400 });
		}

		if (password.length < 8) {
			return json({ error: 'Password must be at least 8 characters' }, { status: 400 });
		}

		// Find the reset token
		const resetToken = await db.query.passwordResetTokens.findFirst({
			where: eq(passwordResetTokens.token, token)
		});

		if (!resetToken) {
			return json({ error: 'Invalid or expired reset link' }, { status: 400 });
		}

		// Check if token is expired
		if (resetToken.expires < new Date()) {
			await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
			return json({ error: 'Reset link has expired' }, { status: 400 });
		}

		// Hash new password
		const hashedPassword = await bcrypt.hash(password, 12);

		// Update user's password
		await db
			.update(users)
			.set({ 
				password: hashedPassword,
				updatedAt: new Date()
			})
			.where(eq(users.id, resetToken.userId));

		// Delete the used token
		await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));

		return json({ success: true, message: 'Password reset successfully' });
	} catch (error) {
		console.error('Reset password error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};