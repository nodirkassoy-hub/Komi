/* PENAPLAST — scroll-reveal animations */
import { $$, reducedMotion } from './utils.js';

let io = null;

export function observeReveals(root = document) {
  const els = $$('.reveal:not(.in), .reveal-left:not(.in), .reveal-right:not(.in), .reveal-scale:not(.in)', root);
  if (reducedMotion()) {
    els.forEach((el) => el.classList.add('in'));
    return;
  }
  if (!io) {
    io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('in');
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );
  }
  els.forEach((el) => io.observe(el));
}

export function initReveals() {
  observeReveals();
  // Stagger grids
  $$('.why-grid, .apps-grid').forEach((grid) => {
    [...grid.children].forEach((c, i) => {
      c.style.transitionDelay = `${Math.min(i * 70, 420)}ms`;
    });
  });
}
