import * as THREE from 'three';
import { box, mulberry, mergePN } from './geo.js';
import { pal, put } from '../places/kit.js';
import { makeGlowMaterial } from './paintMaterial.js';
import { shoreGround, beastGeo } from './nearshore.js';
import { figureGeo } from './life.js';

// ---------------------------------------------------------------------------
// The moments.
//
// Eddie: "it's the major things that happened in the story that make them
// special... we should add the mementoes to them as well, like the events in
// each movie that are significant."
//
// A country already has its subject on the near shore — the house, the town,
// the tower. What it does not have is the thing that HAPPENED there. Nobody
// remembers Howl's meadow; they remember a castle walking across it. Nobody
// remembers the bus stop; they remember waiting at one in the rain and
// something enormous arriving. A place is scenery. A moment is a memory.
//
// So each of these is one event, staged where the window already looks, and it
// is always MOVING — because the difference between the shot and a postcard of
// the shot is entirely that the thing is going somewhere while you watch.
//
// Three pieces of machinery serve all of them, and will serve the ones still
// to come:
//
//   flier    — geometry carried along a smooth curve, banking into its turns
//   strider  — something big carried on legs that take turns and bend
//   swarm    — many small things on their own orbits, flapping
//
// Everything is authored against station z = 0 and slid into the running order
// by the caller, exactly like the near shore it stands on.
// ---------------------------------------------------------------------------

// ===========================================================================
// Machinery
// ===========================================================================

// A path through the air. A polyline is enough for a crowd walking a street —
// heading is constant along each leg and a walker does not care. It is not
// enough for anything that flies, because a flier reads almost entirely as
// BANK: the roll into a turn is the whole gesture, and a polyline changes
// heading in a single frame, which gives you a flick instead. So a flight path
// is a spline, and the roll comes from how fast the heading is changing.
//
// Points are [x, z, y], to match every other path in this project.
function flightPath(pts, closed = true) {
  return new THREE.CatmullRomCurve3(
    pts.map(p => new THREE.Vector3(p[0], p[2] ?? 0, p[1])), closed, 'catmullrom', 0.5);
}

function smooth(x, a, b) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function flier(obj, pts, opts = {}) {
  const {
    speed = 34, bank = 1, bob = 0, phase = 0, closed = true,
    fade = false, scale = 1, lean = 26,
  } = opts;
  const curve = flightPath(pts, closed);
  const len = curve.getLength();
  const p = new THREE.Vector3(), t1 = new THREE.Vector3(), t2 = new THREE.Vector3();
  obj.rotation.order = 'YXZ';
  let roll = 0;
  return {
    group: obj,
    update(t) {
      let u = (t * speed / len + phase) % 1;
      if (u < 0) u += 1;
      curve.getPointAt(u, p);
      curve.getTangentAt(u, t1);
      curve.getTangentAt((u + 0.008) % 1, t2);
      obj.position.set(p.x, p.y + Math.sin(t * 1.1 + phase * 17) * bob, p.z);
      const h = Math.atan2(t1.x, t1.z);
      let dh = Math.atan2(t2.x, t2.z) - h;
      while (dh > Math.PI) dh -= 6.2832;
      while (dh < -Math.PI) dh += 6.2832;
      // An aircraft banks INTO a turn and comes out of it slowly. Rolling
      // instantly to the turn rate reads as a twitch, so the roll chases it.
      roll += (Math.max(-1.1, Math.min(1.1, dh * lean)) * bank - roll) * 0.06;
      obj.rotation.set(-Math.asin(Math.max(-1, Math.min(1, t1.y))), h, -roll);
      // An open path has two ends. Rather than snap back to the start in plain
      // sight, it arrives out of the haze and is gone again — which is what
      // the things on these paths do anyway.
      const s = scale * (fade ? Math.min(smooth(u, 0, 0.07), smooth(u, 1, 0.9)) : 1);
      obj.scale.setScalar(s);
      obj.visible = s > 0.02;
    },
  };
}

// Legs. What makes a thing WALK rather than slide is three cheap facts: the
// legs take turns, the knee bends only on the swing, and the body heaves once
// per step. Given those, a heap of geometry on four sticks is alive at any
// distance — and without them the best model in the world is a boat.
//
// hips are [x, z, phase] in the body's own frame. Phase is what makes a gait:
// a diagonal pair for four legs, a travelling wave for a dozen.
function legRig(mat, { hips, len, thick, knee = 'forward' }) {
  const g = new THREE.Group();
  const parts = [];
  const back = knee === 'back' ? -1 : 1;
  hips.forEach(([hx, hz, ph]) => {
    const hip = new THREE.Group();
    hip.position.set(hx, 0, hz);
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(thick, thick * 0.82, len * 0.5, 6), mat);
    thigh.position.y = -len * 0.25; hip.add(thigh);
    const kn = new THREE.Group(); kn.position.y = -len * 0.5; hip.add(kn);
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(thick * 0.72, thick * 0.5, len * 0.5, 6), mat);
    shin.position.y = -len * 0.25; kn.add(shin);
    const foot = new THREE.Mesh(box(thick * 2.4, thick * 1.0, thick * 4.2), mat);
    foot.position.set(0, -len * 0.5, thick * 1.1); kn.add(foot);
    g.add(hip);
    parts.push({ hip, knee: kn, ph });
  });
  return { group: g, parts, back };
}

// A body on legs, carried along a path. The path is the same spline the fliers
// use, so a thing that walks can also turn properly.
function strider(obj, rig, pts, opts = {}) {
  const {
    speed = 6, stride = 3.0, swing = 0.42, knee = 0.8,
    heave = 0.3, sway = 0.04,
  } = opts;
  const f = flier(obj, pts, { ...opts, bank: opts.bank ?? 0, bob: 0 });
  return {
    group: obj,
    update(t) {
      f.update(t);
      const s = t * speed / stride;
      rig.parts.forEach((L) => {
        const a = s * Math.PI * 2 + L.ph;
        L.hip.rotation.x = Math.sin(a) * swing;
        // The knee only bends on the return stroke. A leg that bends while it
        // is pushing is a leg carrying nothing.
        L.knee.rotation.x = Math.max(0, Math.cos(a)) * knee * rig.back;
      });
      obj.position.y += Math.abs(Math.sin(s * Math.PI)) * heave;
      obj.rotation.z += Math.sin(s * Math.PI * 2) * sway;
    },
  };
}

// A bird, seen from any distance a bird is ever seen from: a body and a bar of
// wing with a little dihedral. The wings do not articulate — the SPAN narrows
// and widens, which is exactly what flapping looks like once it is more than a
// few metres away, and it costs one instanced mesh for a whole flock.
function birdGeo() {
  const parts = [];
  const b = new THREE.SphereGeometry(0.17, 6, 5);
  b.scale(1, 0.9, 2.4); parts.push(b.toNonIndexed());
  for (const s of [-1, 1]) {
    const w = box(1.6, 0.06, 0.44);
    w.translate(s * 0.86, 0.05, -0.06);
    w.rotateZ(s * -0.20);
    parts.push(w.toNonIndexed());
  }
  const tail = box(0.30, 0.05, 0.5); tail.translate(0, 0.03, -0.5);
  parts.push(tail.toNonIndexed());
  return mergePN(parts);
}

