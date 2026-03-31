import { TextChannel } from 'discord.js';
import { client } from '@/client';
import { daysUntil, nextOccurrence } from '@/utils/dates';
import { hasAcknowledgment, hasAlertBeenSent } from '@/db/db';
import { getAllPayments } from '@/services/payment.service';
import { recordAlert } from '@/services/alert.service';
import { CHANNEL_ID, ALERT_DAYS } from '@/constants';
import { handleError } from './errors';
import { buildAlertEmbed } from './embed';
import { Payment } from '@/types/db';

let cachedChannel: TextChannel | null = null;

async function getChannel(): Promise<TextChannel | null> {
  try {
    if (cachedChannel?.isTextBased()) return cachedChannel;

    const channel = await client.channels.fetch(CHANNEL_ID!);
    if (!channel?.isTextBased()) {
      cachedChannel = null;
      return null;
    }

    cachedChannel = channel as TextChannel;
    return cachedChannel;
  } catch {
    cachedChannel = null;
    return null;
  }
}

export function resolveNextDue(payment: Payment): string {
  return payment.nextDue ?? nextOccurrence(payment.dayOfMonth);
}

export async function checkPayments(): Promise<void> {
  const payments = await getAllPayments();
  const textChannel = await getChannel();

  if (!textChannel) {
    handleError('Checker:', 'Channel not found or not text-based');
    return;
  }

  console.log(`[${new Date().toISOString()}] Checking ${payments.length} payment(s)…`);

  for (const payment of payments) {
    try {
      const nextDue = resolveNextDue(payment);
      const days = daysUntil(nextDue);

      if (days > ALERT_DAYS) continue;

      if (days < -1) {
        console.warn(`  [SKIP] Overdue (${days}d): ${payment.name} due ${nextDue}`);
        continue;
      }

      if (await hasAcknowledgment(payment.id, nextDue)) continue;
      if (await hasAlertBeenSent(payment.id, nextDue)) continue;

      const msg = await textChannel.send({
        content: days <= 0 ? '@here' : '',
        embeds: [buildAlertEmbed(payment, days, false, nextDue)],
      });

      await recordAlert(msg.id, payment.id, nextDue);
      console.log(`  Alert sent: ${payment.name}`);
    } catch (err: unknown) {
      handleError(`Failed for payment ${payment.id}`, err);
    }
  }
}