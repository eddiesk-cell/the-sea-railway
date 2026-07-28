import * as THREE from 'three';
import { createSky } from './world/sky.js';
import { atmosphereAt, REGIONS, LINE, LINE_END, BLEND } from './regions/index.js';
import { buildInkCountry } from './regions/inkCountry.js';
import { buildBusStop } from './regions/busStop.js';
import { buildDrownedRoad } from './regions/drownedRoad.js';
import { buildKoriko } from './regions/koriko.js';
import { buildCedarForest } from './regions/cedarForest.js';
import { buildMeadow } from './regions/meadow.js';
import { buildValley } from './regions/valley.js';
import { buildLaputa } from './regions/laputa.js';
import { buildIronTown } from './regions/ironTown.js';
import { buildMarketChipping } from './regions/marketChipping.js';
import { buildSlagRavine } from './regions/slagRavine.js';
import { buildMarshHouse } from './regions/marshHouse.js';
import { buildPoppyHill } from './regions/poppyHill.js';
import { buildHiddenCove } from './regions/hiddenCove.js';
import { buildOceanWaves } from './regions/oceanWaves.js';
import { buildHillside } from './regions/hillside.js';
import { buildSafflower } from './regions/safflower.js';
import { buildTamaHills } from './regions/tamaHills.js';
import { buildTheRotary } from './regions/theRotary.js';
import { buildCatBureau } from './regions/catBureau.js';
import { buildTheGarden } from './regions/theGarden.js';
import { buildHortTown } from './regions/hortTown.js';
import { buildCrookedHouse } from './regions/crookedHouse.js';
import { buildMeadow1920 } from './regions/meadow1920.js';
import { buildTheTower } from './regions/theTower.js';
import { buildTheSketch } from './regions/theSketch.js';
import { createPlaces, placesNear, placeAt, groundAt, PLACE_COUNT } from './places/index.js';
import { createLife } from './world/life.js';
import { POPULATIONS } from './world/populations.js';
import { createRain } from './world/rain.js';
import { createSound, windAt } from './world/sound.js';
import { createWater } from './world/water.js';
import { createBathhouse } from './world/bathhouse.js';
import { createRailway, createTrain } from './world/railway.js';
import { createSpirits, createLanterns, createSteam, createDragon, createReeds } from './world/spirits.js';
import { makePaintMaterial } from './world/paintMaterial.js';
import { hill, box, curvedRoof, mulberry, fillInstances } from './world/geo.js';
import { createGrass, MAX_BLADES } from './world/grass.js';
import { createForest } from './world/trees.js';
import { nearShore, SHORE_CROWDS } from './world/nearshore.js';
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
  uWind:       { value: 0.7 },
  uDeckY:      { value: new THREE.Vector3(0, 0, 0) },
  uDeckH:      { value: new THREE.Vector3(0, 0, 0) },
  uDeckAmt:    { value: 0 },
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
// A dozen countries is far too much to build before the first frame, so each
// is made the first time the line comes near it and then kept. `shift` slides
// a region's geometry from the coordinates it was authored in to its place in
// the running order, which is what lets the order change without touching a
// builder.
const BUILDERS = {
  drowned: () => buildDrownedRoad(shared),
  marsh:   () => buildMarshHouse(shared),
  poppy:   () => buildPoppyHill(shared),
  koriko:  () => buildKoriko(shared),
  cove:    () => buildHiddenCove(shared),
  ocean:   () => buildOceanWaves(shared),
  hillside:() => buildHillside(shared),
  safflower: () => buildSafflower(shared),
  tama:    () => buildTamaHills(shared),
  rotary:  () => buildTheRotary(shared),
  cats:    () => buildCatBureau(shared),
  garden:  () => buildTheGarden(shared),
  hort:    () => buildHortTown(shared),
  crooked: () => buildCrookedHouse(shared),
  wind1920:() => buildMeadow1920(shared),
  tower:   () => buildTheTower(shared),
  sketch:  () => buildTheSketch(shared),
  bus:     () => buildBusStop(shared),
  ink:     () => buildInkCountry(shared),
  cedar:   () => buildCedarForest(shared),
  iron:    () => buildIronTown(shared),
  meadow:  () => buildMeadow(shared),
  market:  () => buildMarketChipping(shared),
  valley:  () => buildValley(shared),
  slag:    () => buildSlagRavine(shared),
  laputa:  () => buildLaputa(shared),
};
const live = new Map();