function swarm(mat, opts = {}) {
  const {
    n = 20, at = [0, 0], y = 20, r = 40, rise = 8, speed = 0.32,
    size = 1, seed = 5, flap = 6.5,
  } = opts;
  const rnd = mulberry(seed);
  const birds = [];
  for (let i = 0; i < n; i++) {
    birds.push({
      r: r * (0.35 + rnd() * 0.85),
      a: rnd() * 6.28,
      w: speed * (0.7 + rnd() * 0.7) * (rnd() < 0.25 ? -1 : 1),
      y: y + (rnd() - 0.5) * rise,
      s: size * (0.7 + rnd() * 0.6),
      ph: rnd() * 6.28,
    });
  }
  const mesh = new THREE.InstancedMesh(birdGeo(), mat, n);
  mesh.frustumCulled = false;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const p = new THREE.Vector3(), sv = new THREE.Vector3();
  return {
    group: mesh,
    update(t) {
      birds.forEach((b, i) => {
        const a = b.a + t * b.w;
        p.set(at[0] + Math.cos(a) * b.r, b.y + Math.sin(t * 0.6 + b.ph) * 2.4, at[1] + Math.sin(a) * b.r);
        e.set(0, -a + (b.w > 0 ? Math.PI / 2 : -Math.PI / 2), Math.sin(t * flap + b.ph) * 0.4);
        q.setFromEuler(e);
        sv.set(b.s * (0.32 + Math.abs(Math.cos(t * flap + b.ph)) * 0.78), b.s, b.s);
        m.compose(p, q, sv);
        mesh.setMatrixAt(i, m);
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

// A procession: many things spaced evenly along one path, all going the same
// way at the same speed.
//
// This is the shape of half the moments left to build — a parade through a
// town, a slavers' wagon and the file behind it, a hillside of transformed
// shapes at night, a court of cats crossing at midnight, a company coming down
// out of a cloud. A crowd on a RING is milling and a crowd on a street is
// pacing; only a column on a route is going somewhere, and every one of these
// is a crowd with somewhere to be.
//
// kinds are [{ geo, mat, of, y, scale, spin, bob }] where `of(i, n)` picks which
// places in the line get that kind — so a band at the front, a flag every sixth
// marcher and one carriage in the middle are three lines of predicate rather
// than three loops.
function procession(kinds, pts, opts = {}) {
  const {
    n = 24, speed = 1.1, spacing = 2.6, width = 2.2, seed = 5,
    fade = true, closed = false, sway = 0.06, march = 1.0,
  } = opts;
  const curve = flightPath(pts, closed);
  const len = curve.getLength();
  const rnd = mulberry(seed);
  const g = new THREE.Group();

  const slots = [];
  for (let i = 0; i < n; i++) {
    slots.push({ off: i * spacing, side: (rnd() - 0.5) * width, ph: rnd() * 6.28, k: -1 });
  }
  const meshes = kinds.map((kind, ki) => {
    const idx = [];
    slots.forEach((s, i) => { if (s.k < 0 && kind.of(i, n)) { s.k = ki; idx.push(i); } });
    if (!idx.length) return null;
    const m = new THREE.InstancedMesh(kind.geo, kind.mat, idx.length);
    m.frustumCulled = false;
    if (kind.ro) m.renderOrder = kind.ro;
    g.add(m);
    return { kind, idx, mesh: m };
  }).filter(Boolean);

  const mm = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const p = new THREE.Vector3(), t1 = new THREE.Vector3(), sv = new THREE.Vector3();

  return {
    group: g,
    update(t) {
      const head = t * speed;
      meshes.forEach(({ kind, idx, mesh }) => {
        idx.forEach((si, k) => {
          const s = slots[si];
          let u = ((head - s.off) / len) % 1;
          if (u < 0) u += 1;
          curve.getPointAt(u, p);
          curve.getTangentAt(u, t1);
          const h = Math.atan2(t1.x, t1.z);
          // step sideways from the centre line, so a column has a width
          p.x += Math.cos(h) * s.side;
          p.z -= Math.sin(h) * s.side;
          p.y += (kind.y ?? 0) + Math.abs(Math.sin(t * 3.1 * march + s.ph)) * (kind.bob ?? 0.06);
          e.set(0, h + (kind.spin ? t * kind.spin : 0), Math.sin(t * 2.2 + s.ph) * sway);
          q.setFromEuler(e);
          const f = fade ? Math.min(smooth(u, 0, 0.06), smooth(u, 1, 0.93)) : 1;
          sv.setScalar((kind.scale ?? 1) * f);
          mm.compose(p, q, sv);
          mesh.setMatrixAt(k, mm);
        });
        mesh.instanceMatrix.needsUpdate = true;
      });
    },
  };
}

// Smoke. A stack of puffs that rise, spread, drift downwind and are replaced —
// the one thing that tells you a chimney is a working chimney and not a pipe.
function smokeStack(mat, opts = {}) {
  const { n = 24, at = [0, 0, 0], r = 2.4, rise = 30, drift = [10, 4], rate = 0.16, seed = 3 } = opts;
  const rnd = mulberry(seed);
  // Puffs must OVERLAP. Evenly spaced spheres on a line read as a string of
  // beads going up out of a chimney, which is what the first pass looked like —
  // so each one gets its own speed, its own lateral wander and its own size,
  // and there are enough of them that the column is never see-through.
  const puffs = [];
  for (let i = 0; i < n; i++) {
    puffs.push({
      t0: rnd(), wob: rnd() * 6.28, sp: 0.7 + rnd() * 0.7,
      k: 0.65 + rnd() * 0.8, ox: (rnd() - 0.5) * 2.0, oz: (rnd() - 0.5) * 2.0,
    });
  }
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), mat, n);
  mesh.frustumCulled = false;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const p = new THREE.Vector3(), sv = new THREE.Vector3();
  return {
    group: mesh,
    update(t) {
      puffs.forEach((f, i) => {
        const u = (t * rate * f.sp + f.t0) % 1;
        p.set(
          at[0] + f.ox + drift[0] * u * u + Math.sin(u * 3.4 + f.wob) * 3.0 * u,
          at[1] + rise * u,
          at[2] + f.oz + drift[1] * u * u + Math.cos(u * 2.8 + f.wob) * 3.0 * u,
        );
        // grows as it rises, then thins away rather than blinking out
        const s = r * f.k * (0.35 + u * 2.9) * (1 - smooth(u, 0.68, 1.0));
        sv.set(s, s * 0.82, s);
        e.set(0, f.wob, u * 0.6); q.setFromEuler(e);
        m.compose(p, q, sv);
        mesh.setMatrixAt(i, m);
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

// ===========================================================================
// The subjects
// ===========================================================================

// ---- the Catbus -----------------------------------------------------------
//
// It is a bus and it is a cat, and the joke only lands if BOTH readings survive
// at a distance: the body has to be a long slab with a row of lit windows, and
// the front has to be a face. Everything else — the too many legs, the tail,
// the ears — is confirmation.
function catbus(M) {
  const g = new THREE.Group();
  const L = 16, H = 4.4, W = 4.0;
  // A tabby, not a shadow. In a country that is permanently night and rain,
  // anything painted the colour of a wet field simply is not there.
  const fur = M.tabby;

  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), fur);
  body.scale.set(W * 0.5, H * 0.5, L * 0.5);
  body.position.y = H * 0.5; g.add(body);
  // the destination board on the brow, which is the other half of the joke
  const board = new THREE.Mesh(box(2.6, 0.7, 0.14), M.sign);
  board.position.set(0, H * 0.86, L * 0.44); g.add(board);

  // the face: two lamps of eyes and a grin. At night in rain this is most of
  // what you see of it — but at full strength it is ALL you see, a floating
  // lantern face with no bus behind it, so the eyes are held back far enough
  // for the shape to survive them.
  const eyeM = M.warm(1.9, '#ffe27a');
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.60, 10, 8), eyeM);
    e.scale.set(1, 0.86, 0.6);
    e.position.set(s * 1.1, H * 0.66, L * 0.47); e.renderOrder = 9; g.add(e);
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.7, 5), fur);
    ear.position.set(s * 1.3, H * 1.02, L * 0.28); ear.rotation.x = -0.2; g.add(ear);
  }
  const grin = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.16, 5, 14, Math.PI), M.pale);
  grin.rotation.set(0, 0, Math.PI);
  grin.position.set(0, H * 0.40, L * 0.49); g.add(grin);

  // The row of lit windows down the flank — the bus half of the joke, and the
  // only thing that gives the body a LENGTH at night. They have to sit on the
  // hull, not inside it: the first pass put them at 0.46 of the width, which
  // is a finger inside an ellipsoid of half-width 0.5, so every one of them was
  // buried and the Catbus arrived as a face with nothing behind it.
  const win = M.warm(1.6, '#ffc86e');
  const wins = [];
  for (let i = 0; i < 6; i++) {
    const z = -L * 0.30 + i * (L * 0.13);
    const k = Math.sqrt(Math.max(0.15, 1 - (z / (L * 0.5)) ** 2));   // the hull's own curve
    for (const s of [-1, 1]) {
      wins.push({
        pos: [s * (W * 0.5 * k + 0.06), H * 0.60, z],
        rot: [0, s > 0 ? Math.PI / 2 : -Math.PI / 2, 0],
        scale: [1.5, 1.2, 1],
      });
    }
  }
  put(g, wins, new THREE.PlaneGeometry(1, 1), win, 9);

  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.16, 5.5, 6), fur);
  tail.rotation.x = 1.15; tail.position.set(0, H * 0.72, -L * 0.60); g.add(tail);

  // twelve legs, in a travelling wave. Six a side is what it has and what it
  // needs — four legs under a sixteen-metre body is a table.
  const hips = [];
  for (let i = 0; i < 6; i++) {
    for (const s of [-1, 1]) {
      hips.push([s * W * 0.34, -L * 0.32 + i * (L * 0.13), (i / 6) * Math.PI * 4 + (s > 0 ? Math.PI : 0)]);
    }
  }
  const rig = legRig(fur, { hips, len: 2.6, thick: 0.22 });
  rig.group.position.y = 1.6;
  g.add(rig.group);
  return { group: g, rig };
}

