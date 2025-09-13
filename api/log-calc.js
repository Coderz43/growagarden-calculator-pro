// filename: api/log-calc.js
import { neon } from '@neondatabase/serverless';

export const config = { runtime: 'edge' };
const sql = neon(process.env.DATABASE_URL);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function pickFrom(obj, path) {
  try {
    let cur = obj;
    for (const k of path) {
      if (!cur || typeof cur !== 'object' || !(k in cur)) return null;
      cur = cur[k];
    }
    if (cur == null) return null;
    return String(cur);
  } catch { return null; }
}
function pickAny(sources, paths) {
  for (const src of sources) {
    if (!src) continue;
    for (const p of paths) {
      const v = pickFrom(src, p);
      if (v != null) return v;
    }
  }
  return null;
}
const toInt = (n)=> {
  const x = Number(n);
  return Number.isFinite(x) ? Math.trunc(x) : null;
};
const toNum = (n)=> {
  const x = Number(n);
  return Number.isFinite(x) ? x : null;
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // parse
  let event;
  try { event = await req.json(); }
  catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // sanitize payload for storage (UA/referer ko hata do agar aaye hon)
  const payload = { ...(event || {}) };
  delete payload.referer;
  delete payload.user_agent;
  if (payload.payload && typeof payload.payload === 'object') {
    delete payload.payload.referer;
    delete payload.payload.user_agent;
  }
  const payloadJSON = JSON.stringify(payload);

  // derived fields
  const growthChoice = pickAny([event, event?.payload],
    [['inputs','growth'], ['growthChoice'], ['growth'], ['state','growth']]);
  const tempChoice = pickAny([event, event?.payload],
    [['inputs','temp'], ['tempChoice'], ['temperature'], ['state','temp']]);

  let envCount = 0;
  for (const arr of [event?.inputs?.env, event?.payload?.inputs?.env, event?.env, event?.payload?.env]) {
    if (Array.isArray(arr)) { envCount = arr.length; break; }
  }
  if (!envCount) {
    const maybe = toInt(event?.envCount ?? event?.payload?.envCount ?? event?.env_count ?? event?.payload?.env_count);
    if (maybe != null) envCount = maybe;
  }

  // primary extraction
  const total  = toInt(pickAny([event, event?.payload], [['total']]));
  const crop   = pickAny([event, event?.payload], [['crop'], ['inputs','crop'], ['state','crop']]);
  const weight = toNum(pickAny([event, event?.payload], [['weight'], ['inputs','weight']]));

  try {
    // SQL fallback: if JS-side null, pull from payload JSON
    await sql/*sql*/`
      INSERT INTO public.calc_events
        (payload, growth_choice, temp_choice, env_count, total, crop, weight)
      VALUES (
        ${payloadJSON}::jsonb,
        ${growthChoice},
        ${tempChoice},
        ${envCount},
        COALESCE(${total},  (${payloadJSON}::jsonb->>'total')::bigint),
        COALESCE(${crop},   ${payloadJSON}::jsonb->>'crop'),
        COALESCE(${weight}, (${payloadJSON}::jsonb->>'weight')::numeric)
      )
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
