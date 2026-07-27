import * as THREE from 'three';
import { box, curvedRoof, hill, mulberry, fillInstances } from '../world/geo.js';
import { makePaintMaterial, makeGlowMaterial } from '../world/paintMaterial.js';

// ---------------------------------------------------------------------------
// The Drowned Road — Ponyo, 2008.
//
// The tide came in and did not go out, and nobody seems especially worried
// about it. A coast road under a metre of water, its lamps and its crash
// barrier still standing in ranks; a hillside town above the waterline; and
// out in the swell, the waves that are also fish — round-eyed, blunt-nosed,
// running in shoals under the surface and lifting the water where they pass.
//
// The only region on the line that is cheerful about drowning you.
// ---------------------------------------------------------------------------

export function buildDrownedRoad(shared) {
  const group = new THREE.Group();
  const rnd = mulberry(4408);

  const tarmac = makePaintMaterial(shared, { color: '#3f4750', shadowTint: '#131c2a', rim: 0.8, bands: 3, grain: 0.24, grainScale: 1.6 });
  const conc = makePaintMaterial(shared, { color: '#9aa3a0', shadowTint: '#38424a', rim: 0.7, bands: 3, grain: 0.20, grainScale: 1.2 });
  const steel = makePaintMaterial(shared, { color: '#b8c0c2', shadowTint: '#465058', rim: 1.4, bands: 3, grain: 0.10 });
  const wall = makePaintMaterial(shared, { color: '#e6dcc6', shadowTint: '#5c5a56', rim: 0.6, bands: 3, grain: 0.16 });
  const tileR = makePaintMaterial(shared, { color: '#b4553c', shadowTint: '#3f2230', rim: 0.8, bands: 3, grain: 0.14, side: THREE.DoubleSide });
  const tileB = makePaintMaterial(shared, { color: '#3d6c86', shadowTint: '#152838', rim: 0.9, bands: 3, grain: 0.14, side: THREE.DoubleSide });
  const green = makePaintMaterial(shared, { color: '#4d7a3e', shadowTint: '#17301f', rim: 0.5, bands: 3, grain: 0.2, grainScale: 0.6, sway: 0.03, translucency: 0.6 });
  const hull = makePaintMaterial(shared, { color: '#c0392e', shadowTint: '#3d1220', rim: 1.1, bands: 3, grain: 0.16 });
  const bone = makePaintMaterial(shared, { color: '#eef2f0', shadowTint: '#6e7c86', rim: 1.0, bands: 3, grain: 0.08 });

  // =========================================================================
  // The road: a causeway just under the surface, its markings still showing
  // =========================================================================
  const ROAD_X = -38;
  {
    const road = new THREE.Mesh(box(11, 0.5, 2300), tarmac);
    road.position.set(ROAD_X, -0.18, -1200);
    group.add(road);
    // the centre line, gone dim under the water
    const dashes = [];
    for (let i = 0; i < 300; i++) {
      dashes.push({ pos: [ROAD_X, 0.09, -120 - i * 7.4], scale: [0.34, 1, 3.1] });
    }
    const dash = new THREE.InstancedMesh(box(1, 0.05, 1), conc, dashes.length);
    fillInstances(dash, dashes); dash.frustumCulled = false; group.add(dash);

    // the crash barrier: the thing that tells you it is a road and not a jetty
    const posts = [], rails = [];
    for (let i = 0; i < 160; i++) {
      const z = -140 - i * 13.6;
      posts.push({ pos: [ROAD_X - 5.9, 0.62, z], scale: [0.16, 1.5, 0.16] });
      rails.push({ pos: [ROAD_X - 5.9, 1.18, z - 6.8], scale: [0.10, 0.30, 13.6] });
    }
    const pm = new THREE.InstancedMesh(box(1, 1, 1), steel, posts.length);
    fillInstances(pm, posts); pm.frustumCulled = false; group.add(pm);
    const rm = new THREE.InstancedMesh(box(1, 1, 1), steel, rails.length);
    fillInstances(rm, rails); rm.frustumCulled = false; group.add(rm);

    // road lamps, still standing, still leaning
    const lampGlass = makeGlowMaterial(shared, '#fff4d2', 0.55);
    for (let i = 0; i < 22; i++) {
      const z = -180 - i * 96 - rnd() * 30;
      const g = new THREE.Group();
      g.position.set(ROAD_X + 5.6, 0, z);
      g.rotation.z = (rnd() - 0.5) * 0.10;
      const pole = new THREE.Mesh(box(0.24, 8.4, 0.24), steel);
      pole.position.y = 4.2; g.add(pole);
      const arm = new THREE.Mesh(box(2.4, 0.18, 0.18), steel);
      arm.position.set(-1.2, 8.3, 0); g.add(arm);
      const head = new THREE.Mesh(box(1.1, 0.30, 0.5), lampGlass);
      head.position.set(-2.2, 8.1, 0); g.add(head);
      group.add(g);
    }
  }

  // =========================================================================
  // The shoal. Waves that are fish, or fish that are waves — the film never
  // settles it either, which is the whole charm of the thing.
  // =========================================================================
  const fishGeo = (() => {
    const parts = [];
    // body: a fat lozenge, flattened
    const b = new THREE.SphereGeometry(1, 12, 8);
    b.scale(1.0, 0.62, 2.15);
    parts.push(b);
    // tail
    const t = new THREE.ConeGeometry(0.72, 1.5, 6);
    t.rotateX(-Math.PI / 2); t.translate(0, 0, -2.6);
    parts.push(t);
    const merged = mergePN(parts);
    return merged;
  })();
  const eyeGeo = new THREE.SphereGeometry(0.20, 8, 6);

  const swell = makePaintMaterial(shared, {
    color: '#2f6f9a', shadowTint: '#123048', rim: 1.6, bands: 3, grain: 0.14,
    transparent: true, opacity: 0.86, depthWrite: true,
  });

  const shoal = [];
  for (let i = 0; i < 90; i++) {
    shoal.push({
      x: -(55 + rnd() * 250), z: -180 - rnd() * 2100,
      s: 7 + rnd() * 15, ph: rnd() * 6.28, sp: 0.5 + rnd() * 0.7,
      lane: rnd() * 6.28,
    });
  }
  const fishMesh = new THREE.InstancedMesh(fishGeo, swell, shoal.length);
  fishMesh.frustumCulled = false; group.add(fishMesh);
  const eyeMesh = new THREE.InstancedMesh(eyeGeo, bone, shoal.length * 2);
  eyeMesh.frustumCulled = false; group.add(eyeMesh);

  // =========================================================================
  // The town above the waterline
  // =========================================================================
  {
    // Real hills, and houses standing on them — a house placed at a height
    // with no ground under it hangs in the air, which the eye spots instantly.
    const HILLS = [
      [-330, -900, 300, 88, 3], [-620, -1700, 380, 128, 8], [-300, -2600, 260, 74, 14],
      [520, -1200, 300, 74, 21], [700, -2300, 350, 96, 27],
    ];
    HILLS.forEach(([x, z, r, h, seed]) => {
      const m = new THREE.Mesh(hill(r, h, seed, { rough: 0.12, rings: 14, sectors: 22 }), green);
      m.position.set(x, -4, z);
      group.add(m);
    });
    const groundAt = (x, z) => {
      let best = 0;
      HILLS.forEach(([hx, hz, r, h]) => {
        const d = Math.hypot(x - hx, z - hz) / r;
        if (d < 1) best = Math.max(best, -4 + h * Math.sqrt(Math.max(0, 1 - d * d)));
      });
      return best;
    };

    const houses = [], roofsR = [], roofsB = [];
    for (let i = 0; i < 130; i++) {
      const H = HILLS[(rnd() * HILLS.length) | 0];
      const a = rnd() * Math.PI * 2, dd = Math.pow(rnd(), 0.5) * H[2] * 0.80;
      const x = H[0] + Math.cos(a) * dd;
      const z = H[1] + Math.sin(a) * dd;
      const y = groundAt(x, z) - 1.5;
      if (y < 1) continue;
      const w = 7 + rnd() * 6, h = 5 + rnd() * 5, dp = 6 + rnd() * 5;
      const ry = rnd() * 0.7 - 0.35;
      houses.push({ pos: [x, y + h / 2, z], rot: [0, ry, 0], scale: [w, h, dp] });
      (rnd() > 0.4 ? roofsR : roofsB).push({
        pos: [x, y + h + 1.4, z], rot: [0, ry, 0], scale: [(w + 2.2) / 12, 3.0 / 3, (dp + 2.2) / 12],
      });
    }
    const hm = new THREE.InstancedMesh(box(1, 1, 1), wall, houses.length);
    fillInstances(hm, houses); hm.frustumCulled = false; group.add(hm);
    const roofGeo = curvedRoof(12, 12, 3, { seg: 6, power: 1.3, corner: 0.2, flare: 0.05 });
    [[roofsR, tileR], [roofsB, tileB]].forEach(([items, mat]) => {
      if (!items.length) return;
      const m = new THREE.InstancedMesh(roofGeo, mat, items.length);
      fillInstances(m, items); m.frustumCulled = false; group.add(m);
    });


  }

  // =========================================================================
  // Somebody's boat, tied to a lamp post, riding it out
  // =========================================================================
  {
    const b = new THREE.Group();
    b.position.set(ROAD_X + 9.5, 0.35, -640);
    b.rotation.y = 0.5;
    const h1 = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 7), hull);
    h1.scale.set(1.5, 0.75, 3.9); b.add(h1);
    const deck = new THREE.Mesh(box(2.4, 0.16, 6.0), wall);
    deck.position.y = 0.42; b.add(deck);
    const cab = new THREE.Mesh(box(1.5, 1.1, 1.9), wall);
    cab.position.set(0, 1.0, -0.7); b.add(cab);
    const mast = new THREE.Mesh(box(0.10, 3.2, 0.10), steel);
    mast.position.set(0, 2.1, 1.3); b.add(mast);
    group.add(b);
    var boat = b;
  }

  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(),
        sv = new THREE.Vector3(), pv = new THREE.Vector3();

  function update(t) {
    shoal.forEach((f, i) => {
      // they run up the coast, rise and fall through the surface, and roll
      const z = f.z + ((t * 26 * f.sp) % 2400);
      const y = Math.sin(t * 0.8 * f.sp + f.ph) * 3.4 + 1.2;
      const roll = Math.sin(t * 1.4 + f.ph) * 0.28;
      const yaw = Math.sin(t * 0.31 + f.lane) * 0.22;
      pv.set(f.x + Math.sin(t * 0.24 + f.lane) * 26, y, z - 2400);
      e.set(Math.sin(t * 0.9 + f.ph) * 0.14, yaw, roll);
      q.setFromEuler(e);
      sv.set(f.s, f.s, f.s);
      m.compose(pv, q, sv);
      fishMesh.setMatrixAt(i, m);
      // the eyes, which are the entire joke
      for (let k = 0; k < 2; k++) {
        const s2 = k ? 1 : -1;
        const off = new THREE.Vector3(s2 * 0.62 * f.s, 0.22 * f.s, 1.30 * f.s).applyQuaternion(q);
        m.compose(pv.clone().add(off), q, sv);
        eyeMesh.setMatrixAt(i * 2 + k, m);
      }
    });
    fishMesh.instanceMatrix.needsUpdate = true;
    eyeMesh.instanceMatrix.needsUpdate = true;
    boat.position.y = 0.35 + Math.sin(t * 0.9) * 0.22;
    boat.rotation.z = Math.sin(t * 0.7) * 0.09;
    boat.rotation.x = Math.sin(t * 1.1 + 1) * 0.05;
  }
  update(0);

  return { group, update };
}

function mergePN(list) {
  let vc = 0;
  const parts = list.map(g => { const s = g.toNonIndexed(); vc += s.attributes.position.count; g.dispose(); return s; });
  const pos = new Float32Array(vc * 3), nrm = new Float32Array(vc * 3);
  let o = 0;
  parts.forEach(g => {
    pos.set(g.attributes.position.array, o * 3);
    nrm.set(g.attributes.normal.array, o * 3);
    o += g.attributes.position.count; g.dispose();
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  return out;
}
