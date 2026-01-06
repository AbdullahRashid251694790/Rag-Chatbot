<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let resendLoading = $state(false);
	let error = $state('');
	let success = $state('');
	let needsVerification = $state(false);
	let unverifiedEmail = $state('');

	$effect(() => {
		const urlError = $page.url.searchParams.get('error');
		if (urlError === 'invalid_state') {
			error = 'Authentication failed. Please try again.';
		} else if (urlError === 'oauth_error') {
			error = 'OAuth authentication failed. Please try again.';
		} else if (urlError === 'no_email') {
			error = 'Could not get email from provider. Please use email/password.';
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		success = '';
		needsVerification = false;
		loading = true;

		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});

			const data = await response.json();

			if (!response.ok) {
				if (data.needsVerification) {
					needsVerification = true;
					unverifiedEmail = data.email;
					error = data.error;
				} else {
					error = data.error || 'Invalid email or password';
				}
				return;
			}

			goto('/dashboard');
		} catch (err) {
			error = 'An unexpected error occurred';
		} finally {
			loading = false;
		}
	}

	async function handleResendVerification() {
		resendLoading = true;
		error = '';
		success = '';

		try {
			const response = await fetch('/api/auth/resend-verification', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: unverifiedEmail })
			});

			const data = await response.json();

			if (!response.ok) {
				error = data.error || 'Failed to send verification email';
				return;
			}

			success = 'Verification email sent! Please check your inbox.';
			needsVerification = false;
		} catch (err) {
			error = 'An unexpected error occurred';
		} finally {
			resendLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Sign In - Auth App</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center app-shell py-12 px-4 sm:px-6 lg:px-8">
	<div class="w-full max-w-md">
		<!-- Logo -->
		<div class="flex items-center justify-between mb-8">
			<a href="/" class="inline-flex items-center gap-2">
				<div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
					<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
					</svg>
				</div>
				<span class="text-2xl font-bold text-primary">AuthApp</span>
			</a>
			<ThemeToggle />
		</div>

		<!-- Card -->
		<div class="bg-surface rounded-2xl border border-subtle shadow-sm p-8 animate-fade-in">
			<div class="text-center mb-8">
				<h2 class="text-2xl font-bold text-primary">Welcome back</h2>
				<p class="mt-2 text-muted">
					Don't have an account?
					<a href="/auth/signup" class="font-medium text-[color:var(--primary)] hover:opacity-90 transition-colors">
						Sign up
					</a>
				</p>
			</div>

			{#if error}
				<div class="mb-6">
					<Alert type="error" dismissible>{error}</Alert>
				</div>
			{/if}

			{#if success}
				<div class="mb-6">
					<Alert type="success" dismissible>{success}</Alert>
				</div>
			{/if}

			{#if needsVerification}
				<div class="mb-6">
					<Button onclick={handleResendVerification} loading={resendLoading} variant="outline" class="w-full">
						{resendLoading ? 'Sending...' : 'Resend Verification Email'}
					</Button>
				</div>
			{/if}

			<!-- OAuth Buttons -->
			<div class="space-y-3 mb-6">
				<a href="/auth/login/google" class="flex items-center justify-center gap-3 w-full px-4 py-3 bg-surface border border-subtle rounded-xl text-sm font-medium text-primary hover:bg-[var(--bg-subtle)] transition-all duration-200">
					<svg class="w-5 h-5" viewBox="0 0 24 24">
						<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
						<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
						<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
						<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
					</svg>
					Continue with Google
				</a>

				<a href="/auth/login/github" class="flex items-center justify-center gap-3 w-full px-4 py-3 bg-slate-900 rounded-xl text-sm font-medium text-white hover:bg-slate-800 transition-all duration-200">
					<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
						<path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
					</svg>
					Continue with GitHub
				</a>
			</div>

			<!-- Divider -->
			<div class="relative mb-6">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-t border-subtle"></div>
				</div>
				<div class="relative flex justify-center text-sm">
					<span class="px-4 bg-surface text-muted">or continue with email</span>
				</div>
			</div>

			<form class="space-y-5" onsubmit={handleSubmit}>
				<Input
					type="email"
					name="email"
					label="Email Address"
					bind:value={email}
					placeholder="you@example.com"
					required
					autocomplete="email"
					icon="email"
				/>

				<Input
					type="password"
					name="password"
					label="Password"
					bind:value={password}
					placeholder="••••••••"
					required
					autocomplete="current-password"
					icon="password"
				/>

				<div class="flex items-center justify-end">
					<a href="/auth/forgot-password" class="text-sm font-medium text-[color:var(--primary)] hover:opacity-90 transition-colors">
						Forgot your password?
					</a>
				</div>

				<Button type="submit" {loading} class="w-full">
					{loading ? 'Signing In...' : 'Sign In'}
				</Button>
			</form>
		</div>

		<!-- Back to home -->
		<div class="mt-6 text-center">
			<a href="/" class="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
				</svg>
				Back to home
			</a>
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