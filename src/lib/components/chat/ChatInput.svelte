<script lang="ts">
	interface Props {
		onSend: (content: string, file?: File) => void;
		disabled?: boolean;
		placeholder?: string;
	}

	let { onSend, disabled = false, placeholder = 'Type your message...' }: Props = $props();

	let message = $state('');
	let selectedFile = $state<File | null>(null);
	let fileInputRef = $state<HTMLInputElement | null>(null);
	let textareaRef = $state<HTMLTextAreaElement | null>(null);

	const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
	const SUPPORTED_TYPES = [
		'text/plain',
		'text/markdown',
		'text/csv',
		'application/json'
	];
	const SUPPORTED_EXTENSIONS = '.txt, .md, .csv, .json';

	function handleSubmit() {
		if ((!message.trim() && !selectedFile) || disabled) return;

		onSend(message.trim(), selectedFile || undefined);
		message = '';
		selectedFile = null;
		
		// Reset textarea height
		if (textareaRef) {
			textareaRef.style.height = 'auto';
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	}

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) return;

		// Validate file size
		if (file.size > MAX_FILE_SIZE) {
			alert(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
			input.value = '';
			return;
		}

		// Validate file type
		if (!SUPPORTED_TYPES.includes(file.type) && !file.name.match(/\.(txt|md|csv|json)$/i)) {
			alert(`Unsupported file type. Supported: ${SUPPORTED_EXTENSIONS}`);
			input.value = '';
			return;
		}

		selectedFile = file;
		input.value = ''; // Reset input so same file can be selected again
	}

	function removeFile() {
		selectedFile = null;
	}

	function openFilePicker() {
		fileInputRef?.click();
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	function autoResize(e: Event) {
		const textarea = e.target as HTMLTextAreaElement;
		textarea.style.height = 'auto';
		textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
	}
</script>

<div class="border-t border-subtle bg-[var(--bg-elevated)] p-4">
	<!-- Selected File Preview -->
	{#if selectedFile}
		<div class="mb-3 flex items-center gap-2 p-2 bg-[var(--bg-subtle)] rounded-lg border border-subtle" role="status" aria-live="polite">
			<div class="w-8 h-8 bg-[var(--primary-light)] rounded flex items-center justify-center flex-shrink-0" aria-hidden="true">
				<svg class="w-4 h-4 text-[color:var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
				</svg>
			</div>
			<div class="flex-1 min-w-0">
				<p class="text-sm font-medium text-primary truncate">{selectedFile.name}</p>
				<p class="text-xs text-muted">{formatFileSize(selectedFile.size)}</p>
			</div>
			<button
				onclick={removeFile}
				class="p-1 text-slate-400 hover:text-primary hover:bg-[var(--bg-subtle)] rounded transition-colors"
				aria-label="Remove selected file"
				title="Remove file"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
				</svg>
			</button>
		</div>
	{/if}

	<!-- Input Area -->
	<div class="flex items-end gap-2">
		<!-- File Upload Button -->
		<input
			bind:this={fileInputRef}
			type="file"
			accept={SUPPORTED_EXTENSIONS}
			onchange={handleFileSelect}
			class="hidden"
			aria-hidden="true"
			tabindex="-1"
		/>
		<button
			onclick={openFilePicker}
			disabled={disabled}
			class="flex-shrink-0 p-2.5 text-slate-500 hover:text-primary hover:bg-[var(--bg-subtle)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			aria-label="Attach a file (supported: {SUPPORTED_EXTENSIONS})"
			title="Attach file ({SUPPORTED_EXTENSIONS})"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
			</svg>
		</button>

		<!-- Text Input -->
		<div class="flex-1 relative">
			<label for="chat-message-input" class="sr-only">Message</label>
			<textarea
				bind:this={textareaRef}
				id="chat-message-input"
				bind:value={message}
				onkeydown={handleKeydown}
				oninput={autoResize}
				{placeholder}
				{disabled}
				rows="1"
				class="w-full px-4 py-2.5 border border-subtle bg-[var(--bg-elevated)] text-primary rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[color:rgba(99,102,241,0.25)] focus:border-[var(--primary)] disabled:bg-[var(--bg-subtle)] disabled:text-muted transition-colors"
				style="max-height: 200px;"
				aria-describedby="chat-input-hint"
			></textarea>
			<p id="chat-input-hint" class="sr-only">Press Enter to send, Shift+Enter for new line</p>
		</div>

		<!-- Send Button -->
		<button
			onclick={handleSubmit}
			disabled={disabled || (!message.trim() && !selectedFile)}
			class="flex-shrink-0 p-2.5 bg-[var(--primary)] text-white rounded-xl hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--primary)]"
			aria-label="Send message"
			title="Send (Enter)"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
			</svg>
		</button>
	</div>

	<!-- Keyboard hint -->
	<p class="mt-2 text-xs text-slate-400 text-center" aria-hidden="true">
		Press <kbd class="px-1.5 py-0.5 bg-[var(--bg-subtle)] rounded text-muted font-mono text-xs">Enter</kbd> to send, 
		<kbd class="px-1.5 py-0.5 bg-[var(--bg-subtle)] rounded text-muted font-mono text-xs">Shift + Enter</kbd> for new line
	</p>
</div>