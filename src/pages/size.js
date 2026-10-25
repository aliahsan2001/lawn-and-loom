/* Size guide: pull a measuring tape across the screen. The chart highlights each size as the tape
   passes it and settles on the one that fits. Keyboard and screen readers get a proper slider. */

import { SIZES } from '../data.js';
import { REDUCED } from '../core/env.js';

const MIN = 20, MAX = 50;

export async function mount(root) {
  const q = (s) => root.querySelector(s);
  const zone = q('[data-tape-zone]'), track = q('[data-track]'), tape = q('[data-tape]'), tab = q('[data-tab]'), marks = q('[data-marks]');
  let measure = 'bust', inches = MIN;

  /* ---------- the chart ---------- */
  const table = q('[data-table]');
  const ROWS = [['bust', 'Bust'], ['waist', 'Waist'], ['hip', 'Hip']];
  table.innerHTML = `<thead><tr><th scope="col"><span class="sr-only">Measurement</span></th>${SIZES.map((s) => `<th scope="col" data-col="${s.size}">${s.size}</th>`).join('')}</tr></thead>
    <tbody>${ROWS.map(([k, l]) => `<tr data-row="${k}"><th scope="row">${l}</th>${SIZES.map((s) => `<td data-col="${s.size}">${s[k]}</td>`).join('')}</tr>`).join('')}</tbody>`;

  /* ---------- the tape ---------- */
  let px = 14; // pixels per inch, set by layout
  const start = () => (innerWidth < 760 ? 70 : 96);
  function layout() {
    const w = track.clientWidth - start() - 30;
    px = w / (MAX - 0 + 2);
    // marks every inch, numbers every two
    let html = '';
    for (let i = 0; i <= MAX + 2; i++) {
      const x = (i + 0.5) * px;
      html += `<i style="left:${x}px;height:${i % 5 === 0 ? 18 : i % 1 === 0 ? 10 : 6}px"></i>`;
      if (i > 0 && i % (px < 11 ? 5 : 2) === 0) html += `<b style="left:${x}px">${i}</b>`;
    }
    marks.style.width = `${(MAX + 3) * px}px`;
    marks.innerHTML = html;
    set(inches, false);
  }

  function fit(n) {
    // the smallest size whose measurement is at least the tape's
    const s = SIZES.find((x) => x[measure] >= n - 0.5);
    return n > SIZES[SIZES.length - 1][measure] + 1.5 ? null : s || null;
  }

  function set(n, user = true) {
    inches = Math.max(MIN, Math.min(MAX, n));
    const len = (inches + 0.5) * px;
    tape.style.setProperty('--len', `${len}px`);
    tab.style.left = `${start() + len}px`;
    q('[data-pull]').style.left = `${start() + len + 30}px`;
    tab.setAttribute('aria-valuenow', inches.toFixed(0));
    q('[data-read-in]').textContent = `${inches.toFixed(1).replace('.0', '')}″`;
    const s = fit(inches);
    root.querySelectorAll('tr[data-row]').forEach((tr) => tr.classList.toggle('is-measuring', tr.dataset.row === measure));
    SIZES.forEach((x) => {
      const cells = table.querySelectorAll(`[data-col="${x.size}"]`);
      const passed = x[measure] < inches - 0.5;
      cells.forEach((c) => { c.classList.toggle('is-passed', passed); c.classList.toggle('is-match', !!s && s.size === x.size); });
    });
    q('[data-read-txt]').innerHTML = inches <= MIN + 0.1 && !user ? 'Drag the metal tab, or use the arrow keys.' : s ? `Your ${measure}: size <em>${s.size}</em>` : `Your ${measure} is past XL. <a href="https://wa.me/" target="_blank" rel="noopener">Message us</a> about a custom fit.`;
    if (user) zone.classList.add('is-pulled');
  }

  let drag = null;
  tab.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, n: inches }; tab.setPointerCapture(e.pointerId); });
  tab.addEventListener('pointermove', (e) => { if (drag) set(drag.n + (e.clientX - drag.x) / px); });
  const end = () => { if (!drag) return; drag = null; set(Math.round(inches * 2) / 2); };
  tab.addEventListener('pointerup', end);
  tab.addEventListener('pointercancel', end);
  tab.addEventListener('keydown', (e) => {
    const d = { ArrowRight: 0.5, ArrowUp: 0.5, ArrowLeft: -0.5, ArrowDown: -0.5, PageUp: 2, PageDown: -2 }[e.key];
    if (d) { e.preventDefault(); set(inches + d); }
    if (e.key === 'Home') set(MIN);
    if (e.key === 'End') set(MAX);
  });
  q('[data-measure]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-m]');
    if (!b) return;
    measure = b.dataset.m;
    q('[data-measure]').querySelectorAll('[data-m]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    set(inches);
  });

  const ro = new ResizeObserver(layout);
  ro.observe(track);
  layout();
  // a small tug on arrival, so it's clear the tape pulls
  if (!REDUCED) { setTimeout(() => { if (!zone.classList.contains('is-pulled')) { tape.style.transition = tab.style.transition = 'width .7s cubic-bezier(.22,1,.36,1), left .7s cubic-bezier(.22,1,.36,1)'; set(24, false); setTimeout(() => { set(MIN, false); setTimeout(() => (tape.style.transition = tab.style.transition = ''), 800); }, 800); } }, 900); }
  return () => ro.disconnect();
}
