/* Small touches. Photos lean gently toward the cursor as it moves over them: a slow, GPU-only
   transform (no filters, so images never blur or pixelate). The "Add to bag" button stitches a
   thread around itself while it works. */

import { FINE, REDUCED } from './env.js';

export function initHover() {
  if (!FINE || REDUCED) return;
  let current = null;
  addEventListener('pointermove', (e) => {
    const el = e.target.closest?.('.hover-img');
    if (el !== current) { current?.style.removeProperty('--mx'); current?.style.removeProperty('--my'); current = el; }
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (((e.clientX - r.left) / r.width) - 0.5).toFixed(3));
    el.style.setProperty('--my', (((e.clientY - r.top) / r.height) - 0.5).toFixed(3));
  }, { passive: true });
}

// wraps a button's work in the stitching animation; resolves when both are done
export function stitch(btn, work) {
  if (!btn.querySelector('.stitch')) btn.insertAdjacentHTML('beforeend', '<svg class="stitch" aria-hidden="true"><rect x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)" rx="2"/></svg>');
  const rect = btn.querySelector('.stitch rect');
  const r = btn.getBoundingClientRect();
  rect.setAttribute('width', r.width + 10);
  rect.setAttribute('height', r.height + 10);
  btn.classList.add('btn-stitch', 'is-stitching');
  btn.disabled = true;
  const label = btn.querySelector('[data-label]');
  const was = label?.textContent;
  if (label) label.textContent = 'Stitching…';
  return Promise.all([work(), new Promise((res) => setTimeout(res, REDUCED ? 0 : 820))]).then(() => {
    btn.classList.remove('is-stitching');
    btn.disabled = false;
    if (label) { label.textContent = 'Added'; setTimeout(() => (label.textContent = was), 1600); }
  });
}
