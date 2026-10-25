/* Printed lawn in WebGL. One cloth shader, two ways to hang it:
   'flag'  a length of lawn pinned along its left edge, rippling in a breeze; the pointer is the
           wind, pushing the cloth back where it passes and sending ripples out.
   'bolt'  a length hanging from the top whose lower part is still wound on a bolt; unroll(p)
           lets it down, the roll travelling down the screen as the fabric is revealed.
   The print is dyed in the shader from the shared masks, so setColourway() re-dyes it live. */

import * as THREE from 'three';
import { printMasks, DYE_GLSL } from '../core/prints.js';

const VERT = /* glsl */ `
  uniform float uTime, uGust, uMode, uUnroll, uSmall;
  uniform vec2 uWind, uSize;
  varying vec2 vUv; varying vec3 vN; varying vec3 vPos; varying float vShade;

  // a panel hanging from a rod in soft pleats; the breeze billows the hem, the pointer pushes it
  vec3 flag(vec2 p) {
    float s = clamp((uSize.y * 0.5 - p.y) / uSize.y, 0.0, 1.0); // 0 at the rod, 1 at the hem
    float t = uTime;
    float pleat = sin(p.x * 3.4 + sin(p.x * 1.3) * 0.8) * (0.1 + 0.12 * s);
    float billow = sin(p.x * 1.2 - t * 1.1 + s * 2.2) * 0.24 * s * s
                 + sin(p.x * 2.6 - t * 1.7 + s * 3.5) * 0.08 * s * (1.0 - uSmall);
    float z = pleat + billow + 0.12 * s * s * sin(t * 0.6);
    // the pointer is the wind
    vec2 d = p - uWind; float r = dot(d, d);
    z -= uGust * exp(-r * 0.6) * 0.55 * (0.15 + s);
    z += uGust * sin(sqrt(r) * 5.0 - t * 6.0) * exp(-r * 0.3) * 0.06 * s;
    float x = p.x + sin(t * 0.9 + p.y * 0.8) * 0.06 * s * s - pleat * 0.25;
    float y = p.y + (cos(p.x * 3.4) * 0.02 - 0.03) * s;
    return vec3(x, y, z);
  }

  // hanging from the top, the rest still wound on a bolt
  vec3 bolt(vec2 p) {
    float H = uSize.y;
    float d = H * 0.5 - p.y;                  // distance down from the top edge
    float Lu = max(0.001, uUnroll * H);       // how much has been let down
    float th = 0.012;                          // cloth thickness per turn
    float rc = 0.12;                           // cardboard core
    float Rout = sqrt(rc * rc + max(0.0, H - Lu) * th / 3.14159);
    if (d < Lu) {
      float sway = sin(p.x * 1.6 + uTime * 0.9) * 0.025 * (d / H) + sin(d * 3.0 - uTime * 1.2) * 0.012;
      return vec3(p.x, p.y, sway);
    }
    float s = d - Lu;
    float theta = s / max(0.05, Rout - th * 0.5);
    float r = max(rc, Rout - th * theta / 6.28318);
    float yc = H * 0.5 - Lu;
    return vec3(p.x, yc - r * sin(theta), Rout - r * cos(theta));
  }

  // a swatch draped over a rod: over the top, then falling either side in soft folds
  vec3 drape(vec2 p) {
    float r = 0.16, s = p.y, a = abs(s), arc = r * 1.5708;
    float sg = s < 0.0 ? -1.0 : 1.0;
    if (a <= arc) { float th = s / r; return vec3(p.x, r * cos(th), r * sin(th)); }
    float fall = a - arc;
    float folds = sin(p.x * 4.6 + sg * 1.3 + sin(p.x * 1.7) * 0.9) * 0.11 * smoothstep(0.0, 1.0, fall);
    float flare = fall * 0.09 + fall * fall * 0.02;
    float sway = sin(uTime * 0.9 + p.x * 0.8) * 0.02 * fall;
    return vec3(p.x + sin(p.x * 4.2) * 0.012 * fall, -fall, sg * (r + flare + folds) + sway);
  }

  vec3 shape(vec2 p) { return uMode < 0.5 ? flag(p) : uMode < 1.5 ? bolt(p) : drape(p); }

  void main() {
    vec2 p = position.xy;
    vec3 P = shape(p);
    float e = 0.012;
    vec3 tx = shape(p + vec2(e, 0.0)) - shape(p - vec2(e, 0.0));
    vec3 ty = shape(p + vec2(0.0, e)) - shape(p - vec2(0.0, e));
    vec3 n = normalize(cross(tx, ty));
    vN = normalize(normalMatrix * n);
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(P, 1.0);
    vPos = mv.xyz;
    vShade = P.z;
    gl_Position = projectionMatrix * mv;
  }`;

