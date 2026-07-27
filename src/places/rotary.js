import * as THREE from 'three';
import { shelf, house, fence, bench, steps, grove, scatter, put, box, hill, mulberry } from './kit.js';

// ---------------------------------------------------------------------------
// Whisper of the Heart.
//
// The window keeps the railing, the shop and the town below it. Off it: the
// library and the card in the back of the book, the workshop under the shop
// with a violin on the bench and a clock with two figures in it, and the
// overlook at the hour when the town puts its lights out one street at a time.
// ---------------------------------------------------------------------------

export default {
  region: 'rotary',
  pal: {
    turf: { color: '#4e6440', shadowTint: '#1a2418', rim: 0.5, bands: 3, grain: 0.22, grainScale: 0.55 },
    wall: { color: '#cbc0a6', shadowTint: '#484338', rim: 0.9, bands: 3, grain: 0.18 },
    roof: { color: '#5a5560', shadowTint: '#1c1a20', rim: 1.1, bands: 3, grain: 0.14, side: THREE.DoubleSide },
    wood: { color: '#6a5030', shadowTint: '#241a0e', rim: 0.8, bands: 3, grain: 0.28, grainScale: 1.6 },
    dark: { color: '#2c2018', shadowTint: '#0d0906', rim: 0.8, bands: 3, grain: 0.16 },
    leaf: { color: '#3e5c2e', shadowTint: '#131e0e', rim: 0.5, bands: 3, grain: 0.22, grainScale: 0.35, sway: 0.036, translucency: 0.7 },
    stone: { color: '#948e82', shadowTint: '#302e2a', rim: 0.9, bands: 3, grain: 0.22, grainScale: 1.2, wrap: 0.55 },
    brass: { color: '#b08a3c', shadowTint: '#3e3018', rim: 1.8, bands: 2, grain: 0.08 },
  },

  places: [
    {
      id: 'the-library',
      name: 'The library',
      at: [520, -1240], r: 95, ground: 1.5,
      trail: { from: [80, -1330], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(1995);
        const C = [520, -1240];
        g.add(shelf(M, { r: 150, h: 1.5, mat: M.turf, seed: 4, rough: 0.14 }).translateX(C[0]).translateZ(C[1]));

        const b = house(M, {
          w: 26, d: 18, h: 6.0, storeys: 2, storeyH: 4.6, roof: 'flat', roofH: 1.0,
          wall: M.wall, roofMat: M.roof, trim: M.wood, windows: 7, lit: 0.8,
          winW: 1.4, winH: 2.4, doorLit: true, doorW: 2.4, doorH: 3.0, base: M.stone,
        });
        b.position.set(C[0], 1.5, C[1]); b.rotation.y = 1.1; g.add(b);

        // the stacks, seen through the ground-floor glass: rows of shelving all
        // the way back, which is what makes a library a library from outside
        const shelves = [];
        for (let i = 0; i < 9; i++) {
          shelves.push({ pos: [C[0] - 8 + i * 2.0, 3.4, C[1] + 2], rot: [0, 1.1, 0], scale: [0.5, 3.4, 10] });
        }
        put(g, shelves, box(1, 1, 1), M.wood);

        const st = steps(M, { n: 7, w: 6.0, rise: 0.3, run: 0.9, mat: M.stone });
        st.position.set(C[0] + Math.sin(1.1) * 10, 1.5, C[1] + Math.cos(1.1) * 10);
        st.rotation.y = 1.1 + Math.PI; g.add(st);
        for (let i = 0; i < 4; i++) {
          const bn = bench(M, { len: 2.6, mat: M.wood });
          bn.position.set(C[0] + 18 + (i % 2) * 9, 1.5, C[1] + 14 + Math.floor(i / 2) * 8);
          bn.rotation.y = rnd() * 3; g.add(bn);
        }
        // one lamp over the door, and a bicycle against the rail
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 6), M.warm(2.4, '#ffdba6'));
        lamp.position.set(C[0] + Math.sin(1.1) * 9.6, 6.4, C[1] + Math.cos(1.1) * 9.6);
        lamp.renderOrder = 9; g.add(lamp);
        g.add(grove(M, { n: 160, at: C, inner: 90, r: 260, kind: 'broad', mat: M.leaf, h: 13, spread: 7, seed: 11 }));
        return g;
      },
    },

    {
      id: 'the-workshop',
      name: 'The workshop under the shop',
      at: [760, -1760], r: 80, ground: 1.5,
      trail: { from: [120, -1650], style: 'stones' },
      build: (M) => {
        const g = new THREE.Group();
        const C = [760, -1760];
        g.add(shelf(M, { r: 120, h: 1.5, mat: M.turf, seed: 7, rough: 0.16 }).translateX(C[0]).translateZ(C[1]));

        // Half underground, so you go DOWN to it. A workshop you look into from
        // above is a different thing from a shop you walk into.
        const pit = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, 4.5, 20, 1, true), M.stone);
        pit.position.set(C[0], -0.7, C[1]); g.add(pit);
        const floor = new THREE.Mesh(new THREE.CircleGeometry(12, 20), M.wood);
        floor.rotation.x = -Math.PI / 2; floor.position.set(C[0], -2.9, C[1]); g.add(floor);
        const st = steps(M, { n: 12, w: 2.2, rise: 0.38, run: 0.7, mat: M.stone });
        st.position.set(C[0] - 10, -2.9, C[1] - 6); st.rotation.y = 0.6; g.add(st);

        const bench1 = new THREE.Mesh(box(2.0, 0.16, 7.0), M.wood);
        bench1.position.set(C[0] + 4, -2.0, C[1]); g.add(bench1);
        for (const sz of [-1, 1]) {
          const l = new THREE.Mesh(box(1.6, 0.9, 0.2), M.wood);
          l.position.set(C[0] + 4, -2.5, C[1] + sz * 3.0); g.add(l);
        }
        // the violin: a body, a neck, a scroll. Nothing else on the bench.
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.20, 10, 7), M.wood);
        body.scale.set(1, 0.32, 1.7); body.position.set(C[0] + 4, -1.86, C[1] - 0.3); g.add(body);
        const neck = new THREE.Mesh(box(0.06, 0.05, 0.55), M.dark);
        neck.position.set(C[0] + 4, -1.86, C[1] + 0.6); g.add(neck);

        // the clock, on the wall, with the two little figures at the top
        const clock = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.3, 16), M.wood);
        clock.rotation.x = Math.PI / 2; clock.position.set(C[0] - 3, 0.4, C[1] - 10.2); g.add(clock);
        const face = new THREE.Mesh(new THREE.CircleGeometry(0.9, 16), M.warm(1.0, '#f4e6c2'));
        face.position.set(C[0] - 3, 0.4, C[1] - 10.0); face.renderOrder = 8; g.add(face);
        for (const sx of [-1, 1]) {
          const fig = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.14, 0.5, 7), M.brass);
          fig.position.set(C[0] - 3 + sx * 0.7, 1.9, C[1] - 10.0); g.add(fig);
          const hd = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), M.brass);
          hd.position.set(C[0] - 3 + sx * 0.7, 2.25, C[1] - 10.0); g.add(hd);
        }
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6), M.warm(3.0, '#ffca80'));
        lamp.position.set(C[0] + 4, 0.2, C[1]); lamp.renderOrder = 9; g.add(lamp);
        return g;
      },
    },

    {
      id: 'the-overlook',
      name: 'The overlook',
      at: [460, -2240], r: 100, ground: 44,
      trail: { from: [90, -2120], style: 'lanterns' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(88);
        const C = [460, -2240];
        const knoll = new THREE.Mesh(hill(220, 52, 3, { rough: 0.24, rings: 12, sectors: 22 }), M.turf);
        knoll.position.set(C[0], -6, C[1]); g.add(knoll);

        // A railing, a bench, and a whole town of small lights below — and the
        // lights go out in runs, one street at a time, if you stay long enough.
        const rail = [];
        for (let i = 0; i < 30; i++) {
          const a = -1.2 + (i / 30) * 2.4;
          rail.push({ pos: [C[0] + Math.cos(a) * 26, 45.4, C[1] + Math.sin(a) * 26], scale: [0.12, 1.1, 0.12] });
        }
        put(g, rail, box(1, 1, 1), M.dark);
        const bn = bench(M, { len: 2.6, mat: M.wood });
        bn.position.set(C[0] + 4, 44.5, C[1] + 14); bn.rotation.y = 2.6; g.add(bn);

        const streets = [];
        const lights = [];
        for (let s = 0; s < 9; s++) {
          const row = [];
          for (let i = 0; i < 26; i++) {
            const a = -1.5 + (i / 26) * 2.4 + s * 0.02;
            const d = 120 + s * 40;
            const x = C[0] + Math.cos(a) * d, z = C[1] + Math.sin(a) * d;
            const y = Math.max(1.5, -6 + 52 * Math.sqrt(Math.max(0, 1 - (d / 220) ** 2)));
            row.push(lights.length);
            lights.push({ pos: [x, y + 3 + rnd() * 6, z], scale: [0.9, 0.9, 0.9] });
          }
          streets.push(row);
        }
        const glow = M.warm(2.0, '#ffd9a0');
        const lm = put(g, lights, new THREE.SphereGeometry(0.5, 6, 5), glow, 9);
        g.add(grove(M, { n: 140, at: C, inner: 120, r: 260, kind: 'broad', mat: M.leaf, h: 12, spread: 6, seed: 5 }));

        // one street goes dark every twelve seconds, and comes back at the end
        const m = new THREE.Matrix4();
        g.userData.update = (t) => {
          const off = Math.floor((t / 12) % (streets.length + 3));
          streets.forEach((row, s) => {
            const on = s !== off;
            row.forEach((i) => {
              const it = lights[i];
              m.makeScale(on ? 1 : 0.001, on ? 1 : 0.001, on ? 1 : 0.001);
              m.setPosition(it.pos[0], it.pos[1], it.pos[2]);
              lm.setMatrixAt(i, m);
            });
          });
          lm.instanceMatrix.needsUpdate = true;
        };
        return g;
      },
    },
  ],
};
