/* PENAPLAST — order modal: prefill, validation, future CRM-ready submit */
import { $, esc, lockScroll } from './utils.js';
import { t } from './i18n.js';
import { PRODUCTS, DENSITIES, THICKNESSES, CONFIG } from './data.js';

/* ------------------------------------------------------------------
   sendOrder — integration-ready stub.
   - Always resolves locally (shows the "accepted" state).
   - If CONFIG.integrations provides a Telegram bot or API endpoint,
     the payload is ALSO forwarded there (fire-and-forget, logged).
------------------------------------------------------------------- */
async function sendOrder(payload) {
  console.info('[PENAPLAST] order payload:', payload);
  const { telegramBotToken, telegramChatId, apiEndpoint } = CONFIG.integrations;
  const jobs = [];

  if (telegramBotToken && telegramChatId) {
    const text =
      `🧊 *Yangi buyurtma / Новая заявка*\n` +
      `👤 ${payload.name}\n📞 ${payload.phone}\n` +
      `📦 ${payload.productName}\n` +
      (payload.density ? `⚖️ ${payload.density}\n` : '') +
      (payload.thickness ? `📐 ${payload.thickness}\n` : '') +
      (payload.qty ? `🔢 ${payload.qty} ${payload.qtyUnit}\n` : '') +
      (payload.comment ? `💬 ${payload.comment}` : '');
    jobs.push(
      fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: telegramChatId, text, parse_mode: 'Markdown' }),
      }).catch((e) => console.warn('Telegram forward failed:', e))
    );
  }
  if (apiEndpoint) {
    jobs.push(
      fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, source: 'penaplast-website', at: new Date().toISOString() }),
      }).catch((e) => console.warn('API forward failed:', e))
    );
  }
  if (jobs.length) await Promise.allSettled(jobs);
  return { ok: true };
}

function fillProductOptions(selected) {
  $('#oProduct').innerHTML = PRODUCTS.map(
    (p) => `<option value="${p.id}"${p.id === selected ? ' selected' : ''}>${esc(t(`prod.${p.id}.name`))}</option>`
  ).join('');
}

function syncProductFields() {
  const id = $('#oProduct').value;
  const p = PRODUCTS.find((x) => x.id === id);
  const isSheet = p?.kind === 'sheet';
  const dSel = $('#oDensity');
  const tSel = $('#oThickness');

  dSel.disabled = !isSheet;
  tSel.disabled = !isSheet;
  dSel.innerHTML = isSheet
    ? DENSITIES.map((d) => `<option value="${d.v}">${d.v} ${esc(t('misc.kgm'))} — $${d.p}</option>`).join('')
    : `<option>${esc(t('order.na'))}</option>`;
  tSel.innerHTML = isSheet
    ? THICKNESSES.map((v) => `<option value="${v}">${v} ${esc(t('misc.cm'))}</option>`).join('')
    : `<option>${esc(t('order.na'))}</option>`;
  $('#oQtyUnit').value = isSheet ? 'm³' : 'kg';
  return { id, isSheet };
}

export function openOrder(pre = {}) {
  window.setMobileMenu?.(false);
  $('#orderFormWrap').style.display = '';
  $('#orderSuccess').classList.remove('show');

  fillProductOptions(pre.product || 'white');
  const { isSheet } = syncProductFields();
  if (isSheet) {
    if (pre.d && DENSITIES.some((d) => d.v === pre.d)) $('#oDensity').value = String(pre.d);
    if (pre.t && THICKNESSES.includes(pre.t)) $('#oThickness').value = String(pre.t);
  }

  $('#orderModal')?.classList.add('open');
  $('#orderModal')?.setAttribute('aria-hidden', 'false');
  lockScroll(true);
  setTimeout(() => $('#oName')?.focus(), 120);
}

export function closeOrder() {
  $('#orderModal')?.classList.remove('open');
  $('#orderModal')?.setAttribute('aria-hidden', 'true');
  lockScroll(false);
}

const digits = (s) => (s || '').replace(/\D/g, '');

export function initOrder() {
  // Any [data-order] button opens the modal
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-order]')) openOrder();
  });

  fillProductOptions('white');
  syncProductFields();
  $('#oProduct')?.addEventListener('change', syncProductFields);

  document.querySelectorAll('[data-close-order]').forEach((el) =>
    el.addEventListener('click', closeOrder)
  );
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('#orderModal')?.classList.contains('open')) closeOrder();
  });
  $('#orderAgain')?.addEventListener('click', () => {
    $('#orderForm')?.reset();
    syncProductFields();
    $('#orderFormWrap').style.display = '';
    $('#orderSuccess').classList.remove('show');
  });
  document.addEventListener('langchange', () => {
    const cur = $('#oProduct')?.value || 'white';
    fillProductOptions(cur);
    syncProductFields();
  });

  $('#orderForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('#oName').value.trim();
    const phone = $('#oPhone').value.trim();
    const okName = name.length >= 2;
    const okPhone = digits(phone).length >= 9 && digits(phone).length <= 15;

    $('#oName').classList.toggle('err', !okName);
    $('#oPhone').classList.toggle('err', !okPhone);
    $('#eName').classList.toggle('show', !okName);
    $('#ePhone').classList.toggle('show', !okPhone);
    if (!okName || !okPhone) return;

    const btn = e.target.querySelector('[type="submit"]');
    btn.disabled = true;
    try {
      const pid = $('#oProduct').value;
      const p = PRODUCTS.find((x) => x.id === pid);
      await sendOrder({
        name,
        phone,
        product: pid,
        productName: t(`prod.${pid}.name`),
        density: p.kind === 'sheet' ? `${$('#oDensity').value} kg/m³` : null,
        thickness: p.kind === 'sheet' ? `${$('#oThickness').value} cm` : null,
        qty: $('#oQty').value || null,
        qtyUnit: $('#oQtyUnit').value,
        comment: $('#oComment').value.trim() || null,
        lang: document.documentElement.lang,
      });
      $('#orderFormWrap').style.display = 'none';
      $('#orderSuccess').classList.add('show');
    } finally {
      btn.disabled = false;
    }
  });

  // clear error state while typing
  $('#oName')?.addEventListener('input', (e) => {
    e.target.classList.remove('err');
    $('#eName').classList.remove('show');
  });
  $('#oPhone')?.addEventListener('input', (e) => {
    e.target.classList.remove('err');
    $('#ePhone').classList.remove('show');
  });
}
