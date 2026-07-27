import * as THREE from 'three';
import { mulberry, fillInstances } from './geo.js';
import { makePaintMaterial, makeGlowMaterial } from './paintMaterial.js';
import { patchHalo } from './bathhouse.js';

// Everything alive in this world, or nearly alive:
// the passengers waiting on the water, the lanterns that drift,
// the steam off the bathhouse, and the white dragon in the high air.

// ---------------------------------------------------------------------------
// The waiting ones. Flat black cloaks, a pale mask, and they do not move much.
// ---------------------------------------------------------------------------
export function createSpirits(shared) {
  const group = new THREE.Group();
  const rnd = mulberry(41);

  const pts = [];
  const prof = [
    [0.00, 0.00], [0.58, 0.02], [0.62, 0.18], [0.54, 0.52],
    [0.46, 0.90], [0.40, 1.20], [0.30, 1.44], [0.20, 1.60],
    [0.16, 1.72], [0.00, 1.80],
  ];
  prof.forEach(([r, y]) => pts.push(new THREE.Vector2(r, y)));
  const cloakGeo = new THREE.LatheGeometry(pts, 14);

  const cloakMat = makePaintMaterial(shared, {
    color: '#0b0d16', shadowTint: '#05070f', rim: 2.6, bands: 2, grain: 0.18,
    transparent: true, opacity: 0.88, side: THREE.DoubleSide,
  });

  const maskMat = makeGlowMaterial(shared, '#e6dcc4', 0.60);

  const cloaks = [];
  const bobs = [];

  // a loose queue along the water beside the platform, plus two on the deck
  const spots = [
    [ 3.0, 0.02, -3.0], [ 4.4, 0.02, -7.5], [ 2.2, 0.02, -12.0],
    [ 5.9, 0.02, -16.5], [ 3.4, 0.02, -21.0], [ 7.0, 0.02, -26.0],
    [-4.2, 0.02,  -9.0], [-6.0, 0.02, -18.0],
    [ 4.4, 1.45,   0.5], [ 6.6, 1.45,  -4.0],
  ];

  spots.forEach(([x, y, z], i) => {
    const s = 0.92 + rnd() * 0.34;
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = Math.atan2(-300 - x, -210 - z) + (rnd() - 0.5) * 0.7;

    const c = new THREE.Mesh(cloakGeo, cloakMat);
    c.scale.setScalar(s);
    g.add(c);

    const mask = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8), maskMat);
    mask.scale.set(0.82, 1.12, 0.5);
    mask.position.set(0, 1.63 * s, 0.13 * s);
    g.add(mask);

    group.add(g);
    cloaks.push(g);
    bobs.push({ base: y, phase: rnd() * 6.28, amp: 0.03 + rnd() * 0.05, speed: 0.4 + rnd() * 0.35 });
  });

  function update(t) {
    for (let i = 0; i < cloaks.length; i++) {
      const b = bobs[i];
      cloaks[i].position.y = b.base + Math.sin(t * b.speed + b.phase) * b.amp;
      cloaks[i].rotation.z = Math.sin(t * b.speed * 0.7 + b.phase) * 0.012;
    }
  }

  return { group, update };
}

