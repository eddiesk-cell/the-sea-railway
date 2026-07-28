import * as THREE from 'three';
import { hill, box, mulberry, fillInstances, curvedRoof } from './geo.js';
import {
  pal, house, shed, fence, wall, torii, lantern, bridge, steps, well, boat,
  crate, barrel, bench, cart, grove, scatter, put, pool,
} from '../places/kit.js';

// ---------------------------------------------------------------------------
// The near shore.
//
// Eddie, riding: "we only see trees and grasses with nothing on some of them...
// for Marnie I only see the wheat and water, I didn't see the house... when we
// ride on the train we should see these in the window, a bit far from the train
// is ok so we can see."
//
// He is describing a structural mistake, not a missing model. A probe down the
// whole line found that on the window side of the track there is NO dry land
// within four hundred metres in twenty-six of the twenty-seven countries — only
// Ponyo's causeway has a shore. Everything each country was built out of stands
// far enough back to read as scenery, and everything living was authored "beside
// the track", which put entire crowds and every car on open water.
//
// So each country gets a near shore: an island on the window side, close enough
// to read from a seat and far enough to still be across water — because the sea
// between you and it is the whole feeling of this railway. It carries that
// film's subject at a size you can see, and it is what the region's people and
// traffic now stand on.
//
// Built eagerly with the region, not lazily like the places, because the entire
// point of it is to be in the window as you pass.
// ---------------------------------------------------------------------------

// How far out the shore sits. Near enough to read a roof, far enough that the
// water still separates you from it.
const OUT = -150;

// --- small shared pieces ----------------------------------------------------

// A crowd of standing stones, a herd, a flock: anything that is many of one
// small thing scattered over ground.
function herd(M, geo, mat, { n = 12, at = [0, 0], r = 30, y = 0, s = 1, seed = 1, vary = 0.3 }) {
  const rnd = mulberry(seed);
  const items = [];
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r;
    const k = s * (1 - vary + rnd() * vary * 2);
    items.push({
      pos: [at[0] + Math.cos(a) * d, y, at[1] + Math.sin(a) * d],
      rot: [0, rnd() * 6.28, 0],
      scale: [k, k, k],
    });
  }
  const g = new THREE.Group();
  put(g, items, geo, mat);
  return g;
}

// A kodama: a pale round head on a stick of a body, and it turns. The clicking
// is in the sound bed; what you see is a hillside of small white heads that all
// look at you at once.
function kodamaGeo() {
  const parts = [];
  const head = new THREE.SphereGeometry(0.30, 9, 7);
  head.scale(1, 1.12, 0.94); head.translate(0, 0.86, 0);
  parts.push(head.toNonIndexed());
  const body = new THREE.CylinderGeometry(0.10, 0.13, 0.62, 6);
  body.translate(0, 0.34, 0); parts.push(body.toNonIndexed());
  for (const s of [-1, 1]) {
    const arm = new THREE.CylinderGeometry(0.035, 0.03, 0.30, 5);
    arm.rotateZ(s * 0.5); arm.translate(s * 0.13, 0.48, 0);
    parts.push(arm.toNonIndexed());
  }
  return mergeSimple(parts);
}

// A four-legged animal, from one dial: long and low is a wolf, heavy and
// short-necked is a boar. It is the proportions that read at distance, never
// the detail.
function beastGeo({ body = [1.9, 0.62, 0.72], head = 0.34, neck = 0.5, legs = 0.62, tail = 0.9, hump = 0 }) {
  const parts = [];
  const b = new THREE.SphereGeometry(1, 10, 7);
  b.scale(body[0] * 0.5, body[1] * 0.5, body[2] * 0.5);
  b.translate(0, legs + body[1] * 0.5, 0); parts.push(b.toNonIndexed());
  if (hump) {
    const hp = new THREE.SphereGeometry(1, 8, 6);
    hp.scale(body[0] * 0.26, hump, body[2] * 0.42);
    hp.translate(-body[0] * 0.16, legs + body[1] * 0.72, 0); parts.push(hp.toNonIndexed());
  }
  const n = new THREE.CylinderGeometry(head * 0.55, head * 0.75, neck, 6);
  n.rotateZ(-0.7); n.translate(body[0] * 0.44, legs + body[1] * 0.72, 0);
  parts.push(n.toNonIndexed());
  const h = new THREE.SphereGeometry(head, 8, 6);
  h.scale(1.5, 0.9, 0.9);
  h.translate(body[0] * 0.44 + neck * 0.52, legs + body[1] * 0.86, 0);
  parts.push(h.toNonIndexed());
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const l = new THREE.CylinderGeometry(0.07, 0.055, legs, 5);
    l.translate(sx * body[0] * 0.30, legs * 0.5, sz * body[2] * 0.32);
    parts.push(l.toNonIndexed());
  }
  if (tail) {
    const t = new THREE.CylinderGeometry(0.05, 0.02, tail, 5);
    t.rotateZ(1.9); t.translate(-body[0] * 0.5 - tail * 0.2, legs + body[1] * 0.6, 0);
    parts.push(t.toNonIndexed());
  }
  return mergeSimple(parts);
}

