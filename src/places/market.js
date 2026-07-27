import * as THREE from 'three';
import { shelf, house, steps, grove, scatter, put, box, hill, mulberry } from './kit.js';

// ---------------------------------------------------------------------------
// Howl's Moving Castle — the town half.
//
// The window keeps the hill town, the bunting and the tram. Off it: the hat
// shop and the workroom behind it, the alley where the street is steepest, and
// the palace across the valley — absurdly large, and it should stay absurd.
// ---------------------------------------------------------------------------

export default {
  region: 'market',
  pal: {
    turf: { color: '#5e7440', shadowTint: '#1e2818', rim: 0.5, bands: 3, grain: 0.22, grainScale: 0.55 },
    wall: { color: '#dccfae', shadowTint: '#4e483a', rim: 0.9, bands: 3, grain: 0.16 },
    wall2: { color: '#c8a880', shadowTint: '#463a2a', rim: 0.9, bands: 3, grain: 0.18 },
    roof: { color: '#8a4c38', shadowTint: '#2e1812', rim: 1.0, bands: 3, grain: 0.16, side: THREE.DoubleSide },
    wood: { color: '#54402c', shadowTint: '#1c140c', rim: 0.8, bands: 3, grain: 0.28, grainScale: 1.6 },
    stone: { color: '#a09a8c', shadowTint: '#34322c', rim: 0.9, bands: 3, grain: 0.22, grainScale: 1.3, wrap: 0.55 },
    leaf: { color: '#4a6c32', shadowTint: '#16220e', rim: 0.5, bands: 3, grain: 0.22, grainScale: 0.35, sway: 0.036, translucency: 0.8 },
    cloth: { color: '#c05a48', shadowTint: '#421c16', rim: 1.0, bands: 2, grain: 0.12, side: THREE.DoubleSide, sway: 0.05 },
    gilt: { color: '#c8a44a', shadowTint: '#4a3c18', rim: 1.8, bands: 2, grain: 0.08 },
  },

  places: [
    {
      id: 'the-hat-shop',
      name: 'The hat shop',
      at: [500, -1240], r: 90, ground: 1.5,
      trail: { from: [80, -1330], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(2004);
        const C = [500, -1240];
        g.add(shelf(M, { r: 150, h: 1.5, mat: M.stone, seed: 6, rough: 0.08 }).translateX(C[0]).translateZ(C[1]));

        // A street of narrow fronts, and one of them has a bay window with hats
        // in it. The workroom is behind, and it is bigger than the shop.
        for (const sx of [-1, 1]) {
          for (let i = 0; i < 8; i++) {
            const h = house(M, {
              w: 7 + (i % 3), d: 12, h: 4.4, storeys: 2 + (i % 2), storeyH: 3.4,
              roof: 'gable', roofH: 2.6, wall: i % 2 ? M.wall : M.wall2, roofMat: M.roof,
              trim: M.wood, windows: 2, lit: 0.3,
            });
            h.position.set(C[0] + sx * 12, 1.5, C[1] - 40 + i * 11);
            h.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2; g.add(h);
          }
        }
        const shop = house(M, {
          w: 10, d: 14, h: 4.6, storeys: 2, storeyH: 3.6, roof: 'gable', roofH: 3.0,
          wall: M.wall, roofMat: M.roof, trim: M.wood, windows: 2, lit: 1, doorLit: true,
        });
        shop.position.set(C[0] - 12, 1.5, C[1] + 4); shop.rotation.y = Math.PI / 2; g.add(shop);
        const bay = new THREE.Mesh(box(2.0, 3.0, 5.0), M.wood);
        bay.position.set(C[0] - 6.2, 3.4, C[1] + 4); g.add(bay);
        const glass = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.4), M.warm(1.4, '#ffdca8'));
        glass.position.set(C[0] - 5.1, 3.6, C[1] + 4); glass.rotation.y = -Math.PI / 2;
        glass.renderOrder = 9; g.add(glass);
        // the hats: cones and discs on stands, in the window and on the wall
        const hats = [];
        for (let i = 0; i < 22; i++) {
          hats.push({
            pos: [C[0] - 6.6, 2.6 + (i % 4) * 1.1, C[1] + 1.6 + Math.floor(i / 4) * 0.9],
            rot: [0, rnd() * 6.28, 0], scale: [0.6 + rnd() * 0.3, 0.4, 0.6 + rnd() * 0.3],
          });
        }
        put(g, hats, new THREE.ConeGeometry(1, 1, 10, 1), M.cloth);
        // the workroom behind: a long table, a stove, and a great deal of felt
        const table = new THREE.Mesh(box(2.4, 0.2, 8.0), M.wood);
        table.position.set(C[0] - 20, 2.6, C[1] + 4); g.add(table);
        const stove = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.2, 2.4, 10), M.wood);
        stove.position.set(C[0] - 24, 2.7, C[1] - 2); g.add(stove);
        const fire = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.8), M.warm(2.8, '#ff9c46'));
        fire.position.set(C[0] - 23.0, 2.4, C[1] - 2); fire.rotation.y = -Math.PI / 2;
        fire.renderOrder = 9; g.add(fire);
        return g;
      },
    },

    {
      id: 'the-steep-alley',
      name: 'Where the street is steepest',
      at: [780, -1760], r: 90, ground: 22,
      trail: { from: [130, -1650], style: 'stones' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(11);
        const C = [780, -1760];
        const slope = new THREE.Mesh(hill(200, 34, 7, { rough: 0.2, rings: 12, sectors: 22 }), M.turf);
        slope.position.set(C[0] + 40, -4, C[1]); g.add(slope);

        const TH = -0.7, RISE = 0.36, RUN = 0.8;
        const FX = C[0] - 70, FZ = C[1] + 20;
        const on = (side, along) => [
          FX + side * Math.cos(TH) + along * Math.sin(TH),
          FZ - side * Math.sin(TH) + along * Math.cos(TH),
        ];
        const st = steps(M, { n: 70, w: 3.4, rise: RISE, run: RUN, mat: M.stone });
        st.position.set(FX, 1.5, FZ); st.rotation.y = TH; g.add(st);

        // houses on both sides, close enough to touch across the top of it
        for (let i = 0; i < 12; i++) {
          const along = 6 + i * 4.4;
          for (const side of [-5.2, 5.2]) {
            const [x, z] = on(side, along);
            const h = house(M, {
              w: 6, d: 6.5, h: 3.8, storeys: 2 + (i % 2), storeyH: 3.0, roof: 'gable',
              roofH: 2.2, wall: i % 2 ? M.wall : M.wall2, roofMat: M.roof, trim: M.wood,
              windows: 1, lit: 0.35,
            });
            h.position.set(x, 1.5 + RISE * (along / RUN), z);
            h.rotation.y = TH + (side > 0 ? -Math.PI / 2 : Math.PI / 2); g.add(h);
          }
        }
        // bunting strung across, corner to corner
        const flags = [];
        for (let i = 0; i < 40; i++) {
          const along = 8 + i * 1.3;
          const [x, z] = on((i % 8 - 4) * 1.3, along);
          flags.push({ pos: [x, 1.5 + RISE * (along / RUN) + 7.5, z], rot: [0, TH, 0], scale: [0.8, 0.6, 0.06] });
        }
        put(g, flags, box(1, 1, 1), M.cloth);
        void rnd;
        return g;
      },
    },

    {
      id: 'the-palace',
      name: 'The palace, across the valley',
      at: [1180, -2280], r: 190, ground: 34,
      trail: { from: [200, -2160], style: 'posts' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(55);
        const C = [1180, -2280];
        const mound = new THREE.Mesh(hill(340, 46, 17, { rough: 0.18, rings: 14, sectors: 24 }), M.turf);
        mound.position.set(C[0], -6, C[1]); g.add(mound);

        // Absurd on purpose: a front three hundred metres wide, a dome, and a
        // flight of steps you could land an aircraft on.
        const front = new THREE.Mesh(box(300, 44, 40), M.wall);
        front.position.set(C[0], 56, C[1]); g.add(front);
        const dome = new THREE.Mesh(new THREE.SphereGeometry(46, 22, 12, 0, 6.28, 0, 1.3), M.gilt);
        dome.position.set(C[0], 78, C[1]); g.add(dome);
        const spire = new THREE.Mesh(new THREE.ConeGeometry(8, 34, 10), M.gilt);
        spire.position.set(C[0], 122, C[1]); g.add(spire);
        for (let i = 0; i < 9; i++) {
          const t = new THREE.Mesh(new THREE.CylinderGeometry(9, 11, 62, 10), M.wall);
          t.position.set(C[0] - 140 + i * 35, 65, C[1] + 22); g.add(t);
          const c = new THREE.Mesh(new THREE.ConeGeometry(12, 20, 10), M.roof);
          c.position.set(C[0] - 140 + i * 35, 106, C[1] + 22); g.add(c);
        }
        const st = steps(M, { n: 40, w: 90, rise: 0.9, run: 3.0, mat: M.stone });
        st.position.set(C[0], -2, C[1] + 42); g.add(st);
        const wins = [];
        for (let i = 0; i < 120; i++) {
          wins.push({
            pos: [C[0] - 145 + rnd() * 290, 40 + rnd() * 30, C[1] + 20.4],
            rot: [0, 0, 0], scale: [1, 1, 1],
          });
        }
        put(g, wins, new THREE.PlaneGeometry(2.4, 4.4), M.warm(1.2, '#ffe2ae'), 9);
        return g;
      },
    },
  ],
};
