# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Dependencies Stage
FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/dashboard/package.json ./apps/dashboard/

RUN pnpm install --frozen-lockfile --filter @formgrid/dashboard

# Production Build Stage
FROM base AS builder

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/dashboard/node_modules ./apps/dashboard/node_modules

COPY apps/dashboard ./apps/dashboard

WORKDIR /app/apps/dashboard
RUN pnpm run build

# Production Stage
FROM nginx:alpine AS production

COPY --from=builder /app/apps/dashboard/dist /usr/share/nginx/html
COPY apps/dashboard/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
