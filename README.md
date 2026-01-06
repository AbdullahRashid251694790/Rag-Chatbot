# AI Chat Application with RAG

A full-featured AI chat application built with SvelteKit, featuring Retrieval-Augmented Generation (RAG), conversation branching, and comprehensive authentication.

![SvelteKit](https://img.shields.io/badge/SvelteKit-5.0-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)

## ✨ Features

### 💬 AI Chat
- **Streaming Responses** - Real-time AI responses with Server-Sent Events
- **Conversation History** - Persistent chat history stored in PostgreSQL
- **Tree-Structured Branching** - Edit messages or regenerate responses to create conversation branches 
- **Branch Navigation** - Navigate between different conversation branches with intuitive controls
- **Auto-Titling** - AI generates conversation titles automatically

### 📄 RAG (Retrieval-Augmented Generation)
- **Document Upload** - Support for `.txt`,  `.csv`, and `.json` files
- **Vector Search** - pgvector for semantic similarity search
- **Python Embedding Service** - Sentence transformers for document embeddings
- **Citations** - AI responses include source citations from uploaded documents
- **Immediate Context** - Documents are available for RAG in the same message they're uploaded

### 🎨 User Interface
- **Dark/Light Theme Toggle** - Switch between dark and light modes with persistent preference
- **Markdown Rendering** - Full markdown support with syntax highlighting
- **Code Highlighting** - Syntax highlighting for programming languages
- **Search & Filter** - Search conversations by title with date grouping (Today, Yesterday, Previous 7 Days, etc.)
- **Conversation Management** - Rename and delete conversations 
- **Copy & Regenerate** - Copy code blocks and regenerate AI responses
- **Timestamps** - Message timestamps displayed on hover
- **Responsive Design** - Mobile-friendly with collapsible sidebar


### 🔐 Authentication
- **Email/Password** - Traditional authentication with Argon2 hashing
- **OAuth Providers** - Google and GitHub social login
- **Email Verification** - Verify email addresses with token-based system
- **Password Reset** - Secure password reset via email
- **RBAC** - Role-based access control (user/admin roles)
- **Admin Dashboard** - Manage users, change roles, delete accounts , Disable Account

### 🔧 DevOps
- **Health Check** - `/healthz` endpoint for container orchestration
- **Version Endpoint** - `/version` endpoint for deployment tracking
- **Docker Support** - Docker Compose for local development

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | SvelteKit 5, Svelte 5, TypeScript |
| **Styling** | Tailwind CSS 3.4 |
| **Backend** | SvelteKit API Routes, Node.js |
| **Database** | PostgreSQL 16 with pgvector |
| **Auth** | Auth.js (NextAuth) |
| **AI** | Gemini API |
| **Embeddings** | Python + Sentence Transformers |
| **Email** | Nodemailer (SMTP) |


## 📁 Project Structure

## Project Structure
```
MY-APP/
├── .svelte-kit/                            # SvelteKit build output
├── .vscode/                                # VS Code settings
├── dist/                                   # Production build output
├── drizzle/                                # Database migrations
├── embed-api/                              # Python embedding service
│   └── app/
│       └── main.py                         # FastAPI embedding endpoints
│   ├── Dockerfile                          # Container config for embedding service
│   └── requirements.txt                    # Python dependencies
├── node_modules/                           # Node.js dependencies
├── src/
│   ├── lib/
│   │   ├── index.ts                        # Library exports
│   │   ├── components/
│   │   │   └── chat/
│   │   │       ├── BranchNavigator.svelte  # Navigate between conversation branches
│   │   │       ├── ChatInput.svelte        # Message input with file upload
│   │   │       ├── ChatMessage.svelte      # Message display with markdown
│   │   │       ├── ConversationList.svelte # Sidebar with search & management
│   │   │       └── MarkdownRenderer.svelte # Render markdown with syntax highlighting
│   │   │   ├── Alert.svelte                # Reusable alert component
│   │   │   ├── Button.svelte               # Reusable button component
│   │   │   ├── Input.svelte                # Reusable input component
│   │   │   └── ThemeToggle.svelte          # Dark/light mode toggle
│   │   └── server/
│   │       ├── chat/
│   │       │   └── index.ts                # Chat database operations
│   │       ├── db/
│   │       │   ├── index.ts                # Database connection
│   │       │   └── schema.ts               # Drizzle ORM schema
│   │       ├── documents/
│   │       │   └── index.ts                # Document CRUD operations
│   │       ├── embeddings/
│   │       │   └── index.ts                # Embedding service client
│   │       ├── retrieval/
│   │       │   └── index.ts                # RAG retrieval logic
│   │       ├── auth.ts                     # Authentication utilities
│   │       ├── email.ts                    # Email sending service
│   │       ├── oauth.ts                    # OAuth provider config
│   │       └── sessions.ts                 # Session management
│   ├── routes/
│   │   ├── admin/
│   │   │   ├── +page.server.ts             # Admin page data loader
│   │   │   └── +page.svelte                # Admin dashboard UI
│   │   ├── api/
│   │   │   ├── admin/users/
│   │   │   │   ├── [id]/+server.ts         # Update/delete specific user
│   │   │   │   └── +server.ts              # List all users
│   │   │   ├── auth/
│   │   │   │   ├── forgot-password/        # Request password reset
│   │   │   │   ├── login/                  # Email/password login
│   │   │   │   ├── logout/                 # Logout endpoint
│   │   │   │   ├── register/               # User registration
│   │   │   │   ├── resend-verification/    # Resend verification email
│   │   │   │   ├── reset-password/         # Reset password with token
│   │   │   │   └── verify-email/           # Verify email address
│   │   │   ├── chat/
│   │   │   │   ├── branch/                 # Switch conversation branches
│   │   │   │   ├── conversations/          # Conversation CRUD
│   │   │   │   ├── edit/                   # Edit message (creates branch)
│   │   │   │   ├── regenerate/             # Regenerate AI response
│   │   │   │   └── +server.ts              # Send message with streaming
│   │   │   └── user/profile/
│   │   │       └── +server.ts              # User profile operations
│   │   ├── auth/
│   │   │   ├── callback/
│   │   │   │   ├── github/+server.ts       # GitHub OAuth callback
│   │   │   │   └── google/+server.ts       # Google OAuth callback
│   │   │   ├── forgot-password/+page.svelte # Forgot password form
│   │   │   ├── login/
│   │   │   │   ├── github/+server.ts       # Initiate GitHub login
│   │   │   │   └── google/+server.ts       # Initiate Google login
│   │   │   ├── reset-password/+page.svelte # Reset password form
│   │   │   ├── signin/+page.svelte         # Sign in page
│   │   │   ├── signout/
│   │   │   │   ├── +page.server.ts         # Sign out logic
│   │   │   │   └── +page.svelte            # Sign out confirmation
│   │   │   ├── signup/+page.svelte         # Sign up page
│   │   │   └── verify-email/+page.svelte   # Email verification page
│   │   ├── chat/
│   │   │   ├── +page.server.ts             # Chat page auth guard
│   │   │   └── +page.svelte                # Main chat interface
│   │   ├── dashboard/
│   │   │   ├── +page.server.ts             # Dashboard data loader
│   │   │   └── +page.svelte                # User dashboard
│   │   ├── healthz/+server.ts              # Health check endpoint
│   │   ├── profile/
│   │   │   ├── +page.server.ts             # Profile data loader
│   │   │   └── +page.svelte                # User profile page
│   │   ├── version/+server.ts              # Version info endpoint
│   │   ├── +layout.server.ts               # Root layout data loader
│   │   ├── +layout.svelte                  # Root layout component
│   │   ├── +page.server.ts                 # Home page data loader
│   │   ├── +page.svelte                    # Home page
│   │   └── layout.css                      # Global styles
│   ├── app.d.ts                            # TypeScript declarations
│   ├── app.html                            # HTML template
│   └── hooks.server.ts                     # Server hooks & middleware
├── static/                                 # Static assets
├── .env                                    # Environment variables
├── .env.example                            # Environment template
├── .gitignore                              # Git ignore rules
├── .npmrc                                  # npm configuration
├── compose.yaml                            # Docker Compose config
├── drizzle.config.ts                       # Drizzle ORM config
├── package-lock.json                       # Dependency lock file
├── package.json                            # Project dependencies
├── README.md                               # Project documentation
├── svelte.config.js                        # SvelteKit configuration
├── tsconfig.json                           # TypeScript configuration
└── vite.config.ts                          # Vite bundler configuration
```
## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 16 with pgvector extension
- Python 3.9+ (for embedding service)
- Anthropic API key

### 1. Clone and Install

```bash
git clone <repository-url>
cd <project-directory>
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration (see [Environment Variables](#-environment-variables) section).

### 3. Set Up Database

```bash
# Create database
createdb your_database_name

# Enable pgvector extension and create tables
psql your_database_name < schema.sql
```

### 4. Start Python Embedding Service

```bash
cd python-embedding
pip install -r requirements.txt
python app.py
```

Or with Docker:
```bash
docker-compose up embedding-service
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

### 6. (Optional) Run with Docker Compose

```bash
docker-compose up
```

## ⚙️ Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/auth_db"

# OAuth - Google
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# OAuth - GitHub
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="your-email@gmail.com"

# App
APP_URL="http://localhost:5173"

# AI - Gemini
GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-api-key"

# Admin Registration
ADMIN_SECRET_KEY="your-secret-admin-key"

# Embedding Service
EMBEDDING_API_URL="http://localhost:8000"

```

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/callback/credentials` | Login with email/password |
| POST | `/api/auth/logout` | Logout current user |
| GET | `/api/auth/verify-email?token=` | Verify email address |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send message (supports file upload, SSE stream) |
| GET | `/api/chat/conversations` | List all conversations |
| GET | `/api/chat/conversations/[id]` | Get conversation with messages |
| PATCH | `/api/chat/conversations/[id]` | Rename conversation |
| DELETE | `/api/chat/conversations/[id]` | Delete conversation |
| POST | `/api/chat/edit` | Edit message (creates branch) |
| POST | `/api/chat/regenerate` | Regenerate AI response (creates branch) |
| POST | `/api/chat/branch` | Switch to different branch |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users (admin only) |
| PATCH | `/api/admin/users/[id]` | Update user role |
| DELETE | `/api/admin/users/[id]` | Delete user |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/healthz` | Health check for monitoring |
| GET | `/version` | Application version info |

## 🗄️ Database Schema

### Core Tables

```sql
-- Users table
users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR,
  password_hash VARCHAR,
  role VARCHAR DEFAULT 'user',      -- 'user' or 'admin'
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Conversations
conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title VARCHAR DEFAULT 'New Chat',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Messages (tree structure for branching)
messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  parent_id UUID REFERENCES messages(id),  -- For branching
  role VARCHAR NOT NULL,                    -- 'user' or 'assistant'
  content TEXT NOT NULL,
  branch_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Documents (for RAG)
documents (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  conversation_id UUID REFERENCES conversations(id),
  name VARCHAR NOT NULL,
  content TEXT,
  status VARCHAR DEFAULT 'processing',
  created_at TIMESTAMP DEFAULT NOW()
)

-- Document chunks with embeddings
document_chunks (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding VECTOR(384)               -- pgvector for similarity search
)
```

## 🌳 Branching System

The conversation tree supports unlimited branching:

```
Message 1 (User: "Hello")
└── Message 2 (Assistant: "Hi there!")
    └── Message 3 (User: "Tell me about AI")
        ├── Message 4a (Assistant: "AI is...") [Branch 1]
        │   └── Message 5a (User: "More details?")
        │       └── Message 6a (Assistant: "...")
        └── Message 4b (Assistant: "Artificial...") [Branch 2 - Regenerated]
            └── Message 5b (User: "Different question")
```

### How Branching Works

| Action | Result |
|--------|--------|
| **Edit User Message** | Creates sibling user message → New AI response |
| **Regenerate AI Response** | Creates sibling assistant message with same parent |
| **Navigate Branches** | Use `<` `>` arrows to switch between branches |

The UI shows branch position (e.g., "2/3") with navigation arrows.

## 📚 RAG Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Upload    │ ──▶ │   Chunking   │ ──▶ │  Embedding  │
│  Document   │     │  (500 chars) │     │  (Python)   │
└─────────────┘     └──────────────┘     └─────────────┘
                                                │
                                                ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   AI        │ ◀── │   Context    │ ◀── │  pgvector   │
│  Response   │     │   Builder    │     │   Search    │
└─────────────┘     └──────────────┘     └─────────────┘
```

1. **Upload**: User attaches `.txt`,  `.csv`, or `.json` file
2. **Chunk**: Document split into ~500 character chunks
3. **Embed**: Python service generates embeddings (sentence-transformers)
4. **Store**: Chunks stored in PostgreSQL with pgvector
5. **Search**: User query embedded → similarity search finds relevant chunks
6. **Context**: Top chunks provided to Claude as context
7. **Respond**: Claude generates response with citations

## 🎯 Usage Guide

### Starting a Chat
1. Navigate to `/chat`
2. Type a message or click a suggestion
3. Press Enter or click Send

### Uploading Documents
1. Click the 📎 (paperclip) icon
2. Select a `.txt`, `.csv`, or `.json` file
3. File is processed immediately
4. Ask questions about the document content
5. Responses include citations: `[1]`, `[2]`, etc.

### Editing Messages
1. Hover over any **user message**
2. Click the ✏️ (pencil) icon
3. Edit the text
4. Press Enter to create a new branch

### Regenerating Responses
1. On the last **AI message**, click "Regenerate"
2. A new response is generated as a new branch
3. Use branch arrows to compare versions

### Theme Toggle
1. Click the 🌙/☀️ icon in the header
2. Toggles between dark and light modes


### Managing Conversations
1. Hover over a conversation in the sidebar
2. Click the `⋮` (3-dot) menu
3. Choose **Rename** or **Delete**
4. Delete requires confirmation (click twice)

### Searching Conversations
1. Type in the search box at the top of sidebar
2. Conversations filter by title instantly
3. Press `Escape` or click `✕` to clear

## 🧪 Development

```bash
# Start development server
npm run dev

# Type checking
npm run check

# Linting
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🐳 Docker Deployment

```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f app
docker-compose logs -f embedding-service

# Stop all services
docker-compose down

# Remove volumes (clean slate)
docker-compose down -v
```

## 🔒 Security Features

- **Password Hashing**: Argon2id (memory-hard)
- **Session Management**: HTTP-only cookies
- **CSRF Protection**: Built into Auth.js
- **Input Validation**: Server-side validation on all endpoints
- **SQL Injection**: Parameterized queries
- **XSS Prevention**: Content sanitization



## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- [SvelteKit](https://kit.svelte.dev/) - Full-stack framework
- [Anthropic](https://www.anthropic.com/) - Claude AI API
- [Auth.js](https://authjs.dev/) - Authentication
- [pgvector](https://github.com/pgvector/pgvector) - Vector similarity search
- [Sentence Transformers](https://www.sbert.net/) - Text embeddings
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Marked](https://marked.js.org/) - Markdown parsing
- [Highlight.js](https://highlightjs.org/) - Syntax highlighting
