import * as THREE from 'three';
import { box, mulberry, mergePN, fillInstances } from './geo.js';
import { makePaintMaterial, makeGlowMaterial } from './paintMaterial.js';

// ---------------------------------------------------------------------------
// The people, and everything else that is going somewhere.
//
// Eddie, after the countries were built: "you should have characters — town
// folk walking around, doing their business, like the stories. A noodle seller
// would have a store and sell. Cars driving around; aeroplanes flying. A
// battleship floating in the distant sky." He is right, and it is the thing
// that separates a diorama from a place: a world with nobody in it reads as a
// model of a world.
//
// Everything here is instanced and driven by one number — the distance each
// agent has travelled along its own path — so a town of a hundred people, a
// road of traffic and a squadron of aircraft together cost a handful of draw
// calls and a few hundred matrix composes a frame.
//
// The figures are deliberately small and never detailed. A Ghibli crowd is
// read as SHAPE and MOTION: coats of different colours moving at different
// speeds, stopping, turning. Faces at this distance are noise, and faces near
// to hand are a promise the renderer cannot keep.
// ---------------------------------------------------------------------------

// ---- geometry, built once and shared by every region -----------------------

const G = {};

// ---- the figure ------------------------------------------------------------
//
// Eddie, on the first pass: "for town folks, they shouldn't be blobs of shapes,
// they should resemble the characters in the movies, otherwise they look too
// bad to be there." He is right, and a blob is worse than nobody: an empty
// street reads as quiet, a street of lumps reads as broken.
//
// So the figure is built as a person and the legs are separate, on their own
// hip pivot, so a crowd actually WALKS. Four instanced meshes a population
// instead of two — body, head, and a leg each side — and the whole town still
// costs less than one of its buildings.
//
// The proportions are the ones the films use, which are not human: the head is
// close to a fifth of the height, the shoulders are narrow, and the hands are
// small. Getting that ratio right is most of what makes a silhouette read as
// "drawn" rather than "modelled".
//
// Three builds, mixed through every crowd: an adult, an adult carrying
// something, and a child. Nothing has a face — at the range you ever see them,
// a face is two dark pixels that read as damage.

const HIP = 0.42;                     // where the legs pivot, in figure units

// ---- what these people are wearing -----------------------------------------
//
// Eddie: "characters of each country should be according to the movies, not
// all the same." One crowd walked through twenty-seven films in the same coat,
// which is worse than it sounds — a Showa schoolboy in Iron Town and a
// bathhouse spirit in a duffel coat both quietly say "this was generated".
//
// A wardrobe is a set of proportions rather than a new figure: how long the
// garment is, how wide it falls, whether there is an apron over it, what is on
// the head. That is enough. At the distance you see a crowd, a silhouette is a
// hem line and a hat — nobody has ever recognised a character by their face in
// a wide shot.
const WARDROBE = {
  // post-war and modern Japan: short jackets, bare heads, school caps
  showa:  { hem: 0.235, len: 0.50, hat: 'cap',     legs: 1.0 },
  // the old country: robes to the ankle, wide sleeves, straw kasa
  edo:    { hem: 0.315, len: 0.78, hat: 'kasa',    legs: 0.34, sleeve: 1.5 },
  // northern Europe: long skirts, aprons, headscarves and bonnets
  euro:   { hem: 0.305, len: 0.68, hat: 'bonnet',  legs: 0.55, apron: true },
  // the Adriatic in shirtsleeves
  medit:  { hem: 0.215, len: 0.44, hat: 'flat',    legs: 1.0 },
  // a dry country: hooded robes, everything covered
  desert: { hem: 0.330, len: 0.86, hat: 'hood',    legs: 0.22, sleeve: 1.3 },
  // people who work with iron and fire: aprons, head cloths, sleeves rolled
  worker: { hem: 0.240, len: 0.52, hat: 'wrap',    legs: 1.0, apron: true },
  // 1920: suits, and hats that mean something
  y1920:  { hem: 0.200, len: 0.62, hat: 'homburg', legs: 1.0 },
  // and the bathhouse guests, who do not have legs and do not need them
  spirit: { hem: 0.360, len: 0.96, hat: 'mask',    legs: 0, float: true, sleeve: 1.7 },
};
const W = (name) => WARDROBE[name] ?? WARDROBE.showa;

