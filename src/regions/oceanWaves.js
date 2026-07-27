import * as THREE from 'three';
import { box, hill, mulberry, fillInstances, mergePN } from '../world/geo.js';
import { makePaintMaterial, makeGlowMaterial } from '../world/paintMaterial.js';

// ---------------------------------------------------------------------------
// Ocean Waves — Umi ga Kikoeru, 1993.
//
// The quietest film Ghibli ever made and the smallest region on the line: a
// provincial seaside town in a heat haze, a level crossing, a sea wall, and
// a bicycle leaning where somebody left it.
//
// Nothing here is monumental, and that is the whole point — after a gorge and
// a floating island and a wall of limestone, a region whose largest object is
// a two-storey house is a rest. What carries it is the AIR: everything white
// at the edges, colour bleached out of the far distance, and the sea a flat
// bright nothing. Heat, drawn.
// ---------------------------------------------------------------------------

export function buildOceanWaves(shared) {
  const group = new THREE.Group();
  const rnd = mulberry(1993);

  const grassM = makePaintMaterial(shared, { color: '#8a9a56', shadowTint: '#333c26', rim: 0.55, bands: 3, grain: 0.22, grainScale: 0.55, sway: 0.03, translucency: 0.8 });
  const dryM = makePaintMaterial(shared, { color: '#b6ae72', shadowTint: '#4a4630', rim: 0.6, bands: 2, grain: 0.20, grainScale: 0.45, side: THREE.DoubleSide, sway: 0.14, translucency: 1.0 });
  const concrete = makePaintMaterial(shared, { color: '#a9a599', shadowTint: '#4c4b47', rim: 0.7, bands: 3, grain: 0.26, grainScale: 1.9 });
  const conGrey = makePaintMaterial(shared, { color: '#94938c', shadowTint: '#414240', rim: 0.7, bands: 3, grain: 0.28, grainScale: 1.5 });
  const plaster = makePaintMaterial(shared, { color: '#c6c0ae', shadowTint: '#4e4b45', rim: 0.8, bands: 3, grain: 0.16 });
  const plaster2 = makePaintMaterial(shared, { color: '#b1ab9b', shadowTint: '#464440', rim: 0.8, bands: 3, grain: 0.16 });
  const kawara = makePaintMaterial(shared, { color: '#5d6b72', shadowTint: '#232a30', rim: 1.0, bands: 3, grain: 0.14, side: THREE.DoubleSide });
  const timber = makePaintMaterial(shared, { color: '#7a6448', shadowTint: '#2a221c', rim: 0.85, bands: 3, grain: 0.26, grainScale: 1.5 });
  const rust = makePaintMaterial(shared, { color: '#9a5c42', shadowTint: '#33201c', rim: 0.9, bands: 3, grain: 0.24 });
  const white = makePaintMaterial(shared, { color: '#eeeae0', shadowTint: '#63625c', rim: 1.2, bands: 2, grain: 0.10 });
  const redM = makePaintMaterial(shared, { color: '#c8483a', shadowTint: '#4a1f1c', rim: 1.2, bands: 2, grain: 0.10 });
  const darkM = makePaintMaterial(shared, { color: '#3a3f42', shadowTint: '#15181c', rim: 1.0, bands: 3, grain: 0.12 });
  const vendGlow = makeGlowMaterial(shared, '#ffe6b0', 0.5, { flicker: 0.02 });

  // =========================================================================
  // Land on one side, a sea wall and the sea on the other
  // =========================================================================
  // The sea is on the WINDOW side. It is the title of the film; putting it on
  // the far side of the carriage, where a window seat can never see it, is the
  // same mistake as building a region round a house and then facing the house
  // away from the line.
  const WALL = -34;
  {
    for (let i = 0; i < 24; i++) {
      const b = new THREE.Mesh(box(1, 1, 1), grassM);
      const w = 300 + rnd() * 260;
      b.position.set(13 + w / 2, 0.5, -110 - i * 120);
      b.scale.set(w, 1.8, 120 + rnd() * 30);
      group.add(b);
    }
    for (let i = 0; i < 24; i++) {
      const b = new THREE.Mesh(box(1, 1, 1), concrete);
      b.position.set(-13 - (Math.abs(WALL) - 13) / 2, 0.6, -110 - i * 120);
      b.scale.set(Math.abs(WALL) - 13, 2.0, 120 + rnd() * 20);
      group.add(b);
    }
    // the wall itself, and the tetrapods piled against the foot of it. Nothing
    // says "a Japanese coast" faster than a heap of concrete jacks.
    // and the wall is LOW — a parapet at eye height hides the sea it is there
    // to hold back
    const w = new THREE.Mesh(box(2.0, 3.0, 2700), conGrey);
    w.position.set(WALL, 0.6, -1350); group.add(w);
    const tetra = (() => {
      const parts = [];
      for (const [ax, ay, az] of [[0, 1, 0], [0.94, -0.33, 0], [-0.47, -0.33, 0.82], [-0.47, -0.33, -0.82]]) {
        const g = new THREE.CylinderGeometry(0.18, 0.30, 1.0, 5);
        g.translate(0, 0.5, 0);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(ax, ay, az));
        g.applyQuaternion(q);
        parts.push(g.toNonIndexed());
      }
      return mergePN(parts);
    })();
    const pods = [];
    for (let i = 0; i < 700; i++) {
      const s = 2.2 + rnd() * 1.4;
      pods.push({
        pos: [WALL - 3 - Math.pow(rnd(), 1.3) * 26, 0.4 + rnd() * 1.4, -100 - rnd() * 2540],
        rot: [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28], scale: [s, s, s],
      });
    }
    const pm = new THREE.InstancedMesh(tetra, conGrey, pods.length);
    fillInstances(pm, pods); pm.frustumCulled = false; group.add(pm);

    // a low green headland a long way out, bleached almost to nothing
    // islands out to sea, bleached almost to nothing — the only thing on the
    // horizon, and what makes the water read as a bay rather than a puddle
    [[-620, -900, 300, 74], [-980, -2100, 340, 62], [1400, -1600, 500, 58]]
      .forEach(([x, z, r, h], i) => {
        const m = new THREE.Mesh(hill(r, h, 61 + i, { rough: 0.30, rings: 12, sectors: 20 }), grassM);
        m.position.set(x, -8, z); group.add(m);
      });

    // dry summer grass along the embankment, laid over
    const tuft = (() => {
      const parts = [];
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const g = new THREE.PlaneGeometry(0.07, 1.1, 1, 3).toNonIndexed();
        const p = g.attributes.position;
        for (let v = 0; v < p.count; v++) {
          const t = p.getY(v) / 1.1 + 0.5;
          p.setX(v, p.getX(v) * (1 - t * 0.8));
          p.setY(v, t * 1.1); p.setZ(v, t * t * 0.6);
        }
        g.computeVertexNormals(); g.rotateY(a); parts.push(g);
      }
      return mergePN(parts);
    })();
    const items = [];
    for (let i = 0; i < 20000; i++) {
      const side = rnd() > 0.28 ? 1 : -1;
      const s = 0.8 + rnd() * 1.3;
      items.push({
        pos: [side * (15 + Math.pow(rnd(), 1.4) * (side > 0 ? 260 : 17)), 1.6, -100 - rnd() * 2540],
        rot: [0, rnd() * 6.28, 0], scale: [s, s * (0.7 + rnd() * 0.7), s],
      });
    }
    const gm = new THREE.InstancedMesh(tuft, dryM, items.length);
    fillInstances(gm, items); gm.frustumCulled = false; group.add(gm);
  }

  // =========================================================================
  // The town: two streets of it, and then fields
  // =========================================================================
  {
    const wallsets = [[], []], mats = [plaster, plaster2];
    const roofs = [], wins = [];
    for (let i = 0; i < 150; i++) {
      const row = i % 3;
      const x = 44 + row * 46 + rnd() * 26;
      const z = -130 - rnd() * 2450;
      const w = 8 + rnd() * 6, dp = 8 + rnd() * 6, ht = 5 + rnd() * 4;
      const ry = (rnd() - 0.5) * 0.14;
      wallsets[(rnd() * 2) | 0].push({ pos: [x, ht / 2 + 1.4, z], rot: [0, ry, 0], scale: [w, ht, dp] });
      roofs.push({ pos: [x, ht + 2.6, z], rot: [0, ry, 0], scale: [(w + 2.4) / 1.42, 2.6 + rnd() * 1.2, (dp + 2.4) / 1.42] });
      if (rnd() > 0.6) wins.push({ pos: [x - w / 2 - 0.05, ht * 0.7, z], rot: [0, -Math.PI / 2, 0], scale: [2.2, 1.4, 1] });
    }
    const roofGeo = (() => {
      const g = new THREE.ConeGeometry(0.71, 1, 4, 1);
      g.rotateY(Math.PI / 4); g.translate(0, 0.5, 0);
      return g;
    })();
    const put = (items, geo, mat, ro) => {
      if (!items.length) return;
      const m = new THREE.InstancedMesh(geo, mat, items.length);
      fillInstances(m, items); m.frustumCulled = false;
      if (ro) m.renderOrder = ro;
      group.add(m);
    };
    wallsets.forEach((s, i) => put(s, box(1, 1, 1), mats[i]));
    put(roofs, roofGeo, kawara);
    put(wins, new THREE.PlaneGeometry(1, 1), makeGlowMaterial(shared, '#fff0c8', 0.16), 6);

    const poles = [], arms = [], wires = [];
    for (let i = 0; i < 46; i++) {
      const z = -110 - i * 60;
      poles.push({ pos: [-20, 6.5, z], scale: [0.30, 13, 0.30] });
      arms.push({ pos: [-20, 11.4, z], scale: [3.4, 0.2, 0.2] });
      arms.push({ pos: [-20, 10.1, z], scale: [2.6, 0.18, 0.18] });
      wires.push({ pos: [-20, 11.4, z - 30], scale: [0.07, 0.07, 60] });
      wires.push({ pos: [-20, 10.1, z - 30], scale: [0.06, 0.06, 60] });
    }
    put(poles, new THREE.CylinderGeometry(1, 1.1, 1, 6), concrete);
    put(arms, box(1, 1, 1), timber);
    put(wires, box(1, 1, 1), darkM);
  }

  // =========================================================================
  // The crossing, the station shed, the vending machine, the bicycle
  // =========================================================================
  {
    // the level crossing: two striped barriers and a black-and-yellow box
    const cross = new THREE.Group();
    cross.position.set(0, 0, -820);
    for (const s of [-1, 1]) {
      const post = new THREE.Mesh(box(0.26, 3.2, 0.26), white);
      post.position.set(s * 15, 3.0, 0); cross.add(post);
      const barrier = new THREE.Mesh(box(13, 0.22, 0.22), white);
      barrier.position.set(s * 8.6, 4.2, 0); cross.add(barrier);
      for (let i = 0; i < 4; i++) {
        const band = new THREE.Mesh(box(1.5, 0.26, 0.26), redM);
        band.position.set(s * (3.2 + i * 3.2), 4.2, 0); cross.add(band);
      }
      const lamp = new THREE.Mesh(box(1.5, 0.7, 0.3), darkM);
      lamp.position.set(s * 15, 5.0, 0); cross.add(lamp);
      for (const l of [-0.5, 0.5]) {
        const d = new THREE.Mesh(new THREE.CircleGeometry(0.24, 10), redM);
        d.position.set(s * 15 + l, 5.0, 0.18); cross.add(d);
      }
      // and the road it carries, which is what makes it a crossing
      const road = new THREE.Mesh(box(30, 0.2, 8), conGrey);
      road.position.set(s * 30, 1.6, 0); cross.add(road);
    }
    group.add(cross);

    // the station: one wooden shed with a tiled roof and nobody in it
    const st = new THREE.Group();
    st.position.set(-28, 1.4, -1300);
    const body = new THREE.Mesh(box(14, 4.4, 9), plaster);
    body.position.y = 2.2; st.add(body);
    const roof = new THREE.Mesh(box(17, 0.4, 12), kawara);
    roof.position.y = 4.7; st.add(roof);
    const ridge = new THREE.Mesh(new THREE.ConeGeometry(9, 2.2, 4, 1), kawara);
    ridge.rotation.y = Math.PI / 4; ridge.scale.set(1, 1, 0.75); ridge.position.y = 5.0; st.add(ridge);
    for (let i = 0; i < 3; i++) {
      const d = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.8), makeGlowMaterial(shared, '#f2e6c4', 0.20));
      d.position.set(-4 + i * 4, 1.9, 4.56); st.add(d);
    }
    const fence = new THREE.Mesh(box(0.12, 1.1, 40), white);
    fence.position.set(-19, 2.1, -1300); group.add(fence);
    for (let i = 0; i < 12; i++) {
      const p = new THREE.Mesh(box(0.16, 1.4, 0.16), white);
      p.position.set(-19, 2.1, -1320 + i * 3.6); group.add(p);
    }
    group.add(st);

    // a vending machine — the one lit thing in a region with no night
    const vend = new THREE.Mesh(box(1.2, 2.0, 0.8), redM);
    vend.position.set(-21, 2.4, -1272); group.add(vend);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.5), vendGlow);
    face.position.set(-20.58, 2.5, -1272); face.rotation.y = Math.PI / 2; group.add(face);

    // the bicycle, leaning on the fence where it was left
    const bike = new THREE.Group();
    bike.position.set(-18.2, 1.4, -1290);
    bike.rotation.set(0, 0.2, -0.16);
    for (const wz of [-0.62, 0.62]) {
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.035, 5, 14), darkM);
      wheel.position.set(0, 0.34, wz); bike.add(wheel);
    }
    const frame = new THREE.Mesh(box(0.05, 0.05, 1.15), darkM);
    frame.position.set(0, 0.62, 0); frame.rotation.x = 0.12; bike.add(frame);
    const seatPost = new THREE.Mesh(box(0.05, 0.42, 0.05), darkM);
    seatPost.position.set(0, 0.72, -0.34); bike.add(seatPost);
    const seat = new THREE.Mesh(box(0.12, 0.06, 0.30), darkM);
    seat.position.set(0, 0.94, -0.36); bike.add(seat);
    const bars = new THREE.Mesh(box(0.42, 0.04, 0.04), darkM);
    bars.position.set(0, 0.92, 0.52); bike.add(bars);
    const basket = new THREE.Mesh(box(0.30, 0.24, 0.34), rust);
    basket.position.set(0, 0.80, 0.62); bike.add(basket);
    group.add(bike);
  }

  // ---- sunflowers along the fence, because it is the middle of August ----
  {
    const flower = (() => {
      const parts = [];
      const stem = new THREE.CylinderGeometry(0.03, 0.045, 1.5, 4); stem.translate(0, 0.75, 0);
      parts.push(stem.toNonIndexed());
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const p = new THREE.PlaneGeometry(0.30, 0.52).toNonIndexed();
        p.translate(0, 0.24, 0); p.rotateX(-0.5); p.rotateY(a);
        p.translate(Math.sin(a) * 0.03, 1.5, Math.cos(a) * 0.03);
        parts.push(p);
      }
      return mergePN(parts);
    })();
    const petal = makePaintMaterial(shared, {
      color: '#e8bf3e', shadowTint: '#6a5320', rim: 1.2, bands: 2, grain: 0.10,
      side: THREE.DoubleSide, sway: 0.16, translucency: 1.4,
    });
    const items = [];
    for (let i = 0; i < 900; i++) {
      const s = 1.5 + rnd() * 1.1;
      items.push({
        pos: [22 + Math.pow(rnd(), 1.6) * 90, 1.5, -140 - rnd() * 2440],
        rot: [0, rnd() * 6.28, 0], scale: [s, s * (0.85 + rnd() * 0.5), s],
      });
    }
    const m = new THREE.InstancedMesh(flower, petal, items.length);
    fillInstances(m, items); m.frustumCulled = false; group.add(m);
  }

  function update() { /* nothing here moves, and that is deliberate */ }

  return { group, update };
}
