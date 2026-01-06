<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		type?: 'success' | 'error' | 'warning' | 'info';
		dismissible?: boolean;
		children: Snippet;
	}

	let { type = 'info', dismissible = false, children }: Props = $props();
	let visible = $state(true);

	const config = {
		success: {
			bg: 'bg-emerald-50',
			border: 'border-emerald-200',
			text: 'text-emerald-800',
			icon: 'text-emerald-500'
		},
		error: {
			bg: 'bg-red-50',
			border: 'border-red-200',
			text: 'text-red-800',
			icon: 'text-red-500'
		},
		warning: {
			bg: 'bg-amber-50',
			border: 'border-amber-200',
			text: 'text-amber-800',
			icon: 'text-amber-500'
		},
		info: {
			bg: 'bg-sky-50',
			border: 'border-sky-200',
			text: 'text-sky-800',
			icon: 'text-sky-500'
		}
	};

	let styles = $derived(config[type]);
</script>

{#if visible}
	<div class="
		{styles.bg} {styles.border} {styles.text}
		border rounded-xl p-4
		flex items-start gap-3
		animate-fade-in
	">
		<div class="{styles.icon} flex-shrink-0 mt-0.5">
			{#if type === 'success'}
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
				</svg>
			{:else if type === 'error'}
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
				</svg>
			{:else if type === 'warning'}
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
				</svg>
			{:else}
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
				</svg>
			{/if}
		</div>
		<div class="flex-1 text-sm font-medium">
			{@render children()}
		</div>
		{#if dismissible}
			<button
				onclick={() => visible = false}
				aria-label="Dismiss alert"
				class="{styles.icon} hover:opacity-70 transition-opacity duration-200 flex-shrink-0"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
				</svg>
			</button>
		{/if}
	</div>
{/if}

<style>
	@keyframes fade-in {
		from { opacity: 0; transform: translateY(-8px); }
		to { opacity: 1; transform: translateY(0); }
	}
	.animate-fade-in {
		animation: fade-in 0.3s ease-out;
	}
</style>