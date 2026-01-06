import { redirect, type Handle } from '@sveltejs/kit';
import { getSession, getSessionToken } from '$lib/server/session.js';

const protectedRoutes = ['/dashboard', '/profile', '/chat'];
const adminRoutes = ['/admin'];

export const handle: Handle = async ({ event, resolve }) => {
	const sessionToken = getSessionToken(event);

	if (sessionToken) {
		const sessionData = await getSession(sessionToken);
		if (sessionData) {
			event.locals.session = {
				user: {
					id: sessionData.user.id,
					name: sessionData.user.name,
					email: sessionData.user.email,
					image: sessionData.user.image,
					role: sessionData.user.role,
					status: sessionData.user.status
				}
			};
		} else {
			event.locals.session = null;
		}
	} else {
		event.locals.session = null;
	}

	// Check if the route is protected
	const isProtectedRoute = protectedRoutes.some((route) => event.url.pathname.startsWith(route));
	const isAdminRoute = adminRoutes.some((route) => event.url.pathname.startsWith(route));

	if (isProtectedRoute && !event.locals.session) {
		throw redirect(303, '/auth/signin');
	}

	// Check admin routes
	if (isAdminRoute) {
		if (!event.locals.session) {
			throw redirect(303, '/auth/signin');
		}
		if (event.locals.session.user.role !== 'admin') {
			throw redirect(303, '/dashboard?error=unauthorized');
		}
	}

	// Redirect logged-in users away from auth pages
	if (event.locals.session && event.url.pathname.startsWith('/auth/sign')) {
		throw redirect(303, '/dashboard');
	}

	return resolve(event);
};