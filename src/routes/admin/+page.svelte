<script lang="ts">
	import { onMount } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	interface User {
		id: string;
		name: string | null;
		email: string;
		role: 'user' | 'admin';
		status: 'active' | 'disabled';
		emailVerified: string | null;
		image: string | null;
		createdAt: string;
		updatedAt: string;
	}

	interface Stats {
		totalUsers: number;
		adminCount: number;
		userCount: number;
		activeCount: number;
		disabledCount: number;
		verifiedCount: number;
	}

	interface Props {
		data: {
			user: {
				id: string;
				name?: string | null;
				email?: string | null;
				role: 'user' | 'admin';
			};
		};
	}

	let { data }: Props = $props();

	let users = $state<User[]>([]);
	let stats = $state<Stats | null>(null);
	let loading = $state(true);
	let error = $state('');
	let success = $state('');
	let actionLoading = $state<string | null>(null);
	let searchQuery = $state('');

	let filteredUsers = $derived(
		users.filter(user => 
			user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.email.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	onMount(async () => {
		await fetchUsers();
	});

	async function fetchUsers() {
		loading = true;
		error = '';

		try {
			const response = await fetch('/api/admin/users');
			const result = await response.json();

			if (!response.ok) {
				error = result.error || 'Failed to fetch users';
				return;
			}

			users = result.users;
			stats = result.stats;
		} catch (err) {
			error = 'An unexpected error occurred';
		} finally {
			loading = false;
		}
	}

	async function updateUser(userId: string, updates: { role?: string; status?: string }) {
		actionLoading = userId;
		error = '';
		success = '';

		try {
			const response = await fetch(`/api/admin/users/${userId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updates)
			});

			const result = await response.json();

			if (!response.ok) {
				error = result.error || 'Failed to update user';
				return;
			}

			success = result.message;
			await fetchUsers();
			
			// Auto-dismiss success message
			setTimeout(() => success = '', 3000);
		} catch (err) {
			error = 'An unexpected error occurred';
		} finally {
			actionLoading = null;
		}
	}

	async function deleteUser(userId: string) {
		if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
			return;
		}

		actionLoading = userId;
		error = '';
		success = '';

		try {
			const response = await fetch(`/api/admin/users/${userId}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (!response.ok) {
				error = result.error || 'Failed to delete user';
				return;
			}

			success = result.message;
			await fetchUsers();
			
			setTimeout(() => success = '', 3000);
		} catch (err) {
			error = 'An unexpected error occurred';
		} finally {
			actionLoading = null;
		}
	}

	async function handleSignOut() {
		await fetch('/api/auth/logout', { method: 'POST' });
		await invalidateAll();
		goto('/');
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function getInitials(name: string | null, email: string): string {
		if (name) {
			return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
		}
		return email[0].toUpperCase();
	}
</script>

<svelte:head>
	<title>Admin Dashboard - Auth App</title>
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
						<a href="/dashboard" class="px-4 py-2 rounded-lg text-sm font-medium text-muted hover:text-primary hover:bg-[var(--bg-subtle)] transition-colors">
							Dashboard
						</a>
						<a href="/chat" class="px-4 py-2 rounded-lg text-sm font-medium text-muted hover:text-primary hover:bg-[var(--bg-subtle)] transition-colors">
							Chat
						</a>
						<a href="/admin" class="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--primary-light)] text-[var(--primary)] transition-colors">
							Admin
						</a>
						<a href="/profile" class="px-4 py-2 rounded-lg text-sm font-medium text-muted hover:text-primary hover:bg-[var(--bg-subtle)] transition-colors">
							Profile
						</a>
					</div>
				</div>
				<div class="flex items-center gap-4">
					<ThemeToggle />
					<span class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--primary-light)] text-[var(--primary)]">
						<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
						</svg>
						Admin
					</span>
					<Button onclick={handleSignOut} variant="ghost" size="sm">Sign Out</Button>
				</div>
			</div>
		</div>
	</nav>

	<main class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="mb-8 animate-fade-in">
			<h1 class="text-3xl font-bold text-primary">Admin Dashboard</h1>
			<p class="mt-2 text-muted">Manage users and view system analytics</p>
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

		{#if loading}
			<div class="flex flex-col items-center justify-center py-20">
				<div class="w-12 h-12 border-4 border-[var(--primary-light)] border-t-[var(--primary)] rounded-full animate-spin"></div>
				<p class="mt-4 text-muted">Loading dashboard...</p>
			</div>
		{:else}
			<!-- Statistics Cards -->
			{#if stats}
				<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
					<div class="bg-surface rounded-2xl border border-subtle p-5 shadow-sm hover:shadow-md hover:border-[var(--primary)] transition-all duration-300 animate-fade-in" style="animation-delay: 0.1s">
						<div class="flex items-center gap-4">
							<div class="w-12 h-12 bg-[var(--primary-light)] rounded-xl flex items-center justify-center">
								<svg class="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
								</svg>
							</div>
							<div>
								<p class="text-sm text-muted">Total Users</p>
								<p class="text-2xl font-bold text-primary">{stats.totalUsers}</p>
							</div>
						</div>
					</div>

					<div class="bg-surface rounded-2xl border border-subtle p-5 shadow-sm hover:shadow-md hover:border-[var(--primary)] transition-all duration-300 animate-fade-in" style="animation-delay: 0.15s">
						<div class="flex items-center gap-4">
							<div class="w-12 h-12 bg-[var(--primary-light)] rounded-xl flex items-center justify-center">
								<svg class="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
								</svg>
							</div>
							<div>
								<p class="text-sm text-muted">Admins / Users</p>
								<p class="text-2xl font-bold text-primary">{stats.adminCount} / {stats.userCount}</p>
							</div>
						</div>
					</div>

					<div class="bg-surface rounded-2xl border border-subtle p-5 shadow-sm hover:shadow-md hover:border-[var(--primary)] transition-all duration-300 animate-fade-in" style="animation-delay: 0.2s">
						<div class="flex items-center gap-4">
							<div class="w-12 h-12 bg-[var(--primary-light)] rounded-xl flex items-center justify-center">
								<svg class="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
								</svg>
							</div>
							<div>
								<p class="text-sm text-muted">Active / Disabled</p>
								<p class="text-2xl font-bold text-primary">{stats.activeCount} / {stats.disabledCount}</p>
							</div>
						</div>
					</div>

					<div class="bg-surface rounded-2xl border border-subtle p-5 shadow-sm hover:shadow-md hover:border-[var(--primary)] transition-all duration-300 animate-fade-in" style="animation-delay: 0.25s">
						<div class="flex items-center gap-4">
							<div class="w-12 h-12 bg-[var(--primary-light)] rounded-xl flex items-center justify-center">
								<svg class="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
								</svg>
							</div>
							<div>
								<p class="text-sm text-muted">Verified Emails</p>
								<p class="text-2xl font-bold text-primary">{stats.verifiedCount}</p>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Users Table -->
			<div class="bg-surface rounded-2xl border border-subtle shadow-sm overflow-hidden animate-fade-in" style="animation-delay: 0.3s">
				<div class="px-6 py-4 border-b border-subtle bg-[var(--bg-subtle)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<h2 class="text-lg font-semibold text-primary">All Users</h2>
					<div class="relative">
						<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
						</svg>
						<input
							type="text"
							placeholder="Search users..."
							bind:value={searchQuery}
							class="pl-9 pr-4 py-2 text-sm border border-subtle bg-[var(--bg-elevated)] text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] w-full sm:w-64"
						/>
					</div>
				</div>
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead>
							<tr class="bg-[var(--bg-subtle)]">
								<th class="px-6 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">User</th>
								<th class="px-6 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Role</th>
								<th class="px-6 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
								<th class="px-6 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Verified</th>
								<th class="px-6 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Created</th>
								<th class="px-6 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-subtle">
							{#each filteredUsers as user (user.id)}
								<tr class="hover:bg-[var(--bg-subtle)] transition-colors duration-150 {user.id === data.user.id ? 'bg-[var(--primary-light)]/20' : ''}">
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="flex items-center gap-3">
											<div class="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
												{getInitials(user.name, user.email)}
											</div>
											<div class="min-w-0">
												<div class="text-sm font-medium text-primary truncate">
													{user.name || 'No name'}
													{#if user.id === data.user.id}
														<span class="ml-1.5 text-xs text-[var(--primary)] font-normal">(You)</span>
													{/if}
												</div>
												<div class="text-sm text-muted truncate">{user.email}</div>
											</div>
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium {
											user.role === 'admin' 
												? 'bg-[var(--primary-light)] text-[var(--primary)]' 
												: 'bg-[var(--bg-subtle)] text-muted'
										}">
											{user.role}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium {
											user.status === 'active' 
												? 'bg-emerald-100 text-emerald-700' 
												: 'bg-red-100 text-red-700'
										}">
											<span class="w-1.5 h-1.5 rounded-full {user.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}"></span>
											{user.status}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm">
										{#if user.emailVerified}
											<span class="text-emerald-600 flex items-center gap-1">
												<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
													<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
												</svg>
												Verified
											</span>
										{:else}
											<span class="text-slate-400">Not verified</span>
										{/if}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-muted">
										{formatDate(user.createdAt)}
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										{#if user.id !== data.user.id}
											<div class="flex items-center gap-2">
												<select
													class="text-xs border border-subtle bg-[var(--bg-elevated)] text-primary rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
													value={user.role}
													onchange={(e) => updateUser(user.id, { role: e.currentTarget.value })}
													disabled={actionLoading === user.id}
												>
													<option value="user">User</option>
													<option value="admin">Admin</option>
												</select>
												<button
													class="px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200 {
														user.status === 'active'
															? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
															: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
													}"
													onclick={() => updateUser(user.id, { status: user.status === 'active' ? 'disabled' : 'active' })}
													disabled={actionLoading === user.id}
												>
													{user.status === 'active' ? 'Disable' : 'Enable'}
												</button>
												<button
													class="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors duration-200"
													onclick={() => deleteUser(user.id)}
													disabled={actionLoading === user.id}
												>
													Delete
												</button>
											</div>
										{:else}
											<span class="text-xs text-muted italic">Cannot modify</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				{#if filteredUsers.length === 0}
					<div class="px-6 py-12 text-center">
						<svg class="w-12 h-12 mx-auto text-muted opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
						</svg>
						<p class="mt-4 text-muted">No users found matching "{searchQuery}"</p>
					</div>
				{/if}
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