// ---- Totoro at the stop ---------------------------------------------------
//
// Not a portrait. A big dark rounded mass, a pale front, two small ears, and an
// umbrella held at the wrong height for its own body — which is the whole
// picture, and it works because he is standing next to a bus stop sign in the
// rain and nothing else in this world is that shape.
function watcher(M) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), M.fur);
  b.scale.set(1.5, 1.9, 1.35); b.position.y = 1.95; g.add(b);
  // The pale front is a marking, not a shirt — narrow, low, and only a shade
  // lighter than the coat. At full width and full contrast it reads from a
  // train as a white blob standing in a field.
  const belly = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), M.chest);
  belly.scale.set(0.72, 1.05, 0.5); belly.position.set(0, 1.55, 1.02); g.add(belly);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.85, 5), M.fur);
    ear.position.set(s * 0.62, 3.75, -0.1); ear.rotation.z = s * 0.22; g.add(ear);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 1.3, 6), M.fur);
    arm.rotation.z = s * 0.5; arm.position.set(s * 1.45, 1.75, 0.2); g.add(arm);
  }
  // the umbrella, held far too high
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 5), M.dark);
  shaft.position.set(1.75, 3.3, 0.2); g.add(shaft);
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.75, 12), M.dark);
  canopy.position.set(1.75, 4.5, 0.2); g.add(canopy);
  return g;
}

// ---- Howl's castle --------------------------------------------------------
//
// It is not a castle. It is a heap: a wedge of scavenged roofs and iron with a
// face bolted to the front, four chimneys, and a lot of things that should not
// be attached to a building. The read is the SILHOUETTE — top-heavy, lopsided,
// leaning forward, on legs far too thin for it.
function movingCastle(M) {
  const g = new THREE.Group();
  const rnd = mulberry(2004);
  const iron = M.iron, wall = M.wall, roof = M.roof;

  // the mass, built as a stack of misaligned blocks that gets narrower and
  // more chaotic upward — which is how a heap reads and a tower does not
  const main = new THREE.Mesh(box(24, 15, 20), wall);
  main.position.y = 21; g.add(main);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 9), iron);
  belly.scale.set(13, 7, 11); belly.position.y = 14.5; g.add(belly);
  for (let i = 0; i < 7; i++) {
    const w = 16 - i * 1.7, h = 4 + rnd() * 4;
    const blk = new THREE.Mesh(box(w, h, w * 0.85), i % 2 ? wall : roof);
    blk.position.set((rnd() - 0.5) * 7, 28 + i * 4.4, (rnd() - 0.5) * 6);
    blk.rotation.y = (rnd() - 0.5) * 0.6; g.add(blk);
  }
  // four chimneys of different heights, because two is a factory and four is
  // a household that keeps adding rooms
  const stacks = [];
  for (let i = 0; i < 4; i++) {
    const hgt = 8 + rnd() * 9;
    const x = -6 + rnd() * 12, z = -5 + rnd() * 10;
    const c = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.4, hgt, 7), iron);
    c.position.set(x, 56 + hgt * 0.5, z); g.add(c);
    stacks.push([x, 56 + hgt, z]);
  }
  // turrets and junk stuck on the flanks
  for (let i = 0; i < 9; i++) {
    const a = rnd() * 6.28;
    const t = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.2, 5 + rnd() * 5, 6), roof);
    t.position.set(Math.cos(a) * 13, 20 + rnd() * 26, Math.sin(a) * 11);
    t.rotation.z = (rnd() - 0.5) * 0.5; g.add(t);
  }
  // the face: a porch for a mouth, two lit windows for eyes, a long snout
  const eye = M.warm(2.4, '#ffca6a');
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.CircleGeometry(1.5, 12), eye);
    e.position.set(s * 5.2, 25, 10.2); e.renderOrder = 9; g.add(e);
  }
  const mouth = new THREE.Mesh(box(11, 5.5, 3), M.dark);
  mouth.position.set(0, 16.5, 10.5); g.add(mouth);
  const jaw = new THREE.Mesh(box(13, 1.6, 4.5), iron);
  jaw.position.set(0, 13.4, 11.0); g.add(jaw);
  const snout = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.9, 9, 7), iron);
  snout.rotation.x = Math.PI / 2; snout.position.set(-8, 22, 13); g.add(snout);
  // and the porch it walks with, hanging off the back
  const porch = new THREE.Mesh(box(6, 7, 5), M.wood);
  porch.position.set(9, 15, -11); g.add(porch);

  // four legs, thin and bird-kneed, in a diagonal gait
  const rig = legRig(iron, {
    hips: [
      [-7, 7, 0], [7, 7, Math.PI],
      [-7, -7, Math.PI], [7, -7, 0],
    ],
    len: 16, thick: 0.9, knee: 'back',
  });
  rig.group.position.y = 16;
  g.add(rig.group);
  return { group: g, rig, stacks };
}

// ---- the Deer God ---------------------------------------------------------
//
// A shape with far too many points on its head, twice the height of anything
// else, walking so slowly you are never quite sure it moved. It used to stand
// here and never move at all, which is a statue of the shot rather than the
// shot itself.
function deerGod(M) {
  const g = new THREE.Group();
  const glow = M.cool(0.55, '#cfe4d2');
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 9), glow);
  body.scale.set(1.1, 1.5, 2.4); body.position.y = 4.6; g.add(body);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.5, 2.6, 7), glow);
  neck.rotation.x = 0.5; neck.position.set(0, 6.0, 2.6); g.add(neck);
  const head = new THREE.Group(); head.position.set(0, 7.0, 3.5); g.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.72, 9, 7), M.paper);
  skull.scale.set(0.9, 0.95, 1.5); head.add(skull);
  // the antlers: far too many tines, which is the entire silhouette
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    const len = 1.6 + (i % 5) * 0.75;
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, len, 5), M.paper);
    t.position.set(Math.sin(a) * 0.7, 0.7 + len * 0.42, Math.cos(a) * 0.5 - 0.3);
    t.rotation.set(Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.7);
    head.add(t);
  }
  const rig = legRig(glow, {
    hips: [[-0.9, 1.5, 0], [0.9, 1.5, Math.PI], [-0.9, -1.5, Math.PI], [0.9, -1.5, 0]],
    len: 4.6, thick: 0.16,
  });
  rig.group.position.y = 4.6;
  g.add(rig.group);
  return { group: g, rig, head };
}

// ---- Kiki ------------------------------------------------------------------
//
// At three hundred metres she is a horizontal stick with somebody sitting on
// it, leaning. What makes it HER and not a bird is the bow — a round mass at
// the top of the head that is nearly as wide as the head — and the skirt
// flaring behind, and a second small dark shape sitting further back.
function onABroom(M) {
  const g = new THREE.Group();
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 4.4, 6), M.wood);
  stick.rotation.x = Math.PI / 2; g.add(stick);
  const bristle = new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.5, 7), M.straw);
  bristle.rotation.x = Math.PI / 2; bristle.position.z = -2.7; g.add(bristle);

  const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.5, 9), M.dress);
  skirt.rotation.x = -0.5; skirt.position.set(0, 0.42, -0.42); g.add(skirt);
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.30, 0.72, 8), M.dress);
  torso.position.set(0, 0.86, 0.16); torso.rotation.x = 0.25; g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 9, 7), M.hair);
  head.position.set(0, 1.34, 0.28); g.add(head);
  // the bow, which is the whole recognition
  const bow = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 6), M.ribbon);
  bow.scale.set(1.9, 0.7, 0.7); bow.position.set(0, 1.50, 0.18); g.add(bow);
  // the delivery, in a satchel hanging off the stick
  const bag = new THREE.Mesh(box(0.5, 0.44, 0.36), M.straw);
  bag.position.set(0.28, -0.28, -0.3); g.add(bag);
  // and the cat, sitting further back and not enjoying it
  const cat = new THREE.Mesh(new THREE.SphereGeometry(0.20, 8, 6), M.hair);
  cat.scale.set(0.8, 1.0, 1.2); cat.position.set(0, 0.36, -1.35); g.add(cat);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 4), M.hair);
    ear.position.set(s * 0.09, 0.55, -1.35); g.add(ear);
  }
  return g;
}

// ---- the Mehve -------------------------------------------------------------
//
// A single white crescent wing with a person lying along the top of it. There
// is no fuselage and no tail, and that absence is the whole design — a wing
// with nothing hanging under it does not look like any other aircraft.
function jetWing(M) {
  const g = new THREE.Group();
  const wing = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 6), M.pale);
  wing.scale.set(7.0, 0.30, 1.9); g.add(wing);
  // the sweep: two thinner outer panels raked back, which is what turns an
  // oval into a crescent
  for (const s of [-1, 1]) {
    const tip = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 5), M.pale);
    tip.scale.set(3.2, 0.20, 1.1);
    tip.position.set(s * 6.4, 0.05, -1.0);
    tip.rotation.y = s * -0.34; g.add(tip);
  }
  const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.24, 2.6, 8), M.pale);
  pod.rotation.x = Math.PI / 2; pod.position.set(0, -0.20, -0.6); g.add(pod);
  // the pilot, prone, holding the bar
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.20, 1.5, 7), M.dress);
  p.rotation.x = Math.PI / 2; p.position.set(0, 0.36, -0.1); g.add(p);
  const hd = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), M.hair);
  hd.position.set(0, 0.46, 0.85); g.add(hd);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 5), M.iron);
  bar.rotation.z = Math.PI / 2; bar.position.set(0, 0.28, 0.95); g.add(bar);
  return g;
}

