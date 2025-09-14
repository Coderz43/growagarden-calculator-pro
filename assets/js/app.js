/* ---------- Helpers ---------- */
const $  = (s,ctx=document)=>ctx.querySelector(s);
const $$ = (s,ctx=document)=>[...ctx.querySelectorAll(s)];
const fmt = n => Number(n||0).toLocaleString();
const debounce = (fn, ms=150) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; };
const norm = s => String(s||'').toLowerCase().replace(/[\s_-]+/g,'');

/* ---------- State ---------- */
const state = {
  crop:null,
  baseFloor:0,
  friendPct:0,
  weight:0,
  qty:1,
  maxMutation:false
};

/* ============================================================
   Lightweight, safe debounced logging to Vercel API
   ============================================================ */
let __lastSig = '';
let __lastSentAt = 0;
const __LOG_COOLDOWN_MS = 4000;

async function __logCalcDebounced(snap) {
  const now = Date.now();
  const sig = JSON.stringify({
    crop: snap.crop, qty: snap.qty, weight: snap.weight,
    baseFloor: snap.baseFloor, friendPct: snap.friendPct,
    maxMutation: snap.maxMutation, total: snap.total,
    growthChoice: snap.growthChoice || null,
    tempChoice: snap.tempChoice || null,
    envCount: typeof snap.envCount === 'number' ? snap.envCount : 0
  });
  if (sig === __lastSig && (now - __lastSentAt) < __LOG_COOLDOWN_MS) return;
  __lastSig = sig; __lastSentAt = now;

  try {
    await fetch('/api/log-calc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snap)
    });
  } catch (e) {
    console.warn('log-calc failed', e);
  }
}

/* ---------- Selected crop surfaces ---------- */
function setCropUI(crop){
  const btnLbl = $('#btnCropLabel');
  if (btnLbl) btnLbl.textContent = crop?.name || 'Select Crop';

  const baseInput = $('#baseValue');
  if (baseInput && crop) baseInput.value = Number(crop.base ?? 0);

  const chip = $('#chosenCrop');
  if (chip){
    if (crop){
      chip.hidden = false;
      chip.textContent = `${crop.name} • base ${crop.base}`;
    } else {
      chip.hidden = true;
      chip.textContent = '';
    }
  }
}

/* ============================================================
   Crop picker modal (search + grid)
   ============================================================ */
