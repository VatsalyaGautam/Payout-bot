import * as db from '@/db/db';
import { Payment } from '@/types/db';
import { ValidationError, NotFoundError } from '@/utils/errors';

export async function getAllPayments(): Promise<Payment[]> {
  return db.getAllPayments();
}

export async function upsertPayment(payment: Payment): Promise<void> {
  if (!payment.id) throw new ValidationError('Payment ID is required');
  if (!payment.name.trim()) throw new ValidationError('Payment name is required');
  if (!payment.nextDue) throw new ValidationError('Next due date is required');
  if (payment.dayOfMonth < 1 || payment.dayOfMonth > 31) {
    throw new ValidationError('Day of month must be between 1 and 31');
  }

  await db.upsertPayment({ ...payment, name: payment.name.trim() });
}

export async function deletePayment(id: string): Promise<void> {
  const result = await db.deletePayment(id);
  if (!result) throw new NotFoundError('Payment', id);
}