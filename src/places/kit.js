import * as THREE from 'three';
import { box, hill, mulberry, mergePN, fillInstances, curvedRoof } from '../world/geo.js';
import { makePaintMaterial, makeGlowMaterial } from '../world/paintMaterial.js';

// ---------------------------------------------------------------------------
// The kit.
//
// Ninety places is not ninety region builders. A region is a composition — it
// has to work from one seat, at one moment, and every one of them was tuned by
// eye. A place is something you walk up to, so what it needs is to be RIGHT
// rather than framed: a cottage that is a cottage, a wall that is a wall, a
// path that goes where it looks like it goes.
//
// So the parts live here and the countries only say which parts, in what
// colour, arranged how. Everything below returns a Group standing on y = 0 with
// its front facing +z, so a place file can position and rotate without
// arithmetic. The palette takes overrides, because the difference between a
// Yorkshire farmhouse and a Tuscan one is four hex codes and a roof pitch.
// ---------------------------------------------------------------------------

const BASE = {
  wood:    { color: '#5a4632', shadowTint: '#1e1710', rim: 0.7, bands: 3, grain: 0.26, grainScale: 1.6 },
  dark:    { color: '#332b23', shadowTint: '#100d0a', rim: 0.7, bands: 3, grain: 0.22, grainScale: 1.4 },
  wall:    { color: '#c2b9a2', shadowTint: '#494539', rim: 0.8, bands: 3, grain: 0.20, grainScale: 0.9 },
  roof:    { color: '#3d4450', shadowTint: '#151920', rim: 1.1, bands: 3, grain: 0.16, side: THREE.DoubleSide },
  thatch:  { color: '#7d6a44', shadowTint: '#2c2618', rim: 0.7, bands: 3, grain: 0.32, grainScale: 0.7 },
  stone:   { color: '#7c7a72', shadowTint: '#2b2b2c', rim: 0.8, bands: 3, grain: 0.26, grainScale: 1.4, wrap: 0.55 },
  rock:    { color: '#5e5a52', shadowTint: '#1e1e20', rim: 0.8, bands: 3, grain: 0.28, grainScale: 1.1, wrap: 0.55 },
  earth:   { color: '#57463a', shadowTint: '#1c1712', rim: 0.6, bands: 3, grain: 0.28, grainScale: 1.0 },
  turf:    { color: '#46553a', shadowTint: '#181f16', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.55 },
  moss:    { color: '#57683c', shadowTint: '#1e2618', rim: 0.5, bands: 3, grain: 0.26, grainScale: 0.4, sway: 0.03, translucency: 0.6 },
  leaf:    { color: '#3b5430', shadowTint: '#131c10', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.35, sway: 0.032, translucency: 0.6 },
  leaf2:   { color: '#4b6236', shadowTint: '#182014', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.35, sway: 0.038, translucency: 0.65 },
  trunk:   { color: '#463d34', shadowTint: '#161210', rim: 0.7, bands: 3, grain: 0.26, grainScale: 1.7 },
  iron:    { color: '#4a4a4e', shadowTint: '#161618', rim: 1.3, bands: 3, grain: 0.14, grainScale: 1.2 },
  cloth:   { color: '#b8654a', shadowTint: '#3e2018', rim: 0.9, bands: 2, grain: 0.12, side: THREE.DoubleSide },
  sand:    { color: '#b9a882', shadowTint: '#4a4033', rim: 0.7, bands: 3, grain: 0.22, grainScale: 0.8 },
  water:   { color: '#1c3440', shadowTint: '#080e14', rim: 2.2, bands: 2, grain: 0.05 },
  // An unlit window is not a hole. Glass takes the sky and gives most of it
  // back, so it reads as a dark, cool, slightly reflective panel — black
  // rectangles in a daylit wall look like the building has been shelled.
  glass:   { color: '#3e4a52', shadowTint: '#161c22', rim: 2.6, bands: 2, grain: 0.05, wrap: 0.85 },
  paper:   { color: '#e6ddc6', shadowTint: '#6e6858', rim: 1.2, bands: 2, grain: 0.08, side: THREE.DoubleSide },
};

