import * as THREE from 'three';
import { shelf, house, shed, torii, well, fence, grove, scatter, put, box, hill, mulberry } from './kit.js';

// ---------------------------------------------------------------------------
// My Neighbour Totoro.
//
// The window keeps the lamp, the camphor and the rain. Everything else in this
// film is somewhere you walk to: the house with the veranda, the hole at the
// foot of the tree, the shrine with the rope, and — far enough off across the
// fields to be nearly nothing — one lit window in a building nobody wants to
// think about.
//
// It rains here, which the region already handles: rain is in the air, not in
// these files. All these have to be is dark and quiet and specific.
// ---------------------------------------------------------------------------

export default {
  region: 'bus',
  pal: {
    turf: { color: '#2e3a2c', shadowTint: '#0e1410', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.55 },
    wood: { color: '#3a2e22', shadowTint: '#120e08', rim: 0.8, bands: 3, grain: 0.28, grainScale: 1.5 },
    wall: { color: '#6e6450', shadowTint: '#222018', rim: 0.9, bands: 3, grain: 0.2 },
    roof: { color: '#2a2e34', shadowTint: '#0d1014', rim: 1.2, bands: 3, grain: 0.16, side: THREE.DoubleSide },
    stone: { color: '#5a5850', shadowTint: '#1c1c1a', rim: 1.0, bands: 3, grain: 0.26, grainScale: 1.3, wrap: 0.55 },
    leaf: { color: '#26361f', shadowTint: '#0b1109', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.35, sway: 0.036, translucency: 0.5 },
    red: { color: '#8c2e26', shadowTint: '#2e0f10', rim: 1.4, bands: 3, grain: 0.2 },
    dark: { color: '#141312', shadowTint: '#060606', rim: 0.5, bands: 2, grain: 0.08 },
    water: { color: '#3a4450', shadowTint: '#141820', rim: 2.4, bands: 2, grain: 0.05 },
  },

  places: [
    // -----------------------------------------------------------------------
    {
      id: 'the-house',
      name: 'The house with the veranda',
      at: [520, -2300], r: 100, ground: 1.4,
      trail: { from: [70, -2420], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const C = [520, -2300];
        g.add(shelf(M, { r: 150, h: 1.5, mat: M.turf, seed: 5, rough: 0.2 }).translateX(C[0]).translateZ(C[1]));

        // Two buildings joined: the old Japanese half and the western room
        // stuck on the end, which is the whole joke of the place.
        const jp = house(M, {
          w: 13, d: 10, h: 3.6, roof: 'jp', roofH: 3.6, wall: M.wall,
          roofMat: M.roof, trim: M.wood, windows: 3, lit: 0.7, doorLit: false,
        });
        jp.position.set(C[0], 1.5, C[1]); jp.rotation.y = 1.6; g.add(jp);
        const west = house(M, {
          w: 8, d: 8, h: 5.4, storeys: 1, roof: 'gable', roofH: 2.8, wall: M.wall,
          roofMat: M.roof, trim: M.wood, windows: 2, lit: 1, doorLit: true,
        });
        west.position.set(C[0] - 2, 1.5, C[1] + 11); west.rotation.y = 1.6; g.add(west);

        // the veranda — a plank deck the length of the front, which is where
        // the whole family sits and where the film happens
        const deck = new THREE.Mesh(box(3.0, 0.3, 13), M.wood);
        deck.position.set(C[0] + 7.4, 2.5, C[1]); deck.rotation.y = 1.6 - Math.PI / 2;
        deck.rotation.y = 0; deck.position.set(C[0] + 0.4, 2.5, C[1] + 7.2); g.add(deck);
        for (let i = 0; i < 5; i++) {
          const p = new THREE.Mesh(box(0.16, 3.0, 0.16), M.wood);
          p.position.set(C[0] - 5.6 + i * 2.9, 4.0, C[1] + 8.4); g.add(p);
        }

        g.add(well(M, { r: 1.1, h: 1.0, mat: M.stone, wood: M.wood }).translateX(C[0] - 16).translateY(1.5).translateZ(C[1] + 14));

        // the tunnel of camellia you arrive through — two hedges close enough
        // to touch, and low enough to see over, which is the only reason the
        // house is visible at the end of it
        const hedge = [];
        for (let i = 0; i < 60; i++) {
          const s = 1.5 + (i % 3) * 0.3;
          hedge.push({ pos: [C[0] - 40 - i * 2.2, 1.5 + s / 2, C[1] + 24], scale: [2.4, s, 3.0] });
          hedge.push({ pos: [C[0] - 40 - i * 2.2, 1.5 + s / 2, C[1] + 32], scale: [2.4, s, 3.0] });
        }
        put(g, hedge, box(1, 1, 1), M.leaf);

        g.add(grove(M, { n: 340, at: C, inner: 110, r: 340, kind: 'broad', mat: M.leaf, h: 15, spread: 8, seed: 3 }));
        g.add(scatter(M, { n: 1100, at: C, r: 130, y: 1.5, mat: M.leaf, s: 1.0, seed: 8 }));
        return g;
      },
    },

    // -----------------------------------------------------------------------
    {
      id: 'camphor-foot',
      name: 'The foot of the camphor',
      at: [770, -2770], r: 110, ground: 1.4,
      trail: { from: [120, -2650], style: 'cut' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(1988);
        const C = [770, -2770];
        g.add(shelf(M, { r: 170, h: 1.4, mat: M.turf, seed: 9, rough: 0.22 }).translateX(C[0]).translateZ(C[1]));

        // The tree, from underneath. It has no top in frame and it should not
        // have one — what makes it enormous is that it leaves the picture.
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(9, 17, 120, 16), M.wood);
        trunk.position.set(C[0], 62, C[1]); g.add(trunk);
        const roots = [];
        for (let i = 0; i < 34; i++) {
          const a = (i / 34) * Math.PI * 2;
          const l = 16 + rnd() * 22;
          roots.push({
            pos: [C[0] + Math.cos(a) * 15, 3 + rnd() * 7, C[1] + Math.sin(a) * 15],
            rot: [Math.cos(a) * 0.8, -a, Math.sin(a) * 0.8 + 1.15],
            scale: [1.8 + rnd() * 1.4, l, 1.8 + rnd() * 1.4],
          });
        }
        put(g, roots, new THREE.CylinderGeometry(0.4, 0.85, 1, 7), M.wood);

        // the hollow: a dark hole between two roots, big enough to fall down
        const hole = new THREE.Mesh(new THREE.CircleGeometry(4.2, 16), M.dark);
        hole.rotation.x = -Math.PI / 2; hole.position.set(C[0] - 16, 1.55, C[1] + 12);
        hole.scale.set(1, 1, 1.5); g.add(hole);
        const lipItems = [];
        for (let i = 0; i < 26; i++) {
          const a = (i / 26) * Math.PI * 2;
          const s = 1.4 + rnd() * 1.2;
          lipItems.push({
            pos: [C[0] - 16 + Math.cos(a) * 4.6, 1.5, C[1] + 12 + Math.sin(a) * 6.4],
            rot: [0, rnd() * 6.28, 0], scale: [s, s * 0.7, s],
          });
        }
        put(g, lipItems, hill(1, 1, 3, { rough: 0.5, rings: 4, sectors: 8 }), M.wood);

        // the canopy, far overhead and closing everything in
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * Math.PI * 2;
          const b = new THREE.Mesh(new THREE.IcosahedronGeometry(40 + (i % 3) * 12, 1), M.leaf);
          b.position.set(C[0] + Math.cos(a) * 34, 118 + (i % 3) * 12, C[1] + Math.sin(a) * 34);
          b.scale.y = 0.55; g.add(b);
        }
        g.add(grove(M, { n: 620, at: C, inner: 60, r: 400, kind: 'broad', mat: M.leaf, h: 22, spread: 10, seed: 12 }));
        g.add(scatter(M, { n: 1600, at: C, r: 150, y: 1.5, mat: M.leaf, s: 1.2, seed: 15 }));
        return g;
      },
    },

    // -----------------------------------------------------------------------
    {
      id: 'fox-shrine',
      name: 'The shrine with the rope',
      at: [133, -3290], r: 74, ground: 1.4,
      trail: { from: [60, -3020], style: 'stones' },
      build: (M) => {
        const g = new THREE.Group();
        const C = [133, -3290];
        g.add(shelf(M, { r: 110, h: 1.5, mat: M.turf, seed: 13, rough: 0.24 }).translateX(C[0]).translateZ(C[1]));

        const t = torii(M, { w: 5.4, h: 6.4, mat: M.red, cap: M.dark });
        t.position.set(C[0] + 22, 1.5, C[1] + 20); t.rotation.y = 0.7; g.add(t);

        // the little building, and the rope across its front
        const s = house(M, {
          w: 4.6, d: 4.0, h: 2.6, roof: 'jp', roofH: 2.4, wall: M.wood, roofMat: M.roof,
          trim: M.wood, windows: 0, door: true, doorLit: false, doorW: 1.6, doorH: 1.9,
        });
        s.position.set(C[0], 2.4, C[1]); s.rotation.y = 0.7; g.add(s);
        const steps2 = new THREE.Mesh(box(5.4, 0.9, 1.6), M.stone);
        steps2.position.set(C[0] + Math.sin(0.7) * 2.6, 1.9, C[1] + Math.cos(0.7) * 2.6);
        steps2.rotation.y = 0.7; g.add(steps2);
        const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 4.4, 7), M.wall);
        rope.rotation.z = Math.PI / 2; rope.rotation.y = 0.7 + Math.PI / 2;
        rope.position.set(C[0] + Math.sin(0.7) * 2.3, 4.4, C[1] + Math.cos(0.7) * 2.3); g.add(rope);

        // the two stone animals, sitting, one either side
        for (const sx of [-1, 1]) {
          const f = new THREE.Group();
          f.position.set(C[0] + Math.cos(0.7) * sx * 4.2 + Math.sin(0.7) * 4.0, 1.5,
                         C[1] - Math.sin(0.7) * sx * 4.2 + Math.cos(0.7) * 4.0);
          f.rotation.y = 0.7;
          const base = new THREE.Mesh(box(1.3, 1.1, 1.3), M.stone);
          base.position.y = 0.55; f.add(base);
          const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), M.stone);
          body.scale.set(0.8, 1.1, 1.0); body.position.y = 1.6; f.add(body);
          const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6), M.stone);
          head.position.set(0, 2.35, 0.14); f.add(head);
          for (const ex of [-1, 1]) {
            const ear = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.34, 5), M.stone);
            ear.position.set(ex * 0.24, 2.68, 0.1); f.add(ear);
          }
          const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.17, 0.9, 6), M.stone);
          tail.position.set(0, 2.0, -0.6); tail.rotation.x = -0.7; f.add(tail);
          g.add(f);
        }

        g.add(grove(M, { n: 420, at: C, inner: 78, r: 320, kind: 'broad', mat: M.leaf, h: 20, spread: 9, seed: 21 }));
        return g;
      },
    },

    // -----------------------------------------------------------------------
    {
      id: 'rice-terraces',
      name: 'The flooded terraces',
      at: [900, -1900], r: 160, ground: 14,
      trail: { from: [140, -1990], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(64);
        const C = [900, -1900];

        // Seen from above, which is the only way the terraces read as terraces:
        // a stack of mirrors going down a hillside, each one a different shape.
        const base = new THREE.Mesh(hill(300, 26, 18, { rough: 0.24, rings: 12, sectors: 22 }), M.turf);
        base.position.set(C[0], -8, C[1]); g.add(base);
        for (let i = 0; i < 9; i++) {
          const r = 260 - i * 26;
          const y = -8 + 26 * Math.sqrt(Math.max(0, 1 - Math.pow(r / 300, 2)));
          const w = new THREE.Mesh(new THREE.CircleGeometry(r * 0.94, 26), M.water);
          w.rotation.x = -Math.PI / 2;
          w.position.set(C[0] + Math.sin(i * 1.7) * 12, y + 0.4, C[1] + Math.cos(i * 1.3) * 12);
          w.renderOrder = 3; g.add(w);
          const bund = new THREE.Mesh(new THREE.TorusGeometry(r * 0.96, 0.7, 5, 30), M.turf);
          bund.rotation.x = Math.PI / 2;
          bund.position.set(w.position.x, y + 0.3, w.position.z); g.add(bund);
        }
        // the green sticking out of the water
        const shoots = [];
        for (let i = 0; i < 3200; i++) {
          const a = rnd() * Math.PI * 2, d = Math.pow(rnd(), 0.5) * 250;
          const y = -8 + 26 * Math.sqrt(Math.max(0, 1 - Math.pow(d / 300, 2)));
          shoots.push({
            pos: [C[0] + Math.cos(a) * d, y + 0.5, C[1] + Math.sin(a) * d],
            rot: [0, rnd() * 6.28, 0], scale: [0.5, 0.7 + rnd() * 0.5, 0.5],
          });
        }
        put(g, shoots, new THREE.IcosahedronGeometry(1, 0), M.leaf);
        return g;
      },
    },

    // -----------------------------------------------------------------------
    {
      id: 'the-hospital',
      // Across the fields on the far side of the line, a long way out, so it is
      // one lit window in the haze and nothing more. It should never be
      // comfortable to look at.
      name: 'One window, across the fields',
      at: [-1080, -3400], r: 130, ground: 1.4,
      trail: { from: [-160, -3260], style: 'posts' },
      build: (M) => {
        const g = new THREE.Group();
        const C = [-1080, -3400];
        g.add(shelf(M, { r: 200, h: 1.4, mat: M.turf, seed: 2, rough: 0.18 }).translateX(C[0]).translateZ(C[1]));

        const b = house(M, {
          w: 44, d: 16, h: 6.5, storeys: 2, storeyH: 5.0, roof: 'gable', roofH: 4.0,
          wall: M.wall, roofMat: M.roof, trim: M.wood,
          windows: 9, lit: 0.06, winW: 1.2, winH: 1.8, door: true, doorLit: false,
        });
        b.position.set(C[0], 1.4, C[1]); b.rotation.y = 1.35; g.add(b);

        // the one that is on. It is on the upper floor, at the end, and it is
        // the only warm thing in this half of the country.
        const lit = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.9), M.warm(2.2, '#ffce8a'));
        lit.position.set(C[0] + Math.cos(1.35) * -14 + Math.sin(1.35) * 8.1, 12.2,
                         C[1] - Math.sin(1.35) * -14 + Math.cos(1.35) * 8.1);
        lit.rotation.y = 1.35; lit.renderOrder = 9; g.add(lit);

        g.add(fence(M, { len: 90, h: 1.2, mat: M.wood }).translateX(C[0] + 30).translateY(1.4).translateZ(C[1] + 20));
        g.add(grove(M, { n: 200, at: C, inner: 130, r: 340, kind: 'broad', mat: M.leaf, h: 14, spread: 7, seed: 44 }));
        return g;
      },
    },
  ],
};
