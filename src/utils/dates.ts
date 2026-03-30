export function today(): string {
    return localDateString(new Date());
}

export function daysUntil(dateStr: string): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(`${dateStr}T00:00:00`);
    return Math.round(
        (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
}

/** Next occurrence of a day-of-month. If already past this month, returns next month's. 
 * Caps the day at the last day of the month (e.g. Feb 31 -> Feb 28).
 */
export function nextOccurrence(dayOfMonth: number): string {
    const nowStr = today();
    const now = new Date(`${nowStr}T00:00:00`);
    const year = now.getFullYear();
    const month = now.getMonth();

    // Try current month
    let candidate = safeDate(year, month, dayOfMonth);
    if (localDateString(candidate) < nowStr) {
        // Already past, go to next month
        candidate = safeDate(year, month + 1, dayOfMonth);
    }

    return localDateString(candidate);
}

function safeDate(year: number, month: number, day: number): Date {
    const d = new Date(year, month + 1, 0);
    const lastDay = d.getDate();
    return new Date(year, month, Math.min(day, lastDay));
}

/** The due date for a given day-of-month within the current calendar month. */
export function dueDateThisMonth(dayOfMonth: number): string {
    const now = new Date();
    return localDateString(
        safeDate(now.getFullYear(), now.getMonth(), dayOfMonth)
    );
}

function localDateString(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
