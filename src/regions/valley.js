import * as THREE from 'three';
import { box, hill, mulberry, fillInstances } from '../world/geo.js';
import { makePaintMaterial, makeGlowMaterial } from '../world/paintMaterial.js';

// ---------------------------------------------------------------------------
// The Valley of the Wind — Nausicaä, 1984.
//
// The only place on the line where the weather is the reason anyone can live
// there: a sea wind off the plain, blowing hard and without stopping, keeping
// the spores of the forest from settling. Ochre dust, dry grass laid flat, and
// windmills turning — every single one of them, always, because the day the
// wind drops is the day the valley dies.
//
// At the far edge, the forest: pale, soft, wrong, and lit from inside.
// ---------------------------------------------------------------------------

export function buildValley(shared) {
  const group = new THREE.Group();
  const rnd = mulberry(1984);

  const dust = makePaintMaterial(shared, { color: '#8a7148', shadowTint: '#3a2e28', rim: 0.6, bands: 3, grain: 0.26, grainScale: 0.7 });
  const dustD = makePaintMaterial(shared, { color: '#6e5b3c', shadowTint: '#2c2420', rim: 0.6, bands: 3, grain: 0.28, grainScale: 0.6 });
  const dry = makePaintMaterial(shared, { color: '#c2a765', shadowTint: '#5a4a2c', rim: 0.7, bands: 2, grain: 0.2, grainScale: 0.4,
    side: THREE.DoubleSide, sway: 0.16, translucency: 0.5 });
  const timber = makePaintMaterial(shared, { color: '#6b563e', shadowTint: '#241d1e', rim: 0.8, bands: 3, grain: 0.26, grainScale: 1.6 });
  const canvasM = makePaintMaterial(shared, { color: '#ddd2b6', shadowTint: '#5c5346', rim: 1.0, bands: 3, grain: 0.14, side: THREE.DoubleSide });
  const stoneM = makePaintMaterial(shared, { color: '#948a72', shadowTint: '#3a352e', rim: 0.6, bands: 3, grain: 0.22 });
  const sporeM = makePaintMaterial(shared, { color: '#b9c6cf', shadowTint: '#4e5a68', rim: 1.2, bands: 3, grain: 0.16 });
  const capM = makePaintMaterial(shared, { color: '#a4b6c6', shadowTint: '#414f62', rim: 1.4, bands: 3, grain: 0.14,
    emissive: '#7fd8e8', emissiveStrength: 0.28 });

  // =========================================================================
  // The plain
  // =========================================================================
  for (const side of [-1, 1]) {
    for (let i = 0; i < 22; i++) {
      const b = new THREE.Mesh(box(1, 1, 1), i % 3 ? dust : dustD);
      const w = 260 + rnd() * 380;
      b.position.set(side * (13 + w / 2), 0.3 + rnd() * 0.5, -130 - i * 138);
      b.scale.set(w, 2.4, 138 + rnd() * 40);
      b.rotation.y = (rnd() - 0.5) * 0.04;
      group.add(b);
    }
  }
  [[-1300, -1900, 520, 190], [1150, -2400, 600, 230], [-2100, -2900, 700, 280]]
    .forEach(([x, z, r, h], i) => {
      const m = new THREE.Mesh(hill(r, h, 51 + i, { rough: 0.5, rings: 14, sectors: 22 }), dustD);
      m.position.set(x, -22, z); group.add(m);
    });

  // ---- dry grass, lying over in the wind ----
  {
    const tuft = (() => {
      const parts = [];
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + (i % 3) * 0.3;
        const len = 1.0 + (i % 4) * 0.22;
        const g = new THREE.PlaneGeometry(0.07, len, 1, 3).toNonIndexed();
        const p = g.attributes.position;
        for (let v = 0; v < p.count; v++) {
          const t = p.getY(v) / len + 0.5;
          p.setX(v, p.getX(v) * (1 - t * 0.9));
          p.setY(v, t * len);
          p.setZ(v, t * t * len * 0.75);
        }
        g.computeVertexNormals(); g.rotateY(a);
        parts.push(g);
      }
      return mergePN(parts);
    })();
    const items = [];
    for (let i = 0; i < 24000; i++) {
      const side = rnd() > 0.5 ? 1 : -1;
      const s = 0.9 + rnd() * 1.5;
      items.push({
        pos: [side * (15 + Math.pow(rnd(), 0.7) * 420), 1.5, -120 - rnd() * 2900],
        rot: [0, rnd() * 6.28, 0], scale: [s, s * (0.7 + rnd() * 0.7), s],
      });
    }
    const m = new THREE.InstancedMesh(tuft, dry, items.length);
    fillInstances(m, items); m.frustumCulled = false; group.add(m);
  }

  // =========================================================================
  // The windmills
  // =========================================================================
  const mills = [];
  {
    const bladeGeo = (() => {
      const parts = [];
      // a spar with a sail laced along it — four of them, offset
      const spar = new THREE.CylinderGeometry(0.16, 0.22, 15, 5);
      spar.translate(0, 7.5, 0);
      parts.push(spar.toNonIndexed());
      const sail = new THREE.PlaneGeometry(2.6, 11).toNonIndexed();
      sail.translate(1.5, 8.2, 0.16);
      parts.push(sail);
      return mergePN(parts);
    })();

    for (let i = 0; i < 9; i++) {
      const side = i % 2 ? 1 : -1;
      const x = side * (58 + rnd() * 190);
      const z = -220 - i * 300 - rnd() * 120;
      const g = new THREE.Group();
      g.position.set(x, 1.5, z);
      g.rotation.y = 1.57 + (rnd() - 0.5) * 0.4;

      const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 4.6, 22, 8), stoneM);
      tower.position.y = 11; g.add(tower);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(3.4, 10, 6, 0, 6.28, 0, 1.57), timber);
      cap.position.y = 22.4; g.add(cap);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 5, 6), timber);
      shaft.rotation.x = Math.PI / 2; shaft.position.set(0, 22, 2.6); g.add(shaft);

      const rotor = new THREE.Group();
      rotor.position.set(0, 22, 4.6);
      for (let b = 0; b < 4; b++) {
        const arm = new THREE.Mesh(bladeGeo, b % 2 ? canvasM : timber);
        arm.rotation.z = (b / 4) * Math.PI * 2;
        rotor.add(arm);
      }
      g.add(rotor);
      group.add(g);
      mills.push({ rotor, sp: 0.9 + rnd() * 0.5 });
    }
  }

  // ---- a few houses dug into the ground, which is how you live in a gale ----
  for (let i = 0; i < 14; i++) {
    const side = i % 2 ? 1 : -1;
    const x = side * (110 + rnd() * 200), z = -300 - rnd() * 2400;
    const h = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6, 0, 6.28, 0, 1.57), stoneM);
    h.scale.set(7 + rnd() * 4, 4.5 + rnd() * 2, 8 + rnd() * 4);
    h.position.set(x, 1.5, z); group.add(h);
    const door = new THREE.Mesh(box(2.4, 3.0, 0.3), timber);
    door.position.set(x, 2.7, z + 8); group.add(door);
  }

  // =========================================================================
  // The forest edge: pale, soft, and lit from inside
  // =========================================================================
  {
    const stalks = [], caps = [];
    for (let i = 0; i < 260; i++) {
      const side = rnd() > 0.5 ? 1 : -1;
      const x = side * (420 + rnd() * 420);
      const z = -400 - rnd() * 2500;
      const h = 16 + rnd() * 30;
      stalks.push({ pos: [x, 1.4 + h / 2, z], rot: [0, rnd() * 6.28, 0], scale: [h * 0.10, h, h * 0.10] });
      caps.push({ pos: [x, 1.4 + h, z], rot: [(rnd() - 0.5) * 0.2, rnd() * 6.28, (rnd() - 0.5) * 0.2], scale: [h * 0.46, h * 0.24, h * 0.46] });
    }
    const sm = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1.4, 1, 6), sporeM, stalks.length);
    fillInstances(sm, stalks); sm.frustumCulled = false; group.add(sm);
    const cm = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 6, 0, 6.28, 0, 1.7), capM, caps.length);
    fillInstances(cm, caps); cm.frustumCulled = false; group.add(cm);
  }

  // ---- spores drifting off it, downwind ----
  const spores = [];
  for (let i = 0; i < 220; i++) {
    spores.push({
      x: (rnd() - 0.5) * 1400, y: 6 + rnd() * 70, z: -200 - rnd() * 2700,
      ph: rnd() * 6.28, s: 0.5 + rnd() * 1.5, sp: 0.6 + rnd() * 0.9,
    });
  }
  const sporeGlow = makeGlowMaterial(shared, '#bff0f4', 1.0, {
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, flicker: 0.3,
  });
  const sporeMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 5), sporeGlow, spores.length);
  sporeMesh.frustumCulled = false; sporeMesh.renderOrder = 18; group.add(sporeMesh);

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3();

  function update(t) {
    mills.forEach(m => { m.rotor.rotation.z = t * m.sp; });
    spores.forEach((c, i) => {
      const drift = (t * 12 * c.sp) % 1800;
      pv.set(
        c.x + drift - 900,
        c.y + Math.sin(t * 0.6 + c.ph) * 5,
        c.z + Math.sin(t * 0.31 + c.ph * 2) * 20,
      );
      const s = c.s * (0.7 + 0.3 * Math.sin(t * 1.9 + c.ph * 4));
      sv.set(s, s, s);
      m4.compose(pv, q, sv);
      sporeMesh.setMatrixAt(i, m4);
    });
    sporeMesh.instanceMatrix.needsUpdate = true;
  }
  update(0);

  return { group, update };
}

function mergePN(list) {
  let vc = 0;
  const parts = list.map(g => { const s = g.index ? g.toNonIndexed() : g; vc += s.attributes.position.count; if (s !== g) g.dispose(); return s; });
  const pos = new Float32Array(vc * 3), nrm = new Float32Array(vc * 3);
  let o = 0;
  parts.forEach(g => {
    pos.set(g.attributes.position.array, o * 3);
    nrm.set(g.attributes.normal.array, o * 3);
    o += g.attributes.position.count; g.dispose();
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  return out;
}
