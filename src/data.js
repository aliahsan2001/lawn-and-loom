/* Lawn & Loom — site data. Products, colourways, sizes and shipping live here.
   Each colourway has its own photographs; `dye` and `print` drive the 3D "feel the fabric"
   swatch on the product page. Prices, people and contact details are placeholders. */

export const img = (id, w = 800) => `/img/p/${id}-${w > 700 ? 1280 : 640}.webp`;

export const CONFIG = {
  name: 'Lawn & Loom',
  whatsappNumber: '',
  phoneDisplay: '+92 42 3577 0000',
  email: 'orders@lawnandloom.example',
  studio: '14-B Gulberg III, Lahore',
  freeShippingOver: 7000,
  shipping: 250,
  collection: "Bahar '26",
};

// a colourway: its name, its photographs, and the dye for the 3D swatch (ground, main ink, accent)
const C = (name, photos, ground, ink1, ink2) => ({ name, photos, ground, ink1, ink2 });

export const PRODUCTS = [
  { id: 'gulnar', name: 'Gulnar', type: 'Unstitched 3-piece', line: 'Embroidered', price: 14950, print: 'buti',
    colourways: [C('Lal', ['1733470381571-c3d082e68457'], '#a8202a', '#7a1018', '#e0b98a')],
    fabric: ['Shirt: embroidered chiffon front, 1.25 m', 'Sleeves and back: dyed chiffon, 1.5 m', 'Dupatta: embroidered chiffon with scalloped border, 2.5 m', 'Trouser: raw silk with embroidered hem, 2.5 m'],
    blurb: 'Deep red chiffon, embroidered all over with tiny buti and a heavy floral border. Made for Eid evenings and mehndis.' },
  { id: 'sabz-bahar', name: 'Sabz Bahar', type: 'Unstitched 3-piece', line: 'Printed lawn', price: 7450, print: 'jaal',
    colourways: [C('Pista', ['1773439878577-5969ffc1b198'], '#c9cf98', '#6f7a3a', '#c2306e')],
    fabric: ['Shirt: printed lawn, 80s count, 3 m', 'Dupatta: printed lawn with a fuchsia border, 2.5 m', 'Trouser: dyed cambric, 2.5 m'],
    blurb: 'Soft pistachio lawn with a fuchsia-edged dupatta that steals the show.' },
  { id: 'rani', name: 'Rani', type: 'Unstitched 3-piece', line: 'Embroidered', price: 11950, print: 'buti',
    colourways: [C('Magenta', ['1773439878533-77383b20577c'], '#c2186b', '#8a0d4a', '#e8c25a')],
    fabric: ['Shirt: embroidered lawn front, 1.25 m', 'Back and sleeves: dyed lawn, 1.75 m', 'Dupatta: printed lawn, 2.5 m', 'Trouser: dyed cambric, 2.5 m'],
    blurb: 'A bright, joyful magenta with a mirror-work neckline and a printed dupatta to match.' },
  { id: 'pista-chikan', name: 'Pista Chikan', type: 'Unstitched 3-piece', line: 'Embroidered', price: 10950, print: 'jaal',
    colourways: [C('Mint', ['1773439877245-79b5ac3244a8', '1773439878222-c383967772de'], '#cfe3d6', '#8fb7a1', '#ffffff')],
    fabric: ['Shirt: chikankari-embroidered lawn, 3 m', 'Dupatta: white organza with embroidered edge, 2.5 m', 'Trouser: dyed cambric, 2.5 m'],
    blurb: 'Mint lawn with white chikankari, worn with a sheer white dupatta. Cool as a summer morning.' },
  { id: 'surmai', name: 'Surmai', type: 'Unstitched 3-piece', line: 'Embroidered', price: 9950, print: 'paisley',
    colourways: [C('Charcoal', ['1773439878338-c61b0fe9ed48', '1773439878281-5aa23c34dcaa'], '#9a9a9a', '#2a2a2a', '#ffffff')],
    fabric: ['Shirt: embroidered lawn, 3 m', 'Dupatta: black lawn with white embroidered motifs, 2.5 m', 'Trouser: dyed cambric, 2.5 m'],
    blurb: 'Smoky grey lawn paired with a bold black dupatta, embroidered in white.' },
  { id: 'gulabi-bagh', name: 'Gulabi Bagh', type: 'Unstitched 3-piece', line: 'Block print', price: 7950, print: 'chintz',
    colourways: [
      C('Blush', ['1669197793099-066f7618cd8e', '1669197795634-f5f2a25d8ebc'], '#f4d3d6', '#c2475e', '#6f8a5a'),
      C('Lavender', ['1669197792605-3733d6fe9893', '1669197792644-d05262e9328e'], '#e3d8f0', '#8a6ab8', '#6f8a5a'),
    ],
    fabric: ['Shirt: block-printed lawn, 80s count, 3 m', 'Dupatta: printed chiffon, 2.5 m', 'Trouser: printed cambric, 2.5 m'],
    blurb: 'Hand-block-printed roses on soft lawn, in blush or lavender, with a fringed dupatta.' },
  { id: 'neelam', name: 'Neelam', type: 'Unstitched 3-piece', line: 'Embroidered', price: 12950, print: 'chintz',
    colourways: [C('Royal blue', ['1614098097306-c67b8020c04e'], '#1d3f8a', '#f0e4c8', '#c0392b')],
    fabric: ['Shirt: embroidered lawn front, 1.25 m', 'Sleeves: embroidered organza, 0.75 m', 'Dupatta: dyed organza, 2.5 m', 'Trouser: dyed cambric, 2.5 m'],
    blurb: 'Royal blue with a garden of embroidered flowers down the front and sheer organza sleeves.' },
  { id: 'shab', name: 'Shab', type: 'Unstitched 3-piece', line: 'Embroidered', price: 13950, print: 'paisley',
    colourways: [C('Black', ['1733470381591-c5dfb9df3c3d', '1704119142483-1269733bcedb'], '#1c1c1e', '#f2f2f2', '#8a8a8a')],
    fabric: ['Shirt: embroidered lawn, 3 m', 'Dupatta: embroidered net, 2.5 m', 'Trouser: dyed cambric with embroidered hem, 2.5 m'],
    blurb: 'Black lawn with white threadwork and a net dupatta. The one you reach for at night.' },
  { id: 'firozi', name: 'Firozi', type: 'Unstitched 3-piece', line: 'Embroidered', price: 10450, print: 'buti',
    colourways: [C('Powder blue', ['1733470381436-bb5a2a441708'], '#b8cbe3', '#ffffff', '#7a90b8')],
    fabric: ['Shirt: embroidered lawn, 3 m', 'Dupatta: printed chiffon, 2.5 m', 'Trouser: dyed cambric, 2.5 m'],
    blurb: 'Powder blue with white embroidery, light enough for a long afternoon.' },
  { id: 'jamni', name: 'Jamni', type: 'Unstitched 3-piece', line: 'Embroidered', price: 12450, print: 'jaal',
    colourways: [C('Mauve', ['1705920824583-0e783235394d'], '#9a7aa8', '#6a4a7a', '#e8dcc8')],
    fabric: ['Shirt: embroidered chiffon, 3 m', 'Dupatta: embroidered chiffon, 2.5 m', 'Trouser: raw silk, 2.5 m'],
    blurb: 'Dusky mauve chiffon with tonal embroidery that catches the light as you move.' },
  { id: 'kesar', name: 'Kesar', type: 'Unstitched 2-piece', line: 'Printed lawn', price: 5950, print: 'stripe',
    colourways: [C('Saffron', ['1701252072712-e939599623f2'], '#f4f0e6', '#e0a42a', '#c07a1a')],
    fabric: ['Shirt: dyed lawn with printed placket, 3 m', 'Dupatta: printed stripe lawn, 2.5 m'],
    blurb: 'Saffron lawn with a striped dupatta. Easy, bright, and very summer.' },
  { id: 'champa', name: 'Champa', type: 'Unstitched 3-piece', line: 'Embroidered', price: 11450, print: 'buti',
    colourways: [C('Ivory', ['1733470324488-d0e10d014d80'], '#efe3c4', '#c9b07a', '#ffffff')],
    fabric: ['Shirt: embroidered cotton net, 3 m', 'Dupatta: embroidered chiffon, 2.5 m', 'Trouser: dyed cambric, 2.5 m'],
    blurb: 'Warm ivory with gold-toned threadwork. Quiet, and quietly expensive-looking.' },
  { id: 'noor-kurta', name: 'Noor Kurta', type: 'Ready-to-wear', line: 'Chikankari', price: 6450, print: 'buti', sizes: true,
    colourways: [C('White', ['1667665970124-2273c6ef3489', '1667665970118-f55705003914'], '#f6f4ee', '#dcd8cc', '#ffffff')],
    fabric: ['Straight kurta, chikankari on fine cotton', 'Slip and trouser included', 'Length 46 in (size M)'],
    blurb: 'White on white chikankari, cut straight and long. The kurta every wardrobe needs.' },
  { id: 'phool-coord', name: 'Phool Co-ord', type: 'Ready-to-wear', line: 'Printed lawn', price: 5950, print: 'chintz', sizes: true,
    colourways: [
      C('Pink', ['1768033976358-875c5dd27fc1'], '#f2a7b5', '#e8e0da', '#c2475e'),
      C('Rose', ['1762777777819-4d9aa5529368'], '#f0b0b4', '#c2475e', '#7a8a5a'),
    ],
    fabric: ['Shirt and wide trousers, printed lawn', 'Elastic waist with drawstring', 'Shirt length 34 in (size M)'],
    blurb: 'A loose shirt and wide trousers in one big floral print. Throw it on and go.' },
  { id: 'ananya-set', name: 'Ananya Kurta Set', type: 'Ready-to-wear', line: 'Block print', price: 6950, print: 'buti', sizes: true,
    colourways: [
      C('White', ['1745313452052-0e4e341f326c'], '#f6f2ea', '#c2475e', '#5d7a4f'),
      C('Pink', ['1741847639057-b51a25d42892'], '#f2c8cc', '#a8324a', '#5d7a4f'),
    ],
    fabric: ['Kurta and straight trousers, block-printed cotton', 'Embroidered neckline', 'Length 44 in (size M)'],
    blurb: 'Block-printed buti on soft cotton, with a little embroidery at the neck.' },
  { id: 'lal-coord', name: 'Lal Co-ord', type: 'Ready-to-wear', line: 'Printed lawn', price: 6250, print: 'chintz', sizes: true,
    colourways: [C('Red', ['1768289223082-1ead6e5ad5e4'], '#b8202a', '#f0d8c8', '#2a1a1a')],
    fabric: ['Button-down shirt and trousers, printed lawn', 'Relaxed fit', 'Shirt length 32 in (size M)'],
    blurb: 'A red floral co-ord with a relaxed shirt. Smart enough for lunch, easy enough for errands.' },
  { id: 'aalia-kurta', name: 'Aalia Kurta', type: 'Ready-to-wear', line: 'Embroidered', price: 7450, print: 'paisley', sizes: true,
    colourways: [C('Wine', ['1708534419572-6e6614a53ca1', '1708534246055-d7b149acb731'], '#5a1630', '#e8c8c8', '#c08a9a')],
    fabric: ['A-line kurta, embroidered rayon', 'Embroidered yoke and sleeves', 'Length 42 in (size M)'],
    blurb: 'Deep wine with pale pink embroidery across the yoke. A winter-into-spring favourite.' },
  { id: 'tota-dupatta', name: 'Tota Dupatta', type: 'Dupatta', line: 'Printed', price: 2950, print: 'ajrak',
    colourways: [C('Parrot', ['1597983073750-16f5ded1321f'], '#2a8a4a', '#c0392b', '#f0e0c0')],
    fabric: ['Printed chiffon, 2.5 m', 'Hand-finished edges'], blurb: 'A parrot-green dupatta with a red ajrak border, to lift a plain kurta.' },
];

export const TYPES = ['Unstitched 3-piece', 'Unstitched 2-piece', 'Ready-to-wear', 'Dupatta'];

// body measurements in inches, for the ready-to-wear fit
export const SIZES = [
  { size: 'XS', bust: 32, waist: 26, hip: 35 },
  { size: 'S', bust: 34, waist: 28, hip: 37 },
  { size: 'M', bust: 36, waist: 30, hip: 39 },
  { size: 'L', bust: 39, waist: 33, hip: 42 },
  { size: 'XL', bust: 42, waist: 36, hip: 45 },
];

export const rs = (n) => 'Rs ' + Math.round(n).toLocaleString('en-PK');
export const product = (id) => PRODUCTS.find((p) => p.id === id);
export const photo = (p, cw = 0, k = 0) => p.colourways[cw].photos[k] || p.colourways[cw].photos[0];
