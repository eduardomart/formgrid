FROM node:20-alpine AS base

RUN npm install -g pnpm

WORKDIR /app

# Dependencies Stage
FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api/package.json ./packages/api/

RUN pnpm install --frozen-lockfile --filter @formgrid/api

# Production Builder Stage
FROM base AS builder

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages/api/node_modules ./packages/api/node_modules

COPY packages/api ./packages/api

WORKDIR /app/packages/api

RUN npx prisma generate
RUN pnpm run build

# Production Stage
FROM node:20-alpine AS production

RUN npm install -g pnpm

WORKDIR /app/packages/api

COPY packages/api/package.json ./

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/packages/api/dist ./dist
COPY --from=builder /app/packages/api/prisma ./prisma

RUN npx prisma generate

ENV NODE_ENV=production

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["pnpm", "run", "start"]
