<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	interface Props {
		data: {
			session: {
				user?: {
					name?: string | null;
					email?: string | null;
					role?: 'user' | 'admin';
				};
			} | null;
		};
	}

	let { data }: Props = $props();

	async function handleSignOut() {
		await fetch('/api/auth/logout', { method: 'POST' });
		await invalidateAll();
		goto('/');
	}
</script>

<svelte:head>
	<title>AuthApp - Secure Authentication Made Simple</title>
</svelte:head>

<div class="min-h-screen flex flex-col app-shell">
	<!-- Navigation -->
	<nav class="sticky top-0 z-50 nav-surface">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16 items-center">
				<div class="flex items-center gap-2">
					<div class="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
						<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
						</svg>
					</div>
					<span class="text-xl font-bold text-primary">AuthApp</span>
				</div>
				<div class="flex items-center gap-3">
					<ThemeToggle />
					{#if data.session}
						<a href="/dashboard" class="text-muted hover:text-primary px-3 py-2 text-sm font-medium transition-colors">
							Dashboard
						</a>
						{#if data.session.user?.role === 'admin'}
							<a href="/admin" class="text-muted hover:text-primary px-3 py-2 text-sm font-medium transition-colors">
								Admin
							</a>
						{/if}
						<a href="/profile" class="text-muted hover:text-primary px-3 py-2 text-sm font-medium transition-colors">
							Profile
						</a>
						<Button onclick={handleSignOut} variant="ghost" size="sm">Sign Out</Button>
					{:else}
						<a href="/auth/signin">
							<Button variant="ghost" size="sm">Sign In</Button>
						</a>
						<a href="/auth/signup">
							<Button variant="primary" size="sm">Get Started</Button>
						</a>
					{/if}
				</div>
			</div>
		</div>
	</nav>

	<!-- Hero Section -->
	<main class="flex-1 flex items-center justify-center px-4 py-20">
		<div class="text-center max-w-7xl mx-auto w-full">
			<!-- Badge -->
			<div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium mb-8 animate-fade-in">
				<span class="relative flex h-2 w-2">
					<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
					<span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
				</span>
				Secure Database Sessions
			</div>

			<!-- Heading -->
			<h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold text-primary tracking-tight mb-6 animate-fade-in" style="animation-delay: 0.1s">
				Secure Authentication
				<span class="block mt-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
					Made Simple
				</span>
			</h1>

			<!-- Description -->
			<p class="text-xl text-muted max-w-2xl mx-auto mb-10 animate-fade-in" style="animation-delay: 0.2s">
				A full-stack Application built with SvelteKit, PostgreSQL, and Drizzle ORM. 
				Featuring secure database sessions, OAuth integration,  admin controls and Ai Chatbot.
			</p>

			<!-- CTA Buttons -->
			<div class="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style="animation-delay: 0.3s">
				{#if data.session}
					<a href="/dashboard">
						<Button variant="primary" size="lg">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
							</svg>
							Go to Dashboard
						</Button>
					</a>
				{:else}
					<a href="/auth/signup">
						<Button variant="primary" size="lg">
							Get Started Free
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
							</svg>
						</Button>
					</a>
					<a href="/auth/signin">
						<Button variant="secondary" size="lg">
							Sign In
						</Button>
					</a>
				{/if}
			</div>

			<!-- Features Grid -->
			<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mt-24 px-4 animate-fade-in" style="animation-delay: 0.4s">
				<div class="group p-8 bg-surface rounded-2xl border border-subtle shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300">
					<div class="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
						<svg class="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-primary mb-3">Database Sessions</h3>
					<p class="text-base text-muted leading-relaxed">Secure server-side sessions stored in PostgreSQL, not vulnerable JWTs.</p>
				</div>

				<div class="group p-8 bg-surface rounded-2xl border border-subtle shadow-sm hover:shadow-xl hover:border-purple-200 transition-all duration-300">
					<div class="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
						<svg class="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-primary mb-3">OAuth Integration</h3>
					<p class="text-base text-muted leading-relaxed">Sign in with Google or GitHub with seamless account linking.</p>
				</div>

				<div class="group p-8 bg-surface rounded-2xl border border-subtle shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300">
					<div class="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
						<svg class="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-primary mb-3">Admin Controls</h3>
					<p class="text-base text-muted leading-relaxed">Full user management with role-based access control.</p>
				</div>

				<div class="group p-8 bg-surface rounded-2xl border border-subtle shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300">
					<div class="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
						<svg class="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-primary mb-3">AI Chatbot</h3>
					<p class="text-base text-muted leading-relaxed">Intelligent RAG chatbot for context-aware conversations and support.</p>
				</div>
			</div>
		</div>
	</main>

	<!-- Footer -->
	<footer class="border-t border-subtle bg-surface">
		<div class="max-w-7xl mx-auto py-8 px-4 text-center">
			<p class="text-sm text-muted">
				Built with using SvelteKit, PostgreSQL , Drizzle ORM & Python Embedded Api.
				
			</p>
		</div>
	</footer>
</div>

<style>
	@keyframes fade-in {
		from { opacity: 0; transform: translateY(20px); }
		to { opacity: 1; transform: translateY(0); }
	}
	.animate-fade-in {
		opacity: 0;
		animation: fade-in 0.6s ease-out forwards;
	}
</style>