// A palette for one place-set. Pass a hex to recolour, or an object to change
// anything else about it. Anything not named keeps the default above.
export function pal(shared, over = {}) {
  const out = {};
  const keys = new Set([...Object.keys(BASE), ...Object.keys(over)]);
  keys.forEach((k) => {
    const o = over[k];
    const spec = typeof o === 'string' ? { ...(BASE[k] ?? BASE.wall), color: o }
               : o ? { ...(BASE[k] ?? BASE.wall), ...o }
               : BASE[k];
    // a recoloured material with no shadow of its own gets one derived from it,
    // which is nearly always better than keeping the default's
    if (typeof o === 'string' && !BASE[k]) spec.shadowTint = null;
    out[k] = makePaintMaterial(shared, spec);
  });
  out.warm = (s = 1.6, c = '#ffb864') => makeGlowMaterial(shared, c, s, { flicker: 0.07 });
  out.cool = (s = 1.0, c = '#9fc6e8') => makeGlowMaterial(shared, c, s, { flicker: 0.03 });
  out.shared = shared;
  return out;
}

// The instancing helper every place file uses. Items are {pos, rot, scale}.
export function put(group, items, geo, mat, ro) {
  if (!items.length) return null;
  const m = new THREE.InstancedMesh(geo, mat, items.length);
  fillInstances(m, items);
  m.frustumCulled = false;
  if (ro) m.renderOrder = ro;
  group.add(m);
  return m;
}

// ===========================================================================
// Ground
// ===========================================================================

// A shelf of land to stand the place on. Low, always — a plate with vertical
// sides six metres thick is a cliff, and you walk into the side of it.
export function shelf(M, { r = 60, y = 0, h = 1.4, mat = M.turf, seed = 3, rough = 0.3 } = {}) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(hill(r, h, seed, { rough, rings: 5, sectors: 20 }), mat);
  m.position.y = y - h * 0.02;
  g.add(m);
  return g;
}

// Water lying in a hollow: a disc a shade darker than everything, with a rim of
// wet stone round it. The disc is flat and slightly proud of the ground, which
// is the only way a pool reads without a reflection to give it away.
export function pool(M, { r = 30, mat = M.water, lip = M.rock, y = 0 } = {}) {
  const g = new THREE.Group();
  const w = new THREE.Mesh(new THREE.CircleGeometry(r, 40), mat);
  w.rotation.x = -Math.PI / 2;
  w.position.y = y + 0.05;
  g.add(w);
  if (lip) {
    const rnd = mulberry(7);
    const items = [];
    for (let i = 0; i < 90; i++) {
      const a = (i / 90) * Math.PI * 2 + rnd() * 0.06;
      const d = r * (0.99 + rnd() * 0.06);
      const s = r * (0.028 + rnd() * 0.045);
      items.push({
        pos: [Math.cos(a) * d, y - s * 0.25, Math.sin(a) * d],
        rot: [0, rnd() * 6.28, (rnd() - 0.5) * 0.3],
        scale: [s, s * 0.6, s * (0.7 + rnd() * 0.6)],
      });
    }
    put(g, items, hill(1, 1, 9, { rough: 0.5, rings: 5, sectors: 8 }), lip);
  }
  return g;
}

// ===========================================================================
// Buildings
//
// One function, because the difference between a farmhouse, a hat shop and a
// boiler house is a roof pitch, a wall colour and how many windows are lit.
// ===========================================================================

