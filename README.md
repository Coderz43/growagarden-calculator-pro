# 🌱 Grow A Garden Calculator • Pro

A responsive, web-based calculator and trade analyzer for the Roblox game **Grow A Garden**.  
This project helps players evaluate crop values, trade fairness, and explore growth multipliers — all wrapped in a clean, mobile-friendly UI.

![Preview](assets/img/logo-icon.svg)

---

## 🚀 Features

- **Crop Value Calculator**  
  - Input weight, quantity, friend boost, and environment multipliers  
  - Auto-selects “Max Mutation” for optimal calculations

- **Trade Calculator**  
  - Compare *your items* vs *their items*  
  - Dual analysis bars: Buy Price & Sell Value fairness indicators  
  - Responsive, touch-friendly design for mobile trading

- **Values Browser**  
  - Search, filter, and sort crops by name, rarity, type, or demand  
  - Always updated with competitor-exact numbers

- **Crops Grid Modal**  
  - Visual picker with search  
  - Alphabetical sequence order (Apple → Venus Fly Trap)  
  - Auto-loaded icons with SVG fallbacks

- **Fully Responsive**  
  - Works across **desktop, tablet, and mobile**  
  - Grid adapts from large screens down to 320px devices

---

## 📂 Project Structure

```
.
├── index.html          # Main calculator
├── values.html         # Crop values browser
├── trade.html          # Trade calculator
├── assets/
│   ├── css/styles.css  # Global styles
│   ├── img/            # Crop icons, logo
│   └── js/
│       ├── app.js      # UI logic
│       ├── data.js     # Crop base values
│       ├── trade.js    # Trade calculator logic
│       └── trade-prices.js # Override map with competitor-exact values
└── vercel.json         # Deployment config
```

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3 (responsive grid/flex), Vanilla JS (ES6+)
- **Deployment:** [Vercel](https://vercel.com/) (static hosting)
- **Game Data:** Competitor-exact overrides (`trade-prices.js`) + custom `data.js`

---

## ⚡ Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/grow-a-garden-calculator-pro.git
cd grow-a-garden-calculator-pro
```

### 2. Run locally
Open `index.html` directly in your browser, or use a static server:
```bash
npx serve .
```
(defaults to [http://localhost:3000](http://localhost:3000))

### 3. Deploy to Vercel
```bash
vercel
vercel --prod
```
Custom domain can be configured in the Vercel dashboard.

---

## 📱 Responsiveness

- Tested on Chrome DevTools device toolbar (iPhone, Android, iPad sizes)  
- Verified no horizontal overflow using debug outlines  
- Trade bars and crop grid scale down gracefully

---

## 📌 Roadmap

- [ ] Add automatic crop updates from `crops.json`  
- [ ] Save/load trade sessions in `localStorage`  
- [ ] Dark mode toggle  
- [ ] Accessibility improvements (keyboard navigation, ARIA roles)

---

## 🤝 Contributing

1. Fork the project  
2. Create a feature branch (`git checkout -b feature/new-feature`)  
3. Commit changes (`git commit -m 'Add feature'`)  
4. Push branch (`git push origin feature/new-feature`)  
5. Open a Pull Request  

---

## 📜 License

This project is open-source under the **MIT License**.  
You’re free to use, modify, and share with attribution.

---

## 💡 Credits

- Built by **[Your Name](https://github.com/yourusername)**  
- Inspired by Grow A Garden mechanics on Roblox  
- Competitor values synced from [growagarden-calculator.com](https://growagarden-calculator.com) (for accuracy)

---
