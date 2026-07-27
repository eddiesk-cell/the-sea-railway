import * as THREE from 'three';
import { shelf, house, well, fence, cart, grove, scatter, put, box, hill, mulberry } from './kit.js';

// ---------------------------------------------------------------------------
// Tales from Earthsea.
//
// The window keeps the walls and the tower on its island. Off it: the market
// street inside the walls at noon under its awnings, a farm outside the town
// that is the only honest work in the film, and the island itself — reachable,
// with a door at the foot of the tower.
// ---------------------------------------------------------------------------

export default {
  region: 'hort',
  pal: {
    turf: { color: '#78764a', shadowTint: '#2a2a18', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.55 },
    wall: { color: '#c9b48c', shadowTint: '#463c2c', rim: 0.9, bands: 3, grain: 0.2 },
    roof: { color: '#9a6a44', shadowTint: '#342216', rim: 1.0, bands: 3, grain: 0.16, side: THREE.DoubleSide },
    wood: { color: '#6a5238', shadowTint: '#241a10', rim: 0.8, bands: 3, grain: 0.28, grainScale: 1.6 },
    stone: { color: '#a89c80', shadowTint: '#38342a', rim: 0.9, bands: 3, grain: 0.24, grainScale: 1.3, wrap: 0.55 },
    leaf: { color: '#5a6c34', shadowTint: '#1c2410', rim: 0.5, bands: 3, grain: 0.22, grainScale: 0.35, sway: 0.036, translucency: 0.7 },
    cloth: { color: '#b8763e', shadowTint: '#3e2614', rim: 1.0, bands: 2, grain: 0.12, side: THREE.DoubleSide, sway: 0.06 },
    water: { color: '#123444', shadowTint: '#06161e', rim: 2.2, bands: 2, grain: 0.05 },
    dark: { color: '#241e18', shadowTint: '#0a0806', rim: 0.6, bands: 2, grain: 0.1 },
  },

  places: [
    {
      id: 'the-market-street',
      name: 'The market street',
      at: [480, -1260], r: 95, ground: 1.5,
      trail: { from: [80, -1350], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(2006);
        const C = [480, -1260];
        g.add(shelf(M, { r: 150, h: 1.5, mat: M.stone, seed: 3, rough: 0.06 }).translateX(C[0]).translateZ(C[1]));

        for (const sx of [-1, 1]) {
          for (let i = 0; i < 10; i++) {
            const h = house(M, {
              w: 8 + (i % 3) * 1.6, d: 11, h: 4.2, storeys: 1 + (i % 3), storeyH: 3.2,
              roof: 'flat', roofH: 0.7, wall: M.wall, roofMat: M.roof, trim: M.wood,
              windows: 2, lit: 0.25,
            });
            h.position.set(C[0] + sx * 11, 1.5, C[1] - 50 + i * 11);
            h.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2; g.add(h);
          }
        }
        // awnings out over the street, and stalls under them
        const awn = [], posts = [], stalls = [], goods = [];
        for (const sx of [-1, 1]) {
          for (let i = 0; i < 10; i++) {
            const z = C[1] - 48 + i * 11;
            awn.push({ pos: [C[0] + sx * 5.6, 4.6, z], rot: [0, 0, sx * 0.22], scale: [7.0, 0.1, 8.0] });
            posts.push({ pos: [C[0] + sx * 2.4, 3.0, z - 3.6], scale: [0.16, 3.0, 0.16] });
            posts.push({ pos: [C[0] + sx * 2.4, 3.0, z + 3.6], scale: [0.16, 3.0, 0.16] });
            stalls.push({ pos: [C[0] + sx * 5.0, 2.4, z], scale: [3.0, 0.9, 6.0] });
            for (let k = 0; k < 7; k++) {
              const s = 0.2 + rnd() * 0.3;
              goods.push({
                pos: [C[0] + sx * (4.2 + rnd() * 1.6), 3.0, z - 2.6 + rnd() * 5.2],
                rot: [0, rnd() * 6.28, 0], scale: [s, s, s],
              });
            }
          }
        }
        put(g, awn, box(1, 1, 1), M.cloth);
        put(g, posts, box(1, 1, 1), M.wood);
        put(g, stalls, box(1, 1, 1), M.wood);
        put(g, goods, new THREE.IcosahedronGeometry(1, 0), M.roof);
        g.add(well(M, { r: 1.4, h: 1.2, mat: M.stone, wood: M.wood }).translateX(C[0]).translateY(1.5).translateZ(C[1] + 40));
        return g;
      },
    },

    {
      id: 'the-farm',
      name: 'The farm outside the walls',
      at: [800, -1820], r: 110, ground: 1.5,
      trail: { from: [130, -1700], style: 'posts' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(23);
        const C = [800, -1820];
        g.add(shelf(M, { r: 180, h: 1.5, mat: M.turf, seed: 8, rough: 0.14 }).translateX(C[0]).translateZ(C[1]));

        const h = house(M, {
          w: 12, d: 9, h: 3.8, roof: 'gable', roofH: 3.0, wall: M.wall, roofMat: M.roof,
          trim: M.wood, windows: 2, lit: 0.6, doorLit: true, base: M.stone,
        });
        h.position.set(C[0], 1.5, C[1]); h.rotation.y = 1.5; g.add(h);
        g.add(well(M, { r: 1.1, h: 1.0, mat: M.stone, wood: M.wood }).translateX(C[0] - 14).translateY(1.5).translateZ(C[1] + 8));
        g.add(cart(M, { len: 3.2, mat: M.wood }).translateX(C[0] + 10).translateY(1.5).translateZ(C[1] + 12));

        // a low wall round a worked field, and the rows in it
        for (let i = 0; i < 4; i++) {
          const w = new THREE.Mesh(box(i % 2 ? 1.0 : 100, 1.2, i % 2 ? 100 : 1.0), M.stone);
          w.position.set(C[0] + (i === 1 ? 50 : i === 3 ? -50 : 0), 2.1, C[1] + (i === 0 ? 50 : i === 2 ? -50 : 0));
          g.add(w);
        }
        const rows = [];
        for (let i = 0; i < 22; i++) rows.push({ pos: [C[0] - 44 + i * 4, 1.62, C[1]], scale: [1.6, 0.24, 92] });
        put(g, rows, box(1, 1, 1), M.wood);
        g.add(scatter(M, { n: 2200, at: C, r: 46, y: 1.7, mat: M.leaf, s: 0.8, seed: 31 }));
        void rnd;
        return g;
      },
    },

    {
      id: 'the-tower-island',
      name: 'The island, and the door at the foot',
      at: [1020, -2260], r: 130, ground: 3.0,
      trail: { from: [180, -2140], style: 'stones' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(77);
        const C = [1020, -2260];
        const sea = new THREE.Mesh(new THREE.CircleGeometry(300, 40), M.water);
        sea.rotation.x = -Math.PI / 2; sea.position.set(C[0], 1.2, C[1]);
        sea.renderOrder = 4; g.add(sea);
        const isle = new THREE.Mesh(hill(96, 10, 5, { rough: 0.3, rings: 8, sectors: 20 }), M.stone);
        isle.position.set(C[0], -2.4, C[1]); g.add(isle);

        // A single square tower with no windows below the top, and one door.
        for (let i = 0; i < 5; i++) {
          const s = 1 - i * 0.08;
          const b = new THREE.Mesh(box(20 * s, 18, 20 * s), M.stone);
          b.position.set(C[0], 10 + i * 18, C[1]); g.add(b);
        }
        const top = new THREE.Mesh(box(24, 3, 24), M.stone);
        top.position.set(C[0], 100, C[1]); g.add(top);
        for (let i = 0; i < 4; i++) {
          const a = Math.PI / 4 + i * Math.PI / 2;
          const w = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 5.0), M.warm(1.1, '#cfe0f0'));
          w.position.set(C[0] + Math.cos(a) * 8.6, 92, C[1] + Math.sin(a) * 8.6);
          w.rotation.y = -a + Math.PI / 2; w.renderOrder = 9; g.add(w);
        }
        const door = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 5.0), M.dark);
        door.position.set(C[0], 5.5, C[1] + 10.1); door.renderOrder = 7; g.add(door);
        const arch = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.5, 6, 14, Math.PI), M.stone);
        arch.position.set(C[0], 8.0, C[1] + 10.2); g.add(arch);
        // a causeway of stones, only just above the water
        const stones = [];
        for (let i = 0; i < 34; i++) {
          const s = 2.4 + rnd() * 1.8;
          stones.push({
            pos: [C[0] - 96 - i * 5.4, 1.3, C[1] + 20 + Math.sin(i * 0.6) * 5],
            rot: [0, rnd() * 6.28, 0], scale: [s, 1.0, s * 0.9],
          });
        }
        put(g, stones, hill(1, 1, 3, { rough: 0.5, rings: 4, sectors: 8 }), M.stone);
        return g;
      },
    },
  ],
};
