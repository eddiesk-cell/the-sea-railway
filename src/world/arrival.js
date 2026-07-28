import * as THREE from 'three';
import { box, mulberry, fillInstances } from './geo.js';
import { pal, house, lantern, bridge, torii, boat, barrel, crate, bench, put } from '../places/kit.js';

// ---------------------------------------------------------------------------
// The arrival.
//
// Eddie: "for Spirited Away — town square, the bridge before the bathhouse,
// the lanterns on the streets, the restaurants with plenty of food, and all the
// spirits walking off the boat, spirits walking into the bathhouse through the
// bridge, you know those things."
//
// He is not asking for more buildings. He is asking for the SEQUENCE — the one
// that everybody who has seen the film carries around: the light goes, the
// lamps come on one by one, the ferry noses in out of nowhere, and the guests
// come ashore and walk up through a town laid out for a trade that has nothing
// to do with you, and in at a door you are not supposed to go through.
//
// So this is not a place you walk to. It is built where the ride already
// looks — on the water between the line and the bathhouse — and it is
// arranged as a single continuous move: boat, quay, street, square, bridge,
// door. The procession is one route through all six.
//
// The whole thing stands on its own terrace above the water on piles, which is
// both what that town looks like and the only way to control every height:
// the plate under the bathhouse climbs from 0 to 150 m across a hundred and
// fifty metres and nothing built by hand can safely sit on it.
// ---------------------------------------------------------------------------

// The town climbs to the bathhouse in three terraces, because the bathhouse's
// own floor is thirty metres above the water and a bridge cannot make up that
// difference — which is exactly why the town in the film is drawn as stepped
// terraces stacked up the bank rather than a flat street.
const L0 = 8.5;    // the quay, where the ferry comes alongside
const L1 = 17.0;   // the lower street
const L2 = 25.5;   // the square, and the head of the bridge
const DOOR = 30.0; // the bathhouse's own ground
const LANE_Z = -206, HALF = 7.4;
const BATH_X = -268, BATH_Z = -198;

