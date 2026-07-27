import * as THREE from 'three';
import { shelf, house, pot, grove, put, box, mulberry, mergePN } from './kit.js';

// ---------------------------------------------------------------------------
// The Cat Returns.
//
// The window keeps the plaza under the flowerpot. Off it: the Bureau itself,
// with a front door you could cover with a hand — and it opens — the crossroads
// where the cats queue, and the Cat King's tower, which is at FULL SIZE, so the
// joke runs the other way once in the country.
// ---------------------------------------------------------------------------

const catGeo = (() => {
  const parts = [];
  const b = new THREE.SphereGeometry(0.5, 9, 7); b.scale(0.62, 0.62, 1.0); b.translate(0, 0.5, 0);
  parts.push(b.toNonIndexed());
  const h = new THREE.SphereGeometry(0.3, 9, 7); h.translate(0, 0.86, 0.42); parts.push(h.toNonIndexed());
  for (const s of [-1, 1]) {
    const e = new THREE.ConeGeometry(0.13, 0.28, 4); e.translate(s * 0.16, 1.10, 0.40);
    parts.push(e.toNonIndexed());
    for (const z of [-0.3, 0.32]) {
      const l = new THREE.CylinderGeometry(0.07, 0.07, 0.34, 5); l.translate(s * 0.20, 0.17, z);
      parts.push(l.toNonIndexed());
    }
  }
  const t = new THREE.CylinderGeometry(0.06, 0.09, 0.8, 5);
  t.rotateX(0.8); t.translate(0, 0.72, -0.6); parts.push(t.toNonIndexed());
  return mergePN(parts);
})();

