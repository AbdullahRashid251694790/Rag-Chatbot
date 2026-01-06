<script lang="ts">
	interface Props {
		currentBranch: number;
		totalBranches: number;
		onPrevious: () => void;
		onNext: () => void;
	}

	let { currentBranch, totalBranches, onPrevious, onNext }: Props = $props();
</script>

{#if totalBranches > 1}
	<div class="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg text-xs text-slate-600">
		<button
			onclick={onPrevious}
			disabled={currentBranch <= 1}
			class="p-0.5 hover:bg-slate-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
			aria-label="Previous branch"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
			</svg>
		</button>
		<span class="min-w-[3ch] text-center font-medium">{currentBranch}/{totalBranches}</span>
		<button
			onclick={onNext}
			disabled={currentBranch >= totalBranches}
			class="p-0.5 hover:bg-slate-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
			aria-label="Next branch"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
			</svg>
		</button>
	</div>
{/if}