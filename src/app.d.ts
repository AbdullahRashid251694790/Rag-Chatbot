declare global {
	namespace App {
		interface Locals {
			session: {
				user: {
					id: string;
					name?: string | null;
					email?: string | null;
					image?: string | null;
					role: 'user' | 'admin';
					status: 'active' | 'disabled';
				};
			} | null;
		}
		interface PageData {
			session: {
				user: {
					id: string;
					name?: string | null;
					email?: string | null;
					image?: string | null;
					role: 'user' | 'admin';
					status: 'active' | 'disabled';
				};
			} | null;
		}
	}
}

export {};