import * as THREE from 'three';
import { shelf, house, shed, torii, lantern, bridge, steps, fence, grove, scatter, put, box, hill, mulberry } from './kit.js';

// ---------------------------------------------------------------------------
// Spirited Away.
//
// The window keeps the bathhouse across the water and always will. What it
// cannot show you is the rest of the town: the shrine where the road stops
// being a road, the bridge and its gate, the sheds behind the kitchens, the
// boiler house under everything, and — a very long way off, at the end of the
// line — one lamp in a window with no bathhouse in sight.
//
// Zeniba's cottage is the furthest walk in this country on purpose. Getting
// there was the point of the train in the first place.
// ---------------------------------------------------------------------------

export default {
  region: 'sea',
  pal: {
    turf: { color: '#3e4a36', shadowTint: '#141a14', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.55 },
    wood: { color: '#4a3626', shadowTint: '#171009', rim: 0.8, bands: 3, grain: 0.28, grainScale: 1.5 },
    red: { color: '#a8302a', shadowTint: '#3a1020', rim: 1.5, bands: 3, grain: 0.2, grainScale: 1.4 },
    dark: { color: '#241018', shadowTint: '#0b0812', rim: 1.2, bands: 3, grain: 0.2 },
    stone: { color: '#6e6a60', shadowTint: '#24241f', rim: 0.9, bands: 3, grain: 0.26, grainScale: 1.3, wrap: 0.55 },
    wall: { color: '#8a7458', shadowTint: '#2c2418', rim: 0.8, bands: 3, grain: 0.22 },
    roof: { color: '#3a3038', shadowTint: '#131016', rim: 1.1, bands: 3, grain: 0.16, side: THREE.DoubleSide },
    leaf: { color: '#33482c', shadowTint: '#10170e', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.35, sway: 0.034, translucency: 0.6 },
  },

  places: [
    // -----------------------------------------------------------------------
    {
      id: 'frog-shrine',
      name: 'Where the road runs out',
      at: [430, -240], r: 80, ground: 1.4,
      trail: { from: [40, -60], style: 'stones' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(2001);
        const C = [430, -240];
        g.add(shelf(M, { r: 120, h: 1.5, mat: M.turf, seed: 2, rough: 0.24 }).translateX(C[0]).translateZ(C[1]));

        // A hundred little stone houses, most of them leaning, none of them
        // more than knee high. They are the first thing in the film that tells
        // you the road you are on stopped being ordinary some way back.
        const items = [];
        for (let i = 0; i < 130; i++) {
          const a = rnd() * Math.PI * 2, d = Math.pow(rnd(), 0.55) * 78;
          const s = 0.5 + rnd() * 0.9;
          items.push({
            pos: [C[0] + Math.cos(a) * d, 1.5, C[1] + Math.sin(a) * d],
            rot: [(rnd() - 0.5) * 0.16, rnd() * 6.28, (rnd() - 0.5) * 0.18],
            scale: [s, s * (0.9 + rnd() * 0.7), s * 0.85],
          });
        }
        put(g, items, box(1, 1, 1), M.stone);
        const roofs = items.map(it => ({
          pos: [it.pos[0], it.pos[1] + it.scale[1] * 0.55, it.pos[2]],
          rot: [it.rot[0], it.rot[1] + Math.PI / 4, it.rot[2]],
          scale: [it.scale[0] * 0.9, it.scale[0] * 0.5, it.scale[0] * 0.9],
        }));
        put(g, roofs, new THREE.ConeGeometry(1, 1, 4, 1), M.stone);

        // the one that is bigger than the others, half sunk
        const big = new THREE.Mesh(box(3.0, 3.4, 2.6), M.stone);
        big.position.set(C[0] - 12, 2.4, C[1] + 18); big.rotation.set(0.14, 0.5, -0.09); g.add(big);
        const bigRoof = new THREE.Mesh(new THREE.ConeGeometry(2.7, 1.5, 4, 1), M.stone);
        bigRoof.position.set(C[0] - 12, 4.4, C[1] + 18); bigRoof.rotation.set(0.14, 0.5 + Math.PI / 4, -0.09); g.add(bigRoof);

        const t = torii(M, { w: 6, h: 7.2, mat: M.red, cap: M.dark });
        t.position.set(C[0] - 52, 1.5, C[1] + 44); t.rotation.y = 0.4; g.add(t);
        g.add(grove(M, { n: 300, at: C, inner: 100, r: 330, kind: 'broad', mat: M.leaf, h: 14, spread: 7, seed: 9 }));
        g.add(scatter(M, { n: 900, at: C, r: 110, y: 1.5, mat: M.turf, s: 1.1, seed: 14 }));
        return g;
      },
    },

    // -----------------------------------------------------------------------
    {
      id: 'red-bridge',
      // Behind the bathhouse from the line, so the headline picture is not
      // touched — you only find it by going round the far side.
      name: 'The bridge and the gate',
      at: [-448, -318], r: 95, ground: 1.4,
      trail: { from: [-300, -60], style: 'lanterns' },
      build: (M) => {
        const g = new THREE.Group();
        const C = [-448, -318];
        g.add(shelf(M, { r: 130, h: 1.5, mat: M.turf, seed: 8, rough: 0.2 }).translateX(C[0]).translateZ(C[1]));

        const b = bridge(M, { span: 46, w: 6.4, arch: 4.2, mat: M.red, rail: true });
        b.position.set(C[0], 2.0, C[1]); b.rotation.y = 0.5; g.add(b);
        // the lamps along it, which are the only reason it reads at dusk
        for (let i = 0; i < 8; i++) {
          const t = (i + 0.5) / 8;
          for (const sx of [-1, 1]) {
            const l = lantern(M, { h: 2.4, stone: false, lit: true, mat: M.dark });
            const z = -23 + t * 46;
            l.position.set(C[0] + Math.cos(0.5) * sx * 3.4 - Math.sin(0.5) * z,
                           2.0 + Math.sin(t * Math.PI) * 4.2 + 0.5,
                           C[1] + Math.sin(0.5) * sx * 3.4 + Math.cos(0.5) * z);
            g.add(l);
          }
        }

        // the gate at the end of it: a wall with a tiled hood and one dark way
        const gate = new THREE.Group();
        gate.position.set(C[0] - 12, 1.5, C[1] - 26); gate.rotation.y = 0.5;
        for (const sx of [-1, 1]) {
          const p = new THREE.Mesh(box(2.2, 9, 2.2), M.red);
          p.position.set(sx * 5.6, 4.5, 0); gate.add(p);
        }
        const hood = new THREE.Mesh(box(16, 1.1, 4.2), M.roof);
        hood.position.y = 9.6; gate.add(hood);
        const lint = new THREE.Mesh(box(13, 1.4, 1.6), M.dark);
        hood.position.y = 9.6; lint.position.y = 8.4; gate.add(lint);
        const way = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 8.0), M.dark);
        way.position.set(0, 4.0, 0.1); gate.add(way);
        g.add(gate);
        return g;
      },
    },

    // -----------------------------------------------------------------------
    {
      id: 'boiler-house',
      name: 'The boiler house',
      at: [-406, -104], r: 76, ground: 1.4,
      trail: { from: [-250, 30], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(6);
        const C = [-406, -104];
        g.add(shelf(M, { r: 110, h: 1.5, mat: M.turf, seed: 11, rough: 0.2 }).translateX(C[0]).translateZ(C[1]));

        // Low, wide, and mostly chimney. Everything above the ground floor of
        // the bathhouse is somebody else's problem.
        const b = new THREE.Mesh(box(30, 9, 20), M.wall);
        b.position.set(C[0], 6.0, C[1]); b.rotation.y = 0.3; g.add(b);
        const r = new THREE.Mesh(box(33, 1.2, 23), M.roof);
        r.position.set(C[0], 11.1, C[1]); r.rotation.y = 0.3; g.add(r);
        for (let i = 0; i < 3; i++) {
          const st = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.5, 16, 8), M.stone);
          st.position.set(C[0] - 8 + i * 8, 19, C[1] - 4); g.add(st);
        }

        // the wall of drawers — a hundred of them, and it is the only thing
        // anybody remembers about this room
        const drawers = [];
        for (let row = 0; row < 9; row++) {
          for (let col = 0; col < 14; col++) {
            drawers.push({
              pos: [C[0] - 11.2 + col * 1.72 + Math.sin(0.3) * 0, 2.4 + row * 0.86, C[1] + 9.9],
              rot: [0, 0.3, 0], scale: [1.5, 0.72, 0.5],
            });
          }
        }
        put(g, drawers, box(1, 1, 1), M.wood);

        // and the fire under all of it
        const mouth = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 2.4), M.warm(3.6, '#ff8a2e'));
        mouth.position.set(C[0] + 12, 3.0, C[1] + 6.5); mouth.rotation.y = 0.3;
        mouth.renderOrder = 9; g.add(mouth);

        // coal, in heaps, and the small black things that carry it
        const soot = [];
        for (let i = 0; i < 220; i++) {
          const a = rnd() * Math.PI * 2, d = 18 + rnd() * 40;
          const s = 0.35 + rnd() * 0.5;
          soot.push({
            pos: [C[0] + Math.cos(a) * d, 1.5 + s * 0.5, C[1] + Math.sin(a) * d],
            rot: [0, rnd() * 6.28, 0], scale: [s, s, s],
          });
        }
        put(g, soot, new THREE.IcosahedronGeometry(1, 0), M.dark);
        g.userData.update = (t) => {
          mouth.material.uniforms.uStrength.value = 3.0 + Math.sin(t * 2.1) * 0.7;
        };
        return g;
      },
    },

    // -----------------------------------------------------------------------
    {
      id: 'pig-sheds',
      name: 'The sheds behind the kitchens',
      at: [660, -790], r: 95, ground: 1.4,
      trail: { from: [120, -520], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(77);
        const C = [660, -790];
        g.add(shelf(M, { r: 140, h: 1.5, mat: M.turf, seed: 17, rough: 0.2 }).translateX(C[0]).translateZ(C[1]));

        for (let i = 0; i < 7; i++) {
          const s = shed(M, { w: 11, d: 22, h: 4.6, mat: M.wood, roofMat: M.roof, open: false });
          s.position.set(C[0] - 30 + (i % 2) * 34, 1.5, C[1] - 60 + i * 20);
          s.rotation.y = 0.1 + (i % 2) * 0.06;
          g.add(s);
          // one lit slot each, low down, and steam off the roofs
          const slit = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 0.7), M.warm(1.6, '#ffb066'));
          slit.position.set(s.position.x, 2.6, s.position.z + 11.2);
          slit.renderOrder = 8; g.add(slit);
        }
        g.add(fence(M, { len: 120, h: 1.4, mat: M.wood, rails: 2 }).translateX(C[0] + 46).translateY(1.5).translateZ(C[1] - 10));

        // troughs, and the ground churned to mud round them
        const troughs = [];
        for (let i = 0; i < 12; i++) {
          troughs.push({
            pos: [C[0] - 10 + rnd() * 50, 1.7, C[1] - 60 + rnd() * 120],
            rot: [0, rnd() * 6.28, 0], scale: [1.2, 0.4, 4.0],
          });
        }
        put(g, troughs, box(1, 1, 1), M.wood);
        g.add(scatter(M, { n: 320, at: C, r: 120, y: 1.52, mat: M.dark, s: 2.4, vary: 0.9, seed: 31, flat: true }));
        return g;
      },
    },

    // -----------------------------------------------------------------------
    {
      id: 'zeniba',
      name: "The cottage at the end of the line",
      at: [880, -1060], r: 105, ground: 1.4,
      trail: { from: [200, -940], style: 'posts' },
      build: (M) => {
        const g = new THREE.Group();
        const C = [880, -1060];
        g.add(shelf(M, { r: 150, h: 1.4, mat: M.turf, seed: 3, rough: 0.26 }).translateX(C[0]).translateZ(C[1]));

        // One small house with one lit window, and nothing else within sight —
        // which after the bathhouse is the entire point of it.
        const h = house(M, {
          w: 9.5, d: 8, h: 4.2, roof: 'thatch', roofH: 4.4,
          wall: M.wall, roofMat: M.roof, trim: M.wood,
          windows: 2, lit: 1, doorLit: true, doorW: 1.3, doorH: 2.3,
        });
        h.position.set(C[0], 1.4, C[1]); h.rotation.y = 1.9; g.add(h);
        const stack = new THREE.Mesh(box(1.4, 5.4, 1.4), M.stone);
        stack.position.set(C[0] + 4.2, 6.4, C[1] - 2.0); g.add(stack);

        // the garden: rows, a bench, a line of poles with something drying
        const rows = [];
        for (let i = 0; i < 9; i++) {
          rows.push({ pos: [C[0] - 16 - i * 2.4, 1.55, C[1] + 6], rot: [0, 0.2, 0], scale: [1.6, 0.3, 22] });
        }
        put(g, rows, box(1, 1, 1), M.wood);
        g.add(scatter(M, { n: 700, at: [C[0] - 26, C[1] + 6], r: 16, y: 1.7, mat: M.leaf, s: 1.0, seed: 44 }));
        g.add(fence(M, { len: 44, h: 1.1, mat: M.wood }).translateX(C[0] - 44).translateY(1.4).translateZ(C[1] + 6));

        // a single lamp on a pole by the door — the thing you actually walk to
        const l = lantern(M, { h: 3.0, stone: false, lit: true, mat: M.wood });
        l.position.set(C[0] - 7.5, 1.4, C[1] + 3.4); g.add(l);

        // trees a long way off, so the cottage stands in the open
        g.add(grove(M, { n: 240, at: C, inner: 200, r: 480, kind: 'broad', mat: M.leaf, h: 13, spread: 7, seed: 21 }));
        return g;
      },
    },
  ],
};
