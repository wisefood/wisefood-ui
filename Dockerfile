# Multi-stage build for Nuxt application with nginx
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.23.0 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build arguments for context path and Keycloak configuration
ARG CONTEXT_PATH=/app

# Set build-time environment variables
ENV NUXT_APP_BASE_URL=${CONTEXT_PATH}

# Build the application
RUN pnpm run build

# Production stage with nginx
FROM nginx:1.25-alpine

# Install envsubst
RUN apk add --no-cache gettext

# Copy nginx configuration
COPY nginx.conf.template /etc/nginx/nginx.conf

# Copy built application
COPY --from=builder /app/.output/public /usr/share/nginx/html

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Environment variables
ENV CONTEXT_PATH=/app

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