function mountCropModal(){
  const dlg    = $('#cropModal');
  const openBtn= $('#btn-crop');
  const grid   = $('#cropList');
  const search = $('#cropSearch');
  const closeX = $('.crop-modal__close');
  if (!dlg || !grid || !openBtn) return;

  function getCrops(){
    return (window.DATA?.crops || []).map(c => ({
      id  : c.id || norm(c.name||c.title||''),
      name: c.name || c.title || c.id || 'Unknown',
      base: Number(c.base ?? c.value ?? 0),
      img : c.icon || c.img || c.image || ''
    }));
  }

  function cardTemplate(crop, idx){
    const {name, base, img} = crop;
    const sel = state.crop && state.crop.name === name ? ' aria-selected="true"' : '';
    return `
      <button class="crop-card" type="button" role="listitem"
              data-name="${name}" data-base="${base}" data-idx="${idx}"${sel}>
        <div class="crop-card__img">${img ? `<img src="${img}" alt="${name}" />` : ''}</div>
        <div class="crop-card__name">${name}</div>
        <div class="crop-card__value">${fmt(base)}</div>
      </button>`;
  }

  function renderGrid(q=''){
    const items = getCrops();
    const filtered = (q.trim())
      ? items.filter(c => norm(c.name).includes(norm(q)))
      : items;
    grid.innerHTML = filtered.map(cardTemplate).join('');
    const selected = grid.querySelector('.crop-card[aria-selected="true"]');
    (selected || grid.querySelector('.crop-card'))?.focus({preventScroll:true});
  }

  function closeModal(){
    dlg.close?.();
    document.documentElement.style.overflow = '';
  }

  /* ---------- Competitor weight defaults ---------- */
  const WEIGHT_RULES = {
    easteregg:[2.85,277.5], moonflower:[1.9,2381], starfruit:[2.85,1666.6], pepper:[4.75,320],
    grape:[2.85,872], nightshade:[0.48,13850], mint:[0.95,5230], glowshroom:[0.7,532.5],
    bloodbanana:[1.42,2670], beanstalk:[9.5,280], coconut:[13.31,2.04], candyblossom:[2.85,11111.111],
    carrot:[0.24,275], strawberry:[0.29,175], blueberry:[0.17,500], orangetulip:[0.0499,300000],
    tomato:[0.44,120], daffodil:[0.16,25000], watermelon:[7.3,61.25], pumpkin:[6.9,64],
    mushroom:[25.9,241.6], bamboo:[3.8,250], apple:[2.85,30.53], corn:[1.9,10], cactus:[6.65,69.4],
    cranberry:[0.95,2000], moonmelon:[7.6,281.2], pear:[2.85,55.5], durian:[7.6,78.19], peach:[1.9,75],
    cacao:[7.6,171.875], moonglow:[6.65,408.45], dragonfruit:[11.38,32.99], mango:[14.28,28.89],
    moonblossom:[2.85,6666.666], raspberry:[0.71,177.5], eggplant:[4.75,300], papaya:[2.86,111.11],
    celestiberry:[1.9,2500], moonmango:[14.25,222.22], banana:[1.425,777.77], passionfruit:[2.867,395],
    soulfruit:[23.75,12.4], chocolatecarrot:[0.2616,145096], redlollipop:[3.7988,3125],
    candysunflower:[1.428,35413], lotus:[18.99,42.5], pineapple:[2.85,222.5], hive:[7.6,781.5],
    lilac:[2.846,3899], rose:[0.95,5000], foxglove:[1.9,5000], purpledahlia:[11.4,522],
    sunflower:[14.23,666.6], pinklily:[5.699,1806.5], nectarine:[2.807,4440]
  };
  // expose for global use (weight math + threshold label)
  WEIGHT_RULES_GLOBAL = WEIGHT_RULES;

  function defaultWeightFor(name){
    const rule = WEIGHT_RULES[norm(name)];
    return rule ? rule[0] : 0;
  }

  function selectCrop(btn){
    const name = btn.getAttribute('data-name');
    const base = Number(btn.getAttribute('data-base')||0);
    const found = (window.DATA?.crops||[]).find(c => (c.name||c.title) === name) || { name, base };
    state.crop  = { name, base: Number(found.base ?? base) };

    // highlight & update UI
    $$('.crop-card', grid).forEach(b => b.removeAttribute('aria-selected'));
    btn.setAttribute('aria-selected','true');
    setCropUI(state.crop);

    // Auto-fill weight to the crop's threshold if empty/zero
    const wInput = $('#weight');
    if (wInput && !(Number(wInput.value) > 0)) {
      const w = defaultWeightFor(name);
      if (w) wInput.value = w;
    }

    closeModal();
    calc();
  }

  grid.addEventListener('keydown', (e)=>{
    const cards = [...grid.querySelectorAll('.crop-card')];
    if (!cards.length) return;
    const cols = parseInt(getComputedStyle(grid).getPropertyValue('--col')||'3',10)||3;
    const i = cards.indexOf(document.activeElement);
    if (i<0) return;
    let n=null;
    if (e.key==='ArrowRight') n=cards[Math.min(cards.length-1,i+1)];
    if (e.key==='ArrowLeft')  n=cards[Math.max(0,i-1)];
    if (e.key==='ArrowDown')  n=cards[Math.min(cards.length-1,i+cols)];
    if (e.key==='ArrowUp')    n=cards[Math.max(0,i-cols)];
    if (e.key==='Home')       n=cards[0];
    if (e.key==='End')        n=cards[cards.length-1];
    if (n){ n.focus(); e.preventDefault(); }
    if (e.key==='Enter' || e.key===' '){ document.activeElement.click(); e.preventDefault(); }
    if (e.key==='Escape'){ closeModal(); }
  });

  grid.addEventListener('click', e=>{
    const card = e.target.closest('.crop-card'); if (card) selectCrop(card);
  });

  const onSearch = debounce(v=>renderGrid(v), 120);
  search?.addEventListener('input', e=> onSearch(e.target.value));

  function openModal(){
    renderGrid('');
    if (search) search.value='';
    dlg.showModal?.();
    document.documentElement.style.overflow = 'hidden';
    setTimeout(()=> search?.focus(), 40);
  }

  openBtn.addEventListener('click', openModal);
  openBtn.addEventListener('keydown', e=>{
    if (e.key==='Enter'||e.key===' '){ e.preventDefault(); openModal(); }
  });
  closeX?.addEventListener('click', closeModal);
  dlg?.addEventListener('mousedown', e=>{ if (e.target===dlg) closeModal(); });

  // expose for debugging
  window.openCropPicker = openModal;
}

