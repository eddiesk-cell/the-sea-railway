import * as THREE from 'three';
import { box, hill, mulberry, fillInstances, mergePN } from '../world/geo.js';
import { makePaintMaterial, makeGlowMaterial } from '../world/paintMaterial.js';

// ---------------------------------------------------------------------------
// Iron Town — Princess Mononoke, 1997.
//
// The forest's opposite, and the reason the film is not a fable about goodies
// and baddies: a walled works on a lake, running day and night, feeding on the
// hill behind it. Palisade, furnace, smoke, and a scar in the trees where the
// charcoal came from.
//
// Two rules make it read:
//   1. It is the ONLY lit thing. Everything else on this stretch is dark, so
//      the furnace mouth is the whole composition — one orange in a green-black
//      world.
//   2. The damage has to be visible. A tidy town on a lake is a postcard; the
//      stumps on the bare hill behind it are what make it Iron Town.
// ---------------------------------------------------------------------------

export function buildIronTown(shared) {
  const group = new THREE.Group();
  const rnd = mulberry(1997 * 3);

  const timber = makePaintMaterial(shared, { color: '#4e3f30', shadowTint: '#171319', rim: 0.8, bands: 3, grain: 0.30, grainScale: 1.5 });
  const timberD = makePaintMaterial(shared, { color: '#3a2f25', shadowTint: '#100d14', rim: 0.7, bands: 3, grain: 0.30, grainScale: 1.8 });
  const plank = makePaintMaterial(shared, { color: '#6a5a45', shadowTint: '#221c1e', rim: 0.9, bands: 3, grain: 0.26, grainScale: 1.2 });
  const thatch = makePaintMaterial(shared, { color: '#7a6a4a', shadowTint: '#251f1c', rim: 0.7, bands: 3, grain: 0.34, grainScale: 0.8, side: THREE.DoubleSide });
  const stoneM = makePaintMaterial(shared, { color: '#5c5b56', shadowTint: '#1c1d20', rim: 0.7, bands: 3, grain: 0.26, grainScale: 1.0 });
  const slagM = makePaintMaterial(shared, { color: '#3b3630', shadowTint: '#121013', rim: 0.6, bands: 3, grain: 0.30, grainScale: 0.6 });
  const bare = makePaintMaterial(shared, { color: '#5a4c3a', shadowTint: '#1e1a1a', rim: 0.5, bands: 3, grain: 0.28, grainScale: 0.5 });
  const scrub = makePaintMaterial(shared, { color: '#3e5533', shadowTint: '#141f18', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.4, sway: 0.02, translucency: 0.6 });
  const fireM = makeGlowMaterial(shared, '#ff9a3c', 2.1, { flicker: 0.55 });
  const emberM = makeGlowMaterial(shared, '#ffb85c', 1.4, {
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, flicker: 0.6,
  });
  const lampM = makeGlowMaterial(shared, '#ffcf86', 0.95, { flicker: 0.2 });

  // =========================================================================
  // The lake shore. The works stand out over the water on piles, which is how
  // a bellows town gets its draught and its landing in the same move.
  // =========================================================================
  const TX = -430, TZ = -1300;              // the town's centre
  {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 20; i++) {
        const b = new THREE.Mesh(box(1, 1, 1), i % 3 ? slagM : bare);
        const w = 180 + rnd() * 260;
        // the near shore is cut back where the works is, so the water reaches
        const inner = (side < 0 && i > 5 && i < 15) ? 190 : 16;
        b.position.set(side * (inner + w / 2), 0.3 + rnd() * 0.4, -130 - i * 130);
        b.scale.set(w, 2.4, 130 + rnd() * 34);
        group.add(b);
      }
    }
  }

  // ---- the hill behind, stripped, with the stumps still on it ----
  {
    const h = new THREE.Mesh(hill(560, 150, 77, { rough: 0.34, rings: 16, sectors: 24 }), bare);
    h.position.set(TX - 320, -14, TZ - 700);
    group.add(h);
    const groundAt = (x, z) => {
      const d = Math.hypot(x - (TX - 320), z - (TZ - 700)) / 560;
      return d >= 1 ? 0 : -14 + 150 * Math.sqrt(Math.max(0, 1 - d * d));
    };
    // stumps: the cost of the furnace, written on the hill in short vertical
    // marks. Nothing says "this place eats forest" faster than a field of them.
    const stumps = [];
    for (let i = 0; i < 2200; i++) {
      const a = rnd() * Math.PI * 2, dd = Math.pow(rnd(), 0.5) * 540;
      const x = TX - 320 + Math.cos(a) * dd, z = TZ - 700 + Math.sin(a) * dd;
      const y = groundAt(x, z);
      if (y < 2 || Math.abs(x) < 80) continue;
      const s = 1.4 + rnd() * 2.6;
      stumps.push({ pos: [x, y - 2, z], rot: [(rnd() - 0.5) * 0.2, rnd() * 6.28, (rnd() - 0.5) * 0.2], scale: [s * 0.5, s * (1 + rnd()), s * 0.5] });
    }
    const sm = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1.3, 1, 5), timberD, stumps.length);
    fillInstances(sm, stumps); sm.frustumCulled = false; group.add(sm);

    // and the forest that is left, holding the ridge line above the cut
    const clump = (() => {
      const parts = [];
      for (let i = 0; i < 3; i++) {
        const g = new THREE.IcosahedronGeometry(1, 0);
        const p = g.attributes.position;
        for (let v = 0; v < p.count; v++) {
          const n = 0.7 + ((v * 7 + i * 19) % 13) / 24;
          p.setXYZ(v, p.getX(v) * n, p.getY(v) * n * 1.15, p.getZ(v) * n);
        }
        g.computeVertexNormals();
        const s = 0.5 + (i % 3) * 0.14;
        g.scale(s, s, s);
        g.translate((i - 1) * 0.4, 0.5 + (i % 2) * 0.3, ((i * 5) % 3 - 1) * 0.34);
        parts.push(g);
      }
      return mergePN(parts);
    })();
    const trees = [];
    for (let i = 0; i < 1800; i++) {
      const a = rnd() * Math.PI * 2, dd = 510 + rnd() * 540;
      const x = TX - 320 + Math.cos(a) * dd, z = TZ - 700 + Math.sin(a) * dd;
      // A ring drawn round a centre that sits off the line crosses the line on
      // its near side. Nine hundred metres of forest, and the two trees that
      // matter are the ones standing in the track.
      if (Math.abs(x) < 80) continue;
      const s = 7 + rnd() * 12;
      trees.push({ pos: [x, groundAt(x, z) - 1, z], rot: [0, rnd() * 6.28, 0], scale: [s, s * (1.1 + rnd() * 0.8), s] });
    }
    const tm = new THREE.InstancedMesh(clump, scrub, trees.length);
    fillInstances(tm, trees); tm.frustumCulled = false; group.add(tm);
  }

  // =========================================================================
  // The palisade: a wall of whole trunks, which is the shape of the place
  // =========================================================================
  {
    const posts = [];
    const RX = 210, RZ = 250;
    for (let i = 0; i < 260; i++) {
      const t = i / 260 * Math.PI * 2;
      // a rounded rectangle: works on the water side, wall on the land side
      const x = TX + Math.cos(t) * RX * (1 + Math.sin(t * 3) * 0.05);
      const z = TZ + Math.sin(t) * RZ * (1 + Math.cos(t * 2) * 0.05);
      const h = 11 + rnd() * 5;
      posts.push({ pos: [x, h / 2, z], rot: [(rnd() - 0.5) * 0.04, rnd() * 6.28, (rnd() - 0.5) * 0.04], scale: [1.5, h, 1.5] });
    }
    const pm = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1.15, 1, 6), timber, posts.length);
    fillInstances(pm, posts); pm.frustumCulled = false; group.add(pm);

    // the gate, facing the line, with a watch platform over it
    const g = new THREE.Group();
    g.position.set(TX + 190, 0, TZ + 90);
    g.rotation.y = -0.5;
    for (const s of [-1, 1]) {
      const tower = new THREE.Mesh(box(7, 22, 7), timberD);
      tower.position.set(s * 9, 11, 0); g.add(tower);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(6.4, 5, 4), thatch);
      cap.rotation.y = Math.PI / 4; cap.position.set(s * 9, 24.5, 0); g.add(cap);
    }
    const lintel = new THREE.Mesh(box(24, 2.4, 3.4), plank);
    lintel.position.y = 19; g.add(lintel);
    const deck = new THREE.Mesh(box(24, 0.8, 6), plank);
    deck.position.y = 21; g.add(deck);
    group.add(g);
  }

  // =========================================================================
  // The works itself: sheds, the furnace house, and the one thing that is lit
  // =========================================================================
  const flames = [];
  {
    const items = [], roofs = [];
    for (let i = 0; i < 70; i++) {
      const a = rnd() * Math.PI * 2, d = Math.pow(rnd(), 0.6) * 175;
      const x = TX + Math.cos(a) * d * 1.0, z = TZ + Math.sin(a) * d * 1.15;
      const w = 9 + rnd() * 12, h = 6 + rnd() * 7, dp = 9 + rnd() * 13;
      const ry = rnd() * 6.28;
      items.push({ pos: [x, h / 2, z], rot: [0, ry, 0], scale: [w, h, dp] });
      roofs.push({ pos: [x, h + 1.9, z], rot: [0, ry + Math.PI / 4, 0], scale: [(w + dp) * 0.42, 4.4, (w + dp) * 0.42] });
    }
    const bm = new THREE.InstancedMesh(box(1, 1, 1), plank, items.length);
    fillInstances(bm, items); bm.frustumCulled = false; group.add(bm);
    const rm = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 4, 1), thatch, roofs.length);
    fillInstances(rm, roofs); rm.frustumCulled = false; group.add(rm);

    // the furnace house — bigger than everything, and open at the front
    const fh = new THREE.Group();
    fh.position.set(TX + 40, 0, TZ - 40);
    fh.rotation.y = 0.35;
    const body = new THREE.Mesh(box(46, 26, 34), timberD);
    body.position.y = 13; fh.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(34, 15, 4, 1), thatch);
    roof.rotation.y = Math.PI / 4; roof.position.y = 32; fh.add(roof);
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 5.0, 26, 8), stoneM);
    stack.position.set(-12, 34, 0); fh.add(stack);

    // the mouth: the only warm thing for two kilometres in either direction
    const mouth = new THREE.Mesh(box(15, 9, 1.2), fireM);
    mouth.position.set(6, 6, 17.4); fh.add(mouth);
    const inner = new THREE.Mesh(box(11, 6, 1.2), fireM);
    inner.position.set(6, 5, 18.0); fh.add(inner);
    group.add(fh);
    flames.push(mouth, inner);

    // lamps along the walkways, small and few
    for (let i = 0; i < 20; i++) {
      const a = rnd() * 6.28, d = 60 + rnd() * 130;
      const l = new THREE.Mesh(box(0.9, 1.3, 0.9), lampM);
      l.position.set(TX + Math.cos(a) * d, 4 + rnd() * 8, TZ + Math.sin(a) * d * 1.15);
      group.add(l);
    }
  }

  // ---- embers going up from the stack, and the smoke they are inside ----
  const embers = [];
  for (let i = 0; i < 150; i++) {
    embers.push({ ph: rnd(), o: (rnd() - 0.5) * 9, s: 0.30 + rnd() * 0.7, sp: 0.10 + rnd() * 0.16 });
  }
  const emberMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 5, 4), emberM, embers.length);
  emberMesh.frustumCulled = false; emberMesh.renderOrder = 20; group.add(emberMesh);

  const smokeM = makePaintMaterial(shared, {
    color: '#6e6a66', shadowTint: '#2c2b30', rim: 0.4, bands: 2, grain: 0.24, grainScale: 0.3,
    transparent: true, opacity: 0.42, depthWrite: false,
  });
  const puffs = [];
  for (let i = 0; i < 40; i++) puffs.push({ ph: i / 40, s: 5 + rnd() * 9, o: (rnd() - 0.5) * 12 });
  const puffMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), smokeM, puffs.length);
  puffMesh.frustumCulled = false; puffMesh.renderOrder = 10; group.add(puffMesh);

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(),
        sv = new THREE.Vector3(), pv = new THREE.Vector3();
  const SX = TX + 40 - 12 * Math.cos(0.35), SZ = TZ - 40 + 12 * Math.sin(0.35);

  function update(t) {
    embers.forEach((c, i) => {
      const a = (t * c.sp + c.ph) % 1;
      pv.set(SX + c.o * a * 3 + Math.sin(t * 1.3 + c.ph * 9) * 4 * a,
             46 + a * 90,
             SZ + Math.cos(t * 0.9 + c.ph * 7) * 5 * a);
      const s = c.s * (1 - a * 0.75);
      sv.set(s, s, s);
      m4.compose(pv, q, sv);
      emberMesh.setMatrixAt(i, m4);
    });
    emberMesh.instanceMatrix.needsUpdate = true;

    puffs.forEach((p, i) => {
      const a = (t * 0.055 + p.ph) % 1;
      const s = p.s * (0.5 + a * 3.2);
      pv.set(SX + p.o - a * 130, 52 + a * 130, SZ + Math.sin(a * 4 + p.ph * 8) * 22);
      e.set(a * 1.6, p.ph * 6, a);
      q.setFromEuler(e);
      sv.set(s, s * 0.75, s);
      m4.compose(pv, q, sv);
      puffMesh.setMatrixAt(i, m4);
      q.identity();
    });
    puffMesh.instanceMatrix.needsUpdate = true;
    void flames;
  }
  update(0);

  return { group, update };
}