// --- where all the land in the world is -----------------------------------
// The grass field can only grow on ground it knows about, and for a long time
// it knew about exactly one country's hills — which is why twenty-six of them
// were bare plates with a lawn floating over the middle of the track. Every
// dome in the world is built by hill(), and hill() now writes its own shape
// onto the geometry, so a region can simply be walked when it is created and
// asked what land it brought with it. Nothing is hand-listed and nothing can
// fall out of step with the ground it describes.
const LAND = [];
const PADS = [];
const landCache = new THREE.Vector3(1e9, 0, 1e9);
const tmpBox = new THREE.Box3(), tmpSize = new THREE.Vector3(), tmpMid = new THREE.Vector3();
function harvestLand(group) {
  group.updateWorldMatrix(true, true);
  const p = new THREE.Vector3();
  group.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    const d = o.geometry.userData.hill;
    if (d) {
      o.getWorldPosition(p);
      // r * 0.94: the rim of a dome is where it meets the water or the flat,
      // and grass standing on the last few metres of it stands on a cliff.
      LAND.push({ x: p.x, z: p.z, y: p.y, r: d.r * 0.94, h: d.h, rough: d.rough, off: d.off });
      return;
    }
    // Half the countries are not built on domes at all — a town stands on a
    // flat shelf, and a shelf is just a very wide box. Rather than have every
    // region declare "this one is the ground", the shape gives it away: a
    // horizontal slab sixty metres across is a floor and nothing else is. So
    // any big flat top gets a lawn, and a region written next year gets one
    // without knowing this code exists.
    if (o.isInstancedMesh) return;
    tmpBox.setFromObject(o);
    tmpBox.getSize(tmpSize);
    if (tmpSize.x < 55 || tmpSize.z < 55 || tmpSize.y > 26) return;
    tmpBox.getCenter(tmpMid);
    PADS.push({ x: tmpMid.x, z: tmpMid.z, y: tmpBox.max.y, hx: tmpSize.x * 0.5, hz: tmpSize.z * 0.5 });
  });
  landCache.set(1e9, 0, 1e9);        // new land: the field's answer is stale
}

