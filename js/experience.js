/* PENAPLAST — 3D experience section: viewer + configurator */
import { $, esc, fmtPrice, debounce } from './utils.js';
import { t } from './i18n.js';
import { DENSITIES, THICKNESSES, priceForDensity } from './data.js';
import { openOrder } from './order.js';

const state = { mat: 'white', d: 15, t: 5 };
let viewer = null;
let viewerFailed = false;

function buildSelects() {
  const dSel = $('#expDensity');
  const tSel = $('#expThickness');
  if (dSel) {
    dSel.innerHTML = DENSITIES.map(
      (d) => `<option value="${d.v}"${d.v === state.d ? ' selected' : ''}>${d.v} ${esc(t('misc.kgm'))} — $${d.p}</option>`
    ).join('');
  }
  if (tSel) {
    tSel.innerHTML = THICKNESSES.map(
      (v) => `<option value="${v}"${v === state.t ? ' selected' : ''}>${v} ${esc(t('misc.cm'))}</option>`
    ).join('');
  }
}

function updateUI() {
  const price = $('#expPrice');
  if (price) price.textContent = `${fmtPrice(priceForDensity(state.d))} ${t('price.m3')}`;
  const vd = $('#vDensity');
  if (vd) vd.textContent = `${state.d} ${t('misc.kgm')}`;
  const vt = $('#vThickness');
  if (vt) vt.textContent = `${state.t} ${t('misc.cm')}`;
}

const pushToViewer = debounce(() => {
  if (!viewer) return;
  viewer.setDensity(state.d);
  viewer.setThickness(state.t);
}, 120);

async function ensureViewer() {
  if (viewer || viewerFailed) return;
  const canvas = $('#epsCanvas');
  const card = $('#viewerCard');
  const loader = $('#viewerLoader');
  if (!canvas || !card) return;
  try {
    const { createEpsViewer } = await import('./eps3d.js');
    viewer = createEpsViewer(canvas, {
      material: state.mat,
      thickness: state.t,
      density: state.d,
      autoRotate: true,
    });
    loader?.classList.add('hide');
  } catch (err) {
    console.warn('3D unavailable, using photo fallback:', err);
    viewerFailed = true;
    card.classList.add('no-webgl');
    loader?.classList.add('hide');
  }
}

export function initExperience() {
  buildSelects();
  updateUI();

  $('#expDensity')?.addEventListener('change', (e) => {
    state.d = Number(e.target.value);
    updateUI();
    pushToViewer();
  });
  $('#expThickness')?.addEventListener('change', (e) => {
    state.t = Number(e.target.value);
    updateUI();
    pushToViewer();
  });

  const wBtn = $('#matWhite');
  const bBtn = $('#matBlack');
  const setMat = (m) => {
    state.mat = m;
    wBtn?.classList.toggle('active', m === 'white');
    bBtn?.classList.toggle('active', m === 'black');
    viewer?.setMaterial(m);
  };
  wBtn?.addEventListener('click', () => setMat('white'));
  bBtn?.addEventListener('click', () => setMat('black'));

  $('#expOrder')?.addEventListener('click', () => {
    openOrder({ product: state.mat, d: state.d, t: state.t });
  });

  // Lazy-load the 3D engine when the section approaches
  const card = $('#viewerCard');
  if (card && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (en) => {
        if (en[0].isIntersecting) {
          ensureViewer();
          io.disconnect();
        }
      },
      { rootMargin: '420px 0px' }
    );
    io.observe(card);
  } else {
    ensureViewer();
  }

  document.addEventListener('langchange', () => {
    buildSelects();
    updateUI();
  });
}