export default {
  region: 'cats',
  pal: {
    turf: { color: '#556a3c', shadowTint: '#1c2416', rim: 0.5, bands: 3, grain: 0.22, grainScale: 0.55 },
    wall: { color: '#d8c8a4', shadowTint: '#4c4436', rim: 0.9, bands: 3, grain: 0.18 },
    roof: { color: '#a05c3c', shadowTint: '#382014', rim: 1.1, bands: 3, grain: 0.14, side: THREE.DoubleSide },
    wood: { color: '#6e5234', shadowTint: '#241a10', rim: 0.8, bands: 3, grain: 0.28, grainScale: 1.5 },
    stone: { color: '#9c948a', shadowTint: '#32302c', rim: 0.9, bands: 3, grain: 0.22, grainScale: 1.2, wrap: 0.55 },
    leaf: { color: '#476a32', shadowTint: '#16220e', rim: 0.5, bands: 3, grain: 0.22, grainScale: 0.35, sway: 0.036, translucency: 0.75 },
    terracotta: { color: '#b06a44', shadowTint: '#3c2216', rim: 1.0, bands: 3, grain: 0.2 },
    fur: { color: '#5a5048', shadowTint: '#1c1814', rim: 1.0, bands: 3, grain: 0.14 },
    gold: { color: '#c9a44a', shadowTint: '#4c3c14', rim: 1.8, bands: 2, grain: 0.08 },
  },

  places: [
    {
      id: 'the-bureau',
      name: 'The Bureau',
      at: [440, -1260], r: 70, ground: 1.5,
      trail: { from: [70, -1340], style: 'stones' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(2002);
        const C = [440, -1260];
        g.add(shelf(M, { r: 110, h: 1.5, mat: M.turf, seed: 6, rough: 0.14 }).translateX(C[0]).translateZ(C[1]));

        // Everything here is a tenth the size it looks like it should be, and
        // the ONLY way that reads is to leave something full-sized beside it.
        const p = pot(M, { r: 5.2, h: 8.0, mat: M.terracotta, plant: M.leaf });
        p.position.set(C[0] - 26, 1.5, C[1] + 16); g.add(p);
        const can = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.4, 4.0, 12), M.wall);
        can.rotation.z = 1.5; can.position.set(C[0] + 24, 3.4, C[1] + 20); g.add(can);

        const b = house(M, {
          w: 3.4, d: 3.0, h: 2.6, storeys: 2, storeyH: 2.0, roof: 'gable', roofH: 1.6,
          wall: M.wall, roofMat: M.roof, trim: M.wood, windows: 2, lit: 1,
          winW: 0.5, winH: 0.6, doorLit: true, doorW: 0.5, doorH: 0.8, base: M.stone,
        });
        b.position.set(C[0], 1.5, C[1]); b.rotation.y = 0.6; g.add(b);
        // a step up to it, worn, and a lamp on a bracket the size of a thumbnail
        const stp = new THREE.Mesh(box(1.4, 0.2, 0.7), M.stone);
        stp.position.set(C[0] + Math.sin(0.6) * 1.7, 1.6, C[1] + Math.cos(0.6) * 1.7);
        stp.rotation.y = 0.6; g.add(stp);
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.09, 7, 5), M.warm(2.6, '#ffd08a'));
        lamp.position.set(C[0] + Math.sin(0.6) * 1.9, 3.5, C[1] + Math.cos(0.6) * 1.9);
        lamp.renderOrder = 9; g.add(lamp);

        // the little square in front, cobbled, with a fountain the size of a cup
        const sq = new THREE.Mesh(new THREE.CircleGeometry(9, 22), M.stone);
        sq.rotation.x = -Math.PI / 2; sq.position.set(C[0] + 3, 1.53, C[1] + 6); g.add(sq);
        const fount = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.5, 12), M.stone);
        fount.position.set(C[0] + 5, 1.75, C[1] + 8); g.add(fount);
        const cats = [];
        for (let i = 0; i < 16; i++) {
          const a = rnd() * 6.28, d = 3 + rnd() * 7;
          const s = 0.5 + rnd() * 0.3;
          cats.push({ pos: [C[0] + 3 + Math.cos(a) * d, 1.55, C[1] + 6 + Math.sin(a) * d], rot: [0, rnd() * 6.28, 0], scale: [s, s, s] });
        }
        put(g, cats, catGeo, M.fur);
        g.add(grove(M, { n: 120, at: C, inner: 70, r: 200, kind: 'broad', mat: M.leaf, h: 11, spread: 6, seed: 3 }));
        return g;
      },
    },

    {
      id: 'the-crossroads',
      name: 'Where the cats queue',
      at: [700, -1740], r: 85, ground: 1.5,
      trail: { from: [110, -1620], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(19);
        const C = [700, -1740];
        g.add(shelf(M, { r: 130, h: 1.5, mat: M.turf, seed: 9, rough: 0.12 }).translateX(C[0]).translateZ(C[1]));

        for (const ang of [0, Math.PI / 2]) {
          const road = new THREE.Mesh(box(4.0, 0.2, 180), M.stone);
          road.position.set(C[0], 1.56, C[1]); road.rotation.y = ang; g.add(road);
        }
        // small buildings on all four corners, none of them above knee height
        for (let i = 0; i < 4; i++) {
          const a = Math.PI / 4 + i * Math.PI / 2;
          for (let k = 0; k < 4; k++) {
            const d = 5 + k * 6;
            const h = house(M, {
              w: 2.4 + rnd(), d: 2.4, h: 2.0, storeys: 1 + (k % 2), storeyH: 1.6,
              roof: 'gable', roofH: 1.2, wall: M.wall, roofMat: M.roof, trim: M.wood,
              windows: 1, lit: 0.5, winW: 0.4, winH: 0.5, doorW: 0.4, doorH: 0.7,
            });
            h.position.set(C[0] + Math.cos(a) * d, 1.5, C[1] + Math.sin(a) * d);
            h.rotation.y = -a; g.add(h);
          }
        }
        // the queue itself: a line of them, patient, all facing one way
        const line = [];
        for (let i = 0; i < 46; i++) {
          const s = 0.45 + rnd() * 0.25;
          line.push({
            pos: [C[0] + (rnd() - 0.5) * 1.6, 1.55, C[1] - 40 + i * 1.9],
            rot: [0, Math.PI + (rnd() - 0.5) * 0.4, 0], scale: [s, s, s],
          });
        }
        put(g, line, catGeo, M.fur);
        g.add(grove(M, { n: 90, at: C, inner: 90, r: 200, kind: 'broad', mat: M.leaf, h: 10, spread: 6, seed: 22 }));
        return g;
      },
    },

    {
      id: 'the-cat-king',
      name: "The Cat King's tower",
      at: [1020, -1980], r: 150, ground: 1.5,
      trail: { from: [180, -1880], style: 'posts' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(77);
        const C = [1020, -1980];
        g.add(shelf(M, { r: 230, h: 1.5, mat: M.turf, seed: 12, rough: 0.16 }).translateX(C[0]).translateZ(C[1]));

        // Full size. Everything else in this country is a toy, so the one place
        // built to human scale is the one that feels wrong — which is right.
        const keep = new THREE.Mesh(new THREE.CylinderGeometry(22, 30, 78, 14), M.wall);
        keep.position.set(C[0], 40, C[1]); g.add(keep);
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          const t = new THREE.Mesh(new THREE.CylinderGeometry(7, 9, 96, 10), M.wall);
          t.position.set(C[0] + Math.cos(a) * 30, 49, C[1] + Math.sin(a) * 30); g.add(t);
          const cap = new THREE.Mesh(new THREE.ConeGeometry(10, 16, 10), M.roof);
          cap.position.set(C[0] + Math.cos(a) * 30, 105, C[1] + Math.sin(a) * 30); g.add(cap);
        }
        const crown = new THREE.Mesh(new THREE.ConeGeometry(26, 30, 14), M.roof);
        crown.position.set(C[0], 94, C[1]); g.add(crown);
        // two enormous ears on the roof, because of course there are
        for (const sx of [-1, 1]) {
          const ear = new THREE.Mesh(new THREE.ConeGeometry(8, 22, 4), M.roof);
          ear.position.set(C[0] + sx * 14, 116, C[1]); ear.rotation.z = sx * 0.3; g.add(ear);
        }
        const wins = [];
        for (let i = 0; i < 90; i++) {
          const a = rnd() * 6.28, y = 12 + rnd() * 60;
          wins.push({ pos: [C[0] + Math.cos(a) * 26.4, y, C[1] + Math.sin(a) * 26.4], rot: [0, -a + Math.PI / 2, 0], scale: [1, 1, 1] });
        }
        put(g, wins, new THREE.PlaneGeometry(1.4, 2.2), M.warm(1.5, '#ffc46a'), 9);
        g.add(grove(M, { n: 200, at: C, inner: 180, r: 400, kind: 'broad', mat: M.leaf, h: 14, spread: 7, seed: 4 }));
        return g;
      },
    },
  ],
};