export function createArrival(shared) {
  const M = pal(shared, {
    wood:  '#4a3626',
    dark:  { color: '#241018', shadowTint: '#0b0812', rim: 1.2, bands: 3, grain: 0.2 },
    wall:  '#8a7458',
    roof:  { color: '#3a3038', shadowTint: '#131016', rim: 1.1, bands: 3, grain: 0.16, side: THREE.DoubleSide },
    stone: { color: '#6e6a60', shadowTint: '#24241f', rim: 0.9, bands: 3, grain: 0.26, grainScale: 1.3, wrap: 0.55 },
    red:   { color: '#a8302a', shadowTint: '#3a1020', rim: 1.5, bands: 3, grain: 0.2, grainScale: 1.4 },
    cloth: { color: '#b4553c', shadowTint: '#3f2230', rim: 0.9, bands: 2, grain: 0.12, side: THREE.DoubleSide },
  });
  const g = new THREE.Group();
  const rnd = mulberry(20010720);

  // ---- a terrace: a slab, a parapet, and the piles it stands on -----------
  const terrace = (x0, x1, y, halfZ) => {
    const w = Math.abs(x0 - x1), cx = (x0 + x1) / 2;
    const slab = new THREE.Mesh(box(w, 1.8, halfZ * 2), M.stone);
    slab.position.set(cx, y - 0.9, LANE_Z); g.add(slab);
    for (const sz of [-1, 1]) {
      const lip = new THREE.Mesh(box(w, 1.2, 1.0), M.stone);
      lip.position.set(cx, y + 0.6, LANE_Z + sz * halfZ); g.add(lip);
    }
    const piles = [];
    const n = Math.round(w * halfZ / 26);
    for (let i = 0; i < n; i++) {
      const px = x1 + 2 + rnd() * (w - 4);
      const pz = LANE_Z - halfZ + 2 + rnd() * (halfZ * 2 - 4);
      piles.push({ pos: [px, y / 2 - 1.0, pz], rot: [0, rnd() * 6.28, 0], scale: [0.62, y + 1.6, 0.62] });
    }
    put(g, piles, box(1, 1, 1), M.wood);
  };

  // ---- a flight of steps from one terrace to the next ---------------------
  //
  // The street climbs INLAND, and inland is decreasing x. The first version had
  // the low end at the inland side and the high end at the quay, so every
  // flight ran backwards under a crowd walking correctly up it — Eddie: "check
  // your stairs, it's wired wrong." Each tread also drops to the terrace below
  // it now, because a staircase made of floating slabs is a ladder.
  const flight = (x, yLo, yHi, w) => {
    const n = Math.round((yHi - yLo) / 0.42);
    const run = 14;
    const items = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const y = yLo + (yHi - yLo) * t;
      items.push({
        pos: [x + run / 2 - t * run, (y + yLo - 1.2) / 2, LANE_Z],
        scale: [run / n + 0.35, y - yLo + 1.2, w],
      });
    }
    put(g, items, box(1, 1, 1), M.stone);
    for (const sz of [-1, 1]) {
      const rail = new THREE.Mesh(box(run + 1.6, 0.42, 0.34), M.red);
      rail.position.set(x, (yLo + yHi) / 2 + 1.15, LANE_Z + sz * (w / 2 - 0.3));
      rail.rotation.z = -Math.atan2(yHi - yLo, run); g.add(rail);
      // and newel posts, so it reads as a stair and not a ramp
      for (const e of [-1, 1]) {
        const post = new THREE.Mesh(box(0.42, 2.2, 0.42), M.red);
        post.position.set(x + e * (run / 2), (e > 0 ? yLo : yHi) + 1.1, LANE_Z + sz * (w / 2 - 0.3));
        g.add(post);
      }
    }
  };

  terrace(-72, -114, L0, 34);
  terrace(-114, -148, L1, 26);
  terrace(-148, -180, L2, 22);
  // A flight stands ON the terrace below and lands exactly at the edge of the
  // one above — centre it on the join and half of it is inside the upper slab.
  flight(-107, L0, L1, 13);
  flight(-141, L1, L2, 13);

  // =========================================================================
  // The street of restaurants
  //
  // Two unbroken walls of shopfronts with a lane between them. Every one open,
  // every one lit, every counter heaped, and nobody behind any of them — which
  // is the thing that makes the street frightening rather than welcoming, and
  // it only works if there are ENOUGH of them that you cannot see the end.
  // =========================================================================
  const shopRow = (x, y) => {
    for (let side = 0; side < 2; side++) {
      const sz = side ? 1 : -1;
      const w = 6.0 + rnd() * 1.4;
      const h = house(M, {
        w: 8.6, d: w, h: 3.4, storeys: rnd() < 0.5 ? 2 : 1, storeyH: 2.7,
        roof: 'jp', roofH: 2.0, wall: M.wall, roofMat: M.roof, trim: M.wood,
        windows: 2, lit: rnd() < 0.82 ? 2 : 0, doorW: 2.4, doorH: 2.2, doorLit: true,
      });
      h.position.set(x, y, LANE_Z + sz * (HALF + 4.4));
      h.rotation.y = sz > 0 ? Math.PI : 0;
      g.add(h);

      const counter = new THREE.Mesh(box(w * 0.86, 1.0, 1.5), M.wood);
      counter.position.set(x, y + 0.5, LANE_Z + sz * (HALF - 0.5));
      counter.rotation.y = Math.PI / 2; g.add(counter);
      const heap = [];
      for (let k = 0; k < 24; k++) {
        const sc = 0.16 + rnd() * 0.26;
        heap.push({
          pos: [x + (rnd() - 0.5) * w * 0.8, y + 1.06 + rnd() * 0.30,
                LANE_Z + sz * (HALF - 0.5) + (rnd() - 0.5) * 1.1],
          rot: [rnd(), rnd() * 6.28, rnd()],
          scale: [sc, sc * (0.6 + rnd() * 0.8), sc],
        });
      }
      put(g, heap, new THREE.SphereGeometry(1, 6, 5), rnd() < 0.5 ? M.cloth : M.wood);

      const awn = new THREE.Mesh(box(w, 0.10, 3.2), M.cloth);
      awn.position.set(x, y + 3.15, LANE_Z + sz * (HALF - 1.4));
      awn.rotation.z = 0.05; g.add(awn);
      const noren = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.92, 0.85), M.cloth);
      noren.position.set(x, y + 2.72, LANE_Z + sz * (HALF - 2.9)); g.add(noren);

      const l = lantern(M, { h: 1.35, stone: false, lit: true, mat: M.red });
      l.position.set(x + 3.2, y + 2.0, LANE_Z + sz * (HALF - 1.8)); g.add(l);
    }
  };
  for (let i = 0; i < 5; i++) shopRow(-119 - i * 6.6, L1);
  for (let i = 0; i < 4; i++) shopRow(-152 - i * 6.6, L2);

  // the lamp standards down the middle, which is what lights the street
  for (let i = 0; i < 5; i++) {
    const post = lantern(M, { h: 4.4, stone: false, lit: true, mat: M.dark });
    post.position.set(-118 - i * 6.8, L1, LANE_Z + (i % 2 ? 5.6 : -5.6)); g.add(post);
  }
  for (let i = 0; i < 4; i++) {
    const post = lantern(M, { h: 4.4, stone: false, lit: true, mat: M.dark });
    post.position.set(-151 - i * 6.8, L2, LANE_Z + (i % 2 ? 5.6 : -5.6)); g.add(post);
  }

  // =========================================================================
  // The square at the head of it, and the bridge out
  // =========================================================================
  {
    const t = torii(M, { w: 8.0, h: 8.4, mat: M.red, cap: M.dark });
    t.position.set(-172, L2, LANE_Z); t.rotation.y = Math.PI / 2; g.add(t);
    for (const sz of [-1, 1]) {
      const l = lantern(M, { h: 3.2, stone: true, lit: true, mat: M.stone });
      l.position.set(-166, L2, LANE_Z + sz * 10); g.add(l);
    }
    for (let i = 0; i < 10; i++) {
      const c = rnd() < 0.5 ? barrel(M, { r: 0.42, h: 1.05 }) : crate(M, { s: 0.85 });
      c.position.set(-160 + (rnd() - 0.5) * 18, L2, LANE_Z + (rnd() - 0.5) * 26);
      c.rotation.y = rnd() * 6.28; g.add(c);
    }

    // THE BRIDGE. Out of the square, across open air, onto the bathhouse's own
    // ground — the last thing in this world that is on your side of the water.
    const b = bridge(M, { span: 22, w: 6.0, arch: 3.6, mat: M.red, rail: true });
    b.position.set(-189, L2 + 0.6, LANE_Z);
    b.rotation.y = Math.PI / 2;
    g.add(b);
    const landing = new THREE.Mesh(box(12, 1.4, 9.0), M.stone);
    landing.position.set(-202, DOOR - 0.7, LANE_Z); g.add(landing);
    // lanterns down both parapets
    for (let i = 0; i < 9; i++) {
      const u = (i + 0.5) / 9;
      const x = -178 - u * 22;
      const y = L2 + 0.6 + Math.sin(u * Math.PI) * 3.6 + 1.3;
      for (const sz of [-1, 1]) {
        const l = lantern(M, { h: 1.6, stone: false, lit: true, mat: M.dark });
        l.position.set(x, y, LANE_Z + sz * 2.9); g.add(l);
      }
    }
  }

  // =========================================================================
  // The main entrance
  //
  // The bathhouse's lowest tier is a terrace at thirty metres running from
  // x -186 to -202, with the first wall behind it — so the door goes there,
  // facing back down the bridge. Everything about it is oversized: the eave
  // is deeper than the porch is wide, the curtains are three metres of cloth,
  // and the lanterns are the size of a person. It is a doorway built to make
  // whoever walks through it feel small, which is its entire job in the film.
  // =========================================================================
  {
    const X = -203.5, Y = DOOR;
    // three broad steps up off the landing
    for (let i = 0; i < 3; i++) {
      const st = new THREE.Mesh(box(1.5, 0.42, 15 - i * 1.2), M.stone);
      st.position.set(X + 4.6 - i * 1.5, Y + 0.21 + i * 0.42, LANE_Z); g.add(st);
    }
    const sill = new THREE.Mesh(box(3.0, 0.5, 13.0), M.stone);
    sill.position.set(X + 1.2, Y + 1.5, LANE_Z); g.add(sill);

    // the porch: posts, a lintel, and an eave that reaches right out over the
    // steps — the deep shadow under it is what you actually see from the bridge
    for (const sz of [-1, 1]) {
      const post = new THREE.Mesh(box(1.1, 8.4, 1.1), M.red);
      post.position.set(X + 0.6, Y + 5.9, LANE_Z + sz * 5.6); g.add(post);
      const lamp = lantern(M, { h: 3.2, stone: false, lit: true, mat: M.red });
      lamp.position.set(X + 2.4, Y + 4.6, LANE_Z + sz * 5.6); g.add(lamp);
    }
    const lintel = new THREE.Mesh(box(1.5, 1.5, 13.4), M.red);
    lintel.position.set(X + 0.6, Y + 10.4, LANE_Z); g.add(lintel);
    const eave = new THREE.Mesh(box(7.0, 0.7, 16.0), M.roof);
    eave.position.set(X + 3.6, Y + 11.3, LANE_Z);
    eave.rotation.z = 0.11; g.add(eave);
    const ridge = new THREE.Mesh(box(2.2, 1.2, 16.6), M.roof);
    ridge.position.set(X + 0.4, Y + 11.9, LANE_Z); g.add(ridge);

    // the doorway itself: a dark opening with light coming out of it
    const dark = new THREE.Mesh(new THREE.PlaneGeometry(11.0, 8.0), M.dark);
    dark.position.set(X - 0.2, Y + 5.7, LANE_Z);
    dark.rotation.y = Math.PI / 2; g.add(dark);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(10.4, 3.0), M.warm(1.05));
    glow.position.set(X - 0.05, Y + 3.3, LANE_Z);
    glow.rotation.y = Math.PI / 2; glow.renderOrder = 8; g.add(glow);

    // the noren across the top of it, in panels with gaps between
    // separate panels with daylight between them — a noren that meets edge to
    // edge is a blind, and the gaps are the only thing that says it is cloth
    for (let i = 0; i < 5; i++) {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.95, 3.4), M.cloth);
      panel.position.set(X + 0.55, Y + 8.0, LANE_Z - 5.0 + i * 2.5);
      panel.rotation.y = Math.PI / 2; g.add(panel);
    }
    const rod = new THREE.Mesh(box(0.22, 0.22, 12.4), M.dark);
    rod.position.set(X + 0.55, Y + 9.72, LANE_Z); g.add(rod);
    // and the board above, lit from below
    const board = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 2.0), M.warm(0.85, '#e8c078'));
    board.position.set(X + 1.4, Y + 12.9, LANE_Z);
    board.rotation.y = Math.PI / 2; board.renderOrder = 8; g.add(board);
    const frame = new THREE.Mesh(box(0.5, 2.6, 7.0), M.dark);
    frame.position.set(X + 1.55, Y + 12.9, LANE_Z); g.add(frame);
  }

  // =========================================================================
  // The ferry, alongside the quay
  // =========================================================================
  {
    const f = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 9, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5), M.dark);
    hull.scale.set(5.0, 3.2, 15.0); hull.position.y = 3.0; f.add(hull);
    const gun = new THREE.Mesh(box(10.4, 0.6, 30.4), M.wood);
    gun.position.y = 3.0; f.add(gun);
    const dk = new THREE.Mesh(box(9.4, 0.3, 29.0), M.wood);
    dk.position.y = 3.3; f.add(dk);
    const cab = new THREE.Mesh(box(6.4, 3.2, 9.0), M.wall);
    cab.position.set(0, 5.0, -5.0); f.add(cab);
    const cr = new THREE.Mesh(box(7.6, 0.5, 10.4), M.roof);
    cr.position.set(0, 6.8, -5.0); f.add(cr);
    for (let i = 0; i < 10; i++) {
      const l = lantern(M, { h: 1.2, stone: false, lit: true, mat: M.red });
      l.position.set((i % 2 ? 1 : -1) * 4.4, 3.4, -12 + i * 2.7); f.add(l);
    }
    const mast = new THREE.Mesh(box(0.34, 9.0, 0.34), M.wood);
    mast.position.set(0, 8.0, 6.0); f.add(mast);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.4), M.cloth);
    flag.position.set(1.8, 11.4, 6.0); f.add(flag);
    f.position.set(-62, 0, -212); f.rotation.y = 0.06;
    g.add(f);

    // the gangway up to the quay
    const gw = new THREE.Mesh(box(13.0, 0.34, 2.8), M.wood);
    gw.position.set(-68, L0 - 2.6, -212);
    gw.rotation.z = 0.44; g.add(gw);
    for (const sz of [-1, 1]) {
      const rail = new THREE.Mesh(box(13.0, 0.12, 0.12), M.wood);
      rail.position.set(-68, L0 - 1.7, -212 + sz * 1.3);
      rail.rotation.z = 0.44; g.add(rail);
    }
  }

  return g;
}

