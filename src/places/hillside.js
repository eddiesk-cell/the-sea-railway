import * as THREE from 'three';
import { shelf, grove, scatter, put, box, hill, mulberry } from './kit.js';

// ---------------------------------------------------------------------------
// Grave of the Fireflies.
//
// Two places, and no more. Restraint is the only decent thing to do here: a
// hollow by the water with a blanket and a tin in it, and a street at the
// bottom of the hill with nothing standing. Neither is explained, neither is
// lit, and nothing in either of them moves.
// ---------------------------------------------------------------------------

export default {
  region: 'hillside',
  pal: {
    turf: { color: '#2a3228', shadowTint: '#0c110c', rim: 0.4, bands: 3, grain: 0.22, grainScale: 0.55 },
    rock: { color: '#44443e', shadowTint: '#141412', rim: 0.7, bands: 3, grain: 0.26, grainScale: 1.2, wrap: 0.6 },
    leaf: { color: '#243020', shadowTint: '#0a0e08', rim: 0.4, bands: 3, grain: 0.22, grainScale: 0.35, sway: 0.03, translucency: 0.4 },
    ash: { color: '#3a352e', shadowTint: '#121010', rim: 0.6, bands: 3, grain: 0.3, grainScale: 0.9 },
    iron: { color: '#332f2c', shadowTint: '#0e0d0c', rim: 1.1, bands: 3, grain: 0.16 },
    cloth: { color: '#4a4238', shadowTint: '#171412', rim: 0.7, bands: 2, grain: 0.14, side: THREE.DoubleSide },
    tin: { color: '#8e7a4e', shadowTint: '#2e2716', rim: 1.8, bands: 2, grain: 0.08 },
  },

  places: [
    {
      id: 'the-shelter',
      name: 'The hollow by the water',
      at: [420, -1180], r: 70, ground: 1.4,
      trail: { from: [70, -1270], style: 'stones' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(1988);
        const C = [420, -1180];
        g.add(shelf(M, { r: 110, h: 1.4, mat: M.turf, seed: 5, rough: 0.3 }).translateX(C[0]).translateZ(C[1]));

        // A bank with a cut in it. Not a building — a hollow somebody made do
        // with, which is a different and worse thing.
        const bank = new THREE.Mesh(hill(46, 9, 4, { rough: 0.36, rings: 8, sectors: 16 }), M.turf);
        bank.position.set(C[0] + 14, 1.0, C[1] - 8); g.add(bank);
        const mouth = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.6), M.ash);
        mouth.position.set(C[0] - 4, 2.6, C[1] + 2); mouth.rotation.y = -0.5;
        mouth.renderOrder = 6; g.add(mouth);
        const lintel = new THREE.Mesh(box(5.0, 0.5, 1.4), M.rock);
        lintel.position.set(C[0] - 4, 4.1, C[1] + 2); lintel.rotation.y = -0.5; g.add(lintel);

        // the blanket, the tin, and one enamel bowl. That is the inventory.
        const bl = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.0), M.cloth);
        bl.rotation.set(-Math.PI / 2, 0, 0.4);
        bl.position.set(C[0] - 2.2, 1.46, C[1] + 4.2); g.add(bl);
        const tin = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.30, 12), M.tin);
        tin.position.set(C[0] - 1.0, 1.6, C[1] + 5.2); tin.rotation.z = 0.1; g.add(tin);
        const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.2, 9, 5, 0, 6.28, 0, 1.4), M.tin);
        bowl.position.set(C[0] - 3.0, 1.5, C[1] + 5.6); g.add(bowl);

        // the pond it looks at
        const wa = new THREE.Mesh(new THREE.CircleGeometry(38, 24), M.rock);
        wa.rotation.x = -Math.PI / 2; wa.position.set(C[0] - 44, 1.42, C[1] + 22);
        wa.renderOrder = 4; g.add(wa);
        g.add(grove(M, { n: 240, at: C, inner: 70, r: 260, kind: 'broad', mat: M.leaf, h: 13, spread: 7, seed: 9 }));
        g.add(scatter(M, { n: 900, at: C, r: 90, y: 1.45, mat: M.leaf, s: 1.0, seed: 12 }));
        void rnd;
        return g;
      },
    },

    {
      id: 'the-burnt-street',
      name: 'The street at the bottom',
      at: [700, -1880], r: 130, ground: 1.4,
      trail: { from: [110, -1760], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(45);
        const C = [700, -1880];
        g.add(shelf(M, { r: 200, h: 1.4, mat: M.ash, seed: 2, rough: 0.08 }).translateX(C[0]).translateZ(C[1]));

        // Nothing stands. What is left is the plan of it: foundations, a few
        // chimneys, a gate with no wall on either side of it.
        const plots = [], stubs = [];
        for (let i = 0; i < 34; i++) {
          const sx = i % 2 ? 1 : -1;
          const z = -140 + Math.floor(i / 2) * 17;
          const w = 8 + rnd() * 4, d = 9 + rnd() * 4;
          plots.push({ pos: [C[0] + sx * 15, 1.5, C[1] + z], rot: [0, rnd() * 0.1, 0], scale: [w, 0.3, d] });
          if (rnd() > 0.55) {
            stubs.push({
              pos: [C[0] + sx * 15 + (rnd() - 0.5) * 5, 1.4 + (1.2 + rnd() * 2.4) / 2, C[1] + z + (rnd() - 0.5) * 5],
              rot: [(rnd() - 0.5) * 0.1, rnd(), (rnd() - 0.5) * 0.12], scale: [1.0, 1.2 + rnd() * 2.4, 1.0],
            });
          }
        }
        put(g, plots, box(1, 1, 1), M.rock);
        put(g, stubs, box(1, 1, 1), M.ash);

        // the road itself, and the rubble pushed to the sides of it
        const road = new THREE.Mesh(box(9, 0.24, 300), M.rock);
        road.position.set(C[0], 1.52, C[1]); g.add(road);
        const rub = [];
        for (let i = 0; i < 800; i++) {
          const s = 0.3 + rnd() * 0.9;
          rub.push({
            pos: [C[0] + (rnd() - 0.5) * 130, 1.45, C[1] + (rnd() - 0.5) * 320],
            rot: [0, rnd() * 6.28, 0], scale: [s, s * 0.5, s],
          });
        }
        put(g, rub, hill(1, 1, 2, { rough: 0.5, rings: 4, sectors: 7 }), M.ash);

        // one gate, standing, with nothing to shut
        for (const sx of [-1, 1]) {
          const p = new THREE.Mesh(box(0.6, 3.0, 0.6), M.rock);
          p.position.set(C[0] - 16 + sx * 2.2, 2.9, C[1] - 30); g.add(p);
        }
        const bar = new THREE.Mesh(box(5.0, 0.2, 0.2), M.iron);
        bar.position.set(C[0] - 16, 4.3, C[1] - 30); g.add(bar);
        return g;
      },
    },
  ],
};
