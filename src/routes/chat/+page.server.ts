import { redirect } from '@sveltejs/kit';
import type { ServerLoadEvent } from '@sveltejs/kit';

export const load = async (event: ServerLoadEvent) => {
	const session = event.locals.session;

	if (!session) {
		throw redirect(303, '/auth/signin');
	}

	return {
		user: session.user
	};
};