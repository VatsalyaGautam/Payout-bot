import type { AlertState, PaymentsConfig } from '@/types';
import {
    getAllPayments,
    getAcknowledgments,
    getLastAlerts,
    getMessageMap,
    setMessageMap,
    setLastAlert,
    addAcknowledgment,
} from '@/db';

export async function loadConfig(): Promise<PaymentsConfig> {
    const payments = await getAllPayments();
    return { payments };
}

export async function loadState(): Promise<AlertState> {
    const [acknowledged, lastAlerted, messageMap] = await Promise.all([
        getAcknowledgments(),
        getLastAlerts(),
        getMessageMap(),
    ]);

    return {
        acknowledged,
        lastAlerted,
        messageMap,
    };
}

export async function saveState(state: AlertState): Promise<void> {
    const promises: Promise<unknown>[] = [];

    // 1. messageMap
    for (const [messageId, mapping] of Object.entries(state.messageMap)) {
        promises.push(setMessageMap(messageId, mapping.paymentId, mapping.dueDate));
    }

    // 2. lastAlerted
    for (const alert of state.lastAlerted) {
        promises.push(setLastAlert(alert.paymentId, alert.dueDate, alert.alertedAt));
    }

    // 3. acknowledged
    for (const ack of state.acknowledged) {
        promises.push(addAcknowledgment(ack.paymentId, ack.dueDate));
    }

    await Promise.all(promises);
}
