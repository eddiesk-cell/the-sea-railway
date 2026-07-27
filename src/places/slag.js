import * as THREE from 'three';
import { shelf, shed, steps, grove, scatter, put, box, hill, mulberry } from './kit.js';

// ---------------------------------------------------------------------------
// Castle in the Sky — the mining half.
//
// The window keeps the terraces and the viaduct. Off it: the crystal cave down
// the shaft, which lights up when you get there; the railway yard at the top of
// the incline; and a ruined fort on the ridge above the town.
// ---------------------------------------------------------------------------

export default {
  region: 'slag',
  pal: {
    turf: { color: '#4e5240', shadowTint: '#1a1c16', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.55 },
    rock: { color: '#6a625a', shadowTint: '#22201e', rim: 0.9, bands: 3, grain: 0.28, grainScale: 1.2, wrap: 0.55 },
    coal: { color: '#2c2a28', shadowTint: '#0c0c0c', rim: 0.9, bands: 3, grain: 0.24, grainScale: 1.0 },
    wood: { color: '#5a4632', shadowTint: '#1e1710', rim: 0.8, bands: 3, grain: 0.28, grainScale: 1.6 },
    iron: { color: '#514c48', shadowTint: '#181614', rim: 1.5, bands: 3, grain: 0.16 },
    wall: { color: '#a4907a', shadowTint: '#36302a', rim: 0.9, bands: 3, grain: 0.2 },
    crystal: { color: '#7ec8d8', shadowTint: '#28505c', rim: 2.4, bands: 2, grain: 0.06, emissive: '#6fd8e8', emissiveStrength: 0.0 },
    leaf: { color: '#4a5a32', shadowTint: '#161e10', rim: 0.5, bands: 3, grain: 0.22, grainScale: 0.35, sway: 0.03, translucency: 0.6 },
  },

  places: [
    {
      id: 'the-crystal-cave',
      name: 'Down the shaft',
      at: [520, -1360], r: 90, ground: 1.5,
      trail: { from: [80, -1450], style: 'posts' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(1986);
        const C = [520, -1360];
        g.add(shelf(M, { r: 150, h: 1.5, mat: M.rock, seed: 4, rough: 0.2 }).translateX(C[0]).translateZ(C[1]));

        // The headgear at the top, a cage, and a hole. Below it a chamber that
        // is completely dark until you are standing in it.
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
          const l = new THREE.Mesh(box(0.7, 16, 0.7), M.iron);
          l.position.set(C[0] + sx * 3.4, 9.5, C[1] + sz * 3.4);
          l.rotation.z = -sx * 0.06; l.rotation.x = sz * 0.06; g.add(l);
        }
        const wheel = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.4, 7, 18), M.iron);
        wheel.position.set(C[0], 18.0, C[1]); g.add(wheel);
        const shaftMouth = new THREE.Mesh(new THREE.CircleGeometry(4.0, 18), M.coal);
        shaftMouth.rotation.x = -Math.PI / 2; shaftMouth.position.set(C[0], 1.58, C[1]);
        shaftMouth.renderOrder = 6; g.add(shaftMouth);

        // The chamber, thirty metres down. Built as a floor and a ring of rock
        // rather than an inverted sphere — flipping `side` on the shared rock
        // material would turn every rock in the country inside out with it.
        const floor = new THREE.Mesh(new THREE.CircleGeometry(34, 24), M.rock);
        floor.rotation.x = -Math.PI / 2; floor.position.set(C[0], -74, C[1]); g.add(floor);
        for (let i = 0; i < 22; i++) {
          const a = (i / 22) * Math.PI * 2;
          const w = new THREE.Mesh(hill(11, 34, i, { rough: 0.5, rings: 7, sectors: 10 }), M.rock);
          w.position.set(C[0] + Math.cos(a) * 36, -74, C[1] + Math.sin(a) * 36); g.add(w);
        }
        const crystals = [];
        for (let i = 0; i < 260; i++) {
          const a = rnd() * 6.28, ph = rnd() * Math.PI;
          const r = 30;
          const s = 1.2 + Math.pow(rnd(), 2) * 5.5;
          crystals.push({
            pos: [C[0] + Math.sin(ph) * Math.cos(a) * r, -44 + Math.cos(ph) * r, C[1] + Math.sin(ph) * Math.sin(a) * r],
            rot: [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28],
            scale: [s * 0.3, s, s * 0.3],
          });
        }
        put(g, crystals, new THREE.ConeGeometry(1, 1, 6, 1), M.crystal);
        const st = steps(M, { n: 60, w: 2.2, rise: 0.6, run: 0.6, mat: M.rock });
        st.position.set(C[0] + 8, -34, C[1]); st.rotation.y = 1.2; g.add(st);

        // it lights when you arrive, and only then
        g.userData.update = (t, near) => {
          M.crystal.uniforms.uEmiStr.value = near * (0.55 + Math.sin(t * 0.6) * 0.12);
        };
        return g;
      },
    },

    {
      id: 'the-railway-yard',
      name: 'The yard at the top of the incline',
      at: [780, -1900], r: 110, ground: 26,
      trail: { from: [130, -1790], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(33);
        const C = [780, -1900];
        const bench1 = new THREE.Mesh(hill(220, 34, 6, { rough: 0.2, rings: 12, sectors: 22 }), M.rock);
        bench1.position.set(C[0], -6, C[1]); g.add(bench1);

        // Four roads of track, a turntable, and coal in heaps. Not a station —
        // a yard, which is a place that only exists to serve somewhere else.
        const rails = [];
        for (let r = 0; r < 4; r++) {
          for (const sx of [-1, 1]) {
            rails.push({ pos: [C[0] - 24 + r * 16 + sx * 0.72, 26.4, C[1]], scale: [0.14, 0.2, 170] });
          }
        }
        put(g, rails, box(1, 1, 1), M.iron);
        const sleepers = [];
        for (let r = 0; r < 4; r++) {
          for (let i = 0; i < 90; i++) {
            sleepers.push({ pos: [C[0] - 24 + r * 16, 26.2, C[1] - 85 + i * 1.9], scale: [2.2, 0.16, 0.5] });
          }
        }
        put(g, sleepers, box(1, 1, 1), M.wood);

        const tt = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 0.6, 20), M.iron);
        tt.position.set(C[0] + 40, 26.3, C[1] + 30); g.add(tt);
        const beam = new THREE.Mesh(box(1.4, 0.5, 18), M.iron);
        beam.position.set(C[0] + 40, 26.8, C[1] + 30); beam.rotation.y = 0.4; g.add(beam);

        const heaps = [];
        for (let i = 0; i < 26; i++) {
          const s = 3 + rnd() * 7;
          heaps.push({
            pos: [C[0] - 60 + rnd() * 30, 26, C[1] - 60 + rnd() * 120],
            rot: [0, rnd() * 6.28, 0], scale: [s, s * 0.6, s],
          });
        }
        put(g, heaps, new THREE.ConeGeometry(1, 1, 9, 1), M.coal);
        const s = shed(M, { w: 16, d: 30, h: 9, mat: M.wood, roofMat: M.iron });
        s.position.set(C[0] + 8, 26, C[1] - 70); g.add(s);
        return g;
      },
    },

    {
      id: 'the-ruined-fort',
      name: 'The fort on the ridge',
      at: [640, -2340], r: 110, ground: 62,
      trail: { from: [110, -2220], style: 'stones' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(55);
        const C = [640, -2340];
        const ridge = new THREE.Mesh(hill(210, 74, 9, { rough: 0.3, rings: 12, sectors: 22 }), M.rock);
        ridge.position.set(C[0], -8, C[1]); g.add(ridge);

        // Half a curtain wall and one tower with its top gone. Nothing in it,
        // and grass growing out of the top of every course.
        const arc = [];
        for (let i = 0; i < 46; i++) {
          const a = -1.4 + (i / 46) * 2.6;
          const h = 5 + Math.sin(i * 0.7) * 2.6 + rnd() * 2;
          arc.push({
            pos: [C[0] + Math.cos(a) * 46, 62 + h / 2, C[1] + Math.sin(a) * 46],
            rot: [0, -a, 0], scale: [7.0, h, 3.0],
          });
        }
        put(g, arc, box(1, 1, 1), M.wall);
        for (let i = 0; i < 4; i++) {
          const r = 7 - i * 0.6;
          const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r + 0.6, 6, 12), M.wall);
          t.position.set(C[0] - 40, 65 + i * 6, C[1] + 22);
          t.rotation.y = rnd(); g.add(t);
        }
        // the broken lip: half the top course missing
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          if (i % 3 === 0) continue;
          const b = new THREE.Mesh(box(2.4, 2.6, 2.4), M.wall);
          b.position.set(C[0] - 40 + Math.cos(a) * 6.4, 91, C[1] + 22 + Math.sin(a) * 6.4); g.add(b);
        }
        g.add(scatter(M, { n: 1600, at: C, r: 150, y: 60, mat: M.leaf, s: 1.0, seed: 7 }));
        return g;
      },
    },
  ],
};
