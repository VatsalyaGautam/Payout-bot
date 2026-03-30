import postgres, { Sql } from 'postgres'
import { Payment, PaymentRow } from '@/types/db'
import { Acknowledgment, LastAlert } from '@/types/types'
import { DatabaseError } from '@/utils/errors'
import {
  DATABASE_URL,
  DB_POOL_MAX,
  DB_IDLE_TIMEOUT,
  DB_CONNECT_TIMEOUT,
} from '@/constants/constants'

const sql: Sql = postgres(DATABASE_URL, {
  max: DB_POOL_MAX,
  idle_timeout: DB_IDLE_TIMEOUT,
  connect_timeout: DB_CONNECT_TIMEOUT,
  transform: {
    ...postgres.camel,
    undefined: null,
  },
})

export async function initDB() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        "dayOfMonth" INT NOT NULL CHECK ("dayOfMonth" BETWEEN 1 AND 31),
        "nextDue" DATE NOT NULL,
        amount NUMERIC NOT NULL,
        currency TEXT NOT NULL CHECK (char_length(currency) = 3),
        notes TEXT,
        "autoDebit" BOOLEAN DEFAULT FALSE,
        "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (name, "dayOfMonth")
      );
    `

    await sql`
      CREATE TABLE IF NOT EXISTS acknowledgments (
        "paymentId" TEXT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
        "dueDate" DATE NOT NULL,
        "acknowledgedAt" TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY ("paymentId", "dueDate")
      );
    `

    await sql`
      CREATE TABLE IF NOT EXISTS last_alerts (
        "paymentId" TEXT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
        "dueDate" DATE NOT NULL,
        "alertedAt" TIMESTAMPTZ NOT NULL,
        PRIMARY KEY ("paymentId", "dueDate")
      );
    `

    await sql`
      CREATE TABLE IF NOT EXISTS message_map (
        "messageId" TEXT PRIMARY KEY,
        "paymentId" TEXT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
        "dueDate" DATE NOT NULL
      );
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_ack_paymentId 
      ON acknowledgments("paymentId");
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_last_alerts_paymentId 
      ON last_alerts("paymentId");
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_message_map_paymentId 
      ON message_map("paymentId");
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_ack_payment_due 
      ON acknowledgments("paymentId", "dueDate");
    `;
  } catch (err: unknown) {
    throw new DatabaseError(`Failed to initialize database: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ─── Payments ──────────────────────────────────────────────────────────────

