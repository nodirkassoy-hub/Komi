/* PENAPLAST — dark / light theme (persisted) */
import { $ } from './utils.js';

export function initTheme() {
  const btn = $('#themeBtn');
  if (!btn) return;
  const sun = btn.querySelector('.i-sun');
  const moon = btn.querySelector('.i-moon');

  const sync = () => {
    const light = document.documentElement.dataset.theme === 'light';
    if (sun) sun.hidden = light ? false : true; // dark mode -> show sun (go light)
    if (moon) moon.hidden = light ? true : false;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', light ? '#f7f9fd' : '#04060b');
  };

  btn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('penaplast-theme', next);
    } catch (_) {
      /* ignore */
    }
    sync();
  });

  sync();
}
