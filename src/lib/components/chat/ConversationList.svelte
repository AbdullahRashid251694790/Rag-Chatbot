<script lang="ts">
	interface Conversation {
		id: string;
		title: string;
		createdAt: string;
		updatedAt: string;
	}

	interface Props {
		conversations: Conversation[];
		activeId: string | null;
		onSelect: (id: string) => void;
		onDelete: (id: string) => void;
		onRename: (id: string, newTitle: string) => void;
		onNewChat: () => void;
	}

	let { conversations, activeId, onSelect, onDelete, onRename, onNewChat }: Props = $props();

	let searchQuery = $state('');
	let openMenuId = $state<string | null>(null);
	let deleteConfirmId = $state<string | null>(null);
	let renamingId = $state<string | null>(null);
	let renameValue = $state('');
	let renameInputRef = $state<HTMLInputElement | null>(null);

	// Filter conversations based on search query
	let filteredConversations = $derived(
		searchQuery.trim()
			? conversations.filter((c) =>
					c.title.toLowerCase().includes(searchQuery.toLowerCase())
			  )
			: conversations
	);

	// Group conversations by date
	let groupedConversations = $derived(groupByDate(filteredConversations));

	function groupByDate(convos: Conversation[]) {
		const groups: { label: string; conversations: Conversation[] }[] = [];
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		const lastWeek = new Date(today);
		lastWeek.setDate(lastWeek.getDate() - 7);
		const lastMonth = new Date(today);
		lastMonth.setMonth(lastMonth.getMonth() - 1);

		const todayConvos: Conversation[] = [];
		const yesterdayConvos: Conversation[] = [];
		const lastWeekConvos: Conversation[] = [];
		const lastMonthConvos: Conversation[] = [];
		const olderConvos: Conversation[] = [];

		for (const convo of convos) {
			const convoDate = new Date(convo.updatedAt);
			convoDate.setHours(0, 0, 0, 0);

			if (convoDate.getTime() === today.getTime()) {
				todayConvos.push(convo);
			} else if (convoDate.getTime() === yesterday.getTime()) {
				yesterdayConvos.push(convo);
			} else if (convoDate > lastWeek) {
				lastWeekConvos.push(convo);
			} else if (convoDate > lastMonth) {
				lastMonthConvos.push(convo);
			} else {
				olderConvos.push(convo);
			}
		}

		if (todayConvos.length) groups.push({ label: 'Today', conversations: todayConvos });
		if (yesterdayConvos.length) groups.push({ label: 'Yesterday', conversations: yesterdayConvos });
		if (lastWeekConvos.length) groups.push({ label: 'Previous 7 Days', conversations: lastWeekConvos });
		if (lastMonthConvos.length) groups.push({ label: 'Previous 30 Days', conversations: lastMonthConvos });
		if (olderConvos.length) groups.push({ label: 'Older', conversations: olderConvos });

		return groups;
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		});
	}

	function toggleMenu(e: Event, id: string) {
		e.stopPropagation();
		if (openMenuId === id) {
			openMenuId = null;
		} else {
			openMenuId = id;
			deleteConfirmId = null;
		}
	}

	function closeMenu() {
		openMenuId = null;
		deleteConfirmId = null;
	}

	function handleRenameClick(e: Event, conversation: Conversation) {
		e.stopPropagation();
		renamingId = conversation.id;
		renameValue = conversation.title;
		openMenuId = null;
		
		// Focus input after render
		setTimeout(() => {
			renameInputRef?.focus();
			renameInputRef?.select();
		}, 10);
	}

	function submitRename(id: string) {
		if (renameValue.trim() && renameValue.trim() !== conversations.find(c => c.id === id)?.title) {
			onRename(id, renameValue.trim());
		}
		renamingId = null;
		renameValue = '';
	}

	function cancelRename() {
		renamingId = null;
		renameValue = '';
	}

	function handleRenameKeydown(e: KeyboardEvent, id: string) {
		if (e.key === 'Enter') {
			e.preventDefault();
			submitRename(id);
		} else if (e.key === 'Escape') {
			cancelRename();
		}
	}

	function handleDeleteClick(e: Event, id: string) {
		e.stopPropagation();
		if (deleteConfirmId === id) {
			onDelete(id);
			deleteConfirmId = null;
			openMenuId = null;
		} else {
			deleteConfirmId = id;
		}
	}

	function clearSearch() {
		searchQuery = '';
	}

	function handleSearchKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			clearSearch();
		}
	}

	// Close menu when clicking outside
	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.menu-container')) {
			closeMenu();
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="h-full flex flex-col bg-[var(--bg-elevated)]">
	<!-- Header with New Chat Button -->
	<div class="p-3 border-b border-subtle bg-[var(--bg-elevated)]">
		<button
			onclick={onNewChat}
			class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors font-medium shadow-sm"
			aria-label="Start new chat"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
			</svg>
			New Chat
		</button>
	</div>

	<!-- Search Box -->
	<div class="p-3 border-b border-subtle bg-[var(--bg-elevated)]">
		<div class="relative">
			<svg 
				class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" 
				fill="none" 
				stroke="currentColor" 
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
			</svg>
			<input
				type="text"
				bind:value={searchQuery}
				onkeydown={handleSearchKeydown}
				placeholder="Search conversations..."
				class="w-full pl-9 pr-8 py-2 text-sm border border-subtle bg-[var(--bg-elevated)] text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:rgba(99,102,241,0.25)] focus:border-[var(--primary)] transition-colors"
				aria-label="Search conversations"
			/>
			{#if searchQuery}
				<button
					onclick={clearSearch}
					class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-primary rounded"
					aria-label="Clear search"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
					</svg>
				</button>
			{/if}
		</div>
	</div>

	<!-- Conversations List -->
	<div class="flex-1 overflow-y-auto" role="list" aria-label="Conversation history">
		{#if filteredConversations.length === 0}
			<div class="p-4 text-center">
				{#if searchQuery}
					<div class="text-slate-400">
						<svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
						</svg>
						<p class="text-sm text-muted">No conversations found for "{searchQuery}"</p>
						<button
							onclick={clearSearch}
							class="mt-2 text-sm text-[color:var(--primary)] hover:opacity-90"
						>
							Clear search
						</button>
					</div>
				{:else}
					<p class="text-sm text-muted">No conversations yet</p>
					<p class="text-xs text-slate-400 mt-1">Start a new chat to begin</p>
				{/if}
			</div>
		{:else}
			{#each groupedConversations as group}
				<div class="py-2">
					<!-- Group Label -->
					<h3 class="px-4 py-1 text-xs font-semibold text-muted uppercase tracking-wider">
						{group.label}
					</h3>
					
					<!-- Conversations in Group -->
					{#each group.conversations as conversation (conversation.id)}
						<div
							role="listitem"
							class="group relative menu-container"
						>
							{#if renamingId === conversation.id}
								<!-- Rename Input -->
								<div class="px-4 py-2">
									<input
										bind:this={renameInputRef}
										bind:value={renameValue}
										onkeydown={(e) => handleRenameKeydown(e, conversation.id)}
										onblur={() => submitRename(conversation.id)}
										class="w-full px-3 py-2 text-sm border border-[var(--primary)] bg-[var(--bg-elevated)] text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:rgba(99,102,241,0.3)]"
										placeholder="Conversation name"
									/>
								</div>
							{:else}
								<button
									onclick={() => onSelect(conversation.id)}
									class="w-full text-left px-4 py-3 hover:bg-[var(--bg-subtle)] transition-colors border-l-2 {activeId === conversation.id ? 'bg-[var(--bg-subtle)] border-[var(--primary)]' : 'border-transparent hover:border-slate-300'}"
									aria-current={activeId === conversation.id ? 'true' : 'false'}
									aria-label="Open conversation: {conversation.title}"
								>
									<div class="flex items-start gap-3">
										<div class="flex-shrink-0 w-8 h-8 bg-[var(--bg-subtle)] rounded-lg flex items-center justify-center mt-0.5" aria-hidden="true">
											<svg class="w-4 h-4 text-[color:var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
											</svg>
										</div>
										<div class="flex-1 min-w-0 pr-8">
											<p class="text-sm font-medium text-primary truncate">
												{conversation.title}
											</p>
											<p class="text-xs text-muted mt-0.5">
												{formatDate(conversation.updatedAt)}
											</p>
										</div>
									</div>
								</button>

								<!-- 3-Dot Menu Button -->
								<button
									onclick={(e) => toggleMenu(e, conversation.id)}
									class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--bg-subtle)] text-slate-400 hover:text-primary"
									aria-label="More options"
									aria-expanded={openMenuId === conversation.id}
									aria-haspopup="true"
								>
									<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
										<circle cx="12" cy="5" r="2"/>
										<circle cx="12" cy="12" r="2"/>
										<circle cx="12" cy="19" r="2"/>
									</svg>
								</button>

								<!-- Dropdown Menu -->
								{#if openMenuId === conversation.id}
									<div 
										class="absolute right-2 top-full mt-1 w-40 bg-[var(--bg-elevated)] border border-subtle rounded-lg shadow-lg z-50 py-1"
										role="menu"
										aria-label="Conversation options"
									>
										<!-- Rename Option -->
										<button
											onclick={(e) => handleRenameClick(e, conversation)}
											class="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-[var(--bg-subtle)] transition-colors"
											role="menuitem"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
											</svg>
											Rename
										</button>

										<!-- Delete Option -->
										<button
											onclick={(e) => handleDeleteClick(e, conversation.id)}
											class="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors {deleteConfirmId === conversation.id ? 'bg-red-50 text-red-600' : 'text-red-600 hover:bg-red-50'}"
											role="menuitem"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
											</svg>
											{deleteConfirmId === conversation.id ? 'Click to confirm' : 'Delete'}
										</button>
									</div>
								{/if}
							{/if}
						</div>
					{/each}
				</div>
			{/each}
		{/if}
	</div>

	<!-- Footer with conversation count -->
	<div class="p-3 border-t border-subtle bg-[var(--bg-elevated)]">
		<p class="text-xs text-muted text-center">
			{#if searchQuery}
				{filteredConversations.length} of {conversations.length} conversations
			{:else}
				{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
			{/if}
		</p>
	</div>
</div>