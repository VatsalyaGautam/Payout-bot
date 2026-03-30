import type { Payment, UrgencyConfig } from '@/types';
import { CHANNEL_ID, BOT_TOKEN } from '@/constants';

const BASE = 'https://discord.com/api/v10';

const headers = {
    Authorization: `Bot ${BOT_TOKEN}`,
    'Content-Type': 'application/json',
};

// ─── Low-level helpers ─────────────────────────────────────────────────────

async function apiRequest(
    method: string,
    path: string,
    body?: unknown
): Promise<unknown> {
    const res = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(
            `Discord API ${method} ${path} → ${res.status}: ${text}`
        );
    }

    // 204 No Content
    if (res.status === 204) return null;
    return res.json();
}

// ─── Public API ────────────────────────────────────────────────────────────

/** Send a payment alert to the configured channel. Returns the message ID. */
export async function sendPaymentAlert(
    payment: Payment,
    daysLeft: number,
    isReminder: boolean
): Promise<string> {
    const u = urgency(daysLeft);

    const fields: Array<{ name: string; value: string; inline?: boolean }> = [
        { name: 'Service', value: payment.name, inline: true },
        { 
            name: 'Due Date', 
            value: payment.nextDue!, 
            inline: true 
        },
        {
            name: 'Days Left',
            value: daysLeft <= 0 ? '**TODAY**' : `**${daysLeft} day(s)**`,
            inline: true,
        },
    ];

    if (payment.amount) {
        const symbol = payment.currency === 'INR' ? '₹' : '$';
        fields.push({ name: 'Amount', value: `${symbol}${payment.amount}`, inline: true });
    }
    if (payment.notes)
        fields.push({ name: 'Notes', value: payment.notes, inline: false });

    fields.push({
        name: 'How to acknowledge',
        value: 'Reply to **this message** with `acknowledged`',
        inline: false,
    });

    const msg = (await apiRequest('POST', `/channels/${CHANNEL_ID}/messages`, {
        content: u.level === 'urgent' ? '@here' : '',
        embeds: [
            {
                title: `${u.label} — ${payment.name}`,
                description: isReminder
                    ? 'This is a **reminder**. Reply with `acknowledged` to stop alerts.'
                    : 'A payment is coming up. Reply with `acknowledged` once paid.',
                color: u.color,
                fields,
                footer: {
                    text: `Payment Alert Bot • ${new Date().toLocaleString()}`,
                },
            },
        ],
    })) as { id: string };

    return msg.id;
}

/** Add a ✅ reaction to a message (silent acknowledgement). */
export async function reactWithCheck(messageId: string): Promise<void> {
    // Emoji must be URL-encoded for the API
    await apiRequest(
        'PUT',
        `/channels/${CHANNEL_ID}/messages/${messageId}/reactions/${encodeURIComponent('✅')}/@me`
    );
}

/** Delete a message (used to clean up "acknowledged" text replies). */
export async function deleteMessage(messageId: string): Promise<void> {
    await apiRequest('DELETE', `/channels/${CHANNEL_ID}/messages/${messageId}`);
}

/**
 * Poll for recent messages in the channel and return any that contain
 * "acknowledged" (case-insensitive) as a reply to a known bot message.
 * Returns an array of { replyToMessageId, ackMessageId }.
 */
export async function pollForAcknowledgements(
    knownMessageIds: Set<string>,
    afterMessageId?: string
): Promise<Array<{ replyToMessageId: string; ackMessageId: string }>> {
    const query = afterMessageId
        ? `?after=${afterMessageId}&limit=50`
        : `?limit=50`;

    const messages = (await apiRequest(
        'GET',
        `/channels/${CHANNEL_ID}/messages${query}`
    )) as Array<{
        id: string;
        content: string;
        message_reference?: { message_id?: string };
        author: { bot?: boolean };
    }>;

    const results: Array<{ replyToMessageId: string; ackMessageId: string }> =
        [];

    for (const msg of messages) {
        if (msg.author.bot) continue;

        const isAck = msg.content.trim().toLowerCase() === 'acknowledged';
        const replyTo = msg.message_reference?.message_id;

        if (isAck && replyTo && knownMessageIds.has(replyTo)) {
            results.push({ replyToMessageId: replyTo, ackMessageId: msg.id });
        }
    }

    return results;
}

// ─── Urgency ───────────────────────────────────────────────────────────────

function urgency(daysLeft: number): UrgencyConfig {
    if (daysLeft <= 0)
        return { color: 0xff2d2d, label: '🚨 DUE TODAY', level: 'urgent' };
    if (daysLeft === 1)
        return { color: 0xff5500, label: 'URGENT', level: 'urgent' };
    if (daysLeft === 2)
        return { color: 0xff8c00, label: 'DUE SOON', level: 'soon' };
    return { color: 0xffd700, label: 'UPCOMING', level: 'upcoming' };
}
