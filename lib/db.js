// lib/db.js
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('Missing DATABASE_URL env var');
}

// Create a single tagged-template SQL client (serverless-friendly).
export const sql = neon(process.env.DATABASE_URL);

// Ensure table exists (idempotent). Safe to call on each cold start.
export async function ensureCalcEventsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS calc_events (
      id BIGSERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      total NUMERIC,
      crop TEXT,
      qty INTEGER,
      weight NUMERIC,
      friend_pct NUMERIC,
      max_mutation BOOLEAN,
      base_floor NUMERIC,
      growth_bonus NUMERIC,
      temperature_bonus NUMERIC,
      env JSONB,
      ua TEXT,
      referer TEXT,
      payload JSONB
    );
  `;
}
