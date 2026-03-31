import * as db from '@/db/db';
import { handleError, NotFoundError, DiscordError, DatabaseError } from '@/utils/errors';
import { Message } from 'discord.js';

export async function processAcknowledgment(message: Message): Promise<void> {
  const content = message.content.trim().toLowerCase();
  const validKeywords = ['acknowledged', 'acknowledge', 'ack'];
  if (!message.reference?.messageId || !validKeywords.includes(content)) return;

  const replyToId = message.reference.messageId;

  // Look up mapping directly from DB — survives bot restarts
  const mapping = await db.getMessageMapping(replyToId);
  if (!mapping) {
    throw new NotFoundError('Message Mapping', replyToId);
  }

  const { paymentId, dueDate } = mapping;

  // Guard: already acknowledged — silently skip
  if (await db.hasAcknowledgment(paymentId, dueDate)) {
    console.log(`[AlertService] Already acknowledged ${paymentId} for ${dueDate} — skipping`);
    return;
  }

  try {
    // 1. DB acknowledgment
    await db.addAcknowledgment(paymentId, dueDate);

    // 2. Discord reactions in parallel
    const reactUser = message.react('✅').catch((err: unknown) => {
      throw new DiscordError('Failed to react to user reply', err);
    });

    const reactAlert = message.channel.messages
      .fetch(replyToId)
      .then(msg => msg.react('✅'))
      .catch((err: unknown) => {
        throw new DiscordError('Failed to react to original alert', err);
      });

    await Promise.all([reactUser, reactAlert]);
    console.log(`[AlertService] Acknowledged ${paymentId} for ${dueDate}`);
  } catch (err: unknown) {
    if (
      err instanceof DiscordError ||
      err instanceof NotFoundError ||
      err instanceof DatabaseError
    ) {
      throw err;
    }
    handleError(`[AlertService] Failed to process acknowledgment for ${paymentId}:`, err);
  }
}

export async function recordAlert(
  messageId: string,
  paymentId: string,
  dueDate: string
): Promise<void> {
  // Single source of truth — DB only, no store involvement
  await Promise.all([
    db.setLastAlert(paymentId, dueDate, new Date().toISOString()),
    db.setMessageMap(messageId, paymentId, dueDate),
  ]);
}