// ---- an Ohmu ---------------------------------------------------------------
//
// A segmented armoured shell the size of a house, with a bank of eyes at the
// front that are blue when it is calm. What makes it terrible is scale and
// slowness — it must be bigger than the buildings and move like weather.
function ohmu(M) {
  const g = new THREE.Group();
  const L = 46, W = 17, H = 15;
  const shell = M.shell;
  // segments, largest at the shoulder and tapering both ways
  for (let i = 0; i < 9; i++) {
    const u = i / 8;
    const k = Math.sin(Math.PI * (0.25 + u * 0.7));
    const seg = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8, 0, 6.283, 0, 1.7), shell);
    seg.scale.set(W * 0.5 * k, H * k, L * 0.09);
    seg.position.set(0, 0, L * 0.42 - u * L * 0.86);
    g.add(seg);
  }
  // the eyes: two banks of seven, and they are the only thing that reads at
  // distance, so they glow
  const eye = M.cool(2.6, '#7fd0ff');
  for (const s of [-1, 1]) {
    for (let i = 0; i < 7; i++) {
      const a = (i / 6 - 0.5) * 1.5;
      const e = new THREE.Mesh(new THREE.SphereGeometry(1.15, 9, 7), eye);
      e.position.set(s * (2.4 + Math.abs(a) * 3.4), H * 0.42 + Math.cos(a) * 2.2, L * 0.44 - Math.abs(a) * 1.6);
      e.renderOrder = 9; g.add(e);
    }
  }
  // the feelers
  for (const s of [-1, 1]) {
    const f = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.1, 12, 6), shell);
    f.rotation.set(-0.7, 0, s * 0.5);
    f.position.set(s * 3.5, H * 0.5, L * 0.56); g.add(f);
  }
  // fourteen legs, in a wave
  const hips = [];
  for (let i = 0; i < 7; i++) {
    for (const s of [-1, 1]) {
      hips.push([s * W * 0.44, L * 0.30 - i * (L * 0.10), (i / 7) * Math.PI * 4 + (s > 0 ? Math.PI : 0)]);
    }
  }
  const rig = legRig(shell, { hips, len: 6.5, thick: 0.5 });
  rig.group.position.y = 6.0;
  g.add(rig.group);
  return { group: g, rig };
}

// ---- the gardener ----------------------------------------------------------
//
// Tall, thin, round-shouldered, arms down past the knee, a domed head with two
// lit eyes, and moss growing on all of it. It is standing among the ruins and
// it has been standing there a very long time.
function gardener(M) {
  const g = new THREE.Group();
  const mt = M.moss;
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.35, 3.4, 10), mt);
  torso.position.y = 5.4; g.add(torso);
  const chest = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), mt);
  chest.scale.set(1.5, 1.1, 1.2); chest.position.y = 6.9; g.add(chest);
  const head = new THREE.Group(); head.position.y = 8.3; g.add(head);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.15, 12, 9, 0, 6.283, 0, 1.7), mt);
  dome.scale.set(1, 0.9, 1); head.add(dome);
  const jaw = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.95, 0.9, 12), mt);
  jaw.position.y = -0.45; head.add(jaw);
  const eyeM = M.warm(1.4, '#ffd07a');
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.30, 8, 6), eyeM);
    e.position.set(s * 0.52, -0.1, 0.92); e.renderOrder = 9; head.add(e);
  }
  // the ears that fold out flat, which nothing else has
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.16, 10), mt);
    ear.rotation.z = Math.PI / 2; ear.position.set(s * 1.25, -0.1, 0); head.add(ear);
  }
  const arms = [];
  for (const s of [-1, 1]) {
    const sh = new THREE.Group();
    sh.position.set(s * 1.55, 7.1, 0); g.add(sh);
    const up = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.28, 2.6, 7), mt);
    up.position.y = -1.3; sh.add(up);
    const el = new THREE.Group(); el.position.y = -2.6; sh.add(el);
    const lo = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 2.4, 7), mt);
    lo.position.y = -1.2; el.add(lo);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.36, 7, 6), mt);
    hand.position.y = -2.5; el.add(hand);
    arms.push({ sh, el, s });
  }
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.34, 4.2, 8), mt);
    leg.position.set(s * 0.7, 2.1, 0); g.add(leg);
    const foot = new THREE.Mesh(box(1.1, 0.5, 1.8), mt);
    foot.position.set(s * 0.7, 0.25, 0.3); g.add(foot);
  }
  return { group: g, head, arms };
}

// ---- pieces the processions are made of ------------------------------------

// A pole with a banner hanging off it — carried, so it stands on the ground at
// the marcher's feet and the cloth is up where a flag is seen from.
function flagGeo(h = 4.2, w = 1.9) {
  const parts = [];
  const pole = new THREE.CylinderGeometry(0.06, 0.07, h, 5);
  pole.translate(0, h / 2, 0); parts.push(pole.toNonIndexed());
  const cloth = box(w, h * 0.34, 0.05);
  cloth.translate(w / 2 + 0.06, h * 0.76, 0); parts.push(cloth.toNonIndexed());
  return mergePN(parts);
}

// A cart with a cage on it. Wheels, a bed, four uprights and bars — and it is
// the BARS that make it a slaver's wagon rather than a farm cart.
function cageWagonGeo() {
  const parts = [];
  const bed = box(2.6, 0.4, 5.0); bed.translate(0, 1.5, 0); parts.push(bed.toNonIndexed());
  for (const sx of [-1, 1]) for (const sz of [-1.7, 1.7]) {
    const w = new THREE.CylinderGeometry(0.85, 0.85, 0.2, 12);
    w.rotateZ(Math.PI / 2); w.translate(sx * 1.4, 0.85, sz);
    parts.push(w.toNonIndexed());
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const p = box(0.16, 2.4, 0.16);
    p.translate(sx * 1.2, 2.9, sz * 2.3); parts.push(p.toNonIndexed());
  }
  for (let i = 0; i < 9; i++) {
    const b = box(0.09, 2.3, 0.09);
    b.translate(-1.2 + i * 0.3, 2.85, 2.3); parts.push(b.toNonIndexed());
    const b2 = b.clone(); b2.translate(0, 0, -4.6); parts.push(b2);
  }
  const roof = box(2.8, 0.14, 5.0); roof.translate(0, 4.1, 0); parts.push(roof.toNonIndexed());
  const shaft = box(0.14, 0.14, 3.4); shaft.translate(0, 1.5, 3.4); parts.push(shaft.toNonIndexed());
  return mergePN(parts);
}

// A cat standing on its back legs and behaving like a courtier: round head,
// upright ears, a coat to the knee, and a tail held out behind. The ears and
// the tail are the entire recognition — everything else is a small person.
function courtCatGeo(hat = false) {
  const parts = [];
  const coat = new THREE.CylinderGeometry(0.19, 0.34, 0.74, 8);
  coat.translate(0, 0.52, 0); parts.push(coat.toNonIndexed());
  const head = new THREE.SphereGeometry(0.23, 9, 7);
  head.scale(1, 0.92, 0.94); head.translate(0, 1.06, 0.02); parts.push(head.toNonIndexed());
  for (const s of [-1, 1]) {
    const ear = new THREE.ConeGeometry(0.10, 0.24, 4);
    ear.translate(s * 0.13, 1.28, 0); parts.push(ear.toNonIndexed());
    const leg = new THREE.CylinderGeometry(0.06, 0.05, 0.34, 5);
    leg.translate(s * 0.09, 0.17, 0); parts.push(leg.toNonIndexed());
  }
  const tail = new THREE.CylinderGeometry(0.055, 0.03, 0.9, 5);
  tail.rotateX(0.9); tail.translate(0, 0.72, -0.42); parts.push(tail.toNonIndexed());
  if (hat) {
    const crown = new THREE.ConeGeometry(0.20, 0.30, 8);
    crown.translate(0, 1.38, 0); parts.push(crown.toNonIndexed());
  }
  return mergePN(parts);
}

