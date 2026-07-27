import * as THREE from 'three';
import { box, curvedRoof, hill, mulberry, fillInstances, mergePN, hillSampler } from '../world/geo.js';
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
  const ROAD_X = -26;
  {
    // just proud of the water, which is the whole image: a road you could
    // still drive if you did not mind the wheels going under
    const road = new THREE.Mesh(box(11.6, 0.9, 2300), tarmac);
    road.position.set(ROAD_X, -0.16, -1200);
    group.add(road);
    for (const s of [-1, 1]) {
      const edge = new THREE.Mesh(box(0.42, 0.06, 2300), conc);
      edge.position.set(ROAD_X + s * 5.3, 0.29, -1200);
      group.add(edge);
    }
    // the centre line, gone dim under the water
    const dashes = [];
    for (let i = 0; i < 300; i++) {
      dashes.push({ pos: [ROAD_X, 0.30, -120 - i * 7.4], scale: [0.34, 1, 3.1] });
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

  // ---- where the land is -------------------------------------------------
  // Declared up here rather than inside the town block, because the shoal
  // needs it too: a fish does not know where the shore is unless something
  // tells it, and Eddie watched them "swim into land or out of the land",
  // which is precisely what a shoal with no shore test does.
  const HILLS = [
    [-330, -900, 300, 88, 3], [-620, -1700, 380, 128, 8], [-300, -2600, 260, 74, 14],
    [520, -1200, 300, 74, 21], [700, -2300, 350, 96, 27],
  ];
  const HILL_SURF = HILLS.map(([, , r, h, seed]) => hillSampler(r, h, seed, { rough: 0.12 }));
  const groundAt = (x, z) => {
    let best = 0;
    HILLS.forEach(([hx, hz], i) => {
      const s = HILL_SURF[i](x - hx, z - hz);
      if (s !== null) best = Math.max(best, -4 + s);
    });
    return best;
  };

  // They run the length of THIS region and no further. A shoal that travels
  // its own length twice over swims out of Ponyo and into Kiki's harbour,
  // where a forty-metre fish is not what the picture is about.
  const RUN = 2200;
  const shoal = [];
  for (let i = 0; i < 120; i++) {
    // Two bands, and both of them are WATER.
    //
    // The lanes used to run from x -50 to -280, which is straight through the
    // three hills the town stands on — Eddie watched them "swim into land or
    // out of the land". The near band now runs in the channel between the road
    // at -26 and the line, so the shoal keeps pace with the train the way it
    // keeps pace with the car in the film; the far band is out in open sea,
    // clear of the hills on the other side, which start at 220.
    const near = i % 3 !== 0;
    shoal.push({
      x: near ? -(9 + rnd() * 13) : 55 + rnd() * 140,
      wob: near ? 8 : 30,
      z0: rnd() * RUN,
      s: near ? 3.4 + rnd() * 4.0 : 5.5 + rnd() * 7.0,
      ph: rnd() * 6.28, sp: 0.5 + rnd() * 0.7,
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
    HILLS.forEach(([x, z, r, h, seed]) => {
      const m = new THREE.Mesh(hill(r, h, seed, { rough: 0.12, rings: 14, sectors: 22 }), green);
      m.position.set(x, -4, z);
      group.add(m);
    });

    // Trees, before anything else. A bare green dome half a kilometre off
    // reads as a painted backdrop no matter how many houses you put on it —
    // it is the broken edge of a canopy that tells the eye it is land.
    {
      const clump = (() => {
        const parts = [];
        for (let i = 0; i < 4; i++) {
          const g = new THREE.IcosahedronGeometry(1, 0);
          const p = g.attributes.position;
          for (let v = 0; v < p.count; v++) {
            const n = 0.72 + ((v * 13 + i * 29) % 17) / 30;
            p.setXYZ(v, p.getX(v) * n, p.getY(v) * n * 0.86, p.getZ(v) * n);
          }
          g.computeVertexNormals();
          const s = 0.5 + (i % 3) * 0.16;
          g.scale(s, s, s);
          g.translate((i - 1.5) * 0.42, 0.34 + (i % 2) * 0.3, ((i * 5) % 3 - 1) * 0.38);
          parts.push(g);
        }
        return mergePN(parts);
      })();
      const dark = makePaintMaterial(shared, { color: '#3d6a33', shadowTint: '#12261c', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.35, sway: 0.02, translucency: 0.5 });
      const items = [];
      for (let i = 0; i < 2600; i++) {
        const H = HILLS[(rnd() * HILLS.length) | 0];
        const a = rnd() * Math.PI * 2, dd = Math.pow(rnd(), 0.55) * H[2] * 0.98;
        const x = H[0] + Math.cos(a) * dd, z = H[1] + Math.sin(a) * dd;
        const y = groundAt(x, z);
        if (y < 0.5) continue;
        const s = 5 + rnd() * 9;
        items.push({ pos: [x, y - 1, z], rot: [0, rnd() * 6.28, 0], scale: [s, s * (0.9 + rnd() * 0.7), s] });
      }
      const m = new THREE.InstancedMesh(clump, dark, items.length);
      fillInstances(m, items); m.frustumCulled = false; group.add(m);
    }

    const houses = [], roofsR = [], roofsB = [];
    for (let i = 0; i < 320; i++) {
      const H = HILLS[(rnd() * HILLS.length) | 0];
      const a = rnd() * Math.PI * 2, dd = Math.pow(rnd(), 0.42) * H[2] * 0.92;
      const x = H[0] + Math.cos(a) * dd;
      const z = H[1] + Math.sin(a) * dd;
      const y = groundAt(x, z) - 1.5;
      if (y < 0.4) continue;
      // half a kilometre out, a seven-metre cottage is one pixel. The town has
      // to be built at the size it will be SEEN at, not the size it would be.
      const w = 13 + rnd() * 11, h = 9 + rnd() * 8, dp = 11 + rnd() * 10;
      const ry = rnd() * 0.7 - 0.35;
      houses.push({ pos: [x, y + h / 2, z], rot: [0, ry, 0], scale: [w, h, dp] });
      // curvedRoof() is anchored at its EAVE, not at its middle, unlike the
      // cones every other region roofs with. Placing it by the same arithmetic
      // left every roof in Ponyo hanging one and nine tenths of a metre above
      // its own walls — which from the hill opposite reads as a floating house,
      // and is what Eddie saw first.
      (rnd() > 0.4 ? roofsR : roofsB).push({
        pos: [x, y + h - 0.2, z], rot: [0, ry, 0], scale: [(w + 3.6) / 12, 4.4 / 3, (dp + 3.6) / 12],
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
      // they run up the coast, rise and fall THROUGH the surface, and roll —
      // mostly under it, so what you see is a back breaking a wave
      const z = -120 - ((f.z0 + t * 26 * f.sp) % RUN);
      const y = Math.sin(t * 0.8 * f.sp + f.ph) * 2.5 - 1.3;
      const roll = Math.sin(t * 1.4 + f.ph) * 0.28;
      const yaw = Math.sin(t * 0.31 + f.lane) * 0.22;
      const x = f.x + Math.sin(t * 0.24 + f.lane) * f.wob;
      pv.set(x, y, z);
      e.set(Math.sin(t * 0.9 + f.ph) * 0.14, yaw, roll);
      q.setFromEuler(e);
      // A fish is only where there is water to be in. The lanes run the whole
      // length of the region and the hills stand in several of them, so each
      // one dives as its own patch of sea shallows and comes back up on the
      // far side — rather than swimming up a hillside, which is what it did
      // before anything here knew where the shore was.
      const land = groundAt(x, z);
      const sink = 1 - THREE.MathUtils.smoothstep(land, -16, -1);
      const sc = f.s * sink;
      sv.set(sc, sc, sc);
      m.compose(pv, q, sv);
      fishMesh.setMatrixAt(i, m);
      // the eyes, which are the entire joke
      for (let k = 0; k < 2; k++) {
        const s2 = k ? 1 : -1;
        const off = new THREE.Vector3(s2 * 0.62 * sc, 0.22 * sc, 1.30 * sc).applyQuaternion(q);
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