const ROOFS = {
  gable: (w, d, h, mat) => {
    const g = new THREE.Group();
    const p = new THREE.Mesh(new THREE.PlaneGeometry(Math.hypot(w / 2, h) * 2.05, d * 1.06), mat);
    p.rotation.x = -Math.PI / 2;
    const a = Math.atan2(h, w / 2);
    for (const s of [-1, 1]) {
      const q = p.clone();
      q.geometry = new THREE.PlaneGeometry(Math.hypot(w / 2, h) * 1.04, d * 1.06);
      q.rotation.set(-Math.PI / 2, 0, 0);
      q.rotation.z = 0;
      q.position.set(s * w / 4, h / 2, 0);
      q.rotation.set(-Math.PI / 2, 0, 0);
      q.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), -s * (Math.PI / 2 - a));
      g.add(q);
    }
    // the two ends, so you cannot see into the roof void
    for (const s of [-1, 1]) {
      const tri = new THREE.Shape();
      tri.moveTo(-w / 2, 0); tri.lineTo(w / 2, 0); tri.lineTo(0, h); tri.closePath();
      const e = new THREE.Mesh(new THREE.ShapeGeometry(tri), mat);
      e.position.z = s * d / 2;
      if (s < 0) e.rotation.y = Math.PI;
      g.add(e);
    }
    return g;
  },
  hip: (w, d, h, mat) => {
    const g = new THREE.Group();
    const c = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.72, h, 4, 1), mat);
    c.rotation.y = Math.PI / 4;
    c.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d));
    c.position.y = h / 2;
    g.add(c);
    return g;
  },
  jp: (w, d, h, mat) => {                   // the sweeping eave
    const g = new THREE.Group();
    const r = new THREE.Mesh(curvedRoof(w * 1.28, d * 1.28, h, { seg: 12, power: 1.7, corner: 0.42, flare: 0.22 }), mat);
    g.add(r);
    return g;
  },
  thatch: (w, d, h, mat) => {
    const g = new THREE.Group();
    const r = new THREE.Mesh(curvedRoof(w * 1.34, d * 1.34, h, { seg: 10, power: 1.25, corner: 0.06, flare: 0.02 }), mat);
    g.add(r);
    return g;
  },
  flat: (w, d, h, mat) => {
    const g = new THREE.Group();
    const r = new THREE.Mesh(box(w * 1.08, Math.max(h, 0.3), d * 1.08), mat);
    r.position.y = Math.max(h, 0.3) / 2;
    g.add(r);
    return g;
  },
};

export function house(M, opts = {}) {
  const {
    w = 9, d = 7, h = 5.2,
    storeys = 1, storeyH = 3.2,
    roof = 'gable', roofH = 3.0,
    wall = M.wall, roofMat = M.roof, trim = M.wood,
    door = true, doorLit = false, doorW = 1.5, doorH = 2.6,
    windows = 3, lit = 0, winW = 1.3, winH = 1.5,
    glow = null, sill = true, base = null,
  } = opts;
  const g = new THREE.Group();
  const rnd = mulberry(Math.round(w * 31 + d * 7 + h));
  const G = glow ?? M.warm(1.5);
  const total = storeys > 1 ? h + (storeys - 1) * storeyH : h;

  if (base) {
    const p = new THREE.Mesh(box(w + 0.7, 0.6, d + 0.7), base);
    p.position.y = 0.3; g.add(p);
  }
  const body = new THREE.Mesh(box(w, h, d), wall);
  body.position.y = h / 2; g.add(body);
  for (let s = 1; s < storeys; s++) {
    const up = new THREE.Mesh(box(w * (1 - s * 0.04), storeyH, d * (1 - s * 0.04)), wall);
    up.position.y = h + storeyH * (s - 0.5); g.add(up);
  }

  const rg = (ROOFS[roof] ?? ROOFS.gable)(w, d, roofH, roofMat);
  rg.position.y = total; g.add(rg);

  // ---- the front: a door, and windows either side of it ----
  const fz = d / 2 + 0.03;
  if (door) {
    const frame = new THREE.Mesh(box(doorW + 0.34, doorH + 0.3, 0.22), trim);
    frame.position.set(0, (doorH + 0.3) / 2, fz); g.add(frame);
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(doorW, doorH), doorLit ? G : M.dark);
    leaf.position.set(0, doorH / 2, fz + 0.13);
    leaf.renderOrder = doorLit ? 9 : 0;
    g.add(leaf);
  }
  const rows = storeys;
  for (let s = 0; s < rows; s++) {
    const y = s === 0 ? h * 0.62 : h + storeyH * (s - 0.5) + 0.2;
    for (let i = 0; i < windows; i++) {
      const span = w - 2.0;
      const x = windows === 1 ? 0 : -span / 2 + (i / (windows - 1)) * span;
      if (s === 0 && door && Math.abs(x) < doorW * 0.9) continue;
      const on = lit > 0 && rnd() < lit;
      const p = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), on ? G : (M.glass ?? M.dark));
      p.position.set(x, y, fz + 0.05);
      p.renderOrder = on ? 8 : 0;
      g.add(p);
      if (sill) {
        const sl = new THREE.Mesh(box(winW + 0.3, 0.14, 0.3), trim);
        sl.position.set(x, y - winH / 2 - 0.1, fz + 0.1); g.add(sl);
      }
    }
  }
  // ---- and a few on the long side, so it is not a stage flat ----
  for (const sx of [-1, 1]) {
    const n = Math.max(1, Math.round(d / 4));
    for (let i = 0; i < n; i++) {
      const z = -d / 2 + (i + 0.5) * (d / n);
      const on = lit > 0 && rnd() < lit * 0.7;
      const p = new THREE.Mesh(new THREE.PlaneGeometry(winW * 0.9, winH), on ? G : (M.glass ?? M.dark));
      p.position.set(sx * (w / 2 + 0.04), h * 0.62, z);
      p.rotation.y = sx * Math.PI / 2;
      p.renderOrder = on ? 8 : 0;
      g.add(p);
    }
  }
  return g;
}

