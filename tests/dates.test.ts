import { expect, test, describe } from 'bun:test';
import {
    nextOccurrence,
    daysUntil,
    today,
    dueDateThisMonth,
} from '@/utils/dates';

// All date construction derives from today() so tests stay consistent
// with whatever APP_TIMEZONE is configured — no raw new Date() usage.

function addDays(dateStr: string, n: number): string {
    const d = new Date(`${dateStr}T00:00:00`);
    d.setDate(d.getDate() + n);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

describe('Date Utilities', () => {
    test('today() returns a valid YYYY-MM-DD string', () => {
        const result = today();
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('nextOccurrence returns today if dayOfMonth matches today', () => {
        const nowStr = today();
        const day = Number(nowStr.split('-')[2]);
        const result = nextOccurrence(day);
        expect(result).toBe(nowStr);
    });

    test('nextOccurrence pushes to next month if dayOfMonth already passed', () => {
        const nowStr = today();
        const currentDay = Number(nowStr.split('-')[2]);

        // Pick a day that is definitely in the past this month
        // If today is the 1st, skip this test — no day has passed yet
        if (currentDay === 1) {
            console.log(
                'Skipping: no past day available on the 1st of the month'
            );
            return;
        }

        const pastDay = 1; // day 1 is always past if today > 1
        const result = nextOccurrence(pastDay);

        const currentMonth = Number(nowStr.split('-')[1]);
        const resultMonth = Number(result.split('-')[1]);
        const currentYear = Number(nowStr.split('-')[0]);
        const resultYear = Number(result.split('-')[0]);

        const expectedMonth = currentMonth === 12 ? 1 : currentMonth + 1;
        const expectedYear =
            currentMonth === 12 ? currentYear + 1 : currentYear;

        expect(resultMonth).toBe(expectedMonth);
        expect(resultYear).toBe(expectedYear);
    });

    test('daysUntil returns 0 for today', () => {
        expect(daysUntil(today())).toBe(0);
    });

    test('daysUntil returns 1 for tomorrow', () => {
        const tomorrow = addDays(today(), 1);
        expect(daysUntil(tomorrow)).toBe(1);
    });

    test('daysUntil returns -1 for yesterday', () => {
        const yesterday = addDays(today(), -1);
        expect(daysUntil(yesterday)).toBe(-1);
    });

    test('dueDateThisMonth returns correct day in current month', () => {
        const nowStr = today();
        const yearMonth = nowStr.substring(0, 8); // "YYYY-MM-"
        const result = dueDateThisMonth(15);
        expect(result).toBe(`${yearMonth}15`);
    });

    test('dueDateThisMonth caps at last day of month', () => {
        // Day 31 in a 30-day month should return the 30th
        const nowStr = today();
        const year = Number(nowStr.split('-')[0]);
        const month = Number(nowStr.split('-')[1]);
        const lastDay = new Date(year, month, 0).getDate(); // last day of current month
        const result = dueDateThisMonth(31);
        const resultDay = Number(result.split('-')[2]);
        expect(resultDay).toBe(Math.min(31, lastDay));
    });
});
