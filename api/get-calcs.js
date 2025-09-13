// filename: api/get-calcs.js
import { neon } from '@neondatabase/serverless';
export const config = { runtime: 'edge' };
const sql = neon(process.env.DATABASE_URL);

const cors = { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,OPTIONS','Access-Control-Allow-Headers':'Content-Type' };

export default async function handler(req){
  if(req.method==='OPTIONS') return new Response(null,{status:200,headers:cors});
  if(req.method!=='GET') return new Response(JSON.stringify({error:'Method not allowed'}),{status:405,headers:{'Content-Type':'application/json',...cors}});
  const u=new URL(req.url);
  const q=(u.searchParams.get('q')||'').trim();
  const page=Math.max(1,parseInt(u.searchParams.get('page')||'1',10));
  const limit=Math.min(100,Math.max(1,parseInt(u.searchParams.get('limit')||'25',10)));
  const offset=(page-1)*limit;
  const orderBy=['created_at','total','weight'].includes(u.searchParams.get('orderBy'))?u.searchParams.get('orderBy'):'created_at';
  const dir=(u.searchParams.get('dir')||'desc').toLowerCase()==='asc'?'ASC':'DESC';

  let where=[]; let params=[];
  if(q){ where.push(`(crop ILIKE $1 OR growth_choice ILIKE $1 OR temp_choice ILIKE $1)`); params.push(`%${q}%`); }
  const whereSQL=where.length?`WHERE ${where.join(' AND ')}`:'';

  const rows = await sql(
    `SELECT id, created_at, total, crop, weight, growth_choice, temp_choice, env_count
     FROM public.calc_events
     ${whereSQL}
     ORDER BY ${orderBy} ${dir}
     LIMIT $${params.length+1} OFFSET $${params.length+2};`,
    [...params, limit, offset]
  );

  return new Response(JSON.stringify({page,limit,count:rows.length,rows}),{status:200,headers:{'Content-Type':'application/json',...cors}});
}
