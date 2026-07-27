import * as THREE from 'three';
import { shelf, grove, scatter, put, box, hill, mulberry } from './kit.js';

// ---------------------------------------------------------------------------
// Arrietty.
//
// The window keeps the grass, the clover and the watering can. Everything here
// is at the same scale — four inches off the ground — so a brick wall is a
// cliff, a kettle is a boat, and a floorboard is a roof. Nothing is labelled
// and nothing needs to be: you know exactly what you are standing in.
// ---------------------------------------------------------------------------

export default {
  region: 'garden',
  pal: {
    turf: { color: '#4a6a30', shadowTint: '#16220f', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.4 },
    leaf: { color: '#4e7a30', shadowTint: '#18280f', rim: 0.6, bands: 3, grain: 0.24, grainScale: 0.3, sway: 0.05, translucency: 1.1 },
    wood: { color: '#7a5c36', shadowTint: '#2a1e10', rim: 0.9, bands: 3, grain: 0.3, grainScale: 3.0 },
    brick: { color: '#9c5a44', shadowTint: '#341a14', rim: 1.0, bands: 3, grain: 0.26, grainScale: 2.6 },
    iron: { color: '#5c6a66', shadowTint: '#1c2220', rim: 1.6, bands: 3, grain: 0.12 },
    paper: { color: '#e0d6bc', shadowTint: '#5c574a', rim: 1.2, bands: 2, grain: 0.1, side: THREE.DoubleSide },
    pin: { color: '#b8bcc0', shadowTint: '#3c4044', rim: 2.2, bands: 2, grain: 0.05 },
    cloth: { color: '#b2465a', shadowTint: '#3c1620', rim: 1.0, bands: 2, grain: 0.14, side: THREE.DoubleSide },
    water: { color: '#2e4c52', shadowTint: '#0e1c20', rim: 2.2, bands: 2, grain: 0.05 },
  },

  places: [
    {
      id: 'under-the-floor',
      name: 'Under the floorboards',
      at: [460, -1240], r: 90, ground: 1.5,
      trail: { from: [80, -1330], style: 'stones' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(2010);
        const C = [460, -1240];
        g.add(shelf(M, { r: 140, h: 1.5, mat: M.turf, seed: 5, rough: 0.12 }).translateX(C[0]).translateZ(C[1]));

        // The floor overhead, from underneath: planks with light between them.
        // That gap is the whole room — everything is lit in stripes.
        for (let i = 0; i < 22; i++) {
          const p = new THREE.Mesh(box(70, 1.6, 5.2), M.wood);
          p.position.set(C[0], 22, C[1] - 60 + i * 5.8); g.add(p);
        }
        for (let i = 0; i < 6; i++) {
          const j = new THREE.Mesh(box(3.4, 4.0, 130), M.wood);
          j.position.set(C[0] - 28 + i * 11, 19, C[1]); g.add(j);
        }

        // the house they built: matchbox rooms with real fires in them
        for (let i = 0; i < 5; i++) {
          const x = C[0] - 20 + i * 10, z = C[1] + (i % 2) * 8;
          const room = new THREE.Mesh(box(8, 7, 8), M.paper);
          room.position.set(x, 5.0, z); g.add(room);
          const win = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 2.6), M.warm(1.7, '#ffcf8e'));
          win.position.set(x, 5.2, z + 4.05); win.renderOrder = 9; g.add(win);
          const roof = new THREE.Mesh(box(9, 0.5, 9), M.wood);
          roof.position.set(x, 8.7, z); g.add(roof);
        }
        // a dressmaker's pin standing in for a rafter, which is the joke
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 26, 8), M.pin);
        pin.rotation.z = 0.28; pin.position.set(C[0] + 22, 11, C[1] - 8); g.add(pin);
        const head = new THREE.Mesh(new THREE.SphereGeometry(1.1, 9, 7), M.cloth);
        head.position.set(C[0] + 25.6, 23.6, C[1] - 8); g.add(head);

        // a stamp on the wall, used as a picture
        const stamp = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 5.0), M.cloth);
        stamp.position.set(C[0] - 24.4, 6.4, C[1] + 4.1); g.add(stamp);
        const spools = [];
        for (let i = 0; i < 12; i++) {
          spools.push({
            pos: [C[0] + 10 + rnd() * 20, 1.5 + 1.6, C[1] + 14 + rnd() * 20],
            rot: [0, rnd() * 6.28, Math.PI / 2], scale: [1.6, 3.2, 1.6],
          });
        }
        put(g, spools, new THREE.CylinderGeometry(1, 1, 1, 10), M.wood);
        return g;
      },
    },

    {
      id: 'the-dolls-house',
      name: "The doll's house room",
      at: [740, -1720], r: 80, ground: 1.5,
      trail: { from: [120, -1620], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const C = [740, -1720];
        g.add(shelf(M, { r: 120, h: 1.5, mat: M.wood, seed: 3, rough: 0.04 }).translateX(C[0]).translateZ(C[1]));

        // A perfect room, open on one side, standing in a space too large to
        // see the end of. The perfection is what makes it sad.
        const back = new THREE.Mesh(box(0.8, 22, 30), M.paper);
        back.position.set(C[0] - 15, 12.5, C[1]); g.add(back);
        const side = new THREE.Mesh(box(30, 22, 0.8), M.paper);
        side.position.set(C[0], 12.5, C[1] - 15); g.add(side);
        const floor = new THREE.Mesh(box(30, 0.8, 30), M.wood);
        floor.position.set(C[0], 1.9, C[1]); g.add(floor);
        const ceil = new THREE.Mesh(box(30, 0.8, 30), M.paper);
        ceil.position.set(C[0], 23.4, C[1]); g.add(ceil);

        const table = new THREE.Mesh(box(9, 0.6, 5), M.wood);
        table.position.set(C[0] + 2, 8.0, C[1] + 2); g.add(table);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
          const l = new THREE.Mesh(box(0.5, 6.0, 0.5), M.wood);
          l.position.set(C[0] + 2 + sx * 4, 5.0, C[1] + 2 + sz * 2); g.add(l);
        }
        for (let i = 0; i < 4; i++) {
          const ch = new THREE.Mesh(box(2.4, 0.5, 2.4), M.wood);
          ch.position.set(C[0] + 2 + (i % 2 ? 7 : -7), 5.4, C[1] + 2 + (i < 2 ? 4 : -4)); g.add(ch);
          const bk = new THREE.Mesh(box(0.4, 4.0, 2.4), M.wood);
          bk.position.set(C[0] + 2 + (i % 2 ? 8 : -8), 7.4, C[1] + 2 + (i < 2 ? 4 : -4)); g.add(bk);
        }
        const chand = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 7), M.warm(2.2, '#ffdca2'));
        chand.position.set(C[0], 20.0, C[1]); chand.renderOrder = 9; g.add(chand);
        const fire = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 3.0), M.warm(2.6, '#ff9a44'));
        fire.position.set(C[0] - 14.4, 4.0, C[1] - 4); fire.rotation.y = Math.PI / 2;
        fire.renderOrder = 9; g.add(fire);
        return g;
      },
    },

    {
      id: 'the-kettle',
      name: 'The kettle in the stream',
      at: [560, -2040], r: 75, ground: 1.5,
      trail: { from: [100, -1940], style: 'stones' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(44);
        const C = [560, -2040];
        g.add(shelf(M, { r: 120, h: 1.5, mat: M.turf, seed: 8, rough: 0.16 }).translateX(C[0]).translateZ(C[1]));
        const stream = new THREE.Mesh(box(24, 0.5, 180), M.water);
        stream.position.set(C[0] + 10, 1.4, C[1]); stream.rotation.y = 0.12;
        stream.renderOrder = 4; g.add(stream);

        // A kettle, floating, tied up. At this scale it is a houseboat.
        const body = new THREE.Mesh(new THREE.SphereGeometry(7, 14, 10), M.iron);
        body.scale.set(1, 0.78, 1.1); body.position.set(C[0] + 8, 4.4, C[1] + 4); g.add(body);
        const spout = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.8, 8, 9), M.iron);
        spout.rotation.z = -0.9; spout.position.set(C[0] + 14, 6.4, C[1] + 6); g.add(spout);
        const handle = new THREE.Mesh(new THREE.TorusGeometry(6.4, 0.7, 6, 16, Math.PI), M.iron);
        handle.position.set(C[0] + 8, 8.0, C[1] + 4); handle.rotation.y = Math.PI / 2; g.add(handle);
        const lid = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.2, 1.2, 12), M.iron);
        lid.position.set(C[0] + 8, 9.6, C[1] + 4); g.add(lid);
        const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 14, 6), M.wood);
        rope.rotation.set(0, 0.6, Math.PI / 2 - 0.24);
        rope.position.set(C[0] - 1, 3.6, C[1] + 1); g.add(rope);
        const peg = new THREE.Mesh(box(0.8, 5.0, 0.8), M.wood);
        peg.position.set(C[0] - 8, 3.6, C[1] - 2); g.add(peg);

        g.add(scatter(M, { n: 2600, at: C, r: 110, y: 1.5, mat: M.leaf, s: 3.6, vary: 0.8, seed: 21 }));
        void rnd;
        return g;
      },
    },

    {
      id: 'the-brick-wall',
      name: 'The wall, from below',
      at: [880, -2320], r: 100, ground: 1.5,
      trail: { from: [150, -2200], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(66);
        const C = [880, -2320];
        g.add(shelf(M, { r: 150, h: 1.5, mat: M.turf, seed: 2, rough: 0.1 }).translateX(C[0]).translateZ(C[1]));

        // Sixty metres of brick, coursed, with ivy going up it. It is a garden
        // wall and it is also a cliff, and both of those are true at once.
        const courses = [];
        for (let row = 0; row < 26; row++) {
          for (let i = 0; i < 40; i++) {
            courses.push({
              pos: [C[0] + 6, 2.4 + row * 2.4, C[1] - 96 + i * 4.9 + (row % 2) * 2.4],
              scale: [7.0, 2.2, 4.6],
            });
          }
        }
        put(g, courses, box(1, 1, 1), M.brick);
        const cap = new THREE.Mesh(box(9, 1.6, 200), M.brick);
        cap.position.set(C[0] + 6, 64, C[1]); g.add(cap);

        // ivy: leaves the size of dinner plates, going all the way up
        const ivy = [];
        for (let i = 0; i < 2600; i++) {
          const y = Math.pow(rnd(), 0.6) * 60;
          const s = 1.4 + rnd() * 1.8;
          ivy.push({
            pos: [C[0] + 2.2 + rnd() * 1.4, 1.5 + y, C[1] - 96 + rnd() * 192],
            rot: [(rnd() - 0.5) * 0.8, rnd() * 6.28, (rnd() - 0.5) * 0.8], scale: [s, s * 0.3, s],
          });
        }
        put(g, ivy, new THREE.IcosahedronGeometry(1, 0), M.leaf);
        return g;
      },
    },
  ],
};
