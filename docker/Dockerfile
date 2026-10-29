# Multi-stage production build for AI Enterprise Knowledge Search

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install native dependencies for build tools (e.g. argon2/node-gyp)
RUN apk add --no-cache python3 make g++

# Copy root workspace and server package definitions
COPY package.json package-lock.json* ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install workspace dependencies
RUN npm ci

# Copy server source and prisma schema
COPY server ./server

# Generate Prisma Client
WORKDIR /app/server
RUN npx prisma generate

# Build TypeScript to Javascript
RUN npm run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install curl for healthchecks
RUN apk add --no-cache curl

# Copy built dist files, generated prisma client, and production node_modules
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server/prisma ./prisma

# Copy entrypoint script
COPY docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["docker-entrypoint.sh"]
