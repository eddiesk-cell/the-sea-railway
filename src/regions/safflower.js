import * as THREE from 'three';
import { box, hill, mulberry, fillInstances, mergePN } from '../world/geo.js';
import { makePaintMaterial, makeGlowMaterial } from '../world/paintMaterial.js';

// ---------------------------------------------------------------------------
// Safflower Fields — Only Yesterday, 1991.
//
// Terraced farmland at first light, and the safflower out.
//
// The terrace lesson from the Slag Ravine holds here and it is the whole
// build: tiers have to STEP BACK as they rise. A retaining wall forty metres
// from the window is a fence across the glass with everything hidden behind
// it; the same wall at a hundred, with the next one at a hundred and sixty,
// reads as a hillside farmed in steps — which is the only thing this region
// has to say.
// ---------------------------------------------------------------------------

export function buildSafflower(shared) {
  const group = new THREE.Group();
  const rnd = mulberry(1991);

  const soil = makePaintMaterial(shared, { color: '#6a5a44', shadowTint: '#2a231f', rim: 0.6, bands: 3, grain: 0.26, grainScale: 0.9 });
  const turf = makePaintMaterial(shared, { color: '#6f8348', shadowTint: '#293219', rim: 0.55, bands: 3, grain: 0.22, grainScale: 0.55, sway: 0.02, translucency: 0.7 });
  const wallM = makePaintMaterial(shared, { color: '#8b8272', shadowTint: '#37332f', rim: 0.7, bands: 3, grain: 0.28, grainScale: 1.6 });
  const thatch = makePaintMaterial(shared, { color: '#7d6b45', shadowTint: '#2e2820', rim: 0.9, bands: 3, grain: 0.30, grainScale: 0.8, side: THREE.DoubleSide });
  const plank = makePaintMaterial(shared, { color: '#4f4132', shadowTint: '#1c1715', rim: 0.8, bands: 3, grain: 0.26, grainScale: 1.6 });
  const paleWall = makePaintMaterial(shared, { color: '#c2b7a0', shadowTint: '#494440', rim: 0.8, bands: 3, grain: 0.18 });
  const leafM = makePaintMaterial(shared, {
    color: '#556a33', shadowTint: '#1e2716', rim: 0.6, bands: 2, grain: 0.2, grainScale: 0.4,
    side: THREE.DoubleSide, sway: 0.14, translucency: 1.0,
  });
  const flowerM = makePaintMaterial(shared, {
    color: '#e07a26', shadowTint: '#5c2e12', rim: 1.3, bands: 2, grain: 0.10,
    side: THREE.DoubleSide, sway: 0.16, translucency: 1.6,
  });
  const flowerM2 = makePaintMaterial(shared, {
    color: '#d4a92e', shadowTint: '#553f16', rim: 1.3, bands: 2, grain: 0.10,
    side: THREE.DoubleSide, sway: 0.16, translucency: 1.6,
  });
  const winGlow = makeGlowMaterial(shared, '#ffdfa4', 0.34, { flicker: 0.03 });

  const unit = box(1, 1, 1);
  const put = (items, geo, mat, ro) => {
    if (!items.length) return null;
    const m = new THREE.InstancedMesh(geo, mat, items.length);
    fillInstances(m, items); m.frustumCulled = false;
    if (ro) m.renderOrder = ro;
    group.add(m); return m;
  };

  // =========================================================================
  // The terraces. Four of them, each further back than the one below it.
  // =========================================================================
  const TIERS = [
    { y: 3.2, x: -46, w: 54 },
    { y: 9.0, x: -104, w: 60 },
    { y: 16.0, x: -172, w: 66 },
    { y: 24.0, x: -250, w: 80 },
    { y: 33.0, x: -340, w: 96 },
  ];
  {
    for (let i = 0; i < 24; i++) {
      const b = new THREE.Mesh(unit, turf);
      b.position.set(-13 - 16, 0.6, -110 - i * 120);
      b.scale.set(32, 2.0, 120 + rnd() * 30);
      group.add(b);
    }
    for (let i = 0; i < 22; i++) {
      const b = new THREE.Mesh(unit, turf);
      const w = 200 + rnd() * 260;
      b.position.set(13 + w / 2, 0.5, -120 - i * 126);
      b.scale.set(w, 1.8, 126 + rnd() * 30);
      group.add(b);
    }
    TIERS.forEach((t, k) => {
      // the shelf itself
      const deck = new THREE.Mesh(unit, soil);
      deck.position.set(t.x - t.w / 2, t.y / 2, -1350);
      deck.scale.set(t.w, t.y, 2700);
      group.add(deck);
      // the dry-stone face holding it up
      const face = new THREE.Mesh(unit, wallM);
      face.position.set(t.x + 0.9, t.y / 2, -1350);
      face.scale.set(2.2, t.y, 2700);
      group.add(face);
      // and a grass lip along the top, so the step is not a bare edge
      const lip = new THREE.Mesh(unit, turf);
      lip.position.set(t.x - 3.4, t.y + 0.25, -1350);
      lip.scale.set(7, 0.6, 2700);
      group.add(lip);
      if (k === TIERS.length - 1) {
        const back = new THREE.Mesh(hill(420, 130, 61, { rough: 0.3, rings: 14, sectors: 22 }), turf);
        back.position.set(t.x - 400, -6, -1350); group.add(back);
      }
    });
  }

  // =========================================================================
  // The safflower. Rows, following the terrace, because a crop is planted.
  // =========================================================================
  {
    const plant = (() => {
      const parts = [];
      const stem = new THREE.CylinderGeometry(0.03, 0.05, 1.1, 4); stem.translate(0, 0.55, 0);
      parts.push(stem.toNonIndexed());
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const l = new THREE.PlaneGeometry(0.16, 0.36).toNonIndexed();
        l.rotateX(-0.7); l.rotateY(a); l.translate(Math.sin(a) * 0.1, 0.35 + (i % 2) * 0.24, Math.cos(a) * 0.1);
        parts.push(l);
      }
      return mergePN(parts);
    })();
    const head = (() => {
      const parts = [];
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const p = new THREE.PlaneGeometry(0.20, 0.24).toNonIndexed();
        p.rotateX(-0.35); p.rotateY(a); p.translate(Math.sin(a) * 0.07, 0, Math.cos(a) * 0.07);
        parts.push(p);
      }
      return mergePN(parts);
    })();

    const leaves = [], headsA = [], headsB = [];
    TIERS.forEach((t) => {
      const rows = Math.floor(t.w / 3.2);
      for (let r = 0; r < rows; r++) {
        const x = t.x - 4 - r * 3.2;
        if (x < t.x - t.w + 4) break;
        for (let i = 0; i < 300; i++) {
          const z = -110 - rnd() * 2500;
          const s = 1.5 + rnd() * 0.9;
          const jx = x + (rnd() - 0.5) * 1.6;
          leaves.push({ pos: [jx, t.y + 0.5, z], rot: [0, rnd() * 6.28, 0], scale: [s, s, s] });
          (rnd() > 0.45 ? headsA : headsB).push({
            pos: [jx, t.y + 0.5 + s * 1.08, z], rot: [0, rnd() * 6.28, 0], scale: [s, s, s],
          });
        }
      }
    });
    put(leaves, plant, leafM);
    put(headsA, head, flowerM);
    put(headsB, head, flowerM2);
  }

  // =========================================================================
  // The farm: one house with a thatched roof, a shed, and a persimmon
  // =========================================================================
  {
    const f = new THREE.Group();
    f.position.set(-96, TIERS[1].y, -1300);
    f.rotation.y = Math.PI / 2 - 0.24;         // broadside to the line
    const body = new THREE.Mesh(box(11, 5.4, 22), paleWall);
    body.position.y = 2.7; f.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(13.5, 7.5, 4, 1), thatch);
    roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 1.5); roof.position.y = 6.4; f.add(roof);
    const veranda = new THREE.Mesh(box(2.6, 0.3, 18), plank);
    veranda.position.set(6.6, 1.6, 0); f.add(veranda);
    for (let i = 0; i < 6; i++) {
      const p = new THREE.Mesh(box(0.22, 3.6, 0.22), plank);
      p.position.set(7.6, 3.2, -8 + i * 3.2); f.add(p);
    }
    for (let i = 0; i < 5; i++) {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.0), winGlow);
      w.position.set(5.56, 3.0, -7 + i * 3.5); w.rotation.y = Math.PI / 2; f.add(w);
    }
    const shed = new THREE.Mesh(box(7, 4, 9), plank);
    shed.position.set(-14, 2, 12); f.add(shed);
    const shedRoof = new THREE.Mesh(box(9, 0.4, 11), thatch);
    shedRoof.position.set(-14, 4.3, 12); f.add(shedRoof);
    group.add(f);

    // a persimmon by the house, and a windbreak of cedars behind the farm
    const clump = (() => {
      const parts = [];
      for (let i = 0; i < 3; i++) {
        const g = new THREE.IcosahedronGeometry(1, 0);
        const q = g.attributes.position;
        for (let v = 0; v < q.count; v++) {
          const n = 0.76 + ((v * 7 + i * 19) % 12) / 28;
          q.setXYZ(v, q.getX(v) * n, q.getY(v) * n * 0.9, q.getZ(v) * n);
        }
        g.computeVertexNormals();
        const sc = 0.5 + (i % 3) * 0.13;
        g.scale(sc, sc, sc);
        g.translate((i - 1) * 0.4, 0.5 + (i % 2) * 0.24, ((i * 5) % 3 - 1) * 0.34);
        parts.push(g.toNonIndexed());
      }
      return mergePN(parts);
    })();
    const treeM = makePaintMaterial(shared, {
      color: '#4b6431', shadowTint: '#182312', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.35,
      sway: 0.03, translucency: 0.6,
    });
    const items = [], trunks = [];
    for (let i = 0; i < 700; i++) {
      const t = TIERS[2 + ((rnd() * 3) | 0)] || TIERS[4];
      const x = t.x - 8 - rnd() * (t.w - 12);
      const z = -110 - rnd() * 2500;
      const s = 3.5 + rnd() * 6;
      items.push({ pos: [x, t.y + 0.4, z], rot: [0, rnd() * 6.28, 0], scale: [s, s * (1 + rnd() * 0.6), s] });
      trunks.push({ pos: [x, t.y + 0.4, z], scale: [s * 0.10, s * 0.9, s * 0.10] });
    }
    put(items, clump, treeM);
    put(trunks, new THREE.CylinderGeometry(1, 1.3, 1, 5), plank);
  }

  function update() { /* a field at dawn does not need to move */ }

  return { group, update };
}