// Costume palettes. A Ghibli crowd is colour-graded to its film — the reds in
// Market Chipping are not the reds in Iron Town, and a country whose people
// are dressed in the wrong twelve colours reads as the wrong country even when
// every building is right.
const PALETTE = {
  showa:  [[0.86,0.42,0.26],[0.30,0.38,0.60],[0.74,0.70,0.54],[0.34,0.46,0.34],
           [0.92,0.80,0.52],[0.52,0.24,0.30],[0.22,0.28,0.36],[0.72,0.54,0.32]],
  edo:    [[0.36,0.30,0.24],[0.24,0.28,0.30],[0.58,0.50,0.36],[0.30,0.36,0.32],
           [0.46,0.34,0.28],[0.68,0.62,0.48],[0.22,0.24,0.28],[0.52,0.44,0.34]],
  euro:   [[0.70,0.30,0.26],[0.28,0.34,0.52],[0.84,0.76,0.58],[0.36,0.44,0.30],
           [0.56,0.34,0.44],[0.90,0.86,0.78],[0.34,0.30,0.26],[0.62,0.56,0.66]],
  medit:  [[0.92,0.88,0.78],[0.86,0.74,0.50],[0.34,0.46,0.58],[0.78,0.42,0.30],
           [0.90,0.90,0.86],[0.52,0.56,0.48],[0.70,0.66,0.54],[0.30,0.34,0.38]],
  desert: [[0.78,0.68,0.48],[0.62,0.52,0.38],[0.86,0.78,0.62],[0.48,0.40,0.32],
           [0.70,0.44,0.30],[0.56,0.50,0.42],[0.82,0.72,0.54],[0.40,0.36,0.30]],
  worker: [[0.62,0.50,0.36],[0.40,0.34,0.30],[0.74,0.66,0.50],[0.52,0.28,0.24],
           [0.30,0.32,0.34],[0.66,0.58,0.44],[0.44,0.42,0.38],[0.78,0.70,0.56]],
  y1920:  [[0.30,0.30,0.32],[0.22,0.24,0.30],[0.52,0.48,0.42],[0.72,0.68,0.60],
           [0.36,0.32,0.28],[0.88,0.84,0.76],[0.26,0.30,0.36],[0.60,0.54,0.46]],
  spirit: [[0.32,0.26,0.34],[0.24,0.30,0.38],[0.44,0.32,0.30],[0.28,0.34,0.30],
           [0.50,0.42,0.36],[0.20,0.22,0.30],[0.38,0.30,0.42],[0.34,0.38,0.42]],
};

function bodyGeo(variant, wd = 'showa') {
  const key = 'body' + variant + wd;
  if (G[key]) return G[key];
  const w = W(wd);
  const parts = [];
  const child = variant === 2;
  const S = child ? 0.72 : 1;

  // the garment: shoulders narrow, hem wide. Its LENGTH is the wardrobe —
  // a jacket that stops at the hip and a robe that reaches the floor are the
  // same three lines of code and two entirely different centuries.
  const coat = new THREE.CylinderGeometry(0.145 * S, w.hem * S, w.len * S, 9);
  coat.translate(0, HIP + (0.50 - w.len * 0.5) * S, 0); parts.push(coat.toNonIndexed());
  if (w.apron) {
    // an apron over the front — the single clearest "this person works" cue
    const ap = box(0.30 * S, w.len * 0.62 * S, 0.05 * S);
    ap.translate(0, HIP + (0.44 - w.len * 0.42) * S, 0.16 * S);
    parts.push(ap.toNonIndexed());
  }
  // a collar, which is what stops the neck reading as a stick
  const collar = new THREE.CylinderGeometry(0.10 * S, 0.155 * S, 0.09 * S, 9);
  collar.translate(0, HIP + 0.52 * S, 0); parts.push(collar.toNonIndexed());
  // the neck
  const neck = new THREE.CylinderGeometry(0.043 * S, 0.05 * S, 0.09 * S, 6);
  neck.translate(0, HIP + 0.575 * S, 0); parts.push(neck.toNonIndexed());

  // arms: down at the sides, angled slightly out, with hands
  const sl = w.sleeve ?? 1;
  for (const s of [-1, 1]) {
    const upper = new THREE.CylinderGeometry(0.042 * S * sl, 0.036 * S * sl * sl, 0.44 * S, 6);
    upper.rotateZ(s * 0.13);
    upper.translate(s * 0.165 * S, HIP + 0.26 * S, 0);
    parts.push(upper.toNonIndexed());
    if (sl < 1.3) {                    // a wide sleeve swallows the hand
      const hand = new THREE.SphereGeometry(0.042 * S, 6, 5);
      hand.translate(s * 0.205 * S, HIP + 0.045 * S, 0.01 * S);
      parts.push(hand.toNonIndexed());
    }
  }

  if (variant === 1) {
    // carrying something — a bundle on the back, which changes the whole
    // silhouette and is how you tell a market from a promenade
    const b = new THREE.SphereGeometry(0.155, 8, 6);
    b.scale(1, 0.85, 0.8); b.translate(0, HIP + 0.38, -0.20);
    parts.push(b.toNonIndexed());
    const strap = box(0.028, 0.34, 0.03);
    strap.rotateX(-0.2); strap.translate(0.09, HIP + 0.36, -0.03);
    parts.push(strap.toNonIndexed());
  }
  G[key] = mergePN(parts);
  return G[key];
}

