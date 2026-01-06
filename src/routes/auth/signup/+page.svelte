<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let role = $state<'user' | 'admin'>('user');
	let adminSecretKey = $state('');
	let loading = $state(false);
	let error = $state('');
	let success = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		success = '';

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (password.length < 8) {
			error = 'Password must be at least 8 characters';
			return;
		}

		if (role === 'admin' && !adminSecretKey) {
			error = 'Admin secret key is required for admin registration';
			return;
		}

		loading = true;

		try {
			const response = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					name, 
					email, 
					password, 
					role,
					adminSecretKey: role === 'admin' ? adminSecretKey : undefined
				})
			});

			const data = await response.json();

			if (!response.ok) {
				error = data.error || 'Registration failed';
				return;
			}

			success = 'Account created successfully! Please check your email to verify your account.';
			name = '';
			email = '';
			password = '';
			confirmPassword = '';
			role = 'user';
			adminSecretKey = '';
		} catch (err) {
			error = 'An unexpected error occurred';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Sign Up - Auth App</title>
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
				<h2 class="text-2xl font-bold text-primary">Create your account</h2>
				<p class="mt-2 text-muted">
					Already have an account?
					<a href="/auth/signin" class="font-medium text-[color:var(--primary)] hover:opacity-90 transition-colors">
						Sign in
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
					<Alert type="success">{success}</Alert>
				</div>
				<div class="text-center">
					<a href="/auth/signin">
						<Button variant="primary" class="w-full">Go to Sign In</Button>
					</a>
				</div>
			{:else}
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

				<form class="space-y-4" onsubmit={handleSubmit}>
					<Input
						name="name"
						label="Full Name"
						bind:value={name}
						placeholder="John Doe"
						autocomplete="name"
						icon="user"
					/>

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
						autocomplete="new-password"
						icon="password"
					/>

					<Input
						type="password"
						name="confirmPassword"
						label="Confirm Password"
						bind:value={confirmPassword}
						placeholder="••••••••"
						required
						autocomplete="new-password"
						icon="password"
					/>

					<!-- Role Selection -->
					<fieldset class="space-y-2">
						<legend class="text-sm font-medium text-primary">Account Type</legend>
						<div class="grid grid-cols-2 gap-3">
							<label class="relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 {role === 'user' ? 'border-[var(--primary)] bg-[var(--primary-light)]' : 'border-subtle hover:border-slate-300'}">
								<input
									type="radio"
									name="role"
									value="user"
									checked={role === 'user'}
									onchange={() => role = 'user'}
									class="sr-only"
								/>
								<div class="text-center">
									<div class="w-10 h-10 mx-auto mb-2 rounded-full {role === 'user' ? 'bg-indigo-100' : 'bg-slate-100'} flex items-center justify-center">
										<svg class="w-5 h-5 {role === 'user' ? 'text-indigo-600' : 'text-slate-500'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
										</svg>
									</div>
									<span class="text-sm font-medium {role === 'user' ? 'text-indigo-900' : 'text-slate-700'}">User</span>
								</div>
							</label>
							<label class="relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 {role === 'admin' ? 'border-[var(--primary)] bg-[var(--primary-light)]' : 'border-subtle hover:border-slate-300'}">
								<input
									type="radio"
									name="role"
									value="admin"
									checked={role === 'admin'}
									onchange={() => role = 'admin'}
									class="sr-only"
								/>
								<div class="text-center">
									<div class="w-10 h-10 mx-auto mb-2 rounded-full {role === 'admin' ? 'bg-indigo-100' : 'bg-slate-100'} flex items-center justify-center">
										<svg class="w-5 h-5 {role === 'admin' ? 'text-indigo-600' : 'text-slate-500'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
										</svg>
									</div>
									<span class="text-sm font-medium {role === 'admin' ? 'text-indigo-900' : 'text-slate-700'}">Admin</span>
								</div>
							</label>
						</div>
					</fieldset>

					<!-- Admin Secret Key Field (only shown when admin is selected) -->
					{#if role === 'admin'}
						<div class="animate-fade-in">
							<div class="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
								<div class="flex items-start gap-3">
									<svg class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
									</svg>
									<div>
										<p class="text-sm font-medium text-amber-800">Admin Access Required</p>
										<p class="text-xs text-amber-700 mt-1">You need a valid admin secret key to register as an administrator.</p>
									</div>
								</div>
							</div>
							<div class="space-y-1.5">
								<label for="adminSecretKey" class="block text-sm font-medium text-primary">
									Admin Secret Key <span class="text-red-500">*</span>
								</label>
								<div class="relative">
									<div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
										<svg class="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
										</svg>
									</div>
									<input
										type="password"
										id="adminSecretKey"
										name="adminSecretKey"
										bind:value={adminSecretKey}
										placeholder="Enter admin secret key"
										required
										class="block w-full pl-11 pr-4 py-3 text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[color:rgba(99,102,241,0.2)] focus:border-[var(--primary)] hover:border-slate-300 transition-all duration-200"
									/>
								</div>
							</div>
						</div>
					{/if}

					<Button type="submit" {loading} class="w-full">
						{loading ? 'Creating Account...' : 'Create Account'}
					</Button>
				</form>
			{/if}
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
		from { opacity: 0; transform: translateY(10px); }
		to { opacity: 1; transform: translateY(0); }
	}
	.animate-fade-in {
		animation: fade-in 0.3s ease-out;
	}
</style>