// ---------------------------------------------------------------------------
// Lanterns: some resting on the water, some already let go of.
// ---------------------------------------------------------------------------
export function createLanterns(shared) {
  const group = new THREE.Group();
  const rnd = mulberry(83);

  const FLOAT = 46, AIR = 34;

  const bodyMat = makeGlowMaterial(shared, '#ffb15c', 1.55, { flicker: 0.12 });
  const haloMat = makeGlowMaterial(shared, '#ff9a3c', 0.30, {
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, flicker: 0.12,
  });
  patchHalo(haloMat);

  const geo = new THREE.CylinderGeometry(0.30, 0.26, 0.44, 8);
  const floaters = new THREE.InstancedMesh(geo, bodyMat, FLOAT);
  const floatHalo = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), haloMat, FLOAT);
  const airs = new THREE.InstancedMesh(geo, bodyMat, AIR);
  const airHalo = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), haloMat, AIR);
  [floaters, floatHalo, airs, airHalo].forEach(m => { m.frustumCulled = false; group.add(m); });
  floatHalo.renderOrder = 20; airHalo.renderOrder = 20;

  const fData = [], aData = [];
  for (let i = 0; i < FLOAT; i++) {
    const a = rnd() * Math.PI * 2, r = 14 + rnd() * 150;
    fData.push({ x: Math.cos(a) * r, z: Math.sin(a) * r - 30, s: 0.7 + rnd() * 0.9, ph: rnd() * 6.28, dr: 0.25 + rnd() * 0.4 });
  }
  for (let i = 0; i < AIR; i++) {
    const a = rnd() * Math.PI * 2, r = 22 + rnd() * 210;
    aData.push({
      x: Math.cos(a) * r, z: Math.sin(a) * r - 60,
      y: 5 + rnd() * 46, s: 0.6 + rnd() * 1.1,
      ph: rnd() * 6.28, rise: 0.16 + rnd() * 0.3, sway: 1.4 + rnd() * 2.6,
    });
  }

  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3();

  function update(t) {
    for (let i = 0; i < FLOAT; i++) {
      const d = fData[i];
      const x = d.x + Math.sin(t * 0.14 + d.ph) * 2.2;
      const z = d.z + Math.cos(t * 0.11 + d.ph * 1.7) * 2.2 + t * d.dr * 0.35;
      const y = 0.20 + Math.sin(t * 0.9 + d.ph) * 0.035;
      pv.set(x, y, z); sv.setScalar(d.s);
      q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.sin(t * 0.6 + d.ph) * 0.06);
      m.compose(pv, q, sv); floaters.setMatrixAt(i, m);
      sv.setScalar(d.s * 5.0); m.compose(pv, q, sv); floatHalo.setMatrixAt(i, m);
    }
    for (let i = 0; i < AIR; i++) {
      const d = aData[i];
      const y = 5 + ((d.y - 5 + t * d.rise) % 58);
      const x = d.x + Math.sin(t * 0.19 + d.ph) * d.sway;
      const z = d.z + Math.cos(t * 0.15 + d.ph * 1.3) * d.sway;
      pv.set(x, y, z); sv.setScalar(d.s);
      q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.sin(t * 0.5 + d.ph) * 0.12);
      m.compose(pv, q, sv); airs.setMatrixAt(i, m);
      sv.setScalar(d.s * 8.5); m.compose(pv, q, sv); airHalo.setMatrixAt(i, m);
    }
    floaters.instanceMatrix.needsUpdate = true;
    floatHalo.instanceMatrix.needsUpdate = true;
    airs.instanceMatrix.needsUpdate = true;
    airHalo.instanceMatrix.needsUpdate = true;
  }

  update(0);
  return { group, update };
}

