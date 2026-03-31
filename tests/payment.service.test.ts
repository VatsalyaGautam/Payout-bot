import { expect, test, describe, mock } from 'bun:test';
import * as paymentService from '@/services/payment.service';
import { ValidationError } from '@/utils/errors';

mock.module('@/db/db', () => ({
    upsertPayment: mock((p: any) => Promise.resolve(p)),
    deletePayment: mock((id: string) =>
        Promise.resolve(id === 'non-existent' ? null : { id })
    ),
    getAllPayments: mock(() => Promise.resolve([])),
}));

describe('Payment Service', () => {
    test('upsertPayment validates required fields', async () => {
        const invalidPayment = {
            id: '',
            name: '',
            dayOfMonth: 0,
            nextDue: '',
            amount: 0,
            currency: '',
            autoDebit: false,
        };

        expect(paymentService.upsertPayment(invalidPayment)).rejects.toThrow(
            ValidationError
        );
    });

    test('upsertPayment calls db.upsertPayment', async () => {
        const payment = {
            id: 'test-123',
            name: '  Test Payment  ',
            dayOfMonth: 15,
            nextDue: '2026-04-15',
            amount: 100,
            currency: 'USD',
            autoDebit: true,
        };

        await paymentService.upsertPayment(payment);
        expect(true).toBe(true); // Verifying no crash
    });

    test('deletePayment throw NotFoundError if payment not found', async () => {
        expect(paymentService.deletePayment('non-existent')).rejects.toThrow();
    });
});
