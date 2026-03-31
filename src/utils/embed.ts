import { Payment } from '@/types/db';
import { EmbedBuilder } from 'discord.js';

export function buildAlertEmbed(
    payment: Payment,
    daysLeft: number,
    isReminder: boolean,
    nextDue: string
): EmbedBuilder {
    const color =
        daysLeft <= 0
            ? 0xef4444 // Soft red
            : daysLeft === 1
              ? 0xf97316 // Soft orange
              : daysLeft === 2
                ? 0xf59e0b // Soft amber
                : 0x6366f1; // Soft indigo

    const description = isReminder
        ? 'Friendly reminder — reply with `acknowledged` or `ack` when handled'
        : `Reply with \`acknowledged\` or \`ack\` once you've processed this payment`;

    const embed = new EmbedBuilder()
        .setTitle(payment.name)
        .setDescription(description)
        .setColor(color)
        .addFields(
            { name: 'Due Date', value: nextDue, inline: true },
            {
                name: 'Time Remaining',
                value:
                    daysLeft <= 0
                        ? 'Today'
                        : `${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
                inline: true,
            }
        )
        .setTimestamp();

    const symbol = payment.currency === 'INR' ? '₹' : '$';
    if (payment.amount > 0)
        embed.addFields({
            name: 'Amount',
            value: `${symbol}${payment.amount}`,
            inline: true,
        });

    if (payment.autoDebit)
        embed.addFields({ name: 'Auto-Debit', value: 'Enabled', inline: true });

    if (payment.notes)
        embed.addFields({ name: 'Notes', value: payment.notes, inline: false });

    return embed;
}
