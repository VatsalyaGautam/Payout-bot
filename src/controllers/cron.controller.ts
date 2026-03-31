import { checkPayments } from '@/utils/checker';

export async function handleCron(): Promise<void> {
    console.log(`[CronController] Running scheduled check...`);
    await checkPayments();
}
