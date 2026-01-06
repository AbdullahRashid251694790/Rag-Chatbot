import { SvelteKitAuth } from '@auth/sveltekit';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from './db/index.js';
import { users, accounts, sessions, verificationTokens } from './db/schema.js';
import type { Session } from '@auth/core/types';
import type { AdapterUser } from '@auth/core/adapters';

export const { handle, signIn, signOut } = SvelteKitAuth({
	adapter: DrizzleAdapter(db, {
		usersTable: users,
		accountsTable: accounts,
		sessionsTable: sessions,
		verificationTokensTable: verificationTokens
	}),
	session: {
		strategy: 'database',
		maxAge: 30 * 24 * 60 * 60,
		updateAge: 24 * 60 * 60
	},
	providers: [],
	callbacks: {
		async session({ session, user }: { session: Session; user: AdapterUser }) {
			if (session.user) {
				session.user.id = user.id;
			}
			return session;
		}
	},
	trustHost: true
});