/* ---------- Build growth / temperature (radio) if needed ---------- */
function mountChoices(list, container, kind) {
  if (!container || !list?.length) return;
  if (kind==='env' && container.querySelector('input[type="checkbox"]')) return; // env is hard-coded

  list.forEach((item,i)=>{
    const label = document.createElement('label');
    label.className = (kind==='env' ? 'pill env' : 'pill radio');
    label.title = `${item.label} ×${item.multiplier}`;
    label.innerHTML = `
      <input ${kind==='env'?'type="checkbox"':`type="radio" name="${kind}"`} value="${item.multiplier}">
      <span>${item.label}</span>
      <em>×${item.multiplier}</em>`;
    container.appendChild(label);
    const input = label.querySelector('input');
    if (kind!=='env' && i===0) input.checked = true;
    input.addEventListener('change',calc);
  });
}

/* ---------- Inputs ---------- */
function readInputs(){
  state.baseFloor = Math.max(0, Number($('#baseValue')?.value||0));
  state.weight    = Math.max(0, Number($('#weight')?.value||0));
  state.qty       = Math.max(1, Number($('#qty')?.value||1));
  state.friendPct = Number($('#friend')?.value || 0); 
  const fp = $('#friendPct'); if (fp) fp.textContent = `${state.friendPct}%`;
}

/* ---------- Weight function (piecewise) ---------- */
let WEIGHT_RULES_GLOBAL = {};
function weightedBaseFor(cropName, baseValue, w){
  if (!w || w<=0) return baseValue;
  const key = norm(cropName);
  const rule = WEIGHT_RULES_GLOBAL[key];
  if (!rule) return baseValue;
  const [th, k] = rule;
  return (w <= th) ? baseValue : (k * w * w);
}
function thresholdFor(cropName){
  const rule = WEIGHT_RULES_GLOBAL[norm(cropName)];
  return rule ? rule[0] : null;
}

/* ---------- Growth / Temp readers ---------- */
function currentGrowth(){
  const g = $('#growthGroup input[type="radio"]:checked');
  const mult = Number(g?.value || 1); // Default=1, Golden=20, Rainbow=50
  const label = g ? g.closest('label')?.querySelector('span')?.textContent?.trim() : 'Default';
  return { label: label || 'Default', add: Math.max(0, mult - 1) };
}

function currentTemp(){
  const t = $('#tempGroup input[type="radio"]:checked');
  const mult = Number(t?.value || 1); // 1/2/2/5/10
  const label = t ? t.closest('label')?.querySelector('span')?.textContent?.trim() : 'Default';
  const add = /frozen/i.test(label||'') ? 10 : Math.max(0, mult - 1);
  return { label: label || 'Default', add };
}

/* ---------- Environmental (exact competitor behavior) ---------- */
/*
  ENV_MULT = 1 + (sum - count)
  Start with temperature add (if >0) as one env item called "Frozen".
*/
function readEnvironmentWithTemperature(tempAdd){
  const boxes = $$('#envGroup input[type="checkbox"]');
  let count = tempAdd > 0 ? 1 : 0;
  let sum = tempAdd > 0 ? tempAdd : 0;
  const entries = tempAdd > 0 ? [{name:'Frozen', add: tempAdd}] : [];

  boxes.forEach(b=>{
    if (!b.checked) return;
    const m = Math.max(1, Number(b.value||1));
    sum += m;
    count += 1;
    const labelEl = b.closest('label');
    const nameText = (labelEl?.dataset?.key) || (labelEl?.querySelector('span')?.childNodes?.[0]?.textContent || '');
    const name = String(nameText).replace(/\s×.*/,'').trim();
    entries.push({ name, add: m - 1 });
  });

  const mult = count ? (1 + (sum - count)) : 1;
  return { entries, mult, sum, count };
}

