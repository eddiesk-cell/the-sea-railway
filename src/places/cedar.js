import * as THREE from 'three';
import { shelf, pool, grove, scatter, put, box, hill, mulberry, mergePN } from './kit.js';

// ---------------------------------------------------------------------------
// Princess Mononoke — the forest side.
//
// The window keeps the cedar columns and the river. Everything here is deeper
// in, on the far side of the line where the ride cannot look, and the walk to
// the pool is deliberately the longest on the whole railway. It should cost
// something to get there.
// ---------------------------------------------------------------------------

const kodamaGeo = (() => {
  const parts = [];
  const head = new THREE.SphereGeometry(0.42, 10, 8);
  head.scale(1, 1.06, 0.94); head.translate(0, 0.86, 0);
  parts.push(head.toNonIndexed());
  const body = new THREE.CylinderGeometry(0.17, 0.24, 0.52, 8);
  body.translate(0, 0.32, 0); parts.push(body.toNonIndexed());
  for (const s of [-1, 1]) {
    const a = new THREE.CylinderGeometry(0.055, 0.045, 0.34, 5);
    a.rotateZ(s * 0.5); a.translate(s * 0.22, 0.42, 0);
    parts.push(a.toNonIndexed());
    const l = new THREE.CylinderGeometry(0.05, 0.05, 0.16, 5);
    l.translate(s * 0.09, 0.06, 0); parts.push(l.toNonIndexed());
  }
  return mergePN(parts);
})();

// the three holes. Not a face — three holes, which is the whole trick of them.
const holesGeo = (() => {
  const parts = [];
  for (const [x, y, r] of [[-0.15, 0.94, 0.075], [0.15, 0.94, 0.075], [0, 0.75, 0.055]]) {
    const c = new THREE.CircleGeometry(r, 8);
    c.translate(x, y, 0.40);
    parts.push(c.toNonIndexed());
  }
  return mergePN(parts);
})();

function kodama(M, { n = 30, at = [0, 0], r = 30, y = 1.4, seed = 3 }) {
  const g = new THREE.Group();
  const rnd = mulberry(seed);
  const pale = M.paleWood;
  const items = [];
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, d = Math.pow(rnd(), 0.6) * r;
    const s = 1.5 + rnd() * 0.8;
    items.push({ pos: [at[0] + Math.cos(a) * d, y, at[1] + Math.sin(a) * d], rot: [0, rnd() * 6.28, 0], scale: [s, s, s] });
  }
  const bodies = put(g, items, kodamaGeo, pale);
  const holes = put(g, items, holesGeo, M.dark, 5);
  // They turn their heads. Nothing else about them moves, and that is exactly
  // why the turning is unnerving.
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const p = new THREE.Vector3(), sc = new THREE.Vector3();
  g.userData.spin = (t) => {
    items.forEach((it, i) => {
      p.set(it.pos[0], it.pos[1], it.pos[2]);
      e.set(0, it.rot[1] + Math.sin(t * 0.5 + i * 1.7) * 0.9, 0);
      q.setFromEuler(e);
      sc.set(it.scale[0], it.scale[1], it.scale[2]);
      m.compose(p, q, sc);
      bodies.setMatrixAt(i, m); holes.setMatrixAt(i, m);
    });
    bodies.instanceMatrix.needsUpdate = true;
    holes.instanceMatrix.needsUpdate = true;
  };
  return g;
}

