/* values.js — competitor-accurate filters, badges, ordering + 6-way sorting
   Uses window.DATA from data.js (your crops array has only names + base).
   Per-name overrides ensure exact rarity/type and (optional) buy/sell.
*/

const $  = (s, ctx=document) => ctx.querySelector(s);
const $$ = (s, ctx=document) => [...ctx.querySelectorAll(s)];
const fmt   = n => Number(n ?? 0).toLocaleString();
const clamp = (v, a, b) => Math.max(a, Math.min(b, Number.isFinite(+v) ? +v : 0));
const slug  = s => String(s||'').toLowerCase().replace(/\s+/g,'-');

/* =================== CONSTANTS =================== */
const RARITY_BUCKETS = new Set(['common','uncommon','rare','legendary','mythical','divine']);

/* ===== RARITY overrides (per competitor) ===== */
const RARITY_OVERRIDES = {
  // Common
  'Carrot':'common','Strawberry':'common','Chocolate Carrot':'common',
  'Tomato':'common',
  // Uncommon
  'Blueberry':'uncommon','Orange Tulip':'uncommon','Cranberry':'uncommon','Nightshade':'uncommon',
  // Rare
  'Corn':'rare','Daffodil':'rare','Glowshroom':'rare','Mint':'rare','Raspberry':'rare',
  // Legendary
  'Apple':'legendary','Bamboo':'legendary','Pumpkin':'legendary','Starfruit':'legendary','Watermelon':'legendary','Moonflower':'legendary',
  // Mythical
  'Cactus':'mythical','Coconut':'mythical','Dragon Fruit':'mythical','Mango':'mythical','Moonglow':'mythical',
  // Divine
  'Grape':'divine','Moon Blossom':'divine','Moon Mango':'divine','Moon Melon':'divine','Celestiberry':'divine','Cacao':'divine','Pepper':'divine','Mushroom':'divine',
};

/* ===== TYPE overrides: mark which are Limited (yellow chip) ===== */
const TYPE_OVERRIDES = {
  'Banana':'limited','Peach':'limited','Pineapple':'limited','Passionfruit':'limited',
  'Pear':'limited','Papaya':'limited','Eggplant':'limited','Red Lollipop':'limited',
  'Candy Sunflower':'limited','Candy Blossom':'limited','Cherry Blossom':'limited',
  'Cursed Fruit':'limited','Venus Fly Trap':'limited','Easter Egg':'limited',
};

/* ===== Optional exact numbers to mirror competitor ===== */
const SELL_OVERRIDES = {
  'Carrot':22, 'Strawberry':19, 'Blueberry':21, 'Orange Tulip':792,
};
const BUY_OVERRIDES = {
  'Carrot':10, 'Strawberry':50, 'Blueberry':400, 'Orange Tulip':600,
};

/* ===== Default order to match competitor (Carrot first) ===== */
const ORDER_INDEX = [
  'Carrot','Strawberry','Blueberry','Orange Tulip',
  'Tomato','Corn','Daffodil','Watermelon',
  'Pumpkin','Apple','Bamboo','Coconut',
  'Cactus','Dragon Fruit','Mango','Grape',
  'Mushroom','Pepper','Cacao','Lemon',
  'Pineapple','Peach','Pear','Papaya',
  'Banana','Passionfruit','Soul Fruit','Cursed Fruit',
  'Chocolate Carrot','Red Lollipop','Candy Sunflower','Easter Egg',
  'Candy Blossom','Raspberry','Durian','Eggplant',
  'Lotus','Glowshroom','Mint','Moonflower',
  'Starfruit','Moonglow','Moon Blossom','Nightshade',
  'Beanstalk','Blood Banana','Moon Mango','Moon Melon',
  'Celestiberry','Cranberry','Cherry Blossom','Sunflower','Hive','Lilac'
];
const ORDER_MAP = ORDER_INDEX.reduce((m, name, i) => (m[name.toLowerCase()] = i+1, m), {});

