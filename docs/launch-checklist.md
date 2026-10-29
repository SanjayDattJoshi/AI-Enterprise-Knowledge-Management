# Production Launch & Pre-Flight Checklist

This checklist outlines the verification steps required before promoting the AI Enterprise Knowledge Search platform to production.

---

## 1. Security & Credentials
- [ ] **Secret Keys**: Replace default `JWT_SECRET` with a cryptographically secure 256-bit secret string (`openssl rand -hex 32`).
- [ ] **Database Passwords**: Update `POSTGRES_PASSWORD` and `POSTGRES_USER` from default values.
- [ ] **Object Storage**: Update `S3_ACCESS_KEY` and `S3_SECRET_KEY` from default `minioadmin` values or configure production AWS S3 / Cloudflare R2 bucket credentials.
- [ ] **Transport Layer Security**: Terminate TLS / HTTPS in front of Web Server and Client using a reverse proxy (e.g. Nginx, Caddy, Cloudflare, AWS ALB).
- [ ] **CORS Configuration**: Restrict `FRONTEND_URL` to the exact production domain(s).

---

## 2. Database & Data Layer
- [ ] **pgvector Extension**: Verify extension is enabled:
  ```sql
  SELECT * FROM pg_extension WHERE extname = 'vector';
  ```
- [ ] **Schema Migrations**: Execute production migrations:
  ```bash
  docker-compose -f docker-compose.prod.yml run --rm server npx prisma migrate deploy
  ```
- [ ] **Database Backups**: Configure automated point-in-time recovery (PITR) or daily snapshot backups for PostgreSQL.

---

## 3. Storage & Ingestion
- [ ] **Bucket Readiness**: Verify the target storage bucket (`documents`) exists and has appropriate read/write permissions.
- [ ] **Worker Scaling**: Confirm dedicated worker containers (`aieks_worker`) are running and connected to Redis.
- [ ] **Max File Size**: Verify `MAX_FILE_SIZE` aligns with infrastructure memory and upload limits (default 50MB).

---

## 4. AI & RAG Configuration
- [ ] **Provider Selection**: Set `AI_PROVIDER=openai` (or other supported providers).
- [ ] **API Keys**: Ensure `OPENAI_API_KEY` is loaded securely via environment or secrets manager.
- [ ] **Embedding Dimensions**: Verify `EMBEDDING_DIMENSIONS=1536` matches model configuration (`text-embedding-3-small`).
- [ ] **Rate Limiting**: Confirm rate limit thresholds on search endpoints prevent quota exhaustion.

---

## 5. End-to-End Functional Verification
- [ ] **Admin Registration**: Register initial Organization and Admin account.
- [ ] **Document Ingestion**: Upload sample PDF, DOCX, and TXT files; verify status moves `UPLOADED` -> `PROCESSING` -> `INDEXED`.
- [ ] **Search & Citation**: Perform search queries; verify grounded answers, citation badges, and source excerpts.
- [ ] **Multi-Tenant Isolation**: Verify users from Organization A cannot access or search documents from Organization B.
- [ ] **Feedback Loop**: Submit thumbs-up/down ratings and verify they appear in the Admin Feedback dashboard.

---

## 6. Launch Commands

### Build & Deploy
```bash
# 1. Build production images
docker-compose -f docker-compose.prod.yml build

# 2. Start services in detached mode
docker-compose -f docker-compose.prod.yml up -d

# 3. Apply Prisma migrations
docker-compose -f docker-compose.prod.yml exec server npx prisma migrate deploy

# 4. View real-time logs
docker-compose -f docker-compose.prod.yml logs -f
```
