import * as THREE from 'three';
import { shelf, house, shed, torii, lantern, bridge, steps, fence, grove, scatter, put, box, hill, mulberry, barrel, crate, pot, bench, wall } from './kit.js';

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
      at: [-363, -233], r: 95, ground: 1.4,
      trail: { from: [-300, -60], style: 'lanterns' },
      build: (M) => {
        const g = new THREE.Group();
        const C = [-363, -233];
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
      at: [580, -651], r: 95, ground: 1.4,
      trail: { from: [120, -520], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(77);
        const C = [580, -651];
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
      at: [455, -946], r: 105, ground: 1.4,
      trail: { from: [200, -940], style: 'posts' },
      build: (M) => {
        const g = new THREE.Group();
        const C = [455, -946];
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

    // -----------------------------------------------------------------------
    {
      id: 'stalls',
      name: 'The street that eats',
      // On the +x side, where the window cannot see it — and clear of the
      // wooded shoulder behind the bathhouse, which the first placement sat
      // squarely inside: the street was built twenty-six metres under a hill,
      // with that hill's whole forest hanging in the sky above the awnings.
      at: [430, -620], r: 120, ground: 1.4,
      trail: { from: [60, -470], style: 'lanterns' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(3011);
        const C = [430, -620];
        g.add(shelf(M, { r: 165, h: 1.5, mat: M.stone, seed: 6, rough: 0.14 }).translateX(C[0]).translateZ(C[1]));

        // The street the parents ate in. It matters that it is a STREET and
        // not a market square: two unbroken walls of shopfronts with a gap of
        // paving between them, running away from you further than you can see
        // the end of. That length is the whole unease — a town laid out to
        // feed a crowd, and the crowd has not come.
        const LEN = 15, GAP = 15.5;
        for (let side = 0; side < 2; side++) {
          const sx = side ? 1 : -1;
          for (let i = 0; i < LEN; i++) {
            const z = C[1] - 96 + i * 13.5;
            const w = 9.5 + rnd() * 2.6;
            const h = house(M, {
              w, d: 8.5, h: 3.6, storeys: rnd() < 0.4 ? 2 : 1, storeyH: 2.9,
              roof: 'jp', roofH: 2.2,
              wall: M.wall, roofMat: M.roof, trim: M.wood,
              windows: 2, lit: rnd() < 0.75 ? 2 : 0, doorW: 2.6, doorH: 2.4, doorLit: true,
            });
            h.position.set(C[0] + sx * GAP, 1.5, z);
            h.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
            g.add(h);

            // the counter under the awning, and what is heaped on it. Every
            // shop is open, every shop is lit, every shop is serving, and
            // there is nobody behind any of them.
            const counter = new THREE.Mesh(box(1.6, 1.0, w * 0.78), M.wood);
            counter.position.set(C[0] + sx * (GAP - 5.6), 2.0, z); g.add(counter);
            const heap = [];
            for (let k = 0; k < 22; k++) {
              const s = 0.22 + rnd() * 0.30;
              heap.push({
                pos: [C[0] + sx * (GAP - 5.6) + (rnd() - 0.5) * 1.2,
                      2.55 + rnd() * 0.34,
                      z + (rnd() - 0.5) * w * 0.72],
                rot: [rnd(), rnd() * 6.28, rnd()],
                scale: [s, s * (0.6 + rnd() * 0.7), s],
              });
            }
            put(g, heap, new THREE.SphereGeometry(1, 6, 5), rnd() < 0.5 ? M.cloth : M.wood);

            // an awning out over the paving, and a lamp under it
            const awn = new THREE.Mesh(box(4.6, 0.12, w * 0.92), M.cloth);
            awn.position.set(C[0] + sx * (GAP - 4.4), 3.9, z);
            awn.rotation.z = sx * 0.10; g.add(awn);
            if (rnd() < 0.8) {
              const l = lantern(M, { h: 1.5, stone: false, lit: true, mat: M.red });
              l.position.set(C[0] + sx * (GAP - 6.6), 3.0, z + 2.2); g.add(l);
            }
          }
        }

        // barrels and crates stacked down the middle, and the smell of it
        for (let i = 0; i < 26; i++) {
          const z = C[1] - 92 + rnd() * 190;
          const o = (rnd() - 0.5) * 9;
          const thing = rnd() < 0.55 ? barrel(M, { r: 0.42, h: 1.05 }) : crate(M, { s: 0.9 });
          thing.position.set(C[0] + o, 1.5, z);
          thing.rotation.y = rnd() * 6.28; g.add(thing);
        }
        // a red gate at the near end, so you know when you have entered
        const t = torii(M, { w: 9, h: 8.5, mat: M.red, cap: M.dark });
        t.position.set(C[0], 1.5, C[1] - 108); g.add(t);
        g.add(scatter(M, { n: 260, at: C, r: 150, y: 1.52, mat: M.leaf, s: 1.4, seed: 77 }));
        return g;
      },
    },

    // -----------------------------------------------------------------------
    {
      id: 'pens',
      name: 'The pens',
      at: [-150, -640], r: 70, ground: 1.4,
      trail: { from: [-60, -520], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(3017);
        const C = [-150, -640];
        g.add(shelf(M, { r: 96, h: 1.45, mat: M.turf, seed: 8, rough: 0.2 }).translateX(C[0]).translateZ(C[1]));

        // Where they keep the ones who ate. It is a working yard and nothing
        // more — low pens, a feed store, a trough down the middle — and it is
        // the most frightening thing in this country precisely because it is
        // so ordinary. Nothing here is drawn as horror. It is a farm.
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 3; c++) {
            const x = C[0] - 26 + c * 22, z = C[1] - 24 + r * 17;
            g.add(fence(M, { len: 18, h: 1.15, mat: M.wood }).translateX(x - 9).translateY(1.45).translateZ(z - 6));
            g.add(fence(M, { len: 18, h: 1.15, mat: M.wood }).translateX(x - 9).translateY(1.45).translateZ(z + 6));
            const sh = shed(M, { w: 7, d: 4.4, h: 2.5, mat: M.wood, roofMat: M.roof, open: true });
            sh.position.set(x, 1.45, z - 2); sh.rotation.y = Math.PI; g.add(sh);
            const trough = new THREE.Mesh(box(9, 0.5, 1.1), M.wood);
            trough.position.set(x, 1.7, z + 3.4); g.add(trough);
          }
        }
        const store = house(M, {
          w: 12, d: 8, h: 4.4, roof: 'gable', roofH: 3.0,
          wall: M.wood, roofMat: M.roof, trim: M.dark,
          windows: 1, lit: 1, doorW: 3.2, doorH: 3.0,
        });
        store.position.set(C[0] + 42, 1.45, C[1] + 6); store.rotation.y = -1.6; g.add(store);
        for (let i = 0; i < 14; i++) {
          const b = barrel(M, { r: 0.5, h: 1.2 });
          b.position.set(C[0] + 34 + (rnd() - 0.5) * 8, 1.45, C[1] + 16 + (rnd() - 0.5) * 10);
          g.add(b);
        }
        const l = lantern(M, { h: 3.4, stone: false, lit: true, mat: M.dark });
        l.position.set(C[0] + 30, 1.45, C[1] - 12); g.add(l);
        g.add(grove(M, { n: 160, at: C, inner: 110, r: 300, kind: 'broad', mat: M.leaf, h: 11, seed: 12 }));
        return g;
      },
    },

    // -----------------------------------------------------------------------
    {
      id: 'halt',
      name: 'The halt in the water',
      at: [250, -1480], r: 90, ground: 0.35,
      trail: { from: [40, -1300], style: 'posts' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(3023);
        const C = [250, -1480];

        // A platform standing in open water with the line running through it,
        // one bench, one lamp, one sign with nothing written on it — the stop
        // where you get off for the cottage. There is no station building and
        // no way back on foot, which is the point: this is a place you can
        // only be brought to and only be collected from.
        const deck = new THREE.Mesh(box(6.5, 0.7, 44), M.wood);
        deck.position.set(C[0], 0.35, C[1]); g.add(deck);
        const edge = new THREE.Mesh(box(7.4, 0.16, 44), M.stone);
        edge.position.set(C[0], 0.74, C[1]); g.add(edge);
        // the piles it stands on, going down into the water
        const piles = [];
        for (let i = 0; i < 26; i++) {
          piles.push({
            pos: [C[0] + (i % 2 ? 2.6 : -2.6), -1.4, C[1] - 21 + Math.floor(i / 2) * 3.3],
            scale: [0.34, 3.6, 0.34],
          });
        }
        put(g, piles, box(1, 1, 1), M.wood);

        const b = bench(M, { len: 2.4, mat: M.wood });
        b.position.set(C[0] - 1.4, 0.82, C[1] + 4); b.rotation.y = Math.PI / 2; g.add(b);
        const l = lantern(M, { h: 3.2, stone: false, lit: true, mat: M.dark });
        l.position.set(C[0] + 1.8, 0.82, C[1] - 6); g.add(l);
        // the nameboard, blank
        const postA = new THREE.Mesh(box(0.14, 2.2, 0.14), M.wood);
        postA.position.set(C[0] - 2.2, 1.9, C[1] - 14); g.add(postA);
        const sign = new THREE.Mesh(box(0.08, 0.6, 2.6), M.wall);
        sign.position.set(C[0] - 2.2, 2.7, C[1] - 14); g.add(sign);

        // reeds standing out of the shallow water round the platform, which is
        // the only thing telling you how deep it is
        for (let i = 0; i < 260; i++) {
          const a = rnd() * Math.PI * 2, d = 8 + Math.pow(rnd(), 0.6) * 70;
          const x = C[0] + Math.cos(a) * d, z = C[1] + Math.sin(a) * d * 1.6;
          const hh = 0.9 + rnd() * 1.5;
          const r = new THREE.Mesh(box(0.05, hh, 0.05), M.leaf);
          r.position.set(x, hh * 0.5, z);
          r.rotation.set((rnd() - 0.5) * 0.3, rnd() * 6.28, (rnd() - 0.5) * 0.3);
          g.add(r);
        }
        return g;
      },
    },
  ],
};