function headGeo(variant, wd = 'showa') {
  const key = 'head' + variant + wd;
  if (G[key]) return G[key];
  const w = W(wd);
  const parts = [];
  const child = variant === 2;
  const S = child ? 0.72 : 1;
  // A large head on a small body. It is the single strongest signal that a
  // figure was drawn rather than measured.
  const R = (child ? 0.115 : 0.105);
  const h = new THREE.SphereGeometry(R, 9, 7);
  h.scale(1, 1.08, 0.94); h.translate(0, HIP + 0.70 * S, 0);
  parts.push(h.toNonIndexed());
  // hair as a cap plus a fringe over the brow — no face, ever
  const cap = new THREE.SphereGeometry(R * 1.11, 9, 7, 0, Math.PI * 2, 0, 1.5);
  cap.scale(1, 1.0, 1.0); cap.translate(0, HIP + 0.705 * S, -0.006);
  parts.push(cap.toNonIndexed());
  const back = new THREE.CylinderGeometry(R * 1.11, R * 1.02, R * 0.9, 9, 1, true);
  back.translate(0, HIP + 0.665 * S, -0.012);
  parts.push(back.toNonIndexed());
  // What is on the head. The kasa is the loudest silhouette in the set — a
  // cone a foot across turns a walking figure into an Edo road on its own —
  // and the hood is the same trick for a dry country.
  const top = HIP + 0.755 * S, hat = w.hat;
  const wears = hat === 'kasa' || hat === 'hood' || hat === 'mask' || hat === 'bonnet' || variant === 1;
  if (wears) {
    if (hat === 'kasa') {
      const k = new THREE.ConeGeometry(R * 2.5, R * 1.5, 12);
      k.translate(0, top + R * 0.55, 0); parts.push(k.toNonIndexed());
    } else if (hat === 'hood') {
      const hd = new THREE.SphereGeometry(R * 1.42, 9, 7);
      hd.scale(1, 1.15, 1.05); hd.translate(0, top - R * 0.42, -R * 0.10);
      parts.push(hd.toNonIndexed());
      const drape = new THREE.CylinderGeometry(R * 1.30, R * 1.85, R * 2.2, 9, 1, true);
      drape.translate(0, top - R * 1.55, 0); parts.push(drape.toNonIndexed());
    } else if (hat === 'mask') {
      // not a face — a plain oval plate where one would be, which is what a
      // spirit in this film wears instead of one
      const mk = new THREE.SphereGeometry(R * 1.06, 9, 7, 0, Math.PI, 0.5, 2.0);
      mk.scale(1, 1.16, 0.55); mk.translate(0, top - R * 0.62, R * 0.52);
      mk.rotateY(-Math.PI / 2); parts.push(mk.toNonIndexed());
    } else if (hat === 'bonnet') {
      const bn = new THREE.SphereGeometry(R * 1.24, 9, 7, 0, Math.PI * 2, 0, 1.7);
      bn.translate(0, top - R * 0.66, -R * 0.14); parts.push(bn.toNonIndexed());
      const bk = new THREE.CylinderGeometry(R * 1.24, R * 1.36, R * 1.1, 9, 1, true);
      bk.translate(0, top - R * 1.30, -R * 0.14); parts.push(bk.toNonIndexed());
    } else if (hat === 'wrap') {
      const wr = new THREE.CylinderGeometry(R * 1.18, R * 1.16, R * 0.85, 9);
      wr.translate(0, top - R * 0.26, 0); parts.push(wr.toNonIndexed());
    } else if (hat === 'homburg') {
      const brim = new THREE.CylinderGeometry(R * 1.75, R * 1.75, 0.014, 12);
      brim.translate(0, top, 0); parts.push(brim.toNonIndexed());
      const crown = new THREE.CylinderGeometry(R * 1.00, R * 1.10, 0.105, 10);
      crown.translate(0, top + 0.055, 0); parts.push(crown.toNonIndexed());
    } else {
      const brim = new THREE.CylinderGeometry(R * 1.9, R * 1.9, 0.016, 12);
      brim.translate(0, top, 0); parts.push(brim.toNonIndexed());
      const crown = new THREE.CylinderGeometry(R * 1.02, R * 1.12, 0.075, 10);
      crown.translate(0, top + 0.04, 0); parts.push(crown.toNonIndexed());
    }
  }
  G[key] = mergePN(parts);
  return G[key];
}

