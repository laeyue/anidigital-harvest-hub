# Build stage
FROM node:20-alpine AS deps

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Accept build arguments for environment variables
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_AGROMONITORING_API_KEY
ARG NEXT_PUBLIC_PLANT_ID_API_KEY
ARG NEXT_PUBLIC_ENABLE_DEBUG_LOGS

# Set environment variables for build (required for NEXT_PUBLIC_* to be embedded in client bundle)
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL:-}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}
ENV NEXT_PUBLIC_AGROMONITORING_API_KEY=${NEXT_PUBLIC_AGROMONITORING_API_KEY:-}
ENV NEXT_PUBLIC_PLANT_ID_API_KEY=${NEXT_PUBLIC_PLANT_ID_API_KEY:-}
ENV NEXT_PUBLIC_ENABLE_DEBUG_LOGS=${NEXT_PUBLIC_ENABLE_DEBUG_LOGS:-false}
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy configuration files
COPY next.config.js ./
COPY tsconfig.json ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./
COPY next-env.d.ts ./
COPY eslint.config.js ./

# Copy source directories
# Note: We're using Pages Router (src/pages/), not App Router (app/)
# The app/ directory is excluded via .dockerignore
COPY src ./src
COPY public ./public

# Copy any other necessary files
COPY middleware.ts ./

# Build the application
RUN npm run build

# Verify standalone output exists
RUN test -d .next/standalone || (echo "ERROR: .next/standalone directory not found" && ls -la .next/ && exit 1)

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install wget for health checks
RUN apk add --no-cache wget

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public folder
COPY --from=builder /app/public ./public

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Verify server.js exists
RUN test -f server.js || (echo "ERROR: server.js not found" && ls -la && exit 1)

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
