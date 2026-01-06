<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	type Theme = 'light' | 'dark';

	let theme: Theme = 'light';

	function applyTheme(next: Theme) {
		if (!browser) return;
		theme = next;
		document.documentElement.dataset.theme = next;
		try {
			localStorage.setItem('theme', next);
		} catch {
			// ignore storage errors
		}
	}

	function toggleTheme() {
		applyTheme(theme === 'light' ? 'dark' : 'light');
	}

	onMount(() => {
		if (!browser) return;

		let initial: Theme = 'light';

		try {
			const stored = localStorage.getItem('theme') as Theme | null;
			if (stored === 'light' || stored === 'dark') {
				initial = stored;
			} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
				initial = 'dark';
			}
		} catch {
			// fall back to light
		}

		applyTheme(initial);
	});
</script>

<button
	type="button"
	class="inline-flex items-center justify-center rounded-full p-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-[var(--bg-elevated)] bg-[var(--bg-elevated)] border border-[var(--border)] shadow-sm hover:shadow-md transition-all duration-200 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
	onclick={toggleTheme}
	aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
>
	{#if theme === 'dark'}
		<!-- Sun icon -->
		<svg class="w-4 h-4 text-orange-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
			<circle cx="12" cy="12" r="4" stroke-width="1.8" />
			<path d="M12 3v2.5M12 18.5V21M4.22 4.22 5.9 5.9M18.1 18.1l1.68 1.68M3 12h2.5M18.5 12H21M4.22 19.78 5.9 18.1M18.1 5.9l1.68-1.68" stroke-width="1.8" stroke-linecap="round" />
		</svg>
	{:else}
		<!-- Moon icon -->
		<svg class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
			<path
				d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
				stroke-width="1.8"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	{/if}
</button>


