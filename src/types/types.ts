export interface Payment {
    id: string;
    name: string;
    dayOfMonth: number;
    nextDue: string; // YYYY-MM-DD override
    amount: number | string;
    currency: string;
    notes?: string | null;
    autoDebit: boolean;
    updatedAt?: string | null;
}

export interface PaymentsConfig {
    payments: Payment[];
}

export interface Acknowledgment {
    paymentId: string;
    dueDate: string;
    acknowledgedAt: string;
}

export interface LastAlert {
    paymentId: string;
    dueDate: string;
    alertedAt: string;
}

export interface AlertState {
    acknowledged: Acknowledgment[];
    lastAlerted: LastAlert[];
    /** Discord message ID → { paymentId, dueDate } */
    messageMap: Record<string, { paymentId: string; dueDate: string }>;
}

export interface UrgencyConfig {
    color: number;
    label: string;
    level: 'urgent' | 'soon' | 'upcoming';
}
