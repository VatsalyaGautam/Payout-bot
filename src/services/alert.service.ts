import * as db from '@/db/db';
import { loadState, saveState } from '@/store/store';
import { today } from '@/utils/dates';
import { handleError, NotFoundError, DiscordError, DatabaseError } from '@/utils/errors';
import { Message } from 'discord.js';

export async function processAcknowledgment(message: Message): Promise<void> {
    const content = message.content.trim().toLowerCase();
    const validKeywords = ['acknowledged', 'acknowledge', 'ack'];
    
    if (!message.reference?.messageId || !validKeywords.includes(content)) return;

    const state = await loadState();
    const replyToId = message.reference.messageId;
    const mapping = state.messageMap[replyToId];

    if (!mapping) {
        throw new NotFoundError('Message Mapping', replyToId);
    }

    const { paymentId, dueDate } = mapping;

    // Coordination: DB + Discord Reactions
    try {
        // 1. DB Acknowledgment
        await addAcknowledgment(paymentId, dueDate);

        // 2. Discord Reactions (Parallel)
        const reactUser = message.react('✅').catch((err: any) => {
            throw new DiscordError('Failed to react to user reply', err);
        });
        const reactAlert = message.channel.messages.fetch(replyToId)
            .then(msg => msg.react('✅'))
            .catch((err: any) => {
                throw new DiscordError('Failed to react to original alert', err);
            });
        
        await Promise.all([reactUser, reactAlert]);

        console.log(`[AlertService] Acknowledged ${paymentId} for ${dueDate}`);
    } catch (err: unknown) {
        if (err instanceof DiscordError || err instanceof NotFoundError || err instanceof DatabaseError) throw err;
        handleError(`[AlertService] Failed to process acknowledgment for ${paymentId}:`, err);
    }
}

export async function addAcknowledgment(paymentId: string, dueDate: string) {
  try {
    return await db.addAcknowledgment(paymentId, dueDate);
  } catch (err: unknown) {
    throw new DatabaseError(`Failed to add acknowledgment: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function recordAlert(messageId: string, paymentId: string, dueDate: string): Promise<void> {
    const state = await loadState();
    
    // Update message map
    state.messageMap[messageId] = { paymentId, dueDate };

    // Update last alerted
    const lastAlert = state.lastAlerted.find(a => a.paymentId === paymentId && a.dueDate === dueDate);
    if (lastAlert) {
        lastAlert.alertedAt = today();
    } else {
        state.lastAlerted.push({ paymentId, dueDate, alertedAt: today() });
    }

    await saveState(state);
}
