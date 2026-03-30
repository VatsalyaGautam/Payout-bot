FROM oven/bun:1
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY src ./src

ENV DISCORD_BOT_TOKEN=""
ENV DISCORD_APPLICATION_ID=""
ENV DISCORD_CHANNEL_ID=""
ENV ALERT_DAYS_BEFORE=3
ENV CRON_SCHEDULE="0 9 * * *"

CMD ["bun", "run", "src/index.ts"]