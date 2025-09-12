/* Trade Calculator
   - 2 boards (yours/theirs), 4 slots each
   - Click slot -> open crop picker (uses crop-modal styles)
   - Quantity stepper, remove, totals, fairness bars
*/

const $  = (s, ctx=document) => ctx.querySelector(s);
const $$ = (s, ctx=document) => [...ctx.querySelectorAll(s)];
const fmt = n => Number(n || 0).toLocaleString();

const DATA = window.DATA || { crops: [] };   // from assets/js/data.js

// ======== PRICE SOURCE =========
// If you want *exactly* competitor numbers, put them in assets/js/trade-prices.js
// as window.TRADE_PRICES = { apple:{buy:3000,sell:266}, bamboo:{buy:3610,sell:???}, ... }
const TRADE_PRICES = (window.TRADE_PRICES || {});

// id helper (lowercase slug)
const getId = (c) => (c?.id || c?.name || c?.title || '').toString().trim().toLowerCase();

// lookup a crop in DATA.crops by id
const cropById = (id) => (DATA.crops || []).find(c => getId(c) === id);

// final price resolver (prefers TRADE_PRICES, else falls back to DATA.crops)
function getPrices(id) {
  const fromMap = TRADE_PRICES[id];
  if (fromMap) return { buy: Number(fromMap.buy || 0), sell: Number(fromMap.sell || 0) };

  // fallback to DATA.crops
  const c = cropById(id) || {};
  // many data.js only has "base", sometimes "buy"/"sell"—normalize:
  const buy  = Number(c.buy  ?? c.base ?? 0);
  const sell = Number(c.sell ?? c.base ?? 0);
  return { buy, sell };
}

// display bits used in UI
function cropDisplay(c) {
  return {
    id:   getId(c),
    name: c?.name || c?.title || c?.id || 'Unknown',
    img:  c?.icon || c?.img || c?.image || ''
  };
}

// ---------- model ----------
const SLOTS_PER_SIDE = 4;
const state = {
  yours: Array.from({ length: SLOTS_PER_SIDE }, () => ({ id: null, qty: 1 })),
  theirs: Array.from({ length: SLOTS_PER_SIDE }, () => ({ id: null, qty: 1 })),
  pickContext: { side: 'yours', index: 0 } // context for picker
};

// ---------- UI: boards ----------
function slotHtml(item) {
  if (!item.id) {
    return `<button class="slot" type="button" aria-label="Add item"><span class="plus">+</span></button>`;
  }
  const c = cropDisplay(cropById(item.id));
  return `
  <div class="slot slot-filled" role="group" aria-label="${c.name}">
    <button class="remove" type="button" title="Remove">&times;</button>
    <div class="thumb">${c.img ? `<img src="${c.img}" alt="${c.name}">` : ''}</div>
    <div class="name">${c.name}</div>
    <div class="stepper" role="group" aria-label="Quantity">
      <button class="minus" type="button" aria-label="Decrease">−</button>
      <span class="qty" aria-live="polite">${item.qty}</span>
      <button class="plus"  type="button" aria-label="Increase">+</button>
    </div>
  </div>`;
}

function renderSide(side) {
  const grid = side === 'yours' ? $('#yourGrid') : $('#theirGrid');
  const list = state[side];
  grid.innerHTML = list.map(slotHtml).join('');

  // wire up
  $$('.slot', grid).forEach((el, idx) => {
    const item = list[idx];
    if (!item.id) {
      el.addEventListener('click', () => openPicker(side, idx));
    } else {
      el.querySelector('.remove').addEventListener('click', () => {
        list[idx] = { id: null, qty: 1 }; renderAll();
      });
      el.querySelector('.minus').addEventListener('click', () => {
        list[idx].qty = Math.max(1, list[idx].qty - 1); renderAll();
      });
      el.querySelector('.plus').addEventListener('click', () => {
        list[idx].qty = Math.min(999, list[idx].qty + 1); renderAll();
      });
      // clicking image/name lets you change the crop
      el.querySelector('.thumb')?.addEventListener('click', () => openPicker(side, idx));
      el.querySelector('.name')?.addEventListener('click',  () => openPicker(side, idx));
    }
  });
}

