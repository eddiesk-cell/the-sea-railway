import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry } from './geo.js';

// ---------------------------------------------------------------------------
// The great camphor. Not a bigger version of a forest tree — a different thing
// altogether: a trunk you could not get your arms a tenth of the way around,
// splayed into buttress roots at the foot, dividing low into three or four
// enormous limbs, and a crown that spreads sideways rather than up.
//
// Everything is built around a height of 1 so the caller's scale is the height
// in metres, and the whole thing merges into two geometries — one bark, one
// leaf — because a tree this size is one silhouette, not five hundred meshes.
// ---------------------------------------------------------------------------

export function camphor(seed = 1, opts = {}) {
  const rnd = mulberry(seed);
  const bark = [];
  const leaf = [];
  const spread = opts.spread ?? 1.0;

  // ---- buttress roots: what makes an old tree look planted rather than stuck in
  const roots = 9 + ((rnd() * 4) | 0);
  for (let i = 0; i < roots; i++) {
    const a = (i / roots) * Math.PI * 2 + rnd() * 0.3;
    const reach = 0.085 + rnd() * 0.075;
    const g = new THREE.CylinderGeometry(0.020, 0.058, 0.20, 6);
    g.translate(0, 0.10, 0);
    g.rotateZ(0.72 + rnd() * 0.22);
    g.rotateY(-a);
    g.translate(Math.cos(a) * reach * 0.55, -0.005, Math.sin(a) * reach * 0.55);
    bark.push(g);
  }

  // ---- the trunk: a barrel, not a cone ----
  {
    const rings = [
      [0.00, 0.130], [0.06, 0.108], [0.14, 0.094], [0.24, 0.086],
      [0.33, 0.080], [0.42, 0.074],
    ];
    for (let i = 0; i < rings.length - 1; i++) {
      const [y0, r0] = rings[i], [y1, r1] = rings[i + 1];
      const g = new THREE.CylinderGeometry(r1, r0, y1 - y0, 12, 1);
      g.translate((rnd() - 0.5) * 0.012, (y0 + y1) * 0.5, (rnd() - 0.5) * 0.012);
      bark.push(g);
    }
  }

  // ---- the limbs, and the crown they carry ----
  // Three levels: a limb divides into boughs, boughs into branches, and every
  // branch end gets a mass of leaf. Recursion, but shallow — the silhouette is
  // made by the leaf masses, so the wood only has to get them to the right place.
  const limbs = 5 + ((rnd() * 2) | 0);
  const crownPts = [];

  function bough(from, dir, len, rad, depth) {
    const to = from.clone().addScaledVector(dir, len);
    const g = new THREE.CylinderGeometry(rad * 0.62, rad, len, depth > 1 ? 8 : 6, 1);
    g.translate(0, len * 0.5, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    g.applyQuaternion(q);
    g.translate(from.x, from.y, from.z);
    bark.push(g);

    if (depth === 0) { crownPts.push({ p: to, r: len * (1.7 + rnd() * 1.0) }); return; }
    // a mass of leaf partway along, too, or the crown is a rim with a hole in it
    if (depth === 1 && rnd() > 0.35) {
      crownPts.push({ p: to.clone().addScaledVector(dir, -len * 0.30), r: len * (0.95 + rnd() * 0.6) });
    }

    const n = depth === 2 ? 3 : 2 + ((rnd() * 2) | 0);
    for (let i = 0; i < n; i++) {
      const d = dir.clone();
      // Splay outward, and let the tips settle without levelling them: multiply
      // the rise away at every division and the whole crown lands on one plane,
      // which reads as a mushroom rather than a tree.
      const side = new THREE.Vector3(rnd() - 0.5, 0, rnd() - 0.5).normalize();
      d.addScaledVector(side, 0.48 + rnd() * 0.62);
      d.y = d.y * 0.80 + (rnd() - 0.5) * 0.30;
      d.normalize();
      bough(to, d, len * (0.62 + rnd() * 0.20), rad * 0.58, depth - 1);
    }
  }

  for (let i = 0; i < limbs; i++) {
    const a = (i / limbs) * Math.PI * 2 + rnd() * 0.5;
    const start = new THREE.Vector3(Math.cos(a) * 0.04, 0.30 + rnd() * 0.12, Math.sin(a) * 0.04);
    const dir = new THREE.Vector3(
      Math.cos(a) * (0.50 * spread),
      0.86 + rnd() * 0.22,
      Math.sin(a) * (0.50 * spread),
    ).normalize();
    bough(start, dir, 0.26 + rnd() * 0.10, 0.052, 2);
  }

  // ---- the leaf: overlapping lumps, flattened, never a sphere ----
  const blob = new THREE.IcosahedronGeometry(1, 1);
  crownPts.forEach(({ p, r }) => {
    const g = blob.clone();
    const pos = g.attributes.position;
    const squash = 0.66 + rnd() * 0.42;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const n = 0.70 + rnd() * 0.56;
      pos.setXYZ(i, x * n, y * n * squash, z * n);
    }
    g.computeVertexNormals();
    g.scale(r, r, r);
    g.translate(p.x, p.y + r * 0.20, p.z);
    leaf.push(g);
  });

  const out = {
    bark: mergeGeometries(bark.map(strip), false),
    leaf: mergeGeometries(leaf.map(strip), false),
  };
  bark.forEach(g => g.dispose());
  leaf.forEach(g => g.dispose());
  return out;
}

// mergeGeometries refuses a set whose attributes disagree — icosahedra come
// without uvs, cylinders come with them. Strip to position+normal and they merge.
function strip(g) {
  const out = new THREE.BufferGeometry();
  const src = g.index ? g.toNonIndexed() : g;
  out.setAttribute('position', src.attributes.position.clone());
  out.setAttribute('normal', src.attributes.normal.clone());
  if (src !== g) src.dispose();
  return out;
}

// The straw rope and its folded papers — what marks a tree as older than the
// village that farms around it.
export function shimenawa(radius, seed = 3) {
  const rnd = mulberry(seed);
  const parts = [];
  const rope = new THREE.TorusGeometry(radius, radius * 0.085, 6, 26);
  rope.rotateX(Math.PI / 2);
  parts.push(strip(rope));
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const t = new THREE.PlaneGeometry(radius * 0.14, radius * 0.34);
    t.translate(0, -radius * 0.24, 0);
    t.rotateY(-a + Math.PI / 2);
    t.translate(Math.cos(a) * radius * 1.02, -radius * 0.03, Math.sin(a) * radius * 1.02);
    parts.push(strip(t));
    void rnd;
  }
  const g = mergeGeometries(parts, false);
  parts.forEach(p => p.dispose());
  return g;
}
