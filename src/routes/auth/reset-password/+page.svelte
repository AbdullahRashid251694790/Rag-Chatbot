<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Alert from '$lib/components/Alert.svelte';

	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let error = $state('');
	let success = $state(false);

	const token = $page.url.searchParams.get('token');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (password.length < 8) {
			error = 'Password must be at least 8 characters';
			return;
		}

		loading = true;

		try {
			const response = await fetch('/api/auth/reset-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token, password })
			});

			const data = await response.json();

			if (!response.ok) {
				error = data.error || 'Failed to reset password';
				return;
			}

			success = true;
		} catch (err) {
			error = 'An unexpected error occurred';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Reset Password - Auth App</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="w-full max-w-md">
		<!-- Logo -->
		<div class="text-center mb-8">
			<a href="/" class="inline-flex items-center gap-2">
				<div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
					<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
					</svg>
				</div>
				<span class="text-2xl font-bold text-slate-900">AuthApp</span>
			</a>
		</div>

		<!-- Card -->
		<div class="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 animate-fade-in">
			{#if !token}
				<div class="text-center">
					<div class="w-16 h-16 mx-auto bg-red-100 rounded-2xl flex items-center justify-center mb-4">
						<svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
						</svg>
					</div>
					<h2 class="text-xl font-bold text-slate-900 mb-2">Invalid Reset Link</h2>
					<p class="text-slate-600 mb-6">This password reset link is invalid or has expired.</p>
					<a href="/auth/forgot-password">
						<Button variant="primary" class="w-full">Request New Link</Button>
					</a>
				</div>
			{:else if success}
				<div class="text-center">
					<div class="w-16 h-16 mx-auto bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
						<svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
					</div>
					<h2 class="text-xl font-bold text-slate-900 mb-2">Password Reset Successful!</h2>
					<p class="text-slate-600 mb-6">Your password has been changed. You can now sign in with your new password.</p>
					<Button onclick={() => goto('/auth/signin')} class="w-full">Sign In</Button>
				</div>
			{:else}
				<div class="text-center mb-8">
					<div class="w-16 h-16 mx-auto bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
						<svg class="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
						</svg>
					</div>
					<h2 class="text-2xl font-bold text-slate-900">Set New Password</h2>
					<p class="mt-2 text-slate-600">Please enter your new password below.</p>
				</div>

				{#if error}
					<div class="mb-6">
						<Alert type="error" dismissible>{error}</Alert>
					</div>
				{/if}

				<form class="space-y-6" onsubmit={handleSubmit}>
					<Input
						type="password"
						name="password"
						label="New Password"
						bind:value={password}
						placeholder="••••••••"
						required
						autocomplete="new-password"
						icon="password"
					/>

					<Input
						type="password"
						name="confirmPassword"
						label="Confirm New Password"
						bind:value={confirmPassword}
						placeholder="••••••••"
						required
						autocomplete="new-password"
						icon="password"
					/>

					<Button type="submit" {loading} class="w-full">
						{loading ? 'Resetting...' : 'Reset Password'}
					</Button>
				</form>
			{/if}
		</div>
	</div>
</div>

<style>
	@keyframes fade-in {
		from { opacity: 0; transform: translateY(20px); }
		to { opacity: 1; transform: translateY(0); }
	}
	.animate-fade-in {
		animation: fade-in 0.5s ease-out;
	}
</style>