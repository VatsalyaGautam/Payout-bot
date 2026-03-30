import { Events } from 'discord.js';
import { client } from '@/client';
import { BOT_TOKEN } from './constants';
import { bootstrap, onInteraction, onMessage, setupLifecycle } from './app';
import { handleError } from './utils/errors';

client.once(Events.ClientReady, bootstrap);
client.on(Events.InteractionCreate, onInteraction);
client.on(Events.MessageCreate, onMessage);

setupLifecycle(client);

client.login(BOT_TOKEN).catch((err: unknown) => {
    handleError('Login failed', err);
    process.exit(1);
});