// Something that has half-turned into something else. A body with the wrong
// head on it, an umbrella with a leg, a lantern with a face, a long low thing
// with too many legs — that is a night parade, and the joke only works if the
// shapes are WRONG rather than monstrous.
function oddGeo(which) {
  const parts = [];
  if (which === 'head') {                       // a head five times too big
    const h = new THREE.SphereGeometry(1.4, 12, 9);
    h.scale(1, 1.15, 0.95); h.translate(0, 2.6, 0); parts.push(h.toNonIndexed());
    const b = new THREE.CylinderGeometry(0.42, 0.72, 1.4, 8);
    b.translate(0, 0.7, 0); parts.push(b.toNonIndexed());
    for (const s of [-1, 1]) {
      const l = new THREE.CylinderGeometry(0.11, 0.09, 0.7, 5);
      l.translate(s * 0.2, 0.35, 0); parts.push(l.toNonIndexed());
    }
  } else if (which === 'brolly') {              // an umbrella with one leg
    const c = new THREE.ConeGeometry(1.15, 0.75, 10);
    c.translate(0, 2.5, 0); parts.push(c.toNonIndexed());
    const sh = new THREE.CylinderGeometry(0.07, 0.07, 2.0, 5);
    sh.translate(0, 1.3, 0); parts.push(sh.toNonIndexed());
    const leg = new THREE.CylinderGeometry(0.1, 0.08, 0.9, 5);
    leg.translate(0, 0.45, 0); parts.push(leg.toNonIndexed());
    const foot = box(0.3, 0.12, 0.55); foot.translate(0, 0.06, 0.1);
    parts.push(foot.toNonIndexed());
  } else if (which === 'serpent') {             // a long low thing with a bend
    for (let i = 0; i < 7; i++) {
      const s = new THREE.SphereGeometry(0.48 - i * 0.04, 8, 6);
      s.translate(Math.sin(i * 0.9) * 0.5, 0.75 + Math.sin(i * 1.3) * 0.3, -i * 0.75);
      parts.push(s.toNonIndexed());
    }
    const hd = new THREE.SphereGeometry(0.56, 9, 7);
    hd.scale(0.9, 0.8, 1.4); hd.translate(0, 1.05, 0.7); parts.push(hd.toNonIndexed());
  } else {                                      // a fox with a leaf on its head
    const b = new THREE.SphereGeometry(0.5, 9, 7);
    b.scale(1, 0.9, 1.6); b.translate(0, 0.95, 0); parts.push(b.toNonIndexed());
    const hd = new THREE.SphereGeometry(0.3, 8, 6);
    hd.scale(1.2, 0.9, 1.3); hd.translate(0, 1.35, 0.62); parts.push(hd.toNonIndexed());
    for (const s of [-1, 1]) {
      const ear = new THREE.ConeGeometry(0.13, 0.3, 4);
      ear.translate(s * 0.16, 1.66, 0.5); parts.push(ear.toNonIndexed());
      for (const sz of [-1, 1]) {
        const l = new THREE.CylinderGeometry(0.08, 0.07, 0.65, 5);
        l.translate(s * 0.24, 0.33, sz * 0.5); parts.push(l.toNonIndexed());
      }
    }
    const t = new THREE.CylinderGeometry(0.2, 0.09, 1.1, 6);
    t.rotateX(1.0); t.translate(0, 1.15, -0.9); parts.push(t.toNonIndexed());
  }
  return mergePN(parts);
}

// A paper lantern on a stick, carried. At night on a dark hill a line of these
// IS the parade — the shapes between them are a bonus.
function carriedLanternGeo() {
  const l = new THREE.SphereGeometry(0.34, 9, 7);
  l.scale(1, 1.25, 1); l.translate(0, 2.05, 0);
  return l.toNonIndexed();
}
function lanternStickGeo() {
  const s = new THREE.CylinderGeometry(0.05, 0.05, 2.0, 5);
  s.translate(0, 1.0, 0);
  return s.toNonIndexed();
}

// ===========================================================================
// What happened in each country
// ===========================================================================

