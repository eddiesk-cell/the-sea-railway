import * as THREE from 'three';
import { mulberry } from './geo.js';

// ---------------------------------------------------------------------------
// Huangshan, the way it is painted rather than the way it is photographed.
//
// The mountains in a shui-mo scroll are not cones and they are not domes. They
// are SLABS — near-vertical blades of rock with flat fractured faces, squared
// or splintered at the top, four to eight times as tall as they are wide, and
// scored all the way down with vertical strokes. They stand in ranks, each
// paler than the one in front, and they are cut across at height by decks of
// cloud, so that no peak ever shows you its own foot.
//
// Everything here serves that: build an irregular polygon cross-section,
// squash it to a blade, extrude it upward almost without taper, splinter the
// crown facet by facet, and flute the faces. The cloud is done in the shader,
// where it can cross everything at once.
// ---------------------------------------------------------------------------

export function karstPeak(radius, height, seed, opts = {}) {
  const rnd = mulberry(seed);
  const sides = opts.sectors ?? 9;
  const rings = opts.rings ?? 16;
  const lean = opts.lean ?? (rnd() - 0.5) * 0.16;

  // ---- the cross-section: an irregular polygon, not a circle ----
  // A few long flat faces and a couple of short ones is what gives a slab its
  // planes; an even polygon just reads as a cylinder.
  const face = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    face.push({ a, r: 0.42 + rnd() * 0.75 });
  }
  // squash one axis: a blade seen edge-on is far thinner than it is wide
  const flat = 0.34 + rnd() * 0.30;
  const twist = rnd() * Math.PI;
  // each facet ends at its own height — the crown is a set of splinters
  const splinter = face.map(() => 0.78 + rnd() * 0.22);

  const pos = [], nrm = [], idx = [];

  for (let j = 0; j <= rings; j++) {
    const t = j / rings;
    // a slab holds its width nearly to the top and then goes suddenly
    let w = 1.0 - Math.pow(t, 3.4) * 0.52;
    if (t < 0.10) w *= 1.0 + (0.10 - t) * 2.6;       // the foot flares into scree
    for (let i = 0; i < sides; i++) {
      const f = face[i];
      // vertical fluting: one stroke repeated the whole height of a face,
      // which is exactly how the texture strokes are laid on in the painting
      const flute = 1.0
        + Math.sin(f.a * 7.0 + seed) * 0.10
        + Math.sin(f.a * 17.0 + seed * 2.1) * 0.055
        + Math.sin(t * 5.0 + f.a * 3.0 + seed) * 0.030;
      const cut = t > splinter[i]
        ? Math.pow(Math.max(0, 1 - (t - splinter[i]) / (1 - splinter[i] + 0.001)), 0.7)
        : 1;
      const r = radius * f.r * w * flute * (0.16 + 0.84 * cut);
      const ca = Math.cos(f.a + twist), sa = Math.sin(f.a + twist);
      pos.push(ca * r + lean * height * Math.pow(t, 1.5), t * height, sa * r * flat);
      nrm.push(0, 0, 0);
    }
  }

  for (let j = 0; j < rings; j++) {
    for (let i = 0; i < sides; i++) {
      const a = j * sides + i;
      const b = j * sides + ((i + 1) % sides);
      idx.push(a, a + sides, b, b, a + sides, b + sides);
    }
  }
  // cap the top, or it is hollow when the train is above it
  const top = rings * sides;
  for (let i = 1; i < sides - 1; i++) idx.push(top, top + i, top + i + 1);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nrm), 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

