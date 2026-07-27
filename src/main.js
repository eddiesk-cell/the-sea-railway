import * as THREE from 'three';
import { createSky, samplePalette, sunDirection } from './world/sky.js';
import { createWater } from './world/water.js';
import { createBathhouse } from './world/bathhouse.js';
import { createRailway, createTrain } from './world/railway.js';
import { createSpirits, createLanterns, createSteam, createDragon, createReeds } from './world/spirits.js';
import { makePaintMaterial } from './world/paintMaterial.js';
import { hill, box, curvedRoof, mulberry, fillInstances } from './world/geo.js';
import { createGrass, MAX_BLADES } from './world/grass.js';
import { createForest } from './world/trees.js';
import { createPost } from './post/painterly.js';

// ===========================================================================
// One evening on the sea railway.
// ===========================================================================

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({
  canvas, antialias: false, powerPreference: 'high-performance', stencil: false,
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;   // the paint pass does its own

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.12, 6000);

// --- uniforms every material in the world shares, so nothing can disagree ---
const shared = {
  uTime:       { value: 0 },
  uSunDir:     { value: new THREE.Vector3(0, 0.06, 1) },
  uHour:       { value: 0.62 },
  uZenith:     { value: new THREE.Vector3() },
  uMidSky:     { value: new THREE.Vector3() },
  uHorizon:    { value: new THREE.Vector3() },
  uSunTint:    { value: new THREE.Vector3() },
  uCloudAmt:   { value: 0.84 },
  uFogColor:   { value: new THREE.Vector3(0.5, 0.5, 0.55) },
  uFogDensity: { value: 0.00045 },
  uCamPos:     { value: new THREE.Vector3() },
  uLamps:      { value: [new THREE.Vector4(0, 0, 0, 0), new THREE.Vector4(0, 0, 0, 0), new THREE.Vector4(0, 0, 0, 0)] },
  uLampCols:   { value: [new THREE.Color(0, 0, 0), new THREE.Color(0, 0, 0), new THREE.Color(0, 0, 0)] },
};

// --- sky ---
const sky = createSky();
scene.add(sky.mesh);

// --- water ---
const water = createWater(shared);
scene.add(water.mesh);

// --- the bathhouse across the water ---
const BATH = new THREE.Vector3(-268, 0, -198);
const bath = createBathhouse(shared, { position: BATH, rotation: 0.52 });
bath.group.scale.setScalar(1.22);
scene.add(bath.group);
water.uniforms.uGlowA.value.set(BATH.x, 58, BATH.z);
water.uniforms.uGlowAr.value = 78;

const steam = createSteam(shared, new THREE.Vector3(BATH.x - 34, 40, BATH.z - 30));
scene.add(steam.mesh);

// --- the line, the platform, the train ---
const rail = createRailway(shared);
scene.add(rail.group);
water.uniforms.uGlowB.value.copy(rail.lampWorld);

const train = createTrain(shared);
scene.add(train.group);

// --- the living things ---
const spirits = createSpirits(shared);
scene.add(spirits.group);
const lanterns = createLanterns(shared);
scene.add(lanterns.group);
const dragon = createDragon(shared);
scene.add(dragon.mesh);
const reeds = createReeds(shared);
scene.add(reeds.mesh);

// --- the field: millions of blades, one draw call, no stored positions ---
const grass = createGrass(shared, { count: 1_600_000 });
scene.add(grass.mesh);

// --- far country: headlands stacked into the haze ---
{
  const far = makePaintMaterial(shared, { color: '#39482a', shadowTint: '#16241a', rim: 0.55, bands: 2, grain: 0.1 });
  const far2 = makePaintMaterial(shared, { color: '#43512f', shadowTint: '#1a281c', rim: 0.6, bands: 2, grain: 0.1 });
  // low headlands, a long way out — the plain has to read as endless
  const ridges = [
    [-1420, -2600, 430,  62, far],
    [  640, -3050, 520,  74, far2],
    [ 2350, -2350, 360,  46, far],
    [-2950, -1750, 400,  54, far2],
  ];
  ridges.forEach(([x, z, r, h, m], i) => {
    const mesh = new THREE.Mesh(hill(r, h, 30 + i, { rough: 0.5, rings: 14, sectors: 22 }), m);
    mesh.position.set(x, -10, z);
    scene.add(mesh);
  });
  // a wooded shoulder for the bathhouse to sit against, not a dome behind it
  const shoulders = [
    { at: new THREE.Vector3(BATH.x - 235, -10, BATH.z - 290), r: 262, h: 52, seed: 5, mat: far2 },
    { at: new THREE.Vector3(BATH.x + 250, -10, BATH.z - 235), r: 205, h: 38, seed: 9, mat: far },
  ];
  shoulders.forEach(({ at, r, h, seed, mat }) => {
    const m = new THREE.Mesh(hill(r, h, seed, { rough: 0.52 }), mat);
    m.position.copy(at);
    scene.add(m);
  });

  // a wood: firs, broadleaves, wind-shaped pines, blossom and bamboo
  const forest = createForest(shared, shoulders.map(({ at, r, h }) => ({ at, r, h })));
  scene.add(forest.group);
  window.__trees = forest.count;

  // the grass needs to know where the land is, and it uses the same dome
  // formula the trees are planted with, so wood and meadow sit on one surface
  const land = [
    ...shoulders.map(({ at, r, h }) => [at.x, at.z, r * 0.94, h]),
    ...ridges.map(([x, z, r, h]) => [x, z, r * 0.94, h]),
  ].slice(0, 6);
  land.forEach(([x, z, r, h], i) => grass.uniforms.uHills.value[i].set(x, z, r, h));
}

// --- a torii standing in the shallows, close enough to touch ---
{
  const red = makePaintMaterial(shared, { color: '#a8302a', shadowTint: '#3a1020', rim: 1.5, bands: 3, grain: 0.2, grainScale: 1.4 });
  const dark = makePaintMaterial(shared, { color: '#241018', shadowTint: '#0b0812', rim: 1.2, bands: 3, grain: 0.2 });
  const t = new THREE.Group();
  t.position.set(-27, 0, -20);
  t.rotation.y = 0.68;
  t.scale.setScalar(1.35);
  for (const sx of [-4.6, 4.6]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.56, 12, 12), red);
    leg.position.set(sx, 5.4, 0);
    t.add(leg);
  }
  const lintel = new THREE.Mesh(box(14.6, 0.8, 1.1), dark);
  lintel.position.y = 11.6; t.add(lintel);
  const lintel2 = new THREE.Mesh(box(16.6, 1.0, 1.35), red);
  lintel2.position.y = 12.7; t.add(lintel2);
  const cap = new THREE.Mesh(curvedRoof(18.4, 2.4, 0.9, { seg: 10, power: 1.5, corner: 0.5, flare: 0.35 }), dark);
  cap.position.y = 13.2; t.add(cap);
  const post = new THREE.Mesh(box(0.7, 1.5, 0.8), red);
  post.position.y = 12.0; t.add(post);
  scene.add(t);
}