// --- replace your totalsFor with this ---
function totalsFor(side){
  const list = state[side];
  return list.reduce((acc, item)=>{
    if(!item.id) return acc;

    // prefer competitor prices if present
    const id = (item.id || '').toString().toLowerCase();
    const p  = (window.TRADE_PRICES && window.TRADE_PRICES[id]) || null;

    if (p) {
      acc.buy  += Number(p.buy  || 0) * item.qty;
      acc.sell += Number(p.sell || 0) * item.qty;
    } else {
      // graceful fallback to your data.js interpretation
      const c = cropDisplay(cropById(item.id));
      acc.buy  += c.buy  * item.qty;
      acc.sell += c.sell * item.qty;
    }
    return acc;
  }, {buy:0, sell:0});
}

// --- add once near your init code so totals refresh after prices load ---
window.addEventListener('gag:prices-ready', ()=> {
  try { renderTotals(); } catch {}
});

function verdictText(pct) {
  const p = (Math.abs(pct)).toFixed(1) + '%';
  if (pct > 3)  return `You Win (+${p})`;
  if (pct < -3) return `You Lose (−${p})`;
  return `Fair Trade (${p})`;
}
/* helper: half-filled yellow bar (competitor look) */
function setBarHalf(sel){
  const el = $(sel);
  if (!el) return;
  el.style.width = '50%';
  el.style.background = '#F1C40F';
}

function renderTotals() {
  const y = totalsFor('yours');
  const t = totalsFor('theirs');

  $('#yourBuyTotal').textContent   = fmt(y.buy);
  $('#yourSellTotal').textContent  = fmt(y.sell);
  $('#theirBuyTotal').textContent  = fmt(t.buy);
  $('#theirSellTotal').textContent = fmt(t.sell);

  // verdicts vs. their side
  const pctBuy  = t.buy  ? ((y.buy  - t.buy ) / t.buy ) * 100 : 0;
  const pctSell = t.sell ? ((y.sell - t.sell) / t.sell) * 100 : 0;

  setBar('#buyBar',  Math.min(100, Math.abs(pctBuy)));
  setBar('#sellBar', Math.min(100, Math.abs(pctSell)));

  $('#buyVerdict').textContent  = verdictText(pctBuy);
  $('#sellVerdict').textContent = verdictText(pctSell);
}

function renderAll() {
  renderSide('yours');
  renderSide('theirs');
  renderTotals();
}

// ---------- Crop picker (no per-card value like competitor) ----------
function pickerCard(c, idx) {
  const name = c.name || c.title || c.id;
  const img  = c.icon || c.img || c.image || '';
  const id   = getId(c);
  return `
  <button class="crop-card" type="button" role="listitem"
          data-id="${id}" data-idx="${idx}">
    <div class="crop-card__img">${img ? `<img src="${img}" alt="${name}">` : ''}</div>
    <div class="crop-card__name">${name}</div>
  </button>`;
}

function renderPicker(filter) {
  const q = (filter || '').toLowerCase();
  const items = (DATA.crops || []).filter(c => {
    const nm = (c.name || c.title || c.id || '').toLowerCase();
    return nm.includes(q);
  });
  $('#tradeCropList').innerHTML = items.map(pickerCard).join('');

  // select
  $$('#tradeCropList .crop-card').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const { side, index } = state.pickContext;
      state[side][index] = { id, qty: 1 };
      closePicker();
      renderAll();
    });
  });
}

function openPicker(side, index) {
  state.pickContext = { side, index };
  renderPicker('');
  document.documentElement.style.overflow = 'hidden';
  $('#tradeCropModal').showModal();
  setTimeout(() => $('#tradeCropSearch')?.focus(), 30);
}
function closePicker() {
  $('#tradeCropModal').close();
  document.documentElement.style.overflow = '';
}

function wirePicker() {
  $('.crop-modal__close')?.addEventListener('click', closePicker);
  $('#tradeCropModal')?.addEventListener('mousedown', (e) => {
    if (e.target === $('#tradeCropModal')) closePicker();
  });
  $('#tradeCropSearch')?.addEventListener('input', (e) => renderPicker(e.target.value));
}

// ensure images (fallback path) but DO NOT overwrite prices anymore
function ensureCropIcons() {
  (DATA.crops || []).forEach(c => {
    if (!c.icon && !c.img && !c.image && c.id) {
      c.icon = `assets/img/crops/${getId(c)}.png`;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  ensureCropIcons();
  wirePicker();
  renderAll();
});
