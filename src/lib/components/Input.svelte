<script lang="ts">
	type AutocompleteValue = 'off' | 'on' | 'name' | 'email' | 'username' | 'new-password' | 'current-password' | 'tel' | 'url' | 'street-address' | 'country' | 'postal-code' | 'cc-name' | 'cc-number' | 'cc-exp' | 'cc-csc';

	interface Props {
		type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
		name: string;
		label?: string;
		value?: string;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		error?: string;
		autocomplete?: AutocompleteValue;
		icon?: 'email' | 'password' | 'user' | 'search';
	}

	let {
		type = 'text',
		name,
		label,
		value = $bindable(''),
		placeholder,
		required = false,
		disabled = false,
		error,
		autocomplete,
		icon
	}: Props = $props();

	let focused = $state(false);
</script>

<div class="space-y-1.5">
	{#if label}
		<label for={name} class="block text-sm font-medium text-primary">
			{label}
			{#if required}
				<span class="text-red-500 ml-0.5">*</span>
			{/if}
		</label>
	{/if}
	<div class="relative">
		{#if icon}
			<div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
				{#if icon === 'email'}
					<svg class="h-5 w-5 text-slate-400 transition-colors duration-200 {focused ? 'text-[var(--primary)]' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
					</svg>
				{:else if icon === 'password'}
					<svg class="h-5 w-5 text-slate-400 transition-colors duration-200 {focused ? 'text-[var(--primary)]' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
					</svg>
				{:else if icon === 'user'}
					<svg class="h-5 w-5 text-slate-400 transition-colors duration-200 {focused ? 'text-[var(--primary)]' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
					</svg>
				{:else if icon === 'search'}
					<svg class="h-5 w-5 text-slate-400 transition-colors duration-200 {focused ? 'text-[var(--primary)]' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
					</svg>
				{/if}
			</div>
		{/if}
		<input
			{type}
			{name}
			id={name}
			bind:value
			{placeholder}
			{required}
			{disabled}
			autocomplete={autocomplete ?? undefined}
			onfocus={() => focused = true}
			onblur={() => focused = false}
			class="
				block w-full rounded-xl border bg-[var(--bg-elevated)]
				transition-all duration-200 ease-out
				placeholder:text-muted
				focus:outline-none focus:ring-2 focus:ring-offset-0
				disabled:bg-[var(--bg-subtle)] disabled:text-muted disabled:cursor-not-allowed
				{icon ? 'pl-11 pr-4' : 'px-4'}
				py-3 text-sm
				{error 
					? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500/20' 
					: 'border-[var(--border)] text-primary focus:border-[var(--primary)] focus:ring-[color:rgba(99,102,241,0.2)] hover:border-slate-300'
				}
			"
		/>
	</div>
	{#if error}
		<p class="text-sm text-red-600 flex items-center gap-1.5 animate-fade-in">
			<svg class="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
			</svg>
			{error}
		</p>
	{/if}
</div>

<style>
	@keyframes fade-in {
		from { opacity: 0; transform: translateY(-4px); }
		to { opacity: 1; transform: translateY(0); }
	}
	.animate-fade-in {
		animation: fade-in 0.2s ease-out;
	}
</style>