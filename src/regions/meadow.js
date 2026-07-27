import * as THREE from 'three';
import { box, hill, mulberry, fillInstances, mergePN } from '../world/geo.js';
import { makePaintMaterial, makeGlowMaterial } from '../world/paintMaterial.js';

// ---------------------------------------------------------------------------
// The Meadow — Howl's Moving Castle, 2004.
//
// The most straightforwardly happy place on the line: an alpine bowl at noon,
// flowers to the horizon, a lake, snow on the far tops — and, a long way off
// on the skyline, something enormous walking.
//
// The castle is the whole point, and the way to make it read is not detail but
// WRONGNESS: nothing on it matches anything else, it is far too tall for its
// feet, and it moves like a building that has been asked to do something a
// building cannot do. It lurches, it sinks, it rights itself, and it smokes.
// ---------------------------------------------------------------------------

export function buildMeadow(shared) {
  const group = new THREE.Group();
  const rnd = mulberry(2004);

  const turf = makePaintMaterial(shared, { color: '#6f9a44', shadowTint: '#2c4630', rim: 0.5, bands: 3, grain: 0.2, grainScale: 0.5, sway: 0.02, translucency: 0.8 });
  const turfD = makePaintMaterial(shared, { color: '#5b8a3d', shadowTint: '#25402c', rim: 0.5, bands: 3, grain: 0.22, grainScale: 0.42 });
  const snow = makePaintMaterial(shared, { color: '#eef2f6', shadowTint: '#8fa4bc', rim: 0.9, bands: 3, grain: 0.1 });
  const rockM = makePaintMaterial(shared, { color: '#7d8390', shadowTint: '#333a46', rim: 0.7, bands: 3, grain: 0.2 });
  const ironM = makePaintMaterial(shared, { color: '#5d4b3c', shadowTint: '#1c1720', rim: 1.1, bands: 3, grain: 0.24, grainScale: 1.4 });
  const plateM = makePaintMaterial(shared, { color: '#7a6a52', shadowTint: '#231d24', rim: 1.0, bands: 3, grain: 0.22 });
  const roofM = makePaintMaterial(shared, { color: '#8c4b3a', shadowTint: '#2c1620', rim: 1.0, bands: 3, grain: 0.16, side: THREE.DoubleSide });
  const glassM = makeGlowMaterial(shared, '#ffd48a', 1.05, { flicker: 0.06 });

  // =========================================================================
  // The bowl: raised turf either side, dipping to a lake the world fills in
  // =========================================================================
  for (const side of [-1, 1]) {
    for (let i = 0; i < 20; i++) {
      const z = -120 - i * 132;
      // The lake is not a thing you build — it is turf you decline to lay.
      // The world already floats on water; leave a bay open and it fills.
      // and it goes at the FAR end, not across the station — a lake where the
      // train stops means the region you came to see is on the other side of it
      const bay = side < 0 && z < -2020 && z > -2640;
      const inner = bay ? 330 : 13;
      const b = new THREE.Mesh(box(1, 1, 1), i % 3 ? turf : turfD);
      const w = 220 + rnd() * 300;
      b.position.set(side * (inner + w / 2), 0.3 + rnd() * 0.5, z);
      b.scale.set(w, 2.4, 132 + rnd() * 30);
      group.add(b);
    }
  }

  // ---- the far tops, with snow on them ----
  [[-1500, -2200, 620, 340], [1250, -2600, 700, 400], [-2400, -3000, 800, 460], [400, -3400, 900, 520]]
    .forEach(([x, z, r, h], i) => {
      const m = new THREE.Mesh(hill(r, h, 31 + i, { rough: 0.44, rings: 16, sectors: 24 }), rockM);
      m.position.set(x, -40, z); group.add(m);
      const cap = new THREE.Mesh(hill(r * 0.42, h * 0.34, 91 + i, { rough: 0.3 }), snow);
      cap.position.set(x, -40 + h * 0.66, z); group.add(cap);
    });

  // =========================================================================
  // The flowers. Millions is the grass's job; here it only has to be enough
  // that the green never shows through clean.
  // =========================================================================
  {
    const petal = (() => {
      const parts = [];
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const g = new THREE.PlaneGeometry(0.16, 0.30, 1, 1).toNonIndexed();
        g.translate(0, 0.16, 0);
        g.rotateX(-1.15);
        g.rotateY(a);
        parts.push(g);
      }
      const stem = new THREE.CylinderGeometry(0.012, 0.018, 0.42, 4);
      stem.translate(0, 0.21, 0);
      parts.push(stem.toNonIndexed());
      return mergePN(parts);
    })();
    const COLOURS = ['#f0e9a8', '#e8f0f4', '#d8a0c8', '#e8b45c', '#c8dcf0'];
    // Two ranges, because a flower is only a flower for about eighty metres.
    // Near, they are geometry. Far, they are drifts of colour lying flat on
    // the turf — which is exactly what a meadow looks like from a train.
    const patchGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    COLOURS.forEach((c) => {
      const mat = makePaintMaterial(shared, {
        color: c, shadowTint: '#4a5540', rim: 0.9, bands: 2, grain: 0.14,
        side: THREE.DoubleSide, sway: 0.06, translucency: 1.3,
      });
      const items = [];
      for (let i = 0; i < 9000; i++) {
        const side = rnd() > 0.5 ? 1 : -1;
        const x = side * (14 + Math.pow(rnd(), 1.7) * 170);
        const z = -110 - rnd() * 1900;
        const s = 0.8 + rnd() * 1.1;
        items.push({ pos: [x, 1.5, z], rot: [0, rnd() * 6.28, 0], scale: [s, s * (0.8 + rnd() * 0.6), s] });
      }
      const m = new THREE.InstancedMesh(petal, mat, items.length);
      fillInstances(m, items); m.frustumCulled = false; group.add(m);

      const flat = makePaintMaterial(shared, {
        color: c, shadowTint: '#4a5540', rim: 0.3, bands: 2, grain: 0.30, grainScale: 0.9,
        // faint and wide. At half opacity and twenty metres across these read
        // as coloured paper dropped on the grass, not as flowers in it.
        transparent: true, opacity: 0.20, depthWrite: false,
      });
      const drifts = [];
      for (let i = 0; i < 90; i++) {
        const side = rnd() > 0.5 ? 1 : -1;
        const w = 46 + rnd() * 150;
        drifts.push({
          pos: [side * (20 + Math.pow(rnd(), 0.8) * 470), 1.62, -140 - rnd() * 2500],
          rot: [0, rnd() * 6.28, 0], scale: [w, 1, w * (0.5 + rnd() * 1.2)],
        });
      }
      const dm = new THREE.InstancedMesh(patchGeo, flat, drifts.length);
      fillInstances(dm, drifts); dm.frustumCulled = false; dm.renderOrder = 2; group.add(dm);
    });
  }

  // =========================================================================
  // The castle
  // =========================================================================
  const castle = new THREE.Group();
  const legs = [];
  {
    // the mass: a fat drum with a great many wrong things bolted to it
    const body = new THREE.Mesh(box(30, 26, 34), plateM);
    body.position.y = 26; castle.add(body);
    const belly = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 9), ironM);
    belly.scale.set(19, 13, 22); belly.position.y = 20; castle.add(belly);

    // the face: a beaked porch and two round windows, because the film's
    // castle is a face and everybody sees it whether or not they mean to
    const beak = new THREE.Mesh(new THREE.ConeGeometry(7.5, 15, 5), plateM);
    beak.rotation.x = -Math.PI / 2; beak.rotation.z = 0.2;
    beak.position.set(0, 22, 21); castle.add(beak);
    for (const sx of [-8.5, 8.5]) {
      const eye = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 1.4, 10), glassM);
      eye.rotation.x = Math.PI / 2;
      eye.position.set(sx, 32, 17.4); castle.add(eye);
      const brow = new THREE.Mesh(box(11, 2.0, 2.0), ironM);
      brow.position.set(sx, 37.5, 17.4); brow.rotation.z = sx > 0 ? -0.16 : 0.16;
      castle.add(brow);
    }

    // turrets, sheds, a dovecote, and four chimneys of different heights
    const bits = [
      [-15, 40, -6, 11, 16, 11], [13, 44, 4, 9, 20, 9], [2, 46, -14, 14, 12, 12],
      [-6, 54, 2, 8, 13, 8], [18, 34, -12, 8, 10, 8], [-19, 30, 10, 7, 9, 7],
    ];
    bits.forEach(([x, y, z, w, h, d], i) => {
      const b = new THREE.Mesh(box(w, h, d), i % 2 ? plateM : ironM);
      b.position.set(x, y, z); b.rotation.y = (i * 0.37) % 1;
      castle.add(b);
      const r = new THREE.Mesh(new THREE.ConeGeometry(w * 0.82, h * 0.45, 4, 1), roofM);
      r.rotation.y = Math.PI / 4 + ((i * 0.37) % 1);
      r.position.set(x, y + h / 2 + h * 0.22, z);
      castle.add(r);
      const win = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.3, h * 0.28), glassM);
      win.position.set(x + w * 0.51, y, z); win.rotation.y = Math.PI / 2;
      castle.add(win);
    });
    const chims = [[-10, 62, -8, 16], [6, 66, -3, 20], [16, 58, 8, 13], [-18, 56, 6, 11]];
    chims.forEach(([x, y, z, h]) => {
      const c = new THREE.Mesh(box(3.2, h, 3.2), ironM);
      c.position.set(x, y + h / 2 - 8, z); castle.add(c);
    });

    // the legs: four stubby ones, far too small, which is the joke
    for (let i = 0; i < 4; i++) {
      const lx = (i % 2 ? 1 : -1) * 11;
      const lz = (i < 2 ? 1 : -1) * 13;
      const leg = new THREE.Group();
      leg.position.set(lx, 12, lz);
      const thigh = new THREE.Mesh(box(5.5, 12, 5.5), ironM);
      thigh.position.y = -5; leg.add(thigh);
      const foot = new THREE.Mesh(box(9, 3.2, 12), ironM);
      foot.position.y = -12.4; leg.add(foot);
      castle.add(leg);
      legs.push({ g: leg, ph: i * 1.57 });
    }
  }
  castle.scale.setScalar(1.9);
  group.add(castle);

  // its smoke
  const puffMat = makePaintMaterial(shared, {
    color: '#c8c4bc', shadowTint: '#6a6a70', rim: 0.5, bands: 2, grain: 0.2, grainScale: 0.4,
    transparent: true, opacity: 0.60, depthWrite: false,
  });
  const puffs = [];
  for (let i = 0; i < 26; i++) puffs.push({ ph: i / 26, s: 3 + rnd() * 5, o: (rnd() - 0.5) * 8 });
  const puffMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), puffMat, puffs.length);
  puffMesh.frustumCulled = false; puffMesh.renderOrder = 12; group.add(puffMesh);

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(),
        sv = new THREE.Vector3(), pv = new THREE.Vector3();

  function update(t) {
    // it walks the skyline, slowly, and never quite arrives
    // it walks a beat of the line, not the whole of it: a castle that has
    // wandered three kilometres off is a castle nobody at the station sees
    // it walks a beat centred on the station, so the thing the region exists
    // for is in the window most of the time rather than half of it
    const walk = (t * 5.0) % 900;
    const bx = -470, bz = -1180 - walk;
    const step = t * 1.15;
    const lurch = Math.sin(step) * 0.055 + Math.sin(step * 2.13) * 0.022;
    castle.position.set(bx, 14 + Math.abs(Math.sin(step)) * 3.2, bz);
    castle.rotation.set(Math.sin(step * 0.9 + 1) * 0.035, 1.55, lurch);
    legs.forEach(({ g, ph }) => {
      g.position.y = 12 + Math.max(0, Math.sin(step * 2 + ph)) * 5.5;
      g.rotation.x = Math.sin(step * 2 + ph) * 0.30;
    });

    puffs.forEach((p, i) => {
      const a = (t * 0.11 + p.ph) % 1;
      const s = p.s * (0.4 + a * 2.4);
      pv.set(
        bx + p.o - a * 42 * 0.4,
        26 + a * 74,
        bz - 6 + Math.sin(a * 5 + p.ph * 9) * 7,
      );
      e.set(a * 2, p.ph * 6, a * 1.3);
      q.setFromEuler(e);
      sv.set(s, s * 0.8, s);
      m4.compose(pv, q, sv);
      puffMesh.setMatrixAt(i, m4);
    });
    puffMesh.instanceMatrix.needsUpdate = true;
  }
  update(0);

  return { group, update };
}