// One leg, hanging from the origin, so the instance matrix can swing it.
function legGeo(variant, wd = 'showa') {
  const key = 'leg' + variant + wd;
  if (G[key]) return G[key];
  const w = W(wd);
  const S = variant === 2 ? 0.72 : 1;
  const parts = [];
  // How much leg the garment leaves showing. A robe leaves a foot; a spirit
  // leaves nothing, because it is not walking — the empty geometry keeps the
  // rig identical instead of forking the whole update loop for one case.
  const L = w.legs;
  if (L > 0.01) {
    const thigh = new THREE.CylinderGeometry(0.048 * S, 0.040 * S, 0.42 * S * L, 6);
    thigh.translate(0, -0.21 * S * L, 0); parts.push(thigh.toNonIndexed());
    const boot = box(0.075 * S, 0.055 * S, 0.145 * S);
    boot.translate(0, -(0.42 * L + 0.03) * S, 0.028 * S); parts.push(boot.toNonIndexed());
  }
  G[key] = parts.length ? mergePN(parts) : new THREE.BufferGeometry()
    .setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3))
    .setAttribute('normal', new THREE.BufferAttribute(new Float32Array(9), 3));
  return G[key];
}

// One figure as a single merged geometry — body, head and both legs, standing.
//
// For processions: a column of marchers is carried along one path by one update
// loop, and nobody in a marching column has an independent stride anyway. It
// reads as people because it uses the SAME wardrobe as the crowds do, which is
// the whole reason it lives here rather than being built again somewhere else:
// a country whose parade is dressed differently from its townsfolk stops being
// one country.
export function figureGeo(variant = 0, wd = 'showa') {
  const key = 'fig' + variant + wd;
  if (G[key]) return G[key];
  const w = W(wd);
  const S = variant === 2 ? 0.72 : 1;
  const parts = [bodyGeo(variant, wd).clone(), headGeo(variant, wd).clone()];
  const leg = legGeo(variant, wd);
  if (leg.attributes.position.count > 3) {
    for (const s of [-1, 1]) {
      const l = leg.clone();
      l.rotateX(s * 0.16);
      l.translate(s * 0.075 * S, HIP * S, 0);
      parts.push(l);
    }
  }
  G[key] = mergePN(parts);
  return G[key];
}

export { PALETTE, WARDROBE };

function carGeo() {
  if (G.car) return G.car;
  const parts = [];
  const body = box(1.7, 0.85, 4.0); body.translate(0, 0.78, 0); parts.push(body.toNonIndexed());
  const cab = box(1.5, 0.62, 1.9); cab.translate(0, 1.48, -0.2); parts.push(cab.toNonIndexed());
  for (const sx of [-1, 1]) for (const sz of [-1.3, 1.3]) {
    const w = new THREE.CylinderGeometry(0.36, 0.36, 0.22, 10);
    w.rotateZ(Math.PI / 2); w.translate(sx * 0.86, 0.36, sz);
    parts.push(w.toNonIndexed());
  }
  G.car = mergePN(parts);
  return G.car;
}

function planeGeo() {
  if (G.plane) return G.plane;
  const parts = [];
  const f = new THREE.CylinderGeometry(0.55, 0.30, 7.0, 10);
  f.rotateX(Math.PI / 2); parts.push(f.toNonIndexed());
  const w = box(11.0, 0.22, 1.7); w.translate(0, -0.1, 0.4); parts.push(w.toNonIndexed());
  const t = box(3.4, 0.18, 1.0); t.translate(0, 0.2, -3.0); parts.push(t.toNonIndexed());
  const fin = box(0.16, 1.3, 1.1); fin.translate(0, 0.8, -3.1); parts.push(fin.toNonIndexed());
  const p = box(0.12, 4.2, 0.28); p.translate(0, 0, 3.7); parts.push(p.toNonIndexed());
  G.plane = mergePN(parts);
  return G.plane;
}

function boatGeo() {
  if (G.boat) return G.boat;
  const parts = [];
  const hull = new THREE.SphereGeometry(1, 12, 7, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5);
  hull.scale(1.2, 0.9, 3.4); hull.translate(0, 0.9, 0); parts.push(hull.toNonIndexed());
  const cab = box(1.5, 1.1, 1.8); cab.translate(0, 1.5, -0.6); parts.push(cab.toNonIndexed());
  const mast = box(0.12, 3.4, 0.12); mast.translate(0, 2.6, 0.8); parts.push(mast.toNonIndexed());
  G.boat = mergePN(parts);
  return G.boat;
}

