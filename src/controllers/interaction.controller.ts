import {
    ChatInputCommandInteraction,
    AutocompleteInteraction,
    MessageFlags,
    Interaction,
} from 'discord.js';

import {
    handleCheckCommand,
    handleAddCommand,
    handleUpdateCommand,
    handleDeleteCommand,
} from '@/commands';

import { getAllPayments } from '@/services/payment.service';
import { handleInteractionError, handleError } from '@/utils/errors';

const handlers = {
    check: handleCheckCommand,
    add: handleAddCommand,
    update: handleUpdateCommand,
    delete: handleDeleteCommand,
};

export async function handleInteraction(
    interaction: Interaction
): Promise<void> {
    if (interaction.isAutocomplete()) {
        await handleAutocomplete(interaction);
    } else if (interaction.isChatInputCommand()) {
        await handleChatInput(interaction);
    } else {
        console.warn(
            `[InteractionController] Unknown interaction type: ${interaction.type}`
        );
    }
}

async function handleAutocomplete(
    interaction: AutocompleteInteraction
): Promise<void> {
    try {
        const focusedValue = interaction.options.getFocused();

        // ⏱ Timeout protection (2s)
        const payments = await Promise.race([
            getAllPayments(),
            new Promise<never>((_, reject) =>
                setTimeout(
                    () => reject(new Error('Autocomplete timeout')),
                    2000
                )
            ),
        ]);

        const filtered = payments
            .filter(
                (p) =>
                    (p.id ?? '')
                        .toLowerCase()
                        .includes(focusedValue.toLowerCase()) ||
                    (p.name ?? '')
                        .toLowerCase()
                        .includes(focusedValue.toLowerCase())
            )
            .slice(0, 25);

        await interaction.respond(
            filtered.map((p) => ({
                name: `${p.name} (${p.id})`,
                value: p.id,
            }))
        );
    } catch (err: unknown) {
        handleError(
            `[InteractionController] Autocomplete error (${interaction.id})`,
            err
        );

        if (!interaction.responded) {
            try {
                await interaction.respond([]);
            } catch (e: unknown) {
                handleError(
                    '[InteractionController] Failed to send empty autocomplete response',
                    e
                );
            }
        }
    }
}

async function handleChatInput(
    interaction: ChatInputCommandInteraction
): Promise<void> {
    const start = Date.now();
    console.log(
        `[InteractionController] Received "${interaction.commandName}" (ID: ${interaction.id})`
    );

    try {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        }

        const handler =
            handlers[interaction.commandName as keyof typeof handlers];

        if (!handler) {
            throw new Error(`Unknown command: ${interaction.commandName}`);
        }

        await handler(interaction);

        console.log(
            `[InteractionController] "${interaction.commandName}" finished in ${Date.now() - start}ms`
        );
    } catch (err: unknown) {
        await handleInteractionError(interaction, err);
    }
}
