import * as THREE from 'three';
import { shelf, house, grove, scatter, put, box, hill, mulberry } from './kit.js';

// ---------------------------------------------------------------------------
// Howl's Moving Castle — the country half.
//
// The window keeps the flowers and the castle walking across them. Off it: the
// castle STOPPED, with the door you can go in; the lake and the cottage at the
// far end of the flower field; and the waste, which is the same country with
// everything taken out of it and the castle's tracks across the middle.
// ---------------------------------------------------------------------------

export default {
  region: 'meadow',
  pal: {
    turf: { color: '#5c7a3c', shadowTint: '#1e2a16', rim: 0.5, bands: 3, grain: 0.22, grainScale: 0.55 },
    leaf: { color: '#4e7030', shadowTint: '#182410', rim: 0.5, bands: 3, grain: 0.22, grainScale: 0.35, sway: 0.05, translucency: 0.9 },
    flower: { color: '#d8c0d8', shadowTint: '#5a4a5c', rim: 1.2, bands: 2, grain: 0.1, sway: 0.07, translucency: 1.1 },
    wall: { color: '#c8bda0', shadowTint: '#464034', rim: 0.9, bands: 3, grain: 0.18 },
    roof: { color: '#7a5a48', shadowTint: '#2a1e18', rim: 1.0, bands: 3, grain: 0.16, side: THREE.DoubleSide },
    iron: { color: '#5a5048', shadowTint: '#1c1814', rim: 1.4, bands: 3, grain: 0.2, grainScale: 1.4 },
    rust: { color: '#7a5230', shadowTint: '#2a1a10', rim: 1.2, bands: 3, grain: 0.26, grainScale: 1.6 },
    wood: { color: '#5e4630', shadowTint: '#20170e', rim: 0.8, bands: 3, grain: 0.28, grainScale: 1.6 },
    waste: { color: '#7a7264', shadowTint: '#2e2c28', rim: 0.7, bands: 3, grain: 0.3, grainScale: 0.8 },
    water: { color: '#2c5a6e', shadowTint: '#0c1e28', rim: 2.2, bands: 2, grain: 0.05 },
  },

  places: [
    {
      id: 'the-castle-stopped',
      name: 'The castle, stopped',
      at: [640, -1420], r: 120, ground: 1.6,
      trail: { from: [110, -1520], style: 'cut' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(2004);
        const C = [640, -1420];
        g.add(shelf(M, { r: 190, h: 1.6, mat: M.turf, seed: 5, rough: 0.16 }).translateX(C[0]).translateZ(C[1]));

        // A pile of buildings that should not stand up, on four legs, leaning.
        // Every part is a different material and none of them agree.
        const body = new THREE.Group();
        body.position.set(C[0], 18, C[1]); body.rotation.y = 0.5; body.rotation.z = 0.04;
        const mats = [M.wall, M.rust, M.iron, M.wood, M.roof];
        for (let i = 0; i < 22; i++) {
          const w = 6 + rnd() * 16, h = 5 + rnd() * 12, d = 6 + rnd() * 14;
          const b = new THREE.Mesh(box(w, h, d), mats[(rnd() * mats.length) | 0]);
          b.position.set((rnd() - 0.5) * 24, (rnd() - 0.3) * 26, (rnd() - 0.5) * 22);
          b.rotation.set((rnd() - 0.5) * 0.2, rnd() * 6.28, (rnd() - 0.5) * 0.2);
          body.add(b);
        }
        for (let i = 0; i < 5; i++) {
          const st = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.6, 12 + rnd() * 10, 8), M.rust);
          st.position.set((rnd() - 0.5) * 18, 20 + rnd() * 8, (rnd() - 0.5) * 16);
          st.rotation.z = (rnd() - 0.5) * 0.3; body.add(st);
        }
        // the face: two round windows and a canopy over them, lit
        for (const sx of [-1, 1]) {
          const eye = new THREE.Mesh(new THREE.CircleGeometry(2.2, 14), M.warm(1.6, '#ffce86'));
          eye.position.set(sx * 5.0, 4.0, 15.2); eye.renderOrder = 9; body.add(eye);
          const brow = new THREE.Mesh(box(6.0, 1.0, 2.0), M.roof);
          brow.position.set(sx * 5.0, 6.8, 15.0); brow.rotation.z = -sx * 0.12; body.add(brow);
        }
        g.add(body);

        // the legs, splayed and dug in
        for (let i = 0; i < 4; i++) {
          const a = 0.8 + i * 1.55;
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.6, 20, 7), M.rust);
          leg.position.set(C[0] + Math.cos(a) * 14, 9, C[1] + Math.sin(a) * 14);
          leg.rotation.z = Math.cos(a) * 0.24; leg.rotation.x = -Math.sin(a) * 0.24; g.add(leg);
          const foot = new THREE.Mesh(new THREE.SphereGeometry(4.0, 10, 6), M.iron);
          foot.scale.y = 0.5; foot.position.set(C[0] + Math.cos(a) * 18, 2.4, C[1] + Math.sin(a) * 18); g.add(foot);
        }
        // the door, at the bottom, and it is an ordinary door
        const porch = new THREE.Mesh(box(4.0, 5.0, 1.0), M.wood);
        porch.position.set(C[0] + 11, 4.1, C[1] + 12); porch.rotation.y = 0.5; g.add(porch);
        const door = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.6), M.warm(2.2, '#ffb964'));
        door.position.set(C[0] + 11.4, 3.4, C[1] + 12.6); door.rotation.y = 0.5;
        door.renderOrder = 9; g.add(door);
        const steps2 = new THREE.Mesh(box(4.4, 1.6, 3.0), M.wood);
        steps2.position.set(C[0] + 12.4, 2.2, C[1] + 14.4); steps2.rotation.y = 0.5; g.add(steps2);

        g.add(scatter(M, { n: 3200, at: C, r: 180, y: 1.6, mat: M.flower, s: 1.1, seed: 12 }));
        return g;
      },
    },

    {
      id: 'the-lake-cottage',
      name: 'The lake, and the cottage',
      at: [920, -2000], r: 130, ground: 1.6,
      trail: { from: [150, -1880], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const C = [920, -2000];
        g.add(shelf(M, { r: 200, h: 1.6, mat: M.turf, seed: 8, rough: 0.14 }).translateX(C[0]).translateZ(C[1]));
        const lake = new THREE.Mesh(new THREE.CircleGeometry(110, 34), M.water);
        lake.rotation.x = -Math.PI / 2; lake.position.set(C[0] + 40, 1.55, C[1]);
        lake.renderOrder = 4; g.add(lake);

        const h = house(M, {
          w: 10, d: 8, h: 4.0, roof: 'gable', roofH: 3.2, wall: M.wall, roofMat: M.roof,
          trim: M.wood, windows: 2, lit: 0.8, doorLit: true,
        });
        h.position.set(C[0] - 82, 1.6, C[1] - 20); h.rotation.y = 1.9; g.add(h);
        const jetty = new THREE.Mesh(box(2.0, 0.2, 16), M.wood);
        jetty.position.set(C[0] - 64, 2.0, C[1] - 4); jetty.rotation.y = 0.4; g.add(jetty);
        g.add(scatter(M, { n: 4200, at: [C[0] - 90, C[1] + 40], r: 130, y: 1.6, mat: M.flower, s: 1.1, seed: 22 }));
        g.add(grove(M, { n: 140, at: C, inner: 160, r: 320, kind: 'broad', mat: M.leaf, h: 13, spread: 7, seed: 3 }));
        return g;
      },
    },

    {
      id: 'the-waste',
      name: 'The waste',
      at: [560, -2400], r: 170, ground: 1.5,
      trail: { from: [110, -2280], style: 'posts' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(99);
        const C = [560, -2400];
        g.add(shelf(M, { r: 280, h: 1.5, mat: M.waste, seed: 2, rough: 0.1 }).translateX(C[0]).translateZ(C[1]));

        // Nothing grows. Two rows of enormous round prints go across it and out
        // the other side, and that is the entire content of the place.
        const prints = [];
        for (let i = 0; i < 26; i++) {
          for (const sx of [-1, 1]) {
            prints.push({
              pos: [C[0] - 200 + i * 17 + sx * 5, 1.35, C[1] - 60 + i * 9 + sx * 11],
              rot: [0, rnd() * 6.28, 0], scale: [9, 0.5, 11],
            });
          }
        }
        put(g, prints, new THREE.CylinderGeometry(1, 1.1, 1, 12), M.iron);
        const rocks = [];
        for (let i = 0; i < 400; i++) {
          const a = rnd() * 6.28, d = Math.pow(rnd(), 0.5) * 260;
          const s = 0.6 + rnd() * 2.4;
          rocks.push({ pos: [C[0] + Math.cos(a) * d, 1.4, C[1] + Math.sin(a) * d], rot: [0, rnd() * 6.28, 0], scale: [s, s * 0.6, s] });
        }
        put(g, rocks, hill(1, 1, 4, { rough: 0.5, rings: 4, sectors: 8 }), M.waste);
        // one dead tree, because a waste with nothing in it reads as unfinished
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.4, 11, 8), M.iron);
        t.position.set(C[0] + 40, 7.0, C[1] + 60); t.rotation.z = 0.14; g.add(t);
        for (let i = 0; i < 5; i++) {
          const b = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.34, 4.4, 5), M.iron);
          b.position.set(C[0] + 40 + Math.cos(i * 1.3) * 1.6, 10 + (i % 2) * 1.6, C[1] + 60 + Math.sin(i * 1.3) * 1.6);
          b.rotation.set(Math.sin(i) * 0.7, 0, Math.cos(i) * 0.7); g.add(b);
        }
        return g;
      },
    },
  ],
};
