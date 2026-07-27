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
  return geo;
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