export async function getAllPayments(): Promise<Payment[]> {
  try {
    const rows = await sql<PaymentRow[]>`
      SELECT id, name, "dayOfMonth", "nextDue", amount, currency, notes, "autoDebit", "updatedAt"
      FROM payments
      ORDER BY "nextDue" ASC
    `

    return rows.map(r => ({
      ...r,
      amount: Number(r.amount),
    }))
  } catch (err: unknown) {
    throw new DatabaseError(`Failed to fetch payments: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function upsertPayment(payment: Payment) {
  try {
    if (!payment.nextDue) {
      throw new Error("nextDue is required")
    }

    return await sql`
      INSERT INTO payments (id, name, "dayOfMonth", "nextDue", amount, currency, notes, "autoDebit", "updatedAt")
      VALUES (${payment.id}, ${payment.name}, ${payment.dayOfMonth}, ${payment.nextDue}, ${payment.amount}, ${payment.currency}, ${payment.notes ?? null}, ${payment.autoDebit ?? false}, NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        "dayOfMonth" = EXCLUDED."dayOfMonth",
        "nextDue" = EXCLUDED."nextDue",
        amount = EXCLUDED.amount,
        currency = EXCLUDED.currency,
        notes = EXCLUDED.notes,
        "autoDebit" = EXCLUDED."autoDebit",
        "updatedAt" = NOW()
    `
  } catch (err: unknown) {
    throw new DatabaseError(`Failed to upsert payment ${payment.id}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function deletePayment(id: string) {
  try {
    const [row] = await sql<{ id: string }[]>`
      DELETE FROM payments WHERE id = ${id} RETURNING id
    `
    return row ?? null
  } catch (err: unknown) {
    throw new DatabaseError(`Failed to delete payment ${id}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ─── Acknowledgments ────────────────────────────────────────────────────────

export async function addAcknowledgment(paymentId: string, dueDate: string) {
  try {
    return await sql`
      INSERT INTO acknowledgments ("paymentId", "dueDate")
      VALUES (${paymentId}, ${dueDate})
      ON CONFLICT ("paymentId", "dueDate") DO NOTHING
    `
  } catch (err: unknown) {
    throw new DatabaseError(`Failed to add acknowledgment for ${paymentId}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function hasAcknowledgment(
  paymentId: string,
  dueDate: string
): Promise<boolean> {
  try {
    const [row] = await sql`
      SELECT 1 FROM acknowledgments 
      WHERE "paymentId" = ${paymentId} AND "dueDate" = ${dueDate}
      LIMIT 1
    `
    return !!row
  } catch (err: unknown) {
    throw new DatabaseError(
      `Failed to check acknowledgment for ${paymentId}: ${err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

export async function getAcknowledgments(): Promise<Acknowledgment[]> {
  try {
    return await sql<Acknowledgment[]>`
      SELECT "paymentId", "dueDate", "acknowledgedAt" FROM acknowledgments
    `
  } catch (err: unknown) {
    throw new DatabaseError(`Failed to fetch acknowledgments: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ─── Last Alerts ────────────────────────────────────────────────────────────

export async function setLastAlert(
  paymentId: string,
  dueDate: string,
  alertedAt: string
) {
  try {
    return await sql`
      INSERT INTO last_alerts ("paymentId", "dueDate", "alertedAt")
      VALUES (${paymentId}, ${dueDate}, ${alertedAt})
      ON CONFLICT ("paymentId", "dueDate") DO UPDATE SET
        "alertedAt" = EXCLUDED."alertedAt"
    `
  } catch (err: unknown) {
    throw new DatabaseError(`Failed to set last alert for ${paymentId}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function getLastAlerts(): Promise<LastAlert[]> {
  try {
    return await sql<LastAlert[]>`
      SELECT "paymentId", "dueDate", "alertedAt" FROM last_alerts
    `
  } catch (err: unknown) {
    throw new DatabaseError(`Failed to fetch last alerts: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ─── Message Map ───────────────────────────────────────────────────────────

export async function setMessageMap(messageId: string, paymentId: string, dueDate: string) {
  try {
    return await sql`
      INSERT INTO message_map ("messageId", "paymentId", "dueDate")
      VALUES (${messageId}, ${paymentId}, ${dueDate})
      ON CONFLICT ("messageId") DO UPDATE SET
        "paymentId" = EXCLUDED."paymentId",
        "dueDate" = EXCLUDED."dueDate"
    `
  } catch (err: unknown) {
    throw new DatabaseError(`Failed to set message map for ${messageId}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function getMessageMap(): Promise<Record<string, { paymentId: string; dueDate: string }>> {
  try {
    const rows = await sql<{ messageId: string; paymentId: string; dueDate: string }[]>`
      SELECT "messageId", "paymentId", "dueDate" FROM message_map
    `
    return Object.fromEntries(
      rows.map(r => [r.messageId, { paymentId: r.paymentId, dueDate: r.dueDate }])
    )
  } catch (err: unknown) {
    throw new DatabaseError(`Failed to fetch message map: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function getMessageMapping(
  messageId: string
): Promise<{ paymentId: string; dueDate: string } | undefined> {
  try {
    const [row] = await sql<{ paymentId: string; dueDate: string }[]>`
      SELECT "paymentId", "dueDate" FROM message_map 
      WHERE "messageId" = ${messageId}
    `
    return row ?? undefined
  } catch (err: unknown) {
    throw new DatabaseError(`Failed to fetch message mapping for ${messageId}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export default sql
