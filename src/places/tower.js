import * as THREE from 'three';
import { shelf, house, boat, grove, scatter, put, box, hill, mulberry } from './kit.js';

// ---------------------------------------------------------------------------
// The Boy and the Heron.
//
// The window keeps the tower in its wood. Off it: the door at the foot of it,
// which goes somewhere else entirely; the sea gate with a boat drawn up on the
// shingle; and the house with the corridors and the closed rooms.
//
// The rule for this country is that nothing may look picturesque, so every
// place here is built slightly wrong on purpose and none of it is explained.
// ---------------------------------------------------------------------------

export default {
  region: 'tower',
  pal: {
    turf: { color: '#46543a', shadowTint: '#1a2018', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.55 },
    stone: { color: '#7d7b74', shadowTint: '#2c2c2e', rim: 0.8, bands: 3, grain: 0.26, grainScale: 1.5, wrap: 0.55 },
    wall: { color: '#b8ae98', shadowTint: '#3e3c34', rim: 0.9, bands: 3, grain: 0.18 },
    roof: { color: '#4a4e52', shadowTint: '#181a1c', rim: 1.1, bands: 3, grain: 0.14, side: THREE.DoubleSide },
    wood: { color: '#48403a', shadowTint: '#171412', rim: 0.7, bands: 3, grain: 0.26, grainScale: 1.7 },
    leaf: { color: '#37502e', shadowTint: '#111a10', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.35, sway: 0.03, translucency: 0.55 },
    water: { color: '#2a3238', shadowTint: '#0e1216', rim: 2.2, bands: 2, grain: 0.05 },
    shingle: { color: '#8a857c', shadowTint: '#2e2c28', rim: 0.8, bands: 3, grain: 0.3, grainScale: 0.7 },
    bird: { color: '#dfe0da', shadowTint: '#6a6c68', rim: 1.4, bands: 2, grain: 0.06 },
    gold: { color: '#c0a44a', shadowTint: '#463818', rim: 1.9, bands: 2, grain: 0.08 },
  },

  places: [
    {
      id: 'the-door',
      name: 'The door at the foot',
      at: [-180, -1300], r: 66, ground: 1.4,
      trail: { from: [-60, -1400], style: 'stones' },
      build: (M) => {
        const g = new THREE.Group();
        const C = [-180, -1300];

        // Twenty metres from the tower, at the foot of it, on the side you
        // cannot see from the line. It is far too small for the building, and
        // through it there is a corridor that is very obviously not inside.
        const jamb = new THREE.Mesh(box(1.2, 4.4, 3.2), M.stone);
        jamb.position.set(C[0], 3.6, C[1]); g.add(jamb);
        const way = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 3.2), M.wood);
        way.position.set(C[0] + 0.65, 3.0, C[1]); way.rotation.y = Math.PI / 2;
        way.renderOrder = 6; g.add(way);
        // the corridor beyond: three lit arches receding, all slightly off-axis
        for (let i = 0; i < 5; i++) {
          const a = new THREE.Mesh(new THREE.TorusGeometry(1.7 - i * 0.12, 0.28, 6, 12, Math.PI), M.wall);
          a.position.set(C[0] - 2 - i * 3.4, 3.0 + i * 0.1, C[1] + i * 0.5);
          a.rotation.y = Math.PI / 2 + i * 0.06; g.add(a);
          const lit = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.3), M.warm(1.3 - i * 0.2, '#ffdba2'));
          lit.position.set(C[0] - 3.6 - i * 3.4, 4.5 + i * 0.1, C[1] + i * 0.5);
          lit.rotation.x = -Math.PI / 2; lit.renderOrder = 9; g.add(lit);
        }
        const floor = new THREE.Mesh(box(20, 0.3, 3.4), M.wall);
        floor.position.set(C[0] - 10, 1.5, C[1] + 1.2); floor.rotation.y = 0.1; g.add(floor);

        g.add(scatter(M, { n: 700, at: C, r: 70, y: 1.4, mat: M.leaf, s: 1.2, seed: 6 }));
        return g;
      },
    },

    {
      id: 'the-sea-gate',
      name: 'The sea gate',
      at: [560, -1720], r: 110, ground: 1.4,
      trail: { from: [100, -1600], style: 'posts' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(2023);
        const C = [560, -1720];
        g.add(shelf(M, { r: 160, h: 1.4, mat: M.shingle, seed: 3, rough: 0.1 }).translateX(C[0] - 60).translateZ(C[1]));
        const sea = new THREE.Mesh(new THREE.CircleGeometry(220, 34), M.water);
        sea.rotation.x = -Math.PI / 2; sea.position.set(C[0] + 130, 1.25, C[1]);
        sea.renderOrder = 4; g.add(sea);

        // A gate standing in the shingle with nothing either side of it, and a
        // flat grey sea beyond. It is a door to the sea and it is not a joke.
        for (const sx of [-1, 1]) {
          const p = new THREE.Mesh(box(3.4, 16, 3.4), M.stone);
          p.position.set(C[0] + sx * 8, 9.4, C[1]); g.add(p);
        }
        const lintel = new THREE.Mesh(box(23, 3.4, 4.4), M.stone);
        lintel.position.set(C[0], 19.1, C[1]); g.add(lintel);
        const inscr = new THREE.Mesh(box(11, 1.2, 0.4), M.gold);
        inscr.position.set(C[0], 19.1, C[1] + 2.4); g.add(inscr);

        const b = boat(M, { len: 7.0, beam: 2.2, mat: M.wood });
        b.position.set(C[0] - 26, 1.4, C[1] + 16); b.rotation.set(0, 1.2, 0.08); g.add(b);
        const oar = new THREE.Mesh(box(0.12, 0.12, 4.0), M.wood);
        oar.position.set(C[0] - 22, 2.0, C[1] + 18); oar.rotation.set(0, 0.9, 0.1); g.add(oar);

        // the birds, standing about, not doing anything
        const items = [];
        for (let i = 0; i < 34; i++) {
          const s = 0.9 + rnd() * 0.5;
          items.push({
            pos: [C[0] - 90 + rnd() * 120, 1.4, C[1] - 90 + rnd() * 180],
            rot: [0, rnd() * 6.28, 0], scale: [s, s, s],
          });
        }
        put(g, items, new THREE.ConeGeometry(0.5, 2.2, 7), M.bird);
        const stones = [];
        for (let i = 0; i < 900; i++) {
          const s = 0.3 + rnd() * 0.7;
          stones.push({
            pos: [C[0] - 120 + rnd() * 200, 1.42, C[1] - 130 + rnd() * 260],
            rot: [0, rnd() * 6.28, 0], scale: [s, s * 0.4, s],
          });
        }
        put(g, stones, hill(1, 1, 2, { rough: 0.5, rings: 4, sectors: 7 }), M.shingle);
        return g;
      },
    },

    {
      id: 'the-house',
      name: 'The house with the closed rooms',
      at: [860, -2260], r: 120, ground: 1.5,
      trail: { from: [150, -2140], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(77);
        const C = [860, -2260];
        g.add(shelf(M, { r: 180, h: 1.5, mat: M.turf, seed: 9, rough: 0.12 }).translateX(C[0]).translateZ(C[1]));

        // Too many rooms and too few doors. Wings going off in four directions
        // and every one of them ends in a wall.
        const wings = [[0, 0, 34, 14, 0], [26, -24, 14, 30, 0.1], [-28, 20, 16, 26, -0.08], [12, 30, 26, 12, 0.05]];
        wings.forEach(([dx, dz, w, d, ry], i) => {
          const h = house(M, {
            w, d, h: 4.4, storeys: i === 0 ? 2 : 1, storeyH: 3.6, roof: 'jp', roofH: 4.4,
            wall: M.wall, roofMat: M.roof, trim: M.wood, windows: Math.max(2, Math.round(w / 6)),
            lit: i === 0 ? 0.35 : 0.12, door: i === 0, doorLit: i === 0, base: M.stone,
          });
          h.position.set(C[0] + dx, 1.9, C[1] + dz); h.rotation.y = ry; g.add(h);
        });
        // the corridors between them, glazed, and nobody in any of them
        for (const [x1, z1, x2, z2] of [[8, 6, 24, -12], [-6, 8, -22, 16], [4, 10, 10, 24]]) {
          const len = Math.hypot(x2 - x1, z2 - z1);
          const c = new THREE.Mesh(box(3.0, 3.2, len), M.wall);
          c.position.set(C[0] + (x1 + x2) / 2, 3.5, C[1] + (z1 + z2) / 2);
          c.rotation.y = Math.atan2(x2 - x1, z2 - z1); g.add(c);
          const r = new THREE.Mesh(box(3.8, 0.3, len + 0.6), M.roof);
          r.position.set(C[0] + (x1 + x2) / 2, 5.3, C[1] + (z1 + z2) / 2);
          r.rotation.y = c.rotation.y; g.add(r);
        }
        // one lit window, upstairs, at the far end, and it should be the only one
        const lit = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.9), M.warm(2.0, '#ffd39a'));
        lit.position.set(C[0] + 33.2, 8.4, C[1] - 24); lit.rotation.y = Math.PI / 2 + 0.1;
        lit.renderOrder = 9; g.add(lit);

        g.add(grove(M, { n: 420, at: C, inner: 130, r: 340, kind: 'broad', mat: M.leaf, h: 16, spread: 8, seed: 4 }));
        void rnd;
        return g;
      },
    },
  ],
};
