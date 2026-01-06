import { json, type RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { users } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

export const PUT = async (event: RequestEvent) => {
	const session = event.locals.session;

	if (!session?.user?.id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { name, image } = await event.request.json();

		const [updatedUser] = await db
			.update(users)
			.set({
				name,
				image,
				updatedAt: new Date()
			})
			.where(eq(users.id, session.user.id))
			.returning({
				id: users.id,
				name: users.name,
				email: users.email,
				image: users.image
			});

		return json({ user: updatedUser });
	} catch (error) {
		console.error('Profile update error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};