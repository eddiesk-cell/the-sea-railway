import * as THREE from 'three';
import { shelf, house, fence, bench, grove, scatter, put, box, hill, mulberry } from './kit.js';

// ---------------------------------------------------------------------------
// Ocean Waves.
//
// The window keeps the sea wall and the level crossing. Off it: the school on
// its hill with nobody in it, one bench at an airport, and the footbridge where
// the two lines cross — which is a place because of what did not happen there.
// ---------------------------------------------------------------------------

export default {
  region: 'ocean',
  pal: {
    turf: { color: '#5c6e44', shadowTint: '#1e2618', rim: 0.5, bands: 3, grain: 0.22, grainScale: 0.55 },
    wall: { color: '#cfc8b6', shadowTint: '#4a483e', rim: 0.9, bands: 3, grain: 0.16 },
    roof: { color: '#6a6e6a', shadowTint: '#232626', rim: 1.0, bands: 3, grain: 0.14, side: THREE.DoubleSide },
    wood: { color: '#6e5a3e', shadowTint: '#241c12', rim: 0.8, bands: 3, grain: 0.26, grainScale: 1.5 },
    leaf: { color: '#4a6a34', shadowTint: '#162210', rim: 0.5, bands: 3, grain: 0.22, grainScale: 0.35, sway: 0.036, translucency: 0.7 },
    iron: { color: '#8a8a86', shadowTint: '#2c2c2a', rim: 1.4, bands: 3, grain: 0.12 },
    stone: { color: '#a29c92', shadowTint: '#34322e', rim: 0.9, bands: 3, grain: 0.2, grainScale: 1.2, wrap: 0.6 },
  },

  places: [
    {
      id: 'the-school',
      name: 'The school, empty, in the afternoon',
      at: [560, -1180], r: 110, ground: 16,
      trail: { from: [90, -1290], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const C = [560, -1180];
        const knoll = new THREE.Mesh(hill(220, 22, 5, { rough: 0.2, rings: 10, sectors: 20 }), M.turf);
        knoll.position.set(C[0], -3, C[1]); g.add(knoll);

        // A long concrete block with a great many identical windows and none of
        // them lit. Emptiness is the subject, so nothing here moves.
        const b = house(M, {
          w: 76, d: 14, h: 4.6, storeys: 3, storeyH: 3.9, roof: 'flat', roofH: 0.8,
          wall: M.wall, roofMat: M.roof, trim: M.iron, windows: 17, lit: 0, winW: 1.5, winH: 1.7,
          door: true, doorW: 3.0, doorH: 3.0,
        });
        b.position.set(C[0], 16.5, C[1]); b.rotation.y = 0.28; g.add(b);

        // the yard, the goalposts, the wire round it
        const yard = new THREE.Mesh(new THREE.CircleGeometry(80, 26), M.stone);
        yard.rotation.x = -Math.PI / 2; yard.position.set(C[0] + 10, 16.7, C[1] + 60); g.add(yard);
        for (const sz of [-1, 1]) {
          const p = new THREE.Mesh(box(0.2, 2.6, 7.4), M.iron);
          p.position.set(C[0] + 10, 18.0, C[1] + 60 + sz * 46); g.add(p);
          const bar = new THREE.Mesh(box(0.2, 0.2, 7.4), M.iron);
          bar.position.set(C[0] + 10, 19.3, C[1] + 60 + sz * 46); g.add(bar);
        }
        g.add(fence(M, { len: 150, h: 2.4, mat: M.iron, rails: 4 }).translateX(C[0] + 92).translateY(16.6).translateZ(C[1] + 40));
        g.add(grove(M, { n: 90, at: C, inner: 110, r: 230, kind: 'broad', mat: M.leaf, h: 13, spread: 7, seed: 4 }));
        return g;
      },
    },

    {
      id: 'airport-bench',
      name: 'The bench',
      at: [820, -1720], r: 70, ground: 1.6,
      trail: { from: [140, -1620], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const C = [820, -1720];
        g.add(shelf(M, { r: 130, h: 1.6, mat: M.stone, seed: 3, rough: 0.06 }).translateX(C[0]).translateZ(C[1]));

        // A concourse with nothing in it but a run of glass, a row of seats and
        // an apron beyond. One bench, and it is the only thing worth walking to.
        const roof = new THREE.Mesh(box(46, 0.7, 22), M.roof);
        roof.position.set(C[0], 8.4, C[1]); g.add(roof);
        for (let i = 0; i < 7; i++) {
          const c = new THREE.Mesh(box(0.5, 8.0, 0.5), M.iron);
          c.position.set(C[0] - 21 + i * 7, 5.6, C[1] - 10); g.add(c);
        }
        const glass = new THREE.Mesh(new THREE.PlaneGeometry(46, 7.0), M.cool(0.55, '#bcd4e2'));
        glass.position.set(C[0], 5.2, C[1] - 10.4); glass.renderOrder = 7; g.add(glass);

        for (let i = 0; i < 5; i++) {
          const bn = bench(M, { len: 4.2, mat: M.iron, back: true });
          bn.position.set(C[0] - 16 + i * 8, 1.6, C[1] + 3); bn.rotation.y = Math.PI; g.add(bn);
        }
        // and one that is a different colour, which is the one she sat on
        const one = bench(M, { len: 4.2, mat: M.wood, back: true });
        one.position.set(C[0] - 16, 1.6, C[1] + 3); one.rotation.y = Math.PI; g.add(one);

        const apron = new THREE.Mesh(new THREE.CircleGeometry(130, 30), M.stone);
        apron.rotation.x = -Math.PI / 2; apron.position.set(C[0], 1.55, C[1] - 90); g.add(apron);
        return g;
      },
    },

    {
      id: 'the-footbridge',
      name: 'Where the two lines cross',
      at: [460, -2020], r: 82, ground: 1.5,
      trail: { from: [80, -1920], style: 'stones' },
      build: (M) => {
        const g = new THREE.Group();
        const C = [460, -2020];
        g.add(shelf(M, { r: 130, h: 1.5, mat: M.turf, seed: 9, rough: 0.14 }).translateX(C[0]).translateZ(C[1]));

        // Two tracks meeting at an angle and a steel bridge over both, which is
        // the one place in the country you can stand above the thing that takes
        // people away.
        for (const [ang, off] of [[0.0, 0], [0.5, 6]]) {
          const bal = new THREE.Mesh(box(9, 0.5, 200), M.stone);
          bal.position.set(C[0] + off, 1.6, C[1]); bal.rotation.y = ang; g.add(bal);
          const rails = [];
          for (const sx of [-1, 1]) {
            rails.push({
              pos: [C[0] + off + Math.cos(ang) * sx * 1.5, 1.95, C[1] - Math.sin(ang) * sx * 1.5],
              rot: [0, ang, 0], scale: [0.14, 0.2, 200],
            });
          }
          put(g, rails, box(1, 1, 1), M.iron);
        }
        const span = new THREE.Mesh(box(34, 0.5, 2.4), M.iron);
        span.position.set(C[0] + 3, 8.4, C[1] + 4); span.rotation.y = 0.24; g.add(span);
        for (const sx of [-1, 1]) {
          const rail = new THREE.Mesh(box(34, 1.2, 0.12), M.iron);
          rail.position.set(C[0] + 3, 9.2, C[1] + 4 + sx * 1.2); rail.rotation.y = 0.24; g.add(rail);
          const st = new THREE.Mesh(box(1.6, 7.0, 1.6), M.iron);
          st.position.set(C[0] + 3 + sx * 16, 5.0, C[1] + 4); g.add(st);
        }
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), M.warm(2.4, '#ffe0a8'));
        lamp.position.set(C[0] + 3, 10.4, C[1] + 4); lamp.renderOrder = 9; g.add(lamp);
        g.add(grove(M, { n: 120, at: C, inner: 70, r: 200, kind: 'broad', mat: M.leaf, h: 12, spread: 7, seed: 15 }));
        return g;
      },
    },
  ],
};