// --- post ---
const post = createPost(renderer, scene, camera);

// ===========================================================================
// Time of day
// ===========================================================================
const fogV = new THREE.Vector3();
function applyHour(h) {
  const p = samplePalette(h);
  shared.uHour.value = h;
  shared.uZenith.value.copy(p.zenith);
  shared.uMidSky.value.copy(p.mid);
  shared.uHorizon.value.copy(p.horizon);
  shared.uSunTint.value.copy(p.sun);
  shared.uCloudAmt.value = p.cloud;
  shared.uSunDir.value.copy(sunDirection(p));
  fogV.copy(p.fog);
  shared.uFogColor.value.copy(fogV);
  water.uniforms.uFogColor.value.copy(fogV);
  grass.uniforms.uFogColor.value.copy(fogV);
  post.kuwahara.uniforms.uExposure.value = p.exposure;

  // the world's few real lamps get brighter as the light goes
  const night = 1 - THREE.MathUtils.smoothstep(h, 0.15, 0.85);
  shared.uLamps.value[0].set(rail.lampWorld.x, rail.lampWorld.y, rail.lampWorld.z, 16);
  shared.uLampCols.value[0].setRGB(0.26, 0.155, 0.062).multiplyScalar(0.55 + night * 1.1);

  post.bloom.strength = 0.30 + night * 0.34;
  post.finish.uniforms.uCool.value.setHex(0x2a3d63).lerp(new THREE.Color(0x38507c), 1 - night);
  post.finish.uniforms.uSat.value = 1.08 + night * 0.13;
}

