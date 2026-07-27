import * as THREE from 'three';
import { box, hill, mulberry, fillInstances, mergePN } from '../world/geo.js';
import { makePaintMaterial, makeGlowMaterial } from '../world/paintMaterial.js';

// ---------------------------------------------------------------------------
// The Rotary — Whisper of the Heart, 1995.
//
// A suburb on a hill at first light, and the overlook where the whole town is
// laid out below with the lights still on in it.
//
// The trick this one needed: the world floats on water at nothing, so there is
// no "below" to look down into — dig a valley and the sea fills it. So the
// town is not sunk, it is DIMINISHED: a few thousand small blocks running out
// to the haze, all of them under twelve metres, with the near railing and one
// shop at eye height. Scale does the work that altitude cannot.
// ---------------------------------------------------------------------------

export function buildTheRotary(shared) {
  const group = new THREE.Group();
  const rnd = mulberry(1995);

  const road = makePaintMaterial(shared, { color: '#7e7c78', shadowTint: '#2e2e30', rim: 0.6, bands: 3, grain: 0.26, grainScale: 1.9 });
  const kerb = makePaintMaterial(shared, { color: '#a8a49a', shadowTint: '#3c3b3a', rim: 0.7, bands: 3, grain: 0.22, grainScale: 1.4 });
  const turf = makePaintMaterial(shared, { color: '#5e7440', shadowTint: '#212a1a', rim: 0.55, bands: 3, grain: 0.22, grainScale: 0.55, sway: 0.02, translucency: 0.7 });
  const wallA = makePaintMaterial(shared, { color: '#bdb6a6', shadowTint: '#44413e', rim: 0.75, bands: 3, grain: 0.16 });
  const wallB = makePaintMaterial(shared, { color: '#a8a496', shadowTint: '#3d3b38', rim: 0.75, bands: 3, grain: 0.18 });
  const wallC = makePaintMaterial(shared, { color: '#9aa0a0', shadowTint: '#383c3c', rim: 0.75, bands: 3, grain: 0.16 });
  const tileA = makePaintMaterial(shared, { color: '#4a5560', shadowTint: '#1a1f26', rim: 0.9, bands: 3, grain: 0.14, side: THREE.DoubleSide });
  const tileB = makePaintMaterial(shared, { color: '#7a5346', shadowTint: '#2a1c1a', rim: 0.9, bands: 3, grain: 0.14, side: THREE.DoubleSide });
  const timber = makePaintMaterial(shared, { color: '#6b4f36', shadowTint: '#231a15', rim: 0.85, bands: 3, grain: 0.26, grainScale: 1.4 });
  const steelM = makePaintMaterial(shared, { color: '#6a6f74', shadowTint: '#22262c', rim: 1.5, bands: 3, grain: 0.08 });
  const petal = makePaintMaterial(shared, {
    color: '#e8c2cc', shadowTint: '#5c4348', rim: 1.3, bands: 2, grain: 0.10,
    side: THREE.DoubleSide, sway: 0.10, translucency: 1.5,
  });
  const winGlow = makeGlowMaterial(shared, '#ffe0a8', 0.26, { flicker: 0.03 });
  const shopGlow = makeGlowMaterial(shared, '#ffc978', 0.60, { flicker: 0.05 });

  const unit = box(1, 1, 1);
  const put = (items, geo, mat, ro) => {
    if (!items.length) return null;
    const m = new THREE.InstancedMesh(geo, mat, items.length);
    fillInstances(m, items); m.frustumCulled = false;
    if (ro) m.renderOrder = ro;
    group.add(m); return m;
  };

  // =========================================================================
  // The overlook: a kerb, a railing, and the road that runs along it
  // =========================================================================
  {
    for (let i = 0; i < 24; i++) {
      const b = new THREE.Mesh(unit, road);
      b.position.set(-13 - 11, 0.7, -110 - i * 120);
      b.scale.set(22, 2.2, 120 + rnd() * 30);
      group.add(b);
      const g = new THREE.Mesh(unit, turf);
      const w = 240 + rnd() * 300;
      g.position.set(13 + w / 2, 0.5, -110 - i * 120);
      g.scale.set(w, 1.8, 120 + rnd() * 30);
      group.add(g);
    }
    const lip = new THREE.Mesh(box(1.4, 2.6, 2700), kerb);
    lip.position.set(-34, 0.9, -1350); group.add(lip);
    // the railing — the one thing at eye height, and what makes it an overlook
    const posts = [], rails = [];
    for (let i = 0; i < 220; i++) {
      posts.push({ pos: [-34, 2.9, -120 - i * 12], scale: [0.14, 1.5, 0.14] });
    }
    for (let i = 0; i < 3; i++) {
      rails.push({ pos: [-34, 2.6 + i * 0.5, -1350], scale: [0.12, 0.12, 2600] });
    }
    put(posts, unit, steelM); put(rails, unit, steelM);

    // and the ground falling away beyond it — a shallow apron, not a cliff
    for (let i = 0; i < 22; i++) {
      const b = new THREE.Mesh(unit, turf);
      b.position.set(-70 - 120, 0.4, -120 - i * 126);
      b.scale.set(240, 1.4, 126 + rnd() * 30);
      group.add(b);
    }
  }

  // =========================================================================
  // The town below: thousands of small blocks running out into the dawn haze
  // =========================================================================
  {
    const wallsets = [[], [], []], mats = [wallA, wallB, wallC];
    const roofsA = [], roofsB = [], wins = [];
    const roofGeo = (() => {
      const g = new THREE.ConeGeometry(0.71, 1, 4, 1);
      g.rotateY(Math.PI / 4); g.translate(0, 0.5, 0);
      return g;
    })();
    for (let i = 0; i < 2400; i++) {
      // packed near the overlook and thinning out, which is what a valley of
      // roofs actually does when you look across it
      const x = -60 - Math.pow(rnd(), 0.62) * 900;
      const z = -110 - rnd() * 2520;
      const w = 6 + rnd() * 7, dp = 6 + rnd() * 7, ht = 4 + rnd() * 6;
      const ry = (rnd() - 0.5) * 0.5;
      wallsets[(rnd() * 3) | 0].push({ pos: [x, ht / 2 + 1, z], rot: [0, ry, 0], scale: [w, ht, dp] });
      (rnd() > 0.5 ? roofsA : roofsB).push({
        pos: [x, ht + 1.9, z], rot: [0, ry, 0], scale: [(w + 1.8) / 1.42, 2.0 + rnd() * 1.2, (dp + 1.8) / 1.42],
      });
      if (rnd() > 0.72) {
        wins.push({ pos: [x + w / 2 + 0.05, ht * 0.6 + 1, z], rot: [0, Math.PI / 2, 0], scale: [1.6, 1.0, 1] });
      }
    }
    wallsets.forEach((s, i) => put(s, unit, mats[i]));
    put(roofsA, roofGeo, tileA); put(roofsB, roofGeo, tileB);
    put(wins, new THREE.PlaneGeometry(1, 1), winGlow, 6);

    // a few taller blocks, and the pylons walking across the valley
    for (let i = 0; i < 12; i++) {
      const x = -220 - rnd() * 640, z = -140 - rnd() * 2440;
      const h = 20 + rnd() * 26;
      const t = new THREE.Mesh(box(16 + rnd() * 12, h, 14 + rnd() * 10), wallC);
      t.position.set(x, h / 2 + 1, z); group.add(t);
    }
    const legs = [], arms = [];
    for (let i = 0; i < 9; i++) {
      const x = -150 - i * 96, z = -300 - i * 240;
      legs.push({ pos: [x, 22, z], scale: [4, 44, 4] });
      for (let k = 0; k < 3; k++) arms.push({ pos: [x, 30 + k * 7, z], scale: [22 - k * 5, 0.8, 0.8] });
    }
    put(legs, unit, steelM); put(arms, unit, steelM);
  }

  // =========================================================================
  // The shop at the bend: the one thing at full size, and it is lit
  // =========================================================================
  {
    const s = new THREE.Group();
    s.position.set(-46, 1.4, -1290);
    s.rotation.y = Math.PI / 2 - 0.26;
    const body = new THREE.Mesh(box(10, 8.5, 13), wallA);
    body.position.y = 4.25; s.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(9.4, 4.6, 4, 1), tileB);
    roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 1.35); roof.position.y = 10.4; s.add(roof);
    // the round window over the door, which is the whole face of the building
    const round = new THREE.Mesh(new THREE.CircleGeometry(1.5, 16), shopGlow);
    round.position.set(0, 7.4, 6.56); s.add(round);
    const frame = new THREE.Mesh(new THREE.TorusGeometry(1.62, 0.13, 6, 18), timber);
    frame.position.set(0, 7.4, 6.6); s.add(frame);
    const shopFront = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 3.0), shopGlow);
    shopFront.position.set(0, 3.4, 6.56); s.add(shopFront);
    const mullion = new THREE.Mesh(box(0.16, 3.2, 0.16), timber);
    mullion.position.set(0, 3.4, 6.62); s.add(mullion);
    const awn = new THREE.Mesh(box(8.6, 0.3, 2.0), timber);
    awn.position.set(0, 5.4, 7.4); s.add(awn);
    const sign = new THREE.Mesh(box(0.2, 1.2, 3.4), timber);
    sign.position.set(5.2, 6.6, 4); s.add(sign);
    group.add(s);

    // a flight of steps going down past it, and a lamp at the top of them
    for (let i = 0; i < 20; i++) {
      const st = new THREE.Mesh(box(4, 0.4, 1.1), kerb);
      st.position.set(-38 - i * 0.9, 2.4 - i * 0.10, -1330); group.add(st);
    }
    const post = new THREE.Mesh(box(0.2, 5, 0.2), steelM);
    post.position.set(-36, 3.9, -1318); group.add(post);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 6), makeGlowMaterial(shared, '#ffdca0', 1.6, { flicker: 0.06 }));
    lamp.position.set(-36, 6.5, -1318); group.add(lamp);
  }

  // ---- cherry along the road, because it is that kind of suburb ----
  {
    const blossom = (() => {
      const parts = [];
      for (let i = 0; i < 4; i++) {
        const g = new THREE.IcosahedronGeometry(1, 0);
        const q = g.attributes.position;
        for (let v = 0; v < q.count; v++) {
          const n = 0.7 + ((v * 13 + i * 23) % 15) / 26;
          q.setXYZ(v, q.getX(v) * n, q.getY(v) * n * 0.8, q.getZ(v) * n);
        }
        g.computeVertexNormals();
        const sc = 0.44 + (i % 3) * 0.14;
        g.scale(sc, sc, sc);
        g.translate((i % 3 - 1) * 0.44, 0.5 + (i % 2) * 0.22, ((i * 7) % 3 - 1) * 0.4);
        parts.push(g.toNonIndexed());
      }
      return mergePN(parts);
    })();
    const items = [], trunks = [];
    for (let i = 0; i < 90; i++) {
      // back off the line: a six-metre ball of blossom eighteen metres from the
      // window is a pink boulder, not a tree
      const x = -44 - rnd() * 16, z = -130 - i * 28 - rnd() * 12;
      const s = 2.4 + rnd() * 1.7;
      items.push({ pos: [x, 3.2, z], rot: [0, rnd() * 6.28, 0], scale: [s, s * 0.9, s] });
      trunks.push({ pos: [x, 1.6, z], scale: [s * 0.09, s * 1.3, s * 0.09] });
    }
    put(items, blossom, petal);
    put(trunks, new THREE.CylinderGeometry(1, 1.3, 1, 5), timber);
  }

  function update() { /* the town is asleep; nothing here moves yet */ }

  return { group, update };
}
