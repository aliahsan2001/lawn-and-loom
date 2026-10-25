/* Cart & checkout: the lines in your bag, a summary with the free-delivery bar, and a short
   cash-on-delivery form. Every order arrives complete with size, address and phone number. */

import { CONFIG, product, rs, img, photo } from '../data.js';
import { esc, waLink } from '../core/ui.js';
import { REDUCED } from '../core/env.js';
import { gsap } from '../core/motion.js';
import { cart } from '../core/cart.js';
import { stitch } from '../core/touches.js';

export async function mount(root) {
  const q = (s) => root.querySelector(s);
  const form = q('[data-checkout]');

  function draw() {
    const items = cart.items;
    q('[data-empty]').hidden = items.length > 0;
    q('[data-summary]').hidden = items.length === 0 && q('[data-done]').hidden;
    q('[data-lines]').innerHTML = items.map((it) => {
      const p = product(it.id), c = p.colourways[it.cw], k = cart.keyOf(it);
      return `<div class="bag-line" data-k="${esc(k)}">
        <a href="/product?id=${p.id}&cw=${it.cw}" class="line-thumb" aria-label="${esc(p.name)}"><img src="${img(photo(p, it.cw), 640)}" alt="" loading="lazy"></a>
        <div>
          <p class="line-name"><a href="/product?id=${p.id}&cw=${it.cw}">${esc(p.name)}</a></p>
          <p class="line-meta">${esc(p.type)} · ${esc(c.name)}${it.size ? ` · Size ${esc(it.size)}` : ''}</p>
          <div class="line-ctrl">
            <div class="qty" aria-label="Quantity"><button type="button" data-step="-1" aria-label="One fewer">−</button><output>${it.qty}</output><button type="button" data-step="1" aria-label="One more">+</button></div>
            <button type="button" class="remove" data-remove>Remove</button>
          </div>
        </div>
        <p class="line-price">${rs(p.price * it.qty)}</p>
      </div>`;
    }).join('');
    const sub = cart.subtotal(), ship = cart.shipping();
    q('[data-rows]').innerHTML = `
      <div><dt>${cart.count()} ${cart.count() === 1 ? 'piece' : 'pieces'}</dt><dd>${rs(sub)}</dd></div>
      <div><dt>Delivery</dt><dd>${ship ? rs(ship) : 'Free'}</dd></div>
      <div class="sum-total"><dt>Total, cash on delivery</dt><dd>${rs(sub + ship)}</dd></div>`;
    const left = CONFIG.freeShippingOver - sub;
    q('[data-ship-note]').textContent = left > 0 ? `Add ${rs(left)} more for free delivery.` : 'Your delivery is free.';
    q('[data-ship-bar]').style.transform = `scaleX(${Math.min(1, sub / CONFIG.freeShippingOver).toFixed(3)})`;
  }

  q('[data-lines]').addEventListener('click', (e) => {
    const line = e.target.closest('[data-k]');
    if (!line) return;
    const k = line.dataset.k, it = cart.items.find((x) => cart.keyOf(x) === k);
    const step = e.target.closest('[data-step]');
    if (step) cart.setQty(k, Math.min(9, it.qty + Number(step.dataset.step)));
    if (e.target.closest('[data-remove]')) {
      if (REDUCED) cart.remove(k);
      else gsap.to(line, { opacity: 0, x: 30, duration: 0.4, onComplete: () => cart.remove(k) });
      setTimeout(() => cart.items.some((x) => cart.keyOf(x) === k) && cart.remove(k), 600);
    }
  });
  const off = cart.onChange(draw);

  /* ---------- checkout ---------- */
  const RULES = {
    name: (v) => (v.trim().length < 3 ? 'Please write your full name.' : ''),
    phone: (v) => (/^(\+?92|0)3\d{2}[\s-]?\d{7}$/.test(v.trim()) ? '' : 'Try a mobile like 03xx xxxxxxx, so the rider can call.'),
    address: (v) => (v.trim().length < 8 ? 'Add your house, street and area.' : ''),
  };
  const check = (n) => {
    const el = form.elements[n], msg = RULES[n](el.value);
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg) el.setAttribute('aria-describedby', `e-${n}`); else el.removeAttribute('aria-describedby');
    q(`#e-${n}`).textContent = msg;
    return msg;
  };
  form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid') === 'true') check(e.target.name); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!cart.items.length) return;
    const bad = Object.keys(RULES).filter((n) => check(n));
    if (bad.length) { form.elements[bad[0]].focus(); return; }
    const d = Object.fromEntries(new FormData(form));
    const order = 'LL-' + Math.random().toString(36).slice(2, 7).toUpperCase();
    const total = cart.subtotal() + cart.shipping();
    const lines = cart.items.map((it) => { const p = product(it.id); return `${it.qty} × ${p.name} (${p.colourways[it.cw].name}${it.size ? `, ${it.size}` : ''}) ${rs(p.price * it.qty)}`; });
    const msg = [`Order ${order}, Lawn & Loom`, ...lines, `Total (COD): ${rs(total)}`, `Name: ${d.name}`, `Mobile: ${d.phone}`, `Deliver to: ${d.address}, ${d.city}${d.postal ? ' ' + d.postal : ''}`].join('\n');
    stitch(form.querySelector('[type=submit]'), () => new Promise((res) => setTimeout(res, 400))).then(() => {
      const done = q('[data-done]');
      done.innerHTML = `
        <p class="label">Order placed</p>
        <h2 class="display">Thank you, <em>${esc(d.name.trim().split(' ')[0])}.</em></h2>
        <p class="order-no">${order}</p>
        <p>We'll call ${esc(d.phone)} to confirm, then your parcel leaves the studio within a day. Pay ${rs(total)} to the rider when it arrives in ${esc(d.city)}.</p>
        <a class="btn btn-ink" href="${waLink(msg)}" target="_blank" rel="noopener">Send the order on WhatsApp</a>
        <p class="label">A concept site: no order was placed and nothing was sent.</p>`;
      form.hidden = true;
      q('[data-rows]').closest('.summary').querySelector('.ship-note').parentElement.hidden = true;
      done.hidden = false;
      cart.clear();
      q('[data-summary]').hidden = false;
      q('[data-empty]').hidden = true;
      done.focus();
    });
  });

  draw();
  return () => off();
}
