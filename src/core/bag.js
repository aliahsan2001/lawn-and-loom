/* The paper shopping bag, bottom right. It hangs from its handles on a Matter.js constraint, so
   it sways when something lands in it. Each item is a folded piece of its own print. The tag shows
   the running total; a tug on the handles opens checkout. dropIn() runs the add-to-bag moment:
   the piece folds itself neatly, flies to the bag and falls in. */

import Matter from 'matter-js';
import barba from '@barba/core';
import { product, rs } from '../data.js';
import { fabricCrop } from './photocrop.js';
import { photo } from '../data.js';
import { cart } from './cart.js';
import { REDUCED } from './env.js';
import { gsap } from './motion.js';

const { Engine, Bodies, Body, Composite, Constraint } = Matter;

let dock, canvas, g, engine, bag, anchor, W, H, dpr, raf = 0, idleFrames = 0;
const pieces = [];
const images = new Map();

function pieceImage(it) {
  const p = product(it.id);
  const key = `${it.id}|${it.cw}`;
  if (!images.has(key)) { const im = new Image(); fabricCrop(photo(p, it.cw), 128).then((u) => { if (u) { im.src = u; im.onload = kick; } }); images.set(key, im); }
  return images.get(key);
}

function addPiece(it, fromTop = true) {
  const w = 50 + Math.random() * 18, h = 11 + Math.random() * 4;
  const rimY = bag.position.y - bag.size.h / 2;
  const b = Bodies.rectangle(bag.position.x + (Math.random() - 0.5) * 16, fromTop ? rimY - 60 : rimY - 10 - pieces.length * 12, w, h, { chamfer: { radius: 4 }, friction: 0.8, restitution: 0.05, density: 0.002 });
  Body.setAngle(b, (Math.random() - 0.5) * 0.3);
  b.img = pieceImage(it);
  b.pw = w; b.ph = h;
  pieces.push(b);
  Composite.add(engine.world, b);
  kick();
}

function build() {
  dock = document.querySelector('[data-bag-dock]');
  canvas = dock.querySelector('[data-bag-canvas]');
  g = canvas.getContext('2d');
  W = dock.clientWidth; H = dock.clientHeight;
  dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = W * dpr; canvas.height = H * dpr;
  engine = Engine.create({ gravity: { y: 1 } });
  // the bag: an open box of three walls, hung from a point above by two handle cords
  const bw = W * 0.62, bh = W * 0.74, cx = W / 2, cy = H - bh / 2 - 6;
  // the walls rise well above the rim and the floor sits just under it (the bag is packed with
  // tissue), so folded pieces settle peeking out of the top
  const wall = { friction: 0.9 };
  const top = cy - bh / 2;
  const left = Bodies.rectangle(cx - bw / 2 + 3, top - 10, 6, 100, wall);
  const right = Bodies.rectangle(cx + bw / 2 - 3, top - 10, 6, 100, wall);
  const bottom = Bodies.rectangle(cx, top + 30, bw, 8, wall);
  const body = Bodies.rectangle(cx, cy + 10, bw, bh - 20, { ...wall, isSensor: true });
  bag = Body.create({ parts: [left, right, bottom, body], frictionAir: 0.04 });
  Body.setCentre(bag, { x: cx, y: cy }, false);
  bag.size = { w: bw, h: bh };
  anchor = { x: cx, y: cy - bh / 2 - 46 };
  const cord = (dx) => Constraint.create({ pointA: { x: anchor.x + dx, y: anchor.y }, bodyB: bag, pointB: { x: dx * 1.6, y: -bh / 2 }, stiffness: 0.9, damping: 0.08, length: 46 });
  Composite.add(engine.world, [bag, cord(-14), cord(14)]);
  const hit = document.createElement('button');
  hit.className = 'bag-hit';
  hit.setAttribute('aria-label', 'Open your bag');
  hit.addEventListener('click', tug);
  dock.appendChild(hit);
  dock.removeAttribute('aria-hidden');
  cart.items.forEach((it) => { for (let i = 0; i < Math.min(it.qty, 3); i++) addPiece(it, false); });
  sync();
  cart.onChange(sync);
}

function drawBag() {
  const { w, h } = bag.size;
  g.save();
  g.translate(bag.position.x, bag.position.y);
  g.rotate(bag.angle);
  // handles: two loops of twisted paper cord up to the hanging point
  g.strokeStyle = '#8f7a5c';
  g.lineWidth = 2.4;
  [-1, 1].forEach((s) => {
    g.beginPath();
    g.moveTo(s * 22 - 8, -h / 2 + 2);
    g.bezierCurveTo(s * 22 - 10, -h / 2 - 50, s * 22 + 10, -h / 2 - 50, s * 22 + 8, -h / 2 + 2);
    g.stroke();
  });
  // the front panel, kraft paper with a fold line and the wordmark
  const grd = g.createLinearGradient(-w / 2, 0, w / 2, 0);
  grd.addColorStop(0, '#c9ab82'); grd.addColorStop(0.5, '#d8bd96'); grd.addColorStop(1, '#bf9f76');
  g.fillStyle = grd;
  g.beginPath();
  g.moveTo(-w / 2 - 3, -h / 2 + 18);
  g.lineTo(w / 2 + 3, -h / 2 + 18);
  g.lineTo(w / 2 + 3, h / 2 + 3);
  g.lineTo(-w / 2 - 3, h / 2 + 3);
  g.closePath();
  g.fill();
  g.fillStyle = 'rgba(0,0,0,.08)';
  g.fillRect(-w / 2 - 3, -h / 2 + 18, w + 6, 5);
  g.strokeStyle = 'rgba(80,60,30,.18)';
  g.lineWidth = 1;
  g.beginPath(); g.moveTo(-w / 2 + 4, h / 2 - 12); g.lineTo(w / 2 - 4, h / 2 - 12); g.stroke();
  g.fillStyle = 'rgba(40,30,20,.72)';
  g.font = `italic 300 ${Math.round(w * 0.17)}px Newsreader, Georgia, serif`;
  g.textAlign = 'center';
  g.fillText('Lawn & Loom', 0, 8);
  g.restore();
}

