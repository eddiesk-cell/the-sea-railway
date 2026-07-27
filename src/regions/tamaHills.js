import * as THREE from 'three';
import { box, hill, mulberry, fillInstances, mergePN } from '../world/geo.js';
import { makePaintMaterial, makeGlowMaterial } from '../world/paintMaterial.js';

// ---------------------------------------------------------------------------
// Tama Hills — Pom Poko, 1994.
//
// Old woodland, and then a straight line where it stops.
//
// This is the only region on the line built as a BEFORE and an AFTER rather
// than a place. The first half is hill forest with nothing in it. Then the
// cut: raw ochre benches, a retaining wall, a dozer standing in the spoil, and
// beyond it the towers going up. The train crosses the boundary at the
// station, so the region is experienced as a loss rather than described as one.
// ---------------------------------------------------------------------------

export function buildTamaHills(shared) {
  const group = new THREE.Group();
  const rnd = mulberry(1994);

  const turf = makePaintMaterial(shared, { color: '#5a7238', shadowTint: '#202a18', rim: 0.55, bands: 3, grain: 0.22, grainScale: 0.55, sway: 0.02, translucency: 0.7 });
  const canopy = makePaintMaterial(shared, {
    color: '#3f5c2c', shadowTint: '#141d10', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.35,
    sway: 0.03, translucency: 0.6,
  });
  const canopy2 = makePaintMaterial(shared, {
    color: '#546a34', shadowTint: '#1b2412', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.35,
    sway: 0.035, translucency: 0.65,
  });
  const trunkM = makePaintMaterial(shared, { color: '#4a3b2c', shadowTint: '#181310', rim: 0.7, bands: 3, grain: 0.26, grainScale: 1.6 });
  const cut = makePaintMaterial(shared, { color: '#9c7c50', shadowTint: '#3c2f22', rim: 0.65, bands: 3, grain: 0.30, grainScale: 1.1 });
  const cutPale = makePaintMaterial(shared, { color: '#b39264', shadowTint: '#463726', rim: 0.65, bands: 3, grain: 0.30, grainScale: 0.9 });
  const concrete = makePaintMaterial(shared, { color: '#9b9a94', shadowTint: '#3a3a3a', rim: 0.6, bands: 3, grain: 0.26, grainScale: 1.8 });
  const slab = makePaintMaterial(shared, { color: '#a8a49a', shadowTint: '#3d3c3c', rim: 0.7, bands: 3, grain: 0.20 });
  const yellowM = makePaintMaterial(shared, { color: '#c8a02a', shadowTint: '#4c3c12', rim: 1.2, bands: 3, grain: 0.12 });
  const steelM = makePaintMaterial(shared, { color: '#5e6268', shadowTint: '#1e2126', rim: 1.4, bands: 3, grain: 0.10 });
  const winGlow = makeGlowMaterial(shared, '#ffeec4', 0.20);

  const unit = box(1, 1, 1);
  const put = (items, geo, mat, ro) => {
    if (!items.length) return null;
    const m = new THREE.InstancedMesh(geo, mat, items.length);
    fillInstances(m, items); m.frustumCulled = false;
    if (ro) m.renderOrder = ro;
    group.add(m); return m;
  };

  // where the woodland ends and the site begins: half way down the region
  const EDGE = -1330;

  // =========================================================================
  // Ground: green up to the edge, then bare cut earth
  // =========================================================================
  {
    for (let i = 0; i < 24; i++) {
      const z = -110 - i * 120;
      const green = z > EDGE;
      const b = new THREE.Mesh(unit, green ? turf : cut);
      const w = 260 + rnd() * 300;
      b.position.set(-13 - w / 2, 0.5, z);
      b.scale.set(w, 1.8, 120 + rnd() * 30);
      group.add(b);
      const b2 = new THREE.Mesh(unit, green ? turf : cut);
      b2.position.set(13 + w / 2, 0.5, z);
      b2.scale.set(w, 1.8, 120 + rnd() * 30);
      group.add(b2);
    }
    // the hills, which run the whole length — the site is cut INTO them
    [[-520, -560, 320, 118], [-620, -1500, 360, 136], [-460, -2340, 280, 96]]
      .forEach(([x, z, r, h], i) => {
        const m = new THREE.Mesh(hill(r, h, 77 + i, { rough: 0.3, rings: 14, sectors: 22 }), z > EDGE ? turf : cut);
        m.position.set(x, -8, z); group.add(m);
      });
  }

  // =========================================================================
  // The wood — dense, and it stops dead
  // =========================================================================
  {
    const clump = (() => {
      const parts = [];
      for (let i = 0; i < 4; i++) {
        const g = new THREE.IcosahedronGeometry(1, 0);
        const q = g.attributes.position;
        for (let v = 0; v < q.count; v++) {
          const n = 0.72 + ((v * 11 + i * 17) % 13) / 26;
          q.setXYZ(v, q.getX(v) * n, q.getY(v) * n * 0.92, q.getZ(v) * n);
        }
        g.computeVertexNormals();
        const sc = 0.46 + (i % 3) * 0.15;
        g.scale(sc, sc, sc);
        g.translate((i % 3 - 1) * 0.42, 0.46 + (i % 2) * 0.3, ((i * 5) % 3 - 1) * 0.38);
        parts.push(g.toNonIndexed());
      }
      return mergePN(parts);
    })();
    const a = [], b = [], trunks = [];
    for (let i = 0; i < 5200; i++) {
      const z = EDGE + 40 + rnd() * 1200;      // only in the green half
      const side = rnd() > 0.62 ? 1 : -1;
      const x = side * (26 + Math.pow(rnd(), 0.7) * 620);
      const s = 4 + rnd() * 10;
      const it = { pos: [x, 1.2, z], rot: [0, rnd() * 6.28, 0], scale: [s, s * (1.1 + rnd() * 0.7), s] };
      (rnd() > 0.5 ? a : b).push(it);
      trunks.push({ pos: [x, 1.2, z], scale: [s * 0.10, s * 0.95, s * 0.10] });
    }
    put(a, clump, canopy); put(b, clump, canopy2);
    put(trunks, new THREE.CylinderGeometry(1, 1.35, 1, 5), trunkM);
  }

  // =========================================================================
  // The cut: benches, a wall, spoil, and the machines that made it
  // =========================================================================
  {
    // benches stepping up, standing well back for the same reason terraces do
    const BENCH = [[-70, 4], [-140, 11], [-215, 19], [-300, 28]];
    BENCH.forEach(([x, y]) => {
      const deck = new THREE.Mesh(unit, cutPale);
      deck.position.set(x - 40, y / 2, EDGE - 700);
      deck.scale.set(80, y, 1400);
      group.add(deck);
      const face = new THREE.Mesh(unit, cut);
      face.position.set(x + 1.2, y / 2, EDGE - 700);
      face.scale.set(3, y, 1400);
      group.add(face);
    });

    // the retaining wall along the near edge: concrete, panelled, and new
    const panels = [];
    for (let i = 0; i < 60; i++) {
      panels.push({ pos: [-54, 2.4, EDGE - 30 - i * 24], scale: [1.6, 4.8, 22] });
    }
    put(panels, unit, concrete);

    // spoil heaps, and survey stakes in rows
    const heaps = [], stakes = [];
    for (let i = 0; i < 90; i++) {
      const s = 6 + rnd() * 22;
      heaps.push({
        pos: [-56 - rnd() * 240, 0.4, EDGE - 60 - rnd() * 1300],
        rot: [0, rnd() * 6.28, 0], scale: [s, s * (0.4 + rnd() * 0.4), s],
      });
    }
    put(heaps, hill(1, 1, 13, { rough: 0.4, rings: 7, sectors: 11 }), cutPale);
    for (let i = 0; i < 160; i++) {
      stakes.push({ pos: [-24 - (i % 8) * 18, 2.6, EDGE - 50 - Math.floor(i / 8) * 62], scale: [0.12, 2.4, 0.12] });
    }
    put(stakes, unit, yellowM);

    // one dozer, stopped, which is worth more than ten of them working
    const d = new THREE.Group();
    d.position.set(-96, 1.4, EDGE - 420);
    d.rotation.y = 0.9;
    const bodyD = new THREE.Mesh(box(4.2, 3.0, 7.0), yellowM);
    bodyD.position.y = 2.6; d.add(bodyD);
    const cab = new THREE.Mesh(box(3.0, 2.4, 3.0), yellowM);
    cab.position.set(0, 5.2, -1.2); d.add(cab);
    const blade = new THREE.Mesh(box(6.4, 2.6, 0.5), steelM);
    blade.position.set(0, 2.0, 4.4); blade.rotation.x = 0.16; d.add(blade);
    for (const sx of [-1, 1]) {
      const track = new THREE.Mesh(box(1.3, 2.0, 7.6), steelM);
      track.position.set(sx * 2.4, 1.2, 0); d.add(track);
    }
    group.add(d);

    // and the towers going up beyond it, with cranes over them
    for (let i = 0; i < 9; i++) {
      const x = -360 - rnd() * 320;
      const z = EDGE - 120 - i * 150 - rnd() * 60;
      const h = 40 + rnd() * 46;
      const t = new THREE.Mesh(box(26 + rnd() * 14, h, 20 + rnd() * 12), slab);
      t.position.set(x, h / 2 + 1, z); group.add(t);
      // the floors, which is what says "unfinished concrete frame"
      for (let f = 1; f * 3.2 < h; f++) {
        const fl = new THREE.Mesh(box(28, 0.5, 22), concrete);
        fl.position.set(x, f * 3.2, z); group.add(fl);
      }
      if (rnd() > 0.45) {
        const mast = new THREE.Mesh(box(2, h + 34, 2), steelM);
        mast.position.set(x + 20, (h + 34) / 2, z + 14); group.add(mast);
        const jib = new THREE.Mesh(box(66, 1.6, 1.6), steelM);
        jib.position.set(x - 10, h + 32, z + 14); group.add(jib);
      }
      const lit = [];
      for (let k = 0; k < 8; k++) {
        lit.push({ pos: [x + 13.05, 6 + rnd() * (h - 10), z + (rnd() - 0.5) * 16], rot: [0, Math.PI / 2, 0], scale: [2.6, 1.6, 1] });
      }
      put(lit, new THREE.PlaneGeometry(1, 1), winGlow, 6);
    }
  }

  function update() { /* the machines have stopped for the day */ }

  return { group, update };
}
