import * as THREE from 'three';

// A Japanese hip roof: steep at the ridge, sweeping flat toward the eave,
// then turning back up at the tip — and lifting hardest at the corners.
// The whole silhouette of the bathhouse lives in this one function.
export function curvedRoof(w, d, h, opts = {}) {
  const seg = opts.seg ?? 16;
  const power = opts.power ?? 1.85;
  const flare = opts.flare ?? 0.12;
  const corner = opts.corner ?? 0.34;
  const hw = w / 2, hd = d / 2;

  const geo = new THREE.PlaneGeometry(w, d, seg, seg);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getY(i);
    const ax = Math.min(Math.abs(x) / hw, 1), az = Math.min(Math.abs(z) / hd, 1);
    const m = Math.max(ax, az);
    let y = h * Math.pow(1 - m, power);
    y += h * flare * Math.pow(m, 7);
    y += h * corner * Math.pow(ax * az, 2.1);
    pos.setZ(i, y);
  }
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

export function box(w, h, d) { return new THREE.BoxGeometry(w, h, d); }

// A lump of land. Rock, hill, embankment — same shape, different scale.
export function hill(radius, height, seed = 1, opts = {}) {
  const rings = opts.rings ?? 20, sectors = opts.sectors ?? 28;
  const rough = opts.rough ?? 0.34;
  const geo = new THREE.SphereGeometry(1, sectors, rings, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const pos = geo.attributes.position;
  const rnd = mulberry(seed);
  const off = [];
  for (let i = 0; i < 8; i++) off.push(rnd() * 100);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const a = Math.atan2(z, x);
    const n =
      Math.sin(a * 3.0 + off[0]) * 0.34 +
      Math.sin(a * 5.0 + off[1]) * 0.22 +
      Math.sin(a * 9.0 + off[2]) * 0.12 +
      Math.sin(a * 17.0 + off[3]) * 0.06;
    const s = 1 + n * rough * (1 - y * 0.55);
    pos.setXYZ(i, x * radius * s, y * height * (1 + n * rough * 0.35), z * radius * s);
  }
  geo.computeVertexNormals();
  // The dome describes itself. Three things need to know where this land is —
  // the trees planted on it, the places built on it, and the grass field that
  // has to grow over all of it — and each used to be told separately, which is
  // how six regions ended up with a sampler that disagreed with the ground.
  // Now the geometry carries the answer and anything can walk the scene and
  // ask, rather than being told twice and believing the wrong one.
  geo.userData.hill = { r: radius, h: height, rough, off: off.slice(0, 4) };
  return geo;
}

// Flatten a list of geometries into one position+normal buffer. Instancing
// takes a single geometry, so this is how "a thing made of several lumps"
// — a fern, a flower, a tree, a windmill sail — becomes one instanceable unit.
export function mergePN(list) {
  let vc = 0;
  const parts = list.map(g => {
    const s = g.index ? g.toNonIndexed() : g;
    vc += s.attributes.position.count;
    if (s !== g) g.dispose();
    return s;
  });
  const pos = new Float32Array(vc * 3), nrm = new Float32Array(vc * 3);
  let o = 0;
  parts.forEach(g => {
    pos.set(g.attributes.position.array, o * 3);
    nrm.set(g.attributes.normal.array, o * 3);
    o += g.attributes.position.count; g.dispose();
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  return out;
}

// The height of the surface `hill()` actually built, at a point measured from
// its centre. Returns null outside the skirt.
//
// This exists because every region had written its own version of it, and every
// one of them sampled a SMOOTH hemisphere while `hill()` builds a ROUGHENED
// one. At rough 0.12 that is a metre of error and nobody notices. At rough 0.34
// — Iron Town's stripped hill — and 0.52 — the wood behind the bathhouse — it
// is fifteen to twenty-five metres, and it plants a forest in mid air. Eddie
// found it in about a minute: "I see some of the structures floating off the
// ground", then "I see trees floating".
//
// The displacement is radial and depends on the height, and the height depends
// on the radius, so the inverse is implicit. Four fixed-point steps converge
// well inside a centimetre because the scale factor never leaves 1 ± rough.
export function hillSampler(radius, height, seed = 1, opts = {}) {
  const rough = opts.rough ?? 0.34;
  const rnd = mulberry(seed);
  const off = [];
  for (let i = 0; i < 8; i++) off.push(rnd() * 100);
  return (dx, dz) => {
    const D = Math.hypot(dx, dz);
    if (D < 1e-4) return height;
    const a = Math.atan2(dz, dx);
    const n =
      Math.sin(a * 3.0 + off[0]) * 0.34 +
      Math.sin(a * 5.0 + off[1]) * 0.22 +
      Math.sin(a * 9.0 + off[2]) * 0.12 +
      Math.sin(a * 17.0 + off[3]) * 0.06;
    let u = D / radius;
    for (let i = 0; i < 4; i++) {
      if (u >= 1) break;
      const y = Math.sqrt(Math.max(0, 1 - u * u));
      const s = Math.max(0.2, 1 + n * rough * (1 - y * 0.55));
      u = D / (radius * s);
    }
    if (u >= 1) return null;
    const y = Math.sqrt(Math.max(0, 1 - u * u));
    return y * height * (1 + n * rough * 0.35);
  };
}

export function mulberry(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fill an InstancedMesh from a list of {pos, rot, scale} — the bulk of the
// world's small repeated things go through here.
export function fillInstances(mesh, items) {
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  items.forEach((it, i) => {
    p.set(it.pos[0], it.pos[1], it.pos[2]);
    e.set(it.rot?.[0] ?? 0, it.rot?.[1] ?? 0, it.rot?.[2] ?? 0);
    q.setFromEuler(e);
    const sc = it.scale ?? 1;
    if (Array.isArray(sc)) s.set(sc[0], sc[1], sc[2]); else s.set(sc, sc, sc);
    m.compose(p, q, s);
    mesh.setMatrixAt(i, m);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.count = items.length;
  return mesh;
}
