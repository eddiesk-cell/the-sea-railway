import * as THREE from 'three';
import { shelf, house, shed, fence, cart, grove, scatter, put, box, hill, mulberry } from './kit.js';

// ---------------------------------------------------------------------------
// Only Yesterday.
//
// The window keeps the terraces and the safflower. Off it: the farmhouse
// kitchen seen from the yard with the light on, the mountain road at the top of
// the valley where you can see the whole farm at once, and one pineapple on a
// table, for whoever gets it.
// ---------------------------------------------------------------------------

export default {
  region: 'safflower',
  pal: {
    turf: { color: '#5a6a3c', shadowTint: '#1e2618', rim: 0.5, bands: 3, grain: 0.22, grainScale: 0.55 },
    wood: { color: '#5e4a32', shadowTint: '#1e170e', rim: 0.8, bands: 3, grain: 0.28, grainScale: 1.5 },
    wall: { color: '#c0b294', shadowTint: '#443e32', rim: 0.9, bands: 3, grain: 0.18 },
    roof: { color: '#4c4a44', shadowTint: '#181816', rim: 1.1, bands: 3, grain: 0.16, side: THREE.DoubleSide },
    leaf: { color: '#48682e', shadowTint: '#16220e', rim: 0.5, bands: 3, grain: 0.22, grainScale: 0.35, sway: 0.04, translucency: 0.8 },
    flower: { color: '#e08a26', shadowTint: '#5a3410', rim: 1.4, bands: 2, grain: 0.1, sway: 0.06, translucency: 1.1 },
    stone: { color: '#8e887c', shadowTint: '#2e2c28', rim: 0.9, bands: 3, grain: 0.24, grainScale: 1.2, wrap: 0.55 },
  },

  places: [
    {
      id: 'the-kitchen',
      name: 'The farmhouse, from the yard',
      at: [500, -1210], r: 95, ground: 1.5,
      trail: { from: [80, -1300], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(1991);
        const C = [500, -1210];
        g.add(shelf(M, { r: 150, h: 1.5, mat: M.turf, seed: 4, rough: 0.16 }).translateX(C[0]).translateZ(C[1]));

        // The house is turned so the KITCHEN faces you — a long low window with
        // the light on behind it, seen across a yard of beaten earth.
        const h = house(M, {
          w: 18, d: 11, h: 3.6, roof: 'jp', roofH: 4.2, wall: M.wall, roofMat: M.roof,
          trim: M.wood, windows: 4, lit: 0, doorLit: false, base: M.stone,
        });
        h.position.set(C[0], 1.5, C[1]); h.rotation.y = 0.35; g.add(h);
        const kitchen = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 1.9), M.warm(1.7, '#ffcf90'));
        kitchen.position.set(C[0] + Math.sin(0.35) * 5.7 - 2.0, 3.4, C[1] + Math.cos(0.35) * 5.7 + 0.7);
        kitchen.rotation.y = 0.35; kitchen.renderOrder = 9; g.add(kitchen);

        const s = shed(M, { w: 9, d: 12, h: 4.4, mat: M.wood, roofMat: M.roof });
        s.position.set(C[0] - 22, 1.5, C[1] + 14); s.rotation.y = 0.9; g.add(s);
        g.add(cart(M, { len: 3.4, mat: M.wood }).translateX(C[0] - 14).translateY(1.5).translateZ(C[1] + 10));
        g.add(fence(M, { len: 40, h: 1.2, mat: M.wood }).translateX(C[0] + 22).translateY(1.5).translateZ(C[1] + 6));

        // drying frames, and the vegetable rows behind them
        const frames = [];
        for (let i = 0; i < 6; i++) {
          frames.push({ pos: [C[0] + 8 + i * 3, 3.0, C[1] + 20], rot: [0, 0.2, 0], scale: [0.14, 3.0, 0.14] });
        }
        put(g, frames, box(1, 1, 1), M.wood);
        for (let i = 0; i < 30; i++) {
          const r = new THREE.Mesh(box(0.9, 0.16, 1.4), M.leaf);
          r.position.set(C[0] + 8 + rnd() * 16, 4.2, C[1] + 20 + (rnd() - 0.5) * 2); g.add(r);
        }
        g.add(scatter(M, { n: 1400, at: [C[0] + 30, C[1] + 34], r: 40, y: 1.6, mat: M.leaf, s: 0.9, seed: 22 }));
        return g;
      },
    },

    {
      id: 'the-mountain-road',
      name: 'The road at the top of the valley',
      at: [820, -1900], r: 130, ground: 52,
      trail: { from: [140, -1780], style: 'posts' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(5);
        const C = [820, -1900];
        const ridge = new THREE.Mesh(hill(300, 62, 13, { rough: 0.3, rings: 14, sectors: 24 }), M.turf);
        ridge.position.set(C[0] + 60, -8, C[1]); g.add(ridge);

        // A road cut into the shoulder, with a low wall on the drop side. The
        // whole farm is below it, small, which is the point.
        const road = new THREE.Mesh(box(7.0, 0.4, 300), M.stone);
        road.position.set(C[0], 52.2, C[1]); road.rotation.y = 0.08; g.add(road);
        const kerb = [];
        for (let i = 0; i < 60; i++) {
          kerb.push({ pos: [C[0] - 4.0, 52.7, C[1] - 145 + i * 5], rot: [0, rnd() * 0.2, 0], scale: [0.7, 0.9, 4.4] });
        }
        put(g, kerb, box(1, 1, 1), M.stone);

        // terraces going down, seen from above and getting smaller
        const beds = [];
        for (let i = 0; i < 8; i++) {
          const r = 250 - i * 24;
          const y = 52 - i * 6.4;
          for (let k = 0; k < 40; k++) {
            const a = -2.6 + (k / 40) * 2.1;
            beds.push({
              pos: [C[0] - 120 + Math.cos(a) * r * 0.5, y, C[1] + Math.sin(a) * r * 0.6],
              rot: [0, a, 0], scale: [7, 0.5, 3.4],
            });
          }
        }
        put(g, beds, box(1, 1, 1), M.leaf);
        g.add(scatter(M, { n: 2600, at: [C[0] - 130, C[1]], r: 190, y: 30, mat: M.flower, s: 1.2, seed: 31 }));
        g.add(grove(M, { n: 200, at: C, inner: 160, r: 340, kind: 'pine', mat: M.leaf, h: 16, spread: 7, seed: 8 }));
        return g;
      },
    },

    {
      id: 'the-pineapple',
      name: 'The pineapple on the table',
      at: [430, -2160], r: 60, ground: 1.5,
      trail: { from: [80, -2060], style: 'stones' },
      build: (M) => {
        const g = new THREE.Group();
        const C = [430, -2160];
        g.add(shelf(M, { r: 90, h: 1.5, mat: M.turf, seed: 6, rough: 0.2 }).translateX(C[0]).translateZ(C[1]));

        // One room with no walls: a floor, a low table, cushions, and the
        // fruit nobody in 1966 knew how to open. It is a joke and a small one,
        // and it should be found by accident.
        const floor = new THREE.Mesh(box(7.0, 0.3, 7.0), M.wood);
        floor.position.set(C[0], 1.8, C[1]); g.add(floor);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
          const p = new THREE.Mesh(box(0.2, 3.2, 0.2), M.wood);
          p.position.set(C[0] + sx * 3.2, 3.4, C[1] + sz * 3.2); g.add(p);
        }
        const roof = new THREE.Mesh(box(8.4, 0.24, 8.4), M.roof);
        roof.position.set(C[0], 5.1, C[1]); g.add(roof);

        const table = new THREE.Mesh(box(2.2, 0.12, 1.4), M.wood);
        table.position.set(C[0], 2.35, C[1]); g.add(table);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
          const l = new THREE.Mesh(box(0.1, 0.4, 0.1), M.wood);
          l.position.set(C[0] + sx * 0.9, 2.15, C[1] + sz * 0.5); g.add(l);
        }
        // the fruit
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.34, 10), M.flower);
        body.position.set(C[0], 2.58, C[1]); g.add(body);
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2;
          const lf = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.28, 4), M.leaf);
          lf.position.set(C[0] + Math.cos(a) * 0.05, 2.86, C[1] + Math.sin(a) * 0.05);
          lf.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); g.add(lf);
        }
        // and the knife nobody has picked up
        const knife = new THREE.Mesh(box(0.24, 0.02, 0.05), M.stone);
        knife.position.set(C[0] + 0.6, 2.42, C[1] + 0.2); knife.rotation.y = 0.4; g.add(knife);

        g.add(grove(M, { n: 120, at: C, inner: 40, r: 160, kind: 'broad', mat: M.leaf, h: 12, spread: 7, seed: 3 }));
        return g;
      },
    },
  ],
};
