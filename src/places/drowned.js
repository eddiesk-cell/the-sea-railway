import * as THREE from 'three';
import { shelf, house, boat, fence, steps, grove, scatter, put, box, hill, mulberry } from './kit.js';

// ---------------------------------------------------------------------------
// Ponyo.
//
// The window keeps the road under the tide. Off it: the house on the headland
// with its light, the home under the water still lit and still going, the
// tunnel nobody wants to walk into, and a boat with a candle for an engine.
// ---------------------------------------------------------------------------

export default {
  region: 'drowned',
  pal: {
    turf: { color: '#4e6a3c', shadowTint: '#1c2818', rim: 0.5, bands: 3, grain: 0.22, grainScale: 0.55 },
    wall: { color: '#e0d8c0', shadowTint: '#5c5a4e', rim: 0.9, bands: 3, grain: 0.16 },
    roof: { color: '#b4543c', shadowTint: '#40201a', rim: 1.1, bands: 3, grain: 0.14, side: THREE.DoubleSide },
    wood: { color: '#6a5238', shadowTint: '#241a10', rim: 0.8, bands: 3, grain: 0.26, grainScale: 1.5 },
    stone: { color: '#8e8a7e', shadowTint: '#30302c', rim: 0.9, bands: 3, grain: 0.24, grainScale: 1.3, wrap: 0.55 },
    leaf: { color: '#3f6030', shadowTint: '#132010', rim: 0.5, bands: 3, grain: 0.22, grainScale: 0.35, sway: 0.04, translucency: 0.7 },
    water: { color: '#1d5a70', shadowTint: '#08222e', rim: 2.4, bands: 2, grain: 0.05 },
    deep: { color: '#0d3444', shadowTint: '#04141c', rim: 2.0, bands: 2, grain: 0.04 },
  },

  places: [
    {
      id: 'headland-house',
      name: 'The house on the headland',
      at: [560, -1200], r: 110, ground: 26,
      trail: { from: [90, -1300], style: 'stones' },
      build: (M) => {
        const g = new THREE.Group();
        const C = [560, -1200];
        const head = new THREE.Mesh(hill(190, 34, 11, { rough: 0.3, rings: 12, sectors: 22 }), M.turf);
        head.position.set(C[0], -6, C[1]); g.add(head);

        const h = house(M, {
          w: 12, d: 9, h: 4.4, roof: 'gable', roofH: 3.4, wall: M.wall, roofMat: M.roof,
          trim: M.wood, windows: 3, lit: 1, doorLit: true,
        });
        h.position.set(C[0], 26.5, C[1]); h.rotation.y = 2.1; g.add(h);
        g.add(fence(M, { len: 40, h: 1.0, mat: M.wood }).translateX(C[0] + 14).translateY(26.5).translateZ(C[1] + 6));

        // the stepping stones up to it, which are the reason the house is only
        // reachable on foot
        const st = steps(M, { n: 34, w: 2.4, rise: 0.74, run: 2.4, mat: M.stone });
        st.position.set(C[0] - 96, 1.4, C[1] + 40); st.rotation.y = -1.05; g.add(st);
        g.add(scatter(M, { n: 1400, at: C, r: 170, y: 24, mat: M.leaf, s: 1.1, seed: 6 }));
        g.add(grove(M, { n: 90, at: C, inner: 60, r: 180, kind: 'pine', mat: M.leaf, h: 11, spread: 5, seed: 3 }));
        return g;
      },
    },

    {
      id: 'sunken-home',
      name: 'Still lit, under the water',
      at: [800, -1740], r: 120, ground: 1.4,
      trail: { from: [140, -1620], style: 'posts' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(2008);
        const C = [800, -1740];

        // A building standing in a flooded hollow with the water OVER it —
        // seen from the bank, from above, through the surface. Every window is
        // on, which is what makes it unbearable rather than sad.
        const b = house(M, {
          w: 30, d: 14, h: 6.0, storeys: 2, storeyH: 4.6, roof: 'hip', roofH: 3.4,
          wall: M.wall, roofMat: M.roof, trim: M.wood, windows: 7, lit: 1, winW: 1.2, winH: 1.6,
        });
        b.position.set(C[0], -9.5, C[1]); b.rotation.y = 0.5; g.add(b);

        // the surface, above it
        const surf = new THREE.Mesh(new THREE.CircleGeometry(160, 40), M.water);
        surf.rotation.x = -Math.PI / 2; surf.position.set(C[0], 1.6, C[1]);
        surf.renderOrder = 5; g.add(surf);
        const bowl = shelf(M, { r: 230, h: 2.0, mat: M.turf, seed: 4, rough: 0.2 });
        bowl.position.set(C[0], -0.4, C[1]); g.add(bowl);

        // and the enormous fish going over it, unhurried
        const fishes = [];
        for (let i = 0; i < 7; i++) {
          const a = rnd() * Math.PI * 2, d = 30 + rnd() * 110;
          fishes.push({
            pos: [C[0] + Math.cos(a) * d, -3 - rnd() * 3, C[1] + Math.sin(a) * d],
            rot: [0, rnd() * 6.28, 0], scale: [4 + rnd() * 4, 2.4, 12 + rnd() * 9],
          });
        }
        put(g, fishes, new THREE.SphereGeometry(1, 9, 6), M.deep);
        return g;
      },
    },

    {
      id: 'the-tunnel',
      name: 'The tunnel at the bottom of the hill',
      at: [380, -700], r: 78, ground: 1.4,
      trail: { from: [60, -800], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const C = [380, -700];
        const bank = new THREE.Mesh(hill(130, 40, 5, { rough: 0.3, rings: 12, sectors: 20 }), M.turf);
        bank.position.set(C[0] + 60, 1.0, C[1]); g.add(bank);

        // A mouth in the hillside with a rendered arch round it, and nothing
        // whatever inside. The dark IS the place.
        const arch = new THREE.Mesh(new THREE.TorusGeometry(4.4, 1.2, 8, 20, Math.PI), M.wall);
        arch.position.set(C[0], 5.2, C[1]); arch.rotation.y = -Math.PI / 2; g.add(arch);
        const jamb = new THREE.Mesh(box(2.4, 5.2, 1.6), M.wall);
        for (const sz of [-1, 1]) {
          const j = jamb.clone(); j.position.set(C[0], 4.0, C[1] + sz * 5.0); g.add(j);
        }
        const dark = new THREE.Mesh(new THREE.PlaneGeometry(9.0, 9.4), M.deep);
        dark.position.set(C[0] + 1.2, 5.0, C[1]); dark.rotation.y = -Math.PI / 2;
        dark.renderOrder = 6; g.add(dark);

        g.add(scatter(M, { n: 900, at: C, r: 90, y: 1.5, mat: M.leaf, s: 1.2, seed: 9 }));
        g.add(grove(M, { n: 260, at: C, inner: 70, r: 260, kind: 'broad', mat: M.leaf, h: 16, spread: 8, seed: 12 }));
        return g;
      },
    },

    {
      id: 'candle-boat',
      name: 'The boat with the candle in it',
      at: [520, -2020], r: 70, ground: 1.4,
      trail: { from: [110, -2120], style: 'stones' },
      build: (M) => {
        const g = new THREE.Group();
        const C = [520, -2020];
        g.add(shelf(M, { r: 120, h: 1.4, mat: M.turf, seed: 8, rough: 0.24 }).translateX(C[0]).translateZ(C[1]));
        const inlet = new THREE.Mesh(new THREE.CircleGeometry(52, 26), M.water);
        inlet.rotation.x = -Math.PI / 2; inlet.position.set(C[0] + 30, 1.45, C[1] + 10);
        inlet.renderOrder = 4; g.add(inlet);

        // Small. Ridiculously small — a toy that works, which is the joke.
        const b = boat(M, { len: 3.4, beam: 1.2, mat: M.roof });
        b.position.set(C[0] + 6, 1.5, C[1] + 4); b.rotation.y = 0.8; g.add(b);
        const flame = new THREE.Mesh(new THREE.SphereGeometry(0.16, 7, 5), M.warm(3.0, '#ffd07a'));
        flame.position.set(C[0] + 6, 2.3, C[1] + 4); flame.renderOrder = 9; g.add(flame);
        const post = new THREE.Mesh(box(0.18, 1.8, 0.18), M.wood);
        post.position.set(C[0] + 2.6, 2.3, C[1] + 6.4); g.add(post);
        const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.6, 5), M.wood);
        rope.rotation.set(0, 0.8, Math.PI / 2 - 0.3);
        rope.position.set(C[0] + 4.3, 2.0, C[1] + 5.2); g.add(rope);

        g.add(scatter(M, { n: 700, at: C, r: 100, y: 1.5, mat: M.leaf, s: 1.0, seed: 17 }));
        g.userData.update = (t) => {
          flame.material.uniforms.uStrength.value = 2.6 + Math.sin(t * 5.1) * 0.5;
        };
        return g;
      },
    },
  ],
};
