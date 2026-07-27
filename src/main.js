import * as THREE from 'three';
import { createSky } from './world/sky.js';
import { atmosphereAt, REGIONS, LINE, LINE_END } from './regions/index.js';
import { buildInkCountry } from './regions/inkCountry.js';
import { buildBusStop } from './regions/busStop.js';
import { createRain } from './world/rain.js';
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
  uInk:        { value: 0 },
  uPaper:      { value: new THREE.Color('#ece5d5').convertSRGBToLinear() },
  uInkTone:    { value: new THREE.Color('#12141c').convertSRGBToLinear() },
  uMist:       { value: 0 },
  uMistTop:    { value: 40 },
  uWet:        { value: 0 },
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

// --- the regions up the line ---
// The Bus Stop sits between the sea and the ink, because the route is ordered
// by how the land flows and rice country belongs between a coast and a mountain.
const bus = buildBusStop(shared);
scene.add(bus.group);

const ink = buildInkCountry(shared);
// built in its own coordinates, then slid down the line to make room
ink.group.position.z = REGIONS.find(r => r.id === 'ink').zNear + 1150;
scene.add(ink.group);

// --- weather ---
const rain = createRain(shared, { count: 9000 });
scene.add(rain.mesh);

// --- far country: headlands stacked into the haze ---
{
  const far = makePaintMaterial(shared, { color: '#39482a', shadowTint: '#16241a', rim: 0.55, bands: 2, grain: 0.1 });
  const far2 = makePaintMaterial(shared, { color: '#43512f', shadowTint: '#1a281c', rim: 0.6, bands: 2, grain: 0.1 });
  // low headlands, a long way out — the plain has to read as endless
  const ridges = [
    [-1560,  -820, 430,  62, far],
    [  980, -1020, 520,  74, far2],
    [ 2350,  -160, 360,  46, far],
    [-2950,   240, 400,  54, far2],
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
let hour = 0.44;
let currentRegion = null;
const coolA = new THREE.Color(0x2a3d63), coolB = new THREE.Color(0x38507c);

function applyAtmosphere(z) {
  const a = atmosphereAt(z, hour);

  shared.uHour.value = hour;
  shared.uZenith.value.copy(a.zenith);
  shared.uMidSky.value.copy(a.mid);
  shared.uHorizon.value.copy(a.horizon);
  shared.uSunTint.value.copy(a.sun);
  shared.uCloudAmt.value = a.cloud;
  shared.uSunDir.value.copy(a.sunDir);
  shared.uFogColor.value.copy(a.fog);
  shared.uFogDensity.value = a.fogDensity;
  shared.uInk.value = a.ink;
  shared.uPaper.value.copy(a.paper);
  shared.uInkTone.value.copy(a.inkTone);
  shared.uMist.value = a.mist;
  shared.uMistTop.value = a.mistTop;
  shared.uWet.value = a.wet;
  water.uniforms.uFogColor.value.copy(a.fog);
  grass.uniforms.uFogColor.value.copy(a.fog);

  // the one warm thing in view gets to paint itself onto the water, and which
  // one that is depends entirely on where you are
  if (a.wet > 0.5) {
    water.uniforms.uGlowA.value.copy(bus.lamp);
    water.uniforms.uGlowAr.value = 3.4;
  } else {
    water.uniforms.uGlowA.value.set(BATH.x, 58, BATH.z);
    water.uniforms.uGlowAr.value = 78;
  }

  post.kuwahara.uniforms.uExposure.value = a.exposure;
  post.finish.uniforms.uInkMode.value = a.ink;
  post.finish.uniforms.uPaper.value.copy(a.paper);
  post.finish.uniforms.uVignette.value = a.vignette;

  // lamps only mean anything where there are lamps
  const night = a.wet > 0.5 ? 1
    : (1 - THREE.MathUtils.smoothstep(hour, 0.15, 0.85)) * (1 - a.ink);
  if (a.wet > 0.5) {
    shared.uLamps.value[0].set(bus.lamp.x, bus.lamp.y, bus.lamp.z, 26);
    shared.uLampCols.value[0].setRGB(0.42, 0.26, 0.10);
  } else {
    shared.uLamps.value[0].set(rail.lampWorld.x, rail.lampWorld.y, rail.lampWorld.z, 16 * (1 - a.ink));
    shared.uLampCols.value[0].setRGB(0.26, 0.155, 0.062).multiplyScalar(0.55 + night * 1.1);
  }

  post.bloom.strength = (0.30 + night * 0.34) * a.bloom;
  post.finish.uniforms.uCool.value.copy(coolA).lerp(coolB, 1 - night);
  post.finish.uniforms.uSat.value = (1.08 + night * 0.13) * a.sat;

  if (a.region !== currentRegion) { currentRegion = a.region; showRegion(a.region); }
  seal.classList.toggle('show', a.ink > 0.55);
}

// the title card changes as the line changes
const sealEl = () => document.getElementById('seal');
const seal = sealEl();
const titleH = document.querySelector('#title h1');
const titleP = document.querySelector('#title p');
function showRegion(r) {
  titleEl.style.opacity = '0';
  setTimeout(() => {
    titleH.textContent = r.title;
    titleP.textContent = r.film + ' · ' + r.year;
    titleEl.style.opacity = '1';
    clearTimeout(showRegion._t);
    showRegion._t = setTimeout(() => { titleEl.style.opacity = '0'; }, 9000);
  }, 700);
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
  seat: 'window',
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

// off -> a window seat -> the roof -> off again
function rideNext() {
  if (state.mode !== 'ride') {
    state.mode = 'ride';
    state.seat = 'window';
    state.yaw = Math.PI / 2;       // looking out of the left-hand window
    state.pitch = 0.0;
    rideLabel(true, 'window seat');
  } else if (state.seat === 'window') {
    state.seat = 'roof';
    rideLabel(true, 'on the roof');
  } else {
    state.mode = 'free';
    state.pos.copy(camera.position);
    state.pos.x = 5.6; state.pos.y = 2.6;
    state.vel.set(0, 0, 0);
    rideLabel(false);
  }
  mark();
}

const rideEl = document.getElementById('ride');
function rideLabel(on, text) {
  rideEl.textContent = text ? text + ' — R to move, F to let go' : '';
  rideEl.classList.toggle('show', !!on);
}

// ===========================================================================
// The journey
//
// One number is the whole thing: where the train is on the line. It cruises
// down the line on its own, and the stop controls give it somewhere to be —
// which is what turns a world you can see one corner of into a line you can
// travel. When it reaches the end of what is laid, it runs back to the start,
// because the line is supposed to come round again.
// ===========================================================================
const CAR_PITCH = 18.6;              // one carriage plus its coupling

const line = {
  z: REGIONS[0].station,
  cruise: 34,
  speed: 34,
  target: null,
  warp: 0,                            // 0 cruising .. 1 running flat out
};
let stopIndex = 0;      // where the train actually is
let destIndex = null;   // where it is headed, while it is headed anywhere

function travelTo(i) {
  destIndex = ((i % REGIONS.length) + REGIONS.length) % REGIONS.length;
  line.target = REGIONS[destIndex].station;
  if (state.mode !== 'ride') {
    state.mode = 'ride';
    state.seat = 'window';
    state.yaw = Math.PI / 2;
    state.pitch = 0.0;
    rideLabel(true, 'window seat');
  }
  paintLine();
  mark();
}

// which built stop the train is closest to, so the map is never lying
function nearestStop(z) {
  let best = 0, bd = Infinity;
  REGIONS.forEach((r, i) => {
    const d = Math.abs(r.station - z);
    if (d < bd) { bd = d; best = i; }
  });
  return best;
}

function advanceLine(dt) {
  if (line.target !== null) {
    const d = line.target - line.z;
    const ad = Math.abs(d);
    if (ad < 3) {
      line.z = line.target; line.target = null; destIndex = null;
      line.speed = line.cruise; line.warp = 0;
    } else {
      // hard away, easy in — the last three hundred metres are a deceleration
      const want = Math.min(900, 45 + ad * 1.15);
      line.speed = THREE.MathUtils.lerp(line.speed, want, 1 - Math.pow(0.05, dt));
      line.z += Math.sign(d) * line.speed * dt;
      line.warp = THREE.MathUtils.clamp((line.speed - 90) / 700, 0, 1);
    }
  } else {
    line.z -= line.cruise * dt;
    line.warp = 0;
    if (line.z < LINE_END + 60) travelTo(0);       // round again
  }
  // the ride is smoother if the speed is felt rather than read
  const fov = 52 + line.warp * 13;
  if (Math.abs(camera.fov - fov) > 0.05) { camera.fov = fov; camera.updateProjectionMatrix(); }

  // The map tracks where YOU are — which is the train only while you are on it.
  // Watch the cinematic long enough and the train wanders off down the line;
  // the map should not follow it and claim you are somewhere you are not.
  const near = nearestStop(state.mode === 'ride' ? line.z : camera.position.z);
  if (near !== stopIndex) { stopIndex = near; paintLine(); }
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
  if (k === 'r') { rideNext(); return; }
  if (k === 'p') { togglePaint(); return; }
  const from = destIndex === null ? stopIndex : destIndex;
  if (k === 'n' || k === 'arrowright') { travelTo(from + 1); return; }
  if (k === 'b' || k === 'arrowleft') { travelTo(from - 1); return; }
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
  hour = timeSlider.value / 100;
  timeLabel.textContent = (NAMES.find(n => hour < n[0]) || NAMES[NAMES.length - 1])[1];
}
timeSlider.addEventListener('input', setHourFromSlider);

// ---- the line map: twenty-seven stops, and which of them are laid ----
const lineEl = document.getElementById('line');
const stopsEl = lineEl.querySelector('.stops');
const lineLblT = lineEl.querySelector('.lbl b');
const lineLblF = lineEl.querySelector('.lbl i');
const dots = LINE.map((s) => {
  const d = document.createElement('button');
  d.className = 'dot' + (s.built ? ' built' : '');
  d.style.left = ((s.n - 1) / (LINE.length - 1) * 100) + '%';
  d.title = s.built ? `${s.n}. ${s.title} — ${s.film}` : `${s.n}. ${s.title} — ${s.film} (up the line)`;
  if (s.built) d.addEventListener('click', () => travelTo(REGIONS.indexOf(s.built)));
  stopsEl.appendChild(d);
  return d;
});

function paintLine() {
  const here = REGIONS[stopIndex];
  const to = destIndex === null ? null : REGIONS[destIndex];
  dots.forEach((d, i) => {
    d.classList.toggle('now', LINE[i].built === here);
    d.classList.toggle('dest', !!to && to !== here && LINE[i].built === to);
  });
  const show = to && to !== here ? to : here;
  lineLblT.textContent = (to && to !== here ? '→ ' : '') + show.title;
  lineLblF.textContent = show.film + ' · ' + show.year;
}

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

setHourFromSlider();
setGrassFromSlider();
paintLine();
applyAtmosphere(0);

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(three.getDelta(), 0.05);
  clock += dt;
  shared.uTime.value = clock;
  post.finish.uniforms.uTime.value = clock;
  post.kuwahara.uniforms.uTime.value = clock;

  // ---- drop back into the cinematic after a while alone ----
  if (state.mode === 'free' && clock - state.lastInput > 16) goCine();

  advanceLine(dt);

  if (state.mode === 'ride') {
    // Dead centre of a carriage, not near its end — sit by the join and the
    // wall runs out a metre to your left and the window stops being a window.
    const z = line.z;
    const sway = Math.sin(clock * 2.7) * 0.014 + Math.sin(clock * 5.3) * 0.006;
    const bob  = Math.sin(clock * 3.9) * 0.020 + Math.sin(clock * 7.1) * 0.009;
    // half a mullion pitch off centre: sit level with one and it stands in the
    // middle of everything you look at
    if (state.seat === 'roof') camera.position.set(Math.sin(clock * 1.3) * 0.05, 6.55 + bob, z + CAR_PITCH);
    else                        camera.position.set(0.0, 3.50 + bob, z + 1.70);
    camera.quaternion.setFromEuler(new THREE.Euler(state.pitch, state.yaw, sway, 'YXZ'));
    shared.uLamps.value[2].set(-0.6, 4.5, z + 1.70, 5.5);
    shared.uLampCols.value[2].setRGB(0.130, 0.088, 0.045);
  } else if (state.mode === 'free') {
    shared.uLamps.value[2].w = 0;
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
    // The world is a line, not a disc. A circular leash round the origin let
    // you walk the first region and quietly dragged you back everywhere else.
    state.pos.x = THREE.MathUtils.clamp(state.pos.x, -1400, 1400);
    state.pos.z = THREE.MathUtils.clamp(state.pos.z, LINE_END - 400, REGIONS[0].zNear + 400);

    camera.position.copy(state.pos);
    camera.quaternion.setFromEuler(new THREE.Euler(state.pitch, state.yaw, 0, 'YXZ'));
  } else {
    shared.uLamps.value[2].w = 0;
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

  applyAtmosphere(camera.position.z);

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

  // ---- the train, wherever the journey has it ----
  const z = line.z;
  train.group.visible = true;
  train.group.position.set(0, 0, z);
  trainHead.set(0, 3.4, z - 9);
  water.uniforms.uGlowC.value.set(trainHead.x, 3.4, trainHead.z);
  water.uniforms.uGlowCr.value = 7.5;
  // the headlamp lights the line ahead — reach any further and it floods
  // the carriage the camera is sitting in, and the seat turns the colour of it
  shared.uLamps.value[1].set(trainHead.x, trainHead.y, trainHead.z, 30);
  shared.uLampCols.value[1].setRGB(0.22, 0.17, 0.10);
  window.__trainZ = z;

  // the plain has no edge — the mirror travels with you
  water.mesh.position.set(camera.position.x, 0, camera.position.z);
  rain.update(camera.position, shared.uWet.value);

  ink.update(clock);
  bus.update(clock);
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

// drop straight onto a stop without the run down the line
window.__stop = (i) => {
  travelTo(i);
  line.z = REGIONS[destIndex].station;
  stopIndex = destIndex; destIndex = null;
  line.target = null; line.warp = 0;
  paintLine();
  camera.fov = 52; camera.updateProjectionMatrix();
  return REGIONS[stopIndex].title;
};

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
