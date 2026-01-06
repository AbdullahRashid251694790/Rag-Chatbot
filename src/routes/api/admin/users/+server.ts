import { json, type RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { users } from '$lib/server/db/schema.js';
import { count, eq } from 'drizzle-orm';

export const GET = async (event: RequestEvent) => {
	const session = event.locals.session;

	// Check if user is authenticated and is admin
	if (!session?.user?.id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (session.user.role !== 'admin') {
		return json({ error: 'Forbidden: Admin access required' }, { status: 403 });
	}

	try {
		// Get all users
		const allUsers = await db
			.select({
				id: users.id,
				name: users.name,
				email: users.email,
				role: users.role,
				status: users.status,
				emailVerified: users.emailVerified,
				image: users.image,
				createdAt: users.createdAt,
				updatedAt: users.updatedAt
			})
			.from(users)
			.orderBy(users.createdAt);

		// Get statistics
		const totalUsers = allUsers.length;
		const adminCount = allUsers.filter((u) => u.role === 'admin').length;
		const userCount = allUsers.filter((u) => u.role === 'user').length;
		const activeCount = allUsers.filter((u) => u.status === 'active').length;
		const disabledCount = allUsers.filter((u) => u.status === 'disabled').length;
		const verifiedCount = allUsers.filter((u) => u.emailVerified !== null).length;

		return json({
			users: allUsers,
			stats: {
				totalUsers,
				adminCount,
				userCount,
				activeCount,
				disabledCount,
				verifiedCount
			}
		});
	} catch (error) {
		console.error('Admin users error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};