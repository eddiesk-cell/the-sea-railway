import * as THREE from 'three';
import { box, hill, mulberry, fillInstances, mergePN } from '../world/geo.js';
import { makePaintMaterial, makeGlowMaterial } from '../world/paintMaterial.js';

// ---------------------------------------------------------------------------
// The Cat Bureau — The Cat Returns, 2002.
//
// A whole town built to a tenth of the size, sitting in the grass beside the
// line: a plaza, a crossroads, a fountain, a clock tower you could pick up.
//
// The joke only works if something ORDINARY is in the frame at its ordinary
// size. So the daisies growing through the square are real daisies, the
// paving is bedded in real grass, and one flowerpot stands over the whole
// place like a gasometer. Without those the town is simply a town seen from
// far away, and the entire point evaporates.
// ---------------------------------------------------------------------------

export function buildCatBureau(shared) {
  const group = new THREE.Group();
  const rnd = mulberry(2002);

  const turf = makePaintMaterial(shared, { color: '#63803e', shadowTint: '#22301a', rim: 0.55, bands: 3, grain: 0.22, grainScale: 0.5, sway: 0.02, translucency: 0.75 });
  const paving = makePaintMaterial(shared, { color: '#b3a993', shadowTint: '#453f39', rim: 0.7, bands: 3, grain: 0.28, grainScale: 3.0 });
  const wallA = makePaintMaterial(shared, { color: '#d8c9a8', shadowTint: '#4c463e', rim: 0.8, bands: 3, grain: 0.18 });
  const wallB = makePaintMaterial(shared, { color: '#c2a98c', shadowTint: '#453b34', rim: 0.8, bands: 3, grain: 0.18 });
  const wallC = makePaintMaterial(shared, { color: '#a8b0a2', shadowTint: '#3a403a', rim: 0.8, bands: 3, grain: 0.18 });
  const tileA = makePaintMaterial(shared, { color: '#a25a3e', shadowTint: '#38201c', rim: 0.95, bands: 3, grain: 0.14, side: THREE.DoubleSide });
  const tileB = makePaintMaterial(shared, { color: '#5c6a6e', shadowTint: '#20272c', rim: 0.95, bands: 3, grain: 0.14, side: THREE.DoubleSide });
  const timber = makePaintMaterial(shared, { color: '#5b4530', shadowTint: '#1e1713', rim: 0.85, bands: 3, grain: 0.26, grainScale: 1.6 });
  const terracotta = makePaintMaterial(shared, { color: '#b5654a', shadowTint: '#402019', rim: 0.9, bands: 3, grain: 0.24, grainScale: 1.2 });
  const brass = makePaintMaterial(shared, { color: '#c2a15c', shadowTint: '#4a3a22', rim: 1.4, bands: 3, grain: 0.10 });
  const petalW = makePaintMaterial(shared, {
    color: '#f0ece0', shadowTint: '#5e5c58', rim: 1.3, bands: 2, grain: 0.08,
    side: THREE.DoubleSide, sway: 0.14, translucency: 1.6,
  });
  const winGlow = makeGlowMaterial(shared, '#ffd694', 0.55, { flicker: 0.05 });

  const unit = box(1, 1, 1);
  const put = (items, geo, mat, ro) => {
    if (!items.length) return null;
    const m = new THREE.InstancedMesh(geo, mat, items.length);
    fillInstances(m, items); m.frustumCulled = false;
    if (ro) m.renderOrder = ro;
    group.add(m); return m;
  };

  // =========================================================================
  // Meadow, with a small paved square set into it
  // =========================================================================
  // Right up against the line. A two-metre house seventy metres away subtends
  // the same angle as a twenty-metre house seven hundred away — which is to
  // say the miniature reads as ordinary, and the joke dies. It has to be
  // CLOSE, with full-sized things standing next to it.
  const CX = -34, CZ = -1300;             // the middle of the plaza
  {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 22; i++) {
        const b = new THREE.Mesh(unit, turf);
        const w = 220 + rnd() * 300;
        b.position.set(side * (13 + w / 2), 0.5, -120 - i * 126);
        b.scale.set(w, 1.8, 126 + rnd() * 30);
        group.add(b);
      }
    }
    const plaza = new THREE.Mesh(unit, paving);
    plaza.position.set(CX, 1.45, CZ);
    plaza.scale.set(40, 0.3, 120);
    group.add(plaza);
    // two lanes crossing it, a shade paler
    for (const [w, d] of [[40, 4], [4, 120]]) {
      const lane = new THREE.Mesh(unit, wallC);
      lane.position.set(CX, 1.62, CZ);
      lane.scale.set(w, 0.12, d);
      group.add(lane);
    }
  }

  // =========================================================================
  // The town. Nothing in it is taller than a person.
  // =========================================================================
  {
    const wallsets = [[], [], []], mats = [wallA, wallB, wallC];
    const roofsA = [], roofsB = [], wins = [], doors = [];
    const roofGeo = (() => {
      const g = new THREE.ConeGeometry(0.71, 1, 4, 1);
      g.rotateY(Math.PI / 4); g.translate(0, 0.5, 0);
      return g;
    })();
    for (let i = 0; i < 260; i++) {
      // ranked along the two lanes, jammed shoulder to shoulder
      const alongZ = rnd() > 0.42;
      const x = alongZ ? CX + (rnd() > 0.5 ? 1 : -1) * (5 + rnd() * 14) : CX + (rnd() - 0.5) * 36;
      const z = alongZ ? CZ + (rnd() - 0.5) * 114 : CZ + (rnd() > 0.5 ? 1 : -1) * (5 + rnd() * 52);
      const w = 1.1 + rnd() * 1.4, dp = 1.1 + rnd() * 1.4;
      const ht = 1.6 + rnd() * 2.6;
      const ry = (alongZ ? 0 : Math.PI / 2) + (rnd() - 0.5) * 0.24;
      wallsets[(rnd() * 3) | 0].push({ pos: [x, 1.6 + ht / 2, z], rot: [0, ry, 0], scale: [w, ht, dp] });
      (rnd() > 0.5 ? roofsA : roofsB).push({
        pos: [x, 1.6 + ht + 0.42, z], rot: [0, ry, 0], scale: [(w + 0.4) / 1.42, 0.8 + rnd() * 0.5, (dp + 0.4) / 1.42],
      });
      if (rnd() > 0.35) {
        wins.push({
          pos: [x + Math.cos(ry) * (dp / 2 + 0.02), 1.6 + ht * 0.6, z - Math.sin(ry) * (dp / 2 + 0.02)],
          rot: [0, ry + Math.PI / 2, 0], scale: [0.34, 0.30, 1],
        });
      }
      if (rnd() > 0.6) {
        doors.push({
          pos: [x + Math.cos(ry) * (dp / 2 + 0.02), 1.95, z - Math.sin(ry) * (dp / 2 + 0.02)],
          rot: [0, ry + Math.PI / 2, 0], scale: [0.30, 0.62, 1],
        });
      }
    }
    wallsets.forEach((s, i) => put(s, unit, mats[i]));
    put(roofsA, roofGeo, tileA); put(roofsB, roofGeo, tileB);
    put(wins, new THREE.PlaneGeometry(1, 1), winGlow, 6);
    put(doors, new THREE.PlaneGeometry(1, 1), timber, 5);
  }

  // ---- the clock tower and the fountain, both of which fit in two hands ----
  {
    const t = new THREE.Group();
    t.position.set(CX + 2, 1.6, CZ - 24);
    const shaft = new THREE.Mesh(box(1.5, 6.4, 1.5), wallA);
    shaft.position.y = 3.2; t.add(shaft);
    const belfry = new THREE.Mesh(box(1.9, 1.4, 1.9), wallC);
    belfry.position.y = 7.0; t.add(belfry);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(1.4, 2.2, 4, 1), tileB);
    spire.rotation.y = Math.PI / 4; spire.position.y = 8.8; t.add(spire);
    for (const [dx, dz] of [[0, 0.79], [0.79, 0]]) {
      const face = new THREE.Mesh(new THREE.CircleGeometry(0.5, 14), brass);
      face.position.set(dx, 5.8, dz);
      if (dx) face.rotation.y = Math.PI / 2;
      t.add(face);
    }
    group.add(t);

    const f = new THREE.Group();
    f.position.set(CX - 1, 1.6, CZ + 18);
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.5, 14), paving);
    basin.position.y = 0.25; f.add(basin);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 1.4, 8), paving);
    stem.position.y = 1.0; f.add(stem);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.3, 0.3, 12), paving);
    bowl.position.y = 1.8; f.add(bowl);
    group.add(f);

    // lamps round the square: tiny, warm, and the reason it reads as a town
    const lamps = [], posts = [];
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      const x = CX + Math.cos(a) * 17, z = CZ + Math.sin(a) * 52;
      posts.push({ pos: [x, 2.4, z], scale: [0.1, 1.6, 0.1] });
      lamps.push({ pos: [x, 3.3, z], scale: [0.16, 0.16, 0.16] });
    }
    put(posts, unit, timber);
    put(lamps, new THREE.SphereGeometry(1, 7, 5), makeGlowMaterial(shared, '#ffd28a', 1.5, { flicker: 0.08 }), 12);
  }

  // =========================================================================
  // The things at ordinary size, which are what make the town small
  // =========================================================================
  {
    // A terracotta pot, standing over the whole place — and standing AT the
    // station, in the same frame as the town. A reference object the eye never
    // sees beside the thing it is meant to measure is no reference at all, and
    // the first pass parked it seventy metres up the line where it did nothing.
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 4.4, 11, 18), terracotta);
    pot.position.set(-38, 7.1, -1296); group.add(pot);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(6.9, 6.4, 1.4, 18), terracotta);
    rim.position.set(-38, 12.9, -1296); group.add(rim);
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(6.0, 6.0, 0.7, 16), timber);
    soil.position.set(-38, 13.1, -1296); group.add(soil);

    // a watering can, on its side, in the grass
    const can = new THREE.Group();
    can.position.set(-24, 1.6, -1348); can.rotation.set(0, 0.7, 1.4);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.9, 6, 14), wallC);
    body.position.y = 3; can.add(body);
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, 7, 9), wallC);
    spout.rotation.z = -1.0; spout.position.set(4.2, 4.4, 0); can.add(spout);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.32, 6, 14), wallC);
    handle.rotation.y = Math.PI / 2; handle.position.set(0, 6.6, 0); can.add(handle);
    group.add(can);

    // daisies, at their real size, growing through the paving
    const flower = (() => {
      const parts = [];
      const stem = new THREE.CylinderGeometry(0.02, 0.03, 0.8, 4); stem.translate(0, 0.4, 0);
      parts.push(stem.toNonIndexed());
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const p = new THREE.PlaneGeometry(0.11, 0.26).toNonIndexed();
        p.translate(0, 0.16, 0); p.rotateX(-0.35); p.rotateY(a);
        p.translate(Math.sin(a) * 0.04, 0.82, Math.cos(a) * 0.04);
        parts.push(p);
      }
      return mergePN(parts);
    })();
    const items = [];
    for (let i = 0; i < 9000; i++) {
      // real daisies, at real daisy size — they were as tall as the houses,
      // which made the whole town ordinary again
      const s = 0.30 + rnd() * 0.28;
      items.push({
        pos: [-14 - Math.pow(rnd(), 0.8) * 120, 1.5, -110 - rnd() * 2520],
        rot: [0, rnd() * 6.28, 0], scale: [s, s * (0.8 + rnd() * 0.6), s],
      });
    }
    put(items, flower, petalW);
  }

  function update() { /* a town this size holds very still */ }

  return { group, update };
}
