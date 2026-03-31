import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { nextOccurrence, daysUntil, dueDateThisMonth } from '@/utils/dates';
import { hasAcknowledgment, addAcknowledgment } from '@/db/db';
import {
    getAllPayments,
    upsertPayment,
    deletePayment,
} from '@/services/payment.service';
import { ValidationError } from '@/utils/errors';
import { checkRow as Row } from '@/types/checkCommand';

export async function handleCheckCommand(
    interaction: ChatInputCommandInteraction
): Promise<void> {
    const payments = await getAllPayments();

    const rows: Row[] = await Promise.all(
        payments.map(async (payment) => {
            const dueDate = nextOccurrence(payment.dayOfMonth);
            const paid = await hasAcknowledgment(payment.id, dueDate);
            const days = daysUntil(dueDate);

            const status = paid
                ? '✅ Paid'
                : days < 0
                    ? '⚠ Overdue'
                    : days === 0
                        ? '🚨 Due Today'
                        : `Due in ${days}d`;

            const symbol = payment.currency === 'INR' ? '₹' : '$';
            const amount = `${symbol}${payment.amount}`;

            const d = new Date(`${dueDate}T00:00:00`);
            const monthKey = d.toLocaleString('default', {
                month: 'long',
                year: 'numeric',
            });

            return {
                text: `**${payment.name}**\n\`${payment.id}\` • ${amount} • ${status} • ${dueDate}`,
                paid,
                dueDate,
                monthKey,
            };
        })
    );

    const sorted = rows.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    let description = '';
    let currentMonthHeader = '';
    for (const r of sorted) {
        if (r.monthKey !== currentMonthHeader) {
            currentMonthHeader = r.monthKey;
            description += `\n**${currentMonthHeader}**\n\n`;
        }
        description += r.text + '\n\n';
    }

    const now = new Date();
    const currentMonthKey = now.toLocaleString('default', {
        month: 'long',
        year: 'numeric',
    });
    const currentMonthRows = rows.filter((r) => r.monthKey === currentMonthKey);
    const paidInCurrentMonth = currentMonthRows.filter((r) => r.paid).length;
    const totalInCurrentMonth = currentMonthRows.length;
    const allPaid =
        paidInCurrentMonth === totalInCurrentMonth && totalInCurrentMonth > 0;
    const nothingDue = totalInCurrentMonth === 0;
    const footerText = nothingDue
        ? rows.length > 0
            ? "You're all set for this month 🎉"
            : 'No payments configured for this month'
        : `${paidInCurrentMonth}/${totalInCurrentMonth} paid this month`;

    const embed = new EmbedBuilder()
        .setTitle('Payment Overview')
        .setDescription(description || 'No payments configured.')
        .setColor(nothingDue || allPaid ? 0x10b981 : 0x6366f1)
        .setFooter({
            text: footerText,
        })
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

export async function handleAddCommand(
    interaction: ChatInputCommandInteraction
): Promise<void> {
    const name = interaction.options.getString('name', true).trim();
    const dayOfMonth = interaction.options.getInteger('day-of-month', true);
    const amount = interaction.options.getNumber('payment_amount', true);
    const currency = interaction.options.getString('currency', true) as
        | 'USD'
        | 'INR';
    const notes = interaction.options.getString('notes')?.trim() ?? undefined;
    const autoDebit = interaction.options.getBoolean('auto-debit') ?? false;

    if (!name || name.length > 100)
        throw new ValidationError('Name must be between 1 and 100 characters.');
    if (amount < 0.01 || amount > 1_000_000)
        throw new ValidationError('Amount must be between 0.01 and 1,000,000.');
    if (notes && notes.length > 500)
        throw new ValidationError('Notes are too long (max 500 characters).');

    const slug = name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    const suffix = Math.random().toString(36).substring(2, 6);
    const id = `${slug}-${suffix}`;

    await upsertPayment({
        id,
        name,
        dayOfMonth,
        nextDue: nextOccurrence(dayOfMonth),
        amount,
        currency,
        notes,
        autoDebit,
    });

    const symbol = currency === 'INR' ? '₹' : '$';
    const embed = new EmbedBuilder()
        .setTitle('Payment Added')
        .setDescription(
            `Successfully added **${name}** to your payment schedule`
        )
        .setColor(0x10b981)
        .addFields(
            { name: 'Payment ID', value: `\`${id}\``, inline: true },
            { name: 'Amount', value: `${symbol}${amount}`, inline: true },
            {
                name: 'Due Day',
                value: `${dayOfMonth} of each month`,
                inline: true,
            },
            {
                name: 'Auto-Debit',
                value: autoDebit ? 'Enabled' : 'Disabled',
                inline: true,
            }
        )
        .setTimestamp();

    if (notes) embed.addFields({ name: 'Notes', value: notes, inline: false });

    await interaction.editReply({ embeds: [embed] });
}

export async function handleUpdateCommand(
    interaction: ChatInputCommandInteraction
): Promise<void> {
    const id = interaction.options.getString('id', true);
    const payments = await getAllPayments();
    const existing = payments.find((p) => p.id === id);

    if (!existing)
        throw new ValidationError(`Payment with ID \`${id}\` not found.`);

    const name = interaction.options.getString('name')?.trim() ?? existing.name;
    const dayOfMonth =
        interaction.options.getInteger('day-of-month') ?? existing.dayOfMonth;
    const amount =
        interaction.options.getNumber('payment_amount') ?? existing.amount;
    const currency =
        (interaction.options.getString('currency') as 'USD' | 'INR') ??
        existing.currency;
    const notes =
        interaction.options.getString('notes')?.trim() ?? existing.notes;
    const autoDebit =
        interaction.options.getBoolean('auto-debit') ?? existing.autoDebit;
    const markAsPaid = interaction.options.getBoolean('mark-as-paid') ?? false;

    if (!name || name.length > 100)
        throw new ValidationError('Name must be between 1 and 100 characters.');
    if (amount < 0.01 || amount > 1_000_000)
        throw new ValidationError('Amount must be between 0.01 and 1,000,000.');
    if (notes && notes.length > 500)
        throw new ValidationError('Notes are too long (max 500 characters).');

    // Recalculate nextDue if dayOfMonth changed, otherwise keep existing
    const nextDue =
        dayOfMonth !== existing.dayOfMonth
            ? nextOccurrence(dayOfMonth)
            : existing.nextDue;

    await upsertPayment({
        id,
        name,
        dayOfMonth,
        nextDue,
        amount,
        currency,
        notes,
        autoDebit,
    });

    if (markAsPaid) {
        const dueDate = dueDateThisMonth(dayOfMonth);
        await addAcknowledgment(id, dueDate);
    }

    const symbol = currency === 'INR' ? '₹' : '$';
    const embed = new EmbedBuilder()
        .setTitle('Payment Updated')
        .setDescription(
            `Successfully updated **${name}**${markAsPaid ? ' and marked as paid for this month' : ''}`
        )
        .setColor(0x3b82f6)
        .addFields(
            { name: 'Payment ID', value: `\`${id}\``, inline: true },
            { name: 'Amount', value: `${symbol}${amount}`, inline: true },
            {
                name: 'Due Day',
                value: `${dayOfMonth} of each month`,
                inline: true,
            },
            {
                name: 'Auto-Debit',
                value: autoDebit ? 'Enabled' : 'Disabled',
                inline: true,
            }
        )
        .setTimestamp();

    if (notes) embed.addFields({ name: 'Notes', value: notes, inline: false });

    await interaction.editReply({ embeds: [embed] });
}

export async function handleDeleteCommand(
    interaction: ChatInputCommandInteraction
): Promise<void> {
    const id = interaction.options.getString('id', true);
    const payments = await getAllPayments();
    const existing = payments.find((p) => p.id === id);

    if (!existing)
        throw new ValidationError(`Payment with ID \`${id}\` not found.`);

    await deletePayment(id);

    const embed = new EmbedBuilder()
        .setTitle('Payment Deleted')
        .setDescription(
            `Successfully removed **${existing.name}** from your payment schedule`
        )
        .setColor(0xef4444)
        .addFields({ name: 'Payment ID', value: `\`${id}\``, inline: true })
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}
