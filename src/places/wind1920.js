import * as THREE from 'three';
import { shelf, house, shed, fence, bench, grove, scatter, put, box, hill, mulberry } from './kit.js';

// ---------------------------------------------------------------------------
// The Wind Rises.
//
// The window keeps the grass, the easel and the glider. Off it: the hangar at
// the edge of the field with its doors open, the hotel in the mountains with
// the veranda, and the dream field — where the aircraft are wrong and beautiful
// and go on to the horizon.
// ---------------------------------------------------------------------------

export default {
  region: 'wind1920',
  pal: {
    turf: { color: '#6a8442', shadowTint: '#22301a', rim: 0.5, bands: 3, grain: 0.22, grainScale: 0.55 },
    wall: { color: '#d4cbb0', shadowTint: '#4a463a', rim: 0.9, bands: 3, grain: 0.16 },
    roof: { color: '#5a4a3c', shadowTint: '#1e1814', rim: 1.0, bands: 3, grain: 0.16, side: THREE.DoubleSide },
    wood: { color: '#6e5638', shadowTint: '#241c12', rim: 0.8, bands: 3, grain: 0.28, grainScale: 1.6 },
    iron: { color: '#77787c', shadowTint: '#26272a', rim: 1.6, bands: 3, grain: 0.12 },
    canvas: { color: '#e2dcc6', shadowTint: '#5e5a4e', rim: 1.3, bands: 2, grain: 0.1, side: THREE.DoubleSide },
    leaf: { color: '#4e7034', shadowTint: '#182410', rim: 0.5, bands: 3, grain: 0.22, grainScale: 0.35, sway: 0.05, translucency: 0.9 },
    stone: { color: '#9a9488', shadowTint: '#32302c', rim: 0.9, bands: 3, grain: 0.22, grainScale: 1.2, wrap: 0.55 },
  },

  places: [
    {
      id: 'the-hangar',
      name: 'The hangar',
      at: [500, -1240], r: 100, ground: 1.5,
      trail: { from: [80, -1330], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(1920);
        const C = [500, -1240];
        g.add(shelf(M, { r: 170, h: 1.5, mat: M.turf, seed: 4, rough: 0.08 }).translateX(C[0]).translateZ(C[1]));

        // A long shed with the whole end open, and one aeroplane half out of
        // it. The doors matter more than the building: an open hangar is an
        // invitation and a shut one is a wall.
        const s = shed(M, { w: 34, d: 46, h: 13, mat: M.wall, roofMat: M.iron });
        s.position.set(C[0], 1.5, C[1]); s.rotation.y = Math.PI; g.add(s);
        for (const sx of [-1, 1]) {
          const d = new THREE.Mesh(box(11, 12, 0.4), M.iron);
          d.position.set(C[0] + sx * 14, 7.5, C[1] + 23); d.rotation.y = sx * 0.7; g.add(d);
        }
        for (let i = 0; i < 5; i++) {
          const t = new THREE.Mesh(new THREE.TorusGeometry(17, 0.5, 6, 16, Math.PI), M.iron);
          t.position.set(C[0], 1.5, C[1] - 20 + i * 11); g.add(t);
        }

        // the aeroplane: a monoplane, a big radial, and struts everywhere
        const p = new THREE.Group();
        p.position.set(C[0], 3.4, C[1] + 12); p.rotation.y = 0.1;
        const fus = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.5, 9.0, 12), M.canvas);
        fus.rotation.x = Math.PI / 2; p.add(fus);
        const wing = new THREE.Mesh(box(13.0, 0.28, 2.2), M.canvas);
        wing.position.set(0, -0.2, 0.6); p.add(wing);
        const tail = new THREE.Mesh(box(4.0, 0.2, 1.2), M.canvas);
        tail.position.set(0, 0.2, -4.0); p.add(tail);
        const fin = new THREE.Mesh(box(0.2, 1.6, 1.4), M.canvas);
        fin.position.set(0, 1.0, -4.2); p.add(fin);
        const eng = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.0, 1.0, 14), M.iron);
        eng.rotation.x = Math.PI / 2; eng.position.set(0, 0, 4.6); p.add(eng);
        const prop = new THREE.Mesh(box(0.16, 5.4, 0.34), M.wood);
        prop.position.set(0, 0, 5.2); p.add(prop);
        for (const sx of [-1, 1]) {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.4, 6), M.iron);
          leg.position.set(sx * 1.6, -1.4, 1.6); leg.rotation.z = sx * 0.4; p.add(leg);
          const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.22, 12), M.iron);
          wheel.rotation.z = Math.PI / 2; wheel.position.set(sx * 2.1, -2.4, 1.6); p.add(wheel);
        }
        g.add(p);
        g.userData.update = (t) => { prop.rotation.z = t * 0.6; };

        // trestles, drums, and a wing on its own outside
        const stuff = [];
        for (let i = 0; i < 30; i++) {
          stuff.push({
            pos: [C[0] - 30 + rnd() * 60, 2.0, C[1] + 30 + rnd() * 30],
            rot: [0, rnd() * 6.28, 0], scale: [0.8 + rnd(), 1.0, 0.8 + rnd()],
          });
        }
        put(g, stuff, box(1, 1, 1), M.wood);
        const spare = new THREE.Mesh(box(12.0, 0.26, 2.0), M.canvas);
        spare.position.set(C[0] - 34, 2.2, C[1] + 20); spare.rotation.set(0, 0.5, 0.06); g.add(spare);
        return g;
      },
    },

    {
      id: 'the-hotel',
      name: 'The hotel in the mountains',
      at: [820, -1900], r: 110, ground: 34,
      trail: { from: [140, -1790], style: 'stones' },
      build: (M) => {
        const g = new THREE.Group();
        const C = [820, -1900];
        const shoulder = new THREE.Mesh(hill(230, 44, 12, { rough: 0.22, rings: 12, sectors: 22 }), M.turf);
        shoulder.position.set(C[0] + 40, -6, C[1]); g.add(shoulder);

        const h = house(M, {
          w: 30, d: 15, h: 5.0, storeys: 2, storeyH: 4.0, roof: 'gable', roofH: 4.0,
          wall: M.wall, roofMat: M.roof, trim: M.wood, windows: 8, lit: 0.5,
          winW: 1.1, winH: 1.8, doorLit: true, base: M.stone,
        });
        h.position.set(C[0], 34.5, C[1]); h.rotation.y = 1.5; g.add(h);

        // the veranda: a deck the length of the front, chairs, and a view
        const deck = new THREE.Mesh(box(5.0, 0.3, 30), M.wood);
        deck.position.set(C[0] - 10, 35.2, C[1]); g.add(deck);
        for (let i = 0; i < 6; i++) {
          const p = new THREE.Mesh(box(0.18, 4.2, 0.18), M.wood);
          p.position.set(C[0] - 12.2, 37.4, C[1] - 13 + i * 5.2); g.add(p);
          const ch = bench(M, { len: 1.2, mat: M.wood });
          ch.position.set(C[0] - 10.6, 35.4, C[1] - 12 + i * 5.0);
          ch.rotation.y = -Math.PI / 2; g.add(ch);
        }
        const rail = new THREE.Mesh(box(0.14, 0.14, 30), M.wood);
        rail.position.set(C[0] - 12.2, 36.4, C[1]); g.add(rail);
        g.add(grove(M, { n: 320, at: C, inner: 130, r: 330, kind: 'pine', mat: M.leaf, h: 18, spread: 7, seed: 8 }));
        g.add(scatter(M, { n: 1800, at: C, r: 180, y: 34, mat: M.leaf, s: 1.0, seed: 15 }));
        return g;
      },
    },

    {
      id: 'the-dream-field',
      name: 'The dream field',
      at: [620, -2400], r: 180, ground: 1.5,
      trail: { from: [110, -2280], style: 'posts' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(55);
        const C = [620, -2400];
        g.add(shelf(M, { r: 300, h: 1.5, mat: M.turf, seed: 2, rough: 0.06 }).translateX(C[0]).translateZ(C[1]));

        // Aircraft that were never built, in a line going to the horizon, all
        // of them wrong in a different way. Nothing on the ground but them.
        const wings = [], fuses = [], fins = [], props = [];
        for (let i = 0; i < 34; i++) {
          const t = i / 34;
          const x = C[0] - 240 + t * 520, z = C[1] - 120 + Math.sin(i * 1.7) * 90;
          const s = 1.0 + rnd() * 1.4;
          const ry = 0.1 + rnd() * 0.2;
          fuses.push({ pos: [x, 3.2 * s, z], rot: [Math.PI / 2, 0, ry], scale: [s, 9 * s, s] });
          // wings: one, two or three sets, because none of these are real
          const sets = 1 + ((i * 7) % 3);
          for (let k = 0; k < sets; k++) {
            wings.push({
              pos: [x, 2.6 * s + k * 1.8 * s, z + 0.4],
              rot: [0, ry, (rnd() - 0.5) * 0.14],
              scale: [(11 + rnd() * 7) * s, 0.24 * s, 2.0 * s],
            });
          }
          fins.push({ pos: [x, 4.4 * s, z - 4.0 * s], rot: [0, ry, 0], scale: [0.2 * s, 1.8 * s, 1.4 * s] });
          props.push({ pos: [x, 3.2 * s, z + 4.8 * s], rot: [0, ry, rnd() * 6.28], scale: [0.16 * s, 5.4 * s, 0.3 * s] });
        }
        put(g, fuses, new THREE.CylinderGeometry(1, 0.55, 1, 10), M.canvas);
        put(g, wings, box(1, 1, 1), M.canvas);
        put(g, fins, box(1, 1, 1), M.canvas);
        put(g, props, box(1, 1, 1), M.wood);
        g.add(scatter(M, { n: 3600, at: C, r: 280, y: 1.5, mat: M.leaf, s: 1.0, seed: 21 }));
        return g;
      },
    },
  ],
};
