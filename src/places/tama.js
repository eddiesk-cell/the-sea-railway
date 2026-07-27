import * as THREE from 'three';
import { shelf, house, torii, fence, grove, scatter, put, box, hill, mulberry } from './kit.js';

// ---------------------------------------------------------------------------
// Pom Poko.
//
// The window keeps the wood and the line where it stops. Off it: the temple
// still standing in the last of the trees, the car park where the parade
// happened, the estate that was built instead, and the one hillside they left.
//
// The order matters. Walk them in the order you find them and the country
// tells you what happened without a word of it being written down.
// ---------------------------------------------------------------------------

export default {
  region: 'tama',
  pal: {
    turf: { color: '#5a6448', shadowTint: '#1e2218', rim: 0.5, bands: 3, grain: 0.22, grainScale: 0.55 },
    earth: { color: '#6e5c46', shadowTint: '#241e16', rim: 0.6, bands: 3, grain: 0.3, grainScale: 0.9 },
    wood: { color: '#5a4632', shadowTint: '#1e1710', rim: 0.8, bands: 3, grain: 0.28, grainScale: 1.5 },
    wall: { color: '#cec6b4', shadowTint: '#48453e', rim: 0.9, bands: 3, grain: 0.16 },
    roof: { color: '#5a5a60', shadowTint: '#1c1c20', rim: 1.1, bands: 3, grain: 0.14, side: THREE.DoubleSide },
    tile: { color: '#7a8a92', shadowTint: '#282e32', rim: 1.2, bands: 3, grain: 0.12, side: THREE.DoubleSide },
    leaf: { color: '#3e5a2c', shadowTint: '#131e0e', rim: 0.5, bands: 3, grain: 0.22, grainScale: 0.35, sway: 0.036, translucency: 0.7 },
    red: { color: '#9c3a2c', shadowTint: '#341210', rim: 1.4, bands: 3, grain: 0.16 },
    tarmac: { color: '#3e3e42', shadowTint: '#141416', rim: 1.4, bands: 2, grain: 0.1 },
  },

  places: [
    {
      id: 'the-temple',
      name: 'The temple in the last of the trees',
      at: [500, -1260], r: 95, ground: 1.6,
      trail: { from: [80, -1360], style: 'stones' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(1994);
        const C = [500, -1260];
        g.add(shelf(M, { r: 140, h: 1.6, mat: M.turf, seed: 4, rough: 0.2 }).translateX(C[0]).translateZ(C[1]));

        const h = house(M, {
          w: 14, d: 12, h: 4.4, roof: 'jp', roofH: 5.0, wall: M.wood, roofMat: M.tile,
          trim: M.red, windows: 2, lit: 0.5, door: true, doorW: 3.0, doorH: 3.2, base: M.wall,
        });
        h.position.set(C[0], 2.4, C[1]); h.rotation.y = 0.5; g.add(h);
        const t = torii(M, { w: 5.6, h: 6.6, mat: M.red, cap: M.wood });
        t.position.set(C[0] + Math.sin(0.5) * 26, 1.6, C[1] + Math.cos(0.5) * 26); t.rotation.y = 0.5; g.add(t);

        // the small shrine at the side, and the pair of animals on it that are
        // not lions and not dogs
        const box1 = new THREE.Mesh(box(1.8, 1.4, 1.6), M.wall);
        box1.position.set(C[0] - 12, 2.3, C[1] + 8); g.add(box1);
        for (const sx of [-1, 1]) {
          const b = new THREE.Group();
          b.position.set(C[0] - 12 + sx * 1.2, 3.0, C[1] + 8.2);
          const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6), M.wall);
          body.scale.set(0.9, 1.05, 0.9); b.add(body);
          const head = new THREE.Mesh(new THREE.SphereGeometry(0.30, 8, 6), M.wall);
          head.position.set(0, 0.5, 0.1); b.add(head);
          const belly = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6), M.wall);
          belly.position.set(0, -0.1, 0.28); b.add(belly);
          for (const ex of [-1, 1]) {
            const ear = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.2, 5), M.wall);
            ear.position.set(ex * 0.18, 0.72, 0.06); b.add(ear);
          }
          g.add(b);
        }
        const lanterns = [];
        for (let i = 0; i < 14; i++) {
          lanterns.push({ pos: [C[0] + (i % 2 ? 4 : -4), 2.4, C[1] + 10 + Math.floor(i / 2) * 4], scale: [0.5, 1.6, 0.5] });
        }
        put(g, lanterns, new THREE.CylinderGeometry(1, 1.2, 1, 7), M.wall);
        g.add(grove(M, { n: 520, at: C, inner: 92, r: 300, kind: 'broad', mat: M.leaf, h: 18, spread: 9, seed: 6 }));
        void rnd;
        return g;
      },
    },

    {
      id: 'the-car-park',
      name: 'Where the parade was',
      at: [760, -1700], r: 120, ground: 1.5,
      trail: { from: [130, -1580], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(31);
        const C = [760, -1700];
        g.add(shelf(M, { r: 190, h: 1.5, mat: M.tarmac, seed: 2, rough: 0.04 }).translateX(C[0]).translateZ(C[1]));

        // Painted bays, empty, at night. The most ordinary surface in the whole
        // world, standing where a wood was, which is the entire film.
        const lines = [];
        for (let row = 0; row < 8; row++) {
          for (let i = 0; i < 22; i++) {
            lines.push({ pos: [C[0] - 100 + i * 9.4, 1.56, C[1] - 90 + row * 26], scale: [0.2, 0.02, 11] });
          }
          lines.push({ pos: [C[0], 1.56, C[1] - 84.5 + row * 26], scale: [205, 0.02, 0.2] });
        }
        put(g, lines, box(1, 1, 1), M.wall);

        // four lamp standards, and only two of them working
        for (let i = 0; i < 4; i++) {
          const x = C[0] - 70 + i * 46, z = C[1] + 20;
          const p = new THREE.Mesh(box(0.4, 12, 0.4), M.roof);
          p.position.set(x, 7.5, z); g.add(p);
          const arm = new THREE.Mesh(box(2.4, 0.2, 0.2), M.roof);
          arm.position.set(x + 1.2, 13.4, z); g.add(arm);
          if (i % 2 === 0) {
            const l = new THREE.Mesh(box(1.4, 0.3, 0.6), M.warm(2.2, '#d8e0ff'));
            l.position.set(x + 2.2, 13.2, z); l.renderOrder = 9; g.add(l);
          }
        }
        // and the one thing left of the wood: a stump in the middle of a bay
        const st = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.7, 1.0, 10), M.wood);
        st.position.set(C[0] + 12, 2.0, C[1] - 30); g.add(st);
        g.add(fence(M, { len: 200, h: 1.4, mat: M.roof, rails: 2 }).translateX(C[0] + 108).translateY(1.5).translateZ(C[1]));
        void rnd;
        return g;
      },
    },

    {
      id: 'the-estate',
      name: 'The estate they built instead',
      at: [1000, -2200], r: 150, ground: 1.5,
      trail: { from: [170, -2080], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(77);
        const C = [1000, -2200];
        g.add(shelf(M, { r: 240, h: 1.5, mat: M.turf, seed: 9, rough: 0.08 }).translateX(C[0]).translateZ(C[1]));

        // Identical houses on a curved road, occupied, lit, and perfectly
        // pleasant. That is the point: it is not a villain, it is a suburb.
        for (let i = 0; i < 30; i++) {
          const a = -1.4 + (i / 30) * 2.8;
          const r = 90 + (i % 2) * 40;
          const h = house(M, {
            w: 8, d: 9, h: 3.4, storeys: 2, storeyH: 3.0, roof: 'gable', roofH: 2.4,
            wall: M.wall, roofMat: M.tile, trim: M.wood, windows: 2, lit: 0.45,
          });
          h.position.set(C[0] + Math.cos(a) * r, 1.5, C[1] + Math.sin(a) * r);
          h.rotation.y = -a + Math.PI / 2; g.add(h);
        }
        for (const r of [70, 110, 150]) {
          const road = new THREE.Mesh(new THREE.TorusGeometry(r, 4.0, 4, 40, 2.9), M.tarmac);
          road.rotation.x = Math.PI / 2; road.rotation.z = 1.4;
          road.position.set(C[0], 1.55, C[1]); road.scale.z = 0.02; g.add(road);
        }
        g.add(scatter(M, { n: 260, at: C, r: 200, y: 1.5, mat: M.leaf, s: 2.6, vary: 0.3, seed: 12 }));
        void rnd;
        return g;
      },
    },

    {
      id: 'the-one-hillside',
      name: 'The hillside they left',
      at: [640, -2560], r: 120, ground: 30,
      trail: { from: [110, -2440], style: 'cut' },
      build: (M) => {
        const g = new THREE.Group();
        const C = [640, -2560];
        const knoll = new THREE.Mesh(hill(210, 36, 6, { rough: 0.28, rings: 12, sectors: 22 }), M.turf);
        knoll.position.set(C[0], -4, C[1]); g.add(knoll);

        // Wood on top, cut earth all round the foot of it, and a wire fence at
        // the boundary. Small, and standing.
        g.add(grove(M, { n: 700, at: C, inner: 0, r: 130, kind: 'broad', mat: M.leaf, h: 17, spread: 9, seed: 21 }));
        g.add(scatter(M, { n: 1800, at: C, r: 150, y: 26, mat: M.leaf, s: 1.2, seed: 33 }));
        const scar = new THREE.Mesh(new THREE.TorusGeometry(190, 26, 5, 34), M.earth);
        scar.rotation.x = Math.PI / 2; scar.scale.z = 0.1;
        scar.position.set(C[0], 1.6, C[1]); g.add(scar);
        const posts = [];
        for (let i = 0; i < 70; i++) {
          const a = (i / 70) * Math.PI * 2;
          posts.push({ pos: [C[0] + Math.cos(a) * 172, 3.2, C[1] + Math.sin(a) * 172], scale: [0.16, 2.4, 0.16] });
        }
        put(g, posts, box(1, 1, 1), M.roof);
        return g;
      },
    },
  ],
};
