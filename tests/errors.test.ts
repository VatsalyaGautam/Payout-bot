import { expect, test, describe } from 'bun:test';
import {
    AppError,
    ValidationError,
    DatabaseError,
    NotFoundError,
} from '@/utils/errors';

describe('Error Handling', () => {
    test('AppError is correctly instantiated', () => {
        const err = new AppError('Test error', true);
        expect(err.message).toBe('Test error');
        expect(err.ephemeral).toBe(true);
        expect(err.name).toBe('AppError');
    });

    test('ValidationError is an AppError', () => {
        const err = new ValidationError('Invalid input');
        expect(err).toBeInstanceOf(AppError);
        expect(err.message).toBe('Invalid input');
    });

    test('NotFoundError message is correctly formatted', () => {
        const err = new NotFoundError('User', '123');
        expect(err.message).toContain('User');
        expect(err.message).toContain('"123"');
    });
});
