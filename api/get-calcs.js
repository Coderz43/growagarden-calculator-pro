// filename: api/get-calcs.js
import { neon } from '@neondatabase/serverless';

export const config = { runtime: 'edge' };

const sql = neon(process.env.DATABASE_URL);

// very light CORS (safe even for same-origin)
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: cors });
  }
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json', ...cors },
    });
  }

  // --- query params ---
  const url = new URL(req.url);
  const q      = (url.searchParams.get('q') || '').trim();     // search in crop/growth/temp
  const limit  = Math.min(+(url.searchParams.get('limit') || 25), 100);
  const page   = Math.max(+(url.searchParams.get('page') || 1), 1); // 1-based
  const offset = (page - 1) * limit;
  const order  = (url.searchParams.get('order') || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  // --- build WHERE ---
  // note: keep columns we actually have (no referer/user_agent)
  const like = q ? `%${q}%` : null;

  try {
    // total count
    const [{ count }] = await sql/*sql*/`
      SELECT COUNT(*)::int AS count
      FROM public.calc_events
      WHERE (${like} IS NULL)
         OR (crop ILIKE ${like})
         OR (growth_choice ILIKE ${like})
         OR (temp_choice ILIKE ${like})
    `;

    // page rows
    const rows = await sql/*sql*/`
      SELECT
        id,
        created_at,
        total,
        crop,
        weight,
        env_count,
        growth_choice,
        temp_choice
      FROM public.calc_events
      WHERE (${like} IS NULL)
         OR (crop ILIKE ${like})
         OR (growth_choice ILIKE ${like})
         OR (temp_choice ILIKE ${like})
      ORDER BY id ${order}
      LIMIT ${limit} OFFSET ${offset}
    `;

    return new Response(JSON.stringify({
      ok: true,
      page, limit, total: count,
      hasMore: (offset + rows.length) < count,
      rows
    }), { status: 200, headers: { 'Content-Type': 'application/json', ...cors }});
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:'DB query failed', detail:String(e) }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...cors }
    });
  }
}