// A lean-to, a boat shed, a hangar: one open side and nothing else.
export function shed(M, { w = 8, d = 6, h = 4, mat = M.wood, roofMat = M.roof, open = true } = {}) {
  const g = new THREE.Group();
  for (const sx of [-1, 1]) {
    const s = new THREE.Mesh(box(0.3, h, d), mat);
    s.position.set(sx * w / 2, h / 2, 0); g.add(s);
  }
  const back = new THREE.Mesh(box(w, h, 0.3), mat);
  back.position.set(0, h / 2, -d / 2); g.add(back);
  if (!open) {
    const front = new THREE.Mesh(box(w, h, 0.3), mat);
    front.position.set(0, h / 2, d / 2); g.add(front);
  }
  const r = new THREE.Mesh(box(w + 0.8, 0.35, d + 0.8), roofMat);
  r.position.y = h + 0.15; r.rotation.x = 0.09; g.add(r);
  return g;
}

// ===========================================================================
// Things beside buildings
// ===========================================================================

export function wall(M, { len = 20, h = 1.8, thick = 0.6, mat = M.stone, cap = null } = {}) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(box(thick, h, len), mat);
  b.position.y = h / 2; g.add(b);
  if (cap) {
    const c = new THREE.Mesh(box(thick + 0.3, 0.22, len), cap);
    c.position.y = h + 0.11; g.add(c);
  }
  return g;
}

export function fence(M, { len = 20, h = 1.2, mat = M.wood, posts = null, rails = 2 } = {}) {
  const g = new THREE.Group();
  const n = posts ?? Math.max(2, Math.round(len / 2.4));
  const items = [];
  for (let i = 0; i < n; i++) {
    items.push({ pos: [0, h / 2, -len / 2 + (i / (n - 1)) * len], scale: [0.16, h, 0.16] });
  }
  put(g, items, box(1, 1, 1), mat);
  for (let r = 0; r < rails; r++) {
    const y = h * (0.42 + r * 0.44);
    const bar = new THREE.Mesh(box(0.10, 0.14, len), mat);
    bar.position.y = y; g.add(bar);
  }
  return g;
}

export function steps(M, { n = 12, w = 3, rise = 0.36, run = 0.9, mat = M.stone } = {}) {
  const g = new THREE.Group();
  const items = [];
  for (let i = 0; i < n; i++) {
    items.push({ pos: [0, rise * (i + 0.5), run * (i + 0.5)], scale: [w, rise, run * 1.02] });
  }
  put(g, items, box(1, 1, 1), mat);
  return g;
}

export function bridge(M, { span = 14, w = 2.6, arch = 1.6, mat = M.wood, rail = true } = {}) {
  const g = new THREE.Group();
  const seg = 10;
  for (let i = 0; i < seg; i++) {
    const t = (i + 0.5) / seg;
    const y = Math.sin(t * Math.PI) * arch;
    const p = new THREE.Mesh(box(w, 0.22, span / seg * 1.05), mat);
    p.position.set(0, y, -span / 2 + t * span);
    p.rotation.x = -Math.cos(t * Math.PI) * arch / span * 2;
    g.add(p);
  }
  if (rail) {
    for (const sx of [-1, 1]) {
      for (let i = 0; i < seg; i++) {
        const t = (i + 0.5) / seg;
        const y = Math.sin(t * Math.PI) * arch;
        const p = new THREE.Mesh(box(0.12, 0.9, span / seg), mat);
        p.position.set(sx * w / 2, y + 0.5, -span / 2 + t * span);
        g.add(p);
      }
    }
  }
  return g;
}

