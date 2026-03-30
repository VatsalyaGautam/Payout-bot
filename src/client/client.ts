import {
    Client,
    GatewayIntentBits,
    Partials,
    REST,
    Routes,
    SlashCommandBuilder,
} from 'discord.js';

import {
    BOT_TOKEN,
    APPLICATION_ID,
} from '@/constants';
import { handleError } from '@/utils/errors';

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel],
});

/** Register slash commands — safe to call every startup */
export async function registerCommands(guildId?: string): Promise<void> {
    const commands = [
        new SlashCommandBuilder()
            .setName('check')
            .setDescription('Show all payments due this month and their status')
            .toJSON(),

        new SlashCommandBuilder()
            .setName('add')
            .setDescription('Add a new payment')
            .addStringOption((opt) =>
                opt.setName('name')
                    .setDescription('Display name (e.g. Rent)')
                    .setRequired(true)
            )
            .addIntegerOption((opt) =>
                opt.setName('day-of-month')
                    .setDescription('Day of the month (1-31)')
                    .setRequired(true)
                    .setMinValue(1)
                    .setMaxValue(31)
            )
            .addNumberOption((opt) =>
                opt.setName('payment_amount')
                    .setDescription('Amount (e.g. 1200)')
                    .setRequired(true)
                    .setMinValue(0.01)
            )
            .addStringOption((opt) =>
                opt.setName('currency')
                    .setDescription('Currency (USD or INR)')
                    .setRequired(true)
                    .addChoices(
                        { name: 'USD ($)', value: 'USD' },
                        { name: 'INR (₹)', value: 'INR' }
                    )
            )
            .addBooleanOption((opt) =>
                opt.setName('auto-debit')
                    .setDescription('Is auto-debit enabled?')
            )
            .addStringOption((opt) =>
                opt.setName('notes').setDescription('Additional notes')
            )
            .toJSON(),

        new SlashCommandBuilder()
            .setName('update')
            .setDescription('Update an existing payment')
            .addStringOption((opt) =>
                opt.setName('id')
                    .setDescription('ID of the payment to update')
                    .setRequired(true)
                    .setAutocomplete(true)
            )
            .addStringOption((opt) =>
                opt.setName('name').setDescription('New display name')
            )
            .addIntegerOption((opt) =>
                opt.setName('day-of-month')
                    .setDescription('New day of the month (1-31)')
                    .setMinValue(1)
                    .setMaxValue(31)
            )
            .addNumberOption((opt) =>
                opt.setName('payment_amount')
                    .setDescription('New amount')
                    .setMinValue(0.01)
            )
            .addStringOption((opt) =>
                opt.setName('currency')
                    .setDescription('New currency')
                    .addChoices(
                        { name: 'USD ($)', value: 'USD' },
                        { name: 'INR (₹)', value: 'INR' }
                    )
            )
            .addBooleanOption((opt) =>
                opt.setName('auto-debit')
                    .setDescription('New auto-debit status')
            )
            .addStringOption((opt) =>
                opt.setName('notes').setDescription('New notes')
            )
            .addBooleanOption((opt) =>
                opt.setName('mark-as-paid')
                    .setDescription('Mark this payment as paid for the current month')
            )
            .toJSON(),

        new SlashCommandBuilder()
            .setName('delete')
            .setDescription('Delete a payment')
            .addStringOption((opt) =>
                opt.setName('id')
                    .setDescription('ID of the payment to delete')
                    .setRequired(true)
                    .setAutocomplete(true)
            )
            .toJSON(),
    ];

    const rest = new REST({ version: '10' }).setToken(BOT_TOKEN!);

    try {
        if (guildId) {
            await rest.put(
                Routes.applicationGuildCommands(APPLICATION_ID!, guildId),
                { body: commands }
            );
            console.log(`Slash commands registered for Guild: ${guildId}`);
        } else {
            await rest.put(
                Routes.applicationCommands(APPLICATION_ID!),
                { body: commands }
            );
            console.log('Slash commands registered globally (may take up to 1h)');
        }
    } catch (err: unknown) {
        handleError('Failed to register slash commands', err);
        throw err;
    }
}
// export { BOT_TOKEN, GUILD_ID };