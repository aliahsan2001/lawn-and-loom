/* Shop: products as folded fabric stacks on low tables, either side of an aisle, like a cloth
   market. Scrolling walks the camera down the aisle (setProgress 0..1). Each stack shows the
   product's colourways folded one on another. Labels are HTML, positioned over each stack. */

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { swatchURL } from '../core/prints.js';

const GAP = 3.4;

export function mountAisle(canvas, { products, small = false, onPick, onHover }) {
  const wrap = canvas.parentElement;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.5 : 2));
  renderer.shadowMap.enabled = !small;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;
  const scene = new THREE.Scene();
  const BG = new THREE.Color('#f1ede5');
  scene.background = BG;
  scene.fog = new THREE.Fog(BG, 8, 30);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);

  scene.add(new THREE.HemisphereLight('#fffaf0', '#d8cdb8', 1.9));
  const sun = new THREE.DirectionalLight('#fff4e2', 1.1);
  sun.position.set(4, 9, 3);
  sun.castShadow = !small;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 40 });
  sun.shadow.bias = -0.0005;
  sun.shadow.radius = 6;
  scene.add(sun, sun.target);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 200), new THREE.MeshStandardMaterial({ color: '#e9e3d7', roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = -80;
  floor.receiveShadow = true;
  scene.add(floor);
  // a linen runner down the middle of the aisle
  const runner = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 200), new THREE.MeshStandardMaterial({ color: '#dcd3c2', roughness: 1 }));
  runner.rotation.x = -Math.PI / 2;
  runner.position.set(0, 0.002, -80);
  runner.receiveShadow = true;
  scene.add(runner);

  const loader = new THREE.TextureLoader();
  const wood = new THREE.MeshStandardMaterial({ color: '#d6c6ab', roughness: 0.8 });
  const stacks = [];
  products.forEach((p, i) => {
    const side = i % 2 ? 1 : -1;
    const group = new THREE.Group();
    group.position.set(side * 2.45, 0, -i * GAP);
    group.rotation.y = -side * 0.22;
    // a low table
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.08, 1.6), wood);
    top.position.y = 0.72;
    top.castShadow = top.receiveShadow = true;
    group.add(top);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.72, 0.07), wood); leg.position.set(a * 1.05, 0.36, b * 0.7); leg.castShadow = true; group.add(leg); });
    // folded lengths, one per colourway, repeated to make a stack
    const layers = 7;
    for (let k = 0; k < layers; k++) {
      // each layer is the product's print, dyed in one of its colourways
      const cw = p.colourways[k % p.colourways.length];
      const tex = loader.load(swatchURL(p.print, cw, 512), kick);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1.2, 0.84);
      tex.anisotropy = 8;
      const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 });
      const h = 0.085 + (k % 3) * 0.006;
      const piece = new THREE.Mesh(new RoundedBoxGeometry(1.55 - (k % 2) * 0.04, h, 1.08, 3, 0.035), mat);
      piece.position.set((Math.sin(k * 2.1) * 0.03), 0.76 + h / 2 + k * 0.091, Math.cos(k * 1.7) * 0.03);
      piece.rotation.y = Math.sin(k * 1.3) * 0.04;
      piece.castShadow = piece.receiveShadow = true;
      piece.userData.i = i;
      group.add(piece);
    }
    scene.add(group);
    stacks.push({ group, top: new THREE.Vector3(group.position.x, 0.76 + layers * 0.091 + 0.25, group.position.z) });
  });

  /* ---------- camera ---------- */
  const N = products.length;
  let progress = 0, camZ = 4, hovered = -1;
  const startZ = 4, endZ = -(N - 1) * GAP + 2.4;
  function layout() {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < 760 ? 58 : 42;
    camera.updateProjectionMatrix();
    kick();
  }
  const setProgress = (p) => { progress = p; kick(); };

  /* ---------- picking ---------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const pick = (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(scene.children, true).find((h) => h.object.userData.i != null);
    return hit ? hit.object.userData.i : -1;
  };
  const onMove = (e) => { const i = pick(e); if (i !== hovered) { hovered = i; canvas.style.cursor = i >= 0 ? 'pointer' : ''; onHover?.(i); } };
  const onClick = (e) => { const i = pick(e); if (i >= 0) onPick?.(i); };
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('click', onClick);

  const v = new THREE.Vector3();
  const screenOf = () => stacks.map((s) => {
    v.copy(s.top).project(camera);
    const dist = Math.abs(s.top.z - camera.position.z);
    return { x: (v.x * 0.5 + 0.5) * wrap.clientWidth, y: (-v.y * 0.5 + 0.5) * wrap.clientHeight, behind: v.z > 1 || s.top.z > camera.position.z - 0.6, dist };
  });

  let raf = 0, last = performance.now(), visible = true, dead = false, t = 0;
  const listeners = [];
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) kick(); });
  io.observe(wrap);
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); // rAF time can predate last
    last = now; t += dt;
    const goal = startZ + (endZ - startZ) * progress;
    camZ += (goal - camZ) * (1 - Math.pow(0.004, dt));
    // a slow walk: a little bob and a glance toward the nearer side
    const near = Math.round(Math.max(0, Math.min(N - 1, (startZ - camZ + 1.2) / GAP)));
    const look = near % 2 ? 0.5 : -0.5;
    camera.position.set(Math.sin(t * 0.5) * 0.05, 2.5 + Math.sin(t * 1.6) * 0.015, camZ + 0.6);
    camera.lookAt(look, 0.85, camZ - 4.2);
    sun.position.set(4, 9, camZ + 2); sun.target.position.set(0, 0, camZ - 4);
    // a page change can take the WebGL context away mid-frame: stop quietly rather than throw
    if (dead || renderer.getContext().isContextLost()) { raf = 0; return; }
    renderer.render(scene, camera);
    const pts = screenOf();
    listeners.forEach((fn) => fn(pts));
    const settling = Math.abs(goal - camZ) > 0.002;
    if (visible && !document.hidden && !dead && (settling || listeners.length)) raf = requestAnimationFrame(frame);
    else raf = 0;
  }
  function kick() { if (!raf && !dead) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  const onVis = () => !document.hidden && kick();
  document.addEventListener('visibilitychange', onVis);
  const ro = new ResizeObserver(layout);
  ro.observe(wrap);
  layout();
  frame(performance.now());
  canvas.classList.add('is-ready');

  return {
    setProgress,
    onFrame: (fn) => listeners.push(fn),
    dispose() {
      dead = true;
      cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      scene.traverse((o) => { o.geometry?.dispose(); [].concat(o.material || []).forEach((m) => { m.map?.dispose(); m.dispose?.(); }); });
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
