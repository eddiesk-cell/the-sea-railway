import * as THREE from 'three';
import { box, hill, mulberry, fillInstances, mergePN } from '../world/geo.js';
import { makePaintMaterial, makeGlowMaterial } from '../world/paintMaterial.js';

// ---------------------------------------------------------------------------
// The Hidden Cove — Porco Rosso, 1992.
//
// Limestone, and a hole in it full of the Adriatic. The only region on the
// line lit by a sun directly overhead, which is a decision and not laziness:
// Porco is the one Ghibli film with no dusk in it anywhere. Everything is
// midday, hard shadows, white rock, and a sea so bright it hurts.
//
// The cove has to be ENCLOSED or it is just a beach. Headlands close it at
// both ends and the wall runs the length of the far side, so wherever you are
// standing there is rock across the water in front of you. And one red
// aeroplane sitting on it, which is the only saturated thing for a mile.
// ---------------------------------------------------------------------------

export function buildHiddenCove(shared) {
  const group = new THREE.Group();
  const rnd = mulberry(1992);

  // wrap high: a cliff face turned away from a near-vertical sun still has to
  // read as pale rock, not as a grey wall
  const limestone = makePaintMaterial(shared, { color: '#c3bba1', shadowTint: '#8b8370', rim: 0.9, bands: 3, grain: 0.22, grainScale: 1.3, wrap: 0.66 });
  const limeDark = makePaintMaterial(shared, { color: '#a89d84', shadowTint: '#6d6553', rim: 0.9, bands: 3, grain: 0.26, grainScale: 1.0, wrap: 0.60 });
  const scrub = makePaintMaterial(shared, { color: '#5a6640', shadowTint: '#2b3122', rim: 0.6, bands: 3, grain: 0.24, grainScale: 0.5, sway: 0.05, translucency: 0.6 });
  const sandM = makePaintMaterial(shared, { color: '#c0b492', shadowTint: '#7d7159', rim: 1.0, bands: 2, grain: 0.20, grainScale: 1.6 });
  const pineM = makePaintMaterial(shared, { color: '#3f5c3a', shadowTint: '#15200f', rim: 0.6, bands: 3, grain: 0.22, grainScale: 0.4, sway: 0.04, translucency: 0.7 });
  const trunkM = makePaintMaterial(shared, { color: '#6a5540', shadowTint: '#241c18', rim: 0.8, bands: 3, grain: 0.26, grainScale: 1.6 });
  const crimson = makePaintMaterial(shared, { color: '#b8322c', shadowTint: '#3f1418', rim: 1.3, bands: 3, grain: 0.10 });
  const crimsonD = makePaintMaterial(shared, { color: '#8f231f', shadowTint: '#320f12', rim: 1.2, bands: 3, grain: 0.10 });
  const metal = makePaintMaterial(shared, { color: '#a5a19a', shadowTint: '#4c4a48', rim: 1.4, bands: 3, grain: 0.08 });
  const canvasM = makePaintMaterial(shared, { color: '#c6c1b0', shadowTint: '#6a6558', rim: 1.1, bands: 2, grain: 0.10, side: THREE.DoubleSide });
  const stripe = makePaintMaterial(shared, { color: '#cf5f4e', shadowTint: '#553330', rim: 1.1, bands: 2, grain: 0.10, side: THREE.DoubleSide });
  const foamM = makeGlowMaterial(shared, '#e8f4f6', 0.5, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });

  // =========================================================================
  // The shore, and the water where no shore was laid
  // =========================================================================
  // A cove is NARROW. Four hundred metres of water seen from a seat three and
  // a half metres up is a two-degree white line between two bands of sand —
  // the whole Adriatic reduced to a scratch. At a hundred and fifty it is
  // water you are travelling beside.
  const SHORE = -30;                 // the cove starts here
  const FAR_SHORE = -230;            // and the far beach begins here
  {
    // near strip: sand, low, so the eye goes straight over it to the water
    for (let i = 0; i < 24; i++) {
      const b = new THREE.Mesh(box(1, 1, 1), sandM);
      const w = 12 + rnd() * 6;
      b.position.set(-13 - w / 2, 0.4, -110 - i * 120);
      b.scale.set(w, 1.4, 120 + rnd() * 30);
      group.add(b);
    }
    // +x: rock shelf running up into low crags, which closes that side
    for (let i = 0; i < 22; i++) {
      const b = new THREE.Mesh(box(1, 1, 1), limeDark);
      const w = 180 + rnd() * 260;
      b.position.set(13 + w / 2, 0.7, -120 - i * 126);
      b.scale.set(w, 2.6, 126 + rnd() * 30);
      group.add(b);
    }
    const crags = [];
    for (let i = 0; i < 60; i++) {
      const s = 14 + rnd() * 30;
      crags.push({
        pos: [96 + Math.pow(rnd(), 0.7) * 420, -2, -110 - rnd() * 2500],
        rot: [0, rnd() * 6.28, (rnd() - 0.5) * 0.12],
        scale: [s * (0.7 + rnd() * 0.8), s * (0.9 + rnd() * 1.5), s * (0.7 + rnd() * 0.8)],
      });
    }
    const cm = new THREE.InstancedMesh(hill(1, 1, 9, { rough: 0.5, rings: 8, sectors: 12 }), limeDark, crags.length);
    fillInstances(cm, crags); cm.frustumCulled = false; group.add(cm);

    // the far beach, and the wall standing straight out of it
    for (let i = 0; i < 24; i++) {
      const b = new THREE.Mesh(box(1, 1, 1), sandM);
      b.position.set(FAR_SHORE - 16, 0.4, -110 - i * 120);
      b.scale.set(32, 1.4, 120 + rnd() * 26);
      group.add(b);
    }
  }

  // =========================================================================
  // The wall. Vertical, white, and taller than anything has any right to be.
  // =========================================================================
  {
    const slabs = [];
    for (let i = 0; i < 150; i++) {
      const w = 30 + rnd() * 60;
      const h = 60 + Math.pow(rnd(), 1.4) * 110;
      slabs.push({
        pos: [-268 - Math.pow(rnd(), 1.6) * 300, h / 2 - 6, -100 - rnd() * 2560],
        rot: [0, (rnd() - 0.5) * 0.5, (rnd() - 0.5) * 0.05],
        scale: [w, h, w * (0.7 + rnd() * 0.9)],
      });
    }
    const m = new THREE.InstancedMesh(box(1, 1, 1), limestone, slabs.length);
    fillInstances(m, slabs); m.frustumCulled = false; group.add(m);

    // Lumps on top of every slab. A stack of boxes has a SQUARE top, and forty
    // square tops in a row is a skyline of office blocks — the one silhouette
    // limestone never has.
    const caps = slabs.map(sl => ({
      pos: [sl.pos[0], sl.pos[1] + sl.scale[1] * 0.44, sl.pos[2]],
      rot: [0, rnd() * 6.28, 0],
      scale: [sl.scale[0] * (0.55 + rnd() * 0.45), sl.scale[1] * (0.10 + rnd() * 0.22), sl.scale[2] * (0.55 + rnd() * 0.45)],
    }));
    const cm2 = new THREE.InstancedMesh(hill(1, 1, 17, { rough: 0.55, rings: 8, sectors: 12 }), limestone, caps.length);
    fillInstances(cm2, caps); cm2.frustumCulled = false; group.add(cm2);

    // the two headlands that shut the cove at each end. Without these the
    // water runs off the sides of the frame and it stops being a cove.
    [[-380, -230, 250, 150], [-410, -2420, 280, 170]].forEach(([x, z, r, h], i) => {
      const hm = new THREE.Mesh(hill(r, h, 33 + i, { rough: 0.44, rings: 14, sectors: 22 }), limestone);
      hm.position.set(x, -10, z); group.add(hm);
      const cap = new THREE.Mesh(hill(r * 0.55, h * 0.5, 55 + i, { rough: 0.5, rings: 10, sectors: 16 }), limeDark);
      cap.position.set(x + 60, h * 0.55, z + 30); group.add(cap);
    });

    // scrub in the cracks, and umbrella pines along the top — flat-topped,
    // which is the one silhouette that says Mediterranean and not Japan
    // Scrub goes on the LEDGES — on top of a slab, at its own height. Scattered
    // through the volume of the cliff it simply hangs in the air in front of
    // the rock, which is what the first pass did: three hundred bushes flying.
    const bush = slabs.filter(() => rnd() > 0.45).map(sl => {
      const b = 3 + rnd() * 6;
      return {
        pos: [sl.pos[0] + sl.scale[0] * 0.45, sl.pos[1] + sl.scale[1] * 0.48, sl.pos[2] + (rnd() - 0.5) * sl.scale[2]],
        rot: [0, rnd() * 6.28, 0], scale: [b, b * 0.6, b],
      };
    });
    const bm = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), scrub, bush.length);
    fillInstances(bm, bush); bm.frustumCulled = false; group.add(bm);

    const pineGeo = (() => {
      const parts = [];
      const t = new THREE.CylinderGeometry(0.08, 0.15, 3.6, 5); t.translate(0, 1.8, 0);
      parts.push(t.toNonIndexed());
      for (let i = 0; i < 4; i++) {
        const c = new THREE.SphereGeometry(1, 8, 5, 0, 6.28, 0, 1.3);
        c.scale(0.46 - i * 0.05, 0.26, 0.46 - i * 0.05);
        c.translate(((i % 3) - 1) * 0.30, 3.5 + (i % 2) * 0.22, ((i * 5) % 3 - 1) * 0.26);
        parts.push(c.toNonIndexed());
      }
      return mergePN(parts);
    })();
    // and the pines stand on the tops, where a pine on a cliff actually stands
    const pines = slabs.filter(() => rnd() > 0.55).map(sl => {
      const s = 5 + rnd() * 6;
      return {
        pos: [sl.pos[0] - sl.scale[0] * (rnd() - 0.5) * 0.6, sl.pos[1] + sl.scale[1] * 0.5, sl.pos[2] + (rnd() - 0.5) * sl.scale[2] * 0.7],
        rot: [0, rnd() * 6.28, 0], scale: [s, s * (0.9 + rnd() * 0.5), s],
      };
    });
    const pm = new THREE.InstancedMesh(pineGeo, pineM, pines.length);
    fillInstances(pm, pines); pm.frustumCulled = false; group.add(pm);
    const trunks = pines.map(p => ({ pos: [p.pos[0], p.pos[1] - 2, p.pos[2]], scale: [p.scale[0] * 0.1, p.scale[1] * 0.5, p.scale[0] * 0.1] }));
    const tm = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1.4, 1, 5), trunkM, trunks.length);
    fillInstances(tm, trunks); tm.frustumCulled = false; group.add(tm);
  }

  // ---- rocks and dry scrub along the near sand ----
  {
    const rocks = [], tufts = [];
    for (let i = 0; i < 420; i++) {
      const s2 = 0.8 + Math.pow(rnd(), 1.6) * 4.5;
      rocks.push({
        pos: [-15 - rnd() * 16, 0.9, -100 - rnd() * 2540],
        rot: [0, rnd() * 6.28, (rnd() - 0.5) * 0.3], scale: [s2, s2 * 0.7, s2 * (0.7 + rnd() * 0.7)],
      });
    }
    for (let i = 0; i < 1600; i++) {
      const s2 = 0.7 + rnd() * 1.4;
      tufts.push({
        pos: [-14 - rnd() * 17, 1.3, -100 - rnd() * 2540],
        rot: [0, rnd() * 6.28, 0], scale: [s2, s2 * 0.55, s2],
      });
    }
    const rm = new THREE.InstancedMesh(hill(1, 1, 5, { rough: 0.6, rings: 6, sectors: 9 }), limeDark, rocks.length);
    fillInstances(rm, rocks); rm.frustumCulled = false; group.add(rm);
    const tm2 = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), scrub, tufts.length);
    fillInstances(tm2, tufts); tm2.frustumCulled = false; group.add(tm2);
  }

  // =========================================================================
  // The awning on the near sand: somebody lives here, and it is not a resort
  // =========================================================================
  {
    const a = new THREE.Group();
    a.position.set(-22, 1.4, -1180);
    for (let i = 0; i < 4; i++) {
      const p = new THREE.Mesh(box(0.22, 4.4, 0.22), trunkM);
      p.position.set((i % 2 ? 4 : -4), 2.2, (i < 2 ? -5 : 5)); a.add(p);
    }
    for (let i = 0; i < 7; i++) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 1.5), i % 2 ? stripe : canvasM);
      s.rotation.x = -Math.PI / 2; s.position.set(0, 4.4 + Math.sin(i * 0.9) * 0.12, -5.2 + i * 1.55);
      a.add(s);
    }
    for (const [cx, cz, ry] of [[-1.6, 1.2, 0.5], [1.8, -1.0, -0.9]]) {
      const c = new THREE.Group();
      c.position.set(cx, 0, cz); c.rotation.y = ry;
      const seat = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.4), stripe);
      seat.rotation.x = -1.15; seat.position.y = 0.75; c.add(seat);
      for (const s of [-1, 1]) {
        const leg = new THREE.Mesh(box(0.08, 1.4, 0.08), trunkM);
        leg.position.set(s * 0.7, 0.7, -0.8); c.add(leg);
      }
      a.add(c);
    }
    // a jetty of planks running out over the shallows
    for (let i = 0; i < 16; i++) {
      const pl = new THREE.Mesh(box(3.2, 0.2, 1.1), trunkM);
      pl.position.set(-30 - i * 1.3, 1.5, -1206); a.add(pl);
    }
    group.add(a);
  }

  // =========================================================================
  // The aeroplane. One saturated thing, and it moves.
  // =========================================================================
  const plane = new THREE.Group();
  const wake = new THREE.Group();
  {
    const hull = new THREE.Mesh(new THREE.CapsuleGeometry(1.5, 9, 5, 10), crimson);
    hull.rotation.x = Math.PI / 2; hull.position.y = 1.6; plane.add(hull);
    // the step in the hull that makes a flying boat a flying boat
    const step = new THREE.Mesh(box(3.0, 1.1, 5.0), crimsonD);
    step.position.set(0, 0.6, 0.6); plane.add(step);
    const wing = new THREE.Mesh(box(19, 0.5, 3.1), crimson);
    wing.position.set(0, 4.0, 0.4); plane.add(wing);
    const lower = new THREE.Mesh(box(15, 0.4, 2.4), crimsonD);
    lower.position.set(0, 1.9, 1.4); plane.add(lower);
    for (const s of [-1, 1]) {
      const strut = new THREE.Mesh(box(0.16, 2.2, 0.16), metal);
      strut.position.set(s * 5.4, 3.0, 0.9); plane.add(strut);
      const float = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 2.6, 4, 7), crimsonD);
      float.rotation.x = Math.PI / 2; float.position.set(s * 7.6, 1.0, 0.8); plane.add(float);
    }
    const cowl = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.05, 2.0, 10), metal);
    cowl.rotation.x = Math.PI / 2; cowl.position.set(0, 4.6, -1.6); plane.add(cowl);
    const fin = new THREE.Mesh(box(0.3, 3.0, 2.6), crimson);
    fin.position.set(0, 3.4, 5.6); plane.add(fin);
    const tail = new THREE.Mesh(box(5.4, 0.3, 1.6), crimson);
    tail.position.set(0, 2.6, 5.8); plane.add(tail);
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.05, 9, 6), metal);
    canopy.scale.set(1, 0.7, 1.5); canopy.position.set(0, 3.1, 1.0); plane.add(canopy);
    const prop = new THREE.Mesh(box(0.22, 5.6, 0.10), metal);
    prop.position.set(0, 4.6, -2.7); plane.add(prop);
    plane.userData.prop = prop;
    group.add(plane);

    // the wake: two shallow wedges of foam behind it, which is what actually
    // tells you it is moving on water rather than parked on it
    for (const s of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 26), foamM);
      w.rotation.x = -Math.PI / 2; w.rotation.z = s * 0.10;
      w.position.set(s * 2.4, 0.16, 14);
      wake.add(w);
    }
    wake.renderOrder = 12;
    group.add(wake);
  }

  function update(t) {
    // it taxis the length of the cove and turns at the ends, slowly, the way
    // a heavy seaplane actually moves on water
    const span = 2200;
    const u = (t * 9) % (span * 2);
    const back = u > span;
    const z = -220 - (back ? span * 2 - u : u);
    plane.position.set(-88 + Math.sin(t * 0.11) * 12, 0, z);
    plane.rotation.y = back ? Math.PI : 0;
    plane.rotation.z = Math.sin(t * 0.7) * 0.03;
    plane.userData.prop.rotation.z = t * 26;
    wake.position.copy(plane.position);
    wake.rotation.y = plane.rotation.y;
  }
  update(0);

  return { group, update };
}
