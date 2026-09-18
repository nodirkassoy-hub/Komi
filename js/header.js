/* PENAPLAST — header: sticky state, mobile menu, language, scroll-spy */
import { $, $$, lockScroll } from './utils.js';
import { setLang, currentLang } from './i18n.js';

export function initHeader() {
  const header = $('#siteHeader');
  const burger = $('#burgerBtn');
  const menu = $('#mobileMenu');
  const langWrap = $('#langWrap');
  const langBtn = $('#langBtn');
  const langMenu = $('#langMenu');
  const langCurrent = $('#langCurrent');

  // Sticky shadow
  const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu
  const setMenu = (open) => {
    menu?.classList.toggle('open', open);
    burger?.classList.toggle('open', open);
    burger?.setAttribute('aria-expanded', String(open));
    menu?.setAttribute('aria-hidden', String(!open));
    lockScroll(open);
  };
  burger?.addEventListener('click', () => setMenu(!menu?.classList.contains('open')));
  $$('.mm-nav a', menu || document).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  window.setMobileMenu = setMenu; // used by order modal trigger inside menu

  // Language dropdown
  const syncLang = () => {
    const l = currentLang();
    if (langCurrent) langCurrent.textContent = l.toUpperCase();
    $$('button[data-lang]', langMenu || document).forEach((b) =>
      b.classList.toggle('active', b.dataset.lang === l)
    );
  };
  langBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = langWrap?.classList.toggle('open');
    langBtn.setAttribute('aria-expanded', String(!!open));
  });
  $$('button[data-lang]', langMenu || document).forEach((b) =>
    b.addEventListener('click', () => {
      setLang(b.dataset.lang);
      syncLang();
      langWrap?.classList.remove('open');
    })
  );
  document.addEventListener('click', (e) => {
    if (!langWrap?.contains(e.target)) langWrap?.classList.remove('open');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      langWrap?.classList.remove('open');
      setMenu(false);
    }
  });
  syncLang();

  // Scroll-spy
  const links = $$('.main-nav .nav-link');
  const map = new Map(links.map((a) => [a.getAttribute('href')?.slice(1), a]));
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          links.forEach((a) => a.classList.remove('active'));
          map.get(en.target.id)?.classList.add('active');
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );
  ['home', 'products', 'production', 'experience', 'about', 'contact'].forEach((id) => {
    const s = document.getElementById(id);
    if (s) spy.observe(s);
  });
}