// ===========================================================================
// Camera: a long cinematic drift you can step out of at any time
// ===========================================================================
const CINE_POS = new THREE.CatmullRomCurve3([
  new THREE.Vector3(  12,  3.0,   46),
  new THREE.Vector3( -26,  6.5,    2),
  new THREE.Vector3( -88,  4.2,  -62),
  new THREE.Vector3(-140, 14.0, -138),
  new THREE.Vector3( -52, 26.0, -196),
  new THREE.Vector3(  46, 11.0, -178),
  new THREE.Vector3(  74,  4.0,  -74),
  new THREE.Vector3(  34,  2.6,   16),
], true, 'catmullrom', 0.5);

const CINE_LOOK = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-110,  30, -250),
  new THREE.Vector3(-190,  36, -230),
  new THREE.Vector3(-268,  44, -220),
  new THREE.Vector3(-300,  52, -215),
  new THREE.Vector3(-300,  40, -215),
  new THREE.Vector3(-150,  22, -260),
  new THREE.Vector3(   6,   8, -520),
  new THREE.Vector3( -60,  18, -300),
], true, 'catmullrom', 0.5);

const CINE_PERIOD = 230;   // seconds for one full pass

const state = {
  mode: 'cine',
  yaw: 0, pitch: 0,
  pos: new THREE.Vector3(5.4, 2.55, 26),
  vel: new THREE.Vector3(),
  lastInput: -1e9,
  blend: 1,          // 1 = fully cinematic
  keys: new Set(),
};

const cinePos = new THREE.Vector3(), cineLook = new THREE.Vector3();
const frozenPos = new THREE.Vector3(), frozenQuat = new THREE.Quaternion();
const tmpQuat = new THREE.Quaternion(), tmpMat = new THREE.Matrix4();
const UP = new THREE.Vector3(0, 1, 0);

function cineAt(t) {
  const u = (t / CINE_PERIOD) % 1;
  CINE_POS.getPointAt(u, cinePos);
  CINE_LOOK.getPointAt(u, cineLook);
  cinePos.y += Math.sin(t * 0.21) * 0.9 + Math.sin(t * 0.13 + 2.0) * 0.5;
}

function goFree() {
  if (state.mode === 'free') return;
  state.mode = 'free';
  state.pos.copy(camera.position);
  const e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
  state.yaw = e.y; state.pitch = e.x;
  state.vel.set(0, 0, 0);
}

function goCine() {
  if (state.mode === 'cine') return;
  state.mode = 'cine';
  state.blend = 0;
  frozenPos.copy(camera.position);
  frozenQuat.copy(camera.quaternion);
}

// ---- pointer ----
let dragging = false, lastX = 0, lastY = 0, pointers = new Map();
const touchMove = { fwd: 0, side: 0, active: false };

