/* trade-prices.js
   Build final price map and override with competitor-exact numbers.
*/
(function () {
  const ensure = () => {
    const DATA = (window.DATA || {});
    const list = (DATA.crops || []);
    if (!Array.isArray(list) || list.length === 0) return false;

    const toId = (c) => (c?.id || c?.name || c?.title || '').toString().trim().toLowerCase();
    const num  = (v) => Number(v ?? 0);

    // base from data.js
    const map = {};
    for (const c of list) {
      const id = toId(c);
      if (!id) continue;

      const buy =
        num(c.buy) ||
        num(c.buyPrice) ||
        num(c.shopBuy) ||
        num(c.price) ||
        num(c.base);

      const sell =
        num(c.sell) ||
        num(c.sellValue) ||
        num(c.shopSell) ||
        num(c.value) ||
        num(c.base);

      map[id] = { buy, sell };
    }

    // === OVERRIDES (kept in your saved SEQUENCE order) =================
    const set = {
      // A
      'apple':            { buy: 3000,    sell: 266 },

      // B
      'bamboo':           { buy: 0,       sell: 3944 },
      'beanstalk':        { buy: 500400,  sell: 18809 },
      'blueberry':        { buy: 400,     sell: 21 },
      'blood banana':     { buy: 0,       sell: 6100 },

      // C
      'cacao':            { buy: 0,       sell: 10456 },
      'cactus':           { buy: 6000,    sell: 3224 },
      'carrot':           { buy: 600,     sell: 22 },
      'celestiberry':     { buy: 0,       sell: 9100 },
      'coconut':          { buy: 0,       sell: 2670 },
      'corn':             { buy: 1000,    sell: 44 },

      // D
      'daffodil':         { buy: 0,       sell: 988 },
      'dragon fruit':     { buy: 2500,    sell: 4566 },

      // G
      'glowshroom':       { buy: 0,       sell: 282 },
      'grape':            { buy: 100000,  sell: 7554 },

      // M
      'mango':            { buy: 15000,   sell: 6308 },
      'mint':             { buy: 0,       sell: 6800 },
      'moon blossom':     { buy: 10000,   sell: 53512 },
      'moon mango':       { buy: 0,       sell: 24340 },
      'moon melon':       { buy: 0,       sell: 17750 },
      'moonglow':         { buy: 0,       sell: 20300 },
      'moonflower':       { buy: 0,       sell: 8900 },
      'mushroom':         { buy: 0,       sell: 142443 },

      // N
      'nightshade':       { buy: 0,       sell: 2300 },

      // O
      'orange tulip':     { buy: 0,       sell: 792 },

      // P
      'peach':            { buy: 4000,    sell: 283 },
      'pear':             { buy: 0,       sell: 500 },   // fallback to base
      'pepper':           { buy: 0,       sell: 7220 },  // fallback to base
      'pineapple':        { buy: 3250,    sell: 2350 },
      'pumpkin':          { buy: 75000,   sell: 3854 },

      // R
      'raspberry':        { buy: 0,       sell: 98 },

      // S
      'starfruit':        { buy: 0,       sell: 14100 },
      'strawberry':       { buy: 50000,   sell: 19 },

      // T
      'tomato':           { buy: 1300,    sell: 35 },

      // W
      'watermelon':       { buy: 10,      sell: 2905 },

      // (sequence continues)
      'banana':           { buy: 850000,  sell: 1634 },
      'candy blossom':    { buy: 0,       sell: 99436 },
      'candy sunflower':  { buy: 0,       sell: 164440 },
      'cherry blossom':   { buy: 0,       sell: 566 },
      'chocolate carrot': { buy: 0,       sell: 17258 },
      'cranberry':        { buy: 0,       sell: 2054 },
      'cursed fruit':     { buy: 0,       sell: 15944 },
      'durian':           { buy: 0,       sell: 4911 },
      'easter egg':       { buy: 10,      sell: 4844 },
      'eggplant':         { buy: 0,       sell: 7089 },
      'lemon':            { buy: 0,       sell: 554 },
      'lotus':            { buy: 0,       sell: 24598 },
      'papaya':           { buy: 0,       sell: 1288 },
      'passionfruit':     { buy: 0,       sell: 3299 },
      'red lollipop':     { buy: 0,       sell: 81297 },
      'soul fruit':       { buy: 0,       sell: 3328 },
      'venus fly trap':   { buy: 0,       sell: 18854 }
    };

    // apply (normalize both "spaces" and "hyphens")
    for (const [k, v] of Object.entries(set)) {
      const spaced = k.toLowerCase().trim();                 // e.g., "red lollipop"
      const hyphen = spaced.replace(/\s+/g, '-');            // e.g., "red-lollipop"
      const val = { buy: Number(v.buy || 0), sell: Number(v.sell || 0) };

      map[spaced] = val;   // for names with spaces
      map[hyphen] = val;   // for ids with hyphens
    }

    // common id aliases so matching never fails
    const aliases = {
      'blood-banana': 'blood banana',
      'bloodbanana' : 'blood banana',
      // keep these for robustness even though hyphen normalization covers them
      'red-lollipop': 'red lollipop',
      'soul-fruit'  : 'soul fruit',
      'venus-fly-trap': 'venus fly trap',
    };
    for (const [alias, target] of Object.entries(aliases)) {
      if (map[target]) map[alias] = map[target];
    }
    // ===================================================================

    window.TRADE_PRICES = map;

    if (!window.__TRADE_PRICES_LOGGED__) {
      window.__TRADE_PRICES_LOGGED__ = true;
      try {
        console.log(`[trade-prices] price map ready (${Object.keys(map).length} crops).`, {
          apple: map['apple'],
          bamboo: map['bamboo'],
          beanstalk: map['beanstalk'],
          blueberry: map['blueberry'],
          bloodbanana: map['bloodbanana'],
          cacao: map['cacao'],
        });
      } catch {}
    }
    return true;
  };

  if (!ensure()) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', ensure, { once: true });
    } else {
      setTimeout(ensure, 0);
    }
  }
})();
