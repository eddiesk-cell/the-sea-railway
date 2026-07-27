import * as THREE from 'three';
import { box, hill, mulberry, fillInstances, mergePN } from '../world/geo.js';
import { makePaintMaterial, makeGlowMaterial } from '../world/paintMaterial.js';

// ---------------------------------------------------------------------------
// Koriko — Kiki's Delivery Service, 1989.
//
// A northern harbour town stacked up a hillside: pale walls, red pantiles, and
// a clock tower with the sea behind it. The trick of the place is DENSITY —
// the houses are jammed together, none of them square to any other, and every
// roof is at a slightly different height. A tidy grid reads as a suburb; the
// mess is the town.
//
// Late afternoon, the light going gold along the roofs, and somebody flying
// too low over the chimneys with a delivery.
// ---------------------------------------------------------------------------

export function buildKoriko(shared) {
  const group = new THREE.Group();
  const rnd = mulberry(1989);

  const wallA = makePaintMaterial(shared, { color: '#cfc0a0', shadowTint: '#5a5150', rim: 0.65, bands: 3, grain: 0.16 });
  const wallB = makePaintMaterial(shared, { color: '#bda887', shadowTint: '#4e4644', rim: 0.65, bands: 3, grain: 0.18 });
  const wallC = makePaintMaterial(shared, { color: '#adb8b4', shadowTint: '#464f56', rim: 0.7, bands: 3, grain: 0.16 });
  const tile = makePaintMaterial(shared, { color: '#b84f36', shadowTint: '#3e1c26', rim: 0.9, bands: 3, grain: 0.18, side: THREE.DoubleSide });
  const tile2 = makePaintMaterial(shared, { color: '#8e4a34', shadowTint: '#331821', rim: 0.9, bands: 3, grain: 0.18, side: THREE.DoubleSide });
  const stone = makePaintMaterial(shared, { color: '#8d8578', shadowTint: '#333038', rim: 0.6, bands: 3, grain: 0.22, grainScale: 1.2 });
  const slate = makePaintMaterial(shared, { color: '#4b5560', shadowTint: '#181d26', rim: 1.0, bands: 3, grain: 0.12, side: THREE.DoubleSide });
  const grassM = makePaintMaterial(shared, { color: '#5c7a3c', shadowTint: '#1f2f22', rim: 0.5, bands: 3, grain: 0.2, grainScale: 0.5, sway: 0.03, translucency: 0.7 });

  // ---- the hill the town is built up ----
  const HX = -520, HZ = -1300;
  {
    const h = new THREE.Mesh(hill(360, 118, 12, { rough: 0.10, rings: 18, sectors: 26 }), grassM);
    h.position.set(HX, -6, HZ);
    group.add(h);
    const h2 = new THREE.Mesh(hill(240, 74, 19, { rough: 0.4 }), grassM);
    h2.position.set(HX - 300, -6, HZ - 520);
    group.add(h2);
    // the harbour wall, holding the sea off the low town
    const q = new THREE.Mesh(box(9, 7, 900), stone);
    q.position.set(HX + 300, 1.6, HZ - 40);
    group.add(q);
    // the quay in front of it, and boats tied along its length — the reason
    // the town is here at all, and the thing that makes it a harbour and not
    // simply a hill somebody built on
    const quay = new THREE.Mesh(box(26, 4, 880), stone);
    quay.position.set(HX + 316, 0.4, HZ - 40);
    group.add(quay);
    const hullM = makePaintMaterial(shared, { color: '#7c4a3c', shadowTint: '#2a1820', rim: 1.0, bands: 3, grain: 0.18 });
    const hullB = makePaintMaterial(shared, { color: '#37556b', shadowTint: '#141e2c', rim: 1.0, bands: 3, grain: 0.18 });
    for (let i = 0; i < 16; i++) {
      const b = new THREE.Group();
      b.position.set(HX + 336 + rnd() * 12, 0.9, HZ - 420 + i * 54 + rnd() * 20);
      b.rotation.y = 1.57 + (rnd() - 0.5) * 0.3;
      const hl = new THREE.Mesh(new THREE.SphereGeometry(1, 9, 6), rnd() > 0.5 ? hullM : hullB);
      const L = 7 + rnd() * 9;
      hl.scale.set(L * 0.30, L * 0.19, L); b.add(hl);
      const mast = new THREE.Mesh(box(0.22, 6 + rnd() * 7, 0.22), stone);
      mast.position.y = 4; b.add(mast);
      group.add(b);
    }
  }

  // ---- the town: a pitched roof needs only a squashed four-sided pyramid ----
  const roofGeo = (() => {
    const g = new THREE.ConeGeometry(0.78, 1, 4, 1);
    g.rotateY(Math.PI / 4);
    g.translate(0, 0.5, 0);
    return g;
  })();
  const gableGeo = (() => {
    // a ridged roof: two slopes, so a long house does not read as a tent
    const g = new THREE.CylinderGeometry(0.72, 0.72, 1, 3, 1, true);
    g.rotateZ(Math.PI / 2); g.rotateY(Math.PI / 2);
    return g;
  })();

  const wallsA = [], wallsB = [], wallsC = [], roofs = [], roofs2 = [], chimneys = [];
  // hill() is a hemisphere, so this is the hemisphere — inventing a different
  // curve here is exactly how a town ends up hanging in the air above its hill
  const domeH = (x, z) => {
    const d = Math.hypot(x - HX, z - HZ) / 360;
    return d >= 1 ? -6 : -6 + 118 * Math.sqrt(Math.max(0, 1 - d * d));
  };

  for (let i = 0; i < 520; i++) {
    const a = rnd() * Math.PI * 2;
    // right down to the water, not a crown on the summit: Koriko covers its
    // hill, and a bare front slope with roofs only along the top reads as a
    // wooded hill that happens to have a village on it
    const d = Math.pow(rnd(), 0.42) * 344;
    const x = HX + Math.cos(a) * d;
    const z = HZ + Math.sin(a) * d;
    const y = domeH(x, z);
    if (y < -4) continue;
    const w = 8 + rnd() * 9, dp = 8 + rnd() * 10;
    const h = 5 + rnd() * 10 + (1 - d / 336) * 5;
    const ry = rnd() * Math.PI * 2;
    const item = { pos: [x, y + h / 2 - 1.5, z], rot: [0, ry, 0], scale: [w, h, dp] };
    const pick = rnd();
    (pick < 0.45 ? wallsA : pick < 0.78 ? wallsB : wallsC).push(item);
    // Koriko seen from the water is nine tenths ROOF. A tall wall with a cap
    // on it reads as a warehouse district; the pantiles are the town.
    const rh = 4.6 + rnd() * 4.4;
    const r = { pos: [x, y + h - 1.5, z], rot: [0, ry, 0], scale: [(w + 1.4) / 1.56, rh, (dp + 1.4) / 1.56] };
    (rnd() > 0.35 ? roofs : roofs2).push(r);
    if (rnd() > 0.45) {
      chimneys.push({
        pos: [x + (rnd() - 0.5) * w * 0.5, y + h + rh * 0.7 - 1.5, z + (rnd() - 0.5) * dp * 0.5],
        rot: [0, ry, 0], scale: [0.9, 2.4 + rnd() * 1.6, 0.9],
      });
    }
  }
  const put = (items, geo, mat) => {
    if (!items.length) return;
    const m = new THREE.InstancedMesh(geo, mat, items.length);
    fillInstances(m, items); m.frustumCulled = false; group.add(m);
  };
  const unit = box(1, 1, 1);
  put(wallsA, unit, wallA); put(wallsB, unit, wallB); put(wallsC, unit, wallC);
  put(roofs, roofGeo, tile); put(roofs2, roofGeo, tile2);
  put(chimneys, unit, stone);
  void gableGeo;

  // ---- trees on the slope below the last houses, so the town has an edge ----
  {
    const clump = (() => {
      const parts = [];
      for (let i = 0; i < 3; i++) {
        const g = new THREE.IcosahedronGeometry(1, 0);
        const p = g.attributes.position;
        for (let v = 0; v < p.count; v++) {
          const n = 0.7 + ((v * 11 + i * 23) % 15) / 26;
          p.setXYZ(v, p.getX(v) * n, p.getY(v) * n * 0.9, p.getZ(v) * n);
        }
        g.computeVertexNormals();
        const s = 0.52 + (i % 3) * 0.15;
        g.scale(s, s, s);
        g.translate((i - 1) * 0.44, 0.36 + (i % 2) * 0.26, ((i * 5) % 3 - 1) * 0.36);
        parts.push(g);
      }
      return mergePN(parts);
    })();
    const dark = makePaintMaterial(shared, { color: '#41682f', shadowTint: '#152418', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.35, sway: 0.02, translucency: 0.5 });
    const items = [];
    for (let i = 0; i < 900; i++) {
      const a = rnd() * Math.PI * 2;
      const d = 348 + rnd() * 34;
      const x = HX + Math.cos(a) * d, z = HZ + Math.sin(a) * d;
      const y = domeH(x, z);
      if (y < -4) continue;
      const s = 3 + rnd() * 5;
      items.push({ pos: [x, y - 1.5, z], rot: [0, rnd() * 6.28, 0], scale: [s, s * (0.9 + rnd() * 0.6), s] });
    }
    const m = new THREE.InstancedMesh(clump, dark, items.length);
    fillInstances(m, items); m.frustumCulled = false; group.add(m);
  }

  // ---- the clock tower, which is what the eye goes to ----
  {
    const t = new THREE.Group();
    const tx = HX + 26, tz = HZ - 30;
    t.position.set(tx, domeH(tx, tz), tz);
    const shaft = new THREE.Mesh(box(11, 52, 11), wallA);
    shaft.position.y = 26; t.add(shaft);
    const band = new THREE.Mesh(box(12.4, 2.2, 12.4), stone);
    band.position.y = 46; t.add(band);
    const belfry = new THREE.Mesh(box(9.4, 12, 9.4), wallB);
    belfry.position.y = 55; t.add(belfry);
    for (const [dx, dz] of [[0, 4.8], [0, -4.8], [4.8, 0], [-4.8, 0]]) {
      const face = new THREE.Mesh(box(dz ? 6.2 : 0.3, 6.2, dz ? 0.3 : 6.2), wallC);
      face.position.set(dx, 56.5, dz); t.add(face);
      const hand = new THREE.Mesh(box(dz ? 2.6 : 0.34, 0.34, dz ? 0.34 : 2.6), stone);
      hand.position.set(dx * 1.06, 56.5, dz * 1.06); t.add(hand);
    }
    const roof = new THREE.Mesh(new THREE.ConeGeometry(8.6, 13, 4, 1), slate);
    roof.rotation.y = Math.PI / 4; roof.position.y = 68; t.add(roof);
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.5, 4.2, 6), slate);
    spike.position.y = 76; t.add(spike);
    group.add(t);
  }

  // ---- the lit windows that come on as the light goes ----
  {
    // Late afternoon, not midnight — a lit window at this hour is a warm
    // rectangle, and at 0.9 through the bloom it becomes a floodlight that
    // eats the roof it is set in.
    const glow = makeGlowMaterial(shared, '#ffd28a', 0.26);
    const items = [];
    for (let i = 0; i < 150; i++) {
      const src = [wallsA, wallsB, wallsC][(rnd() * 3) | 0];
      if (!src.length) continue;
      const h = src[(rnd() * src.length) | 0];
      const ry = h.rot[1];
      const w = h.scale[0], dp = h.scale[2];
      const face = rnd() > 0.5;
      const off = face ? [0, dp / 2 + 0.06] : [w / 2 + 0.06, 0];
      const s = rnd() > 0.5 ? 1 : -1;
      const ox = off[0] * s, oz = off[1] * s;
      items.push({
        pos: [
          h.pos[0] + ox * Math.cos(ry) + oz * Math.sin(ry),
          h.pos[1] + (rnd() - 0.4) * h.scale[1] * 0.6,
          h.pos[2] - ox * Math.sin(ry) + oz * Math.cos(ry),
        ],
        rot: [0, ry + (face ? 0 : Math.PI / 2), 0],
        scale: [1.0 + rnd() * 0.5, 1.3 + rnd() * 0.6, 1],
      });
    }
    const m = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), glow, items.length);
    fillInstances(m, items); m.frustumCulled = false; group.add(m);
  }

  // ---- gulls, because a harbour without them is a lake ----
  const gullMat = makePaintMaterial(shared, { color: '#f2f4f2', shadowTint: '#7c848c', rim: 0.9, bands: 2, grain: 0.06, side: THREE.DoubleSide });
  const wing = new THREE.PlaneGeometry(1, 0.2, 3, 1);
  {
    const p = wing.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const f = p.getX(i) + 0.5;
      p.setY(i, p.getY(i) * (1 - f * 0.62));
      p.setZ(i, -f * f * 0.22);
    }
    wing.computeVertexNormals();
  }
  const gulls = [];
  for (let i = 0; i < 26; i++) {
    gulls.push({
      x: HX + (rnd() - 0.3) * 700, y: 40 + rnd() * 90, z: HZ + (rnd() - 0.5) * 900,
      s: 1.4 + rnd() * 1.3, ph: rnd() * 6.28, r: 40 + rnd() * 90, sp: 0.10 + rnd() * 0.14,
    });
  }
  const gullMesh = new THREE.InstancedMesh(wing, gullMat, gulls.length * 2);
  gullMesh.frustumCulled = false; group.add(gullMesh);

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(),
        sv = new THREE.Vector3(), pv = new THREE.Vector3();

  function update(t) {
    gulls.forEach((g, i) => {
      const a = t * g.sp + g.ph;
      const x = g.x + Math.cos(a) * g.r;
      const z = g.z + Math.sin(a) * g.r;
      const y = g.y + Math.sin(t * 0.42 + g.ph) * 7;
      const flap = Math.sin(t * 3.1 + g.ph) * 0.5;
      for (let w = 0; w < 2; w++) {
        const s = w === 0 ? 1 : -1;
        pv.set(x + s * g.s * 0.4, y, z);
        e.set(Math.abs(flap) * 0.5, -a, s * (0.18 + flap));
        q.setFromEuler(e);
        sv.set(g.s * s, g.s, g.s);
        m4.compose(pv, q, sv);
        gullMesh.setMatrixAt(i * 2 + w, m4);
      }
    });
    gullMesh.instanceMatrix.needsUpdate = true;
  }
  update(0);

  return { group, update };
}
