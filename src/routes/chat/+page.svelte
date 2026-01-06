<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import ChatMessage from '$lib/components/chat/ChatMessage.svelte';
	import ChatInput from '$lib/components/chat/ChatInput.svelte';
	import ConversationList from '$lib/components/chat/ConversationList.svelte';

	interface BranchInfo {
		currentBranch: number;
		totalBranches: number;
		previousId: string | null;
		nextId: string | null;
	}

	interface Message {
		id: string;
		role: 'user' | 'assistant';
		content: string;
		isStreaming?: boolean;
		document?: {
			id: string;
			name: string;
			status: 'processing' | 'ready' | 'error';
		};
		citations?: Array<{
			sourceIndex: number;
			documentName: string;
		}>;
		timestamp?: Date;
		branchInfo?: BranchInfo | null;
	}

	interface Conversation {
		id: string;
		title: string;
		createdAt: string;
		updatedAt: string;
	}

	interface Props {
		data: {
			user: {
				id: string;
				name?: string | null;
				email?: string | null;
				role?: 'user' | 'admin';
			};
		};
	}

	let { data }: Props = $props();

	let conversations = $state<Conversation[]>([]);
	let messages = $state<Message[]>([]);
	let activeConversationId = $state<string | null>(null);
	let sending = $state(false);
	let loading = $state(true);
	let error = $state('');
	let sidebarOpen = $state(false);
	let messagesContainer = $state<HTMLDivElement | null>(null);

	onMount(() => {
		loadConversations();
	});

	async function loadConversations() {
		try {
			const response = await fetch('/api/chat/conversations');
			if (response.ok) {
				const data = await response.json();
				conversations = data.conversations;
			}
		} catch (err) {
			console.error('Failed to load conversations:', err);
		} finally {
			loading = false;
		}
	}

	async function loadMessages(conversationId: string) {
		loading = true;
		error = '';

		try {
			const response = await fetch(`/api/chat/conversations/${conversationId}`);
			if (response.ok) {
				const data = await response.json();
				messages = data.messages.map((m: any) => ({
					id: m.id,
					role: m.role,
					content: m.content,
					timestamp: new Date(m.createdAt),
					branchInfo: m.branchInfo || null,
					document: m.document || null
				}));
				activeConversationId = conversationId;
			} else {
				error = 'Failed to load messages';
			}
		} catch (err) {
			error = 'Failed to load messages';
		} finally {
			loading = false;
			sidebarOpen = false;
			await tick();
			scrollToBottom();
		}
	}

	function scrollToBottom() {
		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	}

	async function sendMessage(content: string, file?: File) {
		if ((!content.trim() && !file) || sending) return;

		sending = true;
		error = '';

		const userMessage: Message = {
			id: crypto.randomUUID(),
			role: 'user',
			content: content || '',
			document: file ? { id: '', name: file.name, status: 'processing' as const } : undefined,
			timestamp: new Date()
		};
		messages = [...messages, userMessage];

		const assistantMessage: Message = {
			id: crypto.randomUUID(),
			role: 'assistant',
			content: '',
			isStreaming: true,
			timestamp: new Date()
		};
		messages = [...messages, assistantMessage];

		await tick();
		scrollToBottom();

		try {
			let requestBody: FormData | string;
			let headers: HeadersInit = {};

			if (file) {
				const formData = new FormData();
				formData.append('message', content);
				formData.append('file', file);
				if (activeConversationId) {
					formData.append('conversationId', activeConversationId);
				}
				requestBody = formData;
			} else {
				requestBody = JSON.stringify({
					message: content,
					conversationId: activeConversationId
				});
				headers = { 'Content-Type': 'application/json' };
			}

			const response = await fetch('/api/chat', {
				method: 'POST',
				headers,
				body: requestBody
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to send message');
			}

			const reader = response.body?.getReader();
			const decoder = new TextDecoder();

			if (!reader) {
				throw new Error('No response body');
			}

			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					if (line.startsWith('data: ')) {
						const jsonStr = line.slice(6);
						try {
							const streamData = JSON.parse(jsonStr);

							if (streamData.conversationId && !activeConversationId) {
								activeConversationId = streamData.conversationId;
							}

							if (streamData.isNewConversation) {
								await loadConversations();
							}

							if (streamData.document) {
								messages = messages.map((m) =>
									m.id === userMessage.id ? { ...m, document: streamData.document } : m
								);
							}

							if (streamData.citations && streamData.citations.length > 0) {
								messages = messages.map((m) =>
									m.id === assistantMessage.id ? { ...m, citations: streamData.citations } : m
								);
							}

							if (streamData.text) {
								messages = messages.map((m) =>
									m.id === assistantMessage.id ? { ...m, content: m.content + streamData.text } : m
								);
								scrollToBottom();
							}

							if (streamData.title) {
								conversations = conversations.map((c) =>
									c.id === activeConversationId ? { ...c, title: streamData.title } : c
								);
							}

							if (streamData.done) {
								messages = messages.map((m) =>
									m.id === assistantMessage.id ? { ...m, isStreaming: false } : m
								);
								// Reload messages to get real database IDs (needed for edit/branching)
								if (activeConversationId) {
									await loadMessages(activeConversationId);
								}
							}

							if (streamData.error) {
								throw new Error(streamData.error);
							}
						} catch (parseError) {
							console.error('Error parsing SSE data:', parseError);
						}
					}
				}
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to send message';
			messages = messages.filter((m) => m.id !== assistantMessage.id);
		} finally {
			sending = false;
		}
	}

	async function editMessage(messageId: string, newContent: string) {
		if (!activeConversationId || sending) return;

		sending = true;
		error = '';

		const messageIndex = messages.findIndex((m) => m.id === messageId);
		if (messageIndex === -1) {
			sending = false;
			return;
		}

		const parentIndex = messageIndex - 1;

		if (parentIndex >= 0) {
			messages = messages.slice(0, parentIndex + 1);
		} else {
			messages = [];
		}

		const newUserMessage: Message = {
			id: crypto.randomUUID(),
			role: 'user',
			content: newContent,
			timestamp: new Date()
		};
		messages = [...messages, newUserMessage];

		const assistantMessage: Message = {
			id: crypto.randomUUID(),
			role: 'assistant',
			content: '',
			isStreaming: true,
			timestamp: new Date()
		};
		messages = [...messages, assistantMessage];

		await tick();
		scrollToBottom();

		try {
			const response = await fetch('/api/chat/edit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					conversationId: activeConversationId,
					messageId,
					newContent
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to edit message');
			}

			const reader = response.body?.getReader();
			const decoder = new TextDecoder();

			if (!reader) {
				throw new Error('No response body');
			}

			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					if (line.startsWith('data: ')) {
						const jsonStr = line.slice(6);
						try {
							const streamData = JSON.parse(jsonStr);

							if (streamData.citations && streamData.citations.length > 0) {
								messages = messages.map((m) =>
									m.id === assistantMessage.id ? { ...m, citations: streamData.citations } : m
								);
							}

							if (streamData.text) {
								messages = messages.map((m) =>
									m.id === assistantMessage.id ? { ...m, content: m.content + streamData.text } : m
								);
								scrollToBottom();
							}

							if (streamData.done) {
								messages = messages.map((m) =>
									m.id === assistantMessage.id ? { ...m, isStreaming: false } : m
								);
								await loadMessages(activeConversationId!);
							}

							if (streamData.error) {
								throw new Error(streamData.error);
							}
						} catch (parseError) {
							if (parseError instanceof Error && parseError.message !== 'Failed to edit message') {
								console.error('Error parsing SSE data:', parseError);
							} else {
								throw parseError;
							}
						}
					}
				}
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to edit message';
			await loadMessages(activeConversationId!);
		} finally {
			sending = false;
		}
	}

	async function regenerateLastResponse() {
		if (!activeConversationId || sending) return;

		const lastAssistantIndex = messages.findLastIndex((m) => m.role === 'assistant');
		if (lastAssistantIndex === -1) return;

		sending = true;
		error = '';

		const originalMessageId = messages[lastAssistantIndex].id;

		const newAssistantMessage: Message = {
			id: crypto.randomUUID(),
			role: 'assistant',
			content: '',
			isStreaming: true,
			timestamp: new Date()
		};

		messages = [
			...messages.slice(0, lastAssistantIndex),
			newAssistantMessage
		];

		try {
			const response = await fetch('/api/chat/regenerate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					conversationId: activeConversationId,
					messageId: originalMessageId
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to regenerate');
			}

			const reader = response.body?.getReader();
			const decoder = new TextDecoder();

			if (!reader) {
				throw new Error('No response body');
			}

			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					if (line.startsWith('data: ')) {
						const jsonStr = line.slice(6);
						try {
							const streamData = JSON.parse(jsonStr);

							if (streamData.citations && streamData.citations.length > 0) {
								messages = messages.map((m) =>
									m.id === newAssistantMessage.id ? { ...m, citations: streamData.citations } : m
								);
							}

							if (streamData.text) {
								messages = messages.map((m) =>
									m.id === newAssistantMessage.id ? { ...m, content: m.content + streamData.text } : m
								);
								scrollToBottom();
							}

							if (streamData.done) {
								messages = messages.map((m) =>
									m.id === newAssistantMessage.id ? { ...m, isStreaming: false } : m
								);
								await loadMessages(activeConversationId!);
							}

							if (streamData.error) {
								throw new Error(streamData.error);
							}
						} catch (parseError) {
							console.error('Error parsing SSE data:', parseError);
						}
					}
				}
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to regenerate';
			await loadMessages(activeConversationId!);
		} finally {
			sending = false;
		}
	}

	async function switchBranch(messageId: string) {
		if (!activeConversationId) return;

		try {
			const response = await fetch('/api/chat/branch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messageId,
					conversationId: activeConversationId
				})
			});

			if (response.ok) {
				const responseData = await response.json();
				messages = responseData.messages.map((m: any) => ({
					id: m.id,
					role: m.role,
					content: m.content,
					timestamp: new Date(m.createdAt),
					branchInfo: m.branchInfo || null,
					document: m.document || null
				}));
			}
		} catch (err) {
			console.error('Failed to switch branch:', err);
		}
	}

	async function deleteConversation(conversationId: string) {
		try {
			const response = await fetch(`/api/chat/conversations/${conversationId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				conversations = conversations.filter((c) => c.id !== conversationId);
				if (activeConversationId === conversationId) {
					activeConversationId = null;
					messages = [];
				}
			}
		} catch (err) {
			console.error('Failed to delete conversation:', err);
		}
	}

	async function renameConversation(conversationId: string, newTitle: string) {
		try {
			const response = await fetch(`/api/chat/conversations/${conversationId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: newTitle })
			});

			if (response.ok) {
				conversations = conversations.map((c) =>
					c.id === conversationId ? { ...c, title: newTitle } : c
				);
			}
		} catch (err) {
			console.error('Failed to rename conversation:', err);
		}
	}

	function startNewChat() {
		activeConversationId = null;
		messages = [];
		sidebarOpen = false;
	}

	async function handleSignOut() {
		await fetch('/api/auth/logout', { method: 'POST' });
		await invalidateAll();
		goto('/');
	}

	function isLastAssistantMessage(message: Message): boolean {
		const lastAssistantIndex = messages.findLastIndex((m) => m.role === 'assistant');
		return messages.indexOf(message) === lastAssistantIndex;
	}
