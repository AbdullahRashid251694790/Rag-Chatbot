<script lang="ts">
	import MarkdownRenderer from './MarkdownRenderer.svelte';
	import BranchNavigator from './BranchNavigator.svelte';

	interface DocumentInfo {
		id: string;
		name: string;
		status: 'processing' | 'ready' | 'error';
	}

	interface Citation {
		sourceIndex: number;
		documentName: string;
	}

	interface BranchInfo {
		currentBranch: number;
		totalBranches: number;
		previousId: string | null;
		nextId: string | null;
	}

	interface Props {
		role: 'user' | 'assistant';
		content: string;
		isLoading?: boolean;
		isStreaming?: boolean;
		document?: DocumentInfo | null;
		citations?: Citation[];
		timestamp?: Date;
		onRegenerate?: () => void;
		showRegenerate?: boolean;
		onEdit?: (newContent: string) => void;
		branchInfo?: BranchInfo | null;
		onSwitchBranch?: (messageId: string) => void;
	}

	let { 
		role, 
		content, 
		isLoading = false, 
		isStreaming = false,
		document = null,
		citations = [],
		timestamp,
		onRegenerate,
		showRegenerate = false,
		onEdit,
		branchInfo = null,
		onSwitchBranch
	}: Props = $props();

	let copied = $state(false);
	let editing = $state(false);
	let editContent = $state('');

	function formatTime(date: Date): string {
		return date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	async function copyMessage() {
		try {
			await navigator.clipboard.writeText(content);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}

	function startEdit() {
		editContent = content;
		editing = true;
	}

	function cancelEdit() {
		editing = false;
		editContent = '';
	}

	function submitEdit() {
		if (editContent.trim() && onEdit) {
			onEdit(editContent.trim());
			editing = false;
			editContent = '';
		}
	}

	function handleEditKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			submitEdit();
		} else if (e.key === 'Escape') {
			cancelEdit();
		}
	}

	function handlePreviousBranch() {
		if (branchInfo?.previousId && onSwitchBranch) {
			onSwitchBranch(branchInfo.previousId);
		}
	}

	function handleNextBranch() {
		if (branchInfo?.nextId && onSwitchBranch) {
			onSwitchBranch(branchInfo.nextId);
		}
	}
</script>

<div 
	class="flex gap-3 {role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in group"
	role="article"
	aria-label="{role === 'user' ? 'Your message' : 'Assistant response'}"
