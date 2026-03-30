import { loadConfig, loadState, saveState } from '@/store';
import { today, nextOccurrence } from '@/utils/dates';
import { handleError } from './errors';

export async function acknowledge(paymentId: string): Promise<void> {
    const { payments } = await loadConfig();
    const state = await loadState();

    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) {
        handleError('Acknowledge:', `No payment found with id "${paymentId}"\n    Available ids: ${payments.map((p) => p.id).join(', ')}`);
        process.exit(1);
    }

    const nextDue = payment.nextDue ?? nextOccurrence(payment.dayOfMonth);

    const isAcknowledged = state.acknowledged.some(
        (a) => a.paymentId === payment.id && a.dueDate === nextDue
    );

    if (isAcknowledged) {
        console.log(
            `${payment.name} (${nextDue}) is already acknowledged`
        );
        return;
    }

    state.acknowledged.push({
        paymentId: payment.id,
        dueDate: nextDue,
        acknowledgedAt: today(),
    });

    await saveState(state);
    console.log(`Acknowledged: ${payment.name} for ${nextDue}`);
}
