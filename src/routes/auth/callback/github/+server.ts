import { redirect } from '@sveltejs/kit';
import { github } from '$lib/server/oauth.js';
import { db } from '$lib/server/db/index.js';
import { users, accounts } from '$lib/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { createSession, setSessionCookie } from '$lib/server/session.js';
import type { RequestEvent } from '@sveltejs/kit';

interface GitHubUser {
	id: number;
	login: string;
	name: string | null;
	email: string | null;
	avatar_url: string;
}

interface GitHubEmail {
	email: string;
	primary: boolean;
	verified: boolean;
}

export const GET = async (event: RequestEvent) => {
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');
	const storedState = event.cookies.get('github_oauth_state');

	if (!code || !state || !storedState || state !== storedState) {
		throw redirect(302, '/auth/signin?error=invalid_state');
	}

	try {
		const tokens = await github.validateAuthorizationCode(code);
		const accessToken = tokens.accessToken();

		// Get user info from GitHub
		const userResponse = await fetch('https://api.github.com/user', {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'User-Agent': 'AuthApp'
			}
		});

		const githubUser: GitHubUser = await userResponse.json();

		// Get user's email (might be private)
		let email = githubUser.email;
		let emailVerified = false;

		if (!email) {
			const emailResponse = await fetch('https://api.github.com/user/emails', {
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'User-Agent': 'AuthApp'
				}
			});

			const emails: GitHubEmail[] = await emailResponse.json();
			const primaryEmail = emails.find((e) => e.primary && e.verified);
			
			if (primaryEmail) {
				email = primaryEmail.email;
				emailVerified = primaryEmail.verified;
			}
		}

		if (!email) {
			throw redirect(302, '/auth/signin?error=no_email');
		}

		// Check if account already exists
		const existingAccount = await db.query.accounts.findFirst({
			where: and(
				eq(accounts.provider, 'github'),
				eq(accounts.providerAccountId, String(githubUser.id))
			)
		});

		let userId: string;

		if (existingAccount) {
			// User already has GitHub account linked
			userId = existingAccount.userId;
		} else {
			// Check if user with this email exists
			const existingUser = await db.query.users.findFirst({
				where: eq(users.email, email)
			});

			if (existingUser) {
				// Link GitHub account to existing user
				userId = existingUser.id;
				
				await db.insert(accounts).values({
					userId: existingUser.id,
					type: 'oauth',
					provider: 'github',
					providerAccountId: String(githubUser.id),
					access_token: accessToken
				});

				// Update emailVerified if not already verified
				if (!existingUser.emailVerified && emailVerified) {
					await db.update(users)
						.set({ emailVerified: new Date() })
						.where(eq(users.id, existingUser.id));
				}
			} else {
				// Create new user
				const [newUser] = await db.insert(users).values({
					email: email,
					name: githubUser.name || githubUser.login,
					image: githubUser.avatar_url,
					emailVerified: emailVerified ? new Date() : null
				}).returning();

				userId = newUser.id;

				// Create account link
				await db.insert(accounts).values({
					userId: newUser.id,
					type: 'oauth',
					provider: 'github',
					providerAccountId: String(githubUser.id),
					access_token: accessToken
				});
			}
		}

		// Create session
		const sessionToken = await createSession(userId);
		setSessionCookie(event, sessionToken);

		// Clean up OAuth cookie
		event.cookies.delete('github_oauth_state', { path: '/' });

		throw redirect(302, '/dashboard');
	} catch (error) {
		console.error('GitHub OAuth error:', error);
		throw redirect(302, '/auth/signin?error=oauth_error');
	}
};