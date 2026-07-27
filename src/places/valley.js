import * as THREE from 'three';
import { shelf, house, grove, scatter, put, box, hill, mulberry } from './kit.js';

// ---------------------------------------------------------------------------
// Nausicaä.
//
// The window keeps the windmills and the edge of the forest. Off it: the
// greenhouse under the castle, where the thing everyone is afraid of is being
// grown on purpose in clean water; the floor of the forest itself, under the
// caps, where the air is clear; and the acid lake with the shell of something
// enormous half in it.
// ---------------------------------------------------------------------------

export default {
  region: 'valley',
  pal: {
    turf: { color: '#7a6a48', shadowTint: '#2a2618', rim: 0.5, bands: 3, grain: 0.26, grainScale: 0.55 },
    wall: { color: '#c4b08a', shadowTint: '#443c2c', rim: 0.9, bands: 3, grain: 0.2 },
    wood: { color: '#6a5030', shadowTint: '#241a0e', rim: 0.8, bands: 3, grain: 0.28, grainScale: 1.6 },
    stone: { color: '#8e8474', shadowTint: '#2e2c26', rim: 0.9, bands: 3, grain: 0.24, grainScale: 1.3, wrap: 0.55 },
    glassM: { color: '#9ec4c0', shadowTint: '#324442', rim: 2.0, bands: 2, grain: 0.06 },
    spore: { color: '#c8b0d8', shadowTint: '#4a3e5c', rim: 1.4, bands: 2, grain: 0.12, translucency: 1.2 },
    cap: { color: '#8a6ea0', shadowTint: '#302444', rim: 1.0, bands: 3, grain: 0.18, translucency: 0.8 },
    chitin: { color: '#6e5a3c', shadowTint: '#241c12', rim: 1.6, bands: 3, grain: 0.16 },
    acid: { color: '#8a9a4a', shadowTint: '#2e341a', rim: 2.4, bands: 2, grain: 0.06 },
    leaf: { color: '#5a6a34', shadowTint: '#1c2410', rim: 0.5, bands: 3, grain: 0.22, grainScale: 0.35, sway: 0.06, translucency: 0.9 },
  },

  places: [
    {
      id: 'the-greenhouse',
      name: 'The greenhouse under the castle',
      at: [480, -1420], r: 85, ground: 1.5,
      trail: { from: [80, -1520], style: 'stones' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(1984);
        const C = [480, -1420];
        g.add(shelf(M, { r: 130, h: 1.5, mat: M.turf, seed: 5, rough: 0.14 }).translateX(C[0]).translateZ(C[1]));

        // Underground, reached down a ramp, and the only clean air in the film.
        const ramp = new THREE.Mesh(box(6, 0.5, 26), M.stone);
        ramp.position.set(C[0] - 20, 0.2, C[1] + 14); ramp.rotation.x = 0.22; g.add(ramp);
        const room = new THREE.Mesh(box(26, 8, 20), M.stone);
        room.position.set(C[0], -3.0, C[1]); g.add(room);
        const vault = new THREE.Mesh(new THREE.CylinderGeometry(13, 13, 20, 18, 1, false, 0, Math.PI), M.glassM);
        vault.rotation.z = Math.PI / 2; vault.rotation.y = Math.PI / 2;
        vault.position.set(C[0], 1.0, C[1]); g.add(vault);

        // beds of clean water with one plant in each, lit from below
        const beds = [], lights = [], plants = [];
        for (let i = 0; i < 12; i++) {
          const x = C[0] - 9 + (i % 4) * 6, z = C[1] - 6 + Math.floor(i / 4) * 6;
          beds.push({ pos: [x, -0.6, z], scale: [4.2, 0.9, 4.2] });
          lights.push({ pos: [x, -0.1, z], scale: [3.6, 0.05, 3.6] });
          plants.push({ pos: [x, 0.6, z], rot: [0, rnd() * 6.28, 0], scale: [1.4, 1.8, 1.4] });
        }
        put(g, beds, box(1, 1, 1), M.stone);
        put(g, lights, box(1, 1, 1), M.cool(1.5, '#bfe4d8'), 9);
        put(g, plants, new THREE.IcosahedronGeometry(1, 0), M.leaf);
        const bench1 = new THREE.Mesh(box(1.6, 0.16, 14), M.wood);
        bench1.position.set(C[0] + 10, 0.4, C[1]); g.add(bench1);
        return g;
      },
    },

    {
      id: 'under-the-caps',
      name: 'The floor of the forest',
      at: [820, -1880], r: 140, ground: 1.5,
      trail: { from: [140, -1880], style: 'cut' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(41);
        const C = [820, -1880];
        g.add(shelf(M, { r: 220, h: 1.5, mat: M.stone, seed: 9, rough: 0.2 }).translateX(C[0]).translateZ(C[1]));

        // Enormous caps overhead on thin stalks, and beneath them nothing but
        // clean sand and a very long silence.
        const stalks = [], caps = [], gills = [];
        for (let i = 0; i < 90; i++) {
          const a = rnd() * 6.28, d = 14 + Math.pow(rnd(), 0.6) * 190;
          const x = C[0] + Math.cos(a) * d, z = C[1] + Math.sin(a) * d;
          const h = 26 + rnd() * 34, r = 12 + rnd() * 20;
          stalks.push({ pos: [x, 1.5, z], rot: [(rnd() - 0.5) * 0.1, 0, (rnd() - 0.5) * 0.1], scale: [r * 0.13, h, r * 0.13] });
          caps.push({ pos: [x, 1.5 + h, z], rot: [0, rnd() * 6.28, 0], scale: [r, r * 0.45, r] });
          gills.push({ pos: [x, 1.5 + h - 1.0, z], rot: [0, rnd() * 6.28, 0], scale: [r * 0.9, 0.4, r * 0.9] });
        }
        put(g, stalks, new THREE.CylinderGeometry(1, 1.5, 1, 8).translate(0, 0.5, 0), M.spore);
        put(g, caps, new THREE.SphereGeometry(1, 14, 7, 0, 6.28, 0, 1.3), M.cap);
        put(g, gills, new THREE.CylinderGeometry(1, 1, 1, 14), M.spore);

        // spores drifting down, and they are the only thing moving
        const motes = [];
        for (let i = 0; i < 900; i++) {
          motes.push({
            pos: [C[0] + (rnd() - 0.5) * 380, 2 + rnd() * 50, C[1] + (rnd() - 0.5) * 380],
            rot: [0, rnd() * 6.28, 0], scale: [0.7, 0.7, 0.7],
          });
        }
        const mm = put(g, motes, new THREE.IcosahedronGeometry(1, 0), M.cool(0.9, '#e0d0f0'), 9);
        const m = new THREE.Matrix4();
        g.userData.update = (t) => {
          motes.forEach((it, i) => {
            const y = 2 + ((it.pos[1] - 2 - t * 1.6) % 50 + 50) % 50;
            m.makeScale(0.7, 0.7, 0.7);
            m.setPosition(it.pos[0] + Math.sin(t * 0.3 + i) * 2.4, y, it.pos[2] + Math.cos(t * 0.24 + i) * 2.4);
            mm.setMatrixAt(i, m);
          });
          mm.instanceMatrix.needsUpdate = true;
        };
        return g;
      },
    },

    {
      id: 'the-acid-lake',
      name: 'The lake, and the shell in it',
      at: [880, -2941], r: 140, ground: 1.5,
      trail: { from: [190, -2440], style: 'posts' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(88);
        const C = [880, -2941];
        g.add(shelf(M, { r: 230, h: 1.5, mat: M.turf, seed: 2, rough: 0.16 }).translateX(C[0]).translateZ(C[1]));
        const lake = new THREE.Mesh(new THREE.CircleGeometry(150, 36), M.acid);
        lake.rotation.x = -Math.PI / 2; lake.position.set(C[0], 1.55, C[1]);
        lake.renderOrder = 4; g.add(lake);

        // The shell: fourteen plates in a row, going into the water, and one
        // eye the size of a house. Nothing explains it.
        for (let i = 0; i < 14; i++) {
          const t = i / 13;
          const s = 22 - t * 9;
          const seg = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 8, 0, 6.28, 0, 1.5), M.chitin);
          seg.scale.set(s, s * 0.72, s * 0.5);
          seg.position.set(C[0] - 60 + i * 11, 1.5 - t * 5, C[1] + 20 - t * 34);
          seg.rotation.x = -t * 0.4; g.add(seg);
        }
        const head = new THREE.Mesh(new THREE.SphereGeometry(24, 16, 10), M.chitin);
        head.scale.set(1, 0.8, 1.1); head.position.set(C[0] - 76, 12, C[1] + 30); g.add(head);
        for (let i = 0; i < 8; i++) {
          const a = -1.2 + i * 0.3;
          const eye = new THREE.Mesh(new THREE.SphereGeometry(4.2, 10, 8), M.cool(1.2, '#9fd8f0'));
          eye.position.set(C[0] - 76 + Math.cos(a) * 21, 14 + (i % 2) * 5, C[1] + 30 + Math.sin(a) * 21);
          eye.renderOrder = 9; g.add(eye);
        }
        const legs = [];
        for (let i = 0; i < 20; i++) {
          const t = i / 20;
          legs.push({
            pos: [C[0] - 60 + (i % 10) * 11, 1.0, C[1] + 20 + (i < 10 ? 16 : -16) - t * 20],
            rot: [0, 0, (i < 10 ? 1 : -1) * 0.9], scale: [2.0, 14, 2.0],
          });
        }
        put(g, legs, new THREE.CylinderGeometry(0.6, 1, 1, 6), M.chitin);
        void rnd;
        return g;
      },
    },
  ],
};
