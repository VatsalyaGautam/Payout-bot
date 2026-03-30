import { Client, Interaction, Message } from 'discord.js';
import { Cron } from 'croner';
import { registerCommands } from '@/client';
import { GUILD_ID } from './constants';
import { handleInteraction as controllerInteraction } from '@/controllers/interaction.controller';
import { handleMessage as controllerMessage } from '@/controllers/message.controller';
import { handleCron } from '@/controllers/cron.controller';
import { initDB } from '@/db';
import { ALERT_DAYS, CRON_EXPR } from './constants';
import { handleError, InitializationError } from './utils/errors';

let initialized = false;

export async function bootstrap(c: Client<true>) {
    if (initialized) return;

    try {
        await initDB();
        await registerCommands(GUILD_ID);

        console.log(`
-> Logged in as  : ${c.user.tag}
-> Alert window  : ${ALERT_DAYS} days
-> Cron schedule : ${CRON_EXPR}
        `);

        await runCron();
        new Cron(CRON_EXPR, runCron);
        
        initialized = true; //Set only when truly initialized
    } catch (err: unknown) {
        handleError('Startup Failure', new InitializationError('Core Systems', err));
        process.exit(1);
    }
}

export async function onInteraction(i: Interaction) {
    try {
        await controllerInteraction(i);
    } catch (err: unknown) {
        handleError('Interaction failed', err);
    }
}

export async function onMessage(m: Message) {
    try {
        await controllerMessage(m);
    } catch (err: unknown) {
        handleError('Message failed', err);
    }
}

/** 3. Lifecycle Governance */
export function setupLifecycle(client: Client) {
    const shutdown = async (signal: string) => {
        console.log(`\n[${signal}] Shutting down...`);
        try {
            await client.destroy();
        } catch (err: unknown) {
            handleError('Shutdown error', err);
        } finally {
            process.exit(0);
        }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    
    process.on('uncaughtException', (err: unknown) => {
        handleError('Uncaught Exception', err);
        process.exit(1);
    });
    
    process.on('unhandledRejection', (err: unknown) => {
        handleError('Unhandled Rejection', err);
        process.exit(1);
    });
}

/** 4. Shared Utilities */
export async function runCron() {
    try {
        await handleCron();
    } catch (err: unknown) {
        handleError('Cron task failed', err);
    }
}
