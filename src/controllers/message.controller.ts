import { Message } from 'discord.js';
import { processAcknowledgment } from '@/services/alert.service';
import { handleError } from '@/utils/errors';

export async function handleMessage(message: Message): Promise<void> {
    if (message.partial) {
        await message.fetch();
    }
    if (message.author.bot) return;


    try {
        console.log(`[MessageController] Received message from ${message.author.tag}`);
        await processAcknowledgment(message);
    } catch (err: unknown) {
        handleError(`[MessageController] Error handling message ${message.id}:`, err);
    }
}