// ---------------------------------------------------------------------------
// Steam off the bathhouse. Soft, cool, always rising.
// ---------------------------------------------------------------------------
export function createSteam(shared, origin) {
  const N = 42;
  const rnd = mulberry(131);
  const mat = makeGlowMaterial(shared, '#cfd8e4', 0.22, {
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  patchHalo(mat);
  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mat, N);
  mesh.frustumCulled = false;
  mesh.renderOrder = 18;

  const data = [];
  for (let i = 0; i < N; i++) {
    data.push({
      ox: (rnd() - 0.5) * 90, oz: (rnd() - 0.5) * 70,
      t0: rnd(), speed: 0.055 + rnd() * 0.06,
      s: 16 + rnd() * 30, sway: 8 + rnd() * 18, ph: rnd() * 6.28,
    });
  }

  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3();
  function update(t) {
    for (let i = 0; i < N; i++) {
      const d = data[i];
      const life = (d.t0 + t * d.speed) % 1;
      const y = origin.y + life * 130;
      const grow = 0.35 + life * 1.5;
      pv.set(origin.x + d.ox + Math.sin(t * 0.1 + d.ph) * d.sway * life * 2.2,
             y,
             origin.z + d.oz + Math.cos(t * 0.08 + d.ph) * d.sway * life);
      const fade = Math.sin(life * Math.PI);
      sv.setScalar(d.s * grow * (0.35 + fade * 0.9));
      m.compose(pv, q, sv);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
  update(0);
  return { mesh, update };
}

// ---------------------------------------------------------------------------
// Haku, high up and a long way off, going somewhere.
// ---------------------------------------------------------------------------
export function createDragon(shared) {
  const SEG = 96;
  const mat = makePaintMaterial(shared, {
    color: '#eef4f0', shadowTint: '#7d97a0', rim: 1.6, bands: 3, grain: 0.06,
    emissive: '#9fd0c8', emissiveStrength: 0.05,
  });
  const geo = new THREE.SphereGeometry(1, 10, 8);
  geo.scale(1, 0.95, 1.35);
  const mesh = new THREE.InstancedMesh(geo, mat, SEG);
  mesh.frustumCulled = false;

  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3();
  const p = new THREE.Vector3(), p2 = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const mtx = new THREE.Matrix4();

  function path(t, out) {
    const a = t * 0.115;
    out.set(
      Math.sin(a) * 300 - 110 + Math.sin(a * 2.3) * 62,
      92 + Math.sin(a * 1.9 + 1.1) * 24 + Math.sin(a * 4.7) * 7,
      Math.cos(a * 0.82) * 280 - 250 + Math.cos(a * 3.1) * 48
    );
    return out;
  }

  function update(t) {
    for (let i = 0; i < SEG; i++) {
      const lag = i * 0.030;
      path(t - lag, p);
      path(t - lag - 0.032, p2);
      // undulation, perpendicular to travel
      const wave = Math.sin(t * 1.25 - i * 0.135) * 7.4 * (0.55 + 0.45 * (i / SEG));
      p.y += wave;
      p.x += Math.cos(t * 1.25 - i * 0.135) * 4.6;

      mtx.lookAt(p, p2, up);
      q.setFromRotationMatrix(mtx);
      // thickest at the head, tapering the whole length to a point at the tail
      const f = i / (SEG - 1);
      const taper = f < 0.07 ? 1.22 : Math.pow(1 - (f - 0.07) / 0.93, 0.7);
      const r = 2.85 * Math.max(taper, 0.05);
      sv.set(r, r * 0.86, r * 1.9);
      m.compose(p, q, sv);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  update(0);
  return { mesh, update };
}

// ---------------------------------------------------------------------------
// Reeds along the embankment — dark strokes that catch the low light.
// ---------------------------------------------------------------------------
export function createReeds(shared) {
  const rnd = mulberry(211);
  const mat = makePaintMaterial(shared, {
    color: '#141d1c', shadowTint: '#070b11', rim: 1.5, bands: 2, grain: 0.2,
    side: THREE.DoubleSide, sway: 0.16,
  });

  // a tapered blade, pivoting at the base
  const g = new THREE.BufferGeometry();
  const h = 1.0, w = 0.10;
  const verts = [], norms = [], uvs = [], idx = [];
  const STEPS = 4;
  for (let i = 0; i <= STEPS; i++) {
    const f = i / STEPS;
    const yy = f * h;
    const ww = w * (1 - f * 0.88);
    verts.push(-ww, yy, 0, ww, yy, 0);
    norms.push(0, 0, 1, 0, 0, 1);
    uvs.push(0, f, 1, f);
  }
  for (let i = 0; i < STEPS; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(norms, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);

  const N = 2200;
  const mesh = new THREE.InstancedMesh(g, mat, N);
  mesh.frustumCulled = false;
  const items = [];
  for (let i = 0; i < N; i++) {
    const side = rnd() > 0.5 ? 1 : -1;
    const x = side * (4.9 + Math.pow(rnd(), 1.9) * 5.4);
    const z = (rnd() - 0.5) * 430;
    items.push({
      pos: [x, -0.1, z],
      rot: [(rnd() - 0.5) * 0.16, rnd() * Math.PI, (rnd() - 0.5) * 0.24],
      scale: [1, 0.42 + rnd() * 0.75, 1],
    });
  }
  fillInstances(mesh, items);
  return { mesh };
}