/* =================== DATA NORMALIZATION =================== */
function normalizeOne(c){
  const name = c.name || c.title || c.id || 'Unknown';
  const base = Number(c.base ?? 0);

  // rarity from overrides; default "common"
  let rarity = (RARITY_OVERRIDES[name] || 'common').toLowerCase();
  if (!RARITY_BUCKETS.has(rarity)) rarity = 'common';

  // type from overrides; default "regular"
  const type = (TYPE_OVERRIDES[name] === 'limited') ? 'limited' : 'regular';

  // exact sell/buy if overrides provided; else derive from base
  const sell = Number.isFinite(SELL_OVERRIDES[name]) ? SELL_OVERRIDES[name] : Math.round(base * 0.65);
  const buy  = Number.isFinite(BUY_OVERRIDES[name])  ? BUY_OVERRIDES[name]  : (Number.isFinite(base) && base > 0 ? base : null);

  // demand: default mid if unknown
  const demand = clamp(c.demand ?? 5, 0, 10);

  const img = c.icon || c.img || c.image || `assets/img/crops/${slug(name)}.png`;
  const order = ORDER_MAP[name.toLowerCase()] || 9999;

  return { id: c.id || slug(name), name, rarity, type, buy, sell, demand, img, order };
}

function buildItems(){
  const crops = (window.DATA?.crops && Array.isArray(window.DATA.crops)) ? window.DATA.crops : [];
  return crops.map(normalizeOne);
}

/* =================== STATE =================== */
const state = {
  items: [],
  search: '',
  type: 'all',        // all|regular|limited
  rarity: 'all',      // all|common|uncommon|rare|legendary|mythical|divine
  // 6-way sort keys:
  // 'name' | 'sell_desc' | 'sell_asc' | 'buy_desc' | 'buy_asc' | 'demand_desc' | 'custom'
  // We default logic to 'name' but allow the select to show a placeholder (value="").
  sort: 'name',
};

/* =================== UI =================== */
function chip(label, cls=''){ return `<span class="pill ${cls}">${label}</span>`; }
function rarityBadge(r){ return chip(r[0].toUpperCase()+r.slice(1), `rarity-${r}`); }
function typeBadge(t){ return t === 'limited' ? chip('Limited','type-limited') : ''; }
function demandBar(val){
  const pct = clamp(val*10, 0, 100);
  return `
    <div class="demand">
      <div class="demand__label">Demand: ${val}/10</div>
      <div class="demand__bar"><span style="width:${pct}%"></span></div>
    </div>`;
}
function cardTemplate(it){
  return `
    <article class="card value-card" data-name="${it.name}" data-rarity="${it.rarity}" data-type="${it.type}">
      <header class="value-card__head">
        <div class="value-card__icon"><img src="${it.img}" alt="${it.name}" loading="lazy" /></div>
        <div class="value-card__chips">
          ${typeBadge(it.type)}
          ${rarityBadge(it.rarity)}
        </div>
      </header>
      <h3 class="value-card__title">${it.name}</h3>
      <dl class="value-card__kv">
        <div><dt>Sell Value</dt><dd>${fmt(it.sell)}</dd></div>
        <div><dt>Buy Value</dt><dd>${it.buy != null ? fmt(it.buy) : 'N/A'}</dd></div>
      </dl>
      ${demandBar(it.demand)}
    </article>`;
}

/* =================== FILTERING/SORTING =================== */
function applyFilters(list){
  const q = state.search.trim().toLowerCase();
  let out = list.filter(it=>{
    if (q && !it.name.toLowerCase().includes(q)) return false;
    if (state.type   !== 'all' && it.type   !== state.type)   return false;
    if (state.rarity !== 'all' && it.rarity !== state.rarity) return false;
    return true;
  });

  // Back-compat + placeholder-safe mapping
  // Treat '' as 'name', and legacy 'sell'/'buy' as descending variants.
  const normalizedSort = (state.sort === '' ? 'name' : state.sort);
  const sortKey = ({
    'sell':'sell_desc',
    'buy':'buy_desc'
  }[normalizedSort]) || normalizedSort;

  if (sortKey === 'custom') {
    out.sort((a,b)=> (a.order - b.order) || a.name.localeCompare(b.name));
  } else if (sortKey === 'name') {
    out.sort((a,b)=> a.name.localeCompare(b.name));
  } else if (sortKey === 'sell_desc') {
    out.sort((a,b)=> (b.sell||0) - (a.sell||0) || a.name.localeCompare(b.name));
  } else if (sortKey === 'sell_asc') {
    out.sort((a,b)=> (a.sell||0) - (b.sell||0) || a.name.localeCompare(b.name));
  } else if (sortKey === 'buy_desc') {
    out.sort((a,b)=> (Number(b.buy)||-1) - (Number(a.buy)||-1) || a.name.localeCompare(b.name));
  } else if (sortKey === 'buy_asc') {
    out.sort((a,b)=> (Number(a.buy)||-1) - (Number(b.buy)||-1) || a.name.localeCompare(b.name));
  } else if (sortKey === 'demand_desc') {
    out.sort((a,b)=> (b.demand||0) - (a.demand||0) || a.name.localeCompare(b.name));
  }

  return out;
}

