import * as THREE from 'three';
import { shelf, house, grove, scatter, put, box, hill, mulberry, treeGeo } from './kit.js';

// ---------------------------------------------------------------------------
// The Tale of the Princess Kaguya.
//
// The window keeps the mountains and the sea of cloud. Off it: the centre of
// the bamboo grove and the one stalk lit from inside, the mansion in the
// capital that is far too large and has nobody in it, and the hill above the
// village where the running happens — and you should be able to run down it.
//
// The whole country is brushed rather than painted, so nothing here needs
// colour. What it needs is empty paper between the marks.
// ---------------------------------------------------------------------------

export default {
  region: 'ink',
  pal: {
    turf: { color: '#9a978c', shadowTint: '#4e4c46', rim: 0.8, bands: 2, grain: 0.16, grainScale: 0.5 },
    leaf: { color: '#8e9086', shadowTint: '#464840', rim: 0.7, bands: 2, grain: 0.18, grainScale: 0.35, sway: 0.05, translucency: 0.8 },
    wood: { color: '#6c665c', shadowTint: '#302c28', rim: 0.9, bands: 2, grain: 0.2, grainScale: 2.0 },
    dark: { color: '#3a3834', shadowTint: '#161514', rim: 0.9, bands: 2, grain: 0.14 },
    wall: { color: '#c6c2b4', shadowTint: '#68655c', rim: 1.0, bands: 2, grain: 0.12 },
    stone: { color: '#8a8880', shadowTint: '#3c3b38', rim: 0.9, bands: 2, grain: 0.18, grainScale: 1.2, wrap: 0.6 },
  },

  places: [
    {
      id: 'the-lit-stalk',
      name: 'The stalk that is lit from inside',
      at: [520, -2560], r: 90, ground: 1.5,
      trail: { from: [90, -2680], style: 'cut' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(2013);
        const C = [520, -2560];
        g.add(shelf(M, { r: 150, h: 1.5, mat: M.turf, seed: 4, rough: 0.14 }).translateX(C[0]).translateZ(C[1]));

        // Bamboo close enough together that you cannot see out, and one cane
        // in the middle with a light in it. Nothing else. The whole scene is
        // one bright vertical in a page of grey verticals.
        const canes = [], leaves = [];
        for (let i = 0; i < 2200; i++) {
          const a = rnd() * Math.PI * 2, d = 6 + Math.pow(rnd(), 0.6) * 130;
          const x = C[0] + Math.cos(a) * d, z = C[1] + Math.sin(a) * d;
          const h = 12 + rnd() * 9;
          canes.push({ pos: [x, 1.5, z], rot: [(rnd() - 0.5) * 0.05, rnd() * 6.28, (rnd() - 0.5) * 0.05], scale: [0.5, h, 0.5] });
          leaves.push({ pos: [x, 1.5 + h * 0.78, z], rot: [0, rnd() * 6.28, 0], scale: [2.4, 2.0, 2.4] });
        }
        put(g, canes, new THREE.CylinderGeometry(0.11, 0.14, 1, 6).translate(0, 0.5, 0), M.leaf);
        put(g, leaves, new THREE.IcosahedronGeometry(1, 0), M.leaf);

        const lit = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 15, 9), M.warm(2.2, '#ffe6a8'));
        lit.position.set(C[0], 9.0, C[1]); lit.renderOrder = 9; g.add(lit);
        const collar = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.08, 5, 10), M.leaf);
        collar.rotation.x = Math.PI / 2; collar.position.set(C[0], 6.4, C[1]); g.add(collar);

        g.userData.update = (t, near) => {
          lit.material.uniforms.uStrength.value = 1.5 + Math.sin(t * 0.9) * 0.25 + near * 1.4;
        };
        return g;
      },
    },

    {
      id: 'the-mansion',
      name: 'The mansion in the capital',
      at: [900, -3300], r: 140, ground: 1.5,
      trail: { from: [160, -3160], style: 'stones' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(31);
        const C = [900, -3300];
        g.add(shelf(M, { r: 220, h: 1.5, mat: M.turf, seed: 9, rough: 0.05 }).translateX(C[0]).translateZ(C[1]));

        // Too large, too symmetrical, and empty. Formality drawn as loneliness.
        for (let w = 0; w < 3; w++) {
          const b = house(M, {
            w: w === 1 ? 46 : 26, d: 18, h: 5.2, roof: 'jp', roofH: 7.0,
            wall: M.wall, roofMat: M.dark, trim: M.wood, windows: w === 1 ? 5 : 3,
            lit: 0, door: w === 1, doorW: 4.0, doorH: 3.6, base: M.stone,
          });
          b.position.set(C[0] + (w - 1) * 44, 2.6, C[1]); g.add(b);
        }
        // the corridors joining them, on posts, with nobody on them
        for (const sx of [-1, 1]) {
          const walk = new THREE.Mesh(box(20, 0.6, 6), M.wood);
          walk.position.set(C[0] + sx * 33, 3.6, C[1] + 2); g.add(walk);
          const roof = new THREE.Mesh(box(22, 0.5, 8), M.dark);
          walk.position.set(C[0] + sx * 33, 3.6, C[1] + 2);
          roof.position.set(C[0] + sx * 33, 8.2, C[1] + 2); g.add(roof);
        }
        // the raked garden: lines in gravel, and three stones
        const gravel = new THREE.Mesh(new THREE.CircleGeometry(70, 30), M.wall);
        gravel.rotation.x = -Math.PI / 2; gravel.position.set(C[0], 1.62, C[1] + 78); g.add(gravel);
        const rakes = [];
        for (let i = 0; i < 36; i++) {
          rakes.push({ pos: [C[0] - 62 + i * 3.6, 1.7, C[1] + 78], scale: [0.5, 0.1, 130] });
        }
        put(g, rakes, box(1, 1, 1), M.stone);
        for (const [dx, dz, s] of [[-16, 64, 3.4], [8, 84, 2.2], [22, 70, 1.6]]) {
          const st = new THREE.Mesh(hill(s, s * 1.4, 5, { rough: 0.5, rings: 6, sectors: 10 }), M.stone);
          st.position.set(C[0] + dx, 1.6, C[1] + dz); g.add(st);
        }
        g.add(grove(M, { n: 90, at: C, inner: 190, r: 340, kind: 'pine', mat: M.leaf, h: 14, spread: 8, seed: 6 }));
        void rnd;
        return g;
      },
    },

    {
      id: 'the-running-hill',
      name: 'The hill above the village',
      at: [640, -1900], r: 150, ground: 44,
      trail: { from: [110, -2020], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const C = [640, -1900];
        const knoll = new THREE.Mesh(hill(280, 52, 11, { rough: 0.2, rings: 14, sectors: 24 }), M.turf);
        knoll.position.set(C[0], -6, C[1]); g.add(knoll);

        // Bare, long, and downhill in every direction. Nothing on it, because
        // the point of it is that there is nothing on it.
        g.add(scatter(M, { n: 5200, at: C, r: 250, y: 40, mat: M.leaf, s: 1.4, vary: 0.9, seed: 51 }));
        const trees = [];
        for (let i = 0; i < 3; i++) {
          const a = 1.1 + i * 1.9;
          const t = new THREE.Group();
          const d = 150 + i * 40;
          const y = -6 + 52 * Math.sqrt(Math.max(0, 1 - (d / 280) ** 2));
          t.position.set(C[0] + Math.cos(a) * d, y, C[1] + Math.sin(a) * d);
          const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.0, 12, 8), M.wood);
          tr.position.y = 6; t.add(tr);
          const cr = new THREE.Mesh(new THREE.IcosahedronGeometry(7.5, 1), M.leaf);
          cr.position.y = 15; cr.scale.y = 0.62; t.add(cr);
          g.add(t); trees.push(t);
        }
        // and one small house at the bottom, a very long way down
        const h = house(M, {
          w: 9, d: 8, h: 3.2, roof: 'thatch', roofH: 3.6, wall: M.wall,
          roofMat: M.wood, trim: M.wood, windows: 1, lit: 0.5, doorLit: true,
        });
        h.position.set(C[0] - 250, 1.5, C[1] + 180); h.rotation.y = 0.8; g.add(h);
        return g;
      },
    },
  ],
};
