// filename: api/log-calc.js
import { neon } from '@neondatabase/serverless';

export const config = {
  runtime: 'edge', // works great on Vercel + Neon http driver
};

const sql = neon(process.env.DATABASE_URL); // e.g. postgres://user:pass@host/db

function safeArrayLen(v) {
  try {
    if (Array.isArray(v)) return v.length;
    return 0;
  } catch {
    return 0;
  }
}

function pick(obj, pathList) {
  for (const p of pathList) {
    // p like ['inputs','growth'] or ['growth']
    let cur = obj;
    let ok = true;
    for (const key of p) {
      if (cur && typeof cur === 'object' && key in cur) {
        cur = cur[key];
      } else {
        ok = false; break;
      }
    }
    if (ok && cur != null && String(cur).length) return String(cur);
  }
  return null;
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const referer    = req.headers.get('referer') || body.referer || null;
  const userAgent  = req.headers.get('user-agent') || body.user_agent || null;
  const payload    = body.payload || body || {}; // accept raw body as payload if not nested

  // Derive fields on the server (don’t trust client)
  const growthChoice = pick(payload, [
    ['inputs', 'growth'],
    ['growth'],
    ['state', 'growth'],
  ]);

  const tempChoice = pick(payload, [
    ['inputs', 'temp'],
    ['temperature'],
    ['state', 'temp'],
  ]);

  // env candidates: payload.inputs.env (array), payload.env (array), explicit env_count
  let envCount = 0;
  try {
    if (Array.isArray(payload?.inputs?.env)) envCount = payload.inputs.env.length;
    else if (Array.isArray(payload?.env)) envCount = payload.env.length;
    else if (typeof payload?.env_count === 'number') envCount = payload.env_count;
  } catch {
    envCount = 0;
  }

  // Insert
  try {
    await sql/*sql*/`
      INSERT INTO public.calc_events (referer, user_agent, payload, growth_choice, temp_choice, env_count)
      VALUES (${referer}, ${userAgent}, ${JSON.stringify(payload)}, ${growthChoice}, ${tempChoice}, ${envCount})
    `;
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'DB insert failed', detail: String(e) }), { status: 500 });
  }
}
