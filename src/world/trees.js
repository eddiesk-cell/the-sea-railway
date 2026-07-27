import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mulberry, fillInstances, hillSampler } from './geo.js';
import { makePaintMaterial } from './paintMaterial.js';

// ---------------------------------------------------------------------------
// A wood, not a plantation.
//
// Five species with genuinely different silhouettes — a fir, a broadleaf, a
// wind-shaped Japanese pine, a blossom tree, and a stand of bamboo. Every
// geometry is built to a height of exactly 1, so an instance's scale IS its
// height in metres, and every instance gets its own colour jitter on top of its
// species. One draw call per species.
// ---------------------------------------------------------------------------

// Each maker returns the crown and the WOOD separately.
//
// They used to come back as one merged geometry drawn with one material, so
// every trunk in the wood was the same green as the leaves on it. Eddie: "for
// tree trunk I see them in green, shouldn't they be real tree with barks?" —
// and at four metres that is the first thing you look at.

// --- fir: stacked skirts, narrow, dark ---
function conifer(rnd) {
  const parts = [], wood = [];
  const trunk = new THREE.CylinderGeometry(0.018, 0.032, 0.34, 5);
  trunk.translate(0, 0.17, 0);
  wood.push(trunk);
  const tiers = 3;
  for (let i = 0; i < tiers; i++) {
    const f = i / tiers;
    const r = 0.30 * (1 - f * 0.55) * (0.85 + rnd() * 0.3);
    const h = 0.42 * (1 - f * 0.25);
    const c = new THREE.ConeGeometry(r, h, 6, 1);
    c.translate((rnd() - 0.5) * 0.03, 0.22 + f * 0.30 + h * 0.5, (rnd() - 0.5) * 0.03);
    parts.push(c);
  }
  return { crown: mergeGeometries(parts, false), wood: mergeGeometries(wood, false) };
}

// --- broadleaf: a trunk and a lumpy crown ---
function broadleaf(rnd, spread = 1.0, lift = 1.0) {
  const parts = [], wood = [];
  const trunk = new THREE.CylinderGeometry(0.028, 0.055, 0.56 * lift, 6);
  trunk.translate(0, 0.28 * lift, 0);
  wood.push(trunk);
  // two boughs leaving the trunk, so the crown is carried rather than balanced
  for (let i = 0; i < 2; i++) {
    const a = rnd() * Math.PI * 2;
    const b = new THREE.CylinderGeometry(0.014, 0.028, 0.26 * lift, 5);
    b.translate(0, 0.13 * lift, 0);
    b.rotateZ((i ? 1 : -1) * (0.45 + rnd() * 0.3));
    b.rotateY(a);
    b.translate(0, 0.50 * lift, 0);
    wood.push(b);
  }
  const blobs = 4;
  for (let i = 0; i < blobs; i++) {
    const a = (i / blobs) * Math.PI * 2 + rnd();
    const d = i === 0 ? 0 : (0.10 + rnd() * 0.13) * spread;
    const r = (i === 0 ? 0.30 : 0.19 + rnd() * 0.10) * spread;
    const b = new THREE.SphereGeometry(r, 8, 6);
    b.scale(1, 0.78 + rnd() * 0.3, 1);
    b.translate(Math.cos(a) * d, 0.62 * lift + (rnd() - 0.4) * 0.14, Math.sin(a) * d);
    parts.push(b);
  }
  return { crown: mergeGeometries(parts, false), wood: mergeGeometries(wood, false) };
}

