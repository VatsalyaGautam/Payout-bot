# Stage 1: Build
FROM oven/bun:1 AS builder
WORKDIR /app

# Copy lockfile and package.json for caching
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Stage 2: Runtime
FROM oven/bun:1-distroless
WORKDIR /app

# Copy dependencies and source
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./

# Production environment variables
ENV NODE_ENV=production

# Default values
ENV ALERT_DAYS_BEFORE=3
ENV CRON_SCHEDULE="0 9 * * *"
ENV APP_TIMEZONE=UTC

USER bun
CMD ["bun", "run", "src/index.ts"]