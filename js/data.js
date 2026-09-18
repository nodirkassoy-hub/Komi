/* ============================================================
   PENAPLAST — Central data (EDITABLE: prices, contacts, sizes)
   ============================================================ */

// ---------- Brand contacts ----------
export const PHONE = '+998 99 513 22 22';
export const PHONE_HREF = 'tel:+998995132222';

export const CONFIG = {
  // EDITABLE PLACEHOLDERS — replace with real details when available:
  telegramUrl: 'https://t.me/penaplast_uz',
  telegramLabel: '@penaplast_uz',
  email: 'info@penaplast.uz',
  address: {
    uz: "Toshkent sh., O'zbekiston",
    ru: 'г. Ташкент, Узбекистан',
    en: 'Tashkent, Uzbekistan',
  },
  // Future order integrations (Telegram bot / API / CRM) — see js/order.js sendOrder()
  integrations: {
    telegramBotToken: '', // e.g. '123456:ABC...' (keep empty until provided)
    telegramChatId: '', // e.g. '-1001234567890'
    apiEndpoint: '', // e.g. 'https://crm.example.com/api/orders'
  },
};

// ---------- Density -> price (USD per 1 m3). EXACT client prices. ----------
export const DENSITIES = [
  { v: 7, p: 32 },
  { v: 10, p: 40 },
  { v: 12, p: 50 },
  { v: 14, p: 62 },
  { v: 15, p: 67 },
  { v: 16, p: 71 },
  { v: 18, p: 79 },
  { v: 20, p: 87 },
];

// ---------- Thickness options (cm). Easy to edit. Max is enforced. ----------
export const MAX_THICKNESS = 60;
export const THICKNESSES = [1, 2, 3, 5, 10, 15, 20, 30, 40, 50, 60];

// ---------- Standard sheet size (EDITABLE) ----------
export const SHEET = { w: 100, h: 100, unit: 'cm' };

// ---------- Crushed foam price (USD per kg) ----------
export const CRUSHED_PRICE = 0.7;

// ---------- Products ----------
export const PRODUCTS = [
  {
    id: 'white',
    kind: 'sheet',
    img: 'assets/img/eps-white.jpg',
    defaultDensity: 15,
    defaultThickness: 5,
    keywords: {
      uz: ['oq', 'penaplast', 'eps', 'plita', 'list', 'standart'],
      ru: ['белый', 'пенопласт', 'eps', 'плита', 'лист'],
      en: ['white', 'foam', 'eps', 'board', 'sheet'],
    },
  },
  {
    id: 'black',
    kind: 'sheet',
    img: 'assets/img/eps-black.jpg',
    defaultDensity: 15,
    defaultThickness: 5,
    keywords: {
      uz: ['qora', 'penaplast', 'eps', 'grafit', 'plita'],
      ru: ['чёрный', 'черный', 'пенопласт', 'eps', 'графит', 'графитовый'],
      en: ['black', 'foam', 'eps', 'graphite'],
    },
  },
  {
    id: 'crushed',
    kind: 'crushed',
    img: 'assets/img/eps-crushed.jpg',
    defaultDensity: null,
    defaultThickness: null,
    keywords: {
      uz: ['maydalangan', 'kroshka', 'granula', 'dona', 'uqalangan', 'bo‘lak'],
      ru: ['дроблёный', 'дробленый', 'крошка', 'гранула', 'куски'],
      en: ['crushed', 'chips', 'beads', 'granules', 'crumb'],
    },
  },
];

// ---------- Production stages ----------
export const STAGES = [
  { img: 'assets/img/stage-1-raw.jpg' },
  { img: 'assets/img/stage-2-expansion.jpg' },
  { img: 'assets/img/stage-3-molding.jpg' },
  { img: 'assets/img/stage-4-cutting.jpg' },
  { img: 'assets/img/stage-5-quality.jpg' },
  { img: 'assets/img/stage-6-finished.jpg' },
];

// ---------- Applications (7) ----------
export const APPS = [
  { img: 'assets/img/app-house.jpg' },
  { img: 'assets/img/app-buildings.jpg' },
  { img: 'assets/img/app-wall.jpg' },
  { img: 'assets/img/app-roof.jpg' },
  { img: 'assets/img/app-floor.jpg' },
  { img: 'assets/img/app-cold.jpg' },
  { img: 'assets/img/app-pack.webp' },
];

export const priceForDensity = (d) => DENSITIES.find((x) => x.v === d)?.p ?? null;
export const clampThickness = (t) => Math.min(Math.max(t, 1), MAX_THICKNESS);
