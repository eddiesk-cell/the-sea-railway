import * as THREE from 'three';
import { shelf, shed, grove, scatter, put, box, hill, mulberry } from './kit.js';

// ---------------------------------------------------------------------------
// Earwig and the Witch.
//
// Two places. The workroom, which is shelves and jars and a great deal of
// labelled nonsense, and the band's van in a lay-by further up the lane — the
// only thing in the country that ever went anywhere.
// ---------------------------------------------------------------------------

export default {
  region: 'crooked',
  pal: {
    turf: { color: '#333d2c', shadowTint: '#111611', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.55 },
    wood: { color: '#3e3226', shadowTint: '#14100a', rim: 0.8, bands: 3, grain: 0.28, grainScale: 1.6 },
    brick: { color: '#5c4038', shadowTint: '#1e1616', rim: 0.8, bands: 3, grain: 0.26, grainScale: 1.4 },
    wall: { color: '#6d6656', shadowTint: '#242220', rim: 0.8, bands: 3, grain: 0.22 },
    glassM: { color: '#7a8a8c', shadowTint: '#282e30', rim: 2.0, bands: 2, grain: 0.06 },
    leaf: { color: '#2c3a24', shadowTint: '#0e1410', rim: 0.5, bands: 3, grain: 0.3, grainScale: 0.35, sway: 0.05, translucency: 0.5 },
    lane: { color: '#4a4642', shadowTint: '#1a1a1e', rim: 1.1, bands: 3, grain: 0.3, grainScale: 2.2 },
    paint: { color: '#7a3f6a', shadowTint: '#281426', rim: 1.2, bands: 3, grain: 0.14 },
    chrome: { color: '#8a9096', shadowTint: '#2c3034', rim: 2.2, bands: 2, grain: 0.06 },
  },

  places: [
    {
      id: 'the-workroom',
      name: 'The workroom',
      at: [420, -1320], r: 78, ground: 1.6,
      trail: { from: [70, -1400], style: 'lanterns' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(2020);
        const C = [420, -1320];
        g.add(shelf(M, { r: 120, h: 1.6, mat: M.turf, seed: 4, rough: 0.16 }).translateX(C[0]).translateZ(C[1]));

        // Three walls and a floor, open to the lane, so you can see in. The
        // room is the point; a fourth wall would hide it.
        const floor = new THREE.Mesh(box(16, 0.4, 14), M.wood);
        floor.position.set(C[0], 1.8, C[1]); g.add(floor);
        const back = new THREE.Mesh(box(16, 9, 0.6), M.brick);
        back.position.set(C[0], 6.5, C[1] - 7); g.add(back);
        for (const sx of [-1, 1]) {
          const s = new THREE.Mesh(box(0.6, 9, 14), M.brick);
          s.position.set(C[0] + sx * 8, 6.5, C[1]); g.add(s);
        }
        const roof = new THREE.Mesh(box(18, 0.5, 16), M.wood);
        roof.position.set(C[0], 11.2, C[1]); g.add(roof);

        // shelving on every wall, and a jar on every shelf
        const shelves = [], jars = [], labels = [];
        for (let row = 0; row < 6; row++) {
          shelves.push({ pos: [C[0], 3.0 + row * 1.4, C[1] - 6.2], scale: [14, 0.14, 1.2] });
          for (let i = 0; i < 22; i++) {
            const s = 0.16 + rnd() * 0.2;
            jars.push({
              pos: [C[0] - 6.6 + i * 0.62, 3.3 + row * 1.4 + s, C[1] - 6.2],
              rot: [0, rnd() * 6.28, 0], scale: [s, s * 1.6, s],
            });
            if (rnd() > 0.6) labels.push({ pos: [C[0] - 6.6 + i * 0.62, 3.3 + row * 1.4 + s, C[1] - 5.9], scale: [0.22, 0.16, 0.02] });
          }
        }
        put(g, shelves, box(1, 1, 1), M.wood);
        put(g, jars, new THREE.CylinderGeometry(1, 1, 1, 9), M.glassM);
        put(g, labels, box(1, 1, 1), M.wall);

        // the table in the middle, and one lamp over it
        const table = new THREE.Mesh(box(5.0, 0.24, 2.6), M.wood);
        table.position.set(C[0], 3.2, C[1] + 1); g.add(table);
        const lamp = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.8, 10), M.wood);
        lamp.position.set(C[0], 7.6, C[1] + 1); g.add(lamp);
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6), M.warm(3.0, '#ffb35a'));
        bulb.position.set(C[0], 7.1, C[1] + 1); bulb.renderOrder = 9; g.add(bulb);
        // a cauldron, and something in it that is faintly the wrong colour
        const pot2 = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.9, 1.4, 12), M.wood);
        pot2.position.set(C[0] + 4.6, 2.7, C[1] + 3); g.add(pot2);
        const brew = new THREE.Mesh(new THREE.CircleGeometry(1.0, 12), M.cool(1.4, '#7ce0b0'));
        brew.rotation.x = -Math.PI / 2; brew.position.set(C[0] + 4.6, 3.42, C[1] + 3);
        brew.renderOrder = 9; g.add(brew);

        g.userData.update = (t) => {
          brew.material.uniforms.uStrength.value = 1.1 + Math.sin(t * 0.7) * 0.35;
        };
        return g;
      },
    },

    {
      id: 'the-van',
      name: 'The van in the lay-by',
      at: [-140, -1980], r: 62, ground: 1.6,
      trail: { from: [-40, -1860], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const C = [-140, -1980];
        g.add(shelf(M, { r: 90, h: 1.6, mat: M.turf, seed: 7, rough: 0.2 }).translateX(C[0]).translateZ(C[1]));
        const lay = new THREE.Mesh(box(14, 0.4, 30), M.lane);
        lay.position.set(C[0], 1.7, C[1]); lay.rotation.y = 0.16; g.add(lay);

        // A boxy van, painted, with the back doors open and nothing in it.
        const v = new THREE.Group();
        v.position.set(C[0], 1.9, C[1]); v.rotation.y = 0.16 + Math.PI;
        const body = new THREE.Mesh(box(2.4, 2.4, 6.4), M.paint);
        body.position.y = 1.9; v.add(body);
        const cab = new THREE.Mesh(box(2.3, 1.7, 2.0), M.paint);
        cab.position.set(0, 1.6, 3.9); v.add(cab);
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.1), M.glassM);
        screen.position.set(0, 1.9, 4.92); v.add(screen);
        for (const sx of [-1, 1]) for (const sz of [-2.0, 2.6]) {
          const w = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.26, 12), M.wood);
          w.rotation.z = Math.PI / 2; w.position.set(sx * 1.2, 0.55, sz); v.add(w);
        }
        // the back doors, open, and the dark inside
        for (const sx of [-1, 1]) {
          const d = new THREE.Mesh(box(0.1, 2.2, 1.1), M.paint);
          d.position.set(sx * 1.6, 1.9, -3.6); d.rotation.y = sx * 1.0; v.add(d);
        }
        const inside = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.1), M.wood);
        inside.position.set(0, 1.9, -3.15); v.add(inside);
        const stripe = new THREE.Mesh(box(2.44, 0.5, 6.44), M.chrome);
        stripe.position.y = 1.4; v.add(stripe);
        g.add(v);

        const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.44, 1.1, 10), M.chrome);
        bin.position.set(C[0] + 7, 2.4, C[1] - 8); g.add(bin);
        g.add(grove(M, { n: 160, at: C, inner: 60, r: 200, kind: 'bare', mat: M.wood, h: 11, spread: 6, seed: 9 }));
        return g;
      },
    },
  ],
};
