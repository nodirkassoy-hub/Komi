/* PENAPLAST — live product search (type / density / thickness / name) */
import { $, esc, debounce, lockScroll, fmtPrice } from './utils.js';
import { t, currentLang } from './i18n.js';
import { PRODUCTS, DENSITIES, THICKNESSES, priceForDensity, CRUSHED_PRICE } from './data.js';
import { openDetail } from './detail.js';

function parseQuery(q) {
  const lang = currentLang();
  const raw = q.toLowerCase().trim();
  const tokens = raw.split(/[\s,;+]+/).filter(Boolean);
  const numbers = [...raw.matchAll(/\d+(?:[.,]\d+)?/g)].map((m) => Number(m[0].replace(',', '.')));

  let density = null;
  let thickness = null;
  for (const n of numbers) {
    if (DENSITIES.some((d) => d.v === n)) density = n;
    else if (THICKNESSES.includes(n)) thickness = n;
  }
  // "20 sm / cm" explicit thickness
  const tm = raw.match(/(\d+)\s*(sm|cm|см)/);
  if (tm && THICKNESSES.includes(Number(tm[1]))) thickness = Number(tm[1]);

  const words = tokens.filter((w) => !/^\d/.test(w));
  return { words, density, thickness, lang, empty: !raw };
}

function scoreProduct(p, words, lang) {
  if (!words.length) return 1;
  const hay = [
    t(`prod.${p.id}.name`),
    t(`prod.${p.id}.desc`),
    ...(p.keywords[lang] || []),
    ...(p.keywords.uz || []),
    ...(p.keywords.ru || []),
    ...(p.keywords.en || []),
  ]
    .join(' ')
    .toLowerCase();
  let score = 0;
  for (const w of words) {
    if (w.length < 2) continue;
    if (hay.includes(w)) score += w.length >= 4 ? 2 : 1;
  }
  return score;
}

function resultCard(p, density, thickness) {
  const isSheet = p.kind === 'sheet';
  const d = isSheet ? density ?? p.defaultDensity : null;
  const th = isSheet ? thickness ?? p.defaultThickness : null;
  const price = isSheet ? fmtPrice(priceForDensity(d)) : `$${CRUSHED_PRICE.toFixed(2)}`;
  const unit = isSheet ? t('price.m3') : t('price.kg');
  const meta = isSheet
    ? `${d} ${esc(t('misc.kgm'))} • ${th} ${esc(t('misc.cm'))}`
    : esc(t('cfg.perKg'));
  return `
  <div class="sr-card" data-id="${p.id}" data-d="${d ?? ''}" data-t="${th ?? ''}" role="button" tabindex="0">
    <img src="${p.img}" alt="${esc(t(`prod.${p.id}.name`))}" loading="lazy" />
    <div><div class="sr-name">${esc(t(`prod.${p.id}.name`))}</div><div class="sr-meta">${meta}</div></div>
    <div class="sr-price">${esc(price)} <small>${esc(unit)}</small></div>
  </div>`;
}

export function initSearch() {
  const overlay = $('#searchOverlay');
  const input = $('#searchInput');
  const results = $('#searchResults');
  if (!overlay || !input || !results) return;

  const setOpen = (open) => {
    overlay.classList.toggle('open', open);
    overlay.setAttribute('aria-hidden', String(!open));
    lockScroll(open);
    if (open) {
      render(input.value);
      setTimeout(() => input.focus(), 60);
    } else {
      input.value = '';
    }
  };

  const render = (q) => {
    const { words, density, thickness, lang, empty } = parseQuery(q);
    let found = PRODUCTS.map((p) => ({ p, s: scoreProduct(p, words, lang) }))
      .filter((x) => (empty ? true : x.s > 0 || (density && x.p.kind === 'sheet')))
      .sort((a, b) => b.s - a.s)
      .slice(0, 12);
    if (!found.length) {
      results.innerHTML = `<div class="search-empty">${esc(t('search.empty'))}</div>`;
      return;
    }
    results.innerHTML = found.map((x) => resultCard(x.p, density, thickness)).join('');
  };

  $('#searchBtn')?.addEventListener('click', () => setOpen(true));
  $('#searchClose')?.addEventListener('click', () => setOpen(false));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) setOpen(false);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      setOpen(true);
    }
  });

  input.addEventListener('input', debounce(() => render(input.value), 120));
  document.addEventListener('langchange', () => {
    if (overlay.classList.contains('open')) render(input.value);
  });

  const go = (card) => {
    if (!card) return;
    setOpen(false);
    openDetail(card.dataset.id, {
      d: card.dataset.d ? Number(card.dataset.d) : null,
      t: card.dataset.t ? Number(card.dataset.t) : null,
    });
  };
  results.addEventListener('click', (e) => go(e.target.closest('.sr-card')));
  results.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') go(e.target.closest('.sr-card'));
  });
}
