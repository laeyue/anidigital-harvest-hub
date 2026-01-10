# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arguments for environment variables
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_AGROMONITORING_API_KEY
ARG NEXT_PUBLIC_PLANT_ID_API_KEY
ARG NEXT_PUBLIC_ENABLE_DEBUG_LOGS

# Set environment variables for build (required for NEXT_PUBLIC_* to be embedded in client bundle)
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_AGROMONITORING_API_KEY=$NEXT_PUBLIC_AGROMONITORING_API_KEY
ENV NEXT_PUBLIC_PLANT_ID_API_KEY=$NEXT_PUBLIC_PLANT_ID_API_KEY
ENV NEXT_PUBLIC_ENABLE_DEBUG_LOGS=$NEXT_PUBLIC_ENABLE_DEBUG_LOGS

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install wget for health checks
RUN apk add --no-cache wget

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Note: NEXT_PUBLIC_* variables are embedded at build time
# Server-side env vars can be passed at runtime via docker-compose environment section

CMD ["node", "server.js"]

