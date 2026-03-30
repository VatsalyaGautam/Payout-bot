import { TextChannel } from 'discord.js';
import { client } from '@/client';
import { daysUntil, nextOccurrence } from '@/utils/dates';
import { hasAcknowledgment, setMessageMap } from '@/db';
import { getAllPayments } from '@/services/payment.service';
import { CHANNEL_ID, ALERT_DAYS } from '@/constants';
import { handleError } from './errors';
import { buildAlertEmbed } from './embed';
import sql from '@/db/db';
import { Payment } from '@/types/db';

let cachedChannel: TextChannel | null = null;

async function getChannel(): Promise<TextChannel | null> {
    try {
        if (cachedChannel && cachedChannel.isTextBased()) {
            return cachedChannel;
        }

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

    console.log(
        `[${new Date().toISOString()}] Checking ${payments.length} payment(s)…`
    );

    for (const payment of payments) {
        try {
            const nextDue = resolveNextDue(payment);
            const days = daysUntil(nextDue);

            if (await hasAcknowledgment(payment.id, nextDue)) continue;
            if (days > ALERT_DAYS) continue;
            if (days < -1) continue;

            const alreadySent = await sql`
                SELECT 1 FROM last_alerts
                WHERE "paymentId" = ${payment.id}
                AND "dueDate" = ${nextDue}
                LIMIT 1
            `;

            if (alreadySent.length > 0) continue;

            const msg = await textChannel.send({
                content: days <= 0 ? '@here' : '',
                embeds: [buildAlertEmbed(payment, days, false)],
            });

            await Promise.all([
                sql`
                    INSERT INTO last_alerts ("paymentId", "dueDate", "alertedAt")
                    VALUES (${payment.id}, ${nextDue}, NOW())
                    ON CONFLICT DO NOTHING
                `,
                setMessageMap(msg.id, payment.id, nextDue),
            ]);

            console.log(`  Alert sent: ${payment.name}`);
        } catch (err: unknown) {
            handleError(`Failed for payment ${payment.id}`, err);
        }
    }
}