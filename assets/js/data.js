/* Data-only file. Update crops and multipliers here. */
window.DATA = {
  // ========= CROPS =========
  // (Icons are optional: assets/img/crops/<id>.png)
crops: [
  { id:"apple",            name:"Apple",            base:248,    icon:"assets/img/crops/apple.png" },
  { id:"bamboo",           name:"Bamboo",           base:3610,   icon:"assets/img/crops/bamboo.png" },
  { id:"beanstalk",        name:"Beanstalk",        base:25270,  icon:"assets/img/crops/beanstalk.png" },
  { id:"blueberry",        name:"Blueberry",        base:18,     icon:"assets/img/crops/blueberry.png" },
  { id:"blood-banana",     name:"Blood Banana",     base:5415,   icon:"assets/img/crops/blood-banana.png" },
  { id:"cacao",            name:"Cacao",            base:10830,  icon:"assets/img/crops/cacao.png" },
  { id:"cactus",           name:"Cactus",           base:3068,   icon:"assets/img/crops/cactus.png" },
  { id:"carrot",           name:"Carrot",           base:18,     icon:"assets/img/crops/carrot.png" },
  { id:"celestiberry",     name:"Celestiberry",     base:9025,   icon:"assets/img/crops/celestiberry.png" },
  { id:"coconut",          name:"Coconut",          base:361,    icon:"assets/img/crops/coconut.png" },
  { id:"corn",             name:"Corn",             base:36,     icon:"assets/img/crops/corn.png" },
  { id:"daffodil",         name:"Daffodil",         base:903,    icon:"assets/img/crops/daffodil.png" },
  { id:"dragon-fruit",     name:"Dragon Fruit",     base:4287,   icon:"assets/img/crops/dragon-fruit.png" },
  { id:"glowshroom",       name:"Glowshroom",       base:271,    icon:"assets/img/crops/glowshroom.png" },
  { id:"grape",            name:"Grape",            base:7085,   icon:"assets/img/crops/grape.png" },
  { id:"mango",            name:"Mango",            base:5866,   icon:"assets/img/crops/mango.png" },
  { id:"mint",             name:"Mint",             base:5415,   icon:"assets/img/crops/mint.png" },
  { id:"moon-blossom",     name:"Moon Blossom",     base:50138,  icon:"assets/img/crops/moon-blossom.png" },
  { id:"moon-mango",       name:"Moon Mango",       base:45125,  icon:"assets/img/crops/moon-mango.png" },
  { id:"moon-melon",       name:"Moon Melon",       base:16245,  icon:"assets/img/crops/moon-melon.png" },
  { id:"moonglow",         name:"Moonglow",         base:20300,  icon:"assets/img/crops/moonglow.png" },
  { id:"moonflower",       name:"Moonflower",       base:8574,   icon:"assets/img/crops/moonflower.png" },
  { id:"mushroom",         name:"Mushroom",         base:136278, icon:"assets/img/crops/mushroom.png" },
  { id:"nightshade",       name:"Nightshade",       base:3159,   icon:"assets/img/crops/nightshade.png" },
  { id:"orange-tulip",     name:"Orange Tulip",     base:767,    icon:"assets/img/crops/orange-tulip.png" },
  { id:"peach",            name:"Peach",            base:271,    icon:"assets/img/crops/peach.png" },
  { id:"pear",             name:"Pear",             base:500,    icon:"assets/img/crops/pear.png" },
  { id:"pepper",           name:"Pepper",           base:7220,   icon:"assets/img/crops/pepper.png" },
  { id:"pineapple",        name:"Pineapple",        base:1805,   icon:"assets/img/crops/pineapple.png" },
  { id:"pumpkin",          name:"Pumpkin",          base:3700,   icon:"assets/img/crops/pumpkin.png" },
  { id:"raspberry",        name:"Raspberry",        base:90,     icon:"assets/img/crops/raspberry.png" },
  { id:"starfruit",        name:"Starfruit",        base:13538,  icon:"assets/img/crops/starfruit.png" },
  { id:"strawberry",       name:"Strawberry",       base:14,     icon:"assets/img/crops/strawberry.png" },
  { id:"tomato",           name:"Tomato",           base:27,     icon:"assets/img/crops/tomato.png" },
  { id:"watermelon",       name:"Watermelon",       base:2708,   icon:"assets/img/crops/watermelon.png" },
  { id:"banana",           name:"Banana",           base:1579,   icon:"assets/img/crops/banana.png" },
  { id:"candy-blossom",    name:"Candy Blossom",    base:90250,  icon:"assets/img/crops/candy-blossom.png" },
  { id:"candy-sunflower",  name:"Candy Sunflower",  base:72200,  icon:"assets/img/crops/candy-sunflower.png" },
  { id:"cherry-blossom",   name:"Cherry Blossom",   base:550,    icon:"assets/img/crops/cherry-blossom.png" },
  { id:"chocolate-carrot", name:"Chocolate Carrot", base:9928,   icon:"assets/img/crops/chocolate-carrot.png" },
  { id:"cranberry",        name:"Cranberry",        base:1805,   icon:"assets/img/crops/cranberry.png" },
  { id:"cursed-fruit",     name:"Cursed Fruit",     base:10000,  icon:"assets/img/crops/cursed-fruit.png" },
  { id:"durian",           name:"Durian",           base:4513,   icon:"assets/img/crops/durian.png" },
  { id:"easter-egg",       name:"Easter Egg",       base:2256,   icon:"assets/img/crops/easter-egg.png" },
  { id:"eggplant",         name:"Eggplant",         base:6769,   icon:"assets/img/crops/eggplant.png" },
  { id:"lemon",            name:"Lemon",            base:500,    icon:"assets/img/crops/lemon.png" },
  { id:"lotus",            name:"Lotus",            base:15343,  icon:"assets/img/crops/lotus.png" },
  { id:"papaya",           name:"Papaya",           base:1000,   icon:"assets/img/crops/papaya.png" },
  { id:"passionfruit",     name:"Passionfruit",     base:3204,   icon:"assets/img/crops/passionfruit.png" },
  { id:"red-lollipop",     name:"Red Lollipop",     base:81297,  icon:"assets/img/crops/red-lollipop.png" },
  { id:"soul-fruit",       name:"Soul Fruit",       base:3328,   icon:"assets/img/crops/soul-fruit.png" },
  { id:"venus-fly-trap",   name:"Venus Fly Trap",   base:17000,  icon:"assets/img/crops/venus-fly-trap.png" }
],

  // ========= GROWTH =========
  growth: [
    { id:"g-default", label:"Default",       multiplier:0,  badge:"+0",  type:"radio" },
    { id:"golden",    label:"Golden",        multiplier:20, badge:"×20", type:"radio" },
    { id:"rainbow",   label:"Rainbow 🌈",    multiplier:50, badge:"×50", type:"radio" }
  ],

  // ========= TEMPERATURE =========
  temperature: [
    { id:"t-default", label:"Default",     multiplier:0,  badge:"+0",  type:"radio" },
    { id:"wet",       label:"Wet 💧",      multiplier:2,  badge:"×2",  type:"radio" },
    { id:"chilled",   label:"Chilled 🧊",  multiplier:2,  badge:"×2",  type:"radio" },
    { id:"drenched",  label:"Drenched 💦", multiplier:5,  badge:"×5",  type:"radio" },
    { id:"frozen",    label:"Frozen ❄️",   multiplier:10, badge:"×10", type:"radio" }
  ],

  // ========= ENVIRONMENTAL (ordered like competitor) =========
  environmental: [
    // Row 1
    { id:"chocolate",    label:"Chocolate",    multiplier:2 },
    { id:"moonlit",      label:"Moonlit",      multiplier:2 },
    { id:"windstruck",   label:"Windstruck",   multiplier:2 },
    { id:"pollinated",   label:"Pollinated",   multiplier:3 },

    // Row 2
    { id:"sandy",        label:"Sandy",        multiplier:3 },
    { id:"bloodlit",     label:"Bloodlit",     multiplier:4 },
    { id:"burnt",        label:"Burnt",        multiplier:4 },
    { id:"verdant",      label:"Verdant",      multiplier:4 },

    // Row 3
    { id:"wiltproof",    label:"Wiltproof",    multiplier:4 },
    { id:"plasma",       label:"Plasma",       multiplier:5 },
    { id:"honey",        label:"Honey Glazed", multiplier:5 },
    { id:"heavenly",     label:"Heavenly",     multiplier:5 },

    // Row 4
    { id:"twisted",      label:"Twisted",      multiplier:5 },
    { id:"cloudtouched", label:"Cloudtouched", multiplier:5 },
    { id:"clay",         label:"Clay",         multiplier:5 },
    { id:"fried",        label:"Fried",        multiplier:8 },

    // Row 5
    { id:"cooked",       label:"Cooked",       multiplier:10 },
    { id:"amber",        label:"Amber",        multiplier:10 },
    { id:"tempestuous",  label:"Tempestuous",  multiplier:12 },
    { id:"oldamber",     label:"OldAmber",     multiplier:20 },

    // Row 6
    { id:"zombified",    label:"Zombified",    multiplier:25 },
    { id:"molten",       label:"Molten",       multiplier:25 },
    { id:"ceramic",      label:"Ceramic",      multiplier:30 },
    { id:"ancientamber", label:"AncientAmber", multiplier:50 },

    // Row 7
    { id:"friendbound",  label:"Friendbound",  multiplier:70 },
    { id:"infected",     label:"Infected",     multiplier:75 },
    { id:"sundried",     label:"Sundried",     multiplier:85 },
    { id:"aurora",       label:"Aurora",       multiplier:90 },

    // Row 8
    { id:"shocked",      label:"Shocked",      multiplier:100 },
    { id:"paradisal",    label:"Paradisal",    multiplier:100 },
    { id:"alienlike",    label:"Alienlike",    multiplier:100 },
    { id:"celestial",    label:"Celestial",    multiplier:120 },

    // Row 9
    { id:"galactic",     label:"Galactic",     multiplier:120 },
    { id:"disco",        label:"Disco",        multiplier:125 },
    { id:"meteoric",     label:"Meteoric",     multiplier:125 },
    { id:"voidtouched",  label:"Voidtouched",  multiplier:135 },

    // Row 10
    { id:"dawnbound",    label:"Dawnbound",    multiplier:150 },
    { id:"toxic",        label:"Toxic",        multiplier:12 },
    { id:"chakra",       label:"Chakra",       multiplier:15 },
    { id:"tranquil",     label:"Tranquil",     multiplier:20 },

    // Row 11
    { id:"radioactive",  label:"Radioactive",  multiplier:80 },
    { id:"foxfire",      label:"Foxfire",      multiplier:90 }
  ]
};
