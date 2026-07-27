import * as THREE from 'three';
import { box, hill, mulberry, fillInstances, mergePN } from '../world/geo.js';
import { makePaintMaterial, makeGlowMaterial } from '../world/paintMaterial.js';

// ---------------------------------------------------------------------------
// The Hillside — Grave of the Fireflies, 1988.
//
// A pond after dark, a hill above it, and fireflies. That is the whole region
// and it is going to stay that way.
//
// Every other country on this line answers "what else can go in the window".
// This one answers "what has to come out". No town, no lamp, no boat, no
// figure, nothing lit but the insects. The film is unbearable and a tribute
// that tried to be charming about it would be worse than not building it. So:
// quiet, dark, one pond, and several thousand small lights that go out.
// ---------------------------------------------------------------------------

export function buildHillside(shared) {
  const group = new THREE.Group();
  const rnd = mulberry(1988 * 3);

  const turf = makePaintMaterial(shared, { color: '#38442e', shadowTint: '#141a16', rim: 0.5, bands: 3, grain: 0.22, grainScale: 0.5 });
  const bank = makePaintMaterial(shared, { color: '#2f3628', shadowTint: '#111510', rim: 0.5, bands: 3, grain: 0.26, grainScale: 0.8 });
  const pineM = makePaintMaterial(shared, { color: '#242f22', shadowTint: '#0b0f0c', rim: 0.45, bands: 2, grain: 0.22, grainScale: 0.35, sway: 0.03, translucency: 0.4 });
  const trunkM = makePaintMaterial(shared, { color: '#332a22', shadowTint: '#100d0c', rim: 0.6, bands: 2, grain: 0.24, grainScale: 1.6 });
  const reedM = makePaintMaterial(shared, {
    color: '#4a4f32', shadowTint: '#1a1d14', rim: 0.7, bands: 2, grain: 0.2, grainScale: 0.4,
    side: THREE.DoubleSide, sway: 0.22, translucency: 0.8,
  });
  const stoneM = makePaintMaterial(shared, { color: '#4c4d48', shadowTint: '#191a1c', rim: 0.7, bands: 3, grain: 0.24, grainScale: 1.4 });

  // =========================================================================
  // The pond, which is where no ground was laid, and the hill above it
  // =========================================================================
  const POND = -28, FAR = -164;
  {
    for (let i = 0; i < 24; i++) {
      const b = new THREE.Mesh(box(1, 1, 1), turf);
      b.position.set(-13 - (Math.abs(POND) - 13) / 2, 0.5, -110 - i * 120);
      b.scale.set(Math.abs(POND) - 13, 1.6, 120 + rnd() * 30);
      group.add(b);
    }
    for (let i = 0; i < 22; i++) {
      const b = new THREE.Mesh(box(1, 1, 1), turf);
      const w = 220 + rnd() * 300;
      b.position.set(13 + w / 2, 0.5, -120 - i * 126);
      b.scale.set(w, 1.8, 126 + rnd() * 30);
      group.add(b);
    }
    for (let i = 0; i < 24; i++) {
      const b = new THREE.Mesh(box(1, 1, 1), bank);
      b.position.set(FAR - 90, 1.0, -110 - i * 122);
      b.scale.set(180, 3.4, 122 + rnd() * 26);
      group.add(b);
    }
    // the hill, well back, and low — this is a valley side, not a mountain
    [[-420, -700, 260, 86], [-520, -1700, 300, 104], [-380, -2500, 230, 72]]
      .forEach(([x, z, r, h], i) => {
        const m = new THREE.Mesh(hill(r, h, 91 + i, { rough: 0.26, rings: 14, sectors: 22 }), bank);
        m.position.set(x, -8, z); group.add(m);
      });

    // stones down the near bank, because a pond edge is never a clean line
    const rocks = [];
    for (let i = 0; i < 380; i++) {
      const s = 0.6 + Math.pow(rnd(), 1.7) * 3.4;
      rocks.push({
        pos: [POND + 2 - rnd() * 12, 0.7, -100 - rnd() * 2540],
        rot: [0, rnd() * 6.28, (rnd() - 0.5) * 0.3], scale: [s, s * 0.7, s * (0.7 + rnd() * 0.6)],
      });
    }
    const rm = new THREE.InstancedMesh(hill(1, 1, 7, { rough: 0.6, rings: 6, sectors: 9 }), stoneM, rocks.length);
    fillInstances(rm, rocks); rm.frustumCulled = false; group.add(rm);
  }

  // ---- reeds round the edges, and pines up the slope ----
  {
    const stand = (() => {
      const parts = [];
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const g = new THREE.PlaneGeometry(0.06, 1.2, 1, 3).toNonIndexed();
        const p = g.attributes.position;
        for (let v = 0; v < p.count; v++) {
          const t = p.getY(v) / 1.2 + 0.5;
          p.setX(v, p.getX(v) * (1 - t * 0.6));
          p.setY(v, t * 1.2); p.setZ(v, t * t * 0.42);
        }
        g.computeVertexNormals(); g.rotateY(a); parts.push(g);
      }
      return mergePN(parts);
    })();
    const items = [];
    for (let i = 0; i < 20000; i++) {
      const nearSide = rnd() > 0.45;
      const s = 1.1 + rnd() * 1.6;
      items.push({
        pos: [nearSide ? POND + 1 - Math.pow(rnd(), 1.5) * 22 : FAR + 4 + Math.pow(rnd(), 1.5) * 30, 1.0,
              -95 - rnd() * 2520],
        rot: [0, rnd() * 6.28, 0], scale: [s, s * (0.7 + rnd() * 0.8), s],
      });
    }
    const m = new THREE.InstancedMesh(stand, reedM, items.length);
    fillInstances(m, items); m.frustumCulled = false; group.add(m);

    const pineGeo = (() => {
      const parts = [];
      for (let i = 0; i < 4; i++) {
        const c = new THREE.ConeGeometry(0.66 - i * 0.11, 1.5, 7, 1);
        c.translate(0, 1.0 + i * 0.72, 0);
        parts.push(c.toNonIndexed());
      }
      return mergePN(parts);
    })();
    const trees = [], trunks = [];
    for (let i = 0; i < 1600; i++) {
      const s = 4 + rnd() * 8;
      const x = FAR - 30 - Math.pow(rnd(), 0.65) * 640;
      const z = -100 - rnd() * 2520;
      trees.push({ pos: [x, 1.4, z], rot: [0, rnd() * 6.28, 0], scale: [s, s * (1.1 + rnd() * 0.7), s] });
      trunks.push({ pos: [x, 1.4, z], scale: [s * 0.09, s * 1.1, s * 0.09] });
    }
    const tm = new THREE.InstancedMesh(pineGeo, pineM, trees.length);
    fillInstances(tm, trees); tm.frustumCulled = false; group.add(tm);
    const km = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1.3, 1, 5), trunkM, trunks.length);
    fillInstances(km, trunks); km.frustumCulled = false; group.add(km);
  }

  // =========================================================================
  // The fireflies. The only light in the region, and they go out.
  // =========================================================================
  const flies = [];
  const N = 900;
  for (let i = 0; i < N; i++) {
    flies.push({
      x: POND + 4 - rnd() * (Math.abs(FAR - POND) + 40),
      y: 1.6 + Math.pow(rnd(), 1.5) * 11,
      z: -100 - rnd() * 2540,
      ph: rnd() * 6.28, sp: 0.5 + rnd() * 1.1, r: 1.6 + rnd() * 5,
      // each one keeps its own rhythm, and each one is dark most of the time
      period: 3.2 + rnd() * 5.0, on: rnd() * 8,
    });
  }
  const glow = makeGlowMaterial(shared, '#c9e88a', 1.5, {
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, flicker: 0.0,
  });
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 5), glow, N);
  mesh.frustumCulled = false; mesh.renderOrder = 20; group.add(mesh);

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3();

  function update(t) {
    for (let i = 0; i < N; i++) {
      const f = flies[i];
      pv.set(
        f.x + Math.sin(t * 0.30 * f.sp + f.ph) * f.r,
        f.y + Math.sin(t * 0.55 * f.sp + f.ph * 2.1) * 1.4,
        f.z + Math.cos(t * 0.24 * f.sp + f.ph * 1.7) * f.r,
      );
      // A firefly is dark far more than it is lit. Steady lamps would be a
      // string of fairy lights, and that is a different, much cheaper feeling.
      const c = ((t + f.on) % f.period) / f.period;
      const lit = Math.max(0, Math.sin(c * Math.PI * 2) - 0.55) * 2.2;
      const s = 0.26 * lit;
      sv.set(s, s, s);
      m4.compose(pv, q, sv);
      mesh.setMatrixAt(i, m4);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
  update(0);

  return { group, update };
}
