FROM node:22-alpine
WORKDIR /app

RUN apk add --no-cache openssl

COPY server/package*.json ./
RUN npm ci

COPY server/prisma.config.ts ./
COPY server/prisma/ ./prisma/
RUN DATABASE_URL="postgresql://dummy:dummy@localhost/dummy" npx prisma generate

COPY server/src ./src
COPY server/tsconfig.json ./

# Install tsx globally to ensure binary is available
RUN npm install -g tsx

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push && tsx src/index.ts"]
