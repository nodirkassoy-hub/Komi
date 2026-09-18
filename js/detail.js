/* PENAPLAST — product detail modal (photo + 3D tabs, live specs) */
import { $, esc, lockScroll, fmtPrice } from './utils.js';
import { t } from './i18n.js';
import {
  PRODUCTS, DENSITIES, THICKNESSES, MAX_THICKNESS,
  priceForDensity, CRUSHED_PRICE, SHEET,
} from './data.js';
import { openOrder } from './order.js';

let current = { id: 'white', d: 15, t: 5 };
let detailViewer = null;
let detailLoading = false;

function sheetSize() {
  return `${SHEET.w} × ${SHEET.h} ${t('misc.cm')}`;
}

function fillSelects() {
  const p = PRODUCTS.find((x) => x.id === current.id);
  const isSheet = p.kind === 'sheet';
  const dSel = $('#detailDensity');
  const tSel = $('#detailThickness');

  if (isSheet) {
    dSel.disabled = false;
    dSel.innerHTML = DENSITIES.map(
      (d) => `<option value="${d.v}"${d.v === current.d ? ' selected' : ''}>${d.v} ${esc(t('misc.kgm'))} — $${d.p}</option>`
    ).join('');
    tSel.disabled = false;
    tSel.innerHTML = THICKNESSES.map(
      (v) => `<option value="${v}"${v === current.t ? ' selected' : ''}>${v} ${esc(t('misc.cm'))}</option>`
    ).join('');
  } else {
    dSel.disabled = true;
    dSel.innerHTML = `<option>${esc(t('order.na'))}</option>`;
    tSel.disabled = true;
    tSel.innerHTML = `<option>${esc(t('order.na'))}</option>`;
  }
  $('#dt3d').style.display = isSheet ? '' : 'none';
  if (!isSheet) setTab('photo');
}

function fillSpecs() {
  const p = PRODUCTS.find((x) => x.id === current.id);
  const isSheet = p.kind === 'sheet';
  const rows = [
    [t('detail.material'), t('detail.materialV')],
    [t('detail.color'), t(`prod.${p.id}.color`)],
  ];
  if (isSheet) {
    rows.push(
      [t('detail.density'), `${current.d} ${t('misc.kgm')}`],
      [t('detail.thickness'), `${current.t} ${t('misc.cm')}`],
      [t('detail.standard'), sheetSize()]
    );
  } else {
    rows.push([t('exp.price'), `$${CRUSHED_PRICE.toFixed(2)} ${t('price.kg')}`]);
  }
  rows.push([t('detail.app'), t(`prod.${p.id}.app`)]);
  $('#detailSpecs').innerHTML =
    rows.map(([k, v]) => `<div class="row"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`).join('');
  $('#detailPrice').textContent = isSheet
    ? `${fmtPrice(priceForDensity(current.d))} ${t('price.m3')}`
    : `$${CRUSHED_PRICE.toFixed(2)} ${t('price.kg')}`;
}

function setTab(which) {
  const media = $('#detailMedia');
  const is3d = which === '3d';
  media?.classList.toggle('mode-3d', is3d);
  $('#dtPhoto')?.classList.toggle('active', !is3d);
  $('#dt3d')?.classList.toggle('active', is3d);
  if (is3d) ensureViewer();
}

async function ensureViewer() {
  if (detailViewer || detailLoading) return;
  detailLoading = true;
  try {
    const { createEpsViewer } = await import('./eps3d.js');
    const canvas = $('#detailCanvas');
    if (!canvas) return;
    detailViewer = createEpsViewer(canvas, {
      material: current.id === 'black' ? 'black' : 'white',
      thickness: current.t || 5,
      density: current.d || 15,
      autoRotate: true,
    });
  } catch (err) {
    console.warn('Detail 3D unavailable:', err);
    setTab('photo');
  } finally {
    detailLoading = false;
  }
}

export function openDetail(id, pre = {}) {
  const p = PRODUCTS.find((x) => x.id === id) || PRODUCTS[0];
  current = {
    id: p.id,
    d: pre.d ?? p.defaultDensity ?? 15,
    t: pre.t ?? p.defaultThickness ?? 5,
  };
  $('#detailName').textContent = t(`prod.${p.id}.name`);
  $('#detailApp').textContent = t(`prod.${p.id}.desc`);
  const img = $('#detailImg');
  img.src = p.img;
  img.alt = t(`prod.${p.id}.name`);
  setTab('photo');
  fillSelects();
  fillSpecs();
  // keep 3D viewer in sync if it exists
  if (detailViewer && p.kind === 'sheet') {
    detailViewer.setMaterial(p.id === 'black' ? 'black' : 'white');
    detailViewer.setThickness(current.t);
    detailViewer.setDensity(current.d);
  }
  $('#detailModal')?.classList.add('open');
  $('#detailModal')?.setAttribute('aria-hidden', 'false');
  lockScroll(true);
}

export function closeDetail() {
  $('#detailModal')?.classList.remove('open');
  $('#detailModal')?.setAttribute('aria-hidden', 'true');
  lockScroll(false);
}

export function initDetail() {
  $('#dtPhoto')?.addEventListener('click', () => setTab('photo'));
  $('#dt3d')?.addEventListener('click', () => setTab('3d'));

  $('#detailDensity')?.addEventListener('change', (e) => {
    current.d = Number(e.target.value);
    fillSpecs();
    detailViewer?.setDensity(current.d);
  });
  $('#detailThickness')?.addEventListener('change', (e) => {
    current.t = Math.min(Number(e.target.value), MAX_THICKNESS);
    fillSpecs();
    detailViewer?.setThickness(current.t);
  });

  $('#detailOrder')?.addEventListener('click', () => {
    const payload = { product: current.id, d: current.d, t: current.t };
    closeDetail();
    setTimeout(() => openOrder(payload), 120);
  });

  document.querySelectorAll('[data-close-detail]').forEach((el) =>
    el.addEventListener('click', closeDetail)
  );
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('#detailModal')?.classList.contains('open')) closeDetail();
  });
  document.addEventListener('langchange', () => {
    if (!$('#detailModal')?.classList.contains('open')) return;
    const p = PRODUCTS.find((x) => x.id === current.id);
    $('#detailName').textContent = t(`prod.${p.id}.name`);
    $('#detailApp').textContent = t(`prod.${p.id}.desc`);
    fillSelects();
    fillSpecs();
  });
}
