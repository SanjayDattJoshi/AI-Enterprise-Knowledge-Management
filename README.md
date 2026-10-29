# AI Enterprise Knowledge Search

Internal enterprise document search with AI-powered Q&A built with **Node.js, Express, React, and PostgreSQL (`pgvector`)**.

## Tech Stack
- **Frontend**: React (Vite, TailwindCSS, TanStack React Query, Zustand)
- **Backend**: Node.js + Express (TypeScript, Prisma ORM, Native In-Memory Queue)
- **Database & Vectors**: PostgreSQL 16 with `pgvector`
- **File Storage**: Local filesystem storage (`/uploads`)

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL (with `pgvector` extension) or Docker
- npm or pnpm

### Setup

```bash
# Clone and install dependencies
npm install

# Start PostgreSQL with pgvector (optional if you have local/cloud PostgreSQL)
npm run docker:up

# Run database migrations
npm run db:migrate

# Seed with default admin, employee, and sample documents
npm run db:seed

# Start development servers
npm run dev
```

### Development URLs & Credentials
- **Frontend App**: http://localhost:3000
- **Backend API**: http://localhost:4000 (Health check: `/health`)
- **Default Admin**: `admin@enterprise.ai` / `password123`
- **Default Employee**: `employee@enterprise.ai` / `password123`
- **Prisma Studio**: `npm run db:studio`

## Project Structure

```
├── client/          # React + Vite frontend
├── server/          # Express + TypeScript backend
│   └── src/
│       ├── modules/ # Feature modules (Auth, Documents, Search, Admin)
│       ├── ai/      # RAG pipeline & embedding clients
│       ├── queue/   # Async background ingestion
│       └── storage/ # Local filesystem storage
├── docs/            # Documentation
└── docker/          # Docker compose for PostgreSQL (pgvector)
```

## Key Features
- ✅ Document upload (PDF/DOCX/TXT)
- ✅ Local filesystem storage (no S3/MinIO required)
- ✅ Automatic background indexing with vector embeddings (no Redis required)
- ✅ Natural language semantic search with PostgreSQL `pgvector`
- ✅ Cited, grounded answers with source modal preview
- ✅ Organization-level access control & Admin dashboard
- 🔒 Security-first design