const FRAG = /* glsl */ `
  uniform sampler2D uMask; uniform vec3 uGround, uInk1, uInk2; uniform vec2 uRepeat; uniform float uWeave, uLight, uBackPale;
  varying vec2 vUv; varying vec3 vN; varying vec3 vPos; varying float vShade;
  ${DYE_GLSL}
  void main() {
    vec2 uv = vUv * uRepeat;
    vec3 base = dye(uv);
    vec3 N = normalize(vN);
    bool front = gl_FrontFacing;
    if (!front) { N = -N; base = mix(base, uGround, 0.55 * uBackPale); } // the reverse of a print is paler
    vec3 V = normalize(-vPos);
    vec3 L = normalize(vec3(0.75, 0.4, 0.55)); // light from the side shows the folds
    float diff = max(0.0, (dot(N, L) + 0.25) / 1.25);      // soft wrap lighting, like thin cotton
    float w = weave(uv, uWeave);
    float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    float spec = pow(max(dot(reflect(-L, N), V), 0.0), 16.0) * 0.08;
    vec3 col = base * (0.42 + 0.7 * diff) * (0.93 + 0.1 * w);
    col += base * fres * 0.22 + vec3(spec);
    col *= uLight;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }`;

export function clothMaterial({ print, colourway, repeat = [3, 2], weave = 90 }) {
  const tex = new THREE.CanvasTexture(printMasks(print));
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  const uniforms = {
    uMask: { value: tex },
    uGround: { value: new THREE.Color(colourway.ground) },
    uInk1: { value: new THREE.Color(colourway.ink1) },
    uInk2: { value: new THREE.Color(colourway.ink2) },
    uRepeat: { value: new THREE.Vector2(...repeat) },
    uWeave: { value: weave }, uLight: { value: 1 }, uBackPale: { value: 1 },
  };
  return { uniforms, tex };
}

