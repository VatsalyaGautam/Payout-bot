import { expect, test, describe } from 'bun:test';
import { nextOccurrence, daysUntil, today } from '@/utils/dates';

describe('Date Utilities', () => {
    test('nextOccurrence identifies today if matching dayOfMonth', () => {
        const now = new Date();
        const day = now.getDate();
        const result = nextOccurrence(day);
        expect(result).toBe(today());
    });

    test('nextOccurrence pushes to next month if dayOfMonth passed', () => {
        const result = nextOccurrence(1); // 1st is always passed by the 27th
        const m = Number(result.split('-')[1]);
        const now = new Date();
        expect(m).toBe(((now.getMonth() + 1) % 12) + 1);
    });

    test('daysUntil calculates 0 for today', () => {
        expect(daysUntil(today())).toBe(0);
    });

    test('daysUntil calculates positive for tomorrow', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        expect(daysUntil(tomorrowStr)).toBe(1);
    });
});