// --- Japanese pine: a leaning trunk under flat plates of needles ---
function pineJp(rnd) {
  const parts = [], wood = [];
  const lean = (rnd() - 0.5) * 0.5;
  const trunk = new THREE.CylinderGeometry(0.022, 0.045, 0.76, 6);
  trunk.rotateZ(lean * 0.35);
  trunk.translate(lean * 0.10, 0.38, 0);
  wood.push(trunk);
  const plates = 3;
  for (let i = 0; i < plates; i++) {
    const f = i / (plates - 1);
    const r = (0.32 - f * 0.13) * (0.85 + rnd() * 0.3);
    const p = new THREE.SphereGeometry(r, 8, 5);
    p.scale(1, 0.34 + rnd() * 0.12, 1);
    p.translate(lean * (0.18 + f * 0.4) + (rnd() - 0.5) * 0.10,
                0.56 + f * 0.36,
                (rnd() - 0.5) * 0.12);
    parts.push(p);
  }
  return { crown: mergeGeometries(parts, false), wood: mergeGeometries(wood, false) };
}

// --- blossom: a low, wide, soft cloud on a short trunk ---
function blossom(rnd) {
  return broadleaf(rnd, 1.28, 0.72);
}

// --- bamboo: a stand of canes ---
//
// The first version was seven bare poles with three flat blobs balanced on
// each — Eddie: "more branches and leaves, they should look thicker on top".
// He is describing the actual plant. A bamboo stand is a bare colonnade for
// most of its height and a dense green ceiling above, and it is that contrast
// that makes a bamboo grove feel like a room rather than a wood. Nothing
// branches below halfway; everything branches at once above it.
function bamboo(rnd) {
  const parts = [], wood = [];
  const canes = 9;

  for (let i = 0; i < canes; i++) {
    const a = rnd() * Math.PI * 2, d = 0.03 + rnd() * 0.15;
    const h = 0.70 + rnd() * 0.30;
    const lean = (rnd() - 0.5) * 0.15, tip = (rnd() - 0.5) * 0.15;
    const bx = Math.cos(a) * d, bz = Math.sin(a) * d;
    // every piece of this cane gets the same lean, or it comes apart
    const onCane = (g, y) => { g.rotateZ(lean); g.rotateX(tip); g.translate(bx, y, bz); return g; };

    const culm = new THREE.CylinderGeometry(0.0075, 0.013, h, 5);
    wood.push(onCane(culm, h * 0.5));

    // the nodes — the swollen rings every 60 cm or so. They are what stops a
    // green cylinder reading as a pipe.
    const segs = 6;
    for (let k = 1; k < segs; k++) {
      const nd = new THREE.CylinderGeometry(0.0165, 0.0165, 0.011, 5);
      wood.push(onCane(nd, h * (k / segs)));
    }

    // branches, upper half only, spiralling by the golden angle so no two sit
    // above each other
    for (let k = 0; k < 5; k++) {
      const t = 0.50 + (k / 5) * 0.48 + rnd() * 0.05;
      const y = h * t;
      const ba = a + k * 2.39996 + rnd() * 0.4;
      const up = 0.34 + rnd() * 0.30;              // young shoots reach, old ones droop
      const len = 0.09 + rnd() * 0.09 + (t - 0.54) * 0.14;

      // built lying along +X, then swung out and round — so the leaves land
      // where the branch actually ends instead of near it
      const swing = (g) => { g.rotateZ(up); g.rotateY(-ba); return onCane(g, y); };

      const stick = new THREE.CylinderGeometry(0.0035, 0.0055, len, 4);
      stick.rotateZ(-Math.PI / 2); stick.translate(len * 0.5, 0, 0);
      wood.push(swing(stick));

      // three sprays down the outer half, each a fan of long leaves. They are
      // deliberately large: a bamboo leaf is a hand's length, and a spray
      // built to scale disappears entirely at any distance you would look at
      // a grove from — which is how the first version ended up as bare poles.
      for (let j = 0; j < 3; j++) {
        const at = len * (0.34 + j * 0.30);
        const droop = -0.12 - rnd() * 0.38;
        for (let b = 0; b < 3; b++) {
          const leaf = new THREE.SphereGeometry(1, 4, 3);
          leaf.scale(0.105 + rnd() * 0.055, 0.013, 0.030);
          leaf.rotateY((b - 1) * (0.55 + rnd() * 0.55));
          leaf.rotateZ(droop);
          leaf.translate(at + 0.085, -0.006 * j, 0);
          parts.push(swing(leaf));
        }
      }
    }

    // and the top itself, which is where a stand looks thickest: the cane runs
    // out of stem and turns entirely into leaf. This is the whole silhouette —
    // a bamboo grove is a ceiling held up on poles.
    for (let k = 0; k < 9; k++) {
      const crest = new THREE.SphereGeometry(1, 4, 3);
      crest.scale(0.105 + rnd() * 0.065, 0.016, 0.034);
      crest.rotateZ(-0.20 - rnd() * 0.55);
      crest.rotateY(rnd() * 6.283);
      crest.translate(0.075 + rnd() * 0.05, 0, 0);
      const spin = new THREE.Matrix4().makeRotationY(k * 0.698 + rnd() * 0.4);
      crest.applyMatrix4(spin);
      parts.push(onCane(crest, h * (0.90 + rnd() * 0.14)));
    }
  }
  return { crown: mergeGeometries(parts, false), wood: mergeGeometries(wood, false) };
}