/* ---------- Max Mutation ---------- */
function applyMaxMutation(on){
  const gRadios = $$('#growthGroup input[type="radio"]');
  const tRadios = $$('#tempGroup input[type="radio"]');
  const eChecks = $$('#envGroup input[type="checkbox"]');

  if (on){
    // growth -> highest
    let maxG = null, maxV = -Infinity;
    gRadios.forEach(r=>{ const v=Number(r.value||1); if (v>maxV){ maxV=v; maxG=r; }});
    if (maxG) maxG.checked = true;

    // temperature -> prefer 'Frozen' if present
    let maxT = null, maxTv = -Infinity;
    tRadios.forEach(r=>{
      const label = r.closest('label')?.textContent || '';
      const v = /frozen/i.test(label) ? 10 : Math.max(0, Number(r.value||1) - 1);
      if (v>maxTv){ maxTv=v; maxT=r; }
    });
    if (maxT) maxT.checked = true;

    // environment -> all on
    eChecks.forEach(c=> c.checked = true);
  } else {
    gRadios.forEach((r,i)=> r.checked = (i===0));
    tRadios.forEach((r,i)=> r.checked = (i===0));
    eChecks.forEach(c=> c.checked = false);
  }
}

/* ---------- Calculation ---------- */
function calc(){
  try{
    readInputs();
    const resultEl = $('#result');
    const breakdown = $('#breakdownList');

    // If no crop selected yet → minimal UI (no logging to avoid duplicate rows)
    if (!state.crop){
      const baseFromInput = 0;
      const rarityAdd = 0;
      const tempAdd   = 0;
      const envMult   = 1;
      const fM        = 1 + (state.friendPct/100);
      const qty       = state.qty || 1;
      const weightTxt = (state.weight > 0)
        ? `Weight Adjustment: ${state.weight.toFixed(2)} kg`
        : 'Weight Adjustment: None';

      const total = Math.ceil(baseFromInput * (1 + rarityAdd + tempAdd) * envMult * fM * qty);

      if (resultEl) resultEl.textContent = fmt(total);
      if (breakdown){
        breakdown.innerHTML = [
          `Base Value: ${fmt(baseFromInput)}`,
          `Rarity: +${rarityAdd} (Default)`,
          `Temperature Bonus: +${tempAdd} (Default)`,
          `Environmental Multiplier: ×${envMult} (None)`,
          `Friend Boost: ×${fM.toFixed(2)} (${((fM-1)*100).toFixed(0)}%)`,
          weightTxt,
          `Quantity: ${qty}`,
          `Formula: ${fmt(baseFromInput)} × ${(1+rarityAdd+tempAdd).toFixed(0)} × ${envMult} × ${fM.toFixed(2)} × ${qty} = ${fmt(total)}`
        ].map(x=>`<li>${x}</li>`).join('');
      }

      // NOTE: no logging here (boot snapshot skipped)
      return;
    }


    // ----- Base (with piecewise weight) -----
    const baseFromInput = Math.max(state.baseFloor, Number(state.crop.base||0));
    const baseWeighted  = weightedBaseFor(state.crop.name, baseFromInput, state.weight);

    // ----- Mutations -----
    const g = currentGrowth();
    const t = currentTemp();
    const combinedBonus  = g.add + t.add;
    const combinedFactor = 1 + combinedBonus;

    // ----- Environment (fold temp) -----
    const env = readEnvironmentWithTemperature(t.add);
    const envMult  = env.mult;
    const envEntries = env.entries;
    const envNames = Array.isArray(envEntries) ? envEntries.map(e => e.name) : [];

    // ----- Friend & qty -----
    const fM  = 1 + (state.friendPct/100);
    const qty = state.qty;

    // ----- Final total -----
    const total = Math.ceil(baseWeighted * combinedFactor * envMult * fM * qty);

    // UI
    if (resultEl) resultEl.textContent = fmt(total);
    if (breakdown){
      const th = thresholdFor(state.crop?.name || '');
      const atOrBelowThreshold = th != null && state.weight > 0 && state.weight <= (th + 1e-6);
      const weightLabel =
        (!state.weight || atOrBelowThreshold)
          ? 'Weight Adjustment: None'
          : `Weight Adjustment: ${state.weight.toFixed(2)} kg`;

      const envListTxt = envEntries.length
        ? envEntries.map(e=>`${e.name} (+${e.add})`).join(', ')
        : 'None';

      breakdown.innerHTML = [
        `Base Value: ${fmt(baseFromInput)}`,
        `Rarity: +${g.add} (${g.label||'Default'})`,
        `Temperature Bonus: +${t.add} (${t.label||'Default'})`,
        `Environmental Multiplier: ×${envMult} (${envListTxt})`,
        `Friend Boost: ×${fM.toFixed(2)} (${((fM-1)*100).toFixed(0)}%)`,
        weightLabel,
        `Quantity: ${qty}`,
        `Formula: ${fmt(baseFromInput)} × ${(combinedFactor).toFixed(0)} × ${envMult} × ${fM.toFixed(2)} × ${qty} = ${fmt(total)}`
      ].map(x=>`<li>${x}</li>`).join('');
    }

    // ---- Log (with crop) ----
    const growthChoice = g?.label || null;
    const tempChoice   = t?.label || null;
    const envCount     = envNames.length;

    const snap = {
      total,
      crop: state.crop?.name || null,
      qty,
      weight: state.weight,

      friendPct: state.friendPct,
      maxMutation: !!state.maxMutation,
      baseFloor: state.baseFloor,
      growthBonus: g?.add ?? 0,
      temperatureBonus: t?.add ?? 0,
      envEntries: envEntries,

      growthChoice,
      tempChoice,
      envCount,
      referer: location.href,

      payload: {
        baseWeighted,
        combinedFactor,
        envMult,
        fM,
        inputs: {
          ...state,
          growth: growthChoice,   // <-- IMPORTANT
          temp: tempChoice,       // <-- IMPORTANT
          env: envNames           // <-- IMPORTANT
        }
      }
    };

    __logCalcDebounced(snap);

  } catch (e) {
    console.warn('calc failed', e);
  }
}

