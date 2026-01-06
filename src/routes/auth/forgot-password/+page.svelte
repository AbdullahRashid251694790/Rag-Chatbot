<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	let email = $state('');
	let loading = $state(false);
	let error = $state('');
	let success = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		success = '';
		loading = true;

		try {
			const response = await fetch('/api/auth/forgot-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});

			const data = await response.json();

			if (!response.ok) {
				error = data.error || 'Failed to send reset email';
				return;
			}

			success = 'If an account exists with this email, you will receive a password reset link shortly.';
			email = '';
		} catch (err) {
			error = 'An unexpected error occurred';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Forgot Password - Auth App</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center app-shell py-12 px-4 sm:px-6 lg:px-8">
	<div class="w-full max-w-md">
		<!-- Logo / Theme -->
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
				<div class="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 bg-[var(--primary-light)]">
					<svg class="w-8 h-8 text-[color:var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
					</svg>
				</div>
				<h2 class="text-2xl font-bold text-primary">Forgot your password?</h2>
				<p class="mt-2 text-muted">No worries, we'll send you reset instructions.</p>
			</div>

			{#if error}
				<div class="mb-6">
					<Alert type="error" dismissible>{error}</Alert>
				</div>
			{/if}

			{#if success}
				<div class="mb-6">
					<Alert type="success">{success}</Alert>
				</div>
			{/if}

			<form class="space-y-6" onsubmit={handleSubmit}>
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

				<Button type="submit" {loading} class="w-full">
					{loading ? 'Sending...' : 'Send Reset Link'}
				</Button>
			</form>

			<div class="mt-6 text-center">
				<a href="/auth/signin" class="inline-flex items-center gap-2 text-sm font-medium text-[color:var(--primary)] hover:opacity-90 transition-colors">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
					</svg>
					Back to Sign In
				</a>
			</div>
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