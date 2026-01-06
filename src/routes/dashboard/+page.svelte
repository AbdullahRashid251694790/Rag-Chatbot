<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import Button from '$lib/components/Button.svelte';
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
				status?: 'active' | 'disabled';
			};
		};
	}

	let { data }: Props = $props();

	let error = $state('');

	$effect(() => {
		const urlError = $page.url.searchParams.get('error');
		if (urlError === 'unauthorized') {
			error = 'You do not have permission to access that page.';
		}
	});

	async function handleSignOut() {
		await fetch('/api/auth/logout', { method: 'POST' });
		await invalidateAll();
		goto('/');
	}

	function getInitials(name: string | null | undefined, email: string | null | undefined): string {
		if (name) {
			return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
		}
		return (email?.[0] || 'U').toUpperCase();
	}
</script>

<svelte:head>
	<title>Dashboard - Auth App</title>
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
						<a href="/dashboard" class="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--primary-light)] text-[var(--primary)] transition-colors">
							Dashboard
						</a>
						<a href="/chat" class="px-4 py-2 rounded-lg text-sm font-medium text-muted hover:text-primary hover:bg-[var(--bg-subtle)] transition-colors">
							Chat
						</a>
						
						{#if data.user?.role === 'admin'}
							<a href="/admin" class="px-4 py-2 rounded-lg text-sm font-medium text-muted hover:text-primary hover:bg-[var(--bg-subtle)] transition-colors">
								Admin
							</a>
						{/if}
						<a href="/profile" class="px-4 py-2 rounded-lg text-sm font-medium text-muted hover:text-primary hover:bg-[var(--bg-subtle)] transition-colors">
							Profile
						</a>
					</div>
				</div>
				<div class="flex items-center gap-4">
					<ThemeToggle />
					<div class="flex items-center gap-3">
						<div class="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
							{getInitials(data.user?.name, data.user?.email)}
						</div>
						<div class="hidden sm:block">
							<p class="text-sm font-medium text-primary">{data.user?.name || 'User'}</p>
							<p class="text-xs text-muted capitalize">{data.user?.role || 'user'}</p>
						</div>
					</div>
					<Button onclick={handleSignOut} variant="ghost" size="sm">Sign Out</Button>
				</div>
			</div>
		</div>
	</nav>

	<main class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
		{#if error}
			<div class="mb-6 animate-fade-in">
				<Alert type="error" dismissible>{error}</Alert>
			</div>
		{/if}

		<!-- Welcome Section -->
		<div class="mb-8 animate-fade-in">
			<h1 class="text-3xl font-bold text-primary">
				Welcome back, {data.user?.name?.split(' ')[0] || 'there'}! 👋
			</h1>
			<p class="mt-2 text-muted">Here's an overview of your account.</p>
		</div>

		<!-- Stats Cards -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
			<div class="group bg-surface rounded-2xl border border-subtle p-6 shadow-sm hover:shadow-lg hover:border-[var(--primary)] transition-all duration-300 animate-fade-in" style="animation-delay: 0.1s">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-muted">Account Status</p>
						<p class="text-2xl font-bold text-primary mt-1 capitalize">{data.user?.status || 'Active'}</p>
					</div>
					<div class="w-12 h-12 bg-[var(--primary-light)] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
						<svg class="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
					</div>
				</div>
				<div class="mt-4 flex items-center gap-2">
					<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[var(--primary-light)] text-[var(--primary)]">
						<span class="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></span>
						Online
					</span>
				</div>
			</div>

			<div class="group bg-surface rounded-2xl border border-subtle p-6 shadow-sm hover:shadow-lg hover:border-[var(--primary)] transition-all duration-300 animate-fade-in" style="animation-delay: 0.2s">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-muted">Role</p>
						<p class="text-2xl font-bold text-primary mt-1 capitalize">{data.user?.role || 'User'}</p>
					</div>
					<div class="w-12 h-12 bg-[var(--primary-light)] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
						<svg class="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
						</svg>
					</div>
				</div>
				<div class="mt-4 flex items-center gap-2">
					{#if data.user?.role === 'admin'}
						<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[var(--primary-light)] text-[var(--primary)]">
							<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
							</svg>
							Full Access
						</span>
					{:else}
						<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[var(--bg-subtle)] text-muted">
							Standard Access
						</span>
					{/if}
				</div>
			</div>

			<div class="group bg-surface rounded-2xl border border-subtle p-6 shadow-sm hover:shadow-lg hover:border-[var(--primary)] transition-all duration-300 animate-fade-in" style="animation-delay: 0.3s">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-muted">Session Type</p>
						<p class="text-2xl font-bold text-primary mt-1">Database</p>
					</div>
					<div class="w-12 h-12 bg-[var(--primary-light)] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
						<svg class="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
						</svg>
					</div>
				</div>
				<div class="mt-4 flex items-center gap-2">
					<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[var(--primary-light)] text-[var(--primary)]">
						<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
						</svg>
						Secure
					</span>
				</div>
			</div>
		</div>

		<!-- Session Info Card -->
		<div class="bg-surface rounded-2xl border border-subtle shadow-sm overflow-hidden animate-fade-in" style="animation-delay: 0.4s">
			<div class="px-6 py-4 border-b border-subtle bg-[var(--bg-subtle)]">
				<h2 class="text-lg font-semibold text-primary">Session Information</h2>
			</div>
			<div class="p-6">
				<dl class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="space-y-1">
						<dt class="text-sm font-medium text-muted">User ID</dt>
						<dd class="text-sm text-primary font-mono bg-[var(--bg-elevated)] px-3 py-2 rounded-lg border border-subtle">{data.user?.id}</dd>
					</div>
					<div class="space-y-1">
						<dt class="text-sm font-medium text-muted">Email Address</dt>
						<dd class="text-sm text-primary">{data.user?.email}</dd>
					</div>
					<div class="space-y-1">
						<dt class="text-sm font-medium text-muted">Full Name</dt>
						<dd class="text-sm text-primary">{data.user?.name || 'Not set'}</dd>
					</div>
					<div class="space-y-1">
						<dt class="text-sm font-medium text-muted">Authentication Method</dt>
						<dd class="text-sm text-primary">Email & Password (Database Session)</dd>
					</div>
				</dl>
			</div>
		</div>

		<!-- Admin Quick Access -->
		{#if data.user?.role === 'admin'}
			<div class="mt-8 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] rounded-2xl p-6 text-white shadow-lg animate-fade-in" style="animation-delay: 0.5s">
				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<h3 class="text-xl font-bold">Admin Access</h3>
						<p class="text-white/90 mt-1">You have administrator privileges. Manage users and view analytics.</p>
					</div>
					<a href="/admin">
						<Button variant="secondary" size="lg">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
							</svg>
							Admin Dashboard
						</Button>
					</a>
				</div>
			</div>
		{/if}
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