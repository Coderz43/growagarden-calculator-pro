// /api/get-records.js
import { neon } from "@neondatabase/serverless";

// ✅ Correct Vercel Edge signature
export const config = { runtime: "edge" };

export default async function handler(req) {
  try {
    const sql = neon(process.env.DATABASE_URL);

    const rows = await sql`
      SELECT
        id,
        created_at,
        growth_choice,
        temp_choice,
        env_count,
        total,
        crop
      FROM public.calc_events
      ORDER BY created_at DESC
      LIMIT 10
    `;

    return new Response(JSON.stringify({ success: true, data: rows }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