// ---- the stall: a store, and somebody behind it -----------------------------
//
// A seller with no shop is a person standing in a field. The stall is what
// makes it a trade: a counter, a roof over it, a pot with steam coming off,
// and stools on the customer side.
function stall(M, opts = {}) {
  const { w = 3.4, d = 2.2, h = 2.3, cloth = M.cloth, wood = M.wood } = opts;
  const g = new THREE.Group();
  const counter = new THREE.Mesh(box(w, 0.9, d), wood);
  counter.position.y = 0.72; g.add(counter);
  const top = new THREE.Mesh(box(w + 0.4, 0.1, d + 0.4), wood);
  top.position.y = 1.2; g.add(top);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const p = new THREE.Mesh(box(0.09, h, 0.09), wood);
    p.position.set(sx * (w / 2 - 0.1), h / 2, sz * (d / 2 - 0.1)); g.add(p);
  }
  const awn = new THREE.Mesh(box(w + 0.9, 0.08, d + 0.9), cloth);
  awn.position.y = h; g.add(awn);
  // the hanging curtain across the front, which is the whole silhouette
  const noren = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.6, 0.75), cloth);
  noren.position.set(0, h - 0.45, (d + 0.9) / 2 - 0.05); g.add(noren);
  // the pot, and the steam
  const pot2 = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.30, 0.42, 12), M.iron ?? wood);
  pot2.position.set(w * 0.24, 1.42, 0); g.add(pot2);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(0.3, 12), M.warmStall);
  glow.rotation.x = -Math.PI / 2; glow.position.set(w * 0.24, 1.64, 0);
  glow.renderOrder = 9; g.add(glow);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), M.warmStall);
  lamp.position.set(-w * 0.3, h - 0.25, 0); lamp.renderOrder = 9; g.add(lamp);
  // three stools
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.5, 8), wood);
    s.position.set(-w / 2 + 0.7 + i * (w - 1.4) / 2, 0.25, d / 2 + 0.8); g.add(s);
  }
  return g;
}

// ---------------------------------------------------------------------------
// Paths. A path turns one number — how far an agent has gone — into a place
// and a direction, and that is the whole movement system.
// ---------------------------------------------------------------------------

function makePath(p) {
  if (p.type === 'ring') {
    const R = p.r, r2 = p.r2 ?? p.r;
    const len = Math.PI * (3 * (R + r2) - Math.sqrt((3 * R + r2) * (R + 3 * r2)));
    return {
      len,
      at(s, out) {
        const a = (s / len) * Math.PI * 2 * (p.reverse ? -1 : 1);
        out.x = p.at[0] + Math.cos(a) * R;
        out.z = p.at[1] + Math.sin(a) * r2;
        out.y = p.y ?? 0;
        out.h = Math.atan2(-Math.sin(a) * R, Math.cos(a) * r2) + (p.reverse ? Math.PI : 0);
        return out;
      },
    };
  }
  // A route: a walk with somewhere to be. Points are [x, z, y] and the crowd
  // follows them end to end and then starts again at the beginning, which is
  // what a procession is — off the boat, along the quay, up the street, over
  // the bridge and in at the door. A ring is a crowd milling; a street is a
  // crowd pacing; this is a crowd ARRIVING, and it is the only one of the
  // three that tells a story.
  if (p.type === 'route') {
    const pts = p.points;
    const seg = [];
    let total = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      seg.push({ a: pts[i], b: pts[i + 1], d, at: total });
      total += d;
    }
    return {
      len: total,
      at(s, out) {
        let t = s % total; if (t < 0) t += total;
        let k = 0;
        while (k < seg.length - 1 && t > seg[k].at + seg[k].d) k++;
        const g = seg[k], u = g.d > 0 ? (t - g.at) / g.d : 0;
        out.x = g.a[0] + (g.b[0] - g.a[0]) * u;
        out.z = g.a[1] + (g.b[1] - g.a[1]) * u;
        out.y = (g.a[2] ?? 0) + ((g.b[2] ?? 0) - (g.a[2] ?? 0)) * u;
        out.h = Math.atan2(g.b[0] - g.a[0], g.b[1] - g.a[1]);
        return out;
      },
    };
  }
  // a street: there and back, with a turn at each end
  const dx = p.to[0] - p.from[0], dz = p.to[1] - p.from[1];
  const L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
  return {
    len: L * 2,
    at(s, out) {
      const t = s % (L * 2);
      const fwd = t < L;
      const u = fwd ? t : L * 2 - t;
      out.x = p.from[0] + ux * u;
      out.z = p.from[1] + uz * u;
      out.y = p.y ?? 0;
      out.h = Math.atan2(ux, uz) + (fwd ? 0 : Math.PI);
      return out;
    },
  };
}

// ---------------------------------------------------------------------------
// A population: one kind of thing, many of them, on one path.
// ---------------------------------------------------------------------------

