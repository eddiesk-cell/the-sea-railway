import * as THREE from 'three';
import { box, hill, mulberry, fillInstances, mergePN } from '../world/geo.js';
import { makePaintMaterial, makeGlowMaterial } from '../world/paintMaterial.js';

// ---------------------------------------------------------------------------
// The Crooked House — Earwig and the Witch, 2020.
//
// Rain on an English lane in the dark, hedges either side, and one lit doorway
// that you would not knock on.
//
// The Bus Stop already taught this region how to work: rain is a property of
// the air, so all this has to build is the ground, the hedge, and ONE warm
// rectangle. Everything else is deliberately unlit. The house leans — every
// wall out of true by three or four degrees, no two windows the same size —
// because a house drawn straight is a cottage and a house drawn wrong is a
// witch's.
// ---------------------------------------------------------------------------

export function buildCrookedHouse(shared) {
  const group = new THREE.Group();
  const rnd = mulberry(2020);

  const turf = makePaintMaterial(shared, { color: '#39432f', shadowTint: '#141a16', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.55 });
  const lane = makePaintMaterial(shared, { color: '#4a4642', shadowTint: '#1a1a1e', rim: 1.1, bands: 3, grain: 0.30, grainScale: 2.2 });
  const hedgeM = makePaintMaterial(shared, {
    color: '#2c3a24', shadowTint: '#0e1410', rim: 0.5, bands: 3, grain: 0.30, grainScale: 0.35,
    sway: 0.05, translucency: 0.5,
  });
  const brick = makePaintMaterial(shared, { color: '#5c4038', shadowTint: '#1e1616', rim: 0.8, bands: 3, grain: 0.26, grainScale: 1.4 });
  const render = makePaintMaterial(shared, { color: '#6d6656', shadowTint: '#242220', rim: 0.8, bands: 3, grain: 0.22 });
  const slate = makePaintMaterial(shared, { color: '#33383e', shadowTint: '#111318', rim: 1.2, bands: 3, grain: 0.16, side: THREE.DoubleSide });
  const timber = makePaintMaterial(shared, { color: '#3a2e24', shadowTint: '#131010', rim: 0.7, bands: 3, grain: 0.26, grainScale: 1.6 });
  const boneM = makePaintMaterial(shared, { color: '#4a4b46', shadowTint: '#181a1c', rim: 1.0, bands: 2, grain: 0.24, grainScale: 1.0 });
  const doorGlow = makeGlowMaterial(shared, '#ffb45e', 1.85, { flicker: 0.07 });
  const winGlow = makeGlowMaterial(shared, '#ffca7c', 0.85, { flicker: 0.05 });

  const unit = box(1, 1, 1);
  const put = (items, geo, mat, ro) => {
    if (!items.length) return null;
    const m = new THREE.InstancedMesh(geo, mat, items.length);
    fillInstances(m, items); m.frustumCulled = false;
    if (ro) m.renderOrder = ro;
    group.add(m); return m;
  };

  // =========================================================================
  // The lane, running beside the line, and the fields behind the hedge
  // =========================================================================
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
    // the lane itself, wet, which is the only bright ground in the region
    const road = new THREE.Mesh(box(7, 0.4, 2700), lane);
    road.position.set(-28, 1.5, -1350); group.add(road);
    // puddles: flat panels a shade brighter, catching what light there is
    const pud = [];
    for (let i = 0; i < 160; i++) {
      const s = 0.8 + rnd() * 3.4;
      pud.push({
        pos: [-28 + (rnd() - 0.5) * 5.6, 1.72, -110 - rnd() * 2520],
        rot: [0, rnd() * 6.28, 0], scale: [s, 0.05, s * (0.5 + rnd() * 0.9)],
      });
    }
    put(pud, unit, makePaintMaterial(shared, { color: '#6c7480', shadowTint: '#2a3038', rim: 2.0, bands: 2, grain: 0.06 }));

    // hedges both sides of it, tall enough to be a corridor
    // A hedge whose top is ABOVE the eye hides everything behind it, and what
    // is behind it is the only lit thing in the region. Keep it under the seat
    // line: a lane hedge at chest height is truer anyway.
    const rows = [];
    for (let i = 0; i < 220; i++) {
      const s = 1.6 + rnd() * 0.8;
      rows.push({ pos: [-22, 1.6 + s / 2, -120 - i * 12], rot: [0, 0, 0], scale: [2.4 + rnd(), s, 13] });
      rows.push({ pos: [-34, 1.6 + s / 2, -126 - i * 12], rot: [0, 0, 0], scale: [2.4 + rnd(), s, 13] });
    }
    put(rows, unit, hedgeM);

    // bare trees over the lane — winter, and they are drawn as branches
    const bareGeo = (() => {
      const parts = [];
      const t = new THREE.CylinderGeometry(0.12, 0.28, 5, 6); t.translate(0, 2.5, 0);
      parts.push(t.toNonIndexed());
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2 + (i % 3) * 0.4;
        const l = 2.4 + (i % 4) * 0.9;
        const b = new THREE.CylinderGeometry(0.05, 0.11, l, 4);
        b.translate(0, l / 2, 0);
        b.rotateZ(0.55 + (i % 3) * 0.16);
        b.rotateY(a);
        b.translate(0, 4.4 + (i % 3) * 0.7, 0);
        parts.push(b.toNonIndexed());
      }
      return mergePN(parts);
    })();
    const trees = [];
    for (let i = 0; i < 120; i++) {
      const s = 1.6 + rnd() * 1.5;
      trees.push({
        pos: [(rnd() > 0.5 ? -20 : -36) + (rnd() - 0.5) * 4, 1.6, -140 - i * 22 - rnd() * 10],
        rot: [0, rnd() * 6.28, 0], scale: [s, s * (1 + rnd() * 0.5), s],
      });
    }
    put(trees, bareGeo, boneM);
  }

  // =========================================================================
  // The house. Every wall out of true.
  // =========================================================================
  {
    const h = new THREE.Group();
    h.position.set(-52, 1.6, -1300);
    h.rotation.y = Math.PI / 2 - 0.22;

    const lower = new THREE.Mesh(box(13, 7.5, 10), brick);
    lower.position.y = 3.75; lower.rotation.z = 0.030; h.add(lower);
    const upper = new THREE.Mesh(box(12, 6.5, 9), render);
    upper.position.set(0.7, 10.6, 0.4); upper.rotation.z = -0.055; h.add(upper);
    const attic = new THREE.Mesh(box(7, 4.5, 6), render);
    attic.position.set(-2.2, 15.9, -0.6); attic.rotation.z = 0.075; h.add(attic);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(7.4, 6.5, 4, 1), slate);
    roof.rotation.y = Math.PI / 4; roof.rotation.z = 0.06; roof.position.set(-2.2, 20.6, -0.6); h.add(roof);
    const roof2 = new THREE.Mesh(new THREE.ConeGeometry(9.6, 4.2, 4, 1), slate);
    roof2.rotation.y = Math.PI / 4; roof2.rotation.z = -0.05; roof2.position.set(0.7, 15.6, 0.4); h.add(roof2);
    const stack = new THREE.Mesh(box(2.0, 12, 1.8), brick);
    stack.position.set(5.4, 16, 2); stack.rotation.z = -0.09; h.add(stack);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 1.6, 8), brick);
    pot.position.set(5.9, 22.4, 2); h.add(pot);

    // the doorway: the one warm thing for a mile, and it is small
    const porch = new THREE.Mesh(box(2.6, 3.6, 0.5), timber);
    porch.position.set(-2.4, 1.8, 5.2); h.add(porch);
    const door = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.8), doorGlow);
    door.position.set(-2.4, 1.7, 5.48); door.renderOrder = 9; h.add(door);
    const hood = new THREE.Mesh(box(3.6, 0.35, 1.4), slate);
    hood.position.set(-2.4, 3.9, 5.7); h.add(hood);
    // and two windows, both crooked, both different sizes
    for (const [wx, wy, ww, wh, rz] of [[3.4, 4.4, 1.5, 1.9, 0.06], [1.2, 11.4, 1.1, 1.5, -0.09]]) {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), winGlow);
      w.position.set(wx, wy, wy > 8 ? 4.9 : 5.06); w.rotation.z = rz; w.renderOrder = 8; h.add(w);
      const fr = new THREE.Mesh(box(ww + 0.3, 0.14, 0.14), timber);
      fr.position.set(wx, wy, wy > 8 ? 4.94 : 5.10); h.add(fr);
    }
    group.add(h);

    // the gate and the path up to it
    const gate = new THREE.Mesh(box(0.15, 1.2, 2.6), timber);
    gate.position.set(-38, 2.4, -1300); group.add(gate);
    // one lamp on the gatepost, so there is something to walk towards
    const gp = new THREE.Mesh(box(0.24, 3.2, 0.24), timber);
    gp.position.set(-38, 3.2, -1302.6); group.add(gp);
    const gl = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), makeGlowMaterial(shared, '#ffc078', 2.0, { flicker: 0.12 }));
    gl.position.set(-38, 4.9, -1302.6); group.add(gl);
    for (let i = 0; i < 12; i++) {
      const s = new THREE.Mesh(box(2.0, 0.16, 1.5), lane);
      s.position.set(-40 - i * 1.8, 1.68, -1300 + Math.sin(i * 0.6) * 0.8); group.add(s);
    }
  }

  function update() { /* the rain is in the air, not in this file */ }

  return { group, update };
}