>
	<!-- Avatar -->
	<div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center {role === 'user' ? 'bg-[var(--primary)]' : 'bg-[var(--bg-elevated)]'}">
		{#if role === 'user'}
			<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
			</svg>
		{:else}
			<svg class="w-5 h-5 text-[color:var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
			</svg>
		{/if}
	</div>

	<!-- Message Content -->
	<div class="flex-1 max-w-[80%] {role === 'user' ? 'text-right' : ''}">
		<!-- Branch Navigator -->
		{#if branchInfo && branchInfo.totalBranches > 1}
			<div class="mb-2 {role === 'user' ? 'flex justify-end' : ''}">
				<BranchNavigator
					currentBranch={branchInfo.currentBranch}
					totalBranches={branchInfo.totalBranches}
					onPrevious={handlePreviousBranch}
					onNext={handleNextBranch}
				/>
			</div>
		{/if}

	<!-- Document Attachment (for user messages) -->
{#if role === 'user' && document}
	<div class="mb-2 {role === 'user' ? 'flex justify-end' : ''}">
		<div class="inline-flex items-center gap-3 px-4 py-3 bg-surface border border-subtle rounded-xl shadow-sm max-w-xs">
			<!-- File Icon -->
			<div class="flex-shrink-0 w-10 h-10 bg-[var(--primary-light)] rounded-lg flex items-center justify-center">
				{#if document.status === 'processing'}
					<div class="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin"></div>
				{:else if document.status === 'error'}
					<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
					</svg>
				{:else}
					<svg class="w-5 h-5 text-[color:var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
					</svg>
				{/if}
			</div>
			
			<!-- File Name -->
			<p class="text-sm font-medium text-primary truncate max-w-[180px]">{document.name}</p>
		</div>
	</div>
{/if}

		<!-- Message Bubble -->
		{#if editing}
			<!-- Edit Mode -->
			<div class="inline-block w-full max-w-md">
				<textarea
					bind:value={editContent}
					onkeydown={handleEditKeydown}
					class="w-full p-3 border border-[var(--primary)]/70 bg-[var(--bg-elevated)] text-primary rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[color:rgba(99,102,241,0.35)] resize-none"
					rows="3"
				></textarea>
				<div class="flex justify-end gap-2 mt-2">
					<button
						onclick={cancelEdit}
						class="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
					>
						Cancel
					</button>
					<button
						onclick={submitEdit}
						class="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
					>
						Save & Submit
					</button>
				</div>
			</div>
		{:else}
			<!-- Normal Display -->
			<div class="inline-block rounded-2xl px-4 py-3 {role === 'user' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--bg-elevated)] border border-subtle text-primary'} {role === 'user' ? '' : 'text-left'} shadow-sm">
				{#if isLoading}
					<div class="flex items-center gap-1.5 py-1">
						<div class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0ms;"></div>
						<div class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 150ms;"></div>
						<div class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 300ms;"></div>
					</div>
				{:else}
					<div class="{role === 'user' ? 'text-white' : 'text-primary'}">
						{#if role === 'assistant'}
							<MarkdownRenderer {content} />
						{:else}
							<p class="whitespace-pre-wrap">{content}</p>
						{/if}
					</div>
					{#if isStreaming}
						<span class="inline-block w-2 h-4 ml-1 bg-current animate-pulse"></span>
					{/if}
				{/if}
			</div>
		{/if}

		<!-- Citations (for assistant messages) -->
		{#if role === 'assistant' && citations && citations.length > 0}
			<div class="mt-2 flex flex-wrap gap-2">
				{#each citations as citation}
					<span class="inline-flex items-center gap-1 px-2 py-1 bg-[var(--primary-light)] rounded text-xs text-muted">
						<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
						</svg>
						[Source {citation.sourceIndex}]: {citation.documentName}
					</span>
				{/each}
			</div>
		{/if}

		<!-- Action Buttons & Timestamp Row -->
		{#if !editing}
			<div class="mt-2 flex items-center gap-2 {role === 'user' ? 'justify-end' : 'justify-start'}">
				<!-- Action Buttons -->
				{#if content && !isLoading && !isStreaming}
					<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
						<!-- Edit Button (for user messages) -->
						{#if role === 'user' && onEdit}
							<button
								onclick={startEdit}
								class="p-1.5 text-slate-400 hover:text-primary hover:bg-[var(--bg-subtle)] rounded-lg transition-colors"
								title="Edit message"
								aria-label="Edit message"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
								</svg>
							</button>
						{/if}

						<!-- Copy Button -->
<button
	onclick={copyMessage}
	class="p-1.5 text-slate-400 hover:text-primary hover:bg-[var(--bg-subtle)] rounded-lg transition-colors"
	title={copied ? 'Copied!' : 'Copy message'}
	aria-label={copied ? 'Message copied to clipboard' : 'Copy message to clipboard'}
	aria-live="polite"
>
							{#if copied}
								<svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
								</svg>
							{:else}
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
								</svg>
							{/if}
						</button>

						<!-- Regenerate Button (for assistant messages) -->
						{#if role === 'assistant' && showRegenerate && onRegenerate}
							<button
								onclick={onRegenerate}
								class="p-1.5 text-slate-400 hover:text-primary hover:bg-[var(--bg-subtle)] rounded-lg transition-colors"
								title="Regenerate response"
								aria-label="Regenerate response"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
								</svg>
							</button>
						{/if}
					</div>
				{/if}

				<!-- Timestamp -->
				{#if timestamp}
					<p class="text-xs text-slate-400">
						{formatTime(timestamp)}
					</p>
				{/if}
			</div>
		{/if}
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