# AI Enterprise Knowledge Search & Management

Internal enterprise document search with AI-powered Q&A built with **React, Node.js, Express, and PostgreSQL**.

## Tech Stack
- **Frontend**: React (Vite, TailwindCSS, TanStack React Query, Zustand) — Pure JavaScript / JSX (No TypeScript)
- **Backend**: Node.js + Express — Native ES Modules (No TypeScript)
- **Database**: PostgreSQL (`pg`) with automatic table creation & graceful fallback
- **File Storage**: Local filesystem storage (`/uploads`)

## Quick Start

### Prerequisites
- Node.js 20+
- npm
- PostgreSQL (optional: automatic in-memory fallback enabled if offline)

### Setup & Run

```bash
# 1. Clone the repository
git clone https://github.com/SanjayDattJoshi/AI-Enterprise-Knowledge-Management.git
cd AI-Enterprise-Knowledge-Management

# 2. Install dependencies
npm install

# 3. Start development servers (frontend on :3000, backend on :4000)
npm run dev
```

### Development URLs & Credentials
- **Frontend App**: http://localhost:3000
- **Backend API**: http://localhost:4000 (Health check: `/health`)
- **Default Admin**: `admin@enterprise.ai` / `password123`
- **Default Employee**: `employee@enterprise.ai` / `password123`

## Project Structure

```
├── client/          # Pure React + Vite frontend (JSX)
│   └── src/
│       ├── app/         # Router & App shell
│       ├── components/  # UI, Search, Admin & Document components
│       ├── features/    # Auth state & stores
│       ├── lib/         # API clients & utilities
│       └── pages/       # Search, Documents, Admin, Auth views
├── server/          # Pure Node.js + Express backend (ES Modules)
│   └── src/
│       ├── ai/          # RAG pipeline & response synthesis
│       ├── config/      # Environment & logger configuration
│       ├── db/          # PostgreSQL client & automatic database setup
│       ├── middleware/  # JWT auth & error handling
│       ├── modules/     # Feature routes (Auth, Documents, Search, Admin, Feedback)
│       └── storage/     # Local filesystem document storage
├── uploads/         # Local document storage directory
└── docs/            # Architecture & specifications
```

## Key Features
- ✅ **Document Management**: Upload PDF, DOCX, and TXT files with auto-text extraction & indexing
- ✅ **AI-Powered Search (RAG)**: Natural language queries with grounded answers and inline source citations `[1]`, `[2]`
- ✅ **Document Source Viewer**: Modal preview of cited documents with matched excerpt highlights
- ✅ **Enterprise Access Control**: Role-based access (Admin & Employee) with JWT authentication
- ✅ **Admin Dashboard**: System analytics, document management, and organization user overview
- ✅ **Simple & Robust**: Zero TypeScript overhead, zero fragile CLI builds, works out of the box with standard `npm run dev`
