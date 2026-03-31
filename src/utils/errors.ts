import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { INTERACTION_ALREADY_REPLIED, UNKNOWN_INTERACTION } from '@/constants';

export class AppError extends Error {
  constructor(
    message: string,
    public ephemeral: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    // Fix prototype chain for inheritance in TS
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, true);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'A database error occurred.') {
    super(message, true);
    this.name = 'DatabaseError';
  }
}

export class InitializationError extends AppError {
  constructor(component: string, originalError?: unknown) {
    const msg =
      originalError instanceof Error ? originalError.message : String(originalError);
    super(`Failed to initialize ${component}: ${msg}`, false);
    this.name = 'InitializationError';
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id: string) {
    super(`${entity} with ID "${id}" was not found.`, true);
    this.name = 'NotFoundError';
  }
}

export class DiscordError extends AppError {
  constructor(
    message: string,
    public originalError?: unknown
  ) {
    super(`Discord API Error: ${message}`, true);
    this.name = 'DiscordError';
  }
}

export async function handleInteractionError(
  interaction: ChatInputCommandInteraction,
  error: unknown
) {
  const isValidation = error instanceof ValidationError || error instanceof NotFoundError;
  const context = `[Interaction: ${interaction.commandName}]`;

  if (isValidation) {
    console.warn(`[${new Date().toISOString()}] [WARN] ${context} ${(error as Error).message}`);
  } else {
    handleError(context, error);
  }

  let content = 'Sorry, an internal error occurred while processing your command.';
  const ephemeral = error instanceof AppError ? error.ephemeral : true;

  if (error instanceof AppError) {
    content = error.message;
  }

  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content });
    } else if (interaction.isRepliable()) {
      await interaction.reply({
        content,
        flags: ephemeral ? MessageFlags.Ephemeral : undefined,
      });
    }
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      'code' in err &&
      (err as any).code !== INTERACTION_ALREADY_REPLIED &&
      (err as any).code !== UNKNOWN_INTERACTION
    ) {
      handleError('Failed to send error reply:', err);
    }
  }
}

export function handleError(context: string, error: unknown) {
  const timestamp = new Date().toISOString();
  const type = error instanceof Error ? error.name : 'Error';
  const message = error instanceof Error ? error.message : String(error);

  let level = 'ERROR';
  if (!(error instanceof AppError)) {
    level = 'CRITICAL';
  } else if (error instanceof ValidationError || error instanceof NotFoundError) {
    level = 'WARN';
  }

  console.error(`[${timestamp}] [${level}] ${context} ${type}: ${message}`);

  if (error instanceof Error && error.stack && !(error instanceof AppError)) {
    console.error(error.stack);
  }
}