// ---------------------------------------------------------------------------
// The Huangshan pine — the other half of the picture.
//
// A trunk that leaves the rock sideways, a few very long level limbs, and flat
// plates of needle laid on top of them like tables. Against cloud it is pure
// silhouette, and the silhouette is HORIZONTAL, which is the only reason the
// verticals read as vertical. Built to a height of 1.
// ---------------------------------------------------------------------------
export function cliffPine(seed = 1, opts = {}) {
  const rnd = mulberry(seed);
  const wood = [], plates = [];
  const outward = opts.outward ?? 1.0;

  const segs = 5;
  let p = new THREE.Vector3(0, 0, 0);
  let dir = new THREE.Vector3(0.44 * outward, 0.86, (rnd() - 0.5) * 0.3).normalize();
  const nodes = [];
  for (let i = 0; i < segs; i++) {
    const len = 0.26 - i * 0.028;
    const r = 0.034 - i * 0.005;
    const to = p.clone().addScaledVector(dir, len);
    const g = new THREE.CylinderGeometry(r * 0.72, r, len, 6);
    g.translate(0, len * 0.5, 0);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir));
    g.translate(p.x, p.y, p.z);
    wood.push(g);
    nodes.push({ at: to.clone(), t: (i + 1) / segs });
    p = to;
    dir = dir.clone().lerp(new THREE.Vector3(0.12 * outward, 1, 0), 0.42).normalize();
  }

  nodes.forEach(({ at, t }, i) => {
    if (t < 0.28) return;
    const n = i === nodes.length - 1 ? 2 : 1 + ((rnd() * 2) | 0);
    for (let k = 0; k < n; k++) {
      const a = rnd() * Math.PI * 2;
      const reach = (0.30 + rnd() * 0.34) * (1.25 - t * 0.5);
      const d = new THREE.Vector3(Math.cos(a), 0.10 + rnd() * 0.16, Math.sin(a)).normalize();
      const end = at.clone().addScaledVector(d, reach);
      const g = new THREE.CylinderGeometry(0.007, 0.017, reach, 5);
      g.translate(0, reach * 0.5, 0);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d));
      g.translate(at.x, at.y, at.z);
      wood.push(g);

      // the plate of needle: wide, very flat, and never a clean circle
      const pr = reach * (0.54 + rnd() * 0.36);
      const plate = new THREE.CylinderGeometry(pr, pr * 0.82, 0.016, 9, 1);
      const pp = plate.attributes.position;
      for (let v = 0; v < pp.count; v++) {
        const x = pp.getX(v), z = pp.getZ(v);
        const ang = Math.atan2(z, x);
        const k2 = 1 + Math.sin(ang * 5.0 + seed) * 0.15 + Math.sin(ang * 11.0) * 0.09;
        pp.setXYZ(v, x * k2, pp.getY(v), z * k2);
      }
      plate.computeVertexNormals();
      plate.translate(end.x, end.y + 0.022, end.z);
      plates.push(plate);
    }
  });

  const cr = 0.30 + rnd() * 0.16;
  const crown = new THREE.CylinderGeometry(cr, cr * 0.8, 0.018, 9, 1);
  crown.translate(p.x, p.y + 0.03, p.z);
  plates.push(crown);

  return { wood: mergeSimple(wood), needle: mergeSimple(plates) };
}

