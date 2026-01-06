import { redirect } from '@sveltejs/kit';
import { google } from '$lib/server/oauth.js';
import { db } from '$lib/server/db/index.js';
import { users, accounts } from '$lib/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { createSession, setSessionCookie } from '$lib/server/session.js';
import type { RequestEvent } from '@sveltejs/kit';

interface GoogleUser {
	sub: string;
	name: string;
	email: string;
	picture: string;
	email_verified: boolean;
}

export const GET = async (event: RequestEvent) => {
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');
	const storedState = event.cookies.get('google_oauth_state');
	const codeVerifier = event.cookies.get('google_code_verifier');

	if (!code || !state || !storedState || state !== storedState || !codeVerifier) {
		throw redirect(302, '/auth/signin?error=invalid_state');
	}

	try {
		const tokens = await google.validateAuthorizationCode(code, codeVerifier);
		const accessToken = tokens.accessToken();

		// Get user info from Google
		const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		});

		const googleUser: GoogleUser = await response.json();

		// Check if account already exists
		const existingAccount = await db.query.accounts.findFirst({
			where: and(
				eq(accounts.provider, 'google'),
				eq(accounts.providerAccountId, googleUser.sub)
			)
		});

		let userId: string;

		if (existingAccount) {
			// User already has Google account linked
			userId = existingAccount.userId;
		} else {
			// Check if user with this email exists
			const existingUser = await db.query.users.findFirst({
				where: eq(users.email, googleUser.email)
			});

			if (existingUser) {
				// Link Google account to existing user
				userId = existingUser.id;
				
				await db.insert(accounts).values({
					userId: existingUser.id,
					type: 'oauth',
					provider: 'google',
					providerAccountId: googleUser.sub,
					access_token: accessToken
				});

				// Update emailVerified if not already verified
				if (!existingUser.emailVerified && googleUser.email_verified) {
					await db.update(users)
						.set({ emailVerified: new Date() })
						.where(eq(users.id, existingUser.id));
				}
			} else {
				// Create new user
				const [newUser] = await db.insert(users).values({
					email: googleUser.email,
					name: googleUser.name,
					image: googleUser.picture,
					emailVerified: googleUser.email_verified ? new Date() : null
				}).returning();

				userId = newUser.id;

				// Create account link
				await db.insert(accounts).values({
					userId: newUser.id,
					type: 'oauth',
					provider: 'google',
					providerAccountId: googleUser.sub,
					access_token: accessToken
				});
			}
		}

		// Create session
		const sessionToken = await createSession(userId);
		setSessionCookie(event, sessionToken);

		// Clean up OAuth cookies
		event.cookies.delete('google_oauth_state', { path: '/' });
		event.cookies.delete('google_code_verifier', { path: '/' });

		throw redirect(302, '/dashboard');
	} catch (error) {
		console.error('Google OAuth error:', error);
		throw redirect(302, '/auth/signin?error=oauth_error');
	}
};