import * as THREE from 'three';
import { mulberry } from './geo.js';

// Karst — the peaks a Chinese landscape is built from. Near-vertical sided,
// flared at the foot, narrowing to a rounded crown, and irregular enough that
// no two read alike. They are stacked in bands and left to the fog: the whole
// illusion of depth in a shui-mo painting is that each range is paler than the
// one in front, until the furthest simply isn't there.
export function karstPeak(radius, height, seed, opts = {}) {
  const rnd = mulberry(seed);
  const rings = opts.rings ?? 22;
  const sectors = opts.sectors ?? 14;
  const lean = opts.lean ?? (rnd() - 0.5) * 0.22;

  // vertical profile
  const pts = [];
  for (let i = 0; i <= rings; i++) {
    const t = i / rings;
    let r = radius * (0.30 + 0.70 * Math.pow(1 - t, 0.20));
    r *= 1 + Math.sin(t * 9.0 + seed) * 0.07 + Math.sin(t * 21.0 + seed * 2.3) * 0.03;
    if (t > 0.93) r *= Math.sqrt(Math.max(0, 1 - ((t - 0.93) / 0.07) ** 2)) * 0.9 + 0.06;
    if (t < 0.06) r *= 1 + (0.06 - t) * 5.0;      // the foot spreads into scree
    pts.push(new THREE.Vector2(Math.max(r, 0.01), t * height));
  }

  const geo = new THREE.LatheGeometry(pts, sectors);
  const pos = geo.attributes.position;
  const off = Array.from({ length: 6 }, () => rnd() * 100);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const a = Math.atan2(z, x);
    const t = y / height;
    // gullies down the face, deeper toward the base
    const n =
      Math.sin(a * 3 + off[0] + t * 1.4) * 0.16 +
      Math.sin(a * 7 + off[1] - t * 2.1) * 0.09 +
      Math.sin(a * 13 + off[2] + t * 3.3) * 0.05;
    const s = 1 + n * (0.5 + (1 - t) * 0.8);
    // and the whole spire leans
    const shift = lean * height * Math.pow(t, 1.6);
    pos.setXYZ(i, x * s + shift, y, z * s);
  }
  geo.computeVertexNormals();
  return geo;
}

// A stand of bamboo: one cane, its nodes, and a scruff of blades near the top.
// Built to a height of 1 so the instance scale is the height in metres.
export function bambooCane(seed = 1) {
  const rnd = mulberry(seed);
  const parts = [];
  const SEGS = 7;
  for (let i = 0; i < SEGS; i++) {
    const y0 = i / SEGS, y1 = (i + 1) / SEGS;
    const r = 0.027 * (1 - y0 * 0.42);
    const c = new THREE.CylinderGeometry(r * 0.96, r, (y1 - y0) * 0.97, 6);
    c.translate(0, (y0 + y1) * 0.5, 0);
    parts.push(c);
    const node = new THREE.CylinderGeometry(r * 1.22, r * 1.22, 0.010, 6);
    node.translate(0, y1, 0);
    parts.push(node);
  }
  // Leaves grow in fans off a node, not scattered up the cane — which is the
  // difference between bamboo and a dead stick.
  const fans = 8;
  for (let f = 0; f < fans; f++) {
    const fy = 0.46 + (f / fans) * 0.50 + rnd() * 0.04;
    const fa = rnd() * Math.PI * 2;
    const blades = 6 + ((rnd() * 4) | 0);
    for (let i = 0; i < blades; i++) {
    const a = fa + (i - blades / 2) * 0.38 + (rnd() - 0.5) * 0.2;
    const y = fy + (rnd() - 0.5) * 0.03;
    // a leaf is a hand's length whatever the cane is — scale it with the
    // cane and a twenty-metre bamboo grows six-metre leaves
    const len = 0.048 + rnd() * 0.055;
    const g = new THREE.PlaneGeometry(len, 0.0135, 4, 1);
    // taper and droop
    const p = g.attributes.position;
    for (let v = 0; v < p.count; v++) {
      const f = (p.getX(v) / len) + 0.5;
      p.setY(v, p.getY(v) * (1 - f * 0.85));
      p.setZ(v, -f * f * len * 0.55);
    }
    g.computeVertexNormals();
    g.rotateZ(-0.22 - rnd() * 0.3);
    g.rotateY(a);
    g.translate(Math.cos(a) * len * 0.5, y, Math.sin(a) * len * 0.5);
    parts.push(g);
    }
  }
  return mergeAll(parts);
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