// A crowd is read as a spread of values, not of hues: mostly muted earths and
// indigos with two or three that carry, so the eye picks somebody to follow.
// smoothstep between two edges, either way round
function smooth(x, a, b) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function population(M, spec, seed) {
  const rnd = mulberry(seed);
  const path = makePath(spec.path);
  const fade = spec.fade === true;
  const n = spec.n ?? 12;
  const group = new THREE.Group();
  const agents = [];
  for (let i = 0; i < n; i++) {
    agents.push({
      s: rnd() * path.len,
      v: (spec.speed ?? 1.2) * (0.75 + rnd() * 0.5),
      side: (rnd() - 0.5) * (spec.width ?? 3),
      scale: (spec.scale ?? 1) * (0.9 + rnd() * 0.2),
      ph: rnd() * 6.28,
      // some of them stop for a while, which is what makes a street a street
      pause: spec.pause === false ? null : { at: rnd() * path.len, len: 3 + rnd() * 9, every: 26 + rnd() * 40 },
    });
  }

  let bodies, heads;
  const parts = [];                    // the walker rig, if this is people
  const kind = spec.kind ?? 'walkers';
  if (kind === 'walkers') {
    // Three builds, and each gets its own set of meshes so the geometry can
    // differ. A crowd of one silhouette is a chorus line.
    const wd = spec.cast ?? 'showa';
    const pal = PALETTE[wd] ?? PALETTE.showa;
    const mix = [[], [], []];
    agents.forEach((a, i) => {
      // Spirits do not bring their children to the bathhouse.
      a.variant = W(wd).float ? (rnd() < 0.4 ? 1 : 0)
                : rnd() < 0.18 ? 2 : (rnd() < 0.35 ? 1 : 0);
      mix[a.variant].push(i);
    });
    const c = new THREE.Color();
    mix.forEach((idx, v) => {
      if (!idx.length) return;
      const body = new THREE.InstancedMesh(bodyGeo(v, wd), M.coat, idx.length);
      const head = new THREE.InstancedMesh(headGeo(v, wd), M.skin, idx.length);
      const legA = new THREE.InstancedMesh(legGeo(v, wd), M.trouser, idx.length);
      const legB = new THREE.InstancedMesh(legGeo(v, wd), M.trouser, idx.length);
      idx.forEach((ai, k) => {
        const col = pal[(rnd() * pal.length) | 0];
        c.setRGB(col[0] * 1.15, col[1] * 1.15, col[2] * 1.15);
        body.setColorAt(k, c);
        agents[ai].slot = k;
      });
      body.instanceColor.needsUpdate = true;
      [body, head, legA, legB].forEach(m => { m.frustumCulled = false; group.add(m); });
      parts.push({ v, idx, body, head, legA, legB });
    });
  } else if (kind === 'cars') {
    bodies = new THREE.InstancedMesh(carGeo(), M.paint, n);
    const c = new THREE.Color();
    agents.forEach((a, i) => {
      c.setRGB(0.7 + rnd() * 0.6, 0.7 + rnd() * 0.5, 0.7 + rnd() * 0.5);
      bodies.setColorAt(i, c);
    });
    bodies.instanceColor.needsUpdate = true;
  } else if (kind === 'planes') {
    bodies = new THREE.InstancedMesh(planeGeo(), M.metal, n);
  } else {
    bodies = new THREE.InstancedMesh(boatGeo(), M.hull, n);
  }
  if (bodies) { bodies.frustumCulled = false; group.add(bodies); }
  if (heads) { heads.frustumCulled = false; group.add(heads); }

  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const pv = new THREE.Vector3(), sv = new THREE.Vector3(), hip = new THREE.Vector3();
  const at = { x: 0, y: 0, z: 0, h: 0 };

  function step(a, t) {
    let moving = 1;
    if (a.pause) {
      const c = (t + a.ph * 9) % a.pause.every;
      if (c < a.pause.len) moving = 0;
    }
    a.s += a.v * moving * (1 / 60);
    path.at(a.s, at);
    a.moving = moving;
    return at;
  }

  function update(t) {
    if (kind === 'walkers') {
      parts.forEach(({ v, idx, body, head, legA, legB }) => {
        const S = v === 2 ? 0.72 : 1;
        idx.forEach((ai, k) => {
          const a = agents[ai];
          step(a, t);
          const cos = Math.cos(at.h), sin = Math.sin(at.h);
          const ox = cos * a.side, oz = -sin * a.side;
          // Stride length is fixed, so step rate follows speed and nobody
          // moonwalks. Stopped, they settle rather than marching on the spot.
          // A spirit has no stride, so it gets a slow rise and fall instead —
          // and because its legs are empty geometry the same rig drives both.
          const drift = W(spec.cast ?? 'showa').float;
          const swing = drift ? 0 : Math.sin(a.s / (0.62 * a.scale) + a.ph) * 0.58 * a.moving;
          const bob = drift
            ? Math.sin(t * 0.7 + a.ph) * 0.075 * a.scale
            : Math.abs(Math.cos(a.s / (0.62 * a.scale) + a.ph)) * 0.028 * a.scale * a.moving;
          pv.set(at.x + ox, at.y + bob, at.z + oz);
          // A route has two ends, and the walk between them is one way. Rather
          // than snap everybody back to the start when they reach the door,
          // they arrive out of nothing at the gangway and are gone by the time
          // they are through it — which is what a spirit does anyway.
          sv.setScalar(a.scale * (fade
            ? Math.min(smooth(a.s / path.len, 0.0, 0.05), smooth(a.s / path.len, 1.0, 0.92))
            : 1));

          e.set(0, at.h, 0); q.setFromEuler(e);
          m.compose(pv, q, sv); body.setMatrixAt(k, m);
          // the head turns a little on its own, and turns more when stopped —
          // which is what somebody who has paused actually does
          e.set(0, at.h + Math.sin(t * 0.5 + a.ph) * 0.55 * (1 - a.moving * 0.72), 0);
          q.setFromEuler(e);
          m.compose(pv, q, sv); head.setMatrixAt(k, m);

          for (let s = 0; s < 2; s++) {
            const sx = s ? 1 : -1;
            hip.set(
              pv.x + cos * sx * 0.075 * a.scale * S,
              pv.y + HIP * a.scale * S,
              pv.z - sin * sx * 0.075 * a.scale * S,
            );
            e.set(sx > 0 ? swing : -swing, at.h, 0);
            q.setFromEuler(e);
            m.compose(hip, q, sv);
            (s ? legB : legA).setMatrixAt(k, m);
          }
        });
        [body, head, legA, legB].forEach(mm => { mm.instanceMatrix.needsUpdate = true; });
      });
      return;
    }

    agents.forEach((a, i) => {
      step(a, t);
      const cos = Math.cos(at.h), sin = Math.sin(at.h);
      // offset sideways from the centre line, so a road has two lanes
      const ox = cos * a.side, oz = -sin * a.side;
      const lean = kind === 'planes' ? Math.sin(t * 0.21 + a.ph) * 0.22 : 0;
      pv.set(at.x + ox, at.y + (kind === 'planes' ? Math.sin(t * 0.17 + a.ph) * 6 : 0), at.z + oz);
      e.set(kind === 'boats' ? Math.sin(t * 0.9 + a.ph) * 0.05 : 0, at.h, lean);
      q.setFromEuler(e);
      sv.setScalar(a.scale);
      m.compose(pv, q, sv);
      bodies.setMatrixAt(i, m);
    });
    bodies.instanceMatrix.needsUpdate = true;
  }

  update(0);
  return { group, update };
}

