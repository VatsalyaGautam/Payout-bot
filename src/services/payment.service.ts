import * as db from '@/db/db';
import { Payment } from '@/types/db';
import { ValidationError, NotFoundError } from '@/utils/errors';

export async function getAllPayments(): Promise<Payment[]> {
    // Business rule: Fetch sorted by nextDue (already handled by DB, but service ensures it)
    return db.getAllPayments();
}

export async function upsertPayment(payment: Payment): Promise<void> {
    // Validation
    if (!payment.id) throw new ValidationError('Payment ID is required');
    if (!payment.name.trim()) throw new ValidationError('Payment name is required');
    if (payment.dayOfMonth < 1 || payment.dayOfMonth > 31) {
        throw new ValidationError('Day of month must be between 1 and 31');
    }
    
    // Normalize data
    payment.name = payment.name.trim();
    
    await db.upsertPayment(payment);
}

export async function deletePayment(id: string): Promise<void> {
    const result = await db.deletePayment(id);
    if (!result) throw new NotFoundError('Payment', id);
}
