/* The prints. Each one is drawn in code as a seamless tile of three masks, packed into the red,
   green and blue channels: main ink, accent ink, and fine detail. Keeping the colours separate
   is what lets any piece be re-dyed live, both here in 2D (swatches, cards) and in the WebGL
   cloth shaders, which read the same masks. */

const S = 512;
const cache = new Map();

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// draw at (x, y) and again wherever the motif crosses an edge, so the tile repeats seamlessly
function wrap(g, x, y, reach, fn) {
  for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
    if (x + dx < -reach || x + dx > S + reach || y + dy < -reach || y + dy > S + reach) continue;
    g.save(); g.translate(x + dx, y + dy); fn(g); g.restore();
  }
}

/* ---------- motifs, drawn in white on black ---------- */
function flower(g, r, petals, roundness = 0.55) {
  for (let i = 0; i < petals; i++) {
    g.save();
    g.rotate((i / petals) * Math.PI * 2);
    g.beginPath();
    g.ellipse(0, -r * 0.55, r * roundness * 0.62, r * 0.55, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
}
function leaf(g, len, w) {
  g.beginPath();
  g.moveTo(0, 0);
  g.quadraticCurveTo(w, -len * 0.5, 0, -len);
  g.quadraticCurveTo(-w, -len * 0.5, 0, 0);
  g.fill();
}
function paisley(g, s) {
  g.beginPath();
  g.moveTo(0, s);
  g.bezierCurveTo(s * 0.95, s * 0.9, s * 0.9, -s * 0.35, s * 0.15, -s * 0.75);
  g.bezierCurveTo(-s * 0.05, -s * 0.95, s * 0.35, -s * 1.25, s * 0.05, -s * 1.3);
  g.bezierCurveTo(-s * 0.75, -s * 0.9, -s * 0.85, s * 0.6, 0, s);
  g.fill();
}

const PRINTS = {
  // big botanical florals with leaves, stems and stippling
  chintz(L, r) {
    const spots = Array.from({ length: 9 }, () => [r() * S, r() * S, 30 + r() * 26, Math.floor(5 + r() * 3), r() * 6]);
    spots.forEach(([x, y, rad, n, rot]) => {
      wrap(L.C, x, y, rad * 2.4, (g) => {
        g.rotate(rot);
        g.lineWidth = 2.2;
        for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(rad * 1.2, rad * (0.4 + k * 0.3), rad * (1.6 + k * 0.2), rad * (1.2 - k)); g.stroke(); }
      });
      wrap(L.B, x, y, rad * 2.4, (g) => {
        g.rotate(rot);
        for (let k = 0; k < 4; k++) { g.save(); g.rotate(k * 1.6 + 0.4); g.translate(0, -rad * 0.9); leaf(g, rad * 1.1, rad * 0.42); g.restore(); }
      });
      wrap(L.A, x, y, rad * 1.3, (g) => { g.rotate(rot); flower(g, rad, n, 0.72); });
      wrap(L.B, x, y, rad, (g) => { g.beginPath(); g.arc(0, 0, rad * 0.24, 0, Math.PI * 2); g.fill(); });
    });
    for (let i = 0; i < 900; i++) { L.C.beginPath(); L.C.arc(r() * S, r() * S, 0.9, 0, Math.PI * 2); L.C.fill(); }
  },
  // small scattered motifs on a half-drop grid
  buti(L) {
    const n = 6, step = S / n;
    for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) {
      const x = col * step + (row % 2 ? step / 2 : 0) + step / 2, y = row * step + step / 2;
      const tilt = ((row * 7 + col * 3) % 5 - 2) * 0.18;
      wrap(L.B, x, y, 34, (g) => { g.rotate(tilt); g.lineWidth = 2; g.beginPath(); g.moveTo(0, 4); g.quadraticCurveTo(3, 18, -2, 28); g.stroke(); g.save(); g.translate(0, 16); g.rotate(2.2); leaf(g, 16, 6); g.restore(); g.save(); g.translate(0, 20); g.rotate(-2.1); leaf(g, 14, 5); g.restore(); });
      wrap(L.A, x, y, 30, (g) => { g.rotate(tilt); flower(g, 17, 6, 0.85); });
      wrap(L.C, x, y, 30, (g) => { g.beginPath(); g.arc(0, 0, 4, 0, Math.PI * 2); g.fill(); });
      wrap(L.C, x + step / 2, y + step / 2, 8, (g) => { for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(Math.cos(k * 1.2566) * 5, Math.sin(k * 1.2566) * 5, 1.6, 0, Math.PI * 2); g.fill(); } });
    }
  },
  // Sindhi ajrak: a block-printed grid of stars, roundels and borders
  ajrak(L) {
    const n = 4, c = S / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const x = i * c + c / 2, y = j * c + c / 2;
      wrap(L.A, x, y, c, (g) => {
        g.beginPath();
        for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2, rr = k % 2 ? c * 0.24 : c * 0.46; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
        g.closePath(); g.fill();
      });
      wrap(L.B, x, y, c, (g) => { g.beginPath(); g.arc(0, 0, c * 0.16, 0, Math.PI * 2); g.fill(); for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(Math.cos(k * 1.57 + 0.785) * c * 0.5, Math.sin(k * 1.57 + 0.785) * c * 0.5, c * 0.08, 0, Math.PI * 2); g.fill(); } });
      wrap(L.C, x, y, c, (g) => {
        g.lineWidth = 3;
        g.strokeRect(-c / 2 + 4, -c / 2 + 4, c - 8, c - 8);
        for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; g.beginPath(); g.arc(Math.cos(a) * c * 0.32, Math.sin(a) * c * 0.32, 2.4, 0, Math.PI * 2); g.fill(); }
      });
    }
  },
  // ikat stripes with feathered, dyed edges and woven slubs
  stripe(L, r) {
    // each band's edge drifts slowly, the way resist-dyed ikat threads shift on the loom
    const bands = [[0, 56], [104, 30], [170, 80], [300, 34], [372, 60], [462, 24]];
    bands.forEach(([x, w], bi) => {
      const ph = r() * 6, ph2 = r() * 6;
      for (let y = 0; y < S; y += 2) {
        const t = (y / S) * Math.PI * 2;
        const j = Math.sin(t * 3 + ph) * 5 + Math.sin(t * 7 + ph2) * 2.5 + (r() - 0.5) * 2;
        const j2 = Math.sin(t * 4 + ph2) * 5 + Math.sin(t * 9 + ph) * 2.5 + (r() - 0.5) * 2;
        L.A.fillRect(x + j, y, w + j2 - j, 2);
        // feathered threads just past the edge
        if (r() < 0.35) L.A.fillRect(x + w + j2, y, 2 + r() * 7, 1);
        if (r() < 0.35) L.A.fillRect(x + j - 2 - r() * 7, y, 2 + r() * 7, 1);
      }
    });
    [[80, 6], [150, 4], [270, 8], [440, 5]].forEach(([x, w]) => L.B.fillRect(x, 0, w, S));
    for (let i = 0; i < 700; i++) L.C.fillRect(r() * S, r() * S, 6 + r() * 16, 1.2);
  },
  // jaal: a trellis of vines with flowers where they cross
  jaal(L) {
    const n = 4, c = S / n;
    L.A.lineWidth = 5;
    for (let k = -1; k <= n; k++) {
      L.A.beginPath();
      for (let y = 0; y <= S; y += 4) L.A.lineTo(k * c + Math.sin((y / c) * Math.PI) * c * 0.5, y);
      L.A.stroke();
      L.A.beginPath();
      for (let y = 0; y <= S; y += 4) L.A.lineTo(k * c - Math.sin((y / c) * Math.PI) * c * 0.5, y);
      L.A.stroke();
    }
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      wrap(L.B, i * c, j * c, 30, (g) => flower(g, 18, 6, 0.75));
      wrap(L.C, i * c + c / 2, j * c + c / 2, 30, (g) => { for (let k = 0; k < 4; k++) { g.save(); g.rotate(k * 1.57 + 0.4); leaf(g, 16, 6); g.restore(); } });
    }
  },
  // paisley, offset rows, with dotted infill
  paisley(L) {
    const cols = 4, rows = 4, cw = S / cols, rh = S / rows;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x = i * cw + (j % 2 ? cw / 2 : 0) + cw / 2, y = j * rh + rh / 2;
      const flip = (i + j) % 2 ? -1 : 1;
      wrap(L.A, x, y, rh, (g) => { g.scale(flip, 1); g.rotate(0.35); paisley(g, rh * 0.34); });
      wrap(L.B, x, y, rh, (g) => { g.scale(flip, 1); g.rotate(0.35); g.globalCompositeOperation = 'source-over'; g.scale(0.55, 0.55); paisley(g, rh * 0.34); });
      wrap(L.C, x, y, rh, (g) => {
        g.scale(flip, 1); g.rotate(0.35);
        for (let k = 0; k < 9; k++) { g.beginPath(); g.arc(Math.sin(k) * rh * 0.12, (k / 9 - 0.5) * rh * 0.5, 1.8, 0, Math.PI * 2); g.fill(); }
      });
    }
  },
};

