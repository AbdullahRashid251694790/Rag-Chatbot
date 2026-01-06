import {
	pgTable,
	text,
	timestamp,
	integer,
	primaryKey,
	pgEnum,
	vector,
	index,
	real
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { AdapterAccount } from '@auth/core/adapters';

// ============================================
// ENUMS
// ============================================

export const roleEnum = pgEnum('role', ['user', 'admin']);
export const statusEnum = pgEnum('status', ['active', 'disabled']);
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant']);
export const documentStatusEnum = pgEnum('document_status', ['processing', 'ready', 'error']);

// ============================================
// AUTH TABLES
// ============================================

// Users table
export const users = pgTable('users', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name'),
	email: text('email').unique().notNull(),
	emailVerified: timestamp('email_verified', { mode: 'date' }),
	image: text('image'),
	password: text('password'),
	role: roleEnum('role').default('user').notNull(),
	status: statusEnum('status').default('active').notNull(),
	createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull()
});

// Accounts table (for OAuth providers)
export const accounts = pgTable(
	'accounts',
	{
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		type: text('type').$type<AdapterAccount['type']>().notNull(),
		provider: text('provider').notNull(),
		providerAccountId: text('provider_account_id').notNull(),
		refresh_token: text('refresh_token'),
		access_token: text('access_token'),
		expires_at: integer('expires_at'),
		token_type: text('token_type'),
		scope: text('scope'),
		id_token: text('id_token'),
		session_state: text('session_state')
	},
	(account) => ({
		compoundKey: primaryKey({
			columns: [account.provider, account.providerAccountId]
		})
	})
);

// Sessions table (database sessions, NOT JWT)
export const sessions = pgTable('sessions', {
	sessionToken: text('session_token').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expires: timestamp('expires', { mode: 'date' }).notNull()
});

// Verification tokens table (for email verification)
export const verificationTokens = pgTable(
	'verification_tokens',
	{
		identifier: text('identifier').notNull(),
		token: text('token').notNull(),
		expires: timestamp('expires', { mode: 'date' }).notNull()
	},
	(vt) => ({
		compoundKey: primaryKey({
			columns: [vt.identifier, vt.token]
		})
	})
);

// Password reset tokens table
export const passwordResetTokens = pgTable('password_reset_tokens', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	token: text('token').notNull().unique(),
	expires: timestamp('expires', { mode: 'date' }).notNull(),
	createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull()
});

// ============================================
// CHAT TABLES (with tree structure support)
// ============================================

// Chat conversations table
export const chatConversations = pgTable('chat_conversations', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	title: text('title').default('New Chat'),
	createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull()
});

// Chat messages table (with tree structure for branching)
export const chatMessages = pgTable(
	'chat_messages',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		conversationId: text('conversation_id')
			.notNull()
			.references(() => chatConversations.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		role: messageRoleEnum('role').notNull(),
		content: text('content').notNull(),
		
		// Tree structure fields for branching
		parentId: text('parent_id'), // Reference to parent message (null for root)
		branchId: text('branch_id'), // Groups messages in the same branch
		branchIndex: integer('branch_index').default(0), // Index within sibling branches (0, 1, 2...)
		isActive: integer('is_active').default(1), // 1 = active branch, 0 = inactive
		
		// RAG context (which documents were used)
		contextChunkIds: text('context_chunk_ids'), // JSON array of chunk IDs used for this response
		
		createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull()
	},
	(table) => ({
		// Index for faster queries on conversation messages
		conversationIdx: index('chat_messages_conversation_idx').on(table.conversationId),
		// Index for tree traversal
		parentIdx: index('chat_messages_parent_idx').on(table.parentId),
		// Index for branch queries
		branchIdx: index('chat_messages_branch_idx').on(table.branchId)
	})
);

// ============================================
// RAG TABLES (Documents, Chunks, Embeddings)
// ============================================

// Documents table - stores uploaded file metadata
// Documents table - stores uploaded file metadata (linked to conversations)
export const documents = pgTable(
	'documents',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		conversationId: text('conversation_id')
			.notNull()
			.references(() => chatConversations.id, { onDelete: 'cascade' }),

		// File information
		filename: text('filename').notNull(),
		originalName: text('original_name').notNull(),
		mimeType: text('mime_type').notNull(),
		fileSize: integer('file_size').notNull(),

		// Processing status
		status: documentStatusEnum('status').default('processing').notNull(),
		errorMessage: text('error_message'),

		// Metadata
		chunkCount: integer('chunk_count').default(0),

		createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull()
	},
	(table) => ({
		userIdx: index('documents_user_idx').on(table.userId),
		conversationIdx: index('documents_conversation_idx').on(table.conversationId),
		statusIdx: index('documents_status_idx').on(table.status)
	})
);

// Document chunks table - stores parsed text chunks with embeddings
export const documentChunks = pgTable(
	'document_chunks',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		documentId: text('document_id')
			.notNull()
			.references(() => documents.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		
		// Chunk content
		content: text('content').notNull(),
		chunkIndex: integer('chunk_index').notNull(), // Position in document (0, 1, 2...)
		
		// Token/character counts for context
		tokenCount: integer('token_count'),
		charCount: integer('char_count'),
		
		// Vector embedding (384 dimensions for all-MiniLM-L6-v2 model)
		embedding: vector('embedding', { dimensions: 384 }),
		
		// Metadata for citations
		metadata: text('metadata'), // JSON: { page?: number, section?: string, ... }
		
		createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull()
	},
	(table) => ({
		documentIdx: index('document_chunks_document_idx').on(table.documentId),
		userIdx: index('document_chunks_user_idx').on(table.userId),
		// HNSW index for fast approximate nearest neighbor search
		embeddingIdx: index('document_chunks_embedding_idx').using(
			'hnsw',
			table.embedding.op('vector_cosine_ops')
		)
	})
);

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ many }) => ({
	accounts: many(accounts),
	sessions: many(sessions),
	conversations: many(chatConversations),
	documents: many(documents)
}));

export const chatConversationsRelations = relations(chatConversations, ({ one, many }) => ({
	user: one(users, {
		fields: [chatConversations.userId],
		references: [users.id]
	}),
	messages: many(chatMessages)
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
	conversation: one(chatConversations, {
		fields: [chatMessages.conversationId],
		references: [chatConversations.id]
	}),
	user: one(users, {
		fields: [chatMessages.userId],
		references: [users.id]
	}),
	parent: one(chatMessages, {
		fields: [chatMessages.parentId],
		references: [chatMessages.id]
	})
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
	user: one(users, {
		fields: [documents.userId],
		references: [users.id]
	}),
	conversation: one(chatConversations, {
		fields: [documents.conversationId],
		references: [chatConversations.id]
	}),
	chunks: many(documentChunks)
}));

export const documentChunksRelations = relations(documentChunks, ({ one }) => ({
	document: one(documents, {
		fields: [documentChunks.documentId],
		references: [documents.id]
	}),
	user: one(users, {
		fields: [documentChunks.userId],
		references: [users.id]
	})
}));

// ============================================
// TYPE EXPORTS
// ============================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'disabled';

export type ChatConversation = typeof chatConversations.$inferSelect;
export type NewChatConversation = typeof chatConversations.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
export type MessageRole = 'user' | 'assistant';

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type DocumentStatus = 'processing' | 'ready' | 'error';
export type DocumentChunk = typeof documentChunks.$inferSelect;
export type NewDocumentChunk = typeof documentChunks.$inferInsert;