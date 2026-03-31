import { getAllPayments, hasAcknowledgment, addAcknowledgment } from '@/db/db';
import { nextOccurrence, today } from '@/utils/dates';
import { handleError } from './errors';

export async function acknowledge(paymentId: string): Promise<void> {
  const payments = await getAllPayments();
  const payment = payments.find((p) => p.id === paymentId);

  if (!payment) {
    handleError(
      'Acknowledge:',
      `No payment found with id "${paymentId}"\n    Available ids: ${payments.map((p) => p.id).join(', ')}`
    );
    process.exit(1);
  }

  const nextDue = payment.nextDue ?? nextOccurrence(payment.dayOfMonth);

  if (await hasAcknowledgment(payment.id, nextDue)) {
    console.log(`${payment.name} (${nextDue}) is already acknowledged`);
    return;
  }

  await addAcknowledgment(payment.id, nextDue);
  console.log(`Acknowledged: ${payment.name} for ${nextDue}`);
}