import * as THREE from 'three';
import { box, mulberry, fillInstances, mergePN } from '../world/geo.js';
import { makePaintMaterial, makeGlowMaterial } from '../world/paintMaterial.js';

// ---------------------------------------------------------------------------
// Slag Ravine — Castle in the Sky, 1986.
//
// Where the film starts, and the opposite of where it ends: a mining town
// wedged into a gorge, everything built on top of everything else, a viaduct
// carrying the ore line straight over the roofs, and the pit head still
// working somewhere below in the dark.
//
// The composition is a SLOT. Two walls of rock close in on both sides of the
// line, tall enough that the sky is a strip, and the town is jammed into what
// is left. Which means the region is built the other way round from every
// other one on the line: instead of scattering things across open ground, this
// one takes the ground away.
// ---------------------------------------------------------------------------

export function buildSlagRavine(shared) {
  const group = new THREE.Group();
  const rnd = mulberry(1986 * 5);

  const rockA = makePaintMaterial(shared, { color: '#6d6558', shadowTint: '#16151a', rim: 0.7, bands: 3, grain: 0.32, grainScale: 0.9 });
  const rockB = makePaintMaterial(shared, { color: '#565042', shadowTint: '#101016', rim: 0.6, bands: 3, grain: 0.34, grainScale: 0.7 });
  const spoil = makePaintMaterial(shared, { color: '#494336', shadowTint: '#0e0d10', rim: 0.5, bands: 3, grain: 0.36, grainScale: 0.5 });
  const brickM = makePaintMaterial(shared, { color: '#7d5a46', shadowTint: '#2a1d1e', rim: 0.8, bands: 3, grain: 0.24, grainScale: 1.1 });
  const brickB = makePaintMaterial(shared, { color: '#66534a', shadowTint: '#221b1e', rim: 0.8, bands: 3, grain: 0.24, grainScale: 1.0 });
  const iron = makePaintMaterial(shared, { color: '#5b4b42', shadowTint: '#1a1418', rim: 1.2, bands: 3, grain: 0.26, grainScale: 1.6 });
  const roofM = makePaintMaterial(shared, { color: '#585c5e', shadowTint: '#1c1f26', rim: 1.0, bands: 3, grain: 0.16, side: THREE.DoubleSide });
  const masonry = makePaintMaterial(shared, { color: '#8e8574', shadowTint: '#3a352e', rim: 0.7, bands: 3, grain: 0.26, grainScale: 1.3 });
  const timber = makePaintMaterial(shared, { color: '#63503a', shadowTint: '#1f1918', rim: 0.9, bands: 3, grain: 0.28, grainScale: 1.4 });
  const winM = makeGlowMaterial(shared, '#ffc472', 1.60, { flicker: 0.10 });
  const pitM = makeGlowMaterial(shared, '#ff8a3a', 1.5, { flicker: 0.35 });

  // =========================================================================
  // The walls of the gorge. Slabs leaning in, stacked in courses, so the sky
  // closes to a strip and the whole region has a lid on it.
  // =========================================================================
  {
    const slab = (() => {
      const g = new THREE.BoxGeometry(1, 1, 1, 1, 3, 2);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const y = p.getY(i);
        const n = Math.sin(y * 17 + p.getZ(i) * 9) * 0.09 + Math.sin(y * 41) * 0.04;
        p.setX(i, p.getX(i) * (1 + n) * (1 - (y + 0.5) * 0.16));
        p.setZ(i, p.getZ(i) * (1 + n * 0.7));
      }
      g.computeVertexNormals();
      return g;
    })();
    const a = [], b = [];
    for (const side of [-1, 1]) {
      for (let i = 0; i < 300; i++) {
        const z = -60 - rnd() * 3000;
        const tier = (rnd() * 3) | 0;
        // The walls stand OUTSIDE the town. Overlap the two and the rock
        // simply buries the only lit thing in the region.
        // and they cannot fill the frame either. A gorge whose walls close over
        // the top of the window is not a gorge, it is a lid — the strip of sky
        // has to survive or nothing below it has anything to stand against.
        const x = side * (310 + tier * 86 + rnd() * 56);
        const h = 74 + tier * 56 + rnd() * 78;
        const w = 26 + rnd() * 44;
        (tier ? b : a).push({
          pos: [x, h / 2 - 14, z],
          rot: [0, rnd() * 0.5 - 0.25, side * (0.05 + rnd() * 0.07)],
          scale: [w, h, 30 + rnd() * 50],
        });
      }
    }
    const am = new THREE.InstancedMesh(slab, rockA, a.length);
    fillInstances(am, a); am.frustumCulled = false; group.add(am);
    const bm = new THREE.InstancedMesh(slab, rockB, b.length);
    fillInstances(bm, b); bm.frustumCulled = false; group.add(bm);

    // the floor of the gorge, and the spoil heaps banked against the walls
    for (const side of [-1, 1]) {
      for (let i = 0; i < 22; i++) {
        const f = new THREE.Mesh(box(1, 1, 1), i % 3 ? spoil : rockB);
        const w = 44 + rnd() * 40;
        f.position.set(side * (14 + w / 2), 0.3 + rnd() * 0.4, -120 - i * 132);
        f.scale.set(w, 2.4, 132 + rnd() * 30);
        group.add(f);
      }
    }
    const heaps = [];
    for (let i = 0; i < 70; i++) {
      const side = rnd() > 0.5 ? 1 : -1;
      // banked against the WALLS. A forty-metre cone of waste sixty metres off
      // the window is not a spoil heap, it is a curtain.
      const s = 7 + rnd() * 20;
      heaps.push({
        pos: [side * (232 + rnd() * 70), 1.4 + s * 0.16, -100 - rnd() * 2900],
        rot: [0, rnd() * 6.28, 0], scale: [s, s * (0.42 + rnd() * 0.3), s],
      });
    }
    const hm = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 7, 1), spoil, heaps.length);
    fillInstances(hm, heaps); hm.frustumCulled = false; group.add(hm);
  }

  // =========================================================================
  // The town, stacked up both walls because there is nowhere else to put it
  // =========================================================================
  {
    // TERRACES, not a scatter. Buildings sprinkled up an invisible slope with
    // stilts under each one read as a thicket of posts; what makes a stacked
    // town legible is the retaining wall it stands on — four hard horizontal
    // lines, each with a row of roofs along the top of it.
    // and they have to stand BACK. The same arithmetic as the ink mountains:
    // a retaining wall forty metres off the window is not a terrace, it is a
    // fence across the glass, and everything behind it is hidden by it.
    const TIERS = [
      { y: 6, x: 96 }, { y: 21, x: 138 }, { y: 38, x: 180 }, { y: 57, x: 222 },
    ];
    const wallsA = [], wallsB = [], roofs = [], props = [], wins = [], faces = [];

    TIERS.forEach((tier, ti) => {
      for (const side of [-1, 1]) {
        // the retaining wall, in long sections so it can wander a little
        for (let i = 0; i < 22; i++) {
          const z = -110 - i * 132;
          faces.push({
            pos: [side * (tier.x + 3), tier.y / 2, z],
            rot: [0, 0, 0], scale: [11, tier.y + 3, 132],
          });
        }
        // the houses along it, shoulder to shoulder, all facing the line
        const n = 70 - ti * 8;
        for (let i = 0; i < n; i++) {
          const z = -120 - (i / n) * 2760 - rnd() * 24;
          const w = 11 + rnd() * 9, h = 9 + rnd() * 10, dp = 12 + rnd() * 12;
          const x = side * (tier.x - 4 - rnd() * 12);
          const ry = (rnd() - 0.5) * 0.22;
          (rnd() > 0.45 ? wallsA : wallsB).push({ pos: [x, tier.y + h / 2, z], rot: [0, ry, 0], scale: [w, h, dp] });
          roofs.push({
            pos: [x, tier.y + h + 1.6, z], rot: [0, ry + Math.PI / 4, 0],
            scale: [(w + dp) * 0.40, 3.6 + rnd() * 2.2, (w + dp) * 0.40],
          });
          // a few of them hang out over the drop on props, which is the look
          if (rnd() > 0.55 && tier.y > 8) {
            const px = side * (tier.x - 12 - rnd() * 6);
            props.push({ pos: [px, tier.y / 2, z - dp * 0.3], rot: [0, 0, side * 0.05], scale: [0.9, tier.y, 0.9] });
            props.push({ pos: [px, tier.y / 2, z + dp * 0.3], rot: [0, 0, side * 0.05], scale: [0.9, tier.y, 0.9] });
          }
          // lit, facing the line — a wall of small warm rectangles at night
          if (rnd() > 0.18) {
            wins.push({
              pos: [x - side * (w / 2 + 0.06), tier.y + h * 0.55, z], rot: [0, Math.PI / 2, 0],
              scale: [2.0 + rnd() * 1.6, 2.1 + rnd() * 1.4, 1],
            });
          }
          if (rnd() > 0.6) {
            wins.push({
              pos: [x, tier.y + h * 0.5, z + dp / 2 + 0.06], rot: [0, 0, 0],
              scale: [1.8 + rnd() * 1.2, 1.9 + rnd() * 1.2, 1],
            });
          }
        }
      }
    });
    const unit = box(1, 1, 1);
    const put = (items, geo, mat, ro) => {
      if (!items.length) return;
      const m = new THREE.InstancedMesh(geo, mat, items.length);
      fillInstances(m, items); m.frustumCulled = false; if (ro) m.renderOrder = ro; group.add(m);
    };
    put(faces, unit, masonry);
    put(wallsA, unit, brickM); put(wallsB, unit, brickB);
    put(roofs, new THREE.ConeGeometry(1, 1, 4, 1), roofM);
    put(props, unit, timber);
    put(wins, new THREE.PlaneGeometry(1, 1), winM, 6);
  }

  // =========================================================================
  // The viaduct: the ore line, carried straight over the town on iron legs
  // =========================================================================
  const carts = [];
  {
    const VY = 92, VX = -268;
    const deck = new THREE.Mesh(box(9, 2.2, 3000), iron);
    deck.position.set(VX, VY, -1500);
    group.add(deck);
    const rail = [];
    for (const s of [-1, 1]) rail.push({ pos: [VX + s * 3, VY + 1.6, -1500], scale: [0.5, 1.0, 3000] });
    const rm = new THREE.InstancedMesh(box(1, 1, 1), iron, rail.length);
    fillInstances(rm, rail); rm.frustumCulled = false; group.add(rm);

    // trestles: an X-braced tower every forty metres, which is what makes a
    // viaduct read as engineering rather than a shelf
    const legs = [], braces = [];
    for (let i = 0; i < 43; i++) {
      const z = -40 - i * 70;
      for (const s of [-1, 1]) {
        legs.push({ pos: [VX + s * 4.2, VY / 2, z], rot: [0, 0, s * 0.035], scale: [1.1, VY, 1.1] });
      }
      for (let k = 0; k < 3; k++) {
        const yy = 16 + k * 22;
        braces.push({ pos: [VX, yy, z], rot: [0, 0, 0.72], scale: [0.55, 13, 0.55] });
        braces.push({ pos: [VX, yy, z], rot: [0, 0, -0.72], scale: [0.55, 13, 0.55] });
        braces.push({ pos: [VX, yy + 13, z], rot: [0, 0, 1.5708], scale: [0.5, 9, 0.5] });
      }
    }
    const lm = new THREE.InstancedMesh(box(1, 1, 1), iron, legs.length);
    fillInstances(lm, legs); lm.frustumCulled = false; group.add(lm);
    const bm = new THREE.InstancedMesh(box(1, 1, 1), iron, braces.length);
    fillInstances(bm, braces); bm.frustumCulled = false; group.add(bm);

    // ore trucks on it, going somewhere all night
    const truck = (() => {
      const parts = [];
      const b = new THREE.BoxGeometry(4.4, 3.0, 5.4);
      b.translate(0, 2.4, 0);
      parts.push(b);
      const u = new THREE.BoxGeometry(2.0, 1.2, 6.0);
      u.translate(0, 0.6, 0);
      parts.push(u);
      return mergePN(parts);
    })();
    const tm = new THREE.InstancedMesh(truck, iron, 9);
    tm.frustumCulled = false; group.add(tm);
    carts.push({ mesh: tm, n: 9, VX, VY });
  }

  // ---- the pit head, lit from below, the one warm thing down in the dark ----
  {
    const g = new THREE.Group();
    g.position.set(-86, 0, -980);
    g.rotation.y = 0.4;
    const house = new THREE.Mesh(box(22, 20, 18), brickB);
    house.position.y = 10; g.add(house);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(16, 7, 4, 1), roofM);
    roof.rotation.y = Math.PI / 4; roof.position.y = 23; g.add(roof);
    // the winding gear: two legs and a wheel, and everybody knows what it is
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(box(1.4, 34, 1.4), iron);
      leg.position.set(s * 5, 17, -9); leg.rotation.z = -s * 0.14; g.add(leg);
    }
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(6, 0.7, 6, 16), iron);
    wheel.position.set(0, 34, -9); g.add(wheel);
    const mouth = new THREE.Mesh(box(9, 6, 1.0), pitM);
    mouth.position.set(0, 3.4, 9.2); g.add(mouth);
    group.add(g);
  }

  // ---- smoke, low, sitting in the gorge because it has nowhere to go ----
  const smokeM = makePaintMaterial(shared, {
    color: '#7a7570', shadowTint: '#2c2b30', rim: 0.4, bands: 2, grain: 0.24, grainScale: 0.3,
    transparent: true, opacity: 0.30, depthWrite: false,
  });
  const puffs = [];
  for (let i = 0; i < 60; i++) {
    puffs.push({ ph: rnd(), x: (rnd() - 0.5) * 150, z: -80 - rnd() * 2900, s: 14 + rnd() * 30, sp: 0.02 + rnd() * 0.03 });
  }
  const puffMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), smokeM, puffs.length);
  puffMesh.frustumCulled = false; puffMesh.renderOrder = 10; group.add(puffMesh);

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(),
        sv = new THREE.Vector3(), pv = new THREE.Vector3();

  function update(t) {
    carts.forEach(({ mesh, n, VX, VY }) => {
      for (let i = 0; i < n; i++) {
        const z = -((t * 22 + i * 330) % 3000);
        pv.set(VX, VY + 2.0, z);
        sv.set(1, 1, 1);
        m4.compose(pv, q, sv);
        mesh.setMatrixAt(i, m4);
      }
      mesh.instanceMatrix.needsUpdate = true;
    });
    puffs.forEach((p, i) => {
      const a = (t * p.sp + p.ph) % 1;
      const s = p.s * (0.7 + a * 1.3);
      pv.set(p.x + a * 40, 6 + a * 34, p.z + Math.sin(a * 3 + p.ph * 8) * 30);
      e.set(a, p.ph * 6, a * 0.5);
      q.setFromEuler(e);
      sv.set(s, s * 0.5, s);
      m4.compose(pv, q, sv);
      puffMesh.setMatrixAt(i, m4);
      q.identity();
    });
    puffMesh.instanceMatrix.needsUpdate = true;
  }
  update(0);

  return { group, update };
}
