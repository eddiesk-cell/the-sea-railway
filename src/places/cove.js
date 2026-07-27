import * as THREE from 'three';
import { shelf, house, shed, boat, fence, grove, scatter, put, box, hill, mulberry } from './kit.js';

// ---------------------------------------------------------------------------
// Porco Rosso.
//
// The window keeps the inlet and the red seaplane on it. Off it: the hotel on
// its own island with the terrace over the water, the workshop up the canal
// where a hull is going back together, the beach the plane is hauled out on,
// and something in the shallows that did not come home.
// ---------------------------------------------------------------------------

export default {
  region: 'cove',
  pal: {
    turf: { color: '#6a7048', shadowTint: '#242818', rim: 0.5, bands: 3, grain: 0.22, grainScale: 0.55 },
    wall: { color: '#c3bba1', shadowTint: '#48453a', rim: 0.9, bands: 3, grain: 0.18, wrap: 0.66 },
    roof: { color: '#a86a48', shadowTint: '#3a2416', rim: 1.0, bands: 3, grain: 0.16, side: THREE.DoubleSide },
    stone: { color: '#b0a68c', shadowTint: '#3e3a30', rim: 0.9, bands: 3, grain: 0.24, grainScale: 1.3, wrap: 0.66 },
    wood: { color: '#6a5236', shadowTint: '#241a10', rim: 0.8, bands: 3, grain: 0.28, grainScale: 1.5 },
    leaf: { color: '#4c6034', shadowTint: '#182010', rim: 0.5, bands: 3, grain: 0.22, grainScale: 0.35, sway: 0.03, translucency: 0.6 },
    water: { color: '#1a6a78', shadowTint: '#082830', rim: 2.2, bands: 2, grain: 0.05 },
    red: { color: '#a83024', shadowTint: '#3a1010', rim: 1.4, bands: 3, grain: 0.14 },
    iron: { color: '#54525a', shadowTint: '#18181c', rim: 1.4, bands: 3, grain: 0.14 },
  },

  places: [
    {
      id: 'hotel-adriano',
      name: 'The hotel on its island',
      at: [700, -1240], r: 120, ground: 3.0,
      trail: { from: [110, -1350], style: 'stones' },
      build: (M) => {
        const g = new THREE.Group();
        const C = [700, -1240];
        const sea = new THREE.Mesh(new THREE.CircleGeometry(260, 40), M.water);
        sea.rotation.x = -Math.PI / 2; sea.position.set(C[0], 1.2, C[1]); sea.renderOrder = 4; g.add(sea);
        const isle = new THREE.Mesh(hill(74, 6.5, 4, { rough: 0.26, rings: 8, sectors: 20 }), M.stone);
        isle.position.set(C[0], -1.0, C[1]); g.add(isle);

        const h = house(M, {
          w: 26, d: 15, h: 5.0, storeys: 3, storeyH: 3.8, roof: 'flat', roofH: 0.9,
          wall: M.wall, roofMat: M.roof, trim: M.wood, windows: 7, lit: 0.7, winW: 1.1, winH: 1.7,
          doorLit: true,
        });
        h.position.set(C[0], 3.0, C[1] - 6); h.rotation.y = 0.35; g.add(h);

        // the terrace: tables out over the water, lamps strung between poles.
        // It is the reason anybody flies here.
        const deck = new THREE.Mesh(box(34, 0.5, 16), M.wood);
        deck.position.set(C[0] + 3, 2.9, C[1] + 14); deck.rotation.y = 0.35; g.add(deck);
        const rnd = mulberry(1992);
        const tables = [], legs = [];
        for (let i = 0; i < 12; i++) {
          const x = C[0] - 12 + rnd() * 30, z = C[1] + 8 + rnd() * 12;
          tables.push({ pos: [x, 3.9, z], scale: [1.5, 0.09, 1.5] });
          legs.push({ pos: [x, 3.4, z], scale: [0.16, 1.0, 0.16] });
        }
        put(g, tables, new THREE.CylinderGeometry(1, 1, 1, 12), M.wall);
        put(g, legs, box(1, 1, 1), M.wood);
        for (let i = 0; i < 5; i++) {
          const p = new THREE.Mesh(box(0.16, 5.0, 0.16), M.wood);
          p.position.set(C[0] - 14 + i * 8, 5.4, C[1] + 21); g.add(p);
          const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 7, 5), M.warm(2.6, '#ffcf8a'));
          bulb.position.set(C[0] - 14 + i * 8, 7.6, C[1] + 21); bulb.renderOrder = 9; g.add(bulb);
        }
        g.add(grove(M, { n: 60, at: C, inner: 30, r: 66, kind: 'palm', mat: M.leaf, h: 9, spread: 5, seed: 3 }));
        return g;
      },
    },

    {
      id: 'piccolo-workshop',
      name: 'The workshop up the canal',
      at: [520, -1860], r: 100, ground: 1.6,
      trail: { from: [90, -1740], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(7);
        const C = [520, -1860];
        g.add(shelf(M, { r: 150, h: 1.6, mat: M.stone, seed: 8, rough: 0.12 }).translateX(C[0]).translateZ(C[1]));
        const canal = new THREE.Mesh(box(26, 0.4, 200), M.water);
        canal.position.set(C[0] + 34, 1.4, C[1]); canal.renderOrder = 4; g.add(canal);

        // A tall shed with the doors open on the water and a half-built hull
        // on the slip, ribs showing. Gantries over the top of it.
        const s = shed(M, { w: 24, d: 34, h: 14, mat: M.wall, roofMat: M.iron });
        s.position.set(C[0], 1.6, C[1]); s.rotation.y = Math.PI / 2; g.add(s);
        const ribs = [];
        for (let i = 0; i < 16; i++) {
          const t = i / 15;
          const w = 4.4 * Math.sin(t * Math.PI) + 0.6;
          ribs.push({ pos: [C[0] + 2, 3.4, C[1] - 14 + i * 1.9], rot: [0, 0, 0], scale: [w, 3.0, 0.18] });
        }
        put(g, ribs, new THREE.TorusGeometry(1, 0.1, 5, 14, Math.PI), M.wood);
        const keel = new THREE.Mesh(box(0.5, 0.6, 32), M.wood);
        keel.position.set(C[0] + 2, 2.4, C[1]); g.add(keel);

        for (let i = 0; i < 3; i++) {
          const gan = new THREE.Mesh(box(30, 0.5, 0.5), M.iron);
          gan.position.set(C[0], 12.5, C[1] - 12 + i * 12); g.add(gan);
          const hook = new THREE.Mesh(box(0.16, 4.0, 0.16), M.iron);
          hook.position.set(C[0] + 2, 10.4, C[1] - 12 + i * 12); g.add(hook);
        }
        const tools = [];
        for (let i = 0; i < 70; i++) {
          tools.push({
            pos: [C[0] - 10 + rnd() * 6, 1.8 + (i % 5) * 0.3, C[1] - 16 + rnd() * 32],
            rot: [0, rnd() * 6.28, 0], scale: [0.4 + rnd() * 0.6, 0.3, 0.4 + rnd() * 0.7],
          });
        }
        put(g, tools, box(1, 1, 1), M.iron);
        return g;
      },
    },

    {
      id: 'the-beach',
      name: 'The beach with the rollers',
      at: [820, -2140], r: 100, ground: 1.4,
      trail: { from: [140, -2020], style: 'stones' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(21);
        const C = [820, -2140];
        g.add(shelf(M, { r: 150, h: 1.4, mat: M.sand, seed: 4, rough: 0.1 }).translateX(C[0] - 40).translateZ(C[1]));
        const sea = new THREE.Mesh(new THREE.CircleGeometry(200, 34), M.water);
        sea.rotation.x = -Math.PI / 2; sea.position.set(C[0] + 150, 1.25, C[1]); sea.renderOrder = 4; g.add(sea);

        // The rollers. Logs, in a line, going into the water — the whole
        // arrangement is an explanation of how a seaplane gets out of the sea.
        const logs = [];
        for (let i = 0; i < 16; i++) {
          logs.push({
            pos: [C[0] - 30 + i * 6, 1.85, C[1] + Math.sin(i * 0.7) * 0.6],
            rot: [0, 0.04 * Math.sin(i), Math.PI / 2], scale: [0.8, 9, 0.8],
          });
        }
        put(g, logs, new THREE.CylinderGeometry(0.5, 0.5, 1, 8), M.wood);

        const winch = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 3.0, 10), M.iron);
        winch.rotation.z = Math.PI / 2; winch.position.set(C[0] - 60, 2.6, C[1]); g.add(winch);
        for (const sz of [-1, 1]) {
          const p = new THREE.Mesh(box(0.5, 3.4, 0.5), M.wood);
          p.position.set(C[0] - 60, 2.5, C[1] + sz * 2.0); g.add(p);
        }
        const canopy = shed(M, { w: 14, d: 12, h: 5.0, mat: M.wood, roofMat: M.roof });
        canopy.position.set(C[0] - 84, 1.4, C[1] + 14); g.add(canopy);
        const drums = [];
        for (let i = 0; i < 9; i++) {
          drums.push({ pos: [C[0] - 82 + rnd() * 10, 1.95, C[1] + 10 + rnd() * 8], rot: [0, rnd(), 0], scale: [0.5, 1.1, 0.5] });
        }
        put(g, drums, new THREE.CylinderGeometry(1, 1, 1, 10), M.red);
        return g;
      },
    },

    {
      id: 'the-wreck',
      name: 'What is in the shallows',
      at: [980, -1600], r: 88, ground: 1.4,
      trail: { from: [180, -1500], style: 'posts' },
      build: (M) => {
        const g = new THREE.Group();
        const C = [980, -1600];
        const sea = new THREE.Mesh(new THREE.CircleGeometry(190, 34), M.water);
        sea.rotation.x = -Math.PI / 2; sea.position.set(C[0], 1.3, C[1]); sea.renderOrder = 4; g.add(sea);
        g.add(shelf(M, { r: 120, h: 1.4, mat: M.sand, seed: 6, rough: 0.14 }).translateX(C[0] - 150).translateZ(C[1]));

        // Half a fuselage, at an angle, with a wing still on it. Nothing else,
        // no explanation, and it should be entirely silent.
        const fus = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 0.9, 11, 12), M.wall);
        fus.position.set(C[0], 1.0, C[1]); fus.rotation.set(0.2, 0.7, Math.PI / 2 - 0.24); g.add(fus);
        const wing = new THREE.Mesh(box(15, 0.35, 3.0), M.wall);
        wing.position.set(C[0] + 1.6, 1.5, C[1] + 1.0); wing.rotation.set(0.1, 0.7, 0.3); g.add(wing);
        const tail = new THREE.Mesh(box(0.3, 3.2, 2.2), M.wall);
        tail.position.set(C[0] - 4.4, 3.0, C[1] - 3.6); tail.rotation.set(0, 0.7, 0.3); g.add(tail);
        const strut = new THREE.Mesh(box(0.24, 3.0, 0.24), M.iron);
        strut.position.set(C[0] + 6, 2.0, C[1] + 5.6); strut.rotation.z = 0.5; g.add(strut);

        const rnd = mulberry(13);
        const rocks = [];
        for (let i = 0; i < 60; i++) {
          const a = rnd() * 6.28, d = 12 + rnd() * 70;
          const s = 0.6 + rnd() * 1.6;
          rocks.push({ pos: [C[0] + Math.cos(a) * d, 1.1, C[1] + Math.sin(a) * d], rot: [0, rnd() * 6.28, 0], scale: [s, s * 0.6, s] });
        }
        put(g, rocks, hill(1, 1, 3, { rough: 0.5, rings: 4, sectors: 8 }), M.stone);
        return g;
      },
    },
  ],
};