// The field can carry eight domes at a time, so it gets the eight nearest —
// refreshed when you have moved far enough for the answer to have changed.
// A dome you are standing on is worth more than one you can see, hence the
// bias by radius: a small hill under your feet beats a headland a mile off.
function refreshLand(at, force = false) {
  if (!force && landCache.distanceToSquared(at) < 64) return;
  landCache.copy(at);
  const near = LAND
    .map(L => ({ L, d: Math.hypot(L.x - at.x, L.z - at.z) - L.r }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 8);
  const U = grass.uniforms;
  for (let i = 0; i < 8; i++) {
    const n = near[i];
    if (!n || n.d > 240) { U.uHills.value[i].set(0, 0, 0, 0); continue; }
    const L = n.L;
    U.uHills.value[i].set(L.x, L.z, L.r, L.h);
    U.uHillO.value[i].set(L.off[0], L.off[1], L.off[2], L.off[3]);
    U.uHillB.value[i].set(L.y, L.rough, 0, 0);
  }
  const pads = PADS
    .map(P => ({ P, d: Math.max(Math.abs(P.x - at.x) - P.hx, Math.abs(P.z - at.z) - P.hz) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 4);
  for (let i = 0; i < 4; i++) {
    const n = pads[i];
    if (!n || n.d > 200) { U.uPads.value[i].set(0, 0, 0, 0); continue; }
    U.uPads.value[i].set(n.P.x, n.P.z, n.P.hx, n.P.hz);
    U.uPadY.value[i].set(n.P.y, 0, 0, 0);
  }
}

function ensureRegion(r) {
  if (!r || live.has(r.id) || !BUILDERS[r.id]) return;
  const built = BUILDERS[r.id]();
  built.group.position.z += r.shift;
  scene.add(built.group);
  live.set(r.id, built);
  harvestLand(built.group);

  // The near shore: this country's subject, on land, close enough to read from
  // a seat. Built with the region rather than lazily like the places, because
  // being in the window as you pass is the entire point of it.
  const shore = nearShore(shared, r.id);
  if (shore) {
    shore.position.z += r.station;
    scene.add(shore);
    shores.set(r.id, shore);
    harvestLand(shore);
    (SHORE_CROWDS[r.id] ?? []).forEach((spec, i) => {
      if (!routeIsDry(spec, r.station, [shore])) return;
      life.add(spec, r.station, r.stop * 131 + i * 17);
    });
  }
}
function ensureNear(z, reach = 1600) {
  REGIONS.forEach(r => {
    if (z < r.zNear + reach && z > r.zFar - reach) ensureRegion(r);
  });
}

// --- the places off the line, and the people on it ---
// Places are built only when you are ON FOOT, because by design there is
// nothing to see of them from the window and building ninety of them for a
// journey that passes all of them would cost the ride everything it has.
// Life is built whether you are walking or riding: a road with traffic on it
// and a sky with something in it are exactly what the seat should show you.
const places = createPlaces(scene, shared);
const life = createLife(shared);
scene.add(life.group);
const livePops = new Set();
// Nothing that walks or drives is allowed onto the sea.
//
// Eddie: "I see random cars on the Sea." Every one of these routes was authored
// as two numbers beside the track, and nothing ever asked whether that region
// had built any ground there — twenty-six of the twenty-seven had not. Rather
// than correct thirty coordinates by hand and have them drift again the next
// time a region moves, the route is checked against the actual geometry as it
// is created: drop a ray on it, and if it is over open water the crowd simply
// does not exist there. Boats and aircraft are exempt for obvious reasons.
const dryRay = new THREE.Raycaster();
const DOWN = new THREE.Vector3(0, -1, 0);
const shores = new Map();
const groundOf = (r) => [live.get(r.id)?.group, shores.get(r.id)].filter(Boolean);
function routeIsDry(spec, shiftZ, targets) {
  if (spec.kind !== 'cars' && spec.kind !== 'walkers') return true;
  const p = spec.path;
  if (!p) return true;
  const pts = [];
  for (let k = 0; k < 9; k++) {
    if (p.type === 'street') {
      const t = k / 8;
      pts.push([p.from[0] + (p.to[0] - p.from[0]) * t, p.from[1] + (p.to[1] - p.from[1]) * t + shiftZ]);
    } else {
      const a = (k / 9) * Math.PI * 2;
      pts.push([p.at[0] + Math.cos(a) * p.r, p.at[1] + Math.sin(a) * (p.r2 ?? p.r) + shiftZ]);
    }
  }
  // Only this country's own ground — casting against the whole world made a
  // thousand full-scene rays during a ride, which is a visible stall.
  dryRay.far = 900;
  let dry = 0;
  pts.forEach(([x, z]) => {
    dryRay.set(new THREE.Vector3(x, 420, z), DOWN);
    if (dryRay.intersectObjects(targets, true).some(h => h.point.y > 0.25)) dry++;
  });
  return dry >= pts.length * 0.6;
}

function ensureLifeNear(z, reach = 1500) {
  REGIONS.forEach((r) => {
    if (livePops.has(r.id)) return;
    if (z > r.zNear + reach || z < r.zFar - reach) return;
    livePops.add(r.id);
    (POPULATIONS[r.id] ?? []).forEach((spec, i) => {
      if (!routeIsDry(spec, r.shift, groundOf(r))) return;
      life.add(spec, r.shift, r.stop * 97 + i * 13);
    });
  });
}

// --- weather, and the sound of it ---
const rain = createRain(shared, { count: 6500 });
scene.add(rain.mesh);
const sound = createSound();

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
    scene.add(mesh); harvestLand(mesh);
  });
  // A wooded shoulder for the bathhouse to sit against, not a dome behind it.
  //
  // The second one used to be centred at BATH.x + 250, which is x = -18 with a
  // radius of 205 — so it reached 187 metres past the track and the train spent
  // the region running through the inside of a hill. Eddie: "train went into
  // the hills". Any hill near the line has to be checked against the corridor,
  // not against how it looks from the seat.
  const ROUGH = 0.52;
  const shoulders = [
    { at: new THREE.Vector3(BATH.x - 235, -10, BATH.z - 290), r: 262, h: 52, seed: 5, mat: far2 },
    { at: new THREE.Vector3(BATH.x + 108, -10, BATH.z - 250), r: 132, h: 40, seed: 9, mat: far },
  ];
  shoulders.forEach(({ at, r, h, seed, mat }) => {
    const m = new THREE.Mesh(hill(r, h, seed, { rough: ROUGH }), mat);
    m.position.copy(at);
    scene.add(m); harvestLand(m);
  });

  // a wood: firs, broadleaves, wind-shaped pines, blossom and bamboo
  const forest = createForest(shared, shoulders.map(({ at, r, h, seed }) => ({ at, r, h, seed, rough: ROUGH })));
  scene.add(forest.group);
  window.__trees = forest.count;

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

let atmo = null;
const INK = REGIONS.find(r => r.id === 'ink');

function applyAtmosphere(z) {
  const a = atmosphereAt(z, hour);
  atmo = a;

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
  shared.uWind.value = windGust * a.wind;
  shared.uDeckY.value.set(a.decks[0][0], a.decks[1][0], a.decks[2][0]);
  shared.uDeckH.value.set(a.decks[0][1], a.decks[1][1], a.decks[2][1]);
  shared.uDeckAmt.value = a.deckAmt;
  water.uniforms.uFogColor.value.copy(a.fog);
  water.uniforms.uDeep.value.copy(a.waterDeep);
  water.uniforms.uShallow.value.copy(a.waterShallow);
  grass.uniforms.uFogColor.value.copy(a.fog);
  grass.uniforms.uBlade.value.copy(a.grass);
  grass.uniforms.uBladeLo.value.copy(a.grassLo);

  // the one warm thing in view gets to paint itself onto the water, and which
  // one that is depends entirely on where you are
  const busLamp = live.get('bus');
  if (a.wet > 0.5 && busLamp) {
    water.uniforms.uGlowA.value.copy(busLamp.lamp).setZ(busLamp.lamp.z + REGIONS.find(r => r.id === 'bus').shift);
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
  if (a.wet > 0.5 && busLamp) {
    const bz = busLamp.lamp.z + REGIONS.find(r => r.id === 'bus').shift;
    shared.uLamps.value[0].set(busLamp.lamp.x, busLamp.lamp.y, bz, 26);
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
  if (state.mode === 'orbit') rideLabel(false);
  state.mode = 'free';
  state.pos.copy(camera.position);
  const e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
  state.yaw = e.y; state.pitch = e.x;
  state.vel.set(0, 0, 0);
}

// ===========================================================================
// Getting down
//
// Until now the train never stopped, so every place off the line was
// theoretical. This is the whole of the mechanism: the journey holds where it
// is, you are put on the ground beside the track, and the walk is at a walking
// pace with your feet on whatever the ground turns out to be.
//
// Pressing G again brings the train back. It does not go anywhere while you
// are off it — a railway that leaves without you is a different kind of story.
// ===========================================================================
function getDown() {
  const z = state.mode === 'ride' ? line.z : camera.position.z;
  line.held = true;
  line.target = null; destIndex = null;
  state.mode = 'walk';
  state.pos.set(11.5, groundAt({ x: 11.5, z }) + EYE, z + 2);
  state.yaw = Math.PI;                 // facing back down the line, toward -z
  state.pitch = -0.04;
  state.vel.set(0, 0, 0);
  places.ensureNear(state.pos, 1400);
  rideLabel(true, 'on foot', 'G to get back on · W A S D to walk');
  mark();
}

function board() {
  line.held = false;
  state.mode = 'ride';
  state.seat = 'window';
  state.yaw = Math.PI / 2;
  state.pitch = 0;
  rideLabel(true, 'window seat');
  mark();
}

const EYE = 1.68;

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
function rideLabel(on, text, tail = 'R to move, F to let go') {
  rideEl.textContent = text ? text + ' — ' + tail : '';
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
const SEAT_Z = 2.83;                 // half a window bay, so no mullion sits in the eye

const line = {
  z: REGIONS[0].station,
  cruise: 34,
  speed: 34,
  target: null,
  warp: 0,                            // 0 cruising .. 1 running flat out
  held: false,                        // true while you are standing off it
};
let stopIndex = 0;      // where the train actually is
let destIndex = null;   // where it is headed, while it is headed anywhere

function travelTo(i) {
  line.held = false;
  destIndex = ((i % REGIONS.length) + REGIONS.length) % REGIONS.length;
  line.target = REGIONS[destIndex].station;
  ensureRegion(REGIONS[destIndex]);
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
  if (line.held) { line.warp = 0; return; }
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

// ===========================================================================
// Home — the place you decided to stay
//
// Fly to somewhere you like, press O, and the camera keeps that spot and
// circles it: a long slow orbit that rises and falls and never arrives. It is
// the difference between visiting a country and sitting in it.
//
// Home is wherever you were LOOKING, not where you were standing — you point
// at the thing, and the camera arranges itself around the thing.
// ===========================================================================
const orbit = {
  home: new THREE.Vector3(),
  radius: 160, height: 60, angle: 0,
  speed: 0.055,                       // radians a second: one turn in ~2 min
};
const homeDir = new THREE.Vector3();

function pickHome(out) {
  homeDir.set(0, 0, -1).applyQuaternion(camera.quaternion);
  // where the look direction meets the ground, if it ever does; otherwise a
  // fixed distance out, so pointing at the sky still gives you something
  let d = 240;
  if (homeDir.y < -0.02) d = THREE.MathUtils.clamp((camera.position.y - 2) / -homeDir.y, 40, 900);
  out.copy(camera.position).addScaledVector(homeDir, d);
  out.y = Math.max(out.y, 2);
  return d;
}

function goHome() {
  if (state.mode === 'orbit') { goFree(); mark(); return; }
  const d = pickHome(orbit.home);
  orbit.radius = THREE.MathUtils.clamp(d * 0.85, 45, 620);
  // it has to fly ABOVE what it is circling, or the path goes through the
  // roofs of the thing you asked to look at
  orbit.height = THREE.MathUtils.clamp(
    Math.max(camera.position.y - orbit.home.y, orbit.radius * 0.42), 22, 300);
  orbit.angle = Math.atan2(camera.position.z - orbit.home.z, camera.position.x - orbit.home.x);
  // a big orbit has to turn more slowly or the far side whips past
  orbit.speed = 0.26 * Math.pow(120 / orbit.radius, 0.6) * ((orbit.home.z | 0) % 2 ? 1 : -1);
  state.mode = 'orbit';
  state.vel.set(0, 0, 0);
  rideLabel(true, 'circling this place', 'O to let go');
  mark();
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
    if (state.mode !== 'walk') goFree();
    mark();
    state.yaw -= dx * 0.0026;
    state.pitch = THREE.MathUtils.clamp(state.pitch - dy * 0.0024, -1.25, 1.05);
  } else if (pointers.size === 2 && touchMove.active) {
    if (state.mode !== 'walk') goFree();
    mark();
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
  if (state.mode === 'walk') { e.preventDefault(); return; }   // you cannot zoom your legs
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
  if (k === 'g') { state.mode === 'walk' ? board() : getDown(); return; }
  if (k === 'r') { if (state.mode === 'walk') board(); else rideNext(); return; }
  if (k === 'o') { goHome(); return; }
  if (k === 'p') { togglePaint(); return; }
  if (k === 'm') { toggleSound(); return; }
  const from = destIndex === null ? stopIndex : destIndex;
  if (k === 'n' || k === 'arrowright') { travelTo(from + 1); return; }
  if (k === 'b' || k === 'arrowleft') { travelTo(from - 1); return; }
  state.keys.add(k);
  if ('wasdqe c'.includes(k) || k === ' ' || k === 'shift') {
    if (state.mode !== 'walk') goFree();
    mark();
  }
});
addEventListener('keyup', (e) => state.keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => state.keys.clear());

function mark() {
  state.lastInput = clock;
  hintSeen();
  // a browser will not make a sound until it has been touched
  if (soundOn) sound.start();
}

// ===========================================================================
// UI
// ===========================================================================
let windGust = 0.7;
let lastMix = {};
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

let soundOn = true;
const soundToggle = document.getElementById('t-sound');
function toggleSound() {
  soundOn = sound.toggle();
  soundToggle.classList.toggle('on', soundOn);
}
soundToggle.addEventListener('click', toggleSound);

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

// ---------------------------------------------------------------------------
// The compass, and arriving
//
// This is the whole of the navigation this world will ever have, and it is
// deliberately almost nothing.
//
// Eddie asked whether there should be signs and a map. Signs, no — the entire
// pleasure of the thing is recognising a place unaided, and a caption hanging
// over it does the recognising for you. But "no signs" cannot mean "no idea
// where anything is", or exploring is just walking into fog. So: a strip along
// the top with a MARK where something is, its distance, and not one word about
// what it might be. The ground does the rest — every place has a path leading
// to it, which is how Ghibli tells you where to walk without telling you.
//
// The name arrives only once you are standing in the place. By then it is not
// a caption, it is a confirmation of something you already knew.
// ---------------------------------------------------------------------------
const compassEl = document.getElementById('compass');
const foundEl = document.getElementById('found');
const foundH = foundEl.querySelector('b');
const foundF = foundEl.querySelector('i');
const FOV_C = 1.15;                    // how much of the world the strip covers
const marks = [];
let foundPlace = null;
let compassAcc = 0;

function markEl(i) {
  while (marks.length <= i) {
    const d = document.createElement('div');
    d.className = 'mk';
    d.innerHTML = '<i></i><b></b>';
    compassEl.appendChild(d);
    marks.push(d);
  }
  return marks[i];
}

function paintCompass() {
  const on = state.mode === 'walk';
  compassEl.classList.toggle('show', on);
  if (!on) { if (foundPlace) { foundPlace = null; foundEl.classList.remove('show'); } return; }

  compassAcc += 1;
  if (compassAcc % 6) return;          // six times a second is plenty

  const near = placesNear(camera.position, 1200).slice(0, 8);
  let used = 0;
  near.forEach(({ place, d, bearing }) => {
    let rel = bearing - state.yaw;
    rel = ((rel + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    if (Math.abs(rel) > FOV_C) return;
    const el = markEl(used++);
    el.style.left = (50 + (rel / FOV_C) * 50) + '%';
    // it fades with distance, so the far ones are hints and the near ones are
    // directions — but it never says what any of them are
    el.style.opacity = String(0.22 + 0.6 * (1 - Math.min(1, d / 1200)));
    el.querySelector('b').textContent = d < 1000 ? Math.round(d / 10) * 10 + ' m' : (d / 1000).toFixed(1) + ' km';
    el.classList.toggle('at', d < place.r);
    el.style.display = '';
  });
  for (let i = used; i < marks.length; i++) marks[i].style.display = 'none';

  const p = placeAt(camera.position);
  if (p !== foundPlace) {
    foundPlace = p;
    if (p) {
      foundH.textContent = p.name;
      foundF.textContent = p.film;
      foundEl.classList.add('show');
      clearTimeout(paintCompass._t);
      paintCompass._t = setTimeout(() => foundEl.classList.remove('show'), 7000);
    } else {
      foundEl.classList.remove('show');
    }
  }
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
ensureNear(0);
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

  windGust = windAt(clock);
  advanceLine(dt);
  const here = state.mode === 'ride' ? line.z : camera.position.z;
  ensureNear(here);
  ensureLifeNear(here);
  if (state.mode !== 'ride' && state.mode !== 'cine') places.ensureNear(camera.position, 900);

  if (state.mode === 'ride') {
    // Dead centre of a carriage, not near its end — sit by the join and the
    // wall runs out a metre to your left and the window stops being a window.
    const z = line.z;
    // A train on rails does not shake, it FLOATS. The real motion is the
    // bogies hunting side to side at well under a hertz, a slow roll following
    // it, and almost nothing vertical. What reads as shaking is fast jitter,
    // which nothing running on steel actually does — the first pass had it at
    // four times a second and it felt like a bus on a farm track.
    const drift = Math.sin(clock * 0.61) * 0.034 + Math.sin(clock * 1.37) * 0.011;
    const sway  = Math.sin(clock * 0.55) * 0.0060 + Math.sin(clock * 1.31) * 0.0020;
    const bob   = Math.sin(clock * 0.93) * 0.0085 + Math.sin(clock * 2.10) * 0.0030;
    // half a mullion pitch off centre: sit level with one and it stands in the
    // middle of everything you look at
    if (state.seat === 'roof') camera.position.set(drift * 1.7, 6.55 + bob, z + CAR_PITCH);
    else                        camera.position.set(drift, 3.50 + bob, z + SEAT_Z);
    camera.quaternion.setFromEuler(new THREE.Euler(state.pitch, state.yaw, sway, 'YXZ'));
    shared.uLamps.value[2].set(-0.6, 4.5, z + 1.70, 5.5);
    shared.uLampCols.value[2].setRGB(0.130, 0.088, 0.045);
  } else if (state.mode === 'orbit') {
    shared.uLamps.value[2].w = 0;
    orbit.angle += orbit.speed * dt;
    // the radius and the height breathe on different periods, so the path
    // never closes on itself and it never looks like a turntable
    const r = orbit.radius * (1 + Math.sin(clock * 0.041) * 0.16);
    const h = orbit.height * (1 + Math.sin(clock * 0.027 + 1.3) * 0.30);
    camera.position.set(
      orbit.home.x + Math.cos(orbit.angle) * r,
      Math.max(orbit.home.y + h, 2.2),
      orbit.home.z + Math.sin(orbit.angle) * r,
    );
    tmpMat.lookAt(camera.position, orbit.home, UP);
    tmpQuat.setFromRotationMatrix(tmpMat);
    camera.quaternion.copy(tmpQuat);
    // the faintest roll, so it reads as flight rather than a camera on rails
    camera.rotateZ(Math.sin(clock * 0.09) * 0.022);
    state.pos.copy(camera.position);
    const e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    state.yaw = e.y; state.pitch = e.x;
  } else if (state.mode === 'walk') {
    // A walk, not a flight: four and a half metres a second, no vertical
    // control at all, and the head stays a fixed height above whatever is
    // under it. Everything about the pace is deliberate — a place you arrive
    // at in two seconds is not a place you went to.
    shared.uLamps.value[2].w = 0;
    const sp = (state.keys.has('shift') ? 11 : 4.6);
    fwd.set(0, 0, -1).applyEuler(new THREE.Euler(0, state.yaw, 0, 'YXZ'));
    right.set(1, 0, 0).applyEuler(new THREE.Euler(0, state.yaw, 0, 'YXZ'));
    const acc = new THREE.Vector3();
    if (state.keys.has('w')) acc.add(fwd);
    if (state.keys.has('s')) acc.sub(fwd);
    if (state.keys.has('d')) acc.add(right);
    if (state.keys.has('a')) acc.sub(right);
    if (touchMove.active) { acc.addScaledVector(fwd, touchMove.fwd); acc.addScaledVector(right, touchMove.side); }
    if (acc.lengthSq() > 0) acc.normalize().multiplyScalar(sp);
    state.vel.lerp(acc, 1 - Math.pow(0.0009, dt));
    state.pos.addScaledVector(state.vel, dt);
    state.pos.x = THREE.MathUtils.clamp(state.pos.x, -1500, 1500);
    state.pos.z = THREE.MathUtils.clamp(state.pos.z, LINE_END - 400, REGIONS[0].zNear + 400);
    const gnd = groundAt(state.pos);
    state.pos.y = THREE.MathUtils.lerp(state.pos.y, gnd + EYE, 1 - Math.pow(0.004, dt));
    camera.position.copy(state.pos);
    // a walk has a rhythm; a hover does not
    const stride = Math.hypot(state.vel.x, state.vel.z) / sp;
    camera.position.y += Math.sin(clock * 7.4) * 0.035 * stride;
    camera.quaternion.setFromEuler(new THREE.Euler(state.pitch, state.yaw, Math.sin(clock * 3.7) * 0.006 * stride, 'YXZ'));
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
  refreshLand(camera.position);
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

  // the plain has no edge, and neither does the track — the mirror, the
  // ballast and the sleepers all travel with the camera, snapped so nothing
  // slides. Twenty-four kilometres of line does not have to exist at once.
  water.mesh.position.set(camera.position.x, 0, camera.position.z);
  rail.follow(camera.position.z);
  rain.update(camera.position, shared.uWet.value);

  // Each region declares its own soundscape and those levels have already
  // cross-faded at the border. On top of that, a point source gets a vicinity:
  // the grove you can hear is the one you are actually standing in.
  const mix = Object.assign({}, atmo.sound);
  // The bamboo is a PLACE inside one region, not a rule for the whole line —
  // apply its vicinity anywhere and the ink country's silence starts putting
  // out Iron Town's hammers, which are somebody else's knocks entirely.
  if (camera.position.z <= INK.zNear + BLEND && camera.position.z >= INK.zFar - BLEND) {
    const gz = camera.position.z - INK.shift;
    const dz = gz > -1400 ? gz + 1400 : (gz < -3900 ? -3900 - gz : 0);
    const dx = Math.max(0, Math.abs(camera.position.x) - 70);
    const grove = (1 - THREE.MathUtils.smoothstep(Math.abs(dz), 0, 500))
                * (1 - THREE.MathUtils.smoothstep(dx, 0, 240));
    if (mix.leaves) mix.leaves *= 0.25 + 0.75 * grove;
    if (mix.knock) mix.knock *= grove;
  }
  lastMix = mix;
  sound.update(dt, mix, shared.uWind.value);

  live.forEach(r => r.update && r.update(clock));
  places.update(clock, camera.position);
  life.update(clock);
  paintCompass();
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

// what the mixer is actually being asked for, for checking the soundscape
window.__mix = () => ({ live: sound.live, on: sound.on, mix: lastMix, wind: +shared.uWind.value.toFixed(2) });

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

// What is actually OUT OF THE WINDOW at each stop. Eddie: "we only see trees
// and grasses with nothing on some of them... for Marnie I only see the wheat
// and water, I didn't see the house." A country can be full of buildings and
// still show an empty window, because everything in it was put where the ride
// cannot look. This counts what a seated passenger can see, by name, so the
// empty ones stop being a matter of opinion.
window.__inview = (reach = 900) => {
  const skip = new Set([water.mesh, sky.mesh, grass.mesh, train.group, rail.group]);
  const box = new THREE.Box3(), c = new THREE.Vector3();
  return REGIONS.map((r) => {
    ensureRegion(r);
    const built = live.get(r.id);
    const eye = new THREE.Vector3(11.5, 3.4, r.station);
    let seen = 0, nearest = 1e9;
    const look = (o) => {
      if (skip.has(o) || !o.isMesh) return;
      box.setFromObject(o); box.getCenter(c);
      const dx = c.x - eye.x, dz = c.z - eye.z;
      const d = Math.hypot(dx, dz);
      if (d > reach || dx > 40) return;          // the window faces -x
      const size = box.getSize(new THREE.Vector3()).length();
      if (size < 4) return;                       // too small to register at range
      seen++; nearest = Math.min(nearest, d);
    };
    if (built) built.group.traverse(look);
    scene.children.forEach(o => { if (!live.has(o.name)) o.traverse && o.traverse(look); });
    return `${r.stop}. ${r.title} — ${seen} things, nearest ${nearest > 1e8 ? '—' : Math.round(nearest) + ' m'}`;
  });
};

// Where the dry land is beside the line, country by country. A street of
// people authored at "x = -40, beside the track" is a street of people walking
// on the sea unless that region happened to build a shore there — and eleven
// of them had not. This asks the geometry where the ground actually is.
window.__shore = () => {
  const ray = new THREE.Raycaster(); ray.far = 900;
  const down = new THREE.Vector3(0, -1, 0), from = new THREE.Vector3();
  const skip = new Set([water.mesh, sky.mesh, grass.mesh, train.group]);
  const targets = scene.children.filter(o => !skip.has(o));
  const ground = (x, z) => {
    from.set(x, 420, z); ray.set(from, down);
    const hits = ray.intersectObjects(targets, true);
    for (const h of hits) if (h.point.y > 0.25) return h.point.y;
    return null;
  };
  const out = {};
  REGIONS.forEach((r) => {
    ensureRegion(r);
    const zs = [r.station - 400, r.station - 150, r.station, r.station + 150, r.station + 400];
    for (let x = -18; x > -460; x -= 8) {
      const gs = zs.map(z => ground(x, z));
      if (gs.every(g => g !== null)) {
        out[r.id] = [x, +Math.max(...gs).toFixed(1)];
        return;
      }
    }
    out[r.id] = null;
  });
  return out;
};

// What is standing right against the glass. A country can have its subject
// beautifully placed and still show you nothing, because one slab of its own
// ground is parked between you and it. This finds the tall things inside the
// first sixty metres on the window side, which is where a view goes to die.
window.__blockers = () => {
  const box = new THREE.Box3(), sz = new THREE.Vector3(), c = new THREE.Vector3();
  const out = [];
  REGIONS.forEach((r) => {
    ensureRegion(r);
    const built = live.get(r.id);
    if (!built) return;
    built.group.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh) return;
      box.setFromObject(o); box.getSize(sz); box.getCenter(c);
      if (Math.abs(c.z - r.station) > 400) return;
      const nearX = box.max.x;                     // its edge on the window side
      if (nearX < -70 || box.min.x > 6) return;    // clear of, or beyond, the line
      if (sz.y < 14 || sz.length() < 40) return;
      out.push(`${r.id}: a ${Math.round(sz.x)}×${Math.round(sz.y)}×${Math.round(sz.z)} m mass reaching to x ${Math.round(nearX)}`);
    });
  });
  return out.length ? out : 'nothing against the glass';
};

window.__THREE = THREE;
window.__cam = camera;
window.__scene = scene;   // the camera is not in the graph, so this is the way in
window.__line = line;     // where the train actually is, when the map disagrees
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

// step off at a given stop and stand there, for checking the places
window.__walk = (i) => {
  if (i !== undefined) window.__stop(i);
  getDown();
  return { stop: REGIONS[stopIndex].title, places: PLACE_COUNT, built: places.count, pops: life.count };
};
// what is within reach on foot, nearest first
// Is any place standing inside a hill? Building a village on the +x side and
// a wooded shoulder on the same coordinates is an easy mistake to make and an
// impossible one to see from the seat — the street of stalls spent its first
// pass twenty-six metres underground with a forest hanging over it. This walks
// every place against every dome and says so.
window.__buried = () => {
  const bad = [];
  REGIONS.forEach((r) => { ensureRegion(r); });
  placesNear(new THREE.Vector3(0, 0, 0), 1e9).forEach(({ place }) => {
    LAND.forEach((L) => {
      const dx = place.x - L.x, dz = place.z - L.z;
      if (Math.hypot(dx, dz) >= L.r) return;
      const D = Math.hypot(dx, dz), a = Math.atan2(dz, dx), o = L.off;
      const n = Math.sin(a * 3 + o[0]) * 0.34 + Math.sin(a * 5 + o[1]) * 0.22
              + Math.sin(a * 9 + o[2]) * 0.12 + Math.sin(a * 17 + o[3]) * 0.06;
      let u = D / L.r;
      for (let i = 0; i < 4 && u < 1; i++) {
        const y = Math.sqrt(Math.max(0, 1 - u * u));
        u = D / (L.r * Math.max(0.2, 1 + n * L.rough * (1 - y * 0.55)));
      }
      if (u >= 1) return;
      const top = L.y + Math.sqrt(Math.max(0, 1 - u * u)) * L.h * (1 + n * L.rough * 0.35);
      const over = top - (place.ground ?? 0);
      if (over > 6) bad.push({ place, over: Math.round(over) });
    });
  });
  if (!bad.length) return 'nothing buried';

  // ...and where it could stand instead. Search outward from where the author
  // put it for the nearest point with open sky over it, keeping the place in
  // its own country. Reported as a local offset, because that is what the
  // place file is written in.
  const top = (x, z, L) => {
    const dx = x - L.x, dz = z - L.z, D = Math.hypot(dx, dz);
    if (D >= L.r) return -1e9;
    const a = Math.atan2(dz, dx), o = L.off;
    const n = Math.sin(a * 3 + o[0]) * 0.34 + Math.sin(a * 5 + o[1]) * 0.22
            + Math.sin(a * 9 + o[2]) * 0.12 + Math.sin(a * 17 + o[3]) * 0.06;
    let u = D / L.r;
    for (let i = 0; i < 4 && u < 1; i++) {
      const y = Math.sqrt(Math.max(0, 1 - u * u));
      u = D / (L.r * Math.max(0.2, 1 + n * L.rough * (1 - y * 0.55)));
    }
    if (u >= 1) return -1e9;
    return L.y + Math.sqrt(Math.max(0, 1 - u * u)) * L.h * (1 + n * L.rough * 0.35);
  };
  return bad.map(({ place, over }) => {
    for (let ring = 1; ring <= 40; ring++) {
      for (let k = 0; k < 24; k++) {
        const a = (k / 24) * Math.PI * 2;
        const x = place.x + Math.cos(a) * ring * 40, z = place.z + Math.sin(a) * ring * 40;
        // Outside every dome, with room to spare — "below the hill's surface
        // here" is not good enough, because the place brings its own ground
        // and its skirts would still be swallowed.
        if (LAND.some(L => Math.hypot(x - L.x, z - L.z) < L.r + 40)) continue;
        return `${place.name} (${place.region.id}): buried ${over} m — move by ${Math.round(x - place.x)}, ${Math.round(z - place.z)}`;
      }
    }
    return `${place.name} (${place.region.id}): buried ${over} m — nowhere clear within 1.6 km`;
  });
};
// Is anything driving on water? Eddie: "I see random cars on the Sea." A car
// path is authored as two numbers beside the line and nothing ever checked
// whether the region put land under them — the same mistake as the shoal and
// the buried places, in a third costume.
window.__adrift = () => {
  REGIONS.forEach(r => ensureRegion(r));
  // Ask the geometry, not a summary of it. A region's ground is boxes, domes,
  // shelves and slabs in no particular pattern, so the only honest test is to
  // drop a ray on the spot and see what it lands on.
  const ray = new THREE.Raycaster();
  ray.far = 900;
  const down = new THREE.Vector3(0, -1, 0);
  const from = new THREE.Vector3();
  const targets = [];
  scene.children.forEach(o => { if (o !== water.mesh && o !== sky.mesh && o !== grass.mesh) targets.push(o); });
  const solid = (x, z) => {
    from.set(x, 420, z);
    ray.set(from, down);
    const hits = ray.intersectObjects(targets, true);
    return hits.some(h => h.point.y > 0.25);
  };
  const out = [];
  REGIONS.forEach((r) => {
    (POPULATIONS[r.id] ?? []).forEach((spec, i) => {
      if (spec.kind !== 'cars' && spec.kind !== 'walkers') return;
      const pts = [];
      if (spec.path?.type === 'street') {
        const [ax, az] = spec.path.from, [bx, bz] = spec.path.to;
        for (let k = 0; k <= 20; k++) pts.push([ax + (bx - ax) * k / 20, az + (bz - az) * k / 20 + r.shift]);
      } else if (spec.path?.type === 'ring') {
        const [cx, cz] = spec.path.at, rr = spec.path.r, r2 = spec.path.r2 ?? rr;
        for (let k = 0; k < 20; k++) {
          const a = (k / 20) * Math.PI * 2;
          pts.push([cx + Math.cos(a) * rr, cz + Math.sin(a) * r2 + r.shift]);
        }
      } else return;
      const wet = pts.filter(([x, z]) => !solid(x, z)).length;
      if (wet > 2) out.push(`${r.id} #${i} ${spec.kind}: ${wet}/${pts.length} of its route is open water`);
    });
  });
  return out.length ? out : 'everything on land';
};
window.__land = () => LAND.map(L => ({
  x: Math.round(L.x), z: Math.round(L.z), y: Math.round(L.y),
  r: Math.round(L.r), h: Math.round(L.h),
  away: Math.round(Math.hypot(L.x - camera.position.x, L.z - camera.position.z)),
})).sort((a, b) => a.away - b.away);
window.__near = (n = 6) => placesNear(camera.position, 2000).slice(0, n)
  .map(({ place, d }) => `${Math.round(d)}m ${place.name}`);

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
