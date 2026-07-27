import * as THREE from 'three';
import { shelf, house, shed, boat, fence, steps, grove, scatter, put, box, hill, mulberry } from './kit.js';

// ---------------------------------------------------------------------------
// From Up on Poppy Hill.
//
// The window keeps the boarding house and the signal flags. Off it: the Latin
// Quarter clubhouse — three floors of dust, paper and argument — the tug's
// berth down on the water, and the long flight of steps up from the harbour
// that the whole film is really about walking.
// ---------------------------------------------------------------------------

export default {
  region: 'poppy',
  pal: {
    turf: { color: '#5a7040', shadowTint: '#1e2a18', rim: 0.5, bands: 3, grain: 0.22, grainScale: 0.55 },
    wood: { color: '#6a5236', shadowTint: '#241a10', rim: 0.8, bands: 3, grain: 0.28, grainScale: 1.5 },
    wall: { color: '#c8bc9c', shadowTint: '#464034', rim: 0.9, bands: 3, grain: 0.18 },
    roof: { color: '#4a4a52', shadowTint: '#181a1e', rim: 1.1, bands: 3, grain: 0.16, side: THREE.DoubleSide },
    stone: { color: '#9a948a', shadowTint: '#32302c', rim: 0.9, bands: 3, grain: 0.24, grainScale: 1.3, wrap: 0.55 },
    leaf: { color: '#42642e', shadowTint: '#14200e', rim: 0.5, bands: 3, grain: 0.22, grainScale: 0.35, sway: 0.038, translucency: 0.7 },
    water: { color: '#1c4050', shadowTint: '#08161e', rim: 2.2, bands: 2, grain: 0.05 },
    iron: { color: '#4e4e50', shadowTint: '#161618', rim: 1.4, bands: 3, grain: 0.14 },
    flag: { color: '#d8c86a', shadowTint: '#4e4a24', rim: 1.2, bands: 2, grain: 0.1, side: THREE.DoubleSide, sway: 0.06 },
  },

  places: [
    {
      id: 'clubhouse',
      name: 'The Latin Quarter',
      at: [520, -1300], r: 100, ground: 1.5,
      trail: { from: [80, -1380], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(1963);
        const C = [520, -1300];
        g.add(shelf(M, { r: 160, h: 1.5, mat: M.turf, seed: 5, rough: 0.18 }).translateX(C[0]).translateZ(C[1]));

        // Three floors of dark wood, every window a different age, and a
        // glass lantern on the roof that is the only thing anybody cleans.
        const b = house(M, {
          w: 22, d: 16, h: 5.0, storeys: 3, storeyH: 4.2, roof: 'gable', roofH: 3.4,
          wall: M.wood, roofMat: M.roof, trim: M.wall, windows: 6, lit: 0.55, winW: 1.3, winH: 1.8,
          doorLit: true, base: M.stone,
        });
        b.position.set(C[0], 1.5, C[1]); b.rotation.y = 1.35; g.add(b);
        // the skylight, up top and lit from underneath
        const cupola = new THREE.Mesh(box(5.0, 3.0, 5.0), M.wood);
        cupola.position.set(C[0], 22.5, C[1]); cupola.rotation.y = 1.35; g.add(cupola);
        const glass = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.4), M.warm(1.9, '#ffd9a2'));
        glass.position.set(C[0] + Math.sin(1.35) * 2.6, 22.5, C[1] + Math.cos(1.35) * 2.6);
        glass.rotation.y = 1.35; glass.renderOrder = 9; g.add(glass);
        const lid = new THREE.Mesh(new THREE.ConeGeometry(4.4, 1.8, 4, 1), M.roof);
        lid.rotation.y = Math.PI / 4 + 1.35; lid.position.set(C[0], 24.8, C[1]); g.add(lid);

        // the outside stair, the bicycles, and a great deal of stacked paper
        const st = steps(M, { n: 14, w: 1.8, rise: 0.42, run: 0.8, mat: M.wood });
        st.position.set(C[0] + 12, 1.5, C[1] - 8); st.rotation.y = 1.35; g.add(st);
        const stacks = [];
        for (let i = 0; i < 60; i++) {
          stacks.push({
            pos: [C[0] - 16 + rnd() * 10, 1.6 + (i % 6) * 0.28, C[1] - 14 + rnd() * 26],
            rot: [0, rnd() * 0.6, 0], scale: [0.9, 0.26, 1.2],
          });
        }
        put(g, stacks, box(1, 1, 1), M.wall);
        g.add(scatter(M, { n: 900, at: C, r: 140, y: 1.5, mat: M.leaf, s: 1.0, seed: 11 }));
        g.add(grove(M, { n: 200, at: C, inner: 100, r: 300, kind: 'broad', mat: M.leaf, h: 14, spread: 8, seed: 21 }));
        return g;
      },
    },

    {
      id: 'tug-berth',
      name: "The tug's berth",
      at: [780, -1800], r: 110, ground: 1.4,
      trail: { from: [130, -1660], style: 'stones' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(9);
        const C = [780, -1800];
        g.add(shelf(M, { r: 150, h: 1.4, mat: M.turf, seed: 3, rough: 0.16 }).translateX(C[0] - 60).translateZ(C[1]));

        const basin = new THREE.Mesh(new THREE.CircleGeometry(120, 34), M.water);
        basin.rotation.x = -Math.PI / 2; basin.position.set(C[0] + 40, 1.2, C[1]);
        basin.renderOrder = 4; g.add(basin);
        const quay = new THREE.Mesh(box(16, 2.2, 130), M.stone);
        quay.position.set(C[0] - 48, 1.1, C[1]); g.add(quay);
        // bollards, because a quay without them is a pavement
        const bol = [];
        for (let i = 0; i < 11; i++) bol.push({ pos: [C[0] - 41, 2.5, C[1] - 55 + i * 11], scale: [0.5, 0.8, 0.5] });
        put(g, bol, new THREE.CylinderGeometry(1, 1.2, 1, 8), M.iron);

        // the tug: squat, high in the bow, one stack, and far too much fender
        const t = new THREE.Group();
        t.position.set(C[0] - 26, 1.0, C[1] + 6); t.rotation.y = 0.06;
        const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 8, 0, 6.28, Math.PI * 0.5, Math.PI * 0.5), M.roof);
        hull.scale.set(3.2, 2.4, 10); hull.position.y = 2.4; t.add(hull);
        const deck = new THREE.Mesh(box(6.2, 0.4, 19), M.wood);
        deck.position.y = 2.6; t.add(deck);
        const house1 = new THREE.Mesh(box(4.6, 3.2, 6.0), M.wall);
        house1.position.set(0, 4.4, -1); t.add(house1);
        const wheel = new THREE.Mesh(box(3.4, 2.2, 3.4), M.wall);
        wheel.position.set(0, 7.1, -1); t.add(wheel);
        const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.95, 4.0, 10), M.iron);
        stack.position.set(0, 8.4, -4); t.add(stack);
        for (let i = 0; i < 8; i++) {
          const f = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.18, 5, 10), M.iron);
          f.rotation.y = Math.PI / 2;
          f.position.set(3.2, 2.2, -8 + i * 2.2); t.add(f);
        }
        g.add(t);

        // and the flags on their halyard, which is how the two of them talked
        const mast = new THREE.Mesh(box(0.2, 14, 0.2), M.wood);
        mast.position.set(C[0] - 46, 9.2, C[1] - 40); g.add(mast);
        for (let i = 0; i < 5; i++) {
          const f = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.0), M.flag);
          f.position.set(C[0] - 45 + i * 0.9, 14.2 - i * 2.0, C[1] - 40 + rnd());
          f.rotation.y = 0.4; g.add(f);
        }
        return g;
      },
    },

    {
      id: 'harbour-steps',
      name: 'The steps up from the harbour',
      at: [430, -2140], r: 96, ground: 20,
      trail: { from: [90, -2050], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const C = [430, -2140];
        const slope = new THREE.Mesh(hill(210, 30, 7, { rough: 0.24, rings: 12, sectors: 22 }), M.turf);
        slope.position.set(C[0] + 40, -4, C[1]); g.add(slope);

        // Ninety steps in one run, with a rail on one side and houses crowding
        // the other, so from the bottom you cannot see the top.
        const TH = -0.55, RISE = 0.34, RUN = 0.9;
        const FX = C[0] - 66, FZ = C[1] + 30;      // the foot of the flight
        // where a point (sideways, along) on the stair lands in the world
        const on = (side, along) => [
          FX + side * Math.cos(TH) + along * Math.sin(TH),
          FZ - side * Math.sin(TH) + along * Math.cos(TH),
        ];
        const st = steps(M, { n: 88, w: 4.4, rise: RISE, run: RUN, mat: M.stone });
        st.position.set(FX, 1.4, FZ); st.rotation.y = TH; g.add(st);

        const rail = [];
        for (let i = 0; i < 44; i++) {
          const [x, z] = on(-2.6, RUN * (i * 2 + 1));
          rail.push({ pos: [x, 1.4 + RISE * (i * 2 + 1) + 0.5, z], scale: [0.14, 1.0, 0.14] });
        }
        put(g, rail, box(1, 1, 1), M.iron);

        for (let i = 0; i < 8; i++) {
          const h = house(M, {
            w: 7 + (i % 3), d: 7, h: 3.8, storeys: i % 2 ? 2 : 1, storeyH: 3.0, roof: 'gable',
            roofH: 2.4, wall: M.wall, roofMat: M.roof, trim: M.wood, windows: 2, lit: 0.2,
          });
          const along = 8 + i * 9.6;
          const [x, z] = on(9.5, along);
          h.position.set(x, 1.4 + RISE * (along / RUN), z);
          h.rotation.y = TH - Math.PI / 2; g.add(h);
        }
        g.add(scatter(M, { n: 1200, at: C, r: 170, y: 18, mat: M.leaf, s: 1.0, seed: 31 }));
        return g;
      },
    },
  ],
};
