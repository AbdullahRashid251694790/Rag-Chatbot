import type { ServerLoadEvent } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export const load = async (event: ServerLoadEvent) => {
	const session = event.locals.session;

	if (!session) {
		throw redirect(303, '/auth/signin');
	}

	if (session.user.role !== 'admin') {
		throw redirect(303, '/dashboard?error=unauthorized');
	}

	return {
		user: session.user
	};
};