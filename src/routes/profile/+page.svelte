<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	interface Props {
		data: {
			user?: {
				id?: string;
				name?: string | null;
				email?: string | null;
				image?: string | null;
				role?: 'user' | 'admin';
				createdAt?: Date;
				updatedAt?: Date;
			} | null;
		};
	}

	let { data }: Props = $props();

	let name = $state('');
	let image = $state('');
	let loading = $state(false);
	let error = $state('');
	let success = $state('');

	$effect(() => {
		name = data.user?.name || '';
		image = data.user?.image || '';
	});

	async function handleSignOut() {
		await fetch('/api/auth/logout', { method: 'POST' });
		await invalidateAll();
		goto('/');
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		success = '';
		loading = true;

		try {
			const response = await fetch('/api/user/profile', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, image })
			});

			const result = await response.json();

			if (!response.ok) {
				error = result.error || 'Failed to update profile';
				return;
			}

			success = 'Profile updated successfully!';
			await invalidateAll();
			
			setTimeout(() => success = '', 3000);
		} catch (err) {
			error = 'An unexpected error occurred';
		} finally {
			loading = false;
		}
	}

	function formatDate(date: Date | undefined): string {
		if (!date) return 'Unknown';
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function getInitials(name: string | null | undefined, email: string | null | undefined): string {
		if (name) {
			return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
		}
		return (email?.[0] || 'U').toUpperCase();
	}
</script>

<svelte:head>
	<title>Profile - Auth App</title>
</svelte:head>

<div class="min-h-screen app-shell">
	<!-- Navigation -->
	<nav class="sticky top-0 z-50 nav-surface">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16 items-center">
				<div class="flex items-center gap-8">
					<a href="/" class="flex items-center gap-2">
						<div class="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
							<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
							</svg>
						</div>
						<span class="text-xl font-bold text-primary">AuthApp</span>
					</a>
					<div class="hidden md:flex items-center gap-1">
						<a href="/dashboard" class="px-4 py-2 rounded-lg text-sm font-medium text-muted hover:text-primary hover:bg-slate-100 transition-colors">
							Dashboard
						</a>
						<a href="/chat" class="px-4 py-2 rounded-lg text-sm font-medium text-muted hover:text-primary hover:bg-slate-100 transition-colors">
							Chat
						</a>
						{#if data.user?.role === 'admin'}
							<a href="/admin" class="px-4 py-2 rounded-lg text-sm font-medium text-muted hover:text-primary hover:bg-slate-100 transition-colors">
								Admin
							</a>
						{/if}
						<a href="/profile" class="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-700 transition-colors">
							Profile
						</a>
					</div>
				</div>
				<div class="flex items-center gap-4">
					<ThemeToggle />
					<Button onclick={handleSignOut} variant="ghost" size="sm">Sign Out</Button>
				</div>
			</div>
		</div>
	</nav>

	<main class="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="mb-8 animate-fade-in">
			<h1 class="text-3xl font-bold text-primary">Profile Settings</h1>
			<p class="mt-2 text-muted">Manage your account information and preferences</p>
		</div>

		{#if error}
			<div class="mb-6 animate-fade-in">
				<Alert type="error" dismissible>{error}</Alert>
			</div>
		{/if}

		{#if success}
			<div class="mb-6 animate-fade-in">
				<Alert type="success" dismissible>{success}</Alert>
			</div>
		{/if}

		<!-- Profile Card -->
		<div class="bg-surface rounded-2xl border border-subtle shadow-sm overflow-hidden animate-fade-in" style="animation-delay: 0.1s">
			<!-- Profile Header -->
			<div class="px-6 py-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
				<div class="flex items-center gap-4">
					<div class="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold">
						{getInitials(data.user?.name, data.user?.email)}
					</div>
					<div>
						<h2 class="text-xl font-bold">{data.user?.name || 'No name set'}</h2>
						<p class="text-indigo-100">{data.user?.email}</p>
						<span class="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-xs font-medium bg-white/20 capitalize">
							{data.user?.role || 'user'}
						</span>
					</div>
				</div>
			</div>

			<!-- Profile Form -->
			<div class="p-6">
				<form onsubmit={handleSubmit} class="space-y-6">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div class="space-y-1.5">
							<label for="email" class="block text-sm font-medium text-primary">Email Address</label>
							<div class="relative">
								<div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
									<svg class="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
									</svg>
								</div>
								<input
									type="email"
									id="email"
									name="email"
									value={data.user?.email}
									disabled
									class="block w-full pl-11 pr-4 py-3 text-sm rounded-xl border border-subtle bg-[var(--bg-subtle)] text-muted cursor-not-allowed"
								/>
							</div>
							<p class="text-xs text-muted">Email cannot be changed</p>
						</div>

						<Input
							name="name"
							label="Full Name"
							bind:value={name}
							placeholder="Your name"
							autocomplete="name"
							icon="user"
						/>
					</div>

					<!-- <Input
						name="image"
						label="Profile Image URL"
						bind:value={image}
						placeholder="https://example.com/avatar.jpg"
					/> -->

					<div class="pt-6 border-t border-subtle">
						<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
							<div class="text-sm text-muted space-y-1">
								<p class="flex items-center gap-2">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
									</svg>
									Account created: {formatDate(data.user?.createdAt)}
								</p>
								<p class="flex items-center gap-2">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
									</svg>
									Last updated: {formatDate(data.user?.updatedAt)}
								</p>
							</div>
							<Button type="submit" {loading}>
								{loading ? 'Saving...' : 'Save Changes'}
							</Button>
						</div>
					</div>
				</form>
			</div>
		</div>

		<!-- Danger Zone -->
		<!-- <div class="mt-8 bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden animate-fade-in" style="animation-delay: 0.2s">
			<div class="px-6 py-4 bg-red-50 border-b border-red-200">
				<h3 class="text-lg font-semibold text-red-800 flex items-center gap-2">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
					</svg>
					Danger Zone
				</h3>
			</div>
			<div class="p-6">
				<p class="text-sm text-slate-600 mb-4">
					Once you delete your account, there is no going back. All your data will be permanently removed.
				</p>
				<Button variant="danger" disabled>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
					</svg>
					Delete Account (Coming Soon)
				</Button>
			</div>
		</div> -->
	</main>
</div>

<style>
	@keyframes fade-in {
		from { opacity: 0; transform: translateY(10px); }
		to { opacity: 1; transform: translateY(0); }
	}
	.animate-fade-in {
		opacity: 0;
		animation: fade-in 0.5s ease-out forwards;
	}
</style>