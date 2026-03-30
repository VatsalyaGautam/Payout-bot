import { checkPayments } from '@/utils/checker';
import { handleError } from '@/utils/errors';

export async function handleCron(): Promise<void> {
    try {
        console.log(`[CronController] Running scheduled check...`);
        await checkPayments();
    } catch (err: unknown) {
        handleError('[CronController] Failed to run check:', err);
    }
}
