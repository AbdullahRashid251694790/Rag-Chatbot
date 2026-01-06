import { json, type RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { users, sessions } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

export const PATCH = async (event: RequestEvent) => {
	const session = event.locals.session;

	// Check if user is authenticated and is admin
	if (!session?.user?.id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (session.user.role !== 'admin') {
		return json({ error: 'Forbidden: Admin access required' }, { status: 403 });
	}

	const userId = event.params.id;

	if (!userId) {
		return json({ error: 'User ID is required' }, { status: 400 });
	}

	// Prevent admin from modifying their own account
	if (userId === session.user.id) {
		return json({ error: 'Cannot modify your own account' }, { status: 400 });
	}

	try {
		const { role, status } = await event.request.json();

		// Validate role
		if (role && !['user', 'admin'].includes(role)) {
			return json({ error: 'Invalid role' }, { status: 400 });
		}

		// Validate status
		if (status && !['active', 'disabled'].includes(status)) {
			return json({ error: 'Invalid status' }, { status: 400 });
		}

		// Check if user exists
		const existingUser = await db.query.users.findFirst({
			where: eq(users.id, userId)
		});

		if (!existingUser) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		// Build update object
		const updateData: { role?: 'user' | 'admin'; status?: 'active' | 'disabled'; updatedAt: Date } = {
			updatedAt: new Date()
		};

		if (role) updateData.role = role;
		if (status) updateData.status = status;

		// Update user
		const [updatedUser] = await db
			.update(users)
			.set(updateData)
			.where(eq(users.id, userId))
			.returning({
				id: users.id,
				name: users.name,
				email: users.email,
				role: users.role,
				status: users.status,
				updatedAt: users.updatedAt
			});

		// If user is disabled, delete their sessions
		if (status === 'disabled') {
			await db.delete(sessions).where(eq(sessions.userId, userId));
		}

		return json({ user: updatedUser, message: 'User updated successfully' });
	} catch (error) {
		console.error('Admin update user error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const DELETE = async (event: RequestEvent) => {
	const session = event.locals.session;

	// Check if user is authenticated and is admin
	if (!session?.user?.id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (session.user.role !== 'admin') {
		return json({ error: 'Forbidden: Admin access required' }, { status: 403 });
	}

	const userId = event.params.id;

	if (!userId) {
		return json({ error: 'User ID is required' }, { status: 400 });
	}

	// Prevent admin from deleting their own account
	if (userId === session.user.id) {
		return json({ error: 'Cannot delete your own account' }, { status: 400 });
	}

	try {
		// Check if user exists
		const existingUser = await db.query.users.findFirst({
			where: eq(users.id, userId)
		});

		if (!existingUser) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		// Delete user (cascades to sessions and accounts)
		await db.delete(users).where(eq(users.id, userId));

		return json({ message: 'User deleted successfully' });
	} catch (error) {
		console.error('Admin delete user error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};