export function mountCloth(canvas, { mode = 'flag', print, colourway, small = false, size = [7.2, 4.2], repeat = [3.2, 1.9] }) {
  const wrap = canvas.parentElement;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.5 : 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);

  const { uniforms, tex } = clothMaterial({ print, colourway, repeat });
  Object.assign(uniforms, {
    uTime: { value: 0 }, uGust: { value: 0 }, uMode: { value: { flag: 0, bolt: 1, drape: 2 }[mode] }, uUnroll: { value: 0.12 },
    uSmall: { value: small ? 1 : 0 }, uWind: { value: new THREE.Vector2(99, 99) }, uSize: { value: new THREE.Vector2(...size) },
  });
  const seg = small ? [110, 70] : [240, 150];
  const geo = new THREE.PlaneGeometry(size[0], size[1], seg[0], seg[1]);
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, side: THREE.DoubleSide });
  const cloth = new THREE.Mesh(geo, mat);
  cloth.frustumCulled = false;
  const rig = new THREE.Group();
  rig.add(cloth);
  scene.add(rig);
  if (mode === 'flag') {
    // pinned to a brass pole, turned a little so the ripples read in depth
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, size[0] + 0.7, 24), new THREE.MeshBasicMaterial({ color: '#a8885a' }));
    pole.rotation.z = Math.PI / 2;
    pole.position.y = size[1] / 2 + 0.02;
    rig.add(pole);
    [-1, 1].forEach((sg) => { const knob = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 14), new THREE.MeshBasicMaterial({ color: '#8f7247' })); knob.position.set(sg * (size[0] / 2 + 0.35), size[1] / 2 + 0.02, 0); rig.add(knob); });
    rig.rotation.set(0.05, -0.32, 0);
  }
  if (mode === 'drape') {
    uniforms.uBackPale.value = 0;
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, size[0] + 0.9, 40), new THREE.MeshBasicMaterial({ color: '#a8885a' }));
    rod.rotation.z = Math.PI / 2;
    rig.add(rod);
    rig.rotation.set(0.32, -0.6, 0);
  }

  // the bolt's cardboard core, kept at the centre of the roll
  let core = null;
  if (mode === 'bolt') {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, size[0] + 0.8, 24), new THREE.MeshBasicMaterial({ color: '#a8885a' }));
    rail.rotation.z = Math.PI / 2;
    rail.position.set(0, size[1] / 2 + 0.03, 0.02);
    scene.add(rail);
    core = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, size[0] + 0.5, 40, 1, true), new THREE.MeshBasicMaterial({ color: '#b89f7c', side: THREE.DoubleSide }));
    core.rotation.z = Math.PI / 2;
    scene.add(core);
    const capMat = new THREE.MeshBasicMaterial({ color: '#8a7456', side: THREE.DoubleSide });
    [-1, 1].forEach((sgn) => { const cap = new THREE.Mesh(new THREE.CircleGeometry(0.115, 32), capMat); cap.position.x = sgn * (size[0] / 2 + 0.25); cap.rotation.y = sgn * Math.PI / 2; core.add(cap); cap.position.set(0, sgn * (size[0] / 2 + 0.25), 0); cap.rotation.set(sgn * Math.PI / 2, 0, 0); });
  }

  function layout() {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // fit the cloth: flags fill the frame, bolts fit their height
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const tall = w / h < 1;
    if (mode === 'drape') {
      const d = (size[1] * 0.52) / Math.tan(vfov / 2);
      camera.position.set(0, -size[1] * 0.16, Math.max(d, (size[0] * 0.75) / Math.tan(vfov / 2) / camera.aspect));
      camera.lookAt(0, -size[1] * 0.18, 0);
      camera.updateProjectionMatrix();
      kick();
      return;
    }
    const fitH = (size[1] * (mode === 'bolt' ? 1.14 : tall ? 2.0 : 1.22)) / 2 / Math.tan(vfov / 2);
    const fitW = (size[0] * (mode === 'bolt' ? 1.05 : tall ? 1.1 : 2.1)) / 2 / Math.tan(vfov / 2) / camera.aspect;
    const dist = Math.max(fitH, fitW);
    // the flag sits to the right on wide screens (text on the left) and up top on phones
    const ox = mode === 'flag' && !tall ? -size[0] * 0.42 : 0, oy = mode === 'flag' ? (tall ? -size[1] * 0.42 : size[1] * 0.06) : 0;
    camera.position.set(ox, oy, dist);
    camera.lookAt(ox, oy, 0);
    camera.updateProjectionMatrix();
    kick();
  }

  /* ---------- the pointer as wind ---------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit = new THREE.Vector3();
  const windTarget = new THREE.Vector2(99, 99);
  let gust = 0, lastX = 0, lastY = 0, speed = 0;
  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    if (e.clientY < r.top || e.clientY > r.bottom) return;
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (ray.ray.intersectPlane(plane, hit)) windTarget.set(hit.x, hit.y);
    speed = Math.min(1, speed + Math.hypot(e.clientX - lastX, e.clientY - lastY) / 120);
    lastX = e.clientX; lastY = e.clientY;
    kick();
  };
  addEventListener('pointermove', onMove, { passive: true });
  let yaw = mode === 'drape' ? -0.6 : 0, yawGoal = yaw, drag = null;
  const onDown = (e) => { if (mode !== 'drape') return; drag = { x: e.clientX, y: yawGoal }; canvas.setPointerCapture?.(e.pointerId); };
  const onDrag = (e) => { if (!drag) return; yawGoal = drag.y + (e.clientX - drag.x) * 0.008; kick(); };
  const onUp = () => { drag = null; };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onDrag);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  let raf = 0, last = performance.now(), visible = true, dead = false;
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) kick(); });
  io.observe(wrap);
  let unrollGoal = 0.12;
  const goalColours = { g: uniforms.uGround.value.clone(), a: uniforms.uInk1.value.clone(), b: uniforms.uInk2.value.clone() };
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); // rAF time can predate last
    last = now;
    uniforms.uTime.value += dt;
    speed *= Math.pow(0.25, dt);
    gust += (speed - gust) * (1 - Math.pow(0.02, dt));
    uniforms.uGust.value = gust;
    uniforms.uWind.value.lerp(windTarget, 1 - Math.pow(0.002, dt));
    uniforms.uUnroll.value += (unrollGoal - uniforms.uUnroll.value) * (1 - Math.pow(0.01, dt));
    // live re-dye: ease each colour toward its new value
    const k = 1 - Math.pow(0.004, dt);
    uniforms.uGround.value.lerp(goalColours.g, k);
    uniforms.uInk1.value.lerp(goalColours.a, k);
    uniforms.uInk2.value.lerp(goalColours.b, k);
    if (mode === 'drape') { if (!drag) yawGoal += dt * 0.08; yaw += (yawGoal - yaw) * (1 - Math.pow(0.01, dt)); rig.rotation.y = yaw; }
    if (core) {
      const H = size[1], Lu = Math.max(0.001, uniforms.uUnroll.value * H);
      const Rout = Math.sqrt(0.12 * 0.12 + Math.max(0, H - Lu) * 0.012 / Math.PI);
      core.position.set(0, H / 2 - Lu, Rout);
      core.rotation.x = -(Lu / Math.max(0.05, Rout)); // turns as it rolls
    }
    // a page change can take the WebGL context away mid-frame: stop quietly rather than throw
    if (dead || renderer.getContext().isContextLost()) { raf = 0; return; }
    renderer.render(scene, camera);
    if (visible && !document.hidden && !dead) raf = requestAnimationFrame(frame);
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
    unroll(p) { unrollGoal = 0.12 + p * 0.88; kick(); },
    setColourway(cw) { goalColours.g.set(cw.ground); goalColours.a.set(cw.ink1); goalColours.b.set(cw.ink2); kick(); },
    setPrint(id) { tex.image = printMasks(id); tex.needsUpdate = true; kick(); },
    dispose() {
      dead = true;
      cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect();
      removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVis);
      scene.traverse((o) => { o.geometry?.dispose(); [].concat(o.material || []).forEach((m) => m.dispose?.()); });
      tex.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
