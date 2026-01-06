import type { ServerLoadEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { users } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

export const load = async (event: ServerLoadEvent) => {
	const session = event.locals.session;

	if (!session?.user?.id) {
		return { user: null };
	}

	const user = await db.query.users.findFirst({
		where: eq(users.id, session.user.id),
		columns: {
			id: true,
			name: true,
			email: true,
			image: true,
			createdAt: true,
			updatedAt: true
		}
	});

	return { user };
};