/* PENAPLAST — stages, applications, production flow, macro lens, contact */
import { $, $$, esc, toast } from './utils.js';
import { t, currentLang } from './i18n.js';
import { STAGES, APPS, PHONE, PHONE_HREF, CONFIG } from './data.js';
import { observeReveals } from './reveal.js';

const pad = (n) => String(n).padStart(2, '0');

function renderStages() {
  const wrap = $('#stages');
  if (!wrap) return;
  wrap.innerHTML = STAGES.map(
    (s, i) => `
    <div class="stage" data-stage="${i + 1}">
      <div class="stage-dot">${pad(i + 1)}</div>
      <div class="stage-card">
        <div class="stage-media">
          <img src="${s.img}" alt="${esc(t(`stage.${i + 1}.t`))}" loading="lazy" decoding="async" />
          <span class="stage-num">${pad(i + 1)}</span>
        </div>
        <div class="stage-body">
          <h3 class="stage-title">${esc(t(`stage.${i + 1}.t`))}</h3>
          <p class="stage-desc">${esc(t(`stage.${i + 1}.d`))}</p>
        </div>
      </div>
    </div>`
  ).join('');
  initFlowSpy();
}

function renderApps() {
  const grid = $('#appsGrid');
  if (!grid) return;
  grid.innerHTML = APPS.map(
    (a, i) => `
    <div class="app-card reveal" style="transition-delay:${Math.min(i * 60, 360)}ms">
      <img src="${a.img}" alt="${esc(t(`app.${i + 1}.t`))}" loading="lazy" decoding="async" />
      <div class="app-body">
        <h3 class="app-title">${esc(t(`app.${i + 1}.t`))}</h3>
        <p class="app-sub">${esc(t(`app.${i + 1}.s`))}</p>
      </div>
    </div>`
  ).join('');
  observeReveals(grid);
}

/* Scroll-driven production flow: activate 01 -> 06 + progress line */
let flowInit = false;
function initFlowSpy() {
  const stages = $$('.stage');
  const progress = $('#flowProgress');
  const flow = $('#flow');
  if (!stages.length || !progress || !flow) return;

  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          const idx = Number(en.target.dataset.stage);
          stages.forEach((s) => s.classList.toggle('active', Number(s.dataset.stage) <= idx));
        }
      });
    },
    { rootMargin: '-30% 0px -45% 0px' }
  );
  stages.forEach((s) => spy.observe(s));

  if (flowInit) return;
  flowInit = true;
  let ticking = false;
  const update = () => {
    ticking = false;
    const r = flow.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = r.height - vh * 0.4;
    const done = Math.min(Math.max(vh * 0.6 - r.top, 0), Math.max(total, 1));
    progress.style.height = `${(done / Math.max(total, 1)) * 100}%`;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
}

/* Macro magnifier lens */
function initMacroLens() {
  const card = $('#macroCard');
  const lens = $('#macroLens');
  const img = $('#macroImg');
  if (!card || !lens || !img) return;
  const ZOOM = 2.4;
  const move = (cx, cy) => {
    const r = card.getBoundingClientRect();
    const x = Math.min(Math.max(cx - r.left, 0), r.width);
    const y = Math.min(Math.max(cy - r.top, 0), r.height);
    lens.style.left = `${x}px`;
    lens.style.top = `${y}px`;
    lens.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
    lens.style.backgroundSize = `${r.width * ZOOM}px ${r.height * ZOOM}px`;
    lens.style.backgroundPosition = `-${x * ZOOM - 75}px -${y * ZOOM - 75}px`;
  };
  card.addEventListener('mousemove', (e) => move(e.clientX, e.clientY));
  card.addEventListener('touchmove', (e) => {
    const tc = e.touches[0];
    if (tc) move(tc.clientX, tc.clientY);
  }, { passive: true });
}

/* Contact placeholders (editable in js/data.js) */
function syncContact() {
  const lang = currentLang();
  $$('#headerPhone, #contactPhone, .mm-phone').forEach((a) => {
    a.setAttribute('href', PHONE_HREF);
    const span = $('span', a);
    if (span) span.textContent = PHONE;
    else if (a.id !== 'headerPhone') a.textContent = PHONE;
  });
  const tg = $('#tgLink');
  if (tg) tg.setAttribute('href', CONFIG.telegramUrl);
  const tgl = $('#tgLabel');
  if (tgl) tgl.textContent = CONFIG.telegramLabel;
  const ml = $('#mailLink');
  if (ml) ml.setAttribute('href', `mailto:${CONFIG.email}`);
  const mll = $('#mailLabel');
  if (mll) mll.textContent = CONFIG.email;
  const addr = $('#addrLabel');
  if (addr) addr.textContent = CONFIG.address[lang] || CONFIG.address.uz;
}

export function initSections() {
  renderStages();
  renderApps();
  initMacroLens();
  syncContact();
  document.addEventListener('langchange', () => {
    renderStages();
    renderApps();
    syncContact();
  });

  $('#copyPhone')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(PHONE);
      toast(t('misc.copied'));
    } catch (_) {
      toast(PHONE);
    }
  });
}