// Colour here is set for a wood you can WALK INTO, not one seen from a train.
//
// The first pass was picked at 400 m through dusk haze, where anything lighter
// looked artificial. Standing under it at four metres the same numbers read as
// five shades of black — Eddie's words were "the trees are so dark I hardly see
// the colours at all", and he was right. Fog and distance darken a surface;
// they never lighten one. So the albedo has to be set from ARM'S LENGTH and
// allowed to sink into the haze on its own.
//
// The shadow tints keep their hue rather than falling to grey, and the wrap is
// wide, so the side of a tree facing away from a dusk sun is still green.
//
// The blossom used to be pink (#bb9498) and Eddie spotted it in the first
// minute: cherry in the Spirited Away wood is the wrong film and the wrong
// season. The SHAPE is worth keeping — a low wide cloud on a short trunk is the
// only silhouette in the set that is broader than it is tall — so it stayed and
// turned into an autumn broadleaf.
const SPECIES = [
  { name: 'fir',       make: conifer,   weight: 0.24, hMin: 13, hMax: 25,
    color: '#41654a', shadow: '#22423a', rim: 0.34, trans: 0.55,
    bark: '#4a3b30', barkShadow: '#1e1712' },
  { name: 'broadleaf', make: broadleaf, weight: 0.30, hMin: 10, hMax: 19,
    color: '#62793a', shadow: '#2e4529', rim: 0.40, trans: 1.05,
    bark: '#6a5a48', barkShadow: '#2a231c' },
  { name: 'pine',      make: pineJp,    weight: 0.17, hMin: 9,  hMax: 17,
    color: '#4a6440', shadow: '#243c30', rim: 0.42, trans: 0.75,
    bark: '#7a5238', barkShadow: '#301e14' },     // red pine, and it should read red
  { name: 'blossom',   make: blossom,   weight: 0.11, hMin: 7,  hMax: 13,
    color: '#8a7c36', shadow: '#413a20', rim: 0.66, trans: 1.15,
    bark: '#4e4038', barkShadow: '#1c1714' },
  { name: 'bamboo',    make: bamboo,    weight: 0.18, hMin: 9,  hMax: 16,
    color: '#6d8a3c', shadow: '#374a24', rim: 0.50, trans: 0.95,
    bark: '#9aa84e', barkShadow: '#4a5424' },
];