canvas.addEventListener('pointerdown', (e) => {
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 1) { dragging = true; lastX = e.clientX; lastY = e.clientY; }
  if (pointers.size === 2) { dragging = false; touchMove.active = true; }
  canvas.setPointerCapture(e.pointerId);
  mark();
});
canvas.addEventListener('pointermove', (e) => {
  if (!pointers.has(e.pointerId)) return;
  const prev = pointers.get(e.pointerId);
  const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
  prev.x = e.clientX; prev.y = e.clientY;

  if (pointers.size === 1 && dragging) {
    goFree(); mark();
    state.yaw -= dx * 0.0026;
    state.pitch = THREE.MathUtils.clamp(state.pitch - dy * 0.0024, -1.25, 1.05);
  } else if (pointers.size === 2 && touchMove.active) {
    goFree(); mark();
    touchMove.fwd = THREE.MathUtils.clamp(-dy * 0.06, -1, 1);
    touchMove.side = THREE.MathUtils.clamp(dx * 0.06, -1, 1);
  }
});
const endPointer = (e) => {
  pointers.delete(e.pointerId);
  if (pointers.size === 0) { dragging = false; touchMove.active = false; touchMove.fwd = 0; touchMove.side = 0; }
};
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('wheel', (e) => {
  goFree(); mark();
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  state.pos.addScaledVector(dir, -e.deltaY * 0.045);
  e.preventDefault();
}, { passive: false });

// ---- keys ----
const helpEl = document.getElementById('help');
addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'h') { helpEl.classList.toggle('hidden'); return; }
  if (k === 'f') { state.mode === 'cine' ? goFree() : goCine(); mark(); return; }
  if (k === 'p') { togglePaint(); return; }
  state.keys.add(k);
  if ('wasdqe c'.includes(k) || k === ' ' || k === 'shift') { goFree(); mark(); }
});
addEventListener('keyup', (e) => state.keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => state.keys.clear());

function mark() { state.lastInput = clock; hintSeen(); }

// ===========================================================================
// UI
// ===========================================================================
let paintOn = true;
const paintToggle = document.getElementById('t-paint');
function togglePaint() {
  paintOn = !paintOn;
  paintToggle.classList.toggle('on', paintOn);
  post.kuwahara.uniforms.uStrength.value = paintOn ? 1 : 0;
  post.finish.uniforms.uPaint.value = paintOn ? 1 : 0;
  post.finish.uniforms.uVignette.value = paintOn ? 0.55 : 0.3;
}
paintToggle.addEventListener('click', togglePaint);

const grassSlider = document.getElementById('s-grass');
const grassLabel = document.getElementById('v-grass');
function setGrassFromSlider() {
  // a gentle curve, so the low end is still adjustable
  const t = grassSlider.value / 100;
  const n = Math.round(MAX_BLADES * Math.pow(t, 1.35));
  grass.setCount(n);
  grassLabel.textContent = n >= 1e6 ? (n / 1e6).toFixed(2) + ' M'
                         : n >= 1e3 ? Math.round(n / 1e3) + ' K' : String(n);
}
grassSlider.addEventListener('input', setGrassFromSlider);

const fpsLabel = document.getElementById('v-fps');

const timeSlider = document.getElementById('s-time');
const timeLabel = document.getElementById('v-time');
const NAMES = [[0.13, 'night'], [0.27, 'late blue'], [0.39, 'blue hour'], [0.72, 'dusk'], [0.90, 'evening'], [1.01, 'afternoon']];
function setHourFromSlider() {
  const h = timeSlider.value / 100;
  applyHour(h);
  timeLabel.textContent = (NAMES.find(n => h < n[0]) || NAMES[NAMES.length - 1])[1];
}
timeSlider.addEventListener('input', setHourFromSlider);

const hintEl = document.getElementById('hint');
const titleEl = document.getElementById('title');
let hintTimer = null, hinted = false;
function hintSeen() {
  if (hinted) return;
  hinted = true;
  hintEl.classList.remove('show');
}
setTimeout(() => { if (!hinted) hintEl.classList.add('show'); }, 4200);
setTimeout(() => { hintEl.classList.remove('show'); }, 15000);
void hintTimer;