export const PRINT_NAMES = { chintz: 'Chintz floral', buti: 'Buti', ajrak: 'Ajrak block print', stripe: 'Ikat stripe', jaal: 'Jaal trellis', paisley: 'Paisley' };

/* the three masks of a print, packed into one RGB canvas */
export function printMasks(id) {
  if (cache.has(id)) return cache.get(id);
  const layer = () => { const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, S, S); g.fillStyle = g.strokeStyle = '#fff'; g.lineCap = 'round'; return { c, g }; };
  const A = layer(), B = layer(), C = layer();
  PRINTS[id]({ A: A.g, B: B.g, C: C.g }, rng(id.length * 977 + id.charCodeAt(0)));
  const out = document.createElement('canvas');
  out.width = out.height = S;
  const og = out.getContext('2d');
  const img = og.createImageData(S, S);
  const a = A.g.getImageData(0, 0, S, S).data, b = B.g.getImageData(0, 0, S, S).data, c = C.g.getImageData(0, 0, S, S).data;
  for (let i = 0; i < a.length; i += 4) { img.data[i] = a[i]; img.data[i + 1] = b[i]; img.data[i + 2] = c[i]; img.data[i + 3] = 255; }
  og.putImageData(img, 0, 0);
  cache.set(id, out);
  return out;
}

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

