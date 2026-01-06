<script lang="ts">
	import { onMount } from 'svelte';
	import { marked } from 'marked';
	import hljs from 'highlight.js';

	interface Props {
		content: string;
	}

	let { content }: Props = $props();

	let renderedContent = $state('');
	let containerRef = $state<HTMLDivElement | null>(null);

	// Configure marked with syntax highlighting
	marked.setOptions({
		gfm: true,
		breaks: true
	});

	// Custom renderer for code blocks
	// Custom renderer for code blocks
const renderer = new marked.Renderer();

renderer.code = function ({ text, lang, escaped }: { text: string; lang?: string; escaped?: boolean }) {
	const code = text;
	const language = lang;
	const validLanguage = language && hljs.getLanguage(language) ? language : 'plaintext';
	const highlighted = hljs.highlight(code, { language: validLanguage }).value;
	const langLabel = language || 'code';
		return `
			<div class="code-block-wrapper">
				<div class="code-block-header">
					<span class="code-language">${langLabel}</span>
					<button class="copy-code-btn" onclick="copyCode(this)" title="Copy code">
						<svg class="copy-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
							<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
						</svg>
						<svg class="check-icon hidden" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
						<span class="copy-text">Copy</span>
					</button>
				</div>
				<pre><code class="hljs language-${validLanguage}">${highlighted}</code></pre>
			</div>
		`;
	};

	// Render markdown when content changes
	$effect(() => {
		if (content) {
			renderedContent = marked(content, { renderer }) as string;
		} else {
			renderedContent = '';
		}
	});

	// Add copy function to window for inline onclick handlers
	onMount(() => {
		(window as any).copyCode = async function(button: HTMLButtonElement) {
			const wrapper = button.closest('.code-block-wrapper');
			const code = wrapper?.querySelector('code')?.textContent || '';
			
			try {
				await navigator.clipboard.writeText(code);
				
				// Show success state
				const copyIcon = button.querySelector('.copy-icon');
				const checkIcon = button.querySelector('.check-icon');
				const copyText = button.querySelector('.copy-text');
				
				copyIcon?.classList.add('hidden');
				checkIcon?.classList.remove('hidden');
				if (copyText) copyText.textContent = 'Copied!';
				
				// Reset after 2 seconds
				setTimeout(() => {
					copyIcon?.classList.remove('hidden');
					checkIcon?.classList.add('hidden');
					if (copyText) copyText.textContent = 'Copy';
				}, 2000);
			} catch (err) {
				console.error('Failed to copy:', err);
			}
		};

		return () => {
			delete (window as any).copyCode;
		};
	});
</script>

<div bind:this={containerRef} class="markdown-content">
	{@html renderedContent}
</div>

<style>
	.markdown-content {
		line-height: 1.6;
		word-wrap: break-word;
	}

	/* Headings */
	.markdown-content :global(h1) {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 1rem 0 0.5rem;
	}

	.markdown-content :global(h2) {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 1rem 0 0.5rem;
	}

	.markdown-content :global(h3) {
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0.75rem 0 0.5rem;
	}

	/* Paragraphs */
	.markdown-content :global(p) {
		margin: 0.5rem 0;
	}

	.markdown-content :global(p:first-child) {
		margin-top: 0;
	}

	.markdown-content :global(p:last-child) {
		margin-bottom: 0;
	}

	/* Lists */
	.markdown-content :global(ul),
	.markdown-content :global(ol) {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}

	.markdown-content :global(li) {
		margin: 0.25rem 0;
	}

	/* Inline code */
	.markdown-content :global(code:not(pre code)) {
		background: rgba(0, 0, 0, 0.1);
		padding: 0.15rem 0.4rem;
		border-radius: 0.25rem;
		font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
		font-size: 0.875em;
	}

	/* Code block wrapper */
	.markdown-content :global(.code-block-wrapper) {
		margin: 0.75rem 0;
		border-radius: 0.5rem;
		overflow: hidden;
		background: #1e293b;
	}

	/* Code block header */
	.markdown-content :global(.code-block-header) {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 1rem;
		background: #334155;
		border-bottom: 1px solid #475569;
	}

	.markdown-content :global(.code-language) {
		font-size: 0.75rem;
		font-weight: 500;
		color: #94a3b8;
		text-transform: lowercase;
	}

	.markdown-content :global(.copy-code-btn) {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem;
		background: transparent;
		border: none;
		color: #94a3b8;
		font-size: 0.75rem;
		cursor: pointer;
		border-radius: 0.25rem;
		transition: all 0.2s;
	}

	.markdown-content :global(.copy-code-btn:hover) {
		background: rgba(255, 255, 255, 0.1);
		color: #e2e8f0;
	}

	.markdown-content :global(.copy-code-btn .hidden) {
		display: none;
	}

	/* Code block content */
	.markdown-content :global(pre) {
		margin: 0;
		padding: 1rem;
		overflow-x: auto;
	}

	.markdown-content :global(pre code) {
		font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
		font-size: 0.875rem;
		line-height: 1.5;
		color: #e2e8f0;
	}

	/* Highlight.js theme overrides */
	.markdown-content :global(.hljs-keyword) {
		color: #c792ea;
	}

	.markdown-content :global(.hljs-string) {
		color: #c3e88d;
	}

	.markdown-content :global(.hljs-number) {
		color: #f78c6c;
	}

	.markdown-content :global(.hljs-function) {
		color: #82aaff;
	}

	.markdown-content :global(.hljs-comment) {
		color: #697098;
		font-style: italic;
	}

	.markdown-content :global(.hljs-variable),
	.markdown-content :global(.hljs-attr) {
		color: #f07178;
	}

	.markdown-content :global(.hljs-built_in) {
		color: #ffcb6b;
	}

	.markdown-content :global(.hljs-title) {
		color: #82aaff;
	}

	.markdown-content :global(.hljs-params) {
		color: #e2e8f0;
	}

	.markdown-content :global(.hljs-meta) {
		color: #89ddff;
	}

	/* Blockquotes */
	.markdown-content :global(blockquote) {
		margin: 0.75rem 0;
		padding: 0.5rem 1rem;
		border-left: 4px solid #6366f1;
		background: rgba(99, 102, 241, 0.1);
		border-radius: 0 0.25rem 0.25rem 0;
	}

	/* Links */
	.markdown-content :global(a) {
		color: #6366f1;
		text-decoration: underline;
	}

	.markdown-content :global(a:hover) {
		color: #4f46e5;
	}

	/* Tables */
	.markdown-content :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin: 0.75rem 0;
		font-size: 0.875rem;
	}

	.markdown-content :global(th),
	.markdown-content :global(td) {
		padding: 0.5rem;
		border: 1px solid #e2e8f0;
		text-align: left;
	}

	.markdown-content :global(th) {
		background: #f1f5f9;
		font-weight: 600;
	}

	/* Horizontal rule */
	.markdown-content :global(hr) {
		margin: 1rem 0;
		border: none;
		border-top: 1px solid #e2e8f0;
	}

	/* Strong and emphasis */
	.markdown-content :global(strong) {
		font-weight: 600;
	}

	.markdown-content :global(em) {
		font-style: italic;
	}
</style>