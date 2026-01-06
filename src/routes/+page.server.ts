import type { ServerLoadEvent } from '@sveltejs/kit';

export const load = async (event: ServerLoadEvent) => {
	return {
		session: event.locals.session
	};
};