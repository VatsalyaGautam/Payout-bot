# 💳 Payment Alert Bot

Discord bot for payment due alerts. TypeScript + Bun + discord.js + PostgreSQL.

- Sends daily alert embeds starting N days before each due date
- Reply `acknowledged` to an alert → bot reacts ✅ to the alert and your reply
  (WebSocket, no polling)
- `/check` slash command shows all payments due this month with paid/unpaid status (ephemeral)
- `/add`, `/update`, `/delete` slash commands for easy payment management

## Project structure

```
src/
  index.ts       — bot entrypoint, event wiring, cron scheduler
  client.ts      — discord.js Client + slash command registration
  commands/      — slash command handlers (/check, /add, /update, /delete)
  db/            — PostgreSQL connection, schema initialization, and queries
  utils/
    checker.ts     — daily alert logic, sends embeds to channel
    dates.ts       — date utilities
    acknowledge.ts — CLI acknowledge (no gateway needed)
  types/         — shared TypeScript types
```

## Setup

### 1. Create a Discord Bot

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications) → **New Application**
2. **General Information** → copy **Application ID**
3. **Bot** → **Reset Token** → copy token; enable **Message Content Intent**
4. **OAuth2 → URL Generator**:
    - Scopes: `bot`, `applications.commands`
    - Bot Permissions: `Send Messages`, `Add Reactions`, `Manage Messages`, `Read Message History`
5. Open the generated URL and invite the bot to your server

> **Note:** No Interactions Endpoint URL needed — discord.js uses the Gateway (WebSocket), not HTTP callbacks.

### 2. Configure Environment

Create a `.env` file in the root:

```env
DATABASE_URL=postgres://user:pass@localhost:5432/bot
DISCORD_BOT_TOKEN=...
DISCORD_APPLICATION_ID=...
DISCORD_CHANNEL_ID=...
DISCORD_GUILD_ID=...
```

### 3. Database Setup

The bot expects a PostgreSQL database. The bot will automatically initialize the required tables on startup.

### 4. Run

```bash
bun install
bun start
```

Or with Docker:

```bash
docker compose up -d
docker compose logs -f
```

## Slash Commands

| Command | Description |
| --- | --- |
| `/check` | Shows all payments due this month and their paid status |
| `/add` | Add a new recurring payment |
| `/update` | Update an existing payment's details |
| `/delete` | Remove a payment |

## CLI Commands

| Command | Description |
| --- | --- |
| `bun run src/index.ts check` | Run a one-off check, then exit |
| `bun run src/index.ts acknowledge <id>` | Manually acknowledge a payment |
| `bun run src/db/truncate.ts` | Clear all tables (Development only) |

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `DATABASE_URL` | required | PostgreSQL connection string |
| `DISCORD_BOT_TOKEN` | required | Bot token |
| `DISCORD_APPLICATION_ID` | required | For registering slash commands |
| `DISCORD_CHANNEL_ID` | required | Channel to post alerts in |
| `ALERT_DAYS_BEFORE` | `3` | Days before due to start alerting |
| `CRON_SCHEDULE` | `0 9 * * *` | Daily check time |

## Required Bot Permissions

| Permission | Why |
| --- | --- |
| Send Messages | Post alert embeds |
| Read Message History | Fetch the original message to react to it |
| Add Reactions | React ✅ on acknowledged messages |
| Manage Messages | Delete the user's `acknowledged` reply |