// Merge without pulling in BufferGeometryUtils — every part here is already
// non-indexed with position and normal, which is all the paint material wants.
function mergeSimple(list) {
  let vc = 0;
  list.forEach(g => { vc += g.attributes.position.count; });
  const pos = new Float32Array(vc * 3), nrm = new Float32Array(vc * 3);
  let o = 0;
  list.forEach((g) => {
    pos.set(g.attributes.position.array, o * 3);
    nrm.set(g.attributes.normal.array, o * 3);
    o += g.attributes.position.count;
    g.dispose();
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  return out;
}

// An airship: a hull, fins, gondola and engine pods. Howl's army flies these,
// so does Muska's, so does the Valley's raiders — one shape, three liveries.
function airshipGeo(len = 60) {
  const parts = [];
  const hull = new THREE.SphereGeometry(1, 14, 9);
  hull.scale(len * 0.5, len * 0.17, len * 0.17);
  parts.push(hull.toNonIndexed());
  for (const s of [-1, 1]) {
    const fin = box(len * 0.13, len * 0.015, len * 0.16);
    fin.rotateX(s * 0.9); fin.translate(-len * 0.40, 0, 0);
    parts.push(fin.toNonIndexed());
  }
  const top = box(len * 0.13, len * 0.16, len * 0.015);
  top.translate(-len * 0.40, len * 0.10, 0); parts.push(top.toNonIndexed());
  const gon = box(len * 0.26, len * 0.055, len * 0.075);
  gon.translate(len * 0.04, -len * 0.175, 0); parts.push(gon.toNonIndexed());
  for (const s of [-1, 1]) {
    const pod = new THREE.CylinderGeometry(len * 0.026, len * 0.020, len * 0.10, 8);
    pod.rotateZ(Math.PI / 2); pod.translate(-len * 0.06, -len * 0.10, s * len * 0.16);
    parts.push(pod.toNonIndexed());
  }
  return mergeSimple(parts);
}

// ---------------------------------------------------------------------------
// What stands on each country's shore.
//
// Every entry gets a palette of its own and one job: put THAT FILM in the
// window. Not a village — the thing you would name if somebody asked what you
// just went past.
// ---------------------------------------------------------------------------

const SHORES = {
  // ---- Spirited Away: the bathhouse already owns this window ---------------
  sea: null,

  // ---- Ponyo: the town on the hill, seen over the drowned road -------------
  drowned: {
    at: [OUT - 60, 0], r: 150, h: 26, seed: 41,
    pal: { wall: '#e8ded0', roof: '#b4553c', turf: '#5f8a3e' },
    build: (M, C, top) => {
      const g = new THREE.Group();
      const rnd = mulberry(808);
      for (let i = 0; i < 16; i++) {
        const a = rnd() * 6.28, d = 30 + rnd() * 88;
        const x = C[0] + Math.cos(a) * d, z = C[1] + Math.sin(a) * d;
        const y = top(x - C[0], z - C[1]);
        if (y === null) continue;
        const h2 = house(M, {
          w: 8 + rnd() * 4, d: 7, h: 4.2, storeys: rnd() < 0.4 ? 2 : 1,
          roof: 'gable', roofH: 2.6, windows: 2, lit: 0.6,
        });
        h2.position.set(x, y, z); h2.rotation.y = rnd() * 6.28; g.add(h2);
      }
      g.add(grove(M, { n: 90, at: C, inner: 118, r: 168, kind: 'pine', mat: M.leaf, h: 10, seed: 4 }));
      return g;
    },
  },

  // ---- When Marnie Was There: the house, near enough to be the subject -----
  marsh: {
    at: [OUT - 20, 0], r: 120, h: 9, seed: 12,
    pal: { wall: '#d8cdb4', roof: '#3a3a46', turf: '#7f8a52', wood: '#4a4034' },
    build: (M, C, top) => {
      const g = new THREE.Group();
      const y = top(0, 0) ?? 0;
      // The marsh house itself, big and close and facing the water — Eddie
      // rode past and saw only reeds, because the real one is four hundred
      // metres back behind them.
      const h2 = house(M, {
        w: 22, d: 15, h: 6.4, storeys: 2, storeyH: 4.4, roof: 'gable', roofH: 4.6,
        windows: 5, lit: 0.75, winW: 1.4, winH: 2.0, doorW: 1.8, doorH: 3.0, doorLit: true,
      });
      h2.position.set(C[0], y, C[1]); h2.rotation.y = 1.62; g.add(h2);
      const stack = new THREE.Mesh(box(2.0, 6.0, 2.0), M.stone);
      stack.position.set(C[0] - 7, y + 14.0, C[1] - 4); g.add(stack);
      // the jetty it is always seen across
      const jetty = new THREE.Mesh(box(3.0, 0.5, 34), M.wood);
      jetty.position.set(C[0] + 40, 0.8, C[1] + 10); g.add(jetty);
      const rowboat = boat(M, { len: 5.4, beam: 1.7 });
      rowboat.position.set(C[0] + 44, 0.4, C[1] + 24); rowboat.rotation.y = 0.5; g.add(rowboat);
      g.add(grove(M, { n: 60, at: C, inner: 62, r: 128, kind: 'broad', mat: M.leaf, h: 12, seed: 7 }));
      return g;
    },
  },

  // ---- Kiki: the harbour town runs right down to the water -----------------
  koriko: {
    at: [OUT - 90, 0], r: 200, h: 40, seed: 5,
    pal: { wall: '#e2d6bc', roof: '#a8503c', turf: '#66883a' },
    build: (M, C, top) => {
      const g = new THREE.Group();
      const rnd = mulberry(1989);
      for (let i = 0; i < 34; i++) {
        const a = rnd() * 6.28, d = 20 + rnd() * 140;
        const x = C[0] + Math.cos(a) * d, z = C[1] + Math.sin(a) * d;
        const y = top(x - C[0], z - C[1]);
        if (y === null) continue;
        const h2 = house(M, {
          w: 7 + rnd() * 4, d: 7, h: 4.0, storeys: 2 + (rnd() < 0.4 ? 1 : 0), storeyH: 3.2,
          roof: 'gable', roofH: 3.0, windows: 2, lit: 0.55,
        });
        h2.position.set(x, y, z); h2.rotation.y = rnd() * 6.28; g.add(h2);
      }
      // the clock tower on the point, which is how you know it is Koriko
      const y = top(60, -40) ?? 0;
      const t = new THREE.Mesh(box(9, 34, 9), M.wall);
      t.position.set(C[0] + 60, y + 17, C[1] - 40); g.add(t);
      const face = new THREE.Mesh(new THREE.CircleGeometry(3.0, 16), M.warm(1.3));
      face.position.set(C[0] + 60, y + 28, C[1] - 40 + 4.6); g.add(face);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(7.4, 7, 4), M.roof);
      cap.rotation.y = Math.PI / 4; cap.position.set(C[0] + 60, y + 37.5, C[1] - 40); g.add(cap);
      return g;
    },
  },

  // ---- Porco Rosso: the hidden beach, with the seaplane on it ---------------
  cove: {
    at: [OUT - 40, 0], r: 130, h: 22, seed: 19,
    pal: { turf: '#8a9146', rock: '#c3b493', wall: '#e8dcc0', roof: '#c05038' },
    build: (M, C, top) => {
      const g = new THREE.Group();
      const y = top(0, 40) ?? 0;
      const sh = shed(M, { w: 20, d: 14, h: 7, mat: M.wall, roofMat: M.roof, open: true });
      sh.position.set(C[0], y, C[1] + 40); sh.rotation.y = -1.5; g.add(sh);
      // the red seaplane, drawn up on the sand
      const plane = new THREE.Group();
      const fus = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.4, 9, 10), M.cloth);
      fus.rotation.z = Math.PI / 2; plane.add(fus);
      const wing = new THREE.Mesh(box(1.9, 0.16, 13), M.cloth);
      wing.position.y = 1.5; plane.add(wing);
      const strut = new THREE.Mesh(box(0.14, 1.5, 0.14), M.dark);
      strut.position.set(0, 0.75, 3.2); plane.add(strut);
      const strut2 = strut.clone(); strut2.position.z = -3.2; plane.add(strut2);
      const fin = new THREE.Mesh(box(0.12, 1.6, 1.3), M.cloth);
      fin.position.set(-4.2, 1.0, 0); plane.add(fin);
      plane.position.set(C[0] + 34, 1.0, C[1] - 20); plane.rotation.y = 0.6;
      g.add(plane);
      g.add(grove(M, { n: 40, at: C, inner: 70, r: 120, kind: 'pine', mat: M.leaf, h: 8, seed: 2 }));
      return g;
    },
  },

  // ---- Totoro: the camphor tree, and the shrine under it -------------------
  bus: {
    at: [OUT - 30, 0], r: 120, h: 12, seed: 8,
    pal: { turf: '#4e7a30', leaf: '#2c4a24', wood: '#3a2c20' },
    build: (M, C, top) => {
      const g = new THREE.Group();
      const y = top(0, 0) ?? 0;
      // one enormous tree, and everything else small beside it
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 4.6, 26, 10), M.trunk);
      trunk.position.set(C[0], y + 13, C[1]); g.add(trunk);
      const rnd = mulberry(88);
      for (let i = 0; i < 14; i++) {
        const a = rnd() * 6.28, d = rnd() * 15;
        const c = new THREE.Mesh(new THREE.SphereGeometry(7 + rnd() * 6, 9, 7), M.leaf);
        c.scale.y = 0.8;
        c.position.set(C[0] + Math.cos(a) * d, y + 26 + rnd() * 10, C[1] + Math.sin(a) * d);
        g.add(c);
      }
      const t = torii(M, { w: 4.5, h: 5.5, mat: M.cloth, cap: M.dark });
      t.position.set(C[0] + 16, y, C[1] + 14); t.rotation.y = 0.4; g.add(t);
      const l = lantern(M, { h: 2.4, stone: true, lit: true, mat: M.stone });
      l.position.set(C[0] + 22, y, C[1] + 18); g.add(l);
      g.add(grove(M, { n: 60, at: C, inner: 44, r: 118, kind: 'broad', mat: M.leaf, h: 11, seed: 5 }));
      return g;
    },
  },

  // ---- Pom Poko: the hill with the machines already on it ------------------
  tama: {
    at: [OUT - 70, 0], r: 170, h: 34, seed: 23,
    pal: { turf: '#587c33', earth: '#7a6042', iron: '#c8a038' },
    build: (M, C, top) => {
      const g = new THREE.Group();
      const rnd = mulberry(94);
      // half the hill cut away, and the diggers standing in the cut
      const cut = new THREE.Mesh(box(150, 26, 90), M.earth);
      cut.position.set(C[0] - 40, 6, C[1] + 60); cut.rotation.y = 0.2; g.add(cut);
      for (let i = 0; i < 4; i++) {
        const d = new THREE.Group();
        const body = new THREE.Mesh(box(3.4, 2.6, 5.6), M.iron);
        body.position.y = 2.2; d.add(body);
        const arm = new THREE.Mesh(box(0.9, 0.9, 8.5), M.iron);
        arm.rotation.x = -0.7; arm.position.set(0, 4.6, 3.4); d.add(arm);
        const track = new THREE.Mesh(box(4.2, 1.1, 6.4), M.dark);
        track.position.y = 0.6; d.add(track);
        d.position.set(C[0] - 90 + i * 32 + rnd() * 12, 19, C[1] + 40 + rnd() * 40);
        d.rotation.y = rnd() * 6.28; g.add(d);
      }
      for (let i = 0; i < 10; i++) {
        const h2 = house(M, { w: 9, d: 8, h: 4.4, storeys: 2, roof: 'hip', roofH: 2.4, windows: 3, lit: 0.5 });
        const x = C[0] + 30 + rnd() * 100, z = C[1] - 90 + rnd() * 60;
        const y = top(x - C[0], z - C[1]);
        if (y === null) continue;
        h2.position.set(x, y, z); h2.rotation.y = rnd() * 0.6; g.add(h2);
      }
      g.add(grove(M, { n: 120, at: [C[0] + 40, C[1] - 40], inner: 30, r: 120, kind: 'broad', mat: M.leaf, h: 12, seed: 8 }));
      return g;
    },
  },

  // ---- The Cat Returns: the bureau, and its square ------------------------
  cats: {
    at: [OUT - 20, 0], r: 100, h: 10, seed: 3,
    pal: { wall: '#e0d2b4', roof: '#7a4a3a', turf: '#6f9440' },
    build: (M, C, top) => {
      const g = new THREE.Group();
      const y = top(0, 0) ?? 0;
      // A doll's house at full size — it only works because everything beside
      // it is normal, so the thing that reads is the SCALE.
      const b = house(M, {
        w: 5.5, d: 4.6, h: 3.4, storeys: 2, storeyH: 2.6, roof: 'gable', roofH: 2.4,
        windows: 2, lit: 1, winW: 0.7, winH: 0.9, doorW: 0.8, doorH: 1.5, doorLit: true,
      });
      b.position.set(C[0], y, C[1]); b.rotation.y = 0.7; g.add(b);
      const rnd = mulberry(2002);
      for (let i = 0; i < 9; i++) {
        const h2 = house(M, {
          w: 6 + rnd() * 3, d: 6, h: 4.0, storeys: 2, roof: 'gable', roofH: 2.6, windows: 2, lit: 0.4,
        });
        const a = rnd() * 6.28, d = 34 + rnd() * 50;
        const x = C[0] + Math.cos(a) * d, z = C[1] + Math.sin(a) * d;
        const yy = top(x - C[0], z - C[1]);
        if (yy === null) continue;
        h2.position.set(x, yy, z); h2.rotation.y = rnd() * 6.28; g.add(h2);
      }
      g.add(grove(M, { n: 40, at: C, inner: 60, r: 98, kind: 'broad', mat: M.leaf, h: 9, seed: 6 }));
      return g;
    },
  },

  // ---- Princess Mononoke, the forest: the kodama, and what walks there -----
  cedar: {
    at: [OUT - 50, 0], r: 190, h: 46, seed: 97,
    pal: { turf: '#2f5a34', leaf: '#37613a', rock: '#5a6258', trunk: '#3a3228' },
    build: (M, C, top) => {
      const g = new THREE.Group();
      const rnd = mulberry(1997);

      // The kodama. Eddie asked for them by description — "those white spirits
      // that click their heads" — and they are the one thing in Mononoke that
      // reads instantly at any distance, because a hundred small pale heads on
      // a dark hillside is a texture nothing else makes.
      // They are lit, and they are big. In the film a kodama is knee high and
      // seen from a metre away; through a train window three hundred metres
      // off, at dusk, in this much fog, a two-metre matt-white figure is one
      // pale pixel. So they glow — which the film does at night anyway — and
      // they are scaled to be READ rather than measured.
      const kod = kodamaGeo();
      const white = M.cool(0.85, '#dfe9de');
      const items = [];
      for (let i = 0; i < 200; i++) {
        const a = rnd() * 6.28, d = Math.sqrt(rnd()) * 150;
        const x = C[0] + Math.cos(a) * d, z = C[1] + Math.sin(a) * d;
        const y = top(x - C[0], z - C[1]);
        if (y === null) continue;
        const s = 4.0 + rnd() * 2.6;
        items.push({ pos: [x, y, z], rot: [0, rnd() * 6.28, 0], scale: [s, s, s] });
      }
      const kodMesh = new THREE.InstancedMesh(kod, white, items.length);
      fillInstances(kodMesh, items);
      kodMesh.frustumCulled = false;
      // They are named and they keep their placements, because the moment
      // turns them: a hillside of heads that all swing round to watch the
      // same thing is the shot, and a static field of them is only wallpaper.
      kodMesh.name = 'kodama';
      kodMesh.userData.items = items;
      g.add(kodMesh);

      // wolves on the ridge, boars below, and the herd is what tells you which
      const wolfGeo = beastGeo({ body: [2.6, 0.72, 0.78], head: 0.30, neck: 0.62, legs: 0.86, tail: 1.5 });
      const boarGeo = beastGeo({ body: [2.2, 0.98, 1.02], head: 0.34, neck: 0.34, legs: 0.62, tail: 0.35, hump: 0.55 });
      const wy = top(30, -70);
      // Moro and her sons are the size of horses, and Okkoto is bigger than that.
      if (wy !== null) g.add(herd(M, wolfGeo, M.paper, { n: 5, at: [C[0] + 30, C[1] - 70], r: 26, y: wy, s: 4.2, seed: 3, vary: 0.15 }));
      const by = top(-40, 60);
      if (by !== null) g.add(herd(M, boarGeo, M.dark, { n: 16, at: [C[0] - 40, C[1] + 60], r: 44, y: by, s: 3.8, seed: 9, vary: 0.25 }));

      // The Deer God is NOT here. It used to stand in the shallows at the edge
      // of this island and never move, which is a statue of the shot rather
      // than the shot — the thing everyone remembers is that it WALKS, so
      // slowly you are never sure it did. It lives in moments.js now, where it
      // has legs. One implementation, not two.

      g.add(grove(M, { n: 260, at: C, inner: 40, r: 185, kind: 'fir', mat: M.leaf, h: 26, spread: 5, seed: 11 }));
      return g;
    },
  },

  // ---- Princess Mononoke, the works: the town, near enough to see ----------
  iron: {
    at: [OUT - 60, 0], r: 165, h: 24, seed: 31,
    pal: { wall: '#8a7c62', roof: '#3a3228', turf: '#5a6b34', iron: '#6a3820' },
    build: (M, C, top) => {
      const g = new THREE.Group();
      const rnd = mulberry(1545);
      // the stockade, which is what Iron Town is: a wall with smoke over it
      for (let i = 0; i < 46; i++) {
        const a = (i / 46) * Math.PI * 2;
        const x = C[0] + Math.cos(a) * 96, z = C[1] + Math.sin(a) * 96;
        const y = top(x - C[0], z - C[1]);
        if (y === null) continue;
        const p = new THREE.Mesh(box(3.6, 7.5, 0.9), M.wood);
        p.position.set(x, y + 3.7, z); p.rotation.y = -a; g.add(p);
      }
      const gate = new THREE.Mesh(box(1.4, 11, 14), M.wood);
      gate.position.set(C[0] + 96, 12, C[1]); g.add(gate);
      // the great house, and the forge with its fire showing
      const gh = house(M, {
        w: 30, d: 18, h: 8, storeys: 2, storeyH: 5, roof: 'gable', roofH: 6,
        wall: M.wood, windows: 5, lit: 0.8,
      });
      const gy = top(-30, 0) ?? 0;
      gh.position.set(C[0] - 30, gy, C[1]); gh.rotation.y = 1.57; g.add(gh);
      const forge = shed(M, { w: 26, d: 16, h: 8, mat: M.wood, roofMat: M.roof, open: true });
      const fy = top(20, 40) ?? 0;
      forge.position.set(C[0] + 20, fy, C[1] + 40); forge.rotation.y = -1.4; g.add(forge);
      const fire = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), M.warm(3.0, '#ff8a3c'));
      fire.position.set(C[0] + 27, fy + 3.2, C[1] + 40); fire.rotation.y = -1.4 + Math.PI / 2;
      fire.renderOrder = 9; g.add(fire);
      for (let i = 0; i < 12; i++) {
        const h2 = house(M, { w: 7, d: 6, h: 3.4, roof: 'gable', roofH: 2.2, wall: M.wood, windows: 1, lit: 0.6 });
        const a = rnd() * 6.28, d = 26 + rnd() * 52;
        const x = C[0] + Math.cos(a) * d, z = C[1] + Math.sin(a) * d;
        const y = top(x - C[0], z - C[1]);
        if (y === null) continue;
        h2.position.set(x, y, z); h2.rotation.y = rnd() * 6.28; g.add(h2);
      }
      return g;
    },
  },

  // ---- Howl's, the open country: the army going over ----------------------
  meadow: {
    at: [OUT - 70, 0], r: 175, h: 30, seed: 55,
    pal: { turf: '#79a043', wall: '#e6dcc2', roof: '#5a6470', iron: '#5a5648' },
    build: (M, C, top) => {
      const g = new THREE.Group();
      const rnd = mulberry(2004);
      // a hill fort with the army camped under it: rows of tents, a picket
      // line, and the flags that say whose war it is
      const fy = top(0, 0) ?? 0;
      for (let i = 0; i < 3; i++) {
        const t = new THREE.Mesh(new THREE.CylinderGeometry(5 - i, 7 - i, 10, 8), M.stone);
        t.position.set(C[0], fy + 5 + i * 9, C[1]); g.add(t);
      }
      const keep = new THREE.Mesh(new THREE.ConeGeometry(9, 12, 8), M.roof);
      keep.position.set(C[0], fy + 38, C[1]); g.add(keep);
      for (let i = 0; i < 34; i++) {
        const a = rnd() * 6.28, d = 46 + rnd() * 100;
        const x = C[0] + Math.cos(a) * d, z = C[1] + Math.sin(a) * d;
        const y = top(x - C[0], z - C[1]);
        if (y === null) continue;
        const tent = new THREE.Mesh(new THREE.ConeGeometry(3.0, 3.6, 6), M.wall);
        tent.position.set(x, y + 1.8, z); g.add(tent);
        if (i % 5 === 0) {
          const pole = new THREE.Mesh(box(0.14, 7, 0.14), M.wood);
          pole.position.set(x + 3, y + 3.5, z); g.add(pole);
          const flag = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.2), M.cloth);
          flag.position.set(x + 4.3, y + 6.4, z); g.add(flag);
        }
      }
      g.add(grove(M, { n: 50, at: C, inner: 130, r: 172, kind: 'broad', mat: M.leaf, h: 11, seed: 4 }));
      return g;
    },
  },

  // ---- Howl's, the town: the palace above Market Chipping -----------------
  market: {
    at: [OUT - 80, 0], r: 200, h: 52, seed: 77,
    pal: { wall: '#efe3c8', roof: '#9a5442', turf: '#6b8c3c', stone: '#d8cdb2' },
    build: (M, C, top) => {
      const g = new THREE.Group();
      const rnd = mulberry(1986);
      // The palace on the height — domes, a colonnade, and a long stair down
      // into the town. It is the one building in Howl's world that is trying
      // to impress you, so it should be the one you see from a train.
      const py = top(0, -40) ?? 0;
      const plinth = new THREE.Mesh(box(66, 8, 40), M.stone);
      plinth.position.set(C[0], py + 4, C[1] - 40); g.add(plinth);
      const main = new THREE.Mesh(box(50, 20, 28), M.wall);
      main.position.set(C[0], py + 18, C[1] - 40); g.add(main);
      for (const sx of [-1, 1]) {
        const w2 = new THREE.Mesh(box(14, 26, 20), M.wall);
        w2.position.set(C[0] + sx * 30, py + 21, C[1] - 40); g.add(w2);
        const d2 = new THREE.Mesh(new THREE.SphereGeometry(9, 14, 8, 0, 6.283, 0, 1.4), M.roof);
        d2.position.set(C[0] + sx * 30, py + 34, C[1] - 40); g.add(d2);
      }
      const dome = new THREE.Mesh(new THREE.SphereGeometry(15, 18, 10, 0, 6.283, 0, 1.5), M.roof);
      dome.position.set(C[0], py + 28, C[1] - 40); g.add(dome);
      const lantern2 = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.8, 6, 10), M.wall);
      lantern2.position.set(C[0], py + 44, C[1] - 40); g.add(lantern2);
      const finial = new THREE.Mesh(new THREE.ConeGeometry(4.2, 7, 10), M.roof);
      finial.position.set(C[0], py + 50, C[1] - 40); g.add(finial);
      for (let i = 0; i < 12; i++) {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.1, 13, 8), M.stone);
        col.position.set(C[0] - 24 + i * 4.4, py + 14.5, C[1] - 26); g.add(col);
      }
      const stair = steps(M, { n: 40, w: 16, rise: 0.7, run: 1.6, mat: M.stone });
      stair.position.set(C[0], py + 8, C[1] - 18); stair.rotation.y = Math.PI; g.add(stair);

      // the town below it, with a garden between
      for (let i = 0; i < 26; i++) {
        const a = rnd() * 6.28, d = 70 + rnd() * 110;
        const x = C[0] + Math.cos(a) * d, z = C[1] + Math.abs(Math.sin(a)) * d;
        const y = top(x - C[0], z - C[1]);
        if (y === null) continue;
        const h2 = house(M, {
          w: 7 + rnd() * 3, d: 7, h: 4.0, storeys: 2 + (rnd() < 0.5 ? 1 : 0), storeyH: 3.0,
          roof: 'gable', roofH: 2.8, windows: 2, lit: 0.5,
        });
        h2.position.set(x, y, z); h2.rotation.y = rnd() * 6.28; g.add(h2);
      }
      // the formal garden: hedges in rows, and a long pool down the middle
      const gy = top(70, 60) ?? 0;
      for (let i = 0; i < 16; i++) {
        const hdg = new THREE.Mesh(box(2.2, 2.0, 26), M.leaf);
        hdg.position.set(C[0] + 40 + (i % 8) * 9, gy + 1, C[1] + 46 + Math.floor(i / 8) * 34);
        g.add(hdg);
      }
      const pl = new THREE.Mesh(box(9, 0.3, 60), M.water);
      pl.position.set(C[0] + 76, gy + 0.4, C[1] + 62); g.add(pl);
      return g;
    },
  },

  // ---- Earthsea: the walled city on the shore -----------------------------
  hort: {
    at: [OUT - 60, 0], r: 170, h: 28, seed: 61,
    pal: { wall: '#d9b878', roof: '#8a6a44', turf: '#8c8544', stone: '#c8a870' },
    build: (M, C, top) => {
      const g = new THREE.Group();
      const rnd = mulberry(2006);
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * Math.PI * 2;
        const x = C[0] + Math.cos(a) * 110, z = C[1] + Math.sin(a) * 110;
        const y = top(x - C[0], z - C[1]);
        if (y === null) continue;
        const w2 = new THREE.Mesh(box(18, 13, 3.4), M.stone);
        w2.position.set(x, y + 6.5, z); w2.rotation.y = -a; g.add(w2);
        if (i % 6 === 0) {
          const tw = new THREE.Mesh(new THREE.CylinderGeometry(4, 4.6, 20, 8), M.stone);
          tw.position.set(x, y + 10, z); g.add(tw);
        }
      }
      for (let i = 0; i < 22; i++) {
        const a = rnd() * 6.28, d = rnd() * 92;
        const x = C[0] + Math.cos(a) * d, z = C[1] + Math.sin(a) * d;
        const y = top(x - C[0], z - C[1]);
        if (y === null) continue;
        const h2 = house(M, { w: 8, d: 8, h: 5, storeys: 2, roof: 'flat', roofH: 0.6, windows: 2, lit: 0.4 });
        h2.position.set(x, y, z); h2.rotation.y = rnd() * 6.28; g.add(h2);
      }
      const dy = top(0, 0) ?? 0;
      const dm = new THREE.Mesh(new THREE.SphereGeometry(13, 16, 9, 0, 6.283, 0, 1.5), M.roof);
      dm.position.set(C[0], dy + 16, C[1]); g.add(dm);
      return g;
    },
  },

  // ---- Nausicaä: the windmills, and a gunship over them -------------------
  valley: {
    at: [OUT - 55, 0], r: 160, h: 26, seed: 71,
    pal: { turf: '#7d8f4a', wall: '#e0d0a8', roof: '#8a6a4a', cloth: '#d8d0b8' },
    build: (M, C, top) => {
      const g = new THREE.Group();
      const rnd = mulberry(1984);
      for (let i = 0; i < 5; i++) {
        const a = rnd() * 6.28, d = 40 + rnd() * 96;
        const x = C[0] + Math.cos(a) * d, z = C[1] + Math.sin(a) * d;
        const y = top(x - C[0], z - C[1]);
        if (y === null) continue;
        const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 3.4, 15, 8), M.wall);
        tower.position.set(x, y + 7.5, z); g.add(tower);
        const capm = new THREE.Mesh(new THREE.ConeGeometry(3.2, 3, 8), M.roof);
        capm.position.set(x, y + 16.5, z); g.add(capm);
        for (let k = 0; k < 4; k++) {
          const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 9), M.cloth);
          sail.position.set(x + 2.6, y + 14, z);
          sail.rotation.set(0, Math.PI / 2, (k / 4) * Math.PI * 2);
          g.add(sail);
        }
      }
      for (let i = 0; i < 12; i++) {
        const a = rnd() * 6.28, d = rnd() * 70;
        const x = C[0] + Math.cos(a) * d, z = C[1] + Math.sin(a) * d;
        const y = top(x - C[0], z - C[1]);
        if (y === null) continue;
        const h2 = house(M, { w: 8, d: 7, h: 3.6, roof: 'thatch', roofH: 3.2, windows: 2, lit: 0.5 });
        h2.position.set(x, y, z); h2.rotation.y = rnd() * 6.28; g.add(h2);
      }
      return g;
    },
  },

  // ---- Castle in the Sky, the mine: the pithead and its spoil -------------
  slag: {
    at: [OUT - 45, 0], r: 150, h: 30, seed: 83,
    pal: { turf: '#6a6f3a', rock: '#6a6058', iron: '#5a4a3a', wall: '#8a8072' },
    build: (M, C, top) => {
      const g = new THREE.Group();
      const rnd = mulberry(1986);
      const y = top(0, 0) ?? 0;
      // the winding gear, which is the silhouette of every mining town
      for (const sx of [-1, 1]) {
        const leg = new THREE.Mesh(box(1.0, 26, 1.0), M.iron);
        leg.position.set(C[0] + sx * 5, y + 13, C[1]); g.add(leg);
        const brace = new THREE.Mesh(box(1.0, 22, 1.0), M.iron);
        brace.rotation.z = sx * 0.5; brace.position.set(C[0] + sx * 12, y + 11, C[1]); g.add(brace);
      }
      const whl = new THREE.Mesh(new THREE.TorusGeometry(5.0, 0.5, 6, 16), M.iron);
      whl.position.set(C[0], y + 26, C[1]); g.add(whl);
      const engine = shed(M, { w: 18, d: 12, h: 7, mat: M.wall, roofMat: M.roof, open: false });
      engine.position.set(C[0] - 22, y, C[1] + 10); g.add(engine);
      const stack = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.4, 22, 8), M.rock);
      stack.position.set(C[0] - 30, y + 11, C[1] + 16); g.add(stack);
      for (let i = 0; i < 14; i++) {
        const h2 = house(M, { w: 6, d: 6, h: 3.4, roof: 'gable', roofH: 2.0, windows: 1, lit: 0.55 });
        const x = C[0] + 30 + (i % 7) * 12, z = C[1] - 30 + Math.floor(i / 7) * 18;
        const yy = top(x - C[0], z - C[1]);
        if (yy === null) continue;
        h2.position.set(x, yy, z); g.add(h2);
      }
      return g;
    },
  },

  // ---- Castle in the Sky, the island: bring Laputa into the window --------
  laputa: {
    at: [OUT - 90, 0], r: 150, h: 10, seed: 44, y: 118,
    pal: { turf: '#6da44a', stone: '#a9a293', rock: '#6e6a5e', leaf: '#3e6a38' },
    build: (M, C, top) => {
      const g = new THREE.Group();
      const rnd = mulberry(1986);
      // the underside: a cone of root and rock, so it reads as torn out of
      // the ground rather than resting on nothing
      const under = new THREE.Mesh(new THREE.ConeGeometry(140, 190, 14, 1), M.rock);
      under.rotation.x = Math.PI; under.position.set(C[0], -96, C[1]); g.add(under);
      const y = top(0, 0) ?? 0;
      // the tree
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(5, 9, 46, 10), M.trunk);
      trunk.position.set(C[0], y + 23, C[1]); g.add(trunk);
      for (let i = 0; i < 18; i++) {
        const a = rnd() * 6.28, d = rnd() * 30;
        const c = new THREE.Mesh(new THREE.SphereGeometry(12 + rnd() * 10, 9, 7), M.leaf);
        c.scale.y = 0.7;
        c.position.set(C[0] + Math.cos(a) * d, y + 48 + rnd() * 18, C[1] + Math.sin(a) * d);
        g.add(c);
      }
      // the ruined ring of walls under it
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2;
        const x = C[0] + Math.cos(a) * 74, z = C[1] + Math.sin(a) * 74;
        const yy = top(x - C[0], z - C[1]);
        if (yy === null) continue;
        const w2 = new THREE.Mesh(box(12, 6 + rnd() * 9, 2.6), M.stone);
        w2.position.set(x, yy + 4, z); w2.rotation.y = -a; g.add(w2);
      }
      g.add(grove(M, { n: 90, at: C, inner: 90, r: 145, kind: 'broad', mat: M.leaf, h: 12, seed: 3 }));
      return g;
    },
  },

  // ---- The Boy and the Heron: the tower, and the gate into it -------------
  tower: {
    at: [OUT - 55, 0], r: 155, h: 20, seed: 26,
    pal: { stone: '#8c8478', turf: '#4d6f38', wall: '#c8bda6', roof: '#4a4238' },
    build: (M, C, top) => {
      const g = new THREE.Group();
      const rnd = mulberry(2023);
      const y = top(0, 0) ?? 0;
      // A tower that is wrong: too tall for its footprint, no windows where
      // windows should be, and a door far too big for anyone to need.
      const t = new THREE.Mesh(new THREE.CylinderGeometry(11, 14, 62, 12), M.stone);
      t.position.set(C[0], y + 31, C[1]); g.add(t);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(12.6, 12.6, 3, 12), M.wall);
      band.position.set(C[0], y + 44, C[1]); g.add(band);
      const capm = new THREE.Mesh(new THREE.ConeGeometry(13, 12, 12), M.roof);
      capm.position.set(C[0], y + 68, C[1]); g.add(capm);
      const door = new THREE.Mesh(new THREE.PlaneGeometry(9, 15), M.warm(1.1, '#cfa268'));
      door.position.set(C[0] + 14.1, y + 7.5, C[1]); door.rotation.y = Math.PI / 2;
      door.renderOrder = 9; g.add(door);
      // the wall around it, and the woods that hide it from the house
      for (let i = 0; i < 30; i++) {
        const a = (i / 30) * Math.PI * 2;
        const x = C[0] + Math.cos(a) * 60, z = C[1] + Math.sin(a) * 60;
        const yy = top(x - C[0], z - C[1]);
        if (yy === null) continue;
        const w2 = new THREE.Mesh(box(13, 5.5, 1.8), M.stone);
        w2.position.set(x, yy + 2.7, z); w2.rotation.y = -a; g.add(w2);
      }
      // the great house at the edge of the wood
      const hy = top(90, 60) ?? 0;
      const h2 = house(M, {
        w: 26, d: 16, h: 5.6, storeys: 2, storeyH: 4.0, roof: 'jp', roofH: 5.0,
        wall: M.wall, windows: 6, lit: 0.7,
      });
      h2.position.set(C[0] + 90, hy, C[1] + 60); h2.rotation.y = -1.3; g.add(h2);
      g.add(grove(M, { n: 200, at: C, inner: 78, r: 152, kind: 'broad', mat: M.leaf, h: 16, seed: 12 }));
      return g;
    },
  },
};