// merge position/normal only — uvs differ between primitives and a merge
// refuses any set whose attributes disagree
function mergeSimple(list) {
  let vc = 0;
  const parts = list.map((g) => {
    const s = g.index ? g.toNonIndexed() : g;
    vc += s.attributes.position.count;
    if (s !== g) g.dispose();
    return s;
  });
  const pos = new Float32Array(vc * 3), nrm = new Float32Array(vc * 3);
  let o = 0;
  parts.forEach((g) => {
    pos.set(g.attributes.position.array, o * 3);
    nrm.set(g.attributes.normal.array, o * 3);
    o += g.attributes.position.count;
    g.dispose();
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  return out;
}

// A stand of bamboo: one cane, its nodes, and a scruff of blades near the top.
// Built to a height of 1 so the instance scale is the height in metres.
// One long leaf, anchored at its stalk and pointing +X: tapered to a point,
// curling away as it goes. Bigger than life on purpose — a bamboo leaf is a
// hand's length, and a hand's length on a thirty-metre cane seen from a train
// is a speck. Mass is what makes a grove shade the ground.
function inkBlade(len) {
  const g = new THREE.PlaneGeometry(len, 0.0092, 3, 1);
  const p = g.attributes.position;
  for (let v = 0; v < p.count; v++) {
    const ff = (p.getX(v) / len) + 0.5;
    p.setY(v, p.getY(v) * (1 - ff * 0.88));
    p.setZ(v, -ff * ff * len * 0.42);
  }
  g.computeVertexNormals();
  g.translate(len / 2, 0, 0);
  return g;
}

export function bambooCane(seed = 1) {
  const rnd = mulberry(seed);
  const parts = [];
  const SEGS = 8;
  // A cane is a fifth of a metre thick and thirty metres tall. Tie the radius
  // to too large a fraction of the height and it comes out a metre wide, which
  // is a tree; this fraction is what makes it bamboo.
  for (let i = 0; i < SEGS; i++) {
    const y0 = i / SEGS, y1 = (i + 1) / SEGS;
    const r = 0.0036 * (1 - y0 * 0.45);
    const c = new THREE.CylinderGeometry(r * 0.96, r, (y1 - y0) * 0.97, 5);
    c.translate(0, (y0 + y1) * 0.5, 0);
    parts.push(c);
    const node = new THREE.CylinderGeometry(r * 1.24, r * 1.24, 0.0028, 5);
    node.translate(0, y1, 0);
    parts.push(node);
  }

  // Eddie, twice, and he was right both times: "there are still no branches at
  // the top, and there are no spreads with bamboo leaves covering for shade."
  //
  // Leaves used to hang straight off the cane, twenty centimetres from its
  // axis, which is a bottle brush — a pole with bristles. A bamboo carries its
  // leaves on BRANCHES two or three metres long, spiralling off the top nodes,
  // and it is those branches that hold the foliage out far enough to close
  // over and make a grove dark underneath. The branch is the whole thing.
  const fans = 8;
  for (let f = 0; f < fans; f++) {
    const fy = 0.56 + (f / fans) * 0.42 + rnd() * 0.02;
    const az = f * 2.39996 + rnd() * 0.6;
    const up = 0.52 - (fy - 0.56) * 0.85 + rnd() * 0.22;
    const blen = 0.038 + rnd() * 0.042;

    // built lying along +X, then raised, spun, and lifted to its node
    const xf = (g) => { g.rotateZ(up); g.rotateY(-az); g.translate(0, fy, 0); return g; };

    const st = new THREE.CylinderGeometry(0.0008, 0.0017, blen, 4);
    st.rotateZ(-Math.PI / 2); st.translate(blen * 0.5, 0, 0);
    parts.push(xf(st));

    for (let k = 0; k < 3; k++) {
      const at = blen * (0.50 + k * 0.26);
      const droop = -0.24 - rnd() * 0.44;
      for (let j = 0; j < 3; j++) {
        const bl = inkBlade(0.030 + rnd() * 0.026);
        bl.rotateZ(droop);
        bl.rotateX((j - 1) * (0.58 + rnd() * 0.34));
        bl.translate(at, 0, 0);
        parts.push(xf(bl));
      }
    }
  }

  const merged = mergeAll(parts);
  // the top of a cane bows over under its own leaf — without this they are poles
  const mp = merged.attributes.position;
  for (let i = 0; i < mp.count; i++) {
    const t = Math.max(0, mp.getY(i) - 0.34) / 0.66;
    mp.setX(i, mp.getX(i) + t * t * 0.115);
  }
  merged.computeVertexNormals();
  return merged;
}

function mergeAll(list) {
  // a tiny merge: these are all position/normal/uv indexed geometries
  let vCount = 0, iCount = 0;
  list.forEach(g => { vCount += g.attributes.position.count; iCount += g.index ? g.index.count : 0; });
  const pos = new Float32Array(vCount * 3);
  const nrm = new Float32Array(vCount * 3);
  const uv = new Float32Array(vCount * 2);
  const idx = new Uint32Array(iCount);
  let vo = 0, io = 0;
  list.forEach(g => {
    const gp = g.attributes.position, gn = g.attributes.normal, gu = g.attributes.uv;
    pos.set(gp.array, vo * 3);
    nrm.set(gn.array, vo * 3);
    if (gu) uv.set(gu.array, vo * 2);
    const gi = g.index.array;
    for (let i = 0; i < gi.length; i++) idx[io + i] = gi[i] + vo;
    vo += gp.count; io += gi.length;
    g.dispose();
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  return out;
}