export function torii(M, { w = 5, h = 6, mat = M.cloth, cap = M.dark } = {}) {
  const g = new THREE.Group();
  for (const sx of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.05, w * 0.065, h, 10), mat);
    leg.position.set(sx * w / 2, h / 2, 0); g.add(leg);
  }
  const l1 = new THREE.Mesh(box(w * 1.12, h * 0.07, w * 0.09), cap);
  l1.position.y = h * 0.86; g.add(l1);
  const l2 = new THREE.Mesh(box(w * 1.34, h * 0.09, w * 0.12), mat);
  l2.position.y = h * 0.97; g.add(l2);
  const c = new THREE.Mesh(curvedRoof(w * 1.5, w * 0.24, h * 0.10, { seg: 8, power: 1.4, corner: 0.5, flare: 0.4 }), cap);
  c.position.y = h * 1.02; g.add(c);
  return g;
}

// A stone lantern, or a wooden one on a post. Lit or not.
export function lantern(M, { h = 2.2, stone = true, lit = true, mat = null, glow = null } = {}) {
  const g = new THREE.Group();
  const m = mat ?? (stone ? M.stone : M.wood);
  if (stone) {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.20, h * 0.26, h * 0.16, 8), m);
    base.position.y = h * 0.08; g.add(base);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.09, h * 0.10, h * 0.46, 8), m);
    shaft.position.y = h * 0.39; g.add(shaft);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.22, h * 0.16, h * 0.10, 8), m);
    bowl.position.y = h * 0.67; g.add(bowl);
    const box1 = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.17, h * 0.17, h * 0.17, 6), m);
    box1.position.y = h * 0.80; g.add(box1);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(h * 0.29, h * 0.16, 6), m);
    cap.position.y = h * 0.96; g.add(cap);
    if (lit) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(h * 0.075, 7, 5), glow ?? M.warm(2.2));
      f.position.y = h * 0.80; f.renderOrder = 9; g.add(f);
    }
  } else {
    const post = new THREE.Mesh(box(h * 0.07, h * 0.82, h * 0.07), m);
    post.position.y = h * 0.41; g.add(post);
    const arm = new THREE.Mesh(box(h * 0.05, h * 0.05, h * 0.2), m);
    arm.position.set(0, h * 0.82, h * 0.08); g.add(arm);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(h * 0.16, h * 0.13, 8), m);
    shade.position.set(0, h * 0.84, h * 0.16); g.add(shade);
    if (lit) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(h * 0.08, 8, 6), glow ?? M.warm(2.4));
      f.position.set(0, h * 0.74, h * 0.16); f.renderOrder = 9; g.add(f);
    }
  }
  return g;
}

export function well(M, { r = 1.1, h = 1.0, mat = M.stone, wood = M.wood, roof = true } = {}) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.06, h, 14, 1, true), mat);
  ring.position.y = h / 2; ring.material = mat; g.add(ring);
  const dark = new THREE.Mesh(new THREE.CircleGeometry(r * 0.94, 14), M.dark);
  dark.rotation.x = -Math.PI / 2; dark.position.y = h * 0.86; g.add(dark);
  if (roof) {
    for (const sx of [-1, 1]) {
      const p = new THREE.Mesh(box(0.14, 2.0, 0.14), wood);
      p.position.set(sx * r * 0.9, h + 1.0, 0); g.add(p);
    }
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, r * 2.1, 8), wood);
    bar.rotation.z = Math.PI / 2; bar.position.y = h + 1.9; g.add(bar);
    const cover = new THREE.Mesh(box(r * 2.6, 0.14, r * 2.0), wood);
    cover.position.y = h + 2.1; g.add(cover);
  }
  return g;
}