// ---------------------------------------------------------------------------
// The procession.
//
// One route, and it is the film's whole first act in a line of coordinates:
// off the boat, along the quay, up the steps, between the restaurants, up
// again, across the square, over the bridge, in at the door.
// ---------------------------------------------------------------------------
const route = (dz) => [
  [-62, -212 + dz, 3.6],          // standing on the ferry's deck
  [-67, -212 + dz, 5.6],          // down the gangway
  [-76, -211 + dz, L0 + 0.1],     // onto the quay
  [-92, -206 + dz, L0 + 0.1],     // and round into the town
  [-100, -206 + dz, L0 + 0.1],
  [-114, -206 + dz, L1 + 0.1],    // up the first flight
  [-134, -206 + dz, L1 + 0.1],    // between the restaurants
  [-148, -206 + dz, L2 + 0.1],    // up the second
  [-172, -206 + dz, L2 + 0.1],    // under the gate, into the square
  [-183, -206 + dz, L2 + 2.6],    // onto the bridge
  [-189, -206 + dz, L2 + 4.4],    // over the crown of it
  [-198, -206 + dz, DOOR + 0.1],  // down onto the landing
  [-205, -206 + dz, DOOR + 1.8],  // up the steps and in
];

export const ARRIVAL_CROWDS = [
  { kind: 'walkers', cast: 'spirit', n: 34, speed: 0.62, width: 2.8, scale: 1.15,
    fade: true, pause: false, path: { type: 'route', points: route(0) } },
  // a second, slower file, so the bridge is never empty
  { kind: 'walkers', cast: 'spirit', n: 20, speed: 0.44, width: 3.6, scale: 1.32,
    fade: true, pause: false, path: { type: 'route', points: route(-4.5) } },
  // and the town's own, who are not going anywhere
  { kind: 'walkers', cast: 'spirit', n: 14, speed: 0.5, width: 5.0, scale: 1.05,
    path: { type: 'ring', at: [-132, -206], r: 26, r2: 6, y: L1 + 0.1 } },
];