export default {
  region: 'cedar',
  pal: {
    turf: { color: '#2e4030', shadowTint: '#0f1812', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.5 },
    moss: { color: '#456b34', shadowTint: '#16240f', rim: 0.5, bands: 3, grain: 0.26, grainScale: 0.4, sway: 0.03, translucency: 0.8 },
    leaf: { color: '#2c4426', shadowTint: '#0d160c', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.35, sway: 0.026, translucency: 0.55 },
    leaf2: { color: '#3a5630', shadowTint: '#111c10', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.35, sway: 0.03, translucency: 0.6 },
    trunk: { color: '#4a3f36', shadowTint: '#161210', rim: 0.7, bands: 3, grain: 0.26, grainScale: 1.8 },
    rock: { color: '#5c6058', shadowTint: '#1c2020', rim: 0.9, bands: 3, grain: 0.26, grainScale: 1.2, wrap: 0.6 },
    paleWood: { color: '#d8d6c6', shadowTint: '#6b6f66', rim: 1.5, bands: 2, grain: 0.08, emissive: '#cfe0d4', emissiveStrength: 0 },
    dark: { color: '#0e1210', shadowTint: '#050706', rim: 0.2, bands: 2, grain: 0.04 },
    // The pool. Almost no banding and a very high rim, so it takes its colour
    // from the sky rather than from a light — which is what still water does.
    still: { color: '#93b0a4', shadowTint: '#3c5850', rim: 2.6, bands: 2, grain: 0.04, wrap: 0.9, emissive: '#bfe4d6', emissiveStrength: 0.02 },
  },

  places: [
    // -----------------------------------------------------------------------
    {
      id: 'deer-pool',
      name: "The Deer God's Pool",
      at: [640, -1620], r: 165, ground: 1.4,
      trail: { from: [70, -1330], style: 'stones' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(1997);
        const C = [640, -1620];

        // A basin. The ground comes DOWN to the water rather than the water
        // sitting on top of the ground, which is the difference between a lake
        // and a puddle painted on a field.
        const bowl = shelf(M, { r: 330, h: 5.5, mat: M.turf, seed: 21, rough: 0.22 });
        bowl.position.set(C[0], -3.9, C[1]);
        g.add(bowl);

        // the water itself, and a paler plate a metre under it: the bottom,
        // seen through water clear enough that there is nothing to hide it
        const bed = new THREE.Mesh(new THREE.CircleGeometry(148, 44), M.rock);
        bed.rotation.x = -Math.PI / 2; bed.position.set(C[0], -0.9, C[1]);
        g.add(bed);
        const water = new THREE.Mesh(new THREE.CircleGeometry(150, 44), M.still);
        water.rotation.x = -Math.PI / 2; water.position.set(C[0], 1.35, C[1]);
        water.renderOrder = 4; g.add(water);
        g.add(pool(M, { r: 152, mat: M.still, lip: M.rock, y: 1.34 }).translateX(C[0]).translateZ(C[1]));

        // the island, and the one tree standing on it
        const isle = new THREE.Mesh(hill(26, 4.2, 8, { rough: 0.3, rings: 6, sectors: 16 }), M.turf);
        isle.position.set(C[0] + 14, 1.2, C[1] - 20); g.add(isle);
        {
          const t = new THREE.Group();
          t.position.set(C[0] + 14, 4.9, C[1] - 20);
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.1, 15, 8), M.trunk);
          trunk.position.y = 7.5; t.add(trunk);
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            const b = new THREE.Mesh(new THREE.IcosahedronGeometry(4.4 - i * 0.25, 1), M.leaf2);
            b.position.set(Math.cos(a) * 3.4, 13 + (i % 3) * 2.2, Math.sin(a) * 3.4);
            b.scale.y = 0.7; t.add(b);
          }
          g.add(t);
        }

        // Cedars all round it, and none of them inside the bowl — a wood that
        // grows down to the waterline hides the water.
        g.add(grove(M, {
          n: 900, at: C, inner: 200, r: 720, kind: 'pine', mat: M.leaf, trunkMat: M.trunk,
          h: 34, spread: 11, seed: 31,
        }));
        g.add(scatter(M, { n: 1600, at: C, r: 300, y: 1.4, mat: M.moss, s: 1.7, seed: 44 }));

        // stones out into the water, because you should be able to stand ON it
        {
          const items = [];
          for (let i = 0; i < 9; i++) {
            const t = i / 9;
            const s = 2.6 - t * 0.9;
            items.push({
              pos: [C[0] - 150 + t * 62 + Math.sin(i * 1.9) * 3, 1.15, C[1] + 8 + Math.cos(i * 2.3) * 5],
              rot: [0, rnd() * 6.28, 0], scale: [s, s * 0.5, s * 0.9],
            });
          }
          put(g, items, hill(1, 1, 5, { rough: 0.4, rings: 4, sectors: 9 }), M.rock);
        }

        // and the small pale things that were always here, watching
        const k = kodama(M, { n: 34, at: [C[0] - 100, C[1] + 110], r: 62, y: 1.4, seed: 8 });
        g.add(k);

        // ---- what changes when you get here ----
        // The pool is only a dark disc until you are standing at the edge of
        // it; then it takes the light. One state change, no fanfare.
        g.userData.update = (t, near) => {
          k.userData.spin(t);
          M.still.uniforms.uEmiStr.value = 0.02 + near * 0.30;
          M.paleWood.uniforms.uEmiStr.value = near * 0.16;
        };
        return g;
      },
    },

    // -----------------------------------------------------------------------
    {
      id: 'root-cave',
      name: 'The cave under the roots',
      at: [330, -880], r: 78, ground: 1.4,
      trail: { from: [40, -960], style: 'path' },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(55);
        const C = [330, -880];

        const bank = new THREE.Mesh(hill(74, 21, 12, { rough: 0.34, rings: 10, sectors: 20 }), M.turf);
        bank.position.set(C[0] + 26, 1.0, C[1] - 14); g.add(bank);

        // the mouth: a black plate set into the bank, and roots over it
        const mouth = new THREE.Mesh(new THREE.CircleGeometry(5.2, 16), M.dark);
        mouth.position.set(C[0] - 20, 4.4, C[1] + 30);
        mouth.rotation.y = -0.5; mouth.scale.y = 1.25; g.add(mouth);
        const jamb = new THREE.Mesh(new THREE.TorusGeometry(5.4, 0.9, 6, 18), M.rock);
        jamb.position.copy(mouth.position); jamb.rotation.y = -0.5; jamb.scale.y = 1.25; g.add(jamb);

        // the tree that owns it
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 6.2, 40, 12), M.trunk);
        trunk.position.set(C[0] - 12, 22, C[1] + 16); g.add(trunk);
        const roots = [];
        for (let i = 0; i < 22; i++) {
          const a = (i / 22) * Math.PI * 2;
          const l = 9 + rnd() * 13;
          roots.push({
            pos: [C[0] - 12 + Math.cos(a) * 6, 2.5 + rnd() * 5, C[1] + 16 + Math.sin(a) * 6],
            rot: [Math.cos(a) * 0.7, -a, Math.sin(a) * 0.7 + 1.1],
            scale: [1.0 + rnd(), l, 1.0 + rnd()],
          });
        }
        put(g, roots, new THREE.CylinderGeometry(0.35, 0.7, 1, 6), M.trunk);
        for (let i = 0; i < 5; i++) {
          const b = new THREE.Mesh(new THREE.IcosahedronGeometry(13 - i, 1), M.leaf);
          b.position.set(C[0] - 12 + (i % 3 - 1) * 8, 42 + (i % 2) * 6, C[1] + 16 + ((i * 5) % 3 - 1) * 8);
          b.scale.y = 0.72; g.add(b);
        }

        g.add(scatter(M, { n: 900, at: C, r: 76, y: 1.4, mat: M.moss, s: 1.5, seed: 12 }));
        g.add(grove(M, { n: 260, at: C, inner: 90, r: 300, kind: 'pine', mat: M.leaf, h: 30, spread: 10, seed: 66 }));

        const k = kodama(M, { n: 9, at: [C[0] - 24, C[1] + 40], r: 20, y: 1.4, seed: 19 });
        g.add(k);
        g.userData.update = (t) => k.userData.spin(t);
        return g;
      },
    },

    // -----------------------------------------------------------------------
    {
      id: 'kodama-clearing',
      name: 'Where they gather',
      at: [760, -2180], r: 120, ground: 1.4,
      trail: { from: [90, -2050], style: 'cut' },
      build: (M) => {
        const g = new THREE.Group();
        const C = [760, -2180];
        g.add(shelf(M, { r: 190, h: 1.4, mat: M.turf, seed: 4, rough: 0.18 }).translateX(C[0]).translateZ(C[1]));
        g.add(grove(M, { n: 700, at: C, inner: 118, r: 520, kind: 'pine', mat: M.leaf2, h: 32, spread: 10, seed: 77 }));
        g.add(scatter(M, { n: 2400, at: C, r: 130, y: 1.4, mat: M.moss, s: 1.4, seed: 90 }));

        // fallen trunks, so the clearing has a reason to be a clearing
        const rnd = mulberry(23);
        const logs = [];
        for (let i = 0; i < 14; i++) {
          const a = rnd() * Math.PI * 2, d = 30 + rnd() * 80;
          logs.push({
            pos: [C[0] + Math.cos(a) * d, 2.2, C[1] + Math.sin(a) * d],
            rot: [0, rnd() * 6.28, Math.PI / 2],
            scale: [1.5 + rnd(), 14 + rnd() * 16, 1.5 + rnd()],
          });
        }
        put(g, logs, new THREE.CylinderGeometry(0.6, 0.8, 1, 7), M.trunk);

        const near = kodama(M, { n: 120, at: C, r: 118, y: 1.4, seed: 101 });
        g.add(near);
        g.userData.update = (t) => near.userData.spin(t);
        return g;
      },
    },
  ],
};
