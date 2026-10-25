/* Page transition: a sheet of printed fabric sweeps across the screen like a curtain, its leading
   edge rippling, then falls away downward with a soft billow. The print changes each time.
   Drawn on a 2D canvas; time-based, so it always finishes even if frames stall. */

import { REDUCED } from './env.js';
import { PRODUCTS } from '../data.js';
import { swatchURL } from './prints.js';

let canvas, g, dpr = 1, pattern = null, turn = 0;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function build() {
  canvas = document.createElement('canvas');
  canvas.className = 'curtain';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  g = canvas.getContext('2d');
}
function size() { dpr = Math.min(devicePixelRatio || 1, 2); canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr; }

function choosePrint() {
  const p = PRODUCTS[turn++ % PRODUCTS.length];
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => { pattern = g.createPattern(im, 'repeat'); resolve(); };
    im.onerror = () => { pattern = null; resolve(); };
    im.src = swatchURL(p.print, p.colourways[0], 320);
    setTimeout(resolve, 120); // don't wait long for it
  });
}

// draw the sheet: x is its leading edge (it covers from x to the right edge), y drops it
function sheet(x, drop, time) {
  const w = innerWidth, h = innerHeight;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);
  const top = drop * (h + 120);
  g.save();
  g.beginPath();
  // leading edge: a soft wave, as cloth moving through air
  const amp = 28 * (1 - Math.abs(drop - 0.5) * 2 * (drop > 0 ? 1 : 0));
  g.moveTo(w + 20, top - 40);
  for (let y = -40; y <= h + 40; y += 12) {
    const yy = top + y + Math.sin(y / 140 + time * 8) * 6 * drop;
    g.lineTo(x + Math.sin(y / 120 + time * 9) * amp + Math.sin(y / 47 + time * 5) * amp * 0.25, yy);
  }
  g.lineTo(w + 20, top + h + 40);
  g.closePath();
  g.fillStyle = '#f2eee4';
  g.fill();
  if (pattern) {
    g.save();
    g.clip();
    g.translate(x * 0.2, top);
    g.fillStyle = pattern;
    g.fillRect(-w, -h, w * 3, h * 3);
    g.restore();
  }
  // a fold shadow along the leading edge gives it body
  const sh = g.createLinearGradient(x - 30, 0, x + 70, 0);
  sh.addColorStop(0, 'rgba(0,0,0,0)');
  sh.addColorStop(0.35, 'rgba(0,0,0,.22)');
  sh.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = sh;
  g.fill();
  g.restore();
}

function animate(duration, fn) {
  return new Promise((resolve) => {
    const start = performance.now();
    let done = false;
    const finish = () => { if (!done) { done = true; fn(1, duration / 1000); resolve(); } };
    const tick = (now) => {
      if (done) return;
      const p = Math.min(1, (now - start) / duration);
      fn(p, (now - start) / 1000);
      if (p < 1) requestAnimationFrame(tick); else finish();
    };
    requestAnimationFrame(tick);
    setTimeout(finish, duration + 300); // never hang if frames stall
  });
}

export async function cover() {
  if (!canvas) build();
  size();
  await choosePrint();
  canvas.classList.add('is-active');
  if (REDUCED) return animate(200, () => sheet(-60, 0, 0));
  return animate(620, (p, t) => sheet(innerWidth + 80 - (innerWidth + 160) * ease(p), 0, t));
}

export function reveal() {
  if (REDUCED) return animate(200, () => g.clearRect(0, 0, innerWidth, innerHeight)).then(() => canvas.classList.remove('is-active'));
  return animate(700, (p, t) => sheet(-80, ease(p) * 1.02, t)).then(() => canvas.classList.remove('is-active'));
}
