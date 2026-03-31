import { expect, test, describe } from 'bun:test';
import { buildAlertEmbed } from '@/utils/embed';

describe('Embed Utilities', () => {
    test('buildAlertEmbed creates valid embed object', () => {
        const payment = {
            id: '1',
            name: 'Rent',
            amount: 1500,
            currency: 'USD',
            dayOfMonth: 1,
            nextDue: '2026-04-01',
            autoDebit: true,
        };

        const embed = buildAlertEmbed(payment, 0, false, '2026-04-01');
        expect(embed.data.title).toContain('Rent');
        expect(embed.data.fields).toBeDefined();
        expect(embed.data.fields?.length).toBeGreaterThan(0);
    });
});
