import * as THREE from 'three';
import { box, mulberry, fillInstances } from '../world/geo.js';
import { makePaintMaterial, makeGlowMaterial } from '../world/paintMaterial.js';

// ---------------------------------------------------------------------------
// The Cedar Forest — Princess Mononoke, 1997.
//
// Trunks like columns, going up out of the frame with no branches for forty
// metres, and a canopy so complete that what light arrives has been through
// leaves twice. The floor is stone and moss and shallow water; the air is
// standing mist; and there are lights among the trunks that do not belong to
// anything you can see.
//
// The rule that makes it work: NOTHING here is at eye level. Everything is
// either underfoot or far above, and the space between is empty, which is why
// a forest this size feels like a room.
// ---------------------------------------------------------------------------

export function buildCedarForest(shared) {
  const group = new THREE.Group();
  const rnd = mulberry(1997);

  const bark = makePaintMaterial(shared, { color: '#463a30', shadowTint: '#131a18', rim: 0.55, bands: 3, grain: 0.30, grainScale: 0.9 });
  const bark2 = makePaintMaterial(shared, { color: '#3a352c', shadowTint: '#0f1614', rim: 0.5, bands: 3, grain: 0.30, grainScale: 1.1 });
  const canopy = makePaintMaterial(shared, { color: '#2e4a2c', shadowTint: '#0d1c18', rim: 0.6, bands: 3, grain: 0.22, grainScale: 0.4, sway: 0.022, translucency: 1.1 });
  const moss = makePaintMaterial(shared, { color: '#3f5c33', shadowTint: '#13221a', rim: 0.5, bands: 3, grain: 0.26, grainScale: 0.7 });
  const rockM = makePaintMaterial(shared, { color: '#5b6156', shadowTint: '#1c2220', rim: 0.7, bands: 3, grain: 0.26, grainScale: 1.0 });
  const fernM = makePaintMaterial(shared, { color: '#4a6b39', shadowTint: '#15251c', rim: 0.5, bands: 2, grain: 0.2, grainScale: 0.5,
    side: THREE.DoubleSide, sway: 0.05, translucency: 1.2 });

  // =========================================================================
  // The floor: raised ground either side of a channel, so the world's own
  // water becomes a river running beside the line without a drop of new code.
  // =========================================================================
  {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 22; i++) {
        const b = new THREE.Mesh(box(1, 1, 1), moss);
        const w = 150 + rnd() * 260;
        b.position.set(side * (30 + w / 2 + rnd() * 20), 0.3 + rnd() * 0.4, -120 - i * 118);
        b.scale.set(w, 2.4, 118 + rnd() * 40);
        b.rotation.y = (rnd() - 0.5) * 0.05;
        group.add(b);
      }
    }
    // boulders standing in the shallows — the river has to break on something
    const items = [];
    for (let i = 0; i < 420; i++) {
      const side = rnd() > 0.5 ? 1 : -1;
      const s = 0.7 + Math.pow(rnd(), 2) * 4.2;
      items.push({
        pos: [side * (9 + rnd() * 48), 0.1 + s * 0.2, -100 - rnd() * 2400],
        rot: [rnd() * 0.5, rnd() * 6.28, rnd() * 0.5],
        scale: [s * (1 + rnd() * 0.7), s * (0.6 + rnd() * 0.4), s * (1 + rnd() * 0.7)],
      });
    }
    const bm = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), rockM, items.length);
    fillInstances(bm, items); bm.frustumCulled = false; group.add(bm);
  }

  // =========================================================================
  // The cedars
  // =========================================================================
  {
    // a trunk is a plain tapered column — the drama is entirely in the scale
    const trunkGeo = new THREE.CylinderGeometry(0.55, 1.0, 1, 7, 1);
    trunkGeo.translate(0, 0.5, 0);
    const crownGeo = (() => {
      const parts = [];
      for (let i = 0; i < 5; i++) {
        const g = new THREE.IcosahedronGeometry(1, 1);
        const p = g.attributes.position;
        for (let v = 0; v < p.count; v++) {
          const n = 0.7 + ((v * 17 + i * 41) % 19) / 34;
          p.setXYZ(v, p.getX(v) * n, p.getY(v) * n * 0.72, p.getZ(v) * n);
        }
        g.computeVertexNormals();
        const s = 0.42 + (i % 3) * 0.14;
        g.scale(s, s, s);
        g.translate((i - 2) * 0.28, 0.1 + (i % 2) * 0.22, ((i * 7) % 5 - 2) * 0.24);
        parts.push(g);
      }
      return mergePN(parts);
    })();

    const trunks = [[], []], crowns = [];
    for (let i = 0; i < 780; i++) {
      const side = rnd() > 0.5 ? 1 : -1;
      const x = side * (16 + Math.pow(rnd(), 0.6) * 420);
      const z = -80 - rnd() * 2450;
      const h = 44 + rnd() * 54;
      const r = h * (0.028 + rnd() * 0.016);
      const ry = rnd() * 6.28;
      trunks[(rnd() * 2) | 0].push({
        pos: [x, 1.4, z], rot: [(rnd() - 0.5) * 0.05, ry, (rnd() - 0.5) * 0.05], scale: [r, h, r],
      });
      crowns.push({
        pos: [x, 1.4 + h * 0.80, z], rot: [0, ry, 0],
        scale: [h * 0.50, h * 0.40, h * 0.50],
      });
    }
    trunks.forEach((items, i) => {
      if (!items.length) return;
      const m = new THREE.InstancedMesh(trunkGeo, i ? bark : bark2, items.length);
      fillInstances(m, items); m.frustumCulled = false; group.add(m);
    });
    const cm = new THREE.InstancedMesh(crownGeo, canopy, crowns.length);
    fillInstances(cm, crowns); cm.frustumCulled = false; group.add(cm);
  }

  // =========================================================================
  // Ferns, low and everywhere — the only thing at knee height
  // =========================================================================
  {
    const frond = (() => {
      const parts = [];
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + (i % 3) * 0.2;
        const len = 0.8 + (i % 4) * 0.16;
        const g = new THREE.PlaneGeometry(0.13, len, 1, 4).toNonIndexed();
        const p = g.attributes.position;
        for (let v = 0; v < p.count; v++) {
          const t = p.getY(v) / len + 0.5;
          p.setX(v, p.getX(v) * (1 - t * 0.55) * (t < 0.12 ? t * 8 : 1));
          p.setY(v, t * len * 0.9);
          p.setZ(v, t * t * len * 0.5);
        }
        g.computeVertexNormals();
        g.rotateY(a);
        parts.push(g);
      }
      return mergePN(parts);
    })();
    const items = [];
    for (let i = 0; i < 5200; i++) {
      const side = rnd() > 0.5 ? 1 : -1;
      const s = 1.1 + rnd() * 1.7;
      items.push({
        pos: [side * (14 + Math.pow(rnd(), 0.7) * 300), 1.5, -80 - rnd() * 2450],
        rot: [0, rnd() * 6.28, 0], scale: [s, s * (0.8 + rnd() * 0.5), s],
      });
    }
    const fm = new THREE.InstancedMesh(frond, fernM, items.length);
    fillInstances(fm, items); fm.frustumCulled = false; group.add(fm);
  }

  // =========================================================================
  // Lights among the trunks that do not belong to anything you can see
  // =========================================================================
  const motes = [];
  for (let i = 0; i < 130; i++) {
    motes.push({
      x: (rnd() - 0.5) * 460, y: 5 + rnd() * 26, z: -100 - rnd() * 2200,
      ph: rnd() * 6.28, r: 3 + rnd() * 9, sp: 0.2 + rnd() * 0.5, s: 0.5 + rnd() * 0.8,
    });
  }
  const moteMat = makeGlowMaterial(shared, '#cfe8d0', 1.35, {
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, flicker: 0.35,
  });
  const moteMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 5), moteMat, motes.length);
  moteMesh.frustumCulled = false; moteMesh.renderOrder = 18; group.add(moteMesh);

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3();
  function update(t) {
    motes.forEach((c, i) => {
      pv.set(
        c.x + Math.cos(t * c.sp + c.ph) * c.r,
        c.y + Math.sin(t * c.sp * 0.7 + c.ph * 1.7) * 2.4,
        c.z + Math.sin(t * c.sp * 0.8 + c.ph) * c.r,
      );
      const s = c.s * (0.75 + 0.25 * Math.sin(t * 2.1 + c.ph * 3));
      sv.set(s, s, s);
      m4.compose(pv, q, sv);
      moteMesh.setMatrixAt(i, m4);
    });
    moteMesh.instanceMatrix.needsUpdate = true;
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
