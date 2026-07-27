import * as THREE from 'three';
import { shelf, house, shed, wall, fence, steps, grove, scatter, put, trail, box, hill, mulberry } from './kit.js';

// ---------------------------------------------------------------------------
// Princess Mononoke — the human side.
//
// The window keeps the walled works burning on its lake. What is missing from
// that picture is everything the town costs: the floor where the women work the
// bellows all night, the hill it has eaten, and the village at the other end of
// the world that Ashitaka rode away from and never got back to.
//
// The village is deliberately the furthest place in this country from the
// station. It should feel a long way from Iron Town, because it is.
// ---------------------------------------------------------------------------

export default {
  region: 'iron',
  pal: {
    turf: { color: '#3a4234', shadowTint: '#141813', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.55 },
    earth: { color: '#4b4038', shadowTint: '#181310', rim: 0.6, bands: 3, grain: 0.3, grainScale: 0.9 },
    wood: { color: '#4c3b2c', shadowTint: '#181209', rim: 0.8, bands: 3, grain: 0.28, grainScale: 1.6 },
    dark: { color: '#231b16', shadowTint: '#0a0806', rim: 0.7, bands: 3, grain: 0.2 },
    stone: { color: '#5e5a52', shadowTint: '#1c1b1a', rim: 0.9, bands: 3, grain: 0.26, grainScale: 1.3, wrap: 0.55 },
    thatch: { color: '#6b5a3a', shadowTint: '#241d12', rim: 0.7, bands: 3, grain: 0.32, grainScale: 0.7 },
    leaf: { color: '#33452c', shadowTint: '#10170e', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.35, sway: 0.03, translucency: 0.5 },
    iron: { color: '#403c3a', shadowTint: '#141212', rim: 1.4, bands: 3, grain: 0.14 },
    wall: { color: '#7c6a52', shadowTint: '#2a2318', rim: 0.8, bands: 3, grain: 0.22 },
  },

  places: [
    // -----------------------------------------------------------------------
    {
      id: 'bellows-floor',
      name: 'The bellows floor',
      at: [430, -1180], r: 90, ground: 1.5,
      trail: { from: [60, -1290], style: 'posts' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(1997);
        const C = [430, -1180];
        g.add(shelf(M, { r: 150, h: 1.5, mat: M.earth, seed: 6, rough: 0.14 }).translateX(C[0]).translateZ(C[1]));

        // A long open hall. Only the furnace end is lit, so the far end of it
        // goes away into the dark the way a real shed does.
        const hall = shed(M, { w: 26, d: 52, h: 8.5, mat: M.wood, roofMat: M.dark });
        hall.position.set(C[0], 1.5, C[1]); hall.rotation.y = 0.2; g.add(hall);
        for (let i = 0; i < 7; i++) {
          const p = new THREE.Mesh(box(0.7, 8.5, 0.7), M.wood);
          p.position.set(C[0] - 10 + (i % 2) * 20, 5.7, C[1] - 22 + i * 7.4); g.add(p);
        }

        // the furnace: the only light for a mile, and it should be small
        const fur = new THREE.Mesh(box(9, 6.5, 9), M.stone);
        fur.position.set(C[0] + 2, 4.7, C[1] - 21); g.add(fur);
        const mouth = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.0), M.warm(4.2, '#ff9038'));
        mouth.position.set(C[0] + 2, 3.8, C[1] - 16.4); mouth.renderOrder = 9; g.add(mouth);
        const flue = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.5, 9, 8), M.stone);
        flue.position.set(C[0] + 2, 12, C[1] - 21); g.add(flue);

        // the treadles: two long beams and a row of foot-boards, the machine
        // that the whole town actually runs on
        const beams = [], boards = [];
        for (const sx of [-1, 1]) {
          beams.push({ pos: [C[0] + sx * 6.5, 2.3, C[1] + 6], scale: [1.1, 0.5, 34] });
          for (let i = 0; i < 10; i++) {
            boards.push({
              pos: [C[0] + sx * 6.5, 2.75 + Math.sin(i * 1.3) * 0.12, C[1] - 8 + i * 3.2],
              rot: [Math.sin(i * 1.3) * 0.08, 0, 0], scale: [2.4, 0.16, 2.2],
            });
          }
        }
        put(g, beams, box(1, 1, 1), M.wood);
        put(g, boards, box(1, 1, 1), M.wood);

        // sacks, tools, and iron in bars
        const bars = [];
        for (let i = 0; i < 40; i++) {
          bars.push({
            pos: [C[0] + 14 + rnd() * 9, 1.7 + (i % 5) * 0.16, C[1] + 12 + rnd() * 20],
            rot: [0, rnd() * 0.4, 0], scale: [0.5, 0.14, 2.6],
          });
        }
        put(g, bars, box(1, 1, 1), M.iron);
        g.add(scatter(M, { n: 120, at: [C[0] + 20, C[1] + 30], r: 26, y: 1.5, mat: M.wood, s: 1.1, seed: 3 }));

        g.userData.update = (t, near) => {
          // the fire breathes with the treadles, and only where you can hear it
          mouth.material.uniforms.uStrength.value = 3.4 + Math.sin(t * 1.6) * 0.5 + near * 1.4;
        };
        return g;
      },
    },

    // -----------------------------------------------------------------------
    {
      id: 'stripped-hill',
      name: 'The stripped hill',
      at: [720, -1880], r: 130, ground: 22,
      trail: { from: [110, -1760], style: 'cut' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(88);
        const C = [720, -1880];

        const hillMesh = new THREE.Mesh(hill(230, 26, 14, { rough: 0.3, rings: 14, sectors: 24 }), M.earth);
        hillMesh.position.set(C[0], -3, C[1]); g.add(hillMesh);

        // Stumps. Thousands would be honest and unreadable; two hundred, all
        // cut at the same height, reads as a hillside that was taken.
        const stumps = [];
        for (let i = 0; i < 240; i++) {
          const a = rnd() * Math.PI * 2, d = Math.pow(rnd(), 0.6) * 210;
          const x = C[0] + Math.cos(a) * d, z = C[1] + Math.sin(a) * d;
          const dd = Math.hypot(x - C[0], z - C[1]) / 230;
          const y = -3 + 26 * Math.sqrt(Math.max(0, 1 - dd * dd));
          const s = 0.8 + rnd() * 1.4;
          stumps.push({ pos: [x, y - 0.4, z], rot: [0, rnd() * 6.28, 0], scale: [s, s * 1.1, s] });
        }
        put(g, stumps, new THREE.CylinderGeometry(1, 1.25, 1, 8), M.wood);
        g.add(scatter(M, { n: 700, at: C, r: 200, y: 20, mat: M.turf, s: 1.2, seed: 41 }));

        // the wood that is left, at the bottom, on one side only
        g.add(grove(M, { n: 320, at: [C[0] + 300, C[1] + 190], inner: 0, r: 200, kind: 'pine', mat: M.leaf, h: 26, spread: 9, seed: 5 }));
        return g;
      },
    },

    // -----------------------------------------------------------------------
    {
      id: 'ashitaka-village',
      name: "Ashitaka's village",
      at: [1080, -2380], r: 150, ground: 4.5,
      trail: { from: [140, -2260], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(1136);
        const C = [1080, -2380];

        // Terraces up a shoulder of hill. The village is ABOVE its fields,
        // which is what a place that expects to be attacked looks like.
        for (let i = 0; i < 5; i++) {
          const t = new THREE.Mesh(hill(180 - i * 26, 3.2 + i * 1.6, 30 + i, { rough: 0.22, rings: 6, sectors: 20 }), i < 3 ? M.turf : M.earth);
          t.position.set(C[0], -0.6 + i * 0.9, C[1]); g.add(t);
        }

        // the palisade, and it does not go all the way round — it faces the way
        // trouble comes from, which is the road
        const posts = [];
        for (let i = 0; i < 90; i++) {
          const a = -1.9 + (i / 90) * 3.4;
          posts.push({
            pos: [C[0] + Math.cos(a) * 120, 6.4, C[1] + Math.sin(a) * 120],
            rot: [(rnd() - 0.5) * 0.05, 0, (rnd() - 0.5) * 0.05], scale: [1.0, 5.4, 1.0],
          });
        }
        put(g, posts, new THREE.CylinderGeometry(0.5, 0.6, 1, 6), M.wood);

        // the watchtower
        {
          const t = new THREE.Group();
          t.position.set(C[0] - 96, 4.4, C[1] + 62);
          for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
            const l = new THREE.Mesh(box(0.5, 13, 0.5), M.wood);
            l.position.set(sx * 2.0, 6.5, sz * 2.0); t.add(l);
          }
          const deck = new THREE.Mesh(box(6.4, 0.4, 6.4), M.wood);
          deck.position.y = 13; t.add(deck);
          const roof = new THREE.Mesh(new THREE.ConeGeometry(5.6, 2.6, 4, 1), M.thatch);
          roof.rotation.y = Math.PI / 4; roof.position.y = 15.6; t.add(roof);
          g.add(t);
        }

        // the houses: low, thatched, and turned in on a common yard
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * Math.PI * 2 + 0.3;
          const d = 34 + (i % 3) * 22;
          const h = house(M, {
            w: 7 + rnd() * 3, d: 9 + rnd() * 3, h: 3.2, roof: 'thatch', roofH: 3.6,
            wall: M.wall, roofMat: M.thatch, trim: M.wood,
            windows: 1, lit: i % 3 === 0 ? 1 : 0, doorLit: i === 0,
          });
          h.position.set(C[0] + Math.cos(a) * d, 4.4 + (d > 50 ? -0.9 : 0), C[1] + Math.sin(a) * d);
          h.rotation.y = -a + Math.PI / 2;
          g.add(h);
        }
        // the big one in the middle, where the old woman reads the stones
        const hall = house(M, {
          w: 13, d: 17, h: 4.0, roof: 'thatch', roofH: 5.0,
          wall: M.wall, roofMat: M.thatch, trim: M.wood, windows: 2, lit: 1, doorLit: true,
        });
        hall.position.set(C[0] + 4, 4.4, C[1] - 6); hall.rotation.y = 0.4; g.add(hall);

        // a rack of drying grain, a cart, and the steps down to the fields
        g.add(fence(M, { len: 26, h: 2.2, mat: M.wood, rails: 3 }).translateX(C[0] + 46).translateY(4.4).translateZ(C[1] - 40));
        const st = steps(M, { n: 16, w: 3.4, rise: 0.4, run: 1.1, mat: M.stone });
        st.position.set(C[0] - 118, -1.2, C[1] - 6); st.rotation.y = -Math.PI / 2; g.add(st);

        g.add(scatter(M, { n: 1400, at: C, r: 175, y: 4.4, mat: M.turf, s: 1.3, seed: 7 }));
        g.add(grove(M, { n: 420, at: C, inner: 210, r: 460, kind: 'pine', mat: M.leaf, h: 24, spread: 8, seed: 12 }));
        return g;
      },
    },
  ],
};