// ---------------------------------------------------------------------------
// The battleship in the distant sky.
//
// It is not a Ghibli film without one, and it is never near. It hangs a long
// way off at altitude, moves at almost nothing, and is the only thing in the
// world that makes the sky look occupied.
// ---------------------------------------------------------------------------

function airship(M, spec) {
  const g = new THREE.Group();
  const rnd = mulberry(spec.seed ?? 3);
  const L = spec.len ?? 120;
  const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 11), M.hullDark);
  hull.scale.set(L * 0.16, L * 0.13, L * 0.5); g.add(hull);
  const deck = new THREE.Mesh(box(L * 0.24, L * 0.03, L * 0.72), M.metal);
  deck.position.y = L * 0.10; g.add(deck);
  // the island: a block of superstructure, off centre, with a mast on it
  const island = new THREE.Mesh(box(L * 0.10, L * 0.13, L * 0.20), M.metal);
  island.position.set(L * 0.05, L * 0.17, -L * 0.06); g.add(island);
  const mast = new THREE.Mesh(box(L * 0.012, L * 0.20, L * 0.012), M.metal);
  mast.position.set(L * 0.05, L * 0.32, -L * 0.06); g.add(mast);
  // turrets fore and aft
  for (const sz of [0.26, -0.30]) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(L * 0.045, L * 0.055, L * 0.04, 10), M.metal);
    t.position.set(0, L * 0.13, L * sz); g.add(t);
    for (const sx of [-1, 1]) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(L * 0.008, L * 0.008, L * 0.16, 7), M.metal);
      bar.rotation.x = Math.PI / 2;
      bar.position.set(sx * L * 0.018, L * 0.145, L * (sz + (sz > 0 ? 0.09 : -0.09))); g.add(bar);
    }
  }
  // propellers along the flanks
  const props = [];
  for (let i = 0; i < 6; i++) {
    const sx = i % 2 ? 1 : -1;
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(L * 0.018, L * 0.02, L * 0.07, 8), M.metal);
    pod.rotation.x = Math.PI / 2;
    pod.position.set(sx * L * 0.17, -L * 0.02, L * (0.22 - Math.floor(i / 2) * 0.22)); g.add(pod);
    const blade = new THREE.Mesh(box(L * 0.004, L * 0.10, L * 0.012), M.metal);
    blade.position.set(sx * L * 0.17, -L * 0.02, L * (0.26 - Math.floor(i / 2) * 0.22)); g.add(blade);
    props.push(blade);
  }
  // running lights, because at that distance the lights are what you see
  for (let i = 0; i < 14; i++) {
    const lgt = new THREE.Mesh(new THREE.SphereGeometry(L * 0.006, 6, 5), M.beacon);
    lgt.position.set((rnd() - 0.5) * L * 0.3, L * (0.09 + rnd() * 0.12), (rnd() - 0.5) * L * 0.8);
    lgt.renderOrder = 9; g.add(lgt);
  }
  g.position.set(spec.at[0], spec.at[1], spec.at[2]);
  g.rotation.y = spec.rot ?? 0.4;

  const base = g.position.clone();
  return {
    group: g,
    update(t) {
      // it drifts, and it does not arrive
      g.position.set(
        base.x + Math.sin(t * 0.012) * 90,
        base.y + Math.sin(t * 0.019 + 1.2) * 14,
        base.z + t * (spec.speed ?? 1.6) % 2400 - 1200,
      );
      g.rotation.z = Math.sin(t * 0.021) * 0.02;
      props.forEach((p, i) => { p.rotation.z = t * (5 + i * 0.3); });
    },
  };
}

