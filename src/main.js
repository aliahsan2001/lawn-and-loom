/* Lawn & Loom — app shell.
   Header, footer, the paper bag and the fabric curtain persist; Barba swaps the page container
   underneath and each page module mounts and cleans up its own scene. */

import './styles/base.css';
import './styles/components.css';
import './styles/pages.css';

import barba from '@barba/core';
import { LITE } from './core/env.js';
import { gsap, ScrollTrigger, initSmoothScroll, resetScroll, reveals, counters, lockScroll, scrollToEl } from './core/motion.js';
import { cover, reveal } from './core/transition.js';
import { riseHeadings, sharpen } from './core/effects.js';
import { initHover } from './core/touches.js';
import { initBag, bagVisible } from './core/bag.js';
import { waLink } from './core/ui.js';
import { CONFIG } from './data.js';

const pages = {
  home: () => import('./pages/home.js'),
  shop: () => import('./pages/shop.js'),
  product: () => import('./pages/product.js'),
  cart: () => import('./pages/cart.js'),
  'size-guide': () => import('./pages/size.js'),
};

let current = { ctx: null, cleanup: null };

function setActiveNav(ns) {
  const type = new URLSearchParams(location.search).get('type') || '';
  const key = ns === 'shop' ? (type.startsWith('Unstitched') ? 'unstitched' : type === 'Ready-to-wear' ? 'rtw' : 'shop') : ns;
  document.querySelectorAll('[data-nav]').forEach((a) => {
    if (a.dataset.nav === key) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  bagVisible(ns !== 'cart');
}

function wireWhatsApp(root) {
  root.querySelectorAll('[data-wa-chat]').forEach((a) => (a.href = waLink(`Hello ${CONFIG.name}, I have a question about an order.`)));
}

async function mount(container) {
  if (!container) throw new Error('page container missing');
  const ns = container.dataset.barbaNamespace;
  setActiveNav(ns);
  wireWhatsApp(container);
  let cleanup = null;
  const ctx = gsap.context(() => {}, container);
  if (pages[ns]) {
    const mod = await pages[ns]();
    cleanup = await mod.mount(container, ctx);
  }
  ctx.add(() => {
    reveals(container);
    counters(container);
    riseHeadings(container);
    sharpen(container);
  });
  requestAnimationFrame(() => {
    ScrollTrigger.refresh();
    const target = location.hash && container.querySelector(location.hash);
    if (target) setTimeout(() => scrollToEl(target, -100), 300);
  });
  current = { ctx, cleanup };
}

function unmount() {
  try { current.cleanup?.(); } catch (err) { console.error('[loom] cleanup failed', err); }
  current.ctx?.revert();
  current = { ctx: null, cleanup: null };
}

function syncHead(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  document.title = doc.title;
  const desc = doc.querySelector('meta[name="description"]')?.content;
  if (desc) document.querySelector('meta[name="description"]')?.setAttribute('content', desc);
}

function initNav() {
  const toggle = document.querySelector('[data-menu-toggle]');
  const header = document.querySelector('[data-header]');
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.documentElement.classList.toggle('nav-open', open);
    lockScroll(open);
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  document.querySelector('[data-mobile-nav]').addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.documentElement.classList.contains('nav-open')) setOpen(false); });
  const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  return () => document.documentElement.classList.contains('nav-open') && setOpen(false);
}

function initNewsletter() {
  const f = document.querySelector('[data-newsletter]');
  f?.addEventListener('submit', (e) => {
    e.preventDefault();
    f.querySelector('[data-nl-note]').textContent = 'Thank you. The next print comes to you first. (A concept site: nothing was sent.)';
    f.reset();
  });
}

/* ---------- boot ---------- */
initSmoothScroll();
initHover();
const closeNav = initNav();
initNewsletter();
wireWhatsApp(document);
document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
document.documentElement.classList.add('js');
initBag();
if (LITE) console.info('Lawn & Loom: lite mode (lighter scenes, same content). Add ?full to force 3D.');

barba.init({
  preventRunning: true,
  timeout: 10000,
  // a slow or failed fetch of the next page: go there the ordinary way instead
  requestError: (trigger, action, url) => { if (action === 'click') location.href = url; return false; },
  prevent: ({ el }) => el.hasAttribute('data-no-barba'),
  transitions: [{
    name: 'curtain',
    once: ({ next }) => mount(next.container),
    async leave() {
      closeNav();
      await cover();
    },
    afterLeave: () => unmount(),
    enter({ next }) {
      syncHead(next.html);
      resetScroll();
    },
    async after({ next }) {
      try {
        await mount(next.container);
      } catch (err) {
        console.error('[loom] page mount failed, reloading', err);
        location.href = next.url.href;
        return;
      }
      // the new page settles gently into place as the curtain falls away
      const c = next.container;
      gsap.fromTo(c, { y: 28, opacity: 0.5 }, { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', clearProps: 'transform,opacity' });
      setTimeout(() => gsap.set(c, { clearProps: 'transform,opacity' }), 1600);
      await reveal();
    },
  }],
});
