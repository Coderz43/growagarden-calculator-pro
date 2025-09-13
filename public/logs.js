// filename: public/logs.js
const $ = (s, ctx=document) => ctx.querySelector(s);
const fmt = n => (n==null? '—' : Number(n).toLocaleString());

let state = { page: 1, limit: 25, q: '', order:'desc', total: 0 };

async function fetchPage() {
  const params = new URLSearchParams({
    page: String(state.page),
    limit: String(state.limit),
    order: state.order,
    q: state.q
  });
  $('#status').textContent = 'Loading…';
  const r = await fetch(`/api/get-calcs?${params.toString()}`);
  const data = await r.json();
  if (!data.ok) throw new Error(data.detail || 'failed');

  state.total = data.total;
  render(data.rows);
  $('#meta').textContent = `Total: ${fmt(data.total)} • Page ${state.page}`;
  $('#status').textContent = data.rows.length ? '' : 'No rows';
}

function render(rows) {
  const tb = $('#tbl tbody');
  tb.innerHTML = rows.map(row => {
    const d = new Date(row.created_at);
    const created = d.toLocaleString();
    return `<tr>
      <td>${row.id}</td>
      <td class="small muted">${created}</td>
      <td class="right">${fmt(row.total)}</td>
      <td>${row.crop || '—'}</td>
      <td class="right">${row.weight != null ? Number(row.weight).toFixed(3) : '—'}</td>
      <td class="right">${row.env_count ?? '—'}</td>
      <td><span class="pill">${row.growth_choice || '—'}</span></td>
      <td><span class="pill">${row.temp_choice || '—'}</span></td>
    </tr>`;
  }).join('');
}

function toCSV(rows) {
  const header = ['id','created_at','total','crop','weight','env_count','growth_choice','temp_choice'];
  const lines = [header.join(',')];
  rows.forEach(r=>{
    const vals = [
      r.id,
      new Date(r.created_at).toISOString(),
      r.total ?? '',
      (r.crop||'').replace(/,/g,''),
      r.weight ?? '',
      r.env_count ?? '',
      (r.growth_choice||'').replace(/,/g,''),
      (r.temp_choice||'').replace(/,/g,'')
    ];
    lines.push(vals.join(','));
  });
  return lines.join('\n');
}

async function exportCSV() {
  // fetch a big page for export (up to 1000)
  const r = await fetch(`/api/get-calcs?limit=1000&q=${encodeURIComponent(state.q)}&order=${state.order}&page=1`);
  const data = await r.json();
  if (!data.ok) return alert('Export failed');
  const blob = new Blob([toCSV(data.rows)], { type: 'text/csv;charset=utf-8' });
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: 'calc_events.csv'
  });
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();
}

function wire() {
  $('#btnSearch').addEventListener('click', () => {
    state.q = $('#q').value.trim();
    state.limit = +$('#limit').value;
    state.page = 1;
    fetchPage().catch(err => $('#status').textContent = err.message);
  });
  $('#prev').addEventListener('click', () => {
    if (state.page > 1) { state.page--; fetchPage().catch(console.error); }
  });
  $('#next').addEventListener('click', () => {
    const maxPage = Math.max(1, Math.ceil(state.total / state.limit));
    if (state.page < maxPage) { state.page++; fetchPage().catch(console.error); }
  });
  $('#btnCsv').addEventListener('click', exportCSV);

  // defaults
  $('#limit').value = String(state.limit);
  fetchPage().catch(err => $('#status').textContent = err.message);
}

document.addEventListener('DOMContentLoaded', wire);
