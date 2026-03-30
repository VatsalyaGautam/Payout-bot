import { expect, test, beforeAll } from 'bun:test';
import {
    initDB,
    upsertPayment,
    getAllPayments,
    deletePayment,
    addAcknowledgment,
    hasAcknowledgment,
    getAcknowledgments,
    setLastAlert,
    getLastAlerts,
    setMessageMap,
    getMessageMap,
} from '../src/db/db';
// sql is imported via the db module's internal state

beforeAll(async () => {
    await initDB();
});

test('Payment CRUD', async () => {
    const testPayment = {
        id: 'test-id',
        name: 'Test Payment',
        dayOfMonth: 15,
        amount: 100,
        currency: 'USD' as const,
        notes: 'Test notes',
        autoDebit: true,
    };

    await upsertPayment(testPayment);
    let payments = await getAllPayments();
    const found = payments.find((p) => p.id === 'test-id');
    expect(found).toBeDefined();
    expect(found?.autoDebit).toBe(true);

    testPayment.name = 'Updated Test Payment';
    await upsertPayment(testPayment);
    payments = await getAllPayments();
    expect(payments.find((p) => p.id === 'test-id')?.name).toBe(
        'Updated Test Payment'
    );

    await deletePayment('test-id');
    payments = await getAllPayments();
    expect(payments.find((p) => p.id === 'test-id')).toBeUndefined();
});

test('Acknowledgment operations', async () => {
    const paymentId = 'ack-test';
    const dueDate = '2026-03-27';

    await addAcknowledgment(paymentId, dueDate);
    const exists = await hasAcknowledgment(paymentId, dueDate);
    expect(exists).toBe(true);

    const acks = await getAcknowledgments();
    expect(acks[`${paymentId}_${dueDate}`]).toBeDefined();
});

test('Last Alert operations', async () => {
    const paymentId = 'alert-test';
    const dueDate = '2026-03-27';
    const alertedAt = '2026-03-27';

    await setLastAlert(paymentId, dueDate, alertedAt);
    const alerts = await getLastAlerts();
    expect(alerts[`${paymentId}_${dueDate}`]).toBe(alertedAt);
});

test('Message Map operations', async () => {
    const messageId = 'msg-123';
    const ackKey = 'payment-abc_2026-03-27';

    await setMessageMap(messageId, ackKey);
    const map = await getMessageMap();
    expect(map[messageId]).toBe(ackKey);
});
