// api/log-calc.js
import { sql, ensureCalcEventsTable } from '../lib/db.js';

const ALLOW_ORIGINS = [
  // Add your domains here (production + preview). For quick start, we allow all:
  '*'
];

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOW_ORIGINS.includes('*') ? '*' : ALLOW_ORIGINS.join(','));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    await ensureCalcEventsTable();

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    // Basic fields we expect from frontend; 'payload' stores the full snapshot
    const {
      total,
      crop,
      qty,
      weight,
      friendPct,
      maxMutation,
      baseFloor,
      growthBonus,
      temperatureBonus,
      envEntries,
      payload
    } = body;

    const ua = req.headers['user-agent'] || null;
    const referer = req.headers['referer'] || null;

    await sql`
      INSERT INTO calc_events (
        total, crop, qty, weight, friend_pct, max_mutation, base_floor,
        growth_bonus, temperature_bonus, env, ua, referer, payload
      )
      VALUES (
        ${total}, ${crop}, ${qty}, ${weight}, ${friendPct}, ${maxMutation}, ${baseFloor},
        ${growthBonus}, ${temperatureBonus}, ${envEntries ? JSON.stringify(envEntries) : null},
        ${ua}, ${referer}, ${payload ? JSON.stringify(payload) : null}
      )
    `;

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('log-calc error', err);
    return res.status(500).json({ ok: false, error: 'DB insert failed' });
  }
}
