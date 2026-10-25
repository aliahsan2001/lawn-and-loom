/* Product: photographs of the chosen colourway, with a last view that lets you feel the fabric:
   drag to turn a draped 3D swatch, and look closely at the weave. "Add to bag" stitches itself
   while a folded piece of the cloth drops into the paper bag. */

import { PRODUCTS, SIZES, CONFIG, product, rs, img } from '../data.js';
import { swatchURL } from '../core/prints.js';
import { esc, idle } from '../core/ui.js';
import { LITE, FINE, REDUCED } from '../core/env.js';
import { gsap } from '../core/motion.js';
import { cart } from '../core/cart.js';
import { dropIn } from '../core/bag.js';
import { stitch } from '../core/touches.js';
import { cardHTML, wireCards } from '../core/cards.js';

export async function mount(root) {
  const cleanups = [];
  const q = (s) => root.querySelector(s);
  const params = new URLSearchParams(location.search);
  const p = product(params.get('id')) || PRODUCTS[0];
  let cw = Math.min(p.colourways.length - 1, Number(params.get('cw')) || 0), size = '', qty = 1, view = 0;
  document.title = `${p.name} · Lawn & Loom`;

  /* ---------- details ---------- */
  q('[data-info]').innerHTML = `
    <div>
      <p class="eyebrow"><a href="/shop?type=${encodeURIComponent(p.type.split(' ')[0])}">${esc(p.type)}</a> · ${esc(p.line)}</p>
      <h1 class="display">${esc(p.name)}</h1>
    </div>
    <div class="pd-meta"><span class="pd-price">${rs(p.price)}</span><span class="pd-type">Cash on delivery · free over ${rs(CONFIG.freeShippingOver)}</span></div>
    <p class="pd-blurb">${esc(p.blurb)}</p>
    <div class="opt-row">
      <div class="opt-row-head"><span class="label">Colour · <b data-cw-name>${esc(p.colourways[cw].name)}</b></span></div>
      ${p.colourways.length > 1 ? `<div class="cw-row" role="group" aria-label="Colourway">${p.colourways.map((c, k) => `<button type="button" class="swatch-dot" data-cw="${k}" aria-pressed="${k === cw}" aria-label="${esc(c.name)}" style="background-image:url(${img(c.photos[0], 640)})"></button>`).join('')}</div>` : ''}
    </div>
    ${p.sizes ? `<div class="opt-row">
      <div class="opt-row-head"><span class="label">Size</span><a href="/size-guide">Find your size</a></div>
      <div class="size-row" role="group" aria-label="Size">${SIZES.map((s) => `<button type="button" class="size-btn" data-size="${s.size}" aria-pressed="false">${s.size}</button>`).join('')}</div>
      <p class="size-error" data-size-error aria-live="polite"></p>
    </div>` : ''}
    <div class="buy-row">
      <div class="qty" aria-label="Quantity"><button type="button" data-qty="-1" aria-label="One fewer">−</button><output data-qty-out>1</output><button type="button" data-qty="1" aria-label="One more">+</button></div>
      <button type="button" class="btn btn-ink" data-add><span data-label>Add to bag</span></button>
    </div>
    <div class="pd-details">
      <details open><summary>What's in it</summary><ul>${p.fabric.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></details>
      <details><summary>Care</summary><p>Hand or gentle machine wash in cold water, inside out. Dry in the shade so the colours stay bright. Iron while slightly damp${p.line === 'Embroidered' ? ', on the reverse of the embroidery' : ''}.</p></details>
      <details><summary>Delivery &amp; returns</summary><p>Cash on delivery anywhere in Pakistan: 2–3 days to Lahore, Karachi and Islamabad, 3–5 elsewhere. Unworn pieces can be exchanged within 7 days.</p></details>
    </div>`;

  /* ---------- photographs + the fabric view ---------- */
  const photosBox = q('[data-photos]'), fabricBox = q('[data-fabric]'), thumbs = q('[data-thumbs]');
  function drawMedia() {
    const ph = p.colourways[cw].photos;
    photosBox.innerHTML = ph.map((id, k) => `<img class="pd-photo${k === 0 ? ' is-on' : ''}" data-ph="${k}" src="${img(id, 1280)}" srcset="${img(id, 640)} 640w, ${img(id, 1280)} 1280w" sizes="(max-width: 1000px) 92vw, 52vw" alt="${esc(p.name)} in ${esc(p.colourways[cw].name)}${k ? ', another view' : ''}" decoding="async" onload="this.classList.add('is-loaded')">`).join('');
    thumbs.innerHTML = ph.map((id, k) => `<button type="button" class="pd-thumb" data-view="${k}" aria-pressed="${k === 0}" aria-label="Photo ${k + 1}"><img src="${img(id, 640)}" alt="" loading="lazy"></button>`).join('')
      + `<button type="button" class="pd-thumb pd-thumb-fabric" data-view="fabric" aria-pressed="false" aria-label="Feel the fabric in 3D"><span style="background-image:url(${swatchURL(p.print, p.colourways[cw], 128)})"></span><small>Feel it</small></button>`;
    show(view === 'fabric' ? 'fabric' : 0, true);
  }
  function show(v, instant = false) {
    view = v;
    thumbs.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === String(v))));
    const fab = v === 'fabric';
    fabricBox.hidden = !fab;
    photosBox.hidden = fab;
    if (fab) { ensureDrape(); return; }
    photosBox.querySelectorAll('[data-ph]').forEach((im) => im.classList.toggle('is-on', Number(im.dataset.ph) === v));
    if (!instant && !REDUCED) gsap.fromTo(photosBox.querySelector('.is-on'), { scale: 1.04 }, { scale: 1, duration: 1.2, ease: 'expo.out' });
  }
  thumbs.addEventListener('click', (e) => { const b = e.target.closest('[data-view]'); if (b) show(b.dataset.view === 'fabric' ? 'fabric' : Number(b.dataset.view)); });

  let drape = null;
  const flat = q('[data-flat]'), loupe = q('[data-loupe]');
  function ensureDrape() {
    const url = swatchURL(p.print, p.colourways[cw], 512);
    flat.style.backgroundImage = loupe.style.backgroundImage = `url(${url})`;
    if (drape || LITE) { drape?.setColourway(p.colourways[cw]); return; }
    idle().then(async () => {
      if (!root.isConnected || drape) return;
      try {
        const { mountCloth } = await import('../three/cloth.js');
        if (!root.isConnected) return;
        drape = mountCloth(q('[data-drape]'), { mode: 'drape', print: p.print, colourway: p.colourways[cw], small: innerWidth < 760, size: [2.6, 3.8], repeat: [1.4, 2] });
        cleanups.push(() => drape.dispose());
      } catch (err) {
        console.warn('Swatch unavailable, showing it flat', err);
        document.documentElement.classList.add('lite');
      }
    });
  }

  q('[data-info]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cw]');
    if (b && Number(b.dataset.cw) !== cw) {
      cw = Number(b.dataset.cw);
      q('[data-cw-name]').textContent = p.colourways[cw].name;
      root.querySelectorAll('[data-cw]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      history.replaceState(history.state, '', `/product?id=${p.id}&cw=${cw}`);
      drawMedia();
      if (view === 'fabric') ensureDrape();
    }
    const s = e.target.closest('[data-size]');
    if (s) { size = s.dataset.size; root.querySelectorAll('[data-size]').forEach((x) => x.setAttribute('aria-pressed', String(x === s))); q('[data-size-error]').textContent = ''; }
    const d = e.target.closest('[data-qty]');
    if (d) { qty = Math.max(1, Math.min(9, qty + Number(d.dataset.qty))); q('[data-qty-out]').textContent = qty; }
  });

  /* ---------- the weave, up close ---------- */
  const zoomBtn = q('[data-zoom]');
  let zoomOn = false;
  zoomBtn.addEventListener('click', () => { zoomOn = !zoomOn; loupe.classList.toggle('is-on', zoomOn); zoomBtn.setAttribute('aria-pressed', String(zoomOn)); zoomBtn.textContent = zoomOn ? 'Close up' : 'Look closer'; });
  if (FINE) fabricBox.addEventListener('pointermove', (e) => {
    if (!zoomOn) return;
    const r = fabricBox.getBoundingClientRect();
    loupe.style.backgroundPosition = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
  });

  /* ---------- add to bag ---------- */
  const add = q('[data-add]');
  add.addEventListener('click', () => {
    if (p.sizes && !size) { q('[data-size-error]').textContent = 'Choose a size first. Not sure? The size guide takes a minute.'; return; }
    const it = { id: p.id, cw, size: p.sizes ? size : '', qty };
    stitch(add, () => new Promise((res) => setTimeout(() => {
      cart.add(it);
      dropIn(it, q('[data-stage]'));
      const link = document.querySelector('[data-bag-link]');
      link?.classList.add('is-bump');
      setTimeout(() => link?.classList.remove('is-bump'), 500);
      res();
    }, 450)));
  });

  /* ---------- more ---------- */
  const more = PRODUCTS.filter((x) => x.id !== p.id && (x.type === p.type || x.line === p.line)).slice(0, 3);
  q('[data-more]').innerHTML = more.map(cardHTML).join('');
  cleanups.push(wireCards(q('[data-more]'), PRODUCTS));

  drawMedia();
  return () => cleanups.forEach((fn) => fn());
}