</script>

<svelte:head>
	<title>Chat - Auth App</title>
</svelte:head>

<!-- Skip to main content link for keyboard users -->
<a 
	href="#chat-main" 
	class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:outline-none"
>
	Skip to chat
</a>

<div class="h-screen flex flex-col chat-shell">
	<!-- Top Navigation -->
	<nav class="flex-shrink-0 nav-surface px-4 py-3">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-4">
				<button
					onclick={() => (sidebarOpen = !sidebarOpen)}
					class="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
					aria-label="Toggle sidebar"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
					</svg>
				</button>

				<a href="/" class="flex items-center gap-2">
					<div class="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
						<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
						</svg>
					</div>
					<span class="text-xl font-bold text-primary hidden sm:block">AI Chat</span>
				</a>
			</div>

			<div class="flex items-center gap-2">
				<ThemeToggle />
				<a href="/dashboard" class="text-sm text-muted hover:text-primary transition-colors">
					Dashboard
				</a>
				{#if data.user?.role === 'admin'}
					<a href="/admin" class="text-sm text-muted hover:text-primary transition-colors">
						Admin
					</a>
				{/if}
				<Button onclick={handleSignOut} variant="ghost" size="sm">Sign Out</Button>
			</div>
		</div>
	</nav>

	<div class="flex-1 flex overflow-hidden">
		<!-- Sidebar -->
		<aside
			class="fixed inset-y-0 left-0 z-40 w-72 bg-[var(--bg-elevated)] border-r border-subtle transform transition-transform duration-300 lg:relative lg:translate-x-0 {sidebarOpen ? 'translate-x-0' : '-translate-x-full'}"
			style="top: 57px;"
		>
			<div class="h-full overflow-y-auto">
				<ConversationList
					{conversations}
					activeId={activeConversationId}
					onSelect={loadMessages}
					onDelete={deleteConversation}
					onRename={renameConversation}
					onNewChat={startNewChat}
				/>
			</div>
		</aside>

		<!-- Overlay for mobile -->
		{#if sidebarOpen}
			<div
				class="fixed inset-0 z-30 bg-black/50 lg:hidden"
				onclick={() => (sidebarOpen = false)}
				onkeydown={(e) => e.key === 'Escape' && (sidebarOpen = false)}
				role="button"
				tabindex="0"
				aria-label="Close sidebar"
			></div>
		{/if}

		<!-- Main Chat Area -->
		<!-- svelte-ignore a11y_no_redundant_roles -->
		<main id="chat-main" class="flex-1 flex flex-col min-w-0" role="main" aria-label="Chat conversation">
			{#if loading && messages.length === 0}
				<div class="flex-1 flex items-center justify-center">
					<div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
				</div>
			{:else if messages.length === 0}
				<!-- Empty State -->
				<div class="flex-1 flex items-center justify-center p-8">
					<div class="text-center max-w-md">
						<div class="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
							<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
							</svg>
						</div>
						<h2 class="text-2xl font-bold text-slate-900 mb-2">Start a Conversation</h2>
						<p class="text-slate-600 mb-6">
							Ask me anything! You can also attach documents (.txt,.csv, .json) for context-aware responses.
						</p>
						<div class="flex flex-wrap gap-2 justify-center">
							<button
								onclick={() => sendMessage('Explain quantum computing in simple terms')}
								class="px-4 py-2 bg-[var(--bg-elevated)] border border-subtle rounded-lg text-sm text-primary hover:bg-[var(--bg-subtle)] transition-colors"
							>
								Explain quantum computing
							</button>
							<button
								onclick={() => sendMessage('Write a short poem about coding')}
								class="px-4 py-2 bg-[var(--bg-elevated)] border border-subtle rounded-lg text-sm text-primary hover:bg-[var(--bg-subtle)] transition-colors"
							>
								Write a poem about coding
							</button>
							<button
								onclick={() => sendMessage('Help me understand async/await in JavaScript')}
								class="px-4 py-2 bg-[var(--bg-elevated)] border border-subtle rounded-lg text-sm text-primary hover:bg-[var(--bg-subtle)] transition-colors"
							>
								Explain JavaScript async/await
							</button>
						</div>
					</div>
				</div>
			{:else}
				<!-- Messages -->
				<div 
					bind:this={messagesContainer} 
					class="flex-1 overflow-y-auto p-4 space-y-4"
					role="log"
					aria-label="Chat messages"
					aria-live="polite"
				>
					{#each messages as message (message.id)}
						<ChatMessage
							role={message.role}
							content={message.content}
							isLoading={message.role === 'assistant' && message.content === '' && message.isStreaming}
							isStreaming={message.isStreaming}
							document={message.document}
							citations={message.citations}
							timestamp={message.timestamp}
							showRegenerate={message.role === 'assistant' && isLastAssistantMessage(message)}
							onRegenerate={regenerateLastResponse}
							onEdit={message.role === 'user' ? (newContent) => editMessage(message.id, newContent) : undefined}
							branchInfo={message.branchInfo}
							onSwitchBranch={switchBranch}
						/>
					{/each}
				</div>
			{/if}

			<!-- Error Message -->
			{#if error}
				<div class="px-4 py-2 bg-red-50 border-t border-red-200">
					<p class="text-sm text-red-700">{error}</p>
				</div>
			{/if}

			<!-- Chat Input -->
			<ChatInput
				onSend={sendMessage}
				disabled={sending}
				placeholder={sending ? 'AI is thinking...' : 'Type your message or attach a document...'}
			/>
		</main>
	</div>
</div>