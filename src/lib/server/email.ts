import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';

function getTransporter() {
	return nodemailer.createTransport({
		host: env.SMTP_HOST,
		port: parseInt(env.SMTP_PORT || '587'),
		secure: false,
		auth: {
			user: env.SMTP_USER,
			pass: env.SMTP_PASSWORD
		}
	});
}

export async function sendVerificationEmail(email: string, token: string) {
	const verificationUrl = `${env.APP_URL}/auth/verify-email?token=${token}`;
	const transporter = getTransporter();

	await transporter.sendMail({
		from: `"AuthApp" <${env.SMTP_USER}>`,
		to: email,
		subject: 'Verify your email address',
		html: `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h1 style="color: #4f46e5;">Welcome to AuthApp!</h1>
				<p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
				<a href="${verificationUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Verify Email</a>
				<p>Or copy and paste this link in your browser:</p>
				<p style="color: #666; word-break: break-all;">${verificationUrl}</p>
				<p>This link will expire in 24 hours.</p>
				<p style="color: #999; font-size: 12px; margin-top: 32px;">If you didn't create an account, you can safely ignore this email.</p>
			</div>
		`
	});
}

export async function sendPasswordResetEmail(email: string, token: string) {
	const resetUrl = `${env.APP_URL}/auth/reset-password?token=${token}`;
	const transporter = getTransporter();

	await transporter.sendMail({
		from: `"AuthApp" <${env.SMTP_USER}>`,
		to: email,
		subject: 'Reset your password',
		html: `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h1 style="color: #4f46e5;">Password Reset Request</h1>
				<p>You requested to reset your password. Click the button below to create a new password:</p>
				<a href="${resetUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
				<p>Or copy and paste this link in your browser:</p>
				<p style="color: #666; word-break: break-all;">${resetUrl}</p>
				<p>This link will expire in 1 hour.</p>
				<p style="color: #999; font-size: 12px; margin-top: 32px;">If you didn't request a password reset, you can safely ignore this email.</p>
			</div>
		`
	});
}