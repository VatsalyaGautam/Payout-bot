import { APP_TIMEZONE } from '@/constants';

function todayInTz(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIMEZONE }).format(
        new Date()
    );
}

export function today(): string {
    return todayInTz();
}

export function daysUntil(dateStr: string): number {
    const nowStr = today();
    const now = new Date(`${nowStr}T00:00:00`);
    const target = new Date(`${dateStr}T00:00:00`);
    return Math.round(
        (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
}

export function nextOccurrence(dayOfMonth: number): string {
    const nowStr = today();
    const now = new Date(`${nowStr}T00:00:00`);
    const year = now.getFullYear();
    const month = now.getMonth();

    // Try current month first
    let candidate = safeDate(year, month, dayOfMonth);
    if (localDateString(candidate) < nowStr) {
        // Already past this month — move to next month
        candidate = safeDate(year, month + 1, dayOfMonth);
    }

    return localDateString(candidate);
}

export function dueDateThisMonth(dayOfMonth: number): string {
    const now = new Date(`${today()}T00:00:00`);
    return localDateString(
        safeDate(now.getFullYear(), now.getMonth(), dayOfMonth)
    );
}

function safeDate(year: number, month: number, day: number): Date {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return new Date(year, month, Math.min(day, lastDay));
}

function localDateString(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