export function boat(M, { len = 6, beam = 1.8, mat = M.wood, mast = 0 } = {}) {
  const g = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 7, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5), mat);
  hull.scale.set(beam / 2, beam * 0.42, len / 2);
  hull.position.y = beam * 0.42;
  g.add(hull);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.045, 5, 18), mat);
  rim.rotation.x = Math.PI / 2;
  rim.scale.set(beam / 2, len / 2, 1);
  rim.position.y = beam * 0.42;
  g.add(rim);
  for (let i = 0; i < 3; i++) {
    const t = new THREE.Mesh(box(beam * 0.86, 0.09, 0.30), mat);
    t.position.set(0, beam * 0.36, (i - 1) * len * 0.24); g.add(t);
  }
  if (mast > 0) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, mast, 6), mat);
    m.position.y = beam * 0.42 + mast / 2; g.add(m);
  }
  return g;
}

export function crate(M, { s = 1, mat = M.wood } = {}) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(box(s, s * 0.82, s * 0.9), mat);
  b.position.y = s * 0.41; g.add(b);
  return g;
}

export function barrel(M, { r = 0.45, h = 1.1, mat = M.wood, hoop = M.iron } = {}) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.88, h, 10), mat);
  b.position.y = h / 2; g.add(b);
  for (const y of [h * 0.24, h * 0.76]) {
    const o = new THREE.Mesh(new THREE.TorusGeometry(r * 1.02, r * 0.05, 4, 12), hoop);
    o.rotation.x = Math.PI / 2; o.position.y = y; g.add(o);
  }
  return g;
}

export function bench(M, { len = 2.2, mat = M.wood, back = true } = {}) {
  const g = new THREE.Group();
  const seat = new THREE.Mesh(box(0.5, 0.09, len), mat);
  seat.position.y = 0.46; g.add(seat);
  for (const sz of [-1, 1]) {
    const l = new THREE.Mesh(box(0.44, 0.44, 0.1), mat);
    l.position.set(0, 0.22, sz * (len / 2 - 0.28)); g.add(l);
  }
  if (back) {
    const b = new THREE.Mesh(box(0.09, 0.42, len), mat);
    b.position.set(-0.20, 0.72, 0); g.add(b);
  }
  return g;
}

export function pot(M, { r = 0.5, h = 0.7, mat = M.cloth, plant = M.leaf } = {}) {
  const g = new THREE.Group();
  const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.72, h, 10), mat);
  p.position.y = h / 2; g.add(p);
  if (plant) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r * 1.15, 0), plant);
    b.position.y = h + r * 0.6; b.scale.y = 0.8; g.add(b);
  }
  return g;
}

export function cart(M, { len = 3, mat = M.wood, wheel = M.dark } = {}) {
  const g = new THREE.Group();
  const bed = new THREE.Mesh(box(1.5, 0.22, len), mat);
  bed.position.y = 0.78; g.add(bed);
  for (const sx of [-1, 1]) {
    const s = new THREE.Mesh(box(0.1, 0.55, len * 0.9), mat);
    s.position.set(sx * 0.75, 1.05, 0); g.add(s);
    for (const sz of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.14, 12), wheel);
      w.rotation.z = Math.PI / 2;
      w.position.set(sx * 0.8, 0.6, sz * len * 0.3); g.add(w);
    }
  }
  const shaft = new THREE.Mesh(box(0.12, 0.12, len * 0.7), mat);
  shaft.position.set(0, 0.8, len * 0.75); g.add(shaft);
  return g;
}

// ===========================================================================
// Growing things — geometry, for instancing
// ===========================================================================

