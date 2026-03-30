import {
    upsertPayment,
    initDB,
    addAcknowledgment,
    setLastAlert,
} from './src/db/db';
import { today } from './src/utils/dates';

async function seed() {
    await initDB();
    console.log('🌱 Seeding comprehensive edge cases...');

    // Helper to get date string YYYY-MM-DD for relative days
    const relDate = (days: number) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
    };

    const relDay = (days: number) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d.getDate();
    };

    // 1. Due Today - Manual
    await upsertPayment({
        id: 'due-today-manual',
        name: 'Rent (Today)',
        dayOfMonth: relDay(0),
        amount: 2000,
        currency: 'USD',
        autoDebit: false,
        notes: 'Pay via bank transfer',
    });

    // 2. Due Today - Auto-Debit
    await upsertPayment({
        id: 'due-today-auto',
        name: 'Internet (Auto)',
        dayOfMonth: relDay(0),
        amount: 60,
        currency: 'USD',
        autoDebit: true,
    });

    // 3. Urgent (1 day left)
    await upsertPayment({
        id: 'urgent-1d',
        name: 'Electric Bill',
        dayOfMonth: relDay(1),
        amount: 120,
        currency: 'USD',
        autoDebit: false,
    });

    // 4. Soon (2 days left)
    await upsertPayment({
        id: 'soon-2d',
        name: 'Water Bill',
        dayOfMonth: relDay(2),
        amount: 45,
        currency: 'USD',
        autoDebit: false,
    });

    // 5. Upcoming (3 days left)
    await upsertPayment({
        id: 'upcoming-3d',
        name: 'Gym Membership',
        dayOfMonth: relDay(3),
        amount: 50,
        currency: 'USD',
        autoDebit: true,
    });

    // 6. Beyond Alert Window (10 days left)
    await upsertPayment({
        id: 'beyond-10d',
        name: 'Insurance',
        dayOfMonth: relDay(10),
        amount: 150,
        currency: 'USD',
        autoDebit: false,
    });

    // 7. Already Acknowledged (Due today but should skip)
    const ackId = 'already-acked';
    const ackDue = relDate(0);
    await upsertPayment({
        id: ackId,
        name: 'Phone Bill (Acked)',
        dayOfMonth: relDay(0),
        amount: 30,
        currency: 'USD',
        autoDebit: false,
    });
    await addAcknowledgment(ackId, ackDue);

    // 8. Already Alerted Today (Due today, skip if already alerted)
    const alertId = 'already-alerted';
    const alertDue = relDate(0);
    await upsertPayment({
        id: alertId,
        name: 'Streaming (Alerted)',
        dayOfMonth: relDay(0),
        amount: 15,
        currency: 'USD',
        autoDebit: true,
    });
    await setLastAlert(alertId, alertDue, today());

    // 9. Minimal Data (No amount, no notes)
    await upsertPayment({
        id: 'minimal',
        name: 'Minimal Payment',
        dayOfMonth: relDay(5),
        amount: 0,
        currency: 'USD',
        autoDebit: false,
    });

    console.log('✅ Edge cases seeded!');
    process.exit(0);
}

seed();
