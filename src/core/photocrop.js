/* A square of real fabric, cut from the middle of a product photograph (the front of the shirt),
   for places that need cloth rather than a whole outfit: the folded pieces in the paper bag and
   the stacks in the shop aisle. Cached per photo. */

import { img } from '../data.js';

const cache = new Map();

export function fabricCrop(id, size = 256) {
  const key = `${id}|${size}`;
  if (cache.has(key)) return cache.get(key);
  const job = new Promise((resolve) => {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const g = c.getContext('2d');
      // the shirt front sits roughly mid-frame, a little below centre
      const s = Math.min(im.width * 0.12, im.height * 0.09);
      g.drawImage(im, im.width * 0.5 - s / 2, im.height * 0.5 - s / 2, s, s, 0, 0, size, size);
      resolve(c.toDataURL('image/webp', 0.85));
    };
    im.onerror = () => resolve(null);
    im.src = img(id, 640);
  });
  cache.set(key, job);
  return job;
}
