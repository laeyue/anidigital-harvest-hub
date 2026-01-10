# Build stage
FROM node:20-alpine AS deps

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache libc6-compat python3 make g++ git

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --legacy-peer-deps 2>&1 | tee /tmp/npm-install.log || \
    (echo "npm ci failed, trying npm install..." && npm install --legacy-peer-deps) || \
    (echo "npm install failed. Log:" && cat /tmp/npm-install.log && exit 1)

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

# Copy configuration files first (in order of dependency)
COPY package.json ./
COPY next.config.js ./
COPY tsconfig.json ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./
COPY next-env.d.ts ./
COPY eslint.config.js ./

# Copy source directories
COPY src ./src
COPY public ./public

# Copy any other necessary files
COPY middleware.ts ./

# Verify critical page files exist before build (after all files are copied)
RUN echo "Verifying page files..." && \
    echo "Current directory: $(pwd)" && \
    echo "Listing src/pages directory:" && \
    ls -la src/pages/ 2>/dev/null || (echo "ERROR: src/pages directory not found!" && exit 1) && \
    echo "" && \
    echo "Checking for page files:" && \
    if [ -f src/pages/login.tsx ]; then echo "✓ login.tsx found"; else echo "✗ login.tsx missing"; ls -la src/pages/ | head -20; exit 1; fi && \
    if [ -f src/pages/signup.tsx ]; then echo "✓ signup.tsx found"; else echo "✗ signup.tsx missing"; exit 1; fi && \
    if [ -f src/pages/index.tsx ]; then echo "✓ index.tsx found"; else echo "✗ index.tsx missing"; exit 1; fi && \
    echo "" && \
    echo "✓ All critical page files verified"

# Increase Node.js memory limit for build
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Build the application with verbose output
# Disable ESLint during build to avoid blocking on lint errors
# Capture exit code separately to handle it properly
RUN set -o pipefail && \
    NEXT_TELEMETRY_DISABLED=1 npm run build 2>&1 | tee /tmp/build.log; \
    BUILD_EXIT_CODE=$?; \
    if [ $BUILD_EXIT_CODE -ne 0 ]; then \
      echo "=== Build failed with exit code $BUILD_EXIT_CODE ==="; \
      echo "Last 100 lines of build output:"; \
      tail -n 100 /tmp/build.log; \
      echo "=== Checking for common issues ==="; \
      if [ -d .next ]; then \
        echo ".next directory exists but build failed"; \
        ls -la .next/ || true; \
      else \
        echo ".next directory does not exist"; \
      fi; \
      exit $BUILD_EXIT_CODE; \
    fi

# Verify standalone output exists
RUN test -d .next/standalone || (echo "ERROR: .next/standalone directory not found. Build may have failed." && ls -la .next/ 2>/dev/null || echo "No .next directory found" && exit 1)

# Verify server.js exists in standalone
RUN test -f .next/standalone/server.js || (echo "ERROR: server.js not found in standalone output" && ls -la .next/standalone/ && exit 1)

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

# Set correct permissions for runtime
RUN chown -R nextjs:nodejs /app && \
    chmod -R 755 /app

# Verify server.js exists
RUN test -f server.js || (echo "ERROR: server.js not found in standalone output" && ls -la && exit 1)

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
