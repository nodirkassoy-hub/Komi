# PENAPLAST — Penaplast Zavodi (EPS Factory Website)

Premium single-page website for the **PENAPLAST** EPS polystyrene foam factory.
Liquid glass + soft UI + realistic 3D product experience. No build step, no framework.

## Run locally

```bash
npm start
# or: python3 -m http.server 8000
```

Then open http://localhost:8000

## Structure

- `index.html` — page skeleton (all sections, modals, overlays)
- `css/` — design system (`tokens.css`), base, header, hero, products, sections,
  3D experience, modals, responsive
- `js/` — ES modules:
  - `data.js` — **editable**: prices, densities, thicknesses, contacts, sizes
  - `i18n.js` — UZ / RU / EN translations
  - `eps3d.js` — ultra-realistic EPS bead 3D viewer (Three.js)
  - `products.js`, `detail.js`, `search.js`, `order.js`, `experience.js`,
    `sections.js`, `header.js`, `hero.js`, `theme.js`, `reveal.js`, `utils.js`
- `assets/img/` — product, factory, stage and application imagery
- `vendor/three/` — vendored Three.js r160 (works fully offline)

## Editing essentials

| What | Where |
|---|---|
| Density prices, thicknesses (max 60 cm) | `js/data.js` → `DENSITIES`, `THICKNESSES`, `MAX_THICKNESS` |
| Phone / Telegram / email / address | `js/data.js` → `PHONE`, `CONFIG` |
| Order integrations (Telegram bot / CRM API) | `js/data.js` → `CONFIG.integrations`, `js/order.js` → `sendOrder()` |
| Texts (UZ/RU/EN) | `js/i18n.js` |
| Standard sheet size | `js/data.js` → `SHEET` |

## Checks

```bash
npm run check   # syntax-check all JS modules
```

Brand: **PENAPLAST** · PENAPLAST ZAVODI · +998 99 513 22 22
