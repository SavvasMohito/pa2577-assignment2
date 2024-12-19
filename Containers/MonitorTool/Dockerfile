# Build stage
FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY . .

RUN corepack enable
RUN pnpm install --frozen-lockfile --loglevel verbose
RUN pnpm build
RUN pnpm prune --prod

# Serve stage
FROM node:20-bookworm-slim

WORKDIR /app

COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build

EXPOSE 3000

CMD ["node", "build/index.js"]