// Countries that already put their subject in the window keep it: Spirited
// Away has the bathhouse, Poppy Hill has the hill, Ocean Waves the town on the
// bluff, Only Yesterday the fields, Grave of the Fireflies its emptiness — and
// the Ink Country, the Garden, the Rotary, the Crooked House and the Sketch
// are all small, near subjects by design.

// Where a country's island actually IS, and how high its ground is at any
// point on it. One place computes this, because the clearance rule below is
// the sort of arithmetic that gets copied slightly wrong the second time and
// then quietly puts a walking castle in the sea.
export function shoreGround(regionId) {
  const spec = SHORES[regionId];
  if (!spec) return null;
  const base = spec.y ?? -3;

  // The island is pushed out until its rim clears the track corridor, rather
  // than each entry being trusted to have done the arithmetic. Written by hand,
  // eleven of the sixteen were wrong and one of them — the cedar forest —
  // reached to within ten metres of the rails, so the window seat spent the
  // whole country inside a hill. This is the third time a hand-placed radius
  // has swallowed the line; it is the last time.
  const CLEAR = 78;
  const C = [Math.min(spec.at[0], -CLEAR - spec.r), spec.at[1]];
  return { C, r: spec.r, h: spec.h, base, top: surfaceOf(spec.r, spec.h, spec.seed, 0.26, base) };
}

