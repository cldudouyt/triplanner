# ─── Stage 1: Build TypeScript ────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies (separate layer for cache)
COPY server/package*.json ./
RUN npm ci --include=dev

# Generate Prisma client (copy schema + config first for cache efficiency)
COPY server/prisma.config.ts ./
COPY server/prisma/ ./prisma/
RUN DATABASE_URL="postgresql://dummy:dummy@localhost/dummy" npx prisma generate

# Copy remaining source and build
COPY server/ .
RUN npm run build

# ─── Stage 2: Production image ────────────────────────────────────────────────
FROM node:22-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Install only production deps
COPY server/package*.json ./
RUN npm ci --only=production

# Copy built files + prisma artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/generated ./generated

# Expose port
EXPOSE 3001

# Start with DB push (idempotent)
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/src/index.js"]
