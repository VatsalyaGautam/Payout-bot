import { handleError } from './errors';

export function getEnv(
  key: string,
  defaultValue?: string,
  required: boolean = false
): string {
  const value = Bun.env[key];
  if (!value && required) {
    handleError('Config:', `${key} is not set`);
    process.exit(1);
  }
  return value ?? defaultValue ?? '';
}

export function getEnvNumber(key: string, defaultValue: number): number {
  const raw = Bun.env[key];
  if (!raw) return defaultValue;
  const num = Number(raw);
  if (Number.isNaN(num)) {
    handleError('Config:', `${key} must be a valid number`);
    process.exit(1);
  }
  return num;
}