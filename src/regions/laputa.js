import * as THREE from 'three';
import { box, mulberry, fillInstances } from '../world/geo.js';
import { makePaintMaterial, makeGlowMaterial } from '../world/paintMaterial.js';
import { camphor } from '../world/camphor.js';

// ---------------------------------------------------------------------------
// Laputa — Castle in the Sky, 1986.
//
// An island with nothing under it. The shape everybody remembers is not the
// ruins on top but the ROOT: a cone of rock hanging beneath, trailing vines,
// tapering to a point that ends in air. The garden on top has gone back to
// grass, the walls have gone back to moss, and one tree the size of a hill has
// grown up through the middle of it all and held the whole thing together.
//
// Storm light: the sun is somewhere above the cloud deck, so everything under
// it is lit from a direction that makes no sense — which is exactly right.
// ---------------------------------------------------------------------------

export function buildLaputa(shared) {
  const group = new THREE.Group();
  const rnd = mulberry(1986);

  const rock = makePaintMaterial(shared, { color: '#6b6558', shadowTint: '#252a30', rim: 0.9, bands: 3, grain: 0.26, grainScale: 0.4 });
  const rockD = makePaintMaterial(shared, { color: '#4c4a44', shadowTint: '#1a1d24', rim: 0.8, bands: 3, grain: 0.28, grainScale: 0.3 });
  const turf = makePaintMaterial(shared, { color: '#5c8148', shadowTint: '#22392c', rim: 0.6, bands: 3, grain: 0.2, grainScale: 0.4 });
  const mossM = makePaintMaterial(shared, { color: '#7d9060', shadowTint: '#2f3c30', rim: 0.7, bands: 3, grain: 0.22 });
  const stoneM = makePaintMaterial(shared, { color: '#a8a294', shadowTint: '#3e4048', rim: 0.9, bands: 3, grain: 0.2 });
  const bark = makePaintMaterial(shared, { color: '#4a4034', shadowTint: '#191a22', rim: 0.7, bands: 3, grain: 0.28, grainScale: 0.5 });
  const leafM = makePaintMaterial(shared, { color: '#4e7742', shadowTint: '#1b3026', rim: 0.7, bands: 3, grain: 0.2, grainScale: 0.22,
    sway: 0.028, translucency: 0.9 });
  const vineM = makePaintMaterial(shared, { color: '#54683e', shadowTint: '#1d2a24', rim: 0.6, bands: 2, grain: 0.24,
    side: THREE.DoubleSide, sway: 0.10, translucency: 0.8 });
  const coreM = makeGlowMaterial(shared, '#9fe8ff', 1.5, { flicker: 0.12 });

  const CX = -980, CY = 168, CZ = -1500;

  // =========================================================================
  // The root: the thing that makes it float rather than sit
  // =========================================================================
  {
    const prof = [];
    const R = 190;
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      // wide and flat at the rim, then a long taper to a point in the air
      const r = R * Math.pow(1 - t, 0.42) * (1 - t * 0.05);
      prof.push(new THREE.Vector2(Math.max(r, 0.5), -t * 300));
    }
    const g = new THREE.LatheGeometry(prof, 18);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const a = Math.atan2(z, x);
      const n = 1
        + Math.sin(a * 5 + y * 0.02) * 0.10
        + Math.sin(a * 11 - y * 0.05) * 0.05
        + Math.sin(a * 23 + y * 0.09) * 0.025;
      p.setXYZ(i, x * n, y, z * n);
    }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, rockD);
    m.position.set(CX, CY, CZ);
    group.add(m);

    // the rim, and the sod on top of it
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.02, R * 0.98, 26, 18, 1), rock);
    rim.position.set(CX, CY + 13, CZ); group.add(rim);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.99, R * 1.02, 10, 18, 1), turf);
    top.position.set(CX, CY + 29, CZ); group.add(top);
  }

  // ---- vines trailing off the underside ----
  {
    const strand = (() => {
      const g = new THREE.PlaneGeometry(1.6, 1, 1, 6).toNonIndexed();
      const p = g.attributes.position;
      for (let v = 0; v < p.count; v++) {
        const t = -(p.getY(v) - 0.5);
        p.setY(v, -t);
        p.setX(v, p.getX(v) * (1 - t * 0.7));
        p.setZ(v, Math.sin(t * 4) * 0.12);
      }
      g.computeVertexNormals();
      return g;
    })();
    const items = [];
    for (let i = 0; i < 340; i++) {
      const a = rnd() * Math.PI * 2;
      const t = Math.pow(rnd(), 0.6);
      const r = 190 * Math.pow(1 - t, 0.42) * (0.96 + rnd() * 0.1);
      const len = 30 + rnd() * 120;
      items.push({
        pos: [CX + Math.cos(a) * r, CY - t * 300, CZ + Math.sin(a) * r],
        rot: [0, a + Math.PI / 2, 0],
        scale: [2 + rnd() * 5, len, 1],
      });
    }
    const m = new THREE.InstancedMesh(strand, vineM, items.length);
    fillInstances(m, items); m.frustumCulled = false; group.add(m);
  }

  // =========================================================================
  // The garden: ruined walls, a courtyard, and the tree through the middle
  // =========================================================================
  {
    // walls, broken and gone back to moss
    const items = [], caps = [];
    for (let i = 0; i < 90; i++) {
      const a = rnd() * Math.PI * 2;
      const r = 40 + Math.pow(rnd(), 0.6) * 140;
      const h = 4 + rnd() * 13;
      const w = 6 + rnd() * 22;
      items.push({
        pos: [CX + Math.cos(a) * r, CY + 34 + h / 2, CZ + Math.sin(a) * r],
        rot: [0, a + 1.57 + (rnd() - 0.5) * 0.7, 0], scale: [w, h, 2.4 + rnd() * 2],
      });
      if (rnd() > 0.5) {
        caps.push({
          pos: [CX + Math.cos(a) * r, CY + 34 + h + 0.5, CZ + Math.sin(a) * r],
          rot: [0, a + 1.57, 0], scale: [w * 0.9, 1.0, 3.4],
        });
      }
    }
    const unit = box(1, 1, 1);
    const wm = new THREE.InstancedMesh(unit, stoneM, items.length);
    fillInstances(wm, items); wm.frustumCulled = false; group.add(wm);
    const cm = new THREE.InstancedMesh(unit, mossM, caps.length);
    fillInstances(cm, caps); cm.frustumCulled = false; group.add(cm);

    // the dome at the centre, and the core still lit inside it
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 9, 0, 6.28, 0, 1.4), stoneM);
    dome.scale.set(34, 22, 34);
    dome.position.set(CX, CY + 34, CZ);
    group.add(dome);
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(6, 0), coreM);
    core.position.set(CX, CY + 48, CZ);
    group.add(core);
    var coreMesh = core;
  }

  // ---- the tree ----
  {
    const { bark: bg, leaf: lg } = camphor(31, { spread: 1.3 });
    const H = 210;
    const t1 = new THREE.Mesh(bg, bark);
    t1.scale.setScalar(H); t1.position.set(CX + 20, CY + 36, CZ - 14);
    group.add(t1);
    const t2 = new THREE.Mesh(lg, leafM);
    t2.scale.setScalar(H); t2.position.set(CX + 20, CY + 36, CZ - 14);
    group.add(t2);
  }

  // =========================================================================
  // The cloud deck it sits above, and the storm underneath
  // =========================================================================
  {
    const cloudM = makePaintMaterial(shared, {
      color: '#c9ccc8', shadowTint: '#5d6068', rim: 0.5, bands: 2, grain: 0.22, grainScale: 0.18,
      transparent: true, opacity: 0.72, depthWrite: false,
    });
    const items = [];
    for (let i = 0; i < 260; i++) {
      const s = 60 + rnd() * 220;
      items.push({
        pos: [(rnd() - 0.5) * 4200, 18 + rnd() * 55, -200 - rnd() * 2800],
        rot: [rnd() * 0.4, rnd() * 6.28, rnd() * 0.4],
        scale: [s, s * (0.24 + rnd() * 0.2), s * (0.7 + rnd() * 0.6)],
      });
    }
    const m = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), cloudM, items.length);
    fillInstances(m, items); m.frustumCulled = false; m.renderOrder = 8; group.add(m);
  }

  // ---- a pair of smaller stones, so it does not read as the only one ----
  for (let i = 0; i < 3; i++) {
    const s = 0.16 + rnd() * 0.14;
    const x = CX + (rnd() - 0.5) * 2600, y = 150 + rnd() * 220, z = -600 - rnd() * 2200;
    const prof = [];
    for (let k = 0; k <= 12; k++) {
      const t = k / 12;
      prof.push(new THREE.Vector2(Math.max(190 * Math.pow(1 - t, 0.42) * s, 0.4), -t * 300 * s));
    }
    const g = new THREE.LatheGeometry(prof, 12);
    const m = new THREE.Mesh(g, rockD);
    m.position.set(x, y, z); group.add(m);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(192 * s, 188 * s, 14 * s, 12), turf);
    cap.position.set(x, y + 7 * s, z); group.add(cap);
  }

  function update(t) {
    coreMesh.rotation.set(t * 0.22, t * 0.31, 0);
  }
  update(0);

  return { group, update };
}