// ===========================================================================
// Loop
// ===========================================================================
const three = new THREE.Clock();
let clock = 0;
const fwd = new THREE.Vector3(), right = new THREE.Vector3();
const trainHead = new THREE.Vector3();

applyHour(0.62);
setHourFromSlider();
setGrassFromSlider();

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(three.getDelta(), 0.05);
  clock += dt;
  shared.uTime.value = clock;
  post.finish.uniforms.uTime.value = clock;
  post.kuwahara.uniforms.uTime.value = clock;

  // ---- drop back into the cinematic after a while alone ----
  if (state.mode === 'free' && clock - state.lastInput > 16) goCine();

  if (state.mode === 'free') {
    const sp = (state.keys.has('shift') ? 46 : 15);
    fwd.set(0, 0, -1).applyEuler(new THREE.Euler(state.pitch, state.yaw, 0, 'YXZ'));
    right.set(1, 0, 0).applyEuler(new THREE.Euler(0, state.yaw, 0, 'YXZ'));
    const acc = new THREE.Vector3();
    if (state.keys.has('w')) acc.add(fwd);
    if (state.keys.has('s')) acc.sub(fwd);
    if (state.keys.has('d')) acc.add(right);
    if (state.keys.has('a')) acc.sub(right);
    if (state.keys.has(' ')) acc.y += 1;
    if (state.keys.has('c')) acc.y -= 1;
    if (touchMove.active) { acc.addScaledVector(fwd, touchMove.fwd); acc.addScaledVector(right, touchMove.side); }
    if (acc.lengthSq() > 0) acc.normalize().multiplyScalar(sp);
    state.vel.lerp(acc, 1 - Math.pow(0.0016, dt));
    state.pos.addScaledVector(state.vel, dt);

    state.pos.y = Math.max(state.pos.y, 0.62);
    state.pos.y = Math.min(state.pos.y, 320);
    const flat = Math.hypot(state.pos.x, state.pos.z + 120);
    if (flat > 1500) { state.pos.x *= 1500 / flat; state.pos.z = (state.pos.z + 120) * (1500 / flat) - 120; }

    camera.position.copy(state.pos);
    camera.quaternion.setFromEuler(new THREE.Euler(state.pitch, state.yaw, 0, 'YXZ'));
  } else {
    cineAt(clock * 1.0);
    tmpMat.lookAt(cinePos, cineLook, UP);
    tmpQuat.setFromRotationMatrix(tmpMat);
    if (state.blend < 1) {
      state.blend = Math.min(1, state.blend + dt / 2.6);
      const k = state.blend * state.blend * (3 - 2 * state.blend);
      camera.position.lerpVectors(frozenPos, cinePos, k);
      camera.quaternion.copy(frozenQuat).slerp(tmpQuat, k);
    } else {
      camera.position.copy(cinePos);
      camera.quaternion.copy(tmpQuat);
    }
  }

  shared.uCamPos.value.copy(camera.position);
  water.uniforms.uCamPos.value.copy(camera.position);
  grass.uniforms.uCamXZ.value.set(camera.position.x, camera.position.z);
  sky.mesh.position.copy(camera.position);
  sky.uniforms.uTime.value = clock;
  sky.uniforms.uSunDir.value.copy(shared.uSunDir.value);
  sky.uniforms.uHour.value = shared.uHour.value;
  sky.uniforms.uZenith.value.copy(shared.uZenith.value);
  sky.uniforms.uMidSky.value.copy(shared.uMidSky.value);
  sky.uniforms.uHorizon.value.copy(shared.uHorizon.value);
  sky.uniforms.uSunTint.value.copy(shared.uSunTint.value);
  sky.uniforms.uCloudAmt.value = shared.uCloudAmt.value;

  // ---- the train ----
  const CYCLE = 150, RUN = 74;
  const tt = clock % CYCLE;
  if (tt < RUN) {
    const u = tt / RUN;
    const z = 980 - u * 2560;
    train.group.visible = true;
    train.group.position.set(0, 0, z);
    trainHead.set(0, 3.4, z - 9);
    water.uniforms.uGlowC.value.set(trainHead.x, 3.4, trainHead.z);
    water.uniforms.uGlowCr.value = 7.5;
    shared.uLamps.value[1].set(trainHead.x, trainHead.y, trainHead.z, 48);
    shared.uLampCols.value[1].setRGB(0.26, 0.20, 0.12);
  } else {
    train.group.visible = false;
    water.uniforms.uGlowC.value.set(0, -999, 0);
    shared.uLamps.value[1].set(0, 0, 0, 0);
  }

  spirits.update(clock);
  lanterns.update(clock);
  steam.update(clock);
  dragon.update(clock);

  post.composer.render(dt);

  // ---- rolling frame rate, and back off resolution if the brush is too dear ----
  fpsN++;
  if (clock - fpsT > 0.4) {
    const fps = Math.round(fpsN / (clock - fpsT));
    window.__fps = fps;
    fpsLabel.textContent = fps + ' fps';
    fpsN = 0; fpsT = clock;
    if (clock > 3) {
      if (fps < 40 && dprStep > 0) { dprStep--; applyDpr(); }
      else if (fps > 75 && dprStep < DPRS.length - 1 && clock - lastDprChange > 8) { dprStep++; applyDpr(); }
    }
  }
}
let fpsN = 0, fpsT = 0, lastDprChange = 0;
const DPRS = [1.0, 1.35, Math.min(devicePixelRatio, 2)];
let dprStep = DPRS.length - 1;
function applyDpr() {
  lastDprChange = clock;
  const r = DPRS[dprStep];
  renderer.setPixelRatio(r);
  renderer.setSize(innerWidth, innerHeight, false);
  post.setSize(innerWidth, innerHeight, r);
}

