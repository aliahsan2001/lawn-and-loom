/* Product cards, led by real photographs. Hovering crossfades to the second angle when there is
   one; colour dots swap the photographs to that colourway. */

import { rs, img, photo } from '../data.js';
import { esc } from './ui.js';

const pic = (id, cls, eager) => `<img class="${cls}" src="${img(id, 640)}" srcset="${img(id, 640)} 640w, ${img(id, 1280)} 1280w" sizes="(max-width: 760px) 46vw, 31vw" alt="" ${eager ? '' : 'loading="lazy"'} decoding="async" onload="this.classList.add('is-loaded')">`;

function visual(p, cw, eager) {
  const a = photo(p, cw, 0), b = p.colourways[cw].photos[1];
  return pic(a, 'p-img p-img-a', eager) + (b ? pic(b, 'p-img p-img-b', false) : '');
}

export function cardHTML(p, i = 0) {
  const many = p.colourways.length > 1;
  return `
    <article class="p-card" data-card="${p.id}">
      <a class="p-link" href="/product?id=${p.id}" aria-label="${esc(p.name)}, ${esc(p.type)}, ${rs(p.price)}">
        <div class="p-visual hover-img${p.colourways[0].photos[1] ? ' has-b' : ''}" data-visual>${visual(p, 0, i < 3)}</div>
      </a>
      <div class="p-info">
        <div>
          <h3 class="p-name"><a href="/product?id=${p.id}">${esc(p.name)}</a></h3>
          <p class="p-print">${esc(p.type)} · <span data-cw-name>${esc(p.colourways[0].name)}</span></p>
        </div>
        <p class="p-price">${rs(p.price)}</p>
      </div>
      ${many ? `<div class="p-dots" role="group" aria-label="Colourways">${p.colourways.map((c, k) => `<button type="button" class="swatch-dot" data-cw="${k}" aria-pressed="${k === 0}" aria-label="${esc(c.name)}" style="background-image:url(${img(c.photos[0], 640)})"></button>`).join('')}</div>` : ''}
    </article>`;
}

export function wireCards(root, products) {
  const onClick = (e) => {
    const dot = e.target.closest('[data-cw]');
    if (!dot) return;
    const card = dot.closest('[data-card]');
    const p = products.find((x) => x.id === card.dataset.card);
    const k = Number(dot.dataset.cw);
    const v = card.querySelector('[data-visual]');
    v.classList.toggle('has-b', !!p.colourways[k].photos[1]);
    v.innerHTML = visual(p, k, true);
    card.querySelector('[data-cw-name]').textContent = p.colourways[k].name;
    card.querySelectorAll('[data-cw]').forEach((d) => d.setAttribute('aria-pressed', String(d === dot)));
    card.querySelectorAll('a[href^="/product"]').forEach((a) => (a.href = `/product?id=${p.id}&cw=${k}`));
  };
  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}