/* ---------- Trade (WFL) ---------- */
function wireTrade(){
  const vA=$('#vA'),vB=$('#vB'),tol=$('#tol'),sens=$('#sens'),judge=$('#judge'),detail=$('#detail');
  function run(){
    if (sens) sens.textContent = (tol?.value||0) + '%';
    const A=Number(vA?.value||0), B=Number(vB?.value||0);
    if(!A && !B){ if(judge) judge.textContent='—'; if(detail) detail.innerHTML=''; return; }
    const diff = A - B;
    const pct  = B ? (diff / B) * 100 : 0;
    const t = Number(tol?.value||0);
    let verdict='Fair';
    if (pct> t) verdict='Win';
    if (pct<-t) verdict='Lose';
    if (judge) judge.textContent = verdict;
    if (detail) detail.innerHTML = [
      `Your side: ${fmt(A)}`,
      `Their side: ${fmt(B)}`,
      `Difference: ${fmt(diff)} (${pct.toFixed(1)}%)`,
      `Threshold: ±${t}%`
    ].map(x=>`<li>${x}</li>`).join('');
  }
  [vA,vB,tol].forEach(el=> el && el.addEventListener('input',run));
}

/* ---------- Init ---------- */
function init(){
  // Fallback data so Growth/Temperature pills render even if window.DATA is missing
  const DEFAULT_DATA = {
    growth: [
      { label: 'Default', multiplier: 1 },
      { label: 'Golden',  multiplier: 20 },
      { label: 'Rainbow', multiplier: 50 }
    ],
    temperature: [
      { label: 'Default', multiplier: 1 },
      { label: 'Wet',     multiplier: 2 },
      { label: 'Chilled', multiplier: 2 },
      { label: 'Drenched',multiplier: 5 },
      { label: 'Frozen',  multiplier: 10 }
    ]
  };

  const GROWTH_DATA = (window.DATA?.growth && window.DATA.growth.length)
    ? window.DATA.growth : DEFAULT_DATA.growth;
  const TEMP_DATA   = (window.DATA?.temperature && window.DATA.temperature.length)
    ? window.DATA.temperature : DEFAULT_DATA.temperature;

  // dynamic radios (growth/temp); env checkboxes are in HTML
  mountChoices(GROWTH_DATA, $('#growthGroup'), 'growth');
  mountChoices(TEMP_DATA,   $('#tempGroup'),  'temp');

  // env & temp listeners ensure immediate recompute when folded math changes
  $$('#envGroup input[type="checkbox"]').forEach(cb=> cb.addEventListener('change', calc));
  $$('#tempGroup input[type="radio"]').forEach(rb=> rb.addEventListener('change', calc));

  // inputs
  ['baseValue','weight','qty','friend'].forEach(id=>{
    const el = $('#'+id); el && el.addEventListener('input', calc);
  });

  // max mutation
  const mm = $('#maxMutation');
  if (mm){
    mm.addEventListener('change', e=>{
      state.maxMutation = !!e.target.checked;
      applyMaxMutation(state.maxMutation);
      calc();
    });
  }

  // expose weight rules globally (same set as in modal)
  WEIGHT_RULES_GLOBAL = {
    easteregg:[2.85,277.5], moonflower:[1.9,2381], starfruit:[2.85,1666.6], pepper:[4.75,320],
    grape:[2.85,872], nightshade:[0.48,13850], mint:[0.95,5230], glowshroom:[0.7,532.5],
    bloodbanana:[1.42,2670], beanstalk:[9.5,280], coconut:[13.31,2.04], candyblossom:[2.85,11111.111],
    carrot:[0.24,275], strawberry:[0.29,175], blueberry:[0.17,500], orangetulip:[0.0499,300000],
    tomato:[0.44,120], daffodil:[0.16,25000], watermelon:[7.3,61.25], pumpkin:[6.9,64],
    mushroom:[25.9,241.6], bamboo:[3.8,250], apple:[2.85,30.53], corn:[1.9,10], cactus:[6.65,69.4],
    cranberry:[0.95,2000], moonmelon:[7.6,281.2], pear:[2.85,55.5], durian:[7.6,78.19], peach:[1.9,75],
    cacao:[7.6,171.875], moonglow:[6.65,408.45], dragonfruit:[11.38,32.99], mango:[14.28,28.89],
    moonblossom:[2.85,6666.666], raspberry:[0.71,177.5], eggplant:[4.75,300], papaya:[2.86,111.11],
    celestiberry:[1.9,2500], moonmango:[14.25,222.22], banana:[1.425,777.77], passionfruit:[2.867,395],
    soulfruit:[23.75,12.4], chocolatecarrot:[0.2616,145096], redlollipop:[3.7988,3125],
    candysunflower:[1.428,35413], lotus:[18.99,42.5], pineapple:[2.85,222.5], hive:[7.6,781.5],
    lilac:[2.846,3899], rose:[0.95,5000], foxglove:[1.9,5000], purpledahlia:[11.4,522],
    sunflower:[14.23,666.6], pinklily:[5.699,1806.5], nectarine:[2.807,4440]
  };

  mountCropModal();
  wireTrade();
  calc();

  if (state.crop) setCropUI(state.crop);
}