export function treeGeo(kind = 'broad', seed = 1) {
  const rnd = mulberry(seed);
  const parts = [];
  if (kind === 'pine') {
    const t = new THREE.CylinderGeometry(0.06, 0.16, 1.0, 6); t.translate(0, 0.5, 0);
    parts.push(t.toNonIndexed());
    for (let i = 0; i < 4; i++) {
      const r = 0.46 - i * 0.09;
      const c = new THREE.ConeGeometry(r, 0.46, 8, 1);
      c.translate(0, 0.62 + i * 0.24, 0);
      parts.push(c.toNonIndexed());
    }
  } else if (kind === 'bare') {
    const t = new THREE.CylinderGeometry(0.05, 0.13, 1.0, 6); t.translate(0, 0.5, 0);
    parts.push(t.toNonIndexed());
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + (i % 3) * 0.4;
      const l = 0.4 + (i % 4) * 0.16;
      const b = new THREE.CylinderGeometry(0.02, 0.05, l, 4);
      b.translate(0, l / 2, 0);
      b.rotateZ(0.55 + (i % 3) * 0.18); b.rotateY(a);
      b.translate(0, 0.82 + (i % 3) * 0.12, 0);
      parts.push(b.toNonIndexed());
    }
  } else if (kind === 'bamboo') {
    for (let i = 0; i < 6; i++) {
      const c = new THREE.CylinderGeometry(0.028, 0.032, 0.19, 6);
      c.translate((i % 2) * 0.004, 0.10 + i * 0.19, 0);
      parts.push(c.toNonIndexed());
    }
    for (let i = 0; i < 7; i++) {
      const l = new THREE.PlaneGeometry(0.30, 0.05).toNonIndexed();
      l.rotateZ(0.5 + (i % 3) * 0.3); l.rotateY(i * 1.9);
      l.translate(0.12, 0.72 + i * 0.05, 0);
      parts.push(l);
    }
  } else if (kind === 'palm') {
    const t = new THREE.CylinderGeometry(0.05, 0.10, 1.0, 6);
    t.translate(0, 0.5, 0); parts.push(t.toNonIndexed());
    for (let i = 0; i < 7; i++) {
      const f = new THREE.PlaneGeometry(0.62, 0.16, 3, 1).toNonIndexed();
      const p = f.attributes.position;
      for (let v = 0; v < p.count; v++) p.setZ(v, -Math.pow((p.getX(v) + 0.31) / 0.62, 2) * 0.3);
      f.computeVertexNormals();
      f.rotateY(Math.PI / 2); f.translate(0, 0, 0.31);
      f.rotateX(-0.4); f.rotateY((i / 7) * Math.PI * 2);
      f.translate(0, 1.0, 0);
      parts.push(f);
    }
  } else {                                   // broadleaf
    const t = new THREE.CylinderGeometry(0.07, 0.16, 0.9, 6); t.translate(0, 0.45, 0);
    parts.push(t.toNonIndexed());
    for (let i = 0; i < 5; i++) {
      const g = new THREE.IcosahedronGeometry(1, 0);
      const q = g.attributes.position;
      for (let v = 0; v < q.count; v++) {
        const n = 0.74 + ((v * 13 + i * 19) % 11) / 22;
        q.setXYZ(v, q.getX(v) * n, q.getY(v) * n * 0.92, q.getZ(v) * n);
      }
      g.computeVertexNormals();
      const sc = 0.30 + (i % 3) * 0.11;
      g.scale(sc, sc * 0.9, sc);
      g.translate((i % 3 - 1) * 0.26, 0.95 + (i % 2) * 0.2, ((i * 7) % 3 - 1) * 0.24);
      parts.push(g.toNonIndexed());
    }
  }
  void rnd;
  return mergePN(parts);
}

// A wood round a place. Never inside the corridor you are walking down, and
// never so close to the middle that it hides what you came for.
export function grove(M, { n = 400, r = 200, inner = 60, kind = 'broad', mat = M.leaf,
                           trunkMat = M.trunk, h = 9, spread = 4, seed = 11, at = [0, 0],
                           avoid = [] } = {}) {
  const g = new THREE.Group();
  const rnd = mulberry(seed);
  const items = [], trunks = [];
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const d = inner + Math.pow(rnd(), 0.7) * (r - inner);
    const x = at[0] + Math.cos(a) * d, z = at[1] + Math.sin(a) * d;
    if (avoid.some(([ax, az, ar]) => Math.hypot(x - ax, z - az) < ar)) continue;
    const s = h * (0.7 + rnd() * 0.6);
    items.push({ pos: [x, 0, z], rot: [0, rnd() * 6.28, 0], scale: [s * spread / h, s, s * spread / h] });
    trunks.push({ pos: [x, 0, z], scale: [s * 0.09, s, s * 0.09] });
  }
  put(g, items, treeGeo(kind, seed), mat);
  if (kind !== 'bamboo' && kind !== 'bare') {
    put(g, trunks, new THREE.CylinderGeometry(0.06, 0.11, 1, 5).translate(0, 0.5, 0), trunkMat);
  }
  return g;
}

