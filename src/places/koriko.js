import * as THREE from 'three';
import { shelf, house, shed, fence, steps, grove, scatter, put, box, hill, mulberry } from './kit.js';

// ---------------------------------------------------------------------------
// Kiki's Delivery Service.
//
// The window keeps the town stacked up to its clock tower. Off it: the bakery
// with the flat above and the window over the street, the roofs seen from the
// one place high enough to see them all, the pine on the cliff over the sea,
// and — a long way behind the hill, in the trees — a cabin with a painting in
// it that is not finished.
// ---------------------------------------------------------------------------

export default {
  region: 'koriko',
  pal: {
    turf: { color: '#54683c', shadowTint: '#1c2618', rim: 0.5, bands: 3, grain: 0.22, grainScale: 0.55 },
    wood: { color: '#6b5236', shadowTint: '#241a10', rim: 0.8, bands: 3, grain: 0.28, grainScale: 1.5 },
    wall: { color: '#d2c4a2', shadowTint: '#4a4436', rim: 0.9, bands: 3, grain: 0.18 },
    roof: { color: '#9c5540', shadowTint: '#341c16', rim: 1.1, bands: 3, grain: 0.16, side: THREE.DoubleSide },
    stone: { color: '#9e968a', shadowTint: '#33312c', rim: 0.9, bands: 3, grain: 0.24, grainScale: 1.3, wrap: 0.55 },
    leaf: { color: '#3e5c30', shadowTint: '#131e10', rim: 0.5, bands: 3, grain: 0.22, grainScale: 0.35, sway: 0.038, translucency: 0.7 },
    dark: { color: '#2a2018', shadowTint: '#0c0906', rim: 0.7, bands: 2, grain: 0.1 },
    iron: { color: '#4e4a46', shadowTint: '#161514', rim: 1.4, bands: 3, grain: 0.14 },
  },

  places: [
    {
      id: 'the-bakery',
      name: 'The bakery, and the window over the street',
      at: [480, -1250], r: 92, ground: 1.6,
      trail: { from: [80, -1340], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const C = [480, -1250];
        g.add(shelf(M, { r: 150, h: 1.6, mat: M.stone, seed: 5, rough: 0.1 }).translateX(C[0]).translateZ(C[1]));

        // A street: two rows of fronts close enough that the sky between them
        // is a strip. The bakery is the one with the light on downstairs.
        for (const sx of [-1, 1]) {
          for (let i = 0; i < 9; i++) {
            const h = house(M, {
              w: 8 + (i % 3) * 1.4, d: 10, h: 4.4, storeys: 2 + (i % 2), storeyH: 3.4,
              roof: 'gable', roofH: 2.8, wall: M.wall, roofMat: M.roof, trim: M.wood,
              windows: 3, lit: 0.35, doorLit: false,
            });
            h.position.set(C[0] + sx * 11, 1.6, C[1] - 44 + i * 11);
            h.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
            g.add(h);
          }
        }
        // the shop front itself, and the flat above with its own window
        const b = house(M, {
          w: 12, d: 12, h: 4.6, storeys: 2, storeyH: 3.6, roof: 'gable', roofH: 3.0,
          wall: M.wall, roofMat: M.roof, trim: M.wood, windows: 3, lit: 1, doorLit: true,
          winW: 1.6, winH: 1.9,
        });
        b.position.set(C[0] - 12, 1.6, C[1] + 4); b.rotation.y = Math.PI / 2; g.add(b);
        const awn = new THREE.Mesh(box(0.2, 0.1, 9), M.roof);
        awn.position.set(C[0] - 5.6, 4.6, C[1] + 4); awn.rotation.z = 0.24; g.add(awn);
        // the round window at the top, which is the one she looks out of
        const round = new THREE.Mesh(new THREE.CircleGeometry(1.0, 14), M.warm(1.8, '#ffd49a'));
        round.position.set(C[0] - 5.9, 11.4, C[1] + 4); round.rotation.y = Math.PI / 2;
        round.renderOrder = 9; g.add(round);
        const surround = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.14, 5, 16), M.wood);
        surround.position.set(C[0] - 5.95, 11.4, C[1] + 4); surround.rotation.y = Math.PI / 2; g.add(surround);
        return g;
      },
    },

    {
      id: 'the-roofs',
      name: 'The roofs, from the top',
      at: [760, -900], r: 120, ground: 46,
      trail: { from: [120, -1080], style: 'stones' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(1989);
        const C = [760, -900];
        const knoll = new THREE.Mesh(hill(240, 54, 9, { rough: 0.26, rings: 14, sectors: 24 }), M.turf);
        knoll.position.set(C[0], -8, C[1]); g.add(knoll);

        // A gallery railing and nothing else up here — the place IS the view,
        // and the view is a hundred roofs going down the far side.
        const rail = [];
        for (let i = 0; i < 40; i++) {
          const a = -1.6 + (i / 40) * 3.2;
          rail.push({ pos: [C[0] + Math.cos(a) * 22, 47.5, C[1] + Math.sin(a) * 22], scale: [0.14, 1.1, 0.14] });
        }
        put(g, rail, box(1, 1, 1), M.iron);

        const roofs = [], walls = [];
        for (let i = 0; i < 260; i++) {
          const a = -1.5 + rnd() * 2.9, d = 60 + Math.pow(rnd(), 0.7) * 320;
          const x = C[0] + Math.cos(a) * d, z = C[1] + Math.sin(a) * d;
          const dd = d / 300;
          const y = Math.max(1.6, -8 + 54 * Math.sqrt(Math.max(0, 1 - dd * dd)));
          const w = 7 + rnd() * 6, h = 5 + rnd() * 7, dp = 7 + rnd() * 6;
          const ry = rnd() * 0.6;
          walls.push({ pos: [x, y + h / 2 - 1, z], rot: [0, ry, 0], scale: [w, h, dp] });
          roofs.push({ pos: [x, y + h - 1, z], rot: [0, ry + Math.PI / 4, 0], scale: [(w + dp) * 0.4, 3.4, (w + dp) * 0.4] });
        }
        put(g, walls, box(1, 1, 1), M.wall);
        put(g, roofs, new THREE.ConeGeometry(1, 1, 4, 1), M.roof);
        return g;
      },
    },

    {
      id: 'ursula-cabin',
      name: 'The cabin in the woods',
      at: [900, -1980], r: 100, ground: 8,
      trail: { from: [150, -1840], style: 'cut' },
      build: (M) => {
        const g = new THREE.Group();
        const C = [900, -1980];
        g.add(shelf(M, { r: 170, h: 9.0, mat: M.turf, seed: 15, rough: 0.3 }).translateX(C[0]).translateZ(C[1]));

        const h = house(M, {
          w: 9, d: 8, h: 3.8, roof: 'gable', roofH: 3.2, wall: M.wood, roofMat: M.roof,
          trim: M.wood, windows: 2, lit: 1, doorLit: true,
        });
        h.position.set(C[0], 8.5, C[1]); h.rotation.y = 2.4; g.add(h);
        const stack = new THREE.Mesh(box(1.0, 4.4, 1.0), M.stone);
        stack.position.set(C[0] + 3.6, 11.5, C[1] - 1.6); g.add(stack);

        // the big north light: one entire wall is glass, because she paints
        const win = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.0), M.warm(1.5, '#ffdcae'));
        win.position.set(C[0] + Math.sin(2.4) * 4.1, 10.4, C[1] + Math.cos(2.4) * 4.1);
        win.rotation.y = 2.4; win.renderOrder = 9; g.add(win);

        // firewood, a washing line, and a canvas leaning outside
        const logs = [];
        for (let i = 0; i < 40; i++) {
          logs.push({
            pos: [C[0] - 9 + (i % 8) * 0.42, 8.7 + Math.floor(i / 8) * 0.42, C[1] + 6],
            rot: [Math.PI / 2, 0, 0], scale: [0.4, 1.4, 0.4],
          });
        }
        put(g, logs, new THREE.CylinderGeometry(0.5, 0.5, 1, 7), M.wood);
        const canvas = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.0), M.wall);
        canvas.position.set(C[0] - 6, 10.0, C[1] + 2.6); canvas.rotation.set(0.15, 0.8, 0); g.add(canvas);

        g.add(grove(M, { n: 700, at: C, inner: 96, r: 420, kind: 'pine', mat: M.leaf, h: 22, spread: 8, seed: 44 }));
        g.add(scatter(M, { n: 1200, at: C, r: 140, y: 8.6, mat: M.leaf, s: 1.1, seed: 51 }));
        return g;
      },
    },

    {
      id: 'cliff-pine',
      name: 'The pine on the cliff',
      at: [620, -2300], r: 90, ground: 36,
      trail: { from: [110, -2180], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const C = [620, -2300];
        const cliff = new THREE.Mesh(hill(150, 44, 22, { rough: 0.36, rings: 12, sectors: 20 }), M.turf);
        cliff.position.set(C[0] - 30, -6, C[1]); g.add(cliff);
        // the drop: a slab with its face to the sea
        const face = new THREE.Mesh(box(70, 46, 12), M.stone);
        face.position.set(C[0] + 62, 14, C[1]); face.rotation.z = 0.08; g.add(face);

        // One tree, leaning the way the wind has always come from.
        const t = new THREE.Group();
        t.position.set(C[0], 36, C[1]); t.rotation.z = 0.22;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.1, 13, 9), M.wood);
        trunk.position.y = 6.5; t.add(trunk);
        for (let i = 0; i < 5; i++) {
          const b = new THREE.Mesh(new THREE.IcosahedronGeometry(3.6 - i * 0.3, 1), M.leaf);
          b.position.set(-1.4 + i * 1.4, 11.5 + (i % 2) * 1.6, ((i * 5) % 3 - 1) * 1.8);
          b.scale.y = 0.42; t.add(b);
        }
        g.add(t);
        g.add(scatter(M, { n: 1400, at: C, r: 120, y: 35, mat: M.turf, s: 1.0, seed: 61 }));
        return g;
      },
    },
  ],
};
