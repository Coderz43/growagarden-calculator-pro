// filename: api/log-calc.js
import { neon } from '@neondatabase/serverless';

export const config = { runtime: 'edge' };

// CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function pickFrom(obj, path) {
  try {
    let cur = obj;
    for (const key of path) {
      if (!cur || typeof cur !== 'object' || !(key in cur)) return null;
      cur = cur[key];
    }
    if (cur == null) return null;
    const s = String(cur);
    return s.length ? s : null;
  } catch {
    return null;
  }
}
function pickAny(sources, pathList) {
  for (const src of sources) {
    if (!src) continue;
    for (const p of pathList) {
      const v = pickFrom(src, p);
      if (v != null) return v;
    }
  }
  return null;
}
function toInt(n) {
  const x = Number(n);
  return Number.isFinite(x) ? Math.trunc(x) : null;
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // 🔐 Use multiple env fallbacks so all previews work
  const DB_URL =
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (!DB_URL) {
    return new Response(JSON.stringify({ error: 'DB URL missing' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const sql = neon(DB_URL);

  // Parse incoming event
  let event;
  try {
    event = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const referer   = req.headers.get('referer')    || event.referer    || null;
  const userAgent = req.headers.get('user-agent') || event.user_agent || null;

  const payload = event; // store whole snapshot for debugging

  // Derived columns
  const growthChoice = pickAny(
    [event, event.payload],
    [['inputs','growth'], ['growthChoice'], ['growth'], ['state','growth']]
  );
  const tempChoice = pickAny(
    [event, event.payload],
    [['inputs','temp'], ['tempChoice'], ['temperature'], ['state','temp']]
  );

  let envCount = 0;
  const envCandidates = [
    event?.inputs?.env,
    event?.payload?.inputs?.env,
    event?.env,
    event?.payload?.env,
  ];
  for (const arr of envCandidates) {
    if (Array.isArray(arr)) { envCount = arr.length; break; }
  }
  if (!envCount) {
    const maybe = toInt(
      event?.envCount ?? event?.payload?.envCount ?? event?.env_count ?? event?.payload?.env_count
    );
    if (maybe != null) envCount = maybe;
  }

  try {
    await sql`
      INSERT INTO public.calc_events (referer, user_agent, payload, growth_choice, temp_choice, env_count)
      VALUES (${referer}, ${userAgent}, ${JSON.stringify(payload)}, ${growthChoice}, ${tempChoice}, ${envCount})
    `;
    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'DB insert failed', detail: String(e) }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