// jump the clock, for checking things that only happen sometimes
window.__jump = (t) => { clock = t; };

// ===========================================================================
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  applyDpr();
});

window.__cam = camera;
// Real GPU time for one frame, via a timer query — a wall-clock loop around
// render() only measures how fast the commands were *queued*, which on this
// driver comes back as a number too good to be true.
window.__bench = (n = 30) => new Promise((resolve) => {
  const gl = renderer.getContext();
  const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  if (!ext) { resolve({ error: 'no timer query extension' }); return; }
  const q = gl.createQuery();
  gl.beginQuery(ext.TIME_ELAPSED_EXT, q);
  for (let i = 0; i < n; i++) post.composer.render(1 / 60);
  gl.endQuery(ext.TIME_ELAPSED_EXT);
  const poll = () => {
    if (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) { setTimeout(poll, 12); return; }
    const ms = gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6 / n;
    gl.deleteQuery(q);
    resolve({ blades: grass.count, trees: window.__trees, gpuMsPerFrame: +ms.toFixed(2),
              fps: Math.round(1000 / ms), calls: renderer.info.render.calls,
              triangles: renderer.info.render.triangles,
              px: [renderer.domElement.width, renderer.domElement.height] });
  };
  poll();
});

// a hook for parking the camera on an exact frame while tuning the look
window.__view = (px, py, pz, lx, ly, lz) => {
  goFree();
  state.pos.set(px, py, pz);
  const m = new THREE.Matrix4().lookAt(new THREE.Vector3(px, py, pz), new THREE.Vector3(lx, ly, lz), UP);
  const e = new THREE.Euler().setFromRotationMatrix(m, 'YXZ');
  state.yaw = e.y; state.pitch = e.x;
  state.lastInput = 1e9;   // stay put
};

// first frame, then lift the curtain
renderer.compile(scene, camera);
frame();
requestAnimationFrame(() => {
  setTimeout(() => {
    document.getElementById('load').classList.add('done');
    titleEl.style.opacity = '1';
  }, 260);
});
setTimeout(() => { titleEl.style.opacity = '0.0'; }, 14000);
