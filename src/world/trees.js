import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mulberry, fillInstances } from './geo.js';
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

// --- fir: stacked skirts, narrow, dark ---
function conifer(rnd) {
  const parts = [];
  const trunk = new THREE.CylinderGeometry(0.018, 0.032, 0.30, 5);
  trunk.translate(0, 0.15, 0);
  parts.push(trunk);
  const tiers = 3;
  for (let i = 0; i < tiers; i++) {
    const f = i / tiers;
    const r = 0.30 * (1 - f * 0.55) * (0.85 + rnd() * 0.3);
    const h = 0.42 * (1 - f * 0.25);
    const c = new THREE.ConeGeometry(r, h, 6, 1);
    c.translate((rnd() - 0.5) * 0.03, 0.22 + f * 0.30 + h * 0.5, (rnd() - 0.5) * 0.03);
    parts.push(c);
  }
  return mergeGeometries(parts, false);
}

// --- broadleaf: a trunk and a lumpy crown ---
function broadleaf(rnd, spread = 1.0, lift = 1.0) {
  const parts = [];
  const trunk = new THREE.CylinderGeometry(0.028, 0.055, 0.52 * lift, 6);
  trunk.translate(0, 0.26 * lift, 0);
  parts.push(trunk);
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
  return mergeGeometries(parts, false);
}

// --- Japanese pine: a leaning trunk under flat plates of needles ---
function pineJp(rnd) {
  const parts = [];
  const lean = (rnd() - 0.5) * 0.5;
  const trunk = new THREE.CylinderGeometry(0.022, 0.045, 0.72, 6);
  trunk.rotateZ(lean * 0.35);
  trunk.translate(lean * 0.10, 0.36, 0);
  parts.push(trunk);
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
  return mergeGeometries(parts, false);
}

// --- blossom: a low, wide, soft cloud on a short trunk ---
function blossom(rnd) {
  return broadleaf(rnd, 1.28, 0.72);
}

// --- bamboo: a stand of canes ---
function bamboo(rnd) {
  const parts = [];
  const canes = 7;
  for (let i = 0; i < canes; i++) {
    const a = rnd() * Math.PI * 2, d = rnd() * 0.13;
    const h = 0.72 + rnd() * 0.28;
    const c = new THREE.CylinderGeometry(0.010, 0.014, h, 5);
    c.rotateZ((rnd() - 0.5) * 0.18);
    c.rotateX((rnd() - 0.5) * 0.18);
    c.translate(Math.cos(a) * d, h * 0.5, Math.sin(a) * d);
    parts.push(c);
    // a scruff of leaves at the top
    for (let k = 0; k < 3; k++) {
      const l = new THREE.SphereGeometry(0.055 + rnd() * 0.045, 5, 4);
      l.scale(1, 0.4, 1);
      l.translate(Math.cos(a) * d + (rnd() - 0.5) * 0.14,
                  h * (0.72 + rnd() * 0.3),
                  Math.sin(a) * d + (rnd() - 0.5) * 0.14);
      parts.push(l);
    }
  }
  return mergeGeometries(parts, false);
}

const SPECIES = [
  { name: 'fir',       make: conifer,   weight: 0.24, hMin: 13, hMax: 25,
    color: '#2f4a35', shadow: '#132a26', rim: 0.34, trans: 0.55 },
  { name: 'broadleaf', make: broadleaf, weight: 0.30, hMin: 10, hMax: 19,
    color: '#46592a', shadow: '#1b2c1c', rim: 0.40, trans: 1.05 },
  { name: 'pine',      make: pineJp,    weight: 0.17, hMin: 9,  hMax: 17,
    color: '#35492f', shadow: '#152720', rim: 0.42, trans: 0.75 },
  { name: 'blossom',   make: blossom,   weight: 0.11, hMin: 7,  hMax: 13,
    color: '#bb9498', shadow: '#513c47', rim: 0.66, trans: 0.95 },
  { name: 'bamboo',    make: bamboo,    weight: 0.18, hMin: 9,  hMax: 16,
    color: '#5d7431', shadow: '#26361d', rim: 0.50, trans: 1.20 },
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
    grain: 0.22, grainScale: 0.55, translucency: sp.trans,
  }));

  const buckets = SPECIES.map(() => [[], [], []]);
  const cumulative = [];
  let acc = 0;
  SPECIES.forEach(sp => { acc += sp.weight; cumulative.push(acc); });

  sites.forEach(({ at, r, h }) => {
    const n = Math.round(r * 4.6);
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2;
      const d = Math.sqrt(rnd()) * r * 0.95;
      const y = at.y + h * Math.sqrt(Math.max(0, 1 - (d / r) ** 2)) * 0.93;

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
      const mesh = new THREE.InstancedMesh(geos[si][vi], mats[si], items.length);
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
    });
  });

  return { group, species: SPECIES.map(s => s.name), count: buckets.flat(2).length };
}
