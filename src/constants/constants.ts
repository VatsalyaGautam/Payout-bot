import { getEnv, getEnvNumber } from '@/utils/checkEnv';

export const BOT_TOKEN = getEnv('DISCORD_BOT_TOKEN', undefined, true);
export const APPLICATION_ID = getEnv('DISCORD_APPLICATION_ID', undefined, true);
export const GUILD_ID = getEnv('DISCORD_GUILD_ID', undefined, true);
export const CHANNEL_ID = getEnv('DISCORD_CHANNEL_ID', undefined, true);
export const DATABASE_URL = getEnv('DATABASE_URL', undefined, true);
export const CRON_EXPR = getEnv('CRON_SCHEDULE', '0 9 * * *');
export const ALERT_DAYS = getEnvNumber('ALERT_DAYS_BEFORE', 3);

// db config
export const DB_POOL_MAX = getEnvNumber('DB_POOL_MAX', 10);
export const DB_IDLE_TIMEOUT = getEnvNumber('DB_IDLE_TIMEOUT', 20);
export const DB_CONNECT_TIMEOUT = getEnvNumber('DB_CONNECT_TIMEOUT', 10);

// timezone
export const APP_TIMEZONE = getEnv('APP_TIMEZONE', 'Asia/Kolkata');

// discord error codes
export const INTERACTION_ALREADY_REPLIED = 40060;
export const UNKNOWN_INTERACTION = 10062;