// Scrub, tufts, flowers — the small stuff that stops ground being a plate.
export function scatter(M, { n = 600, r = 60, at = [0, 0], y = 0, mat = M.moss,
                             geo = null, s = 1.2, vary = 0.7, seed = 5, flat = false } = {}) {
  const g = new THREE.Group();
  const rnd = mulberry(seed);
  const items = [];
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, d = Math.pow(rnd(), 0.55) * r;
    const k = s * (1 - vary / 2 + rnd() * vary);
    items.push({
      pos: [at[0] + Math.cos(a) * d, y, at[1] + Math.sin(a) * d],
      rot: [0, rnd() * 6.28, 0],
      scale: flat ? [k, k * 0.1, k] : [k, k * (0.6 + rnd() * 0.8), k],
    });
  }
  put(g, items, geo ?? new THREE.IcosahedronGeometry(1, 0), mat);
  return g;
}

// ===========================================================================
// The way there
//
// Ghibli never tells you where to walk and you always know. It is done with a
// line in the ground: stones across a stream, a break in the trees, lanterns at
// intervals, a path worn pale by feet. This is that line, and it is the only
// signpost this world has.
// ===========================================================================

export function trail(M, { from = [0, 0], to = [0, 100], style = 'path', n = null,
                           mat = null, y = 0, width = 1.7, seed = 2 } = {}) {
  const g = new THREE.Group();
  const rnd = mulberry(seed);
  const dx = to[0] - from[0], dz = to[1] - from[1];
  const len = Math.hypot(dx, dz);
  const ux = dx / len, uz = dz / len;
  const ang = Math.atan2(dx, dz);
  // a path that runs dead straight is a runway; a path that wanders is a path
  const wob = (t) => Math.sin(t * 5.1 + seed) * width * 1.4 + Math.sin(t * 11.7) * width * 0.6;

  if (style === 'stones' || style === 'path') {
    const count = n ?? Math.round(len / (style === 'stones' ? 2.6 : 1.5));
    const items = [];
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const w = wob(t);
      const s = style === 'stones' ? 0.5 + rnd() * 0.5 : width * (0.8 + rnd() * 0.5);
      items.push({
        pos: [from[0] + ux * len * t - uz * w, y + 0.06, from[1] + uz * len * t + ux * w],
        rot: [0, rnd() * 6.28, 0],
        scale: [s, style === 'stones' ? 0.24 : 0.09, s * (0.7 + rnd() * 0.6)],
      });
    }
    put(g, items, style === 'stones'
      ? hill(1, 1, 4, { rough: 0.5, rings: 4, sectors: 8 })
      : new THREE.CircleGeometry(1, 9).rotateX(-Math.PI / 2),
      mat ?? (style === 'stones' ? M.rock : M.earth));
  } else if (style === 'lanterns') {
    const count = n ?? Math.max(3, Math.round(len / 26));
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      const w = wob(t) + (i % 2 ? 2.2 : -2.2);
      const l = lantern(M, { h: 2.0, stone: true, lit: true });
      l.position.set(from[0] + ux * len * t - uz * w, y, from[1] + uz * len * t + ux * w);
      l.rotation.y = ang;
      g.add(l);
    }
  } else if (style === 'posts') {
    const count = n ?? Math.max(4, Math.round(len / 18));
    const items = [];
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      const w = wob(t);
      items.push({
        pos: [from[0] + ux * len * t - uz * w, y + 0.9, from[1] + uz * len * t + ux * w],
        rot: [(rnd() - 0.5) * 0.1, 0, (rnd() - 0.5) * 0.1],
        scale: [0.18, 1.8, 0.18],
      });
    }
    put(g, items, box(1, 1, 1), mat ?? M.wood);
  } else if (style === 'cut') {          // a break in the trees, marked by stumps
    const count = n ?? Math.round(len / 22);
    const items = [];
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      const w = wob(t) + (i % 2 ? 5 : -5);
      const s = 0.5 + rnd() * 0.5;
      items.push({
        pos: [from[0] + ux * len * t - uz * w, y + s * 0.3, from[1] + uz * len * t + ux * w],
        rot: [0, rnd() * 6.28, 0], scale: [s, s * 0.6, s],
      });
    }
    put(g, items, new THREE.CylinderGeometry(1, 1.1, 1, 8), mat ?? M.trunk);
  }
  return g;
}

export { box, hill, mulberry, mergePN, fillInstances, curvedRoof };
