/* The bag: what's in it lives in localStorage and every change is announced, so the header count,
   the paper bag and the cart page all stay in step. */

import { product, CONFIG } from '../data.js';
import { store } from './ui.js';

const KEY = 'll-bag';
const listeners = new Set();
// keep only items that still exist (an older visit may have stored pieces since retired)
let items = (store.get(KEY, []) || []).filter((it) => { const p = product(it?.id); return p && p.colourways[it.cw] && it.qty > 0; });

const keyOf = (it) => `${it.id}|${it.cw}|${it.size || ''}`;
const save = () => { store.set(KEY, items); listeners.forEach((fn) => fn(items)); };

export const cart = {
  get items() { return items; },
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  add(it) {
    const found = items.find((x) => keyOf(x) === keyOf(it));
    if (found) found.qty += it.qty || 1;
    else items.push({ ...it, qty: it.qty || 1 });
    save();
  },
  setQty(k, qty) {
    items = items.map((x) => (keyOf(x) === k ? { ...x, qty } : x)).filter((x) => x.qty > 0);
    save();
  },
  remove(k) { items = items.filter((x) => keyOf(x) !== k); save(); },
  clear() { items = []; save(); },
  keyOf,
  count: () => items.reduce((n, x) => n + x.qty, 0),
  subtotal: () => items.reduce((n, x) => n + (product(x.id)?.price || 0) * x.qty, 0),
  shipping() { const s = cart.subtotal(); return s === 0 || s >= CONFIG.freeShippingOver ? 0 : CONFIG.shipping; },
};
