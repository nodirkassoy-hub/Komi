/* PENAPLAST — product catalog: cards, density/thickness selectors, filters */
import { $, $$, esc, fmtPrice } from './utils.js';
import { t } from './i18n.js';
import {
  PRODUCTS, DENSITIES, THICKNESSES, MAX_THICKNESS,
  priceForDensity, CRUSHED_PRICE, SHEET,
} from './data.js';
import { openDetail } from './detail.js';
import { openOrder } from './order.js';
import { observeReveals } from './reveal.js';

const sel = {
  white: { d: 15, t: 5 },
  black: { d: 15, t: 5 },
  crushed: { d: null, t: null },
};
const filters = { cat: 'all', density: null, thickness: null };

export const getSelection = (id) => ({ ...(sel[id] || {}) });
export const getProduct = (id) => PRODUCTS.find((p) => p.id === id);

function sheetSize() {
  return `${SHEET.w} × ${SHEET.h} ${t('misc.cm')}`;
}

function cardHTML(p, idx) {
  const isSheet = p.kind === 'sheet';
  const s = sel[p.id];
  const price = isSheet ? fmtPrice(priceForDensity(s.d)) : `$${CRUSHED_PRICE.toFixed(2)}`;
  const unit = isSheet ? t('price.m3') : t('price.kg');

  const densityPills = isSheet
    ? `<div><p class="cfg-label">${esc(t('cfg.density'))}</p>
       <div class="density-pills" role="group">
         ${DENSITIES.map((d) => `<button class="d-pill${d.v === s.d ? ' active' : ''}" data-d="${d.v}">${d.v} ${esc(t('misc.kgm'))}</button>`).join('')}
       </div></div>`
    : `<p class="p-app">⚖️ ${esc(t('cfg.perKg'))}</p>`;

  const thickBlock = isSheet
    ? `<div class="thick-row">
         <div class="field"><label>${esc(t('cfg.thickness'))}</label>
           <select class="select thick-sel">${THICKNESSES.map((v) => `<option value="${v}"${v === s.t ? ' selected' : ''}>${v} ${esc(t('misc.cm'))}</option>`).join('')}</select>
         </div>
         <span class="thick-note">${esc(t('cfg.maxNote'))} • ${esc(sheetSize())}</span>
       </div>`
    : '';

  return `
  <article class="p-card reveal${idx % 2 === 1 ? ' reverse' : ''}" data-id="${p.id}">
    <div class="p-media">
      <img src="${p.img}" alt="${esc(t(`prod.${p.id}.name`))}" loading="lazy" decoding="async" />
      <span class="p-tag">EPS • ${esc(t(`prod.${p.id}.color`))}</span>
      ${isSheet ? `<span class="p-zoom">${esc(sheetSize())}</span>` : `<span class="p-zoom">$0.70 / kg</span>`}
    </div>
    <div class="p-body">
      <h3 class="p-name">${esc(t(`prod.${p.id}.name`))}</h3>
      <p class="p-app">${esc(t(`prod.${p.id}.desc`))}</p>
      ${densityPills}
      ${thickBlock}
      <div class="p-foot">
        <div class="price"><span class="price-val" data-price>$${esc(String(price).replace('$', ''))}</span><span class="price-unit">${esc(unit)}</span></div>
        <div class="p-actions">
          <button class="btn btn-ghost" data-act="detail">${esc(t('btn.detail'))}</button>
          <button class="btn btn-primary" data-act="order">${esc(t('btn.order'))}</button>
        </div>
      </div>
    </div>
  </article>`;
}

function renderGrid() {
  const grid = $('#productGrid');
  if (!grid) return;
  const list = PRODUCTS.filter((p) => filters.cat === 'all' || p.id === filters.cat);
  grid.innerHTML = list.map((p, i) => cardHTML(p, i)).join('');
  observeReveals(grid);
}

function flashPrice(card) {
  const el = $('.price-val', card);
  if (!el) return;
  el.classList.remove('price-flash');
  void el.offsetWidth;
  el.classList.add('price-flash');
}

function refreshCardPrice(card, id) {
  const s = sel[id];
  const el = $('.price-val', card);
  if (el) el.textContent = fmtPrice(priceForDensity(s.d));
  flashPrice(card);
}

function buildFilterSelects() {
  const dSel = $('#densityFilter');
  const tSel = $('#thicknessFilter');
  if (dSel) {
    dSel.innerHTML =
      `<option value="">${esc(t('filters.density'))}: ${esc(t('filters.densityAll'))}</option>` +
      DENSITIES.map((d) => `<option value="${d.v}"${filters.density === d.v ? ' selected' : ''}>${d.v} ${esc(t('misc.kgm'))} — $${d.p}</option>`).join('');
  }
  if (tSel) {
    tSel.innerHTML =
      `<option value="">${esc(t('cfg.thickness'))}: ${esc(t('filters.thicknessAll'))}</option>` +
      THICKNESSES.map((v) => `<option value="${v}"${filters.thickness === v ? ' selected' : ''}>${v} ${esc(t('misc.cm'))}</option>`).join('');
  }
}

export function initProducts() {
  buildFilterSelects();
  renderGrid();

  document.addEventListener('langchange', () => {
    buildFilterSelects();
    renderGrid();
  });

  // Category pills
  $('#catPills')?.addEventListener('click', (e) => {
    const b = e.target.closest('.pill');
    if (!b) return;
    filters.cat = b.dataset.cat;
    $$('#catPills .pill').forEach((p) => p.classList.toggle('active', p === b));
    renderGrid();
  });

  // Global density / thickness filters -> apply to sheet cards instantly
  $('#densityFilter')?.addEventListener('change', (e) => {
    filters.density = e.target.value ? Number(e.target.value) : null;
    if (filters.density) {
      sel.white.d = filters.density;
      sel.black.d = filters.density;
    }
    renderGrid();
  });
  $('#thicknessFilter')?.addEventListener('change', (e) => {
    filters.thickness = e.target.value ? Number(e.target.value) : null;
    if (filters.thickness) {
      const v = Math.min(filters.thickness, MAX_THICKNESS);
      sel.white.t = v;
      sel.black.t = v;
    }
    renderGrid();
  });

  // Card interactions (delegated)
  $('#productGrid')?.addEventListener('click', (e) => {
    const card = e.target.closest('.p-card');
    if (!card) return;
    const id = card.dataset.id;

    const pill = e.target.closest('.d-pill');
    if (pill) {
      sel[id].d = Number(pill.dataset.d);
      $$('.d-pill', card).forEach((p) => p.classList.toggle('active', p === pill));
      refreshCardPrice(card, id);
      return;
    }
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'detail') openDetail(id, getSelection(id));
    if (act === 'order') openOrder({ product: id, ...getSelection(id) });
  });

  $('#productGrid')?.addEventListener('change', (e) => {
    if (!e.target.classList.contains('thick-sel')) return;
    const card = e.target.closest('.p-card');
    const id = card?.dataset.id;
    if (!id) return;
    sel[id].t = Math.min(Number(e.target.value), MAX_THICKNESS);
  });
}