document.addEventListener('DOMContentLoaded', init);
/* === Recent Records Loader (append-only) === */
window.loadRecentRecords = async function loadRecentRecords() {
  const table = document.getElementById("records-table");
  if (!table) return; // only runs on records.html

  const tbody = table.querySelector("tbody");
  const refreshBtn = document.getElementById("refresh-btn");

  // simple loading state — only set the message when starting
  const setLoading = (on) => {
    if (refreshBtn) refreshBtn.disabled = !!on;
    if (on) {
      tbody.innerHTML = `<tr><td colspan="7" class="muted">Loading latest records…</td></tr>`;
    }
    // IMPORTANT: do NOT clear tbody when on === false
  };

  try {
    setLoading(true);

    const res = await fetch("/api/get-records", { cache: "no-store" });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Fetch failed");

    // render rows
    tbody.innerHTML = "";
    json.data.forEach((row) => {
      const tr = document.createElement("tr");
      const created = new Date(row.created_at);
      tr.innerHTML = `
        <td>${row.id}</td>
        <td class="muted">${created.toLocaleString()}</td>
        <td><span class="pill">${row.growth_choice ?? "-"}</span></td>
        <td><span class="pill">${row.temp_choice ?? "-"}</span></td>
        <td class="right">${Number(row.env_count ?? 0).toLocaleString()}</td>
        <td class="right">${Number(row.total ?? 0).toLocaleString()}</td>
        <td>${row.crop ?? "-"}</td>
      `;
      tbody.appendChild(tr);
    });

    if (json.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="muted">No records yet.</td></tr>`;
    }
  } catch (err) {
    console.error("Error loading records:", err);
    tbody.innerHTML = `<tr><td colspan="7" class="muted">Error: ${err.message}</td></tr>`;
  } finally {
    setLoading(false); // now harmless; doesn't clear rows
  }
};

// Auto-bind refresh button & initial load (only on records.html)
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("records-table")) {
    window.loadRecentRecords();
    const refreshBtn = document.getElementById("refresh-btn");
    if (refreshBtn) refreshBtn.addEventListener("click", window.loadRecentRecords);
  }
});
