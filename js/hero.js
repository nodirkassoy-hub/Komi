/* PENAPLAST — hero: cinematic crossfade + floating foam-dust particles */
import { $, reducedMotion } from './utils.js';

export function initHero() {
  // Image crossfade
  const imgs = $$('.hero-media img');
  if (imgs.length > 1 && !reducedMotion()) {
    let i = 0;
    setInterval(() => {
      imgs[i].classList.remove('active');
      i = (i + 1) % imgs.length;
      imgs[i].classList.add('active');
    }, 7000);
  }

  // Foam dust particles
  const canvas = $('#heroParticles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let w = 0;
  let h = 0;
  let dpr = 1;
  let parts = [];
  let running = true;
  let raf = 0;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, r.width);
    h = Math.max(1, r.height);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  };

  const seed = () => {
    const n = w < 640 ? 34 : 70;
    parts = Array.from({ length: n }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.8 + Math.random() * 2.6,
      s: 0.12 + Math.random() * 0.5, // rise speed
      sway: Math.random() * Math.PI * 2,
      swayS: 0.004 + Math.random() * 0.012,
      a: 0.12 + Math.random() * 0.5,
      blue: Math.random() < 0.35,
    }));
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.sway += p.swayS;
      p.y -= p.s;
      p.x += Math.sin(p.sway) * 0.25;
      if (p.y < -8) {
        p.y = h + 8;
        p.x = Math.random() * w;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.blue
        ? `rgba(110,231,255,${p.a})`
        : `rgba(235,242,255,${p.a})`;
      ctx.fill();
    }
    if (running && !reducedMotion()) raf = requestAnimationFrame(draw);
  };

  new IntersectionObserver(
    (en) => {
      const vis = en[0].isIntersecting && !document.hidden;
      if (vis && !running) {
        running = true;
        draw();
      } else if (!vis) {
        running = false;
        cancelAnimationFrame(raf);
      }
    },
    { threshold: 0.02 }
  ).observe(canvas);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else {
      running = true;
      draw();
    }
  });

  window.addEventListener('resize', resize);
  resize();
  draw();
}

// local $$ helper (avoids circular import weight)
function $$(s, r = document) {
  return [...r.querySelectorAll(s)];
}