export function nearShore(shared, regionId) {
  const spec = SHORES[regionId];
  if (!spec) return null;
  const M = pal(shared, spec.pal ?? {});
  const g = new THREE.Group();
  const { C, base, top } = shoreGround(regionId);

  const land = new THREE.Mesh(
    hill(spec.r, spec.h, spec.seed, { rough: 0.26, rings: 16, sectors: 26 }), M.turf);
  land.position.set(C[0], base, C[1]);
  g.add(land);

  // the same sampler the trees and the grass use, so anything standing on this
  // island stands ON it
  g.add(spec.build(M, C, top));
  return g;
}

// hillSampler, but returning a WORLD height and offset to the island's base —
// the one thing every builder above needs and the one thing that has caused
// every floating-object bug in this project.
export { surfaceOf as hillTop };
function surfaceOf(r, h, seed, rough, base) {
  const rnd = mulberry(seed);
  const off = [];
  for (let i = 0; i < 8; i++) off.push(rnd() * 100);
  return (dx, dz) => {
    const D = Math.hypot(dx, dz);
    if (D < 1e-4) return base + h;
    const a = Math.atan2(dz, dx);
    const n = Math.sin(a * 3.0 + off[0]) * 0.34 + Math.sin(a * 5.0 + off[1]) * 0.22
            + Math.sin(a * 9.0 + off[2]) * 0.12 + Math.sin(a * 17.0 + off[3]) * 0.06;
    let u = D / r;
    for (let i = 0; i < 4; i++) {
      if (u >= 1) break;
      const y = Math.sqrt(Math.max(0, 1 - u * u));
      const s = Math.max(0.2, 1 + n * rough * (1 - y * 0.55));
      u = D / (r * s);
    }
    if (u >= 1) return null;
    const y = Math.sqrt(Math.max(0, 1 - u * u));
    return base + y * h * (1 + n * rough * 0.35);
  };
}

