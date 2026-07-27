import * as THREE from 'three';
import { shelf, house, boat, fence, grove, scatter, put, box, hill, mulberry } from './kit.js';

// ---------------------------------------------------------------------------
// When Marnie Was There.
//
// The window keeps the house across the inlet at dusk. Off it: the silo inland
// with the weather coming, the landing on the far bank you can only reach the
// long way round, and the blue house in the village where the letters are.
// ---------------------------------------------------------------------------

export default {
  region: 'marsh',
  pal: {
    turf: { color: '#4a5240', shadowTint: '#181c16', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.55 },
    wood: { color: '#5c4c3a', shadowTint: '#1c1710', rim: 0.8, bands: 3, grain: 0.28, grainScale: 1.5 },
    wall: { color: '#b0a894', shadowTint: '#3e3c34', rim: 0.9, bands: 3, grain: 0.18 },
    blue: { color: '#6d8c9e', shadowTint: '#25333e', rim: 1.0, bands: 3, grain: 0.16 },
    roof: { color: '#4a4038', shadowTint: '#181410', rim: 1.1, bands: 3, grain: 0.16, side: THREE.DoubleSide },
    reed: { color: '#8a7a52', shadowTint: '#2e2818', rim: 0.7, bands: 3, grain: 0.3, grainScale: 0.4, sway: 0.08, translucency: 0.9 },
    leaf: { color: '#3e4c32', shadowTint: '#131a10', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.35, sway: 0.04, translucency: 0.6 },
    water: { color: '#4a4a58', shadowTint: '#161820', rim: 2.4, bands: 2, grain: 0.05 },
    iron: { color: '#5a5248', shadowTint: '#1c1a16', rim: 1.3, bands: 3, grain: 0.16 },
  },

  places: [
    {
      id: 'the-silo',
      name: 'The silo',
      at: [560, -1180], r: 95, ground: 1.5,
      trail: { from: [80, -1290], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(2014);
        const C = [560, -1180];
        g.add(shelf(M, { r: 160, h: 1.5, mat: M.turf, seed: 5, rough: 0.16 }).translateX(C[0]).translateZ(C[1]));

        // Tall, round, windowless and out of use. It is the only vertical for
        // a mile and that is exactly why it frightens anybody.
        const body = new THREE.Mesh(new THREE.CylinderGeometry(6.4, 6.8, 26, 16), M.wall);
        body.position.set(C[0], 14.5, C[1]); g.add(body);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(6.5, 16, 8, 0, 6.28, 0, 1.2), M.iron);
        cap.position.set(C[0], 27.5, C[1]); g.add(cap);
        // the ladder up the outside, which is the whole trouble
        const rungs = [];
        for (let i = 0; i < 30; i++) rungs.push({ pos: [C[0] + 6.6, 2.5 + i * 0.82, C[1]], scale: [0.5, 0.09, 0.9] });
        put(g, rungs, box(1, 1, 1), M.iron);
        for (const sz of [-1, 1]) {
          const r = new THREE.Mesh(box(0.12, 26, 0.12), M.iron);
          r.position.set(C[0] + 6.7, 14.5, C[1] + sz * 0.45); g.add(r);
        }
        // the way in at the foot: a black opening, and nothing beyond it
        const door = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 3.0), M.roof);
        door.position.set(C[0] - 6.5, 3.0, C[1]); door.rotation.y = -Math.PI / 2;
        door.renderOrder = 7; g.add(door);

        const sh = house(M, { w: 14, d: 22, h: 5.0, roof: 'gable', roofH: 3.2, wall: M.wood, roofMat: M.roof, trim: M.wood, windows: 2, lit: 0 });
        sh.position.set(C[0] + 26, 1.5, C[1] + 16); sh.rotation.y = 0.3; g.add(sh);
        g.add(fence(M, { len: 120, h: 1.1, mat: M.wood }).translateX(C[0] - 40).translateY(1.5).translateZ(C[1] + 10));
        for (let i = 0; i < 5; i++) {
          const b = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 2.4, 12), M.reed);
          b.rotation.z = Math.PI / 2;
          b.position.set(C[0] + 40 + rnd() * 20, 2.6, C[1] - 26 + i * 6); g.add(b);
        }
        return g;
      },
    },

    {
      id: 'far-landing',
      name: 'The landing on the far bank',
      at: [-560, -1520], r: 88, ground: 1.4,
      trail: { from: [-140, -1780], style: 'posts' },
      build: (M) => {
        const g = new THREE.Group();
        const C = [-560, -1520];
        g.add(shelf(M, { r: 130, h: 1.4, mat: M.turf, seed: 12, rough: 0.22 }).translateX(C[0]).translateZ(C[1]));

        // A jetty going out over mud that is only water at the top of the
        // tide, and a rowing boat that has been left on the wrong side of it.
        const deck = new THREE.Mesh(box(2.6, 0.24, 26), M.wood);
        deck.position.set(C[0] + 4, 2.3, C[1] + 14); deck.rotation.y = 0.24; g.add(deck);
        const piles = [];
        for (let i = 0; i < 12; i++) {
          for (const sx of [-1, 1]) {
            piles.push({ pos: [C[0] + 4 + sx * 1.2 - Math.sin(0.24) * (i * 2.2 - 12), 1.2, C[1] + 14 + Math.cos(0.24) * (i * 2.2 - 12)], scale: [0.24, 2.6, 0.24] });
          }
        }
        put(g, piles, box(1, 1, 1), M.wood);

        const b = boat(M, { len: 5.0, beam: 1.6, mat: M.blue });
        b.position.set(C[0] - 4, 1.5, C[1] + 24); b.rotation.set(0, 1.1, 0.12); g.add(b);
        const oar = new THREE.Mesh(box(0.1, 0.1, 3.4), M.wood);
        oar.position.set(C[0] - 3, 2.1, C[1] + 24); oar.rotation.set(0, 0.6, 0.1); g.add(oar);

        // reeds, and the mud they stand in
        g.add(scatter(M, { n: 2600, at: [C[0], C[1] + 30], r: 110, y: 1.4, mat: M.reed, s: 2.6, vary: 1.0, seed: 33 }));
        const mud = new THREE.Mesh(new THREE.CircleGeometry(90, 26), M.water);
        mud.rotation.x = -Math.PI / 2; mud.position.set(C[0] + 20, 1.42, C[1] + 46);
        mud.renderOrder = 4; g.add(mud);
        g.add(grove(M, { n: 120, at: C, inner: 100, r: 260, kind: 'bare', mat: M.wood, h: 10, spread: 6, seed: 7 }));
        return g;
      },
    },

    {
      id: 'blue-house',
      name: 'The blue house in the village',
      at: [700, -2060], r: 90, ground: 1.5,
      trail: { from: [120, -1960], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const C = [700, -2060];
        g.add(shelf(M, { r: 150, h: 1.5, mat: M.turf, seed: 19, rough: 0.18 }).translateX(C[0]).translateZ(C[1]));

        const h = house(M, {
          w: 10, d: 8.5, h: 4.0, storeys: 2, storeyH: 3.2, roof: 'gable', roofH: 3.0,
          wall: M.blue, roofMat: M.roof, trim: M.wall, windows: 3, lit: 0.6, doorLit: true,
        });
        h.position.set(C[0], 1.5, C[1]); h.rotation.y = 1.2; g.add(h);

        // the others, close and turned away, so the blue one is the only one
        // anybody has ever knocked on
        for (let i = 0; i < 6; i++) {
          const a = 1.0 + i * 0.7;
          const o = house(M, {
            w: 8 + (i % 3), d: 7, h: 3.6, storeys: i % 2 ? 2 : 1, storeyH: 3.0,
            roof: 'gable', roofH: 2.6, wall: M.wall, roofMat: M.roof, trim: M.wood,
            windows: 2, lit: 0.15,
          });
          o.position.set(C[0] + Math.cos(a) * (34 + (i % 3) * 16), 1.5, C[1] + Math.sin(a) * (34 + (i % 3) * 16));
          o.rotation.y = -a + 0.4; g.add(o);
        }
        g.add(grove(M, { n: 160, at: C, inner: 90, r: 240, kind: 'broad', mat: M.leaf, h: 12, spread: 7, seed: 4 }));
        g.add(scatter(M, { n: 800, at: C, r: 130, y: 1.5, mat: M.leaf, s: 0.9, seed: 6 }));
        return g;
      },
    },
  ],
};
