/* Shop: the collection as folded fabric stacks down a cloth-market aisle; scroll to walk past
   them. A grid view is one click away (and the default on phones and lighter devices, where the
   aisle becomes a swipeable stack of cards). */

import barba from '@barba/core';
import { PRODUCTS, rs, img, photo } from '../data.js';
import { esc, idle } from '../core/ui.js';
import { LITE, REDUCED } from '../core/env.js';
import { ScrollTrigger, scrollToEl } from '../core/motion.js';
import { cardHTML, wireCards } from '../core/cards.js';

export async function mount(root, ctx) {
  const cleanups = [];
  const q = (s) => root.querySelector(s);
  const params = new URLSearchParams(location.search);
  let type = params.get('type') || '';
  const canAisle = !LITE && innerWidth >= 760;
  let view = 'grid'; // photos first; the 3D aisle is one click away

  /* ---------- filters + grid ---------- */
  const filters = q('[data-filters]');
  const opts = [['', 'Everything'], ['Unstitched', 'Unstitched'], ['Ready-to-wear', 'Ready-to-wear'], ['Dupatta', 'Dupattas']];
  filters.innerHTML = opts.map(([v, l]) => `<button type="button" class="chip-f" data-type="${v}" aria-pressed="${v === type}">${l}</button>`).join('');
  const grid = q('[data-grid]');
  const matches = (p) => !type || p.type.startsWith(type);
  function drawGrid() {
    const list = PRODUCTS.filter(matches);
    grid.innerHTML = list.map((p, i) => cardHTML(p, i)).join('');
    q('[data-empty]').hidden = list.length > 0;
    q('[data-piece-count]').textContent = `${list.length} ${list.length === 1 ? 'piece' : 'pieces'}${type ? `, ${type.toLowerCase()}` : ''}`;
    filters.querySelectorAll('[data-type]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.type === type)));
    ScrollTrigger.refresh();
  }
  cleanups.push(wireCards(grid, PRODUCTS));
  filters.addEventListener('click', (e) => {
    const b = e.target.closest('[data-type]');
    if (!b) return;
    type = b.dataset.type;
    history.replaceState(history.state, '', type ? `/shop?type=${encodeURIComponent(type)}` : '/shop');
    drawGrid();
    setView('grid');
  });

  /* ---------- aisle / grid ---------- */
  const aisleSec = q('[data-aisle]');
  function setView(v) {
    view = canAisle ? v : 'grid';
    root.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
    aisleSec.hidden = view !== 'aisle';
    root.classList.toggle('is-grid', view === 'grid');
    ScrollTrigger.refresh();
    if (v === 'aisle' && scrollY > 200) scrollToEl(aisleSec, 0);
  }
  root.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
  if (!canAisle) q('.view-toggle').hidden = true;

  if (canAisle) {
    const labels = q('[data-aisle-labels]');
    labels.innerHTML = PRODUCTS.map((p, i) => `<a class="a-label" href="/product?id=${p.id}" data-al="${i}"><img src="${img(photo(p), 640)}" alt="" loading="lazy"><span><b>${esc(p.name)}</b><small>${esc(p.type)} · ${rs(p.price)}</small></span></a>`).join('');
    const els = [...labels.children];
    aisleSec.style.height = `${100 + PRODUCTS.length * 55}vh`;
    let aisle = null;
    idle().then(async () => {
      if (!root.isConnected) return;
      try {
        const { mountAisle } = await import('../three/aisle.js');
        if (!root.isConnected) return;
        aisle = mountAisle(q('[data-aisle-canvas]'), {
          products: PRODUCTS,
          onPick: (i) => barba.go(`/product?id=${PRODUCTS[i].id}`),
          onHover: (i) => els.forEach((el, k) => el.classList.toggle('is-hover', k === i)),
        });
        aisle.onFrame((pts) => pts.forEach((pt, i) => {
          const el = els[i];
          const o = pt.behind ? 0 : Math.max(0, Math.min(1, (13 - pt.dist) / 6));
          el.style.opacity = o.toFixed(2);
          el.style.pointerEvents = o > 0.3 ? 'auto' : 'none';
          el.style.transform = `translate(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px) translate(-50%, -100%)`;
        }));
        cleanups.push(() => aisle.dispose());
        aisle.setProgress(ScrollTrigger.getById?.('aisle')?.progress || 0);
      } catch (err) {
        console.warn('Aisle unavailable, using the grid', err);
        setView('grid');
      }
    });
    if (!REDUCED) ctx.add(() => ScrollTrigger.create({ id: 'aisle', trigger: aisleSec, start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: (s) => aisle?.setProgress(s.progress) }));
  }

  drawGrid();
  setView(view);
  return () => cleanups.forEach((fn) => fn());
}