// ---------------------------------------------------------------------------
// The public face
// ---------------------------------------------------------------------------

export function createLife(shared) {
  const M = {
    // The coat is deliberately a NEUTRAL, because the per-instance colour
    // multiplies it — tint the base and every coat in town comes out a
    // variation on the same brown, which is what the first pass looked like.
    coat: makePaintMaterial(shared, { color: '#a8a49c', shadowTint: '#383632', rim: 1.0, bands: 3, grain: 0.14 }),
    // The head is mostly hair, and there is no face on it — so one dark
    // material for the whole thing. At any distance you ever see a passer-by,
    // a face is two dark pixels that read as damage rather than as eyes.
    skin: makePaintMaterial(shared, { color: '#40322a', shadowTint: '#161010', rim: 1.1, bands: 3, grain: 0.10 }),
    trouser: makePaintMaterial(shared, { color: '#3c3630', shadowTint: '#141110', rim: 0.9, bands: 3, grain: 0.12 }),
    paint: makePaintMaterial(shared, { color: '#7a7a80', shadowTint: '#26262a', rim: 1.5, bands: 3, grain: 0.10 }),
    metal: makePaintMaterial(shared, { color: '#8e8c86', shadowTint: '#2e2e30', rim: 1.5, bands: 3, grain: 0.10 }),
    hull: makePaintMaterial(shared, { color: '#7a6a52', shadowTint: '#282218', rim: 1.1, bands: 3, grain: 0.16 }),
    hullDark: makePaintMaterial(shared, { color: '#5e6068', shadowTint: '#1c1e22', rim: 1.2, bands: 3, grain: 0.12 }),
    wood: makePaintMaterial(shared, { color: '#6a4e30', shadowTint: '#241a0e', rim: 0.8, bands: 3, grain: 0.26, grainScale: 1.6 }),
    iron: makePaintMaterial(shared, { color: '#4a4a4e', shadowTint: '#161618', rim: 1.4, bands: 3, grain: 0.14 }),
    cloth: makePaintMaterial(shared, { color: '#b8443a', shadowTint: '#3e1614', rim: 1.0, bands: 2, grain: 0.12, side: THREE.DoubleSide, sway: 0.04 }),
    warmStall: makeGlowMaterial(shared, '#ffb45e', 2.0, { flicker: 0.10 }),
    beacon: makeGlowMaterial(shared, '#ffd08a', 3.0, { flicker: 0.22 }),
  };

  const group = new THREE.Group();
  const live = [];

  function add(spec, shift, seed) {
    if (spec.kind === 'ship') {
      const s = airship(M, { ...spec, at: [spec.at[0], spec.at[1], spec.at[2] + shift] });
      group.add(s.group); live.push(s);
      return;
    }
    if (spec.kind === 'stall') {
      const g = stall(M, spec);
      g.position.set(spec.at[0], spec.y ?? 1.5, spec.at[1] + shift);
      g.rotation.y = spec.rot ?? 0;
      group.add(g);
      // And the seller behind it, who does not go anywhere. A stall with
      // nobody in it is a shed.
      const seller = new THREE.Group();
      seller.position.set(0, 0, -1.5); seller.scale.setScalar(1.05);
      seller.add(new THREE.Mesh(bodyGeo(0), M.coat));
      const h = new THREE.Mesh(headGeo(1), M.skin);
      seller.add(h);
      for (const sx of [-1, 1]) {
        const leg = new THREE.Mesh(legGeo(0), M.trouser);
        leg.position.set(sx * 0.075, HIP, 0); seller.add(leg);
      }
      g.add(seller);
      live.push({ update: (t) => {
        h.rotation.y = Math.sin(t * 0.6) * 0.6;
        seller.position.y = Math.abs(Math.sin(t * 1.1)) * 0.03;
        seller.rotation.y = Math.sin(t * 0.31) * 0.22;
      } });
      return;
    }
    // shift the path into the running order
    const path = { ...spec.path };
    if (path.at) path.at = [path.at[0], path.at[1] + shift];
    if (path.from) path.from = [path.from[0], path.from[1] + shift];
    if (path.to) path.to = [path.to[0], path.to[1] + shift];
    const p = population(M, { ...spec, path }, seed);
    group.add(p.group); live.push(p);
  }

  return {
    group,
    add,
    update(t) { live.forEach(l => l.update(t)); },
    get count() { return live.length; },
  };
}
