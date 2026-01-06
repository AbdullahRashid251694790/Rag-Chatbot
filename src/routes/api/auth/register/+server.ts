import { json, type RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { users, verificationTokens } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '$lib/server/email.js';
import { env } from '$env/dynamic/private';

export const POST = async ({ request }: RequestEvent) => {
	try {
		const { name, email, password, role, adminSecretKey } = await request.json();

		// Validation
		if (!email || !password) {
			return json({ error: 'Email and password are required' }, { status: 400 });
		}

		if (password.length < 8) {
			return json({ error: 'Password must be at least 8 characters' }, { status: 400 });
		}

		// Validate admin secret key if registering as admin
		let userRole: 'user' | 'admin' = 'user';
		
		if (role === 'admin') {
			if (!adminSecretKey) {
				return json({ error: 'Admin secret key is required for admin registration' }, { status: 400 });
			}
			
			if (adminSecretKey !== env.ADMIN_SECRET_KEY) {
				return json({ error: 'Invalid admin secret key' }, { status: 403 });
			}
			
			userRole = 'admin';
		}

		// Check if user already exists
		const existingUser = await db.query.users.findFirst({
			where: eq(users.email, email)
		});

		if (existingUser) {
			return json({ error: 'User with this email already exists' }, { status: 400 });
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 12);

		// Create user
		const [newUser] = await db
			.insert(users)
			.values({
				name: name || null,
				email,
				password: hashedPassword,
				role: userRole,
				status: 'active',
				emailVerified: null
			})
			.returning({
				id: users.id,
				email: users.email,
				name: users.name,
				role: users.role
			});

		// Create verification token
		const token = crypto.randomUUID();
		const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

		await db.insert(verificationTokens).values({
			identifier: email,
			token,
			expires
		});

		// Send verification email
		try {
			await sendVerificationEmail(email, token);
		} catch (emailError) {
			console.error('Failed to send verification email:', emailError);
		}

		return json(
			{
				user: newUser,
				message: 'Account created successfully! Please check your email to verify your account.'
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Registration error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};