// `sites` is a list of { at: Vector3 (base of the hill), r, h } — trees are
// scattered over each dome and dropped onto its surface.
export function createForest(shared, sites, seed = 4242) {
  const rnd = mulberry(seed);
  const group = new THREE.Group();

  // three shape variants per species, so no two neighbours are identical
  const geos = SPECIES.map(sp => [sp.make(rnd), sp.make(rnd), sp.make(rnd)]);
  const mats = SPECIES.map(sp => makePaintMaterial(shared, {
    color: sp.color, shadowTint: sp.shadow, rim: sp.rim, bands: 2,
    grain: 0.22, grainScale: 0.55, translucency: sp.trans, wrap: 0.66,
  }));
  // Wood. Bark for four of them and a pale green cane for the bamboo, and the
  // grain runs coarse and vertical so a trunk reads as a trunk close up.
  const woodMats = SPECIES.map(sp => makePaintMaterial(shared, {
    color: sp.bark, shadowTint: sp.barkShadow, rim: 0.75, bands: 3,
    grain: 0.30, grainScale: 2.6, wrap: 0.52,
    translucency: sp.name === 'bamboo' ? 0.35 : 0,
  }));

  const buckets = SPECIES.map(() => [[], [], []]);
  const cumulative = [];
  let acc = 0;
  SPECIES.forEach(sp => { acc += sp.weight; cumulative.push(acc); });

  sites.forEach(({ at, r, h, seed: hseed = 1, rough = 0.34 }) => {
    // Ask the hill where its own surface is. The old line here invented a
    // smooth hemisphere and shaved 7% off it for luck, which on a hill built
    // with rough 0.52 put whole stands of trees twenty metres up in the air.
    const surface = hillSampler(r, h, hseed, { rough });
    const n = Math.round(r * 4.6);
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2;
      const d = Math.sqrt(rnd()) * r * 0.95;
      const s = surface(Math.cos(a) * d, Math.sin(a) * d);
      if (s === null) continue;
      const y = at.y + s;

      // pick a species; bamboo and blossom prefer the lower slopes
      const slope = d / r;
      let pick = rnd() * acc;
      let si = cumulative.findIndex(c => pick <= c);
      if (si < 0) si = 0;
      if ((SPECIES[si].name === 'bamboo' || SPECIES[si].name === 'blossom') && slope < 0.42) si = 1;

      const sp = SPECIES[si];
      const variant = (rnd() * 3) | 0;
      const height = sp.hMin + rnd() * (sp.hMax - sp.hMin);
      buckets[si][variant].push({
        pos: [at.x + Math.cos(a) * d, y - 0.8, at.z + Math.sin(a) * d],
        rot: [(rnd() - 0.5) * 0.09, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.09],
        scale: [height * (0.78 + rnd() * 0.42), height, height * (0.78 + rnd() * 0.42)],
        tint: 0.82 + rnd() * 0.36,
        warm: (rnd() - 0.5) * 0.22,
      });
    }
  });

  buckets.forEach((variants, si) => {
    variants.forEach((items, vi) => {
      if (!items.length) return;
      const mesh = new THREE.InstancedMesh(geos[si][vi].crown, mats[si], items.length);
      mesh.name = `${SPECIES[si].name}-crown-${vi}`;
      fillInstances(mesh, items);
      // every tree its own shade — a wood is never one colour
      const col = new THREE.Color();
      items.forEach((it, i) => {
        col.setRGB(it.tint * (1 + it.warm), it.tint, it.tint * (1 - it.warm * 0.8));
        mesh.setColorAt(i, col);
      });
      mesh.instanceColor.needsUpdate = true;
      mesh.frustumCulled = false;
      group.add(mesh);

      const bark = new THREE.InstancedMesh(geos[si][vi].wood, woodMats[si], items.length);
      bark.name = `${SPECIES[si].name}-wood-${vi}`;
      fillInstances(bark, items);
      // barely any jitter on the wood: bark varies far less than foliage does
      items.forEach((it, i) => {
        const k = 0.88 + (it.tint - 0.82) * 0.34;
        col.setRGB(k * (1 + it.warm * 0.4), k, k * (1 - it.warm * 0.3));
        bark.setColorAt(i, col);
      });
      bark.instanceColor.needsUpdate = true;
      bark.frustumCulled = false;
      group.add(bark);
    });
  });

  return { group, species: SPECIES.map(s => s.name), count: buckets.flat(2).length };
}