// ---------------------------------------------------------------------------
// Who is on the shore, and what is over it.
//
// Authored in world x and an offset in z from the station, because that is what
// the island is authored in. Cars only where the film has cars — Eddie: "cars
// should be in town for the countries that do have them, not every country" —
// and the countries that fly things get the things they fly.
// ---------------------------------------------------------------------------
export const SHORE_CROWDS = {
  drowned: [
    { kind: 'cars', cast: 'showa', n: 3, speed: 8, width: 2, pause: false,
      path: { type: 'ring', at: [OUT - 60, 0], r: 108, r2: 108, y: 15.5 } },
    { kind: 'walkers', cast: 'showa', n: 14, speed: 0.9, width: 8,
      path: { type: 'ring', at: [OUT - 60, 0], r: 74, r2: 74, y: 20.5 } },
  ],
  marsh: [
    { kind: 'boats', n: 2, speed: 1.8, width: 16,
      path: { type: 'ring', at: [OUT + 60, 30], r: 70, r2: 46, y: 0.3 } },
  ],
  koriko: [
    { kind: 'walkers', cast: 'euro', n: 26, speed: 1.0, width: 8,
      path: { type: 'ring', at: [OUT - 90, 0], r: 120, r2: 120, y: 22.0 } },
    { kind: 'cars', n: 3, speed: 7, width: 2, pause: false,
      path: { type: 'ring', at: [OUT - 90, 0], r: 160, r2: 160, y: 12.0 } },
    { kind: 'boats', n: 4, speed: 3.0, width: 34,
      path: { type: 'ring', at: [OUT + 70, 0], r: 90, r2: 240, y: 0.3 } },
  ],
  cove: [
    { kind: 'planes', n: 2, speed: 30, width: 40, scale: 0.9,
      path: { type: 'ring', at: [OUT - 40, 0], r: 320, r2: 240, y: 62 } },
  ],
  bus: [
    { kind: 'cars', n: 1, speed: 7, width: 0, pause: false,
      path: { type: 'ring', at: [OUT - 30, 0], r: 96, r2: 96, y: 5.0 } },
  ],
  tama: [
    { kind: 'cars', n: 4, speed: 8, width: 2.4, pause: false,
      path: { type: 'ring', at: [OUT - 70, 0], r: 130, r2: 130, y: 13.0 } },
    { kind: 'walkers', cast: 'showa', n: 14, speed: 0.9, width: 9,
      path: { type: 'ring', at: [OUT - 70, 0], r: 92, r2: 92, y: 21.0 } },
  ],
  cats: [
    { kind: 'walkers', cast: 'euro', n: 12, speed: 0.9, width: 7, scale: 0.85,
      path: { type: 'ring', at: [OUT - 20, 0], r: 52, r2: 52, y: 6.4 } },
  ],
  // Nobody walks in the cedar forest. What moves there is not people.
  cedar: [],
  iron: [
    { kind: 'walkers', cast: 'worker', n: 24, speed: 0.8, width: 9,
      path: { type: 'ring', at: [OUT - 60, 0], r: 66, r2: 66, y: 18.0 } },
  ],
  meadow: [
    // the army: airships over the camp, and columns of men under them
    { kind: 'ship', at: [OUT - 220, 210, -260], len: 92, rot: 0.5, speed: 1.4, seed: 21 },
    { kind: 'ship', at: [OUT - 40, 260, 330], len: 74, rot: -0.4, speed: 1.1, seed: 22 },
    { kind: 'walkers', cast: 'euro', n: 30, speed: 1.1, width: 4,
      path: { type: 'street', from: [OUT + 30, -180], to: [OUT - 150, 190], y: 8.0 } },
    { kind: 'planes', n: 3, speed: 34, width: 46, scale: 0.8,
      path: { type: 'ring', at: [OUT - 70, 0], r: 420, r2: 320, y: 120 } },
  ],
  market: [
    { kind: 'walkers', cast: 'euro', n: 30, speed: 1.0, width: 7,
      path: { type: 'ring', at: [OUT - 80, 40], r: 130, r2: 130, y: 18.0 } },
    { kind: 'ship', at: [OUT - 300, 240, -200], len: 88, rot: 0.8, speed: 1.0, seed: 23 },
  ],
  hort: [
    { kind: 'walkers', cast: 'desert', n: 24, speed: 0.95, width: 8,
      path: { type: 'ring', at: [OUT - 60, 0], r: 76, r2: 76, y: 21.0 } },
    { kind: 'boats', n: 3, speed: 2.6, width: 24,
      path: { type: 'ring', at: [OUT + 60, 0], r: 70, r2: 200, y: 0.3 } },
  ],
  valley: [
    { kind: 'walkers', cast: 'desert', n: 16, speed: 0.9, width: 9,
      path: { type: 'ring', at: [OUT - 55, 0], r: 82, r2: 82, y: 17.0 } },
    { kind: 'ship', at: [OUT - 260, 230, 260], len: 110, rot: -0.6, speed: 0.9, seed: 24 },
  ],
  slag: [
    { kind: 'walkers', cast: 'worker', n: 18, speed: 0.85, width: 8,
      path: { type: 'ring', at: [OUT - 45, 0], r: 70, r2: 70, y: 21.0 } },
    { kind: 'ship', at: [OUT - 280, 250, -300], len: 96, rot: 0.4, speed: 1.2, seed: 25 },
  ],
  laputa: [
    { kind: 'ship', at: [OUT - 340, 300, 320], len: 120, rot: -0.5, speed: 0.8, seed: 26 },
  ],
  tower: [
    { kind: 'walkers', cast: 'showa', n: 10, speed: 0.8, width: 7,
      path: { type: 'ring', at: [OUT + 35, 60], r: 40, r2: 40, y: 13.0 } },
  ],
};

export { airshipGeo, beastGeo, mergeSimple };