/* a dyed swatch as an image URL (cached), for cards, the bag and thumbnails */
const dyed = new Map();
export function swatchURL(print, cw, size = 256) {
  const key = `${print}|${cw.ground}|${cw.ink1}|${cw.ink2}|${size}`;
  if (dyed.has(key)) return dyed.get(key);
  const m = printMasks(print);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.drawImage(m, 0, 0, size, size);
  const d = g.getImageData(0, 0, size, size), px = d.data;
  const G = hex(cw.ground), I1 = hex(cw.ink1), I2 = hex(cw.ink2);
  for (let i = 0; i < px.length; i += 4) {
    const ma = px[i] / 255, mb = px[i + 1] / 255, mc = px[i + 2] / 255 * 0.8;
    for (let k = 0; k < 3; k++) {
      let v = G[k] + (I1[k] - G[k]) * ma;
      v += (I2[k] - v) * mb;
      v += (I1[k] * 0.7 - v) * mc;
      px[i + k] = v;
    }
  }
  g.putImageData(d, 0, 0);
  // a faint woven texture so flat swatches still read as cloth
  g.globalAlpha = 0.06;
  g.fillStyle = '#000';
  for (let y = 0; y < size; y += 2) g.fillRect(0, y, size, 1);
  g.globalAlpha = 1;
  const url = c.toDataURL('image/webp', 0.86);
  dyed.set(key, url);
  return url;
}

/* GLSL that dyes the masks; use with uniforms uMask, uGround, uInk1, uInk2 */
export const DYE_GLSL = /* glsl */ `
  vec3 dye(vec2 uv) {
    vec3 m = texture2D(uMask, uv).rgb;
    vec3 col = mix(uGround, uInk1, m.r);
    col = mix(col, uInk2, m.g);
    col = mix(col, uInk1 * 0.7, m.b * 0.8);
    return col;
  }
  // the plain weave of lawn: warp and weft threads, a little uneven
  float weave(vec2 uv, float density) {
    vec2 p = uv * density;
    float warp = 0.5 + 0.5 * sin(p.x * 6.2831);
    float weft = 0.5 + 0.5 * sin(p.y * 6.2831);
    float over = step(0.5, fract((floor(p.x) + floor(p.y)) * 0.5));
    return mix(warp, weft, over);
  }
`;
