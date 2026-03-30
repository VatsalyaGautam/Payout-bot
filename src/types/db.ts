export interface Payment {
    id: string
    name: string
    dayOfMonth: number
    nextDue: string
    amount: number
    currency: string
    notes?: string | null
    autoDebit: boolean
    updatedAt?: string | null
}

export interface PaymentRow {
    id: string
    name: string
    dayOfMonth: number
    nextDue: string
    amount: string
    currency: string
    notes?: string | null
    autoDebit: boolean
    updatedAt?: string | null
}