function render(){
  const grid = $('#valuesGrid');
  const countEl = $('#cropCount');
  if (!grid) return;
  const list = applyFilters(state.items);
  grid.innerHTML = list.map(cardTemplate).join('');
  if (countEl) countEl.textContent = `Showing ${list.length} crops`;
  ensureInlineHelpers();
}

/* =================== CONTROLS =================== */
function wire(){
  const search = $('#valueSearch');
  const reset  = $('#resetFilters');
  const sort   = $('#sortSelect');

  // If the select is using a placeholder (value=""), keep UI as placeholder
  // but keep logic sorting by 'name'.
  if (sort) {
    // Don't force a value; allow '' so "Sort by: Name" shows.
    // Ensure state remains 'name' for logic.
    if (!sort.value) state.sort = 'name';

    sort.addEventListener('change', e => {
      const v = e.target.value || 'name'; // if user somehow picks placeholder again
      state.sort = v;
      render();
    });
  }

  search?.addEventListener('input', e => { state.search = e.target.value; render(); });

  $$('.filters [data-type]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $$('.filters [data-type]').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      state.type = btn.getAttribute('data-type');
      render();
    });
  });

  $$('.filters [data-rarity]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $$('.filters [data-rarity]').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      state.rarity = btn.getAttribute('data-rarity');
      render();
    });
  });

  reset?.addEventListener('click', ()=>{
    state.search = '';
    state.type   = 'all';
    state.rarity = 'all';
    state.sort   = 'name';   // logic back to Name

    if (search) search.value = '';
    if (sort)   sort.value  = ''; // UI back to placeholder "Sort by: Name"

    const tAll = $('.filters [data-type="all"]');
    const rAll = $('.filters [data-rarity="all"]');
    $$('.filters [data-type]').forEach(b=>b.classList.remove('active'));
    $$('.filters [data-rarity]').forEach(b=>b.classList.remove('active'));
    tAll?.classList.add('active');
    rAll?.classList.add('active');

    render();
  });
}

/* =================== INLINE HELPER STYLES =================== */
let helpersInjected = false;
function ensureInlineHelpers(){
  if (helpersInjected) return;
  const css = `
  .values-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:14px 0 40px}
  @media (max-width:1024px){.values-grid{grid-template-columns:repeat(2,1fr)}}
  @media (max-width:640px){.values-grid{grid-template-columns:1fr}}
  .value-card{display:grid;gap:8px;padding:14px}
  .value-card__head{display:flex;align-items:center;justify-content:space-between}
  .value-card__icon{width:56px;height:56px;border-radius:14px;display:grid;place-items:center;background:radial-gradient(60% 60% at 50% 40%, rgba(0,0,0,.35), rgba(0,0,0,.12));box-shadow:inset 0 6px 18px rgba(0,0,0,.35)}
  .value-card__icon img{width:46px;height:46px;object-fit:contain}
  .value-card__title{margin:2px 0 6px;font-weight:800}
  .value-card__kv{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .value-card__kv dt{font-size:12px;opacity:.75}
  .value-card__kv dd{font-weight:800}
  .value-card__chips{display:flex;gap:6px;align-items:center}
  .pill.rarity-common{background:rgba(255,255,255,.10)}
  .pill.rarity-uncommon{background:#2a8d5e}
  .pill.rarity-rare{background:#3b82f6}
  .pill.rarity-legendary{background:#ef4444}
  .pill.rarity-mythical{background:#8b5cf6}
  .pill.rarity-divine{background:#ec4899}
  .pill.type-limited{background:#f5b301;color:#1b1200;font-weight:700}
  .filters .pill.active{outline:2px solid rgba(113,255,154,.35);background:rgba(255,255,255,.08)}
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  helpersInjected = true;
}

/* =================== INIT =================== */
function init(){
  state.items = buildItems();
  wire();
  render();
}
document.addEventListener('DOMContentLoaded', init);