const MOMENTS = {

  // ---- My Neighbour Totoro: the rain, the lamp, and what comes down the line
  bus: (shared, G) => {
    const M = pal(shared, {
      fur:   { color: '#5a5048', shadowTint: '#242019', rim: 0.7, bands: 3, grain: 0.26 },
      tabby: { color: '#a8794a', shadowTint: '#4a3222', rim: 1.4, bands: 3, grain: 0.26 },
      chest: { color: '#8a8274', shadowTint: '#3a352c', rim: 0.8, bands: 3, grain: 0.22 },
      pale:  { color: '#d8d0bc', shadowTint: '#585244', rim: 0.9, bands: 3, grain: 0.18 },
      dark:  { color: '#232028', shadowTint: '#0c0a10', rim: 1.0, bands: 3, grain: 0.16 },
      sign:  { color: '#c8bfa6', shadowTint: '#4c4738', rim: 1.0, bands: 3, grain: 0.14 },
      wood:  '#4a3a28',
      iron:  '#3e3e42',
    });
    const g = new THREE.Group(), live = [];
    const { C, top } = G;

    // The stop: a signpost, a round timetable board, and a lamp. It is a lamp
    // in the rain at the edge of a wood, which is the whole scene before
    // anything arrives.
    const sy = top(105, 26) ?? 0;
    const sx = C[0] + 105, sz = C[1] + 26;
    const postG = new THREE.Group(); postG.position.set(sx, sy, sz); g.add(postG);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 3.4, 6), M.wood);
    post.position.y = 1.7; postG.add(post);
    const plate = new THREE.Mesh(new THREE.CircleGeometry(0.85, 14), M.sign);
    plate.position.set(0, 3.3, 0.1); postG.add(plate);
    const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 5.2, 6), M.iron);
    lampPost.position.set(4.5, 2.6, -1.0); postG.add(lampPost);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.62, 10, 8), M.warm(2.6, '#ffd48a'));
    lamp.position.set(4.5, 5.4, -1.0); lamp.renderOrder = 9; postG.add(lamp);
    // No halo. A lamp in rain wants a soft radial falloff, and a sphere of glow
    // material has neither — opaque it is a large orange ball parked in the
    // field, and additive it is the same ball plus the fog term the glow shader
    // adds for opaque rendering. The lamp and the rain already do the work; a
    // wrong halo is worse than none.

    const w = watcher(M);
    w.position.set(sx - 3.2, sy, sz + 1.6); w.rotation.y = 1.35; g.add(w);
    live.push({ update: (t) => { w.position.y = sy + Math.sin(t * 0.5) * 0.10; } });

    // and the thing that arrives: down the shoulder of the hill, past the
    // stop, and gone. It fades in and out at the ends of its run, which is
    // what a Catbus does whether you build it that way or not.
    const cb = catbus(M);
    g.add(cb.group);
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const a = (-1 + i / 5) * 1.15;             // a wide arc across the near flank
      const dx = Math.cos(a) * 92, dz = Math.sin(a) * 92;
      // the legs hang a metre below the body's origin, so the origin has to
      // ride a metre clear of the ground or the whole animal walks on its belly
      pts.push([C[0] + dx, C[1] + dz, (top(dx, dz) ?? 2) + 1.15]);
    }
    live.push(strider(cb.group, cb.rig, pts, {
      speed: 22, stride: 4.0, swing: 0.55, knee: 1.0, heave: 0.35, sway: 0.05,
      closed: false, fade: true, bank: 0.35, lean: 14,
    }));
    return { group: g, update: (t) => live.forEach(l => l.update(t)) };
  },

  // ---- Princess Mononoke: the Deer God crosses, and the forest watches -----
  cedar: (shared, G, shore) => {
    const M = pal(shared, { paper: '#e8e2ce' });
    const g = new THREE.Group(), live = [];
    const { C } = G;

    const dg = deerGod(M);
    dg.group.scale.setScalar(2.2);
    g.add(dg.group);
    // It walks the shallows between the forest and the line — in the water,
    // in front of everything, which is the only place on this island where
    // twenty metres of pale animal is not behind a cedar.
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const a = (-1 + i / 4) * 0.62;
      pts.push([C[0] + Math.cos(a) * 208, C[1] + Math.sin(a) * 208, 0.4]);
    }
    const walk = strider(dg.group, dg.rig, pts, {
      speed: 3.2, stride: 5.0, swing: 0.30, knee: 0.55, heave: 0.5, sway: 0.02,
      closed: false, fade: true, scale: 2.2, bank: 0,
    });
    live.push(walk);
    live.push({ update: (t) => { dg.head.rotation.y = Math.sin(t * 0.11) * 0.5; } });

    // And the hillside turns to look at it. A field of kodama that all face
    // the same way is wallpaper; a field that slowly swings round to follow
    // one thing across the water is the reason they are there at all.
    const kod = shore && shore.getObjectByName('kodama');
    if (kod && kod.userData.items) {
      const items = kod.userData.items;
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
      const p = new THREE.Vector3(), sv = new THREE.Vector3();
      const lag = items.map((_, i) => 0.55 + ((i * 37) % 100) / 100 * 0.8);
      const face = items.map(it => it.rot[1]);
      live.push({
        update: () => {
          const tx = dg.group.position.x, tz = dg.group.position.z;
          items.forEach((it, i) => {
            const want = Math.atan2(tx - it.pos[0], tz - it.pos[2]);
            let d = want - face[i];
            while (d > Math.PI) d -= 6.2832;
            while (d < -Math.PI) d += 6.2832;
            face[i] += d * 0.012 * lag[i];
            p.set(it.pos[0], it.pos[1], it.pos[2]);
            e.set(0, face[i], 0); q.setFromEuler(e);
            sv.set(it.scale[0], it.scale[1], it.scale[2]);
            m.compose(p, q, sv);
            kod.setMatrixAt(i, m);
          });
          kod.instanceMatrix.needsUpdate = true;
        },
      });
    }
    return { group: g, update: (t) => live.forEach(l => l.update(t)) };
  },

  // ---- Howl's Moving Castle: the castle goes one way, the war the other ----
  meadow: (shared, G) => {
    const M = pal(shared, {
      iron:  { color: '#4a423a', shadowTint: '#171310', rim: 1.3, bands: 3, grain: 0.18 },
      wall:  { color: '#6e5f4c', shadowTint: '#241d16', rim: 0.9, bands: 3, grain: 0.24 },
      roof:  { color: '#4a3a34', shadowTint: '#181110', rim: 1.0, bands: 3, grain: 0.20 },
      dark:  { color: '#1c1814', shadowTint: '#080606', rim: 0.8, bands: 2, grain: 0.14 },
      wood:  '#5a4632',
      smoke: { color: '#8a8880', shadowTint: '#3a3a38', rim: 0.6, bands: 2, grain: 0.10 },
    });
    const g = new THREE.Group(), live = [];
    const { C, top } = G;

    const cs = movingCastle(M);
    g.add(cs.group);
    // across the front of the meadow, going the opposite way to the army —
    // which is the point of the shot and costs nothing but a sign
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const a = (-1 + i / 5) * 1.0;
      const dx = Math.cos(a) * 118, dz = Math.sin(a) * 118;
      pts.push([C[0] + dx, C[1] + dz, (top(dx, dz) ?? 12) + 0.3]);
    }
    live.push(strider(cs.group, cs.rig, pts, {
      speed: 5.2, stride: 9.0, swing: 0.34, knee: 0.75, heave: 0.9, sway: 0.035,
      closed: false, fade: true, bank: 0.2, lean: 10,
    }));
    // four chimneys, all smoking, all drifting the same way
    cs.stacks.forEach((at, i) => {
      const sm = smokeStack(M.smoke, { n: 12, at, r: 1.5, rise: 34, drift: [16, 7], rate: 0.16, seed: 11 + i });
      cs.group.add(sm.group);
      live.push(sm);
    });
    return { group: g, update: (t) => live.forEach(l => l.update(t)) };
  },

  // ---- Kiki's Delivery Service: over the roofs at the end of the day -------
  koriko: (shared, G) => {
    const M = pal(shared, {
      dress:  { color: '#2b2b3c', shadowTint: '#0e0e18', rim: 1.0, bands: 3, grain: 0.14 },
      hair:   { color: '#241c1c', shadowTint: '#0a0808', rim: 0.9, bands: 3, grain: 0.12 },
      ribbon: { color: '#c0342e', shadowTint: '#3e100e', rim: 1.4, bands: 3, grain: 0.14 },
      straw:  { color: '#a88b52', shadowTint: '#3c3018', rim: 0.8, bands: 3, grain: 0.28 },
      wood:   '#6a5030',
      gull:   { color: '#e2ded2', shadowTint: '#5e5c54', rim: 1.3, bands: 3, grain: 0.10 },
    });
    const g = new THREE.Group(), live = [];
    const { C } = G;

    const k = onABroom(M);
    k.scale.setScalar(2.4);              // three hundred metres away, and small
    g.add(k);
    // A long loop over the town that comes in close to the line once each
    // circuit, dips past the clock tower, and climbs away over the harbour.
    live.push(flier(k, [
      [C[0] + 40,  -230, 78],
      [C[0] + 150,  -90, 62],            // the near pass, closest to the seat
      [C[0] + 130,   60, 55],
      [C[0] + 60,   -40, 48],            // the dip past the clock tower
      [C[0] - 40,    90, 66],
      [C[0] - 150,   30, 86],
      [C[0] - 120, -150, 92],
      [C[0] - 20,  -250, 84],
    ], { speed: 27, bank: 1.15, bob: 0.8, scale: 2.4, lean: 30 }));

    // gulls, low over the water on the harbour side, which is what makes the
    // sky above a port read as a port
    const gulls = swarm(M.gull, {
      n: 26, at: [C[0] + 150, 90], y: 34, r: 70, rise: 22, speed: 0.22, size: 2.6, seed: 19,
    });
    g.add(gulls.group); live.push(gulls);
    return { group: g, update: (t) => live.forEach(l => l.update(t)) };
  },

  // ---- Nausicaä: the glider on the wind, and what is coming over the ridge -
  valley: (shared, G) => {
    const M = pal(shared, {
      pale:  { color: '#eae6d6', shadowTint: '#68655a', rim: 1.5, bands: 3, grain: 0.10 },
      dress: { color: '#3c5a6e', shadowTint: '#141e26', rim: 1.0, bands: 3, grain: 0.14 },
      hair:  { color: '#c8ac6a', shadowTint: '#4a3c1e', rim: 1.0, bands: 3, grain: 0.12 },
      iron:  '#5a5a5e',
      shell: { color: '#8a6a4e', shadowTint: '#2e2018', rim: 1.1, bands: 3, grain: 0.24, grainScale: 0.8 },
    });
    const g = new THREE.Group(), live = [];
    const { C, top } = G;

    const mv = jetWing(M);
    mv.scale.setScalar(1.7);
    g.add(mv);
    // fast, low, and it comes right past the window once a lap
    live.push(flier(mv, [
      [C[0] + 60,  -260, 64],
      [C[0] + 165,  -80, 46],            // the near pass
      [C[0] + 120,   90, 52],
      [C[0] - 10,   170, 70],
      [C[0] - 140,   60, 58],
      [C[0] - 120, -140, 74],
    ], { speed: 44, bank: 1.35, bob: 0.6, scale: 1.7, lean: 34 }));

    // And an Ohmu over the crest, moving like weather. It is the biggest thing
    // in the country and it never hurries, which is the whole of why it is
    // frightening.
    const oh = ohmu(M);
    g.add(oh.group);
    const pts = [];
    for (let i = 0; i <= 6; i++) {
      const dz = -145 + i * (290 / 6);
      pts.push([C[0] - 10, C[1] + dz, (top(-10, dz) ?? 8) + 0.4]);
    }
    live.push(strider(oh.group, oh.rig, pts, {
      speed: 2.4, stride: 7.0, swing: 0.34, knee: 0.6, heave: 0.35, sway: 0.02,
      closed: false, fade: true, bank: 0,
    }));
    return { group: g, update: (t) => live.forEach(l => l.update(t)) };
  },

  // ---- Princess Mononoke, the works: the bellows floor, all night ---------
  //
  // Iron Town is a place that never stops. What everyone remembers of it is a
  // long dark shed with fire under the floor and a line of women walking the
  // treadles in time, singing — the work IS the scene, and it is the only
  // factory in Ghibli that is drawn as something people are proud of.
  iron: (shared, G) => {
    const M = pal(shared, {
      wood:  '#4a3a28',
      iron:  { color: '#4e4238', shadowTint: '#1a1512', rim: 1.3, bands: 3, grain: 0.16 },
      roof:  { color: '#3a3028', shadowTint: '#141010', rim: 1.0, bands: 3, grain: 0.18, side: THREE.DoubleSide },
      cloth: { color: '#8a6a4a', shadowTint: '#2e2216', rim: 0.9, bands: 3, grain: 0.2 },
      smoke: { color: '#8e8880', shadowTint: '#4a463f', rim: 0.5, bands: 2, grain: 0.10 },
    });
    const g = new THREE.Group(), live = [];
    const { C, top } = G;
    const bx = C[0] + 108, bz = C[1] - 18;
    const by = top(108, -18) ?? 14;

    // the shed: posts and a long roof, open on the side you pass
    const shed = new THREE.Group();
    shed.position.set(bx, by, bz); shed.rotation.y = -1.35; g.add(shed);
    const rf = new THREE.Mesh(box(34, 0.6, 13), M.roof);
    rf.position.y = 6.4; shed.add(rf);
    for (let i = 0; i < 8; i++) {
      for (const sz of [-1, 1]) {
        const p = new THREE.Mesh(box(0.5, 6.4, 0.5), M.wood);
        p.position.set(-15 + i * 4.3, 3.2, sz * 5.6); shed.add(p);
      }
    }
    const back = new THREE.Mesh(box(34, 5.2, 0.5), M.wood);
    back.position.set(0, 2.6, -6.0); shed.add(back);

    // the furnace: a bar of fire down the middle of the floor, and the smoke
    // that stands over the whole town because of it
    const fire = new THREE.Mesh(box(24, 1.2, 2.2), M.warm(3.2, '#ff8a34'));
    fire.position.set(0, 0.7, 0); fire.renderOrder = 9; shed.add(fire);
    const smoke = smokeStack(M.smoke, { n: 26, at: [bx, by + 7, bz], r: 2.6, rise: 52, drift: [26, 12], rate: 0.11, seed: 5 });
    g.add(smoke.group); live.push(smoke);

    // and the line on the treadles. They do not go anywhere; they rise and fall
    // in a wave down the boards, which is what a bellows crew looks like and
    // what nothing else in this world does.
    const fig = figureGeo(0, 'worker');
    const rows = [];
    for (const sz of [-1, 1]) {
      const items = [];
      for (let i = 0; i < 9; i++) {
        items.push({ pos: [-14 + i * 3.6, 1.4, sz * 3.4], rot: [0, sz > 0 ? 0 : Math.PI, 0], scale: [1.9, 1.9, 1.9] });
      }
      const mesh = put(shed, items, fig, M.cloth);
      rows.push({ mesh, items, sz });
    }
    const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), ee = new THREE.Euler();
    const pv = new THREE.Vector3(), sv = new THREE.Vector3(1.9, 1.9, 1.9);
    live.push({
      update: (t) => {
        rows.forEach(({ mesh, items, sz }) => {
          items.forEach((it, i) => {
            const a = t * 2.1 - i * 0.55 + (sz > 0 ? 0 : 1.6);
            pv.set(it.pos[0], it.pos[1] + Math.max(0, Math.sin(a)) * 0.62, it.pos[2]);
            ee.set(Math.sin(a) * 0.10, it.rot[1], 0); qq.setFromEuler(ee);
            m4.compose(pv, qq, sv); mesh.setMatrixAt(i, m4);
          });
          mesh.instanceMatrix.needsUpdate = true;
        });
      },
    });
    return { group: g, update: (t) => live.forEach(l => l.update(t)) };
  },

  // ---- Howl's, the town: the day the war was declared ---------------------
  //
  // Market Chipping's one public event: the column going through the square
  // under the palace, flags up, everyone out to watch it — and every person
  // watching knows perfectly well where it is going.
  market: (shared, G) => {
    const M = pal(shared, {
      cloth: { color: '#b03a30', shadowTint: '#3c1210', rim: 1.2, bands: 3, grain: 0.14, side: THREE.DoubleSide },
      gold:  { color: '#c8a24a', shadowTint: '#4a3616', rim: 1.6, bands: 3, grain: 0.12 },
      coat:  { color: '#4a5668', shadowTint: '#181e26', rim: 1.0, bands: 3, grain: 0.14 },
      wood:  '#5a4632',
    });
    const g = new THREE.Group(), live = [];
    const { C, top } = G;
    const pts = [];
    for (let i = 0; i <= 9; i++) {
      const a = (-1 + i / 4.5) * 0.95;
      const dx = Math.cos(a) * 118, dz = Math.sin(a) * 118;
      pts.push([C[0] + dx, C[1] + dz, (top(dx, dz) ?? 20) + 0.1]);
    }
    const par = procession([
      { geo: flagGeo(5.0, 2.2), mat: M.cloth, of: (i) => i % 5 === 2, scale: 1.7, bob: 0.10 },
      { geo: flagGeo(4.4, 1.7), mat: M.gold,  of: (i) => i === 0, scale: 2.0, bob: 0.10 },
      { geo: figureGeo(0, 'euro'), mat: M.coat, of: () => true, scale: 2.6, bob: 0.14 },
    ], pts, { n: 44, speed: 3.4, spacing: 3.4, width: 5.0, seed: 12, march: 1.4 });
    g.add(par.group); live.push(par);
    return { group: g, update: (t) => live.forEach(l => l.update(t)) };
  },

  // ---- Earthsea: what the market in Hort Town is actually selling ---------
  hort: (shared, G) => {
    const M = pal(shared, {
      wood:  { color: '#7a6242', shadowTint: '#2c2214', rim: 0.9, bands: 3, grain: 0.26 },
      hide:  { color: '#6a5240', shadowTint: '#241a14', rim: 0.9, bands: 3, grain: 0.22 },
      robe:  { color: '#a89060', shadowTint: '#3c3220', rim: 1.0, bands: 3, grain: 0.18 },
      rag:   { color: '#8a8272', shadowTint: '#302c26', rim: 0.8, bands: 3, grain: 0.24 },
    });
    const g = new THREE.Group(), live = [];
    const { C, top } = G;
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const a = (-1 + i / 4) * 0.9;
      const dx = Math.cos(a) * 88, dz = Math.sin(a) * 88;
      pts.push([C[0] + dx, C[1] + dz, (top(dx, dz) ?? 18) + 0.1]);
    }
    // the ox, the wagon, two guards, and everybody who is going with it whether
    // they meant to or not
    const par = procession([
      { geo: beastGeo({ body: [2.6, 1.1, 1.1], head: 0.36, neck: 0.45, legs: 0.9, tail: 0.7, hump: 0.5 }),
        mat: M.hide, of: (i) => i === 0, scale: 2.0 },
      { geo: cageWagonGeo(), mat: M.wood, of: (i) => i === 2, scale: 1.5, bob: 0.05 },
      { geo: figureGeo(0, 'desert'), mat: M.robe, of: (i) => i === 1 || i === 4, scale: 2.0, bob: 0.12 },
      { geo: figureGeo(1, 'desert'), mat: M.rag, of: () => true, scale: 1.9, bob: 0.12 },
    ], pts, { n: 22, speed: 1.5, spacing: 4.6, width: 3.0, seed: 31, march: 0.8 });
    g.add(par.group); live.push(par);
    return { group: g, update: (t) => live.forEach(l => l.update(t)) };
  },

  // ---- Pom Poko: the night they showed the town what they were ------------
  //
  // The transformation parade. A line of things coming over the hill in the
  // dark, none of them quite the right shape, all of them carrying a light.
  tama: (shared, G) => {
    const M = pal(shared, {
      fur:   { color: '#6a5a44', shadowTint: '#241d14', rim: 1.0, bands: 3, grain: 0.24 },
      odd:   { color: '#7a6a78', shadowTint: '#2a2430', rim: 1.2, bands: 3, grain: 0.20 },
      cloth: { color: '#8a4a4a', shadowTint: '#301818', rim: 1.0, bands: 3, grain: 0.16 },
      wood:  '#4a3a2a',
    });
    const g = new THREE.Group(), live = [];
    const { C, top } = G;
    const pts = [];
    for (let i = 0; i <= 9; i++) {
      const a = (-1 + i / 4.5) * 1.0;
      const dx = Math.cos(a) * 112, dz = Math.sin(a) * 112;
      pts.push([C[0] + dx, C[1] + dz, (top(dx, dz) ?? 20) + 0.1]);
    }
    const par = procession([
      { geo: oddGeo('head'),    mat: M.odd,  of: (i) => i === 3 || i === 17, scale: 2.5, bob: 0.22 },
      { geo: oddGeo('serpent'), mat: M.odd,  of: (i) => i === 8, scale: 3.8, bob: 0.30 },
      { geo: oddGeo('brolly'),  mat: M.cloth, of: (i) => i % 7 === 5, scale: 2.4, bob: 0.34 },
      { geo: lanternStickGeo(), mat: M.wood, of: (i) => i % 3 === 1, scale: 2.2, bob: 0.16 },
      { geo: oddGeo('fox'),     mat: M.fur,  of: () => true, scale: 2.4, bob: 0.18 },
    ], pts, { n: 34, speed: 2.4, spacing: 4.0, width: 6.5, seed: 44, march: 1.1 });
    g.add(par.group); live.push(par);
    // and the lights they carry, which are what you actually see of it
    const lamps = procession([
      { geo: carriedLanternGeo(), mat: M.warm(2.4, '#ffb35a'), of: (i) => i % 3 === 1, scale: 2.2, bob: 0.16, ro: 9 },
    ], pts, { n: 34, speed: 2.4, spacing: 4.0, width: 6.5, seed: 44, march: 1.1 });
    g.add(lamps.group); live.push(lamps);
    return { group: g, update: (t) => live.forEach(l => l.update(t)) };
  },

  // ---- The Cat Returns: the court comes for you at midnight ---------------
  cats: (shared, G) => {
    const M = pal(shared, {
      fur:   { color: '#4e4a52', shadowTint: '#1a181e', rim: 1.1, bands: 3, grain: 0.18 },
      white: { color: '#d8d2c6', shadowTint: '#585448', rim: 1.3, bands: 3, grain: 0.14 },
      gold:  { color: '#c8a24a', shadowTint: '#4a3616', rim: 1.6, bands: 3, grain: 0.12 },
      wood:  '#4a3a2a',
    });
    const g = new THREE.Group(), live = [];
    const { C, top } = G;
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const a = (-1 + i / 4) * 1.0;
      const dx = Math.cos(a) * 62, dz = Math.sin(a) * 62;
      pts.push([C[0] + dx, C[1] + dz, (top(dx, dz) ?? 6) + 0.1]);
    }
    // a palanquin: a box on poles, carried at shoulder height. The whole gag is
    // that it is exactly a state procession, done by cats, at cat scale.
    const palan = (() => {
      const parts = [];
      const bodyB = box(1.5, 1.3, 2.0); bodyB.translate(0, 1.5, 0); parts.push(bodyB.toNonIndexed());
      const rf = new THREE.ConeGeometry(1.5, 0.7, 4);
      rf.rotateY(Math.PI / 4); rf.translate(0, 2.5, 0); parts.push(rf.toNonIndexed());
      for (const s of [-1, 1]) {
        const pole = box(0.1, 0.1, 5.0);
        pole.translate(s * 0.85, 1.2, 0); parts.push(pole.toNonIndexed());
      }
      return mergePN(parts);
    })();
    const par = procession([
      { geo: palan, mat: M.gold, of: (i) => i === 7, scale: 2.0, bob: 0.10 },
      { geo: courtCatGeo(true), mat: M.white, of: (i) => i === 0 || i === 1, scale: 2.4, bob: 0.14 },
      { geo: courtCatGeo(false), mat: M.fur, of: () => true, scale: 2.2, bob: 0.16 },
    ], pts, { n: 26, speed: 2.0, spacing: 2.6, width: 3.2, seed: 77, march: 1.5 });
    g.add(par.group); live.push(par);
    const lamps = procession([
      { geo: carriedLanternGeo(), mat: M.warm(2.0, '#ffcf7a'), of: (i) => i % 4 === 2, scale: 1.6, bob: 0.16, ro: 9 },
    ], pts, { n: 26, speed: 2.0, spacing: 2.6, width: 3.2, seed: 77, march: 1.5 });
    g.add(lamps.group); live.push(lamps);
    return { group: g, update: (t) => live.forEach(l => l.update(t)) };
  },

  // ---- The Tale of the Princess Kaguya: they come to take her back --------
  //
  // The one moment in Ghibli that is genuinely unbearable, and it is staged as
  // a celebration: a company on a cloud, coming down out of the sky playing
  // music, entirely kind and entirely deaf. It needs no ground, so it does not
  // ask for any — it is the only moment here built in open air.
  ink: (shared) => {
    const M = pal(shared, {
      cloud: { color: '#e8e4d8', shadowTint: '#8e8a80', rim: 1.8, bands: 2, grain: 0.08 },
      robe:  { color: '#d8c8a8', shadowTint: '#6a6050', rim: 1.4, bands: 2, grain: 0.10 },
      gold:  { color: '#d8b45a', shadowTint: '#6a5420', rim: 1.8, bands: 2, grain: 0.10 },
      lotus: { color: '#e8d8e0', shadowTint: '#7a6c74', rim: 1.6, bands: 2, grain: 0.08 },
    });
    const g = new THREE.Group(), live = [];

    const barge = new THREE.Group();
    // the cloud: a raft of overlapping lobes, flat on top, so it reads as
    // something you could stand on rather than as weather
    const rnd = mulberry(2013);
    for (let i = 0; i < 22; i++) {
      const a = rnd() * 6.28, d = Math.sqrt(rnd()) * 16;
      const l = new THREE.Mesh(new THREE.SphereGeometry(3.6 + rnd() * 3.4, 9, 7), M.cloud);
      l.scale.y = 0.42;
      l.position.set(Math.cos(a) * d, -1.2 + rnd() * 0.7, Math.sin(a) * d * 1.5);
      barge.add(l);
    }
    // the canopy, and the lotus seat under it
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.6, 12), M.gold);
    canopy.position.y = 8.2; barge.add(canopy);
    for (let i = 0; i < 4; i++) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 7.0, 6), M.gold);
      const a = (i / 4) * 6.28 + 0.78;
      p.position.set(Math.cos(a) * 3.4, 3.5, Math.sin(a) * 3.4); barge.add(p);
    }
    const lotus = new THREE.Mesh(new THREE.SphereGeometry(2.4, 12, 8, 0, 6.283, 0, 1.4), M.lotus);
    lotus.scale.y = 0.5; lotus.position.y = 0.8; barge.add(lotus);
    // and the company, standing in two files on either side of it, not moving
    const figs = [];
    const fg = figureGeo(0, 'edo');
    for (let i = 0; i < 14; i++) {
      const s = i % 2 ? 1 : -1;
      figs.push({
        pos: [s * (5.4 + (i % 3) * 1.4), 0.2, -14 + Math.floor(i / 2) * 4.2],
        rot: [0, s > 0 ? -1.57 : 1.57, 0], scale: [2.0, 2.0, 2.0],
      });
    }
    put(barge, figs, fg, M.robe);
    // a glow under the whole thing, because it is lit from somewhere else
    const under = new THREE.Mesh(new THREE.CircleGeometry(19, 24), M.warm(0.55, '#fff0c8'));
    under.rotation.x = Math.PI / 2; under.position.y = -2.4; under.renderOrder = 9;
    barge.add(under);
    g.add(barge);

    // down out of the sky, slowly, and away again — and it comes from a long
    // way off, so it is very small before it is very large
    live.push(flier(barge, [
      [-620, -560, 520],
      [-470, -300, 400],
      [-330, -110, 280],
      [-236,   60, 186],
      [-300,  240, 250],
      [-520,  420, 420],
    ], { speed: 9.5, bank: 0.25, bob: 1.6, closed: false, fade: true, lean: 8 }));
    return { group: g, update: (t) => live.forEach(l => l.update(t)) };
  },

  // ---- Castle in the Sky: the gardener, still keeping the place -----------
  laputa: (shared, G) => {
    const M = pal(shared, {
      moss:  { color: '#5c6a4a', shadowTint: '#1e2418', rim: 0.9, bands: 3, grain: 0.30, grainScale: 0.7 },
      stone: '#a9a293',
      bird:  { color: '#4a5a68', shadowTint: '#161c22', rim: 1.2, bands: 3, grain: 0.12 },
      bloom: { color: '#d8d8e8', shadowTint: '#5a5a70', rim: 1.6, bands: 2, grain: 0.10 },
    });
    const g = new THREE.Group(), live = [];
    const { C, top } = G;

    // Outside the ring of ruins rather than inside it, on the window side, and
    // big. It stands a hundred and thirty metres up and two hundred out; inside
    // the walls at human scale it is a grey speck behind a grey block.
    const gy = top(92, 24) ?? 0;
    const gx = C[0] + 92, gz = C[1] + 24;
    const rb = gardener(M);
    rb.group.position.set(gx, gy, gz);
    rb.group.rotation.y = 1.9;
    rb.group.scale.setScalar(1.6);
    g.add(rb.group);

    // the grave it is standing over, and the flowers it keeps putting there
    const mound = new THREE.Mesh(new THREE.SphereGeometry(2.6, 12, 8, 0, 6.283, 0, 1.6), M.moss);
    mound.scale.y = 0.42; mound.position.set(gx + 3.6, gy, gz + 2.4); g.add(mound);
    const marker = new THREE.Mesh(box(0.9, 2.2, 0.4), M.stone);
    marker.position.set(gx + 3.6, gy + 1.1, gz + 0.4); g.add(marker);
    const rnd = mulberry(1986);
    const flowers = [];
    for (let i = 0; i < 40; i++) {
      const a = rnd() * 6.28, d = rnd() * 4.5;
      flowers.push({
        pos: [gx + 3.6 + Math.cos(a) * d, gy + 0.5 + rnd() * 0.7, gz + 2.4 + Math.sin(a) * d],
        rot: [0, rnd() * 6.28, 0], scale: [0.26, 0.26, 0.26],
      });
    }
    put(g, flowers, new THREE.SphereGeometry(1, 6, 5), M.bloom, 9);

    // It turns its head, slowly, and it lifts an arm now and then. That is the
    // entire performance and it is enough: something this size moving at all
    // is what tells you it is not a statue.
    live.push({
      update: (t) => {
        rb.head.rotation.y = Math.sin(t * 0.13) * 0.7;
        rb.head.rotation.x = Math.sin(t * 0.09 + 1) * 0.12;
        rb.arms.forEach(({ sh, el, s }) => {
          sh.rotation.x = -0.15 + Math.sin(t * 0.11 + (s > 0 ? 0 : 2.1)) * 0.35;
          el.rotation.x = -0.3 + Math.sin(t * 0.14 + (s > 0 ? 1 : 3)) * 0.28;
        });
      },
    });

    // birds all over it and the tree — the only thing left living up here that
    // is not the robot or the garden it keeps
    const flock = swarm(M.bird, {
      n: 34, at: [C[0] + 20, C[1] + 10], y: top(0, 0) + 44, r: 78, rise: 30,
      speed: 0.20, size: 2.2, seed: 7,
    });
    g.add(flock.group); live.push(flock);
    return { group: g, update: (t) => live.forEach(l => l.update(t)) };
  },
};

// ---------------------------------------------------------------------------
// The public face. A moment stands on its country's near shore, so it is built
// with the same ground the island was — never with a second copy of the
// arithmetic, which is how the last three floating-object bugs happened.
// ---------------------------------------------------------------------------
export function createMoment(shared, regionId, shore) {
  const make = MOMENTS[regionId];
  if (!make) return null;
  // Most moments stand on their country's island and need its ground. One —
  // Kaguya's — happens in open air and asks for none, so a missing shore is
  // not a reason to skip it.
  return make(shared, shoreGround(regionId), shore);
}

export { flier, strider, swarm, legRig, smokeStack, birdGeo };
