# AI Enterprise Knowledge Search

An internal web application where Admins upload company documents and Employees ask natural-language questions to get grounded, cited answers.

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- npm or pnpm

### Setup

```bash
# Clone and install dependencies
npm install

# Start infrastructure (Postgres, Redis, MinIO)
npm run docker:up

# Wait for services to be healthy, then run migrations
npm run db:migrate

# (Optional) Seed with test data
npm run db:seed

# Start development servers
npm run dev
```

### Development
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- MinIO Console: http://localhost:9001 (minioadmin / minioadmin)
- Prisma Studio: `npm run db:studio`

## Project Structure

```
├── client/          # React + Vite frontend
├── server/          # Express + TypeScript backend
│   └── src/
│       ├── modules/ # Feature modules
│       ├── ai/      # LLM/embedding clients
│       └── queue/   # Background jobs
├── docs/            # Documentation
└── docker/          # Docker configs
```

## Key Features
- ✅ Document upload (PDF/DOCX/TXT)
- ✅ Automatic indexing with vector embeddings
- ✅ Natural language search
- ✅ Cited, grounded answers
- ✅ Organization-level access control
- 🔒 Security-first design

## Documentation
See `docs/` for detailed documentation:
- Architecture
- API Reference
- Security