function render() {
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);
  // folded pieces, drawn behind the bag's front panel so they peek over its top
  pieces.forEach((b) => {
    const w = b.pw, h = b.ph;
    g.save();
    g.translate(b.position.x, b.position.y);
    g.rotate(b.angle);
    if (b.img.complete && b.img.naturalWidth) g.drawImage(b.img, -w / 2, -h / 2, w, h);
    g.fillStyle = 'rgba(0,0,0,.12)';
    g.fillRect(-w / 2, h / 2 - 3, w, 3); // the fold
    g.restore();
  });
  drawBag();
}

function tick() {
  Engine.update(engine, 1000 / 60);
  // a little life even when nothing's happening, as if the bag hangs in a draught
  Body.applyForce(bag, bag.position, { x: Math.sin(performance.now() / 900) * 0.00002, y: 0 });
  render();
  const moving = Math.abs(bag.angularVelocity) > 0.0004 || pieces.some((p) => p.speed > 0.05);
  idleFrames = moving ? 0 : idleFrames + 1;
  raf = idleFrames < 90 && !document.hidden ? requestAnimationFrame(tick) : 0;
}
function kick() { idleFrames = 0; if (!raf) raf = requestAnimationFrame(tick); }

function sync() {
  const n = cart.count();
  dock.classList.toggle('is-empty', n === 0);
  dock.querySelector('[data-bag-tag]').textContent = rs(cart.subtotal());
  document.querySelectorAll('[data-bag-count]').forEach((el) => (el.textContent = n));
  // keep the pieces roughly in step with the bag (removing items takes pieces out)
  const want = cart.items.reduce((s, it) => s + Math.min(it.qty, 3), 0);
  while (pieces.length > want) Composite.remove(engine.world, pieces.pop());
  render();
}

/* the add-to-bag moment, from an element (the product's image or swatch) */
export function dropIn(it, fromEl) {
  if (!dock) return;
  const p = product(it.id);
  const r = fromEl.getBoundingClientRect(), d = dock.getBoundingClientRect();
  const fly = document.createElement('div');
  fly.className = 'flyer';
  fabricCrop(photo(p, it.cw), 256).then((u) => u && (fly.style.backgroundImage = `url(${u})`));
  document.body.appendChild(fly);
  const finish = () => { fly.remove(); addPiece(it); Body.setAngularVelocity(bag, (Math.random() - 0.5) * 0.06); const tag = dock.querySelector('[data-bag-tag]'); gsap.fromTo(tag, { rotation: -14 }, { rotation: 0, duration: 1.2, ease: 'elastic.out(1, 0.3)' }); };
  dock.classList.remove('is-empty');
  if (REDUCED) { finish(); return; }
  const x0 = r.left + r.width / 2 - 55, y0 = r.top + r.height / 2 - 70;
  const x1 = d.left + d.width / 2 - 55, y1 = d.top + d.height * 0.32 - 70;
  // fold in half, then in half again, then fly to the bag and drop in
  const tl = gsap.timeline({ onComplete: finish });
  tl.set(fly, { x: x0, y: y0, scaleX: 1, scaleY: 1, rotation: 0 })
    .to(fly, { scaleX: 0.5, duration: 0.28, ease: 'power2.inOut' })
    .to(fly, { scaleY: 0.32, duration: 0.28, ease: 'power2.inOut' })
    .to(fly, { x: x1, y: y1 - 80, rotation: -8, duration: 0.6, ease: 'power2.inOut' })
    .to(fly, { y: y1 + 20, scaleX: 0.36, opacity: 0, duration: 0.3, ease: 'power2.in' });
  setTimeout(() => { if (fly.isConnected) { tl.kill(); finish(); } }, 2200); // land even if frames stall
}

// checkout opens with a tug of the handles
function tug() {
  Body.setVelocity(bag, { x: 0, y: 6 });
  Body.setAngularVelocity(bag, 0.04);
  kick();
  setTimeout(() => barba.go('/cart'), 380);
}

export function initBag() { if (!document.querySelector('[data-bag-dock]')) return; build(); }
export function bagVisible(show) { dock?.classList.toggle('is-hidden', !show); }
