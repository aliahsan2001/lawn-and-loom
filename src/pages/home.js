/* Home: a length of printed lawn hangs in a breeze and the pointer is the wind; pick a print and
   it re-dyes in place. Then a bolt of fabric unrolls as you scroll to reveal the new pieces. */

import { PRODUCTS, rs, img, photo } from '../data.js';
import { PRINT_NAMES, swatchURL } from '../core/prints.js';
import { esc, idle } from '../core/ui.js';
import { LITE, REDUCED } from '../core/env.js';
import { ScrollTrigger } from '../core/motion.js';
import { cardHTML, wireCards } from '../core/cards.js';

const PICKS = ['gulabi-bagh', 'tota-dupatta', 'kesar', 'sabz-bahar', 'shab', 'gulnar'].map((id) => PRODUCTS.find((p) => p.id === id));

export async function mount(root, ctx) {
  const cleanups = [];
  const q = (s) => root.querySelector(s);

  /* ---------- the hanging cloth ---------- */
  let cloth = null, pick = 0;
  const picker = q('[data-print-picker]');
  picker.innerHTML = PICKS.map((p, i) => `<button type="button" class="swatch-dot swatch-lg" data-pick="${i}" aria-pressed="${i === 0}" aria-label="${esc(PRINT_NAMES[p.print])}, ${esc(p.colourways[0].name)}" style="background-image:url(${swatchURL(p.print, p.colourways[0], 96)})"></button>`).join('');
  const now = q('[data-print-now]');
  const flat = q('[data-hero-flat]');
  function show(i) {
    pick = i;
    const p = PICKS[i];
    picker.querySelectorAll('[data-pick]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.pick) === i)));
    now.innerHTML = `<a href="/product?id=${p.id}">${esc(p.name)}</a> · ${esc(p.colourways[0].name)} · ${rs(p.price)}`;
    flat.style.backgroundImage = `url(${swatchURL(p.print, p.colourways[0], 320)})`;
    if (cloth) { cloth.setPrint(p.print); cloth.setColourway(p.colourways[0]); }
  }
  picker.addEventListener('click', (e) => { const b = e.target.closest('[data-pick]'); if (b) show(Number(b.dataset.pick)); });
  show(0);

  /* ---------- the bolt ---------- */
  const BOLT = PRODUCTS.find((p) => p.id === 'tota-dupatta');
  let bolt = null;
  const list = q('[data-unroll-list]');
  const NEW = ['gulnar', 'pista-chikan', 'neelam', 'phool-coord'].map((id) => PRODUCTS.find((p) => p.id === id));
  list.innerHTML = NEW.map((p) => `<li><a href="/product?id=${p.id}"><span class="u-swatch"><img src="${img(photo(p), 640)}" alt="" loading="lazy"></span><span class="u-name">${esc(p.name)}<small>${esc(p.type)}</small></span><span class="u-price">${rs(p.price)}</span></a></li>`).join('');
  const items = [...list.children];
  q('[data-bolt-flat]').style.backgroundImage = `url(${swatchURL(BOLT.print, BOLT.colourways[0], 320)})`;
  const applyUnroll = (p) => {
    bolt?.unroll(p);
    q('[data-bolt-flat]').style.clipPath = `inset(0 0 ${(1 - (0.12 + p * 0.88)) * 100}% 0)`;
    items.forEach((li, i) => li.classList.toggle('is-in', p > 0.18 + i * 0.17));
  };

  if (!LITE) {
    idle().then(async () => {
      if (!root.isConnected) return;
      try {
        const { mountCloth } = await import('../three/cloth.js');
        if (!root.isConnected) return;
        const small = innerWidth < 760;
        const p = PICKS[pick];
        cloth = mountCloth(q('[data-hero-cloth]'), { mode: 'flag', print: p.print, colourway: p.colourways[0], small, size: [4.6, 5.6], repeat: [2.2, 2.6] });
        bolt = mountCloth(q('[data-bolt]'), { mode: 'bolt', print: BOLT.print, colourway: BOLT.colourways[0], small, size: [4.4, 6.4], repeat: [2, 2.8] });
        root.classList.add('has-cloth');
        cleanups.push(() => { cloth.dispose(); bolt.dispose(); });
        applyUnroll(ScrollTrigger.getById?.('unroll')?.progress || 0);
      } catch (err) {
        console.warn('Cloth unavailable, showing flat prints', err);
        document.documentElement.classList.add('lite');
      }
    });
  }
  if (REDUCED) applyUnroll(1);
  else ctx.add(() => ScrollTrigger.create({ id: 'unroll', trigger: q('[data-unroll]'), start: 'top top', end: 'bottom bottom', scrub: 0.8, onUpdate: (s) => applyUnroll(s.progress) }));
  applyUnroll(0);

  /* ---------- collection ---------- */
  const grid = q('[data-home-grid]');
  grid.innerHTML = ['gulnar', 'gulabi-bagh', 'noor-kurta', 'neelam', 'ananya-set', 'shab'].map((id, i) => cardHTML(PRODUCTS.find((p) => p.id === id), i)).join('');
  cleanups.push(wireCards(grid, PRODUCTS));

  return () => cleanups.forEach((fn) => fn());
}
