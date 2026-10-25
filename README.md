# Lawn & Loom: "Fabric you can feel"

Concept project 6 of 8 for the Aqoa Systems portfolio. A fictional Lahore clothing brand selling printed unstitched lawn and ready-to-wear.

## What's in it
| Page | Signature moment |
|---|---|
| Home | A length of printed lawn hangs from a brass rod in soft pleats, billowing in a breeze, and the pointer is the wind. Pick one of six prints and the cloth re-dyes in place. Further down, a bolt of fabric unrolls as you scroll, revealing the new pieces. |
| Shop | Photographs of all 18 pieces, filterable by type. Hover a card to see a second angle, and the colour dots switch to that colourway. "Walk the aisle" turns the collection into folded fabric stacks on low tables, like a cloth market, labelled with each product's photo. |
| Product | A photo gallery for the chosen colourway, plus a last view, "Feel it": a 3D swatch draped over a rod that you drag to turn, dyed to match, with a loupe on the weave. |
| Cart & checkout | Your bag, a free-delivery bar, and a short cash-on-delivery form that ends with an order number and a ready-to-send WhatsApp message. |
| Size guide | Pull a measuring tape across the screen. The chart greys out the sizes it passes and highlights the one that fits, for bust, waist or hip. It works with the keyboard too. |
| 404 | "A loose thread." |

**Signature interaction:** add an item and it folds itself in half, then in half again, flies to the paper shopping bag in the corner and drops in. The bag hangs from its handles on Matter.js physics and sways under the weight. Its tag shows the running total, and a tug on the handles opens checkout.

Also included:
- A page transition where a sheet of printed fabric sweeps across the screen like a curtain, then falls away.
- Photos that fade in as they load and lean gently toward the cursor (a smooth transform, never a filter, so they stay sharp).
- An "Add to bag" button that stitches a thread around itself while it works.

The site has no sound, by design.

## Stack
Vite · Three.js · GSAP + ScrollTrigger · Lenis · Barba.js · SplitType · Matter.js

Products use real photographs, one set per colourway. The moving fabric (the hero cloth, the bolt, the draped swatch, the aisle stacks and the curtain) uses six prints drawn in code: chintz floral, buti, Sindhi ajrak, ikat stripe, jaal trellis and paisley. They're drawn as seamless tiles of three ink masks, which is what lets them be dyed to match any product. The folded pieces in the paper bag are cut from each product's own photograph.

## Run it
From a terminal:
```bash
npm install
npm run dev
```
The site uses ES modules, so it needs a server. Opening `index.html` by double-clicking won't work. Testing flags: `?lite` forces the lighter version, `?full` forces 3D.

## Deploy on Vercel
Import the repo, leave **Root Directory** at the repository root (`./`), and keep the detected **Vite** preset. `vercel.json` turns on clean URLs. Products live at `/product?id=…&cw=…`.

## Phones and lighter devices
- **Phones:** the cloth uses a simpler wave, the shop opens in the grid instead of the 3D aisle, and the draped swatch turns with a finger drag.
- **No WebGL:** devices without WebGL see the prints flat, with the same content and the same bag.

## Before publishing
- Search "Lawn & Loom" on Google to check no real brand uses the name.
- Products, prices, sizes and contact details are placeholders. The product photos are free Unsplash images and don't show real Lawn & Loom stock. Everything lives in `src/data.js`, and the prints live in `src/core/prints.js`.
- The bag is kept in the browser and checkout sends nothing. A real store would add inventory, an order dashboard, courier booking, and card and mobile-wallet payments, as the brief suggests.

Product and editorial photos from Unsplash (free licence), self-hosted as WebP in `public/img/p/`.
