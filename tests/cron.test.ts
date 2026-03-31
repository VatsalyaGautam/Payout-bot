import { expect, test, describe } from 'bun:test';
import { Cron } from 'croner';

describe('Cron Scheduling', () => {
    test('Daily 9 AM schedule is valid', () => {
        const job = new Cron('0 9 * * *');
        const next = job.nextRun();
        expect(next).toBeDefined();
        expect(next?.getHours()).toBe(9);
        expect(next?.getMinutes()).toBe(0);
    });

    test('Monthly 1st at midnight schedule is valid', () => {
        const job = new Cron('0 0 1 * *');
        const next = job.nextRun();
        expect(next).toBeDefined();
        expect(next?.getDate()).toBe(1);
        expect(next?.getHours()).toBe(0);
    });

    test('Short interval trigger works', async () => {
        let triggered = false;
        const job = new Cron('* * * * * *', () => {
            triggered = true;
        });

        // Wait slightly more than a second
        await new Promise((r) => setTimeout(r, 1100));
        job.stop();

        expect(triggered).toBe(true);
    });
});
