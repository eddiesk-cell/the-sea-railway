import * as THREE from 'three';
import { box, hill, mulberry, fillInstances, mergePN } from '../world/geo.js';
import { makePaintMaterial, makeGlowMaterial } from '../world/paintMaterial.js';

// ---------------------------------------------------------------------------
// Hort Town — Tales from Earthsea, 2006.
//
// A walled port baking in the afternoon, and a tower out on the water that
// nobody goes to.
//
// Everything here is one colour — ochre — and the region works or fails on
// whether the eye can find three different values of it: the wall lit, the
// wall shadowed, and the dust between. Flat roofs, square towers, small deep
// windows, and a great deal of nothing. The one cool note in the whole place
// is the sea, and the one dark note is the tower.
// ---------------------------------------------------------------------------

export function buildHortTown(shared) {
  const group = new THREE.Group();
  const rnd = mulberry(2006);

  const dust = makePaintMaterial(shared, { color: '#a08a60', shadowTint: '#40382c', rim: 0.6, bands: 3, grain: 0.28, grainScale: 1.0 });
  const wallA = makePaintMaterial(shared, { color: '#c4a878', shadowTint: '#4e4130', rim: 0.75, bands: 3, grain: 0.22, grainScale: 1.1 });
  const wallB = makePaintMaterial(shared, { color: '#ad9165', shadowTint: '#443828', rim: 0.75, bands: 3, grain: 0.24, grainScale: 0.9 });
  const wallC = makePaintMaterial(shared, { color: '#8f7852', shadowTint: '#3a2f22', rim: 0.75, bands: 3, grain: 0.24, grainScale: 1.2 });
  const roofM = makePaintMaterial(shared, { color: '#96794f', shadowTint: '#3a2e20', rim: 0.8, bands: 3, grain: 0.22 });
  const towerM = makePaintMaterial(shared, { color: '#4a4740', shadowTint: '#17161a', rim: 1.0, bands: 3, grain: 0.20, grainScale: 1.0 });
  const timber = makePaintMaterial(shared, { color: '#6b5334', shadowTint: '#241c14', rim: 0.85, bands: 3, grain: 0.26, grainScale: 1.5 });
  const sailM = makePaintMaterial(shared, {
    color: '#d9cdae', shadowTint: '#544c40', rim: 1.1, bands: 2, grain: 0.12,
    side: THREE.DoubleSide, sway: 0.16, translucency: 1.2,
  });
  const scrub = makePaintMaterial(shared, { color: '#75773f', shadowTint: '#2b2c1a', rim: 0.55, bands: 3, grain: 0.24, grainScale: 0.4, sway: 0.05, translucency: 0.6 });
  const winGlow = makeGlowMaterial(shared, '#f6c877', 0.22);

  const unit = box(1, 1, 1);
  const put = (items, geo, mat, ro) => {
    if (!items.length) return null;
    const m = new THREE.InstancedMesh(geo, mat, items.length);
    fillInstances(m, items); m.frustumCulled = false;
    if (ro) m.renderOrder = ro;
    group.add(m); return m;
  };

  // =========================================================================
  // Water along the near side, the walled town out of the far shore of it
  // =========================================================================
  const QUAY = -26, FAR = -168;
  {
    for (let i = 0; i < 24; i++) {
      const b = new THREE.Mesh(unit, dust);
      b.position.set(-13 - (Math.abs(QUAY) - 13) / 2, 0.7, -110 - i * 120);
      b.scale.set(Math.abs(QUAY) - 13, 2.2, 120 + rnd() * 20);
      group.add(b);
      const g = new THREE.Mesh(unit, dust);
      const w = 260 + rnd() * 320;
      g.position.set(13 + w / 2, 0.5, -110 - i * 120);
      g.scale.set(w, 1.8, 120 + rnd() * 30);
      group.add(g);
    }
    const lip = new THREE.Mesh(box(1.4, 1.8, 2700), wallC);
    lip.position.set(QUAY, 0.7, -1350); group.add(lip);

    for (let i = 0; i < 24; i++) {
      const b = new THREE.Mesh(unit, dust);
      b.position.set(FAR - 160, 1.0, -110 - i * 122);
      b.scale.set(320, 3.4, 122 + rnd() * 26);
      group.add(b);
    }
    [[-560, -700, 300, 96], [-680, -1900, 340, 118]].forEach(([x, z, r, h], i) => {
      const m = new THREE.Mesh(hill(r, h, 45 + i, { rough: 0.34, rings: 12, sectors: 20 }), wallC);
      m.position.set(x, -8, z); group.add(m);
    });
  }

  // =========================================================================
  // The wall, and the town stacked behind it
  // =========================================================================
  {
    // the sea wall of the town: a long face with square towers on it
    const face = new THREE.Mesh(box(6, 17, 2700), wallB);
    face.position.set(FAR - 3, 9, -1350); group.add(face);
    const crenel = [], towers = [];
    for (let i = 0; i < 300; i++) {
      crenel.push({ pos: [FAR - 3, 18.4, -110 - i * 9], scale: [7, 2.2, 4.6] });
    }
    put(crenel, unit, wallA);
    for (let i = 0; i < 14; i++) {
      const z = -140 - i * 190 - rnd() * 40;
      const t = new THREE.Mesh(box(13, 26 + rnd() * 8, 13), wallA);
      t.position.set(FAR - 6, 13 + rnd() * 4, z); group.add(t);
      const cap = new THREE.Mesh(box(15, 1.6, 15), roofM);
      cap.position.set(FAR - 6, 27 + rnd() * 6, z); group.add(cap);
    }

    // the town behind it: flat roofs, stepping up, all one colour
    const wallsets = [[], [], []], mats = [wallA, wallB, wallC];
    const roofs = [], wins = [];
    for (let i = 0; i < 1500; i++) {
      const x = FAR - 20 - Math.pow(rnd(), 0.7) * 420;
      const z = -110 - rnd() * 2520;
      const w = 9 + rnd() * 12, dp = 9 + rnd() * 12;
      const ht = 7 + rnd() * 16;
      const ry = (rnd() - 0.5) * 0.30;
      wallsets[(rnd() * 3) | 0].push({ pos: [x, 2 + ht / 2, z], rot: [0, ry, 0], scale: [w, ht, dp] });
      roofs.push({ pos: [x, 2 + ht + 0.4, z], rot: [0, ry, 0], scale: [w + 1.4, 0.8, dp + 1.4] });
      if (rnd() > 0.55) {
        wins.push({
          pos: [x + Math.cos(ry) * (dp / 2 + 0.05), 2 + ht * 0.6, z - Math.sin(ry) * (dp / 2 + 0.05)],
          rot: [0, ry + Math.PI / 2, 0], scale: [1.3, 2.0, 1],
        });
      }
    }
    wallsets.forEach((s, i) => put(s, unit, mats[i]));
    put(roofs, unit, roofM);
    put(wins, new THREE.PlaneGeometry(1, 1), winGlow, 6);

    // a dome and two minaret-ish shafts, so the skyline is not all boxes
    const dome = new THREE.Mesh(new THREE.SphereGeometry(15, 16, 9, 0, 6.28, 0, 1.57), roofM);
    dome.position.set(FAR - 130, 30, -1290); group.add(dome);
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 12, 16), wallA);
    drum.position.set(FAR - 130, 24, -1290); group.add(drum);
    for (const [dx, dz] of [[-70, -70], [-210, 180]]) {
      const sh = new THREE.Mesh(new THREE.CylinderGeometry(4, 5, 46, 10), wallA);
      sh.position.set(FAR - 130 + dx, 25, -1290 + dz); group.add(sh);
      const cp = new THREE.Mesh(new THREE.ConeGeometry(6, 9, 10, 1), roofM);
      cp.position.set(FAR - 130 + dx, 52, -1290 + dz); group.add(cp);
    }
  }

  // =========================================================================
  // The tower on its island: dark, far out, and the only cold thing here
  // =========================================================================
  {
    const isle = new THREE.Mesh(hill(74, 34, 29, { rough: 0.5, rings: 10, sectors: 16 }), wallC);
    isle.position.set(-320, -8, -1980); group.add(isle);
    const t = new THREE.Mesh(new THREE.CylinderGeometry(11, 15, 84, 12), towerM);
    t.position.set(-320, 62, -1980); group.add(t);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(15, 12, 9, 12), towerM);
    crown.position.set(-320, 106, -1980); group.add(crown);
    const spike = new THREE.Mesh(new THREE.ConeGeometry(9, 20, 12, 1), towerM);
    spike.position.set(-320, 120, -1980); group.add(spike);
    const slit = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 7), makeGlowMaterial(shared, '#8fd0e8', 0.9, { flicker: 0.10 }));
    slit.position.set(-309.2, 84, -1980); slit.rotation.y = Math.PI / 2; slit.renderOrder = 8; group.add(slit);
  }

  // ---- two lateen-rigged boats, and dry scrub along the near shore ----
  const boats = [];
  {
    for (const [bx, bz, sc] of [[-84, -1180, 1.0], [-120, -2050, 1.3]]) {
      const b = new THREE.Group();
      b.position.set(bx, 0, bz);
      b.scale.setScalar(sc);
      const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 6, 0, 6.28, 0, 1.57), timber);
      hull.scale.set(3.4, 2.2, 12); hull.rotation.z = Math.PI; hull.position.y = 2.2;
      b.add(hull);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.42, 20, 7), timber);
      mast.position.y = 11; mast.rotation.x = 0.12; b.add(mast);
      const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 22, 6), timber);
      yard.position.set(0, 15, 1); yard.rotation.z = 0.1; yard.rotation.x = -0.9; b.add(yard);
      const sail = new THREE.Mesh(new THREE.PlaneGeometry(15, 17), sailM);
      sail.position.set(0.4, 10.5, 1.5); sail.rotation.set(0, 0.18, 0.16); b.add(sail);
      group.add(b); boats.push(b);
    }
    const tufts = [];
    for (let i = 0; i < 2400; i++) {
      const s = 1.0 + rnd() * 2.2;
      tufts.push({
        pos: [-14 - rnd() * 11, 1.6, -100 - rnd() * 2540],
        rot: [0, rnd() * 6.28, 0], scale: [s, s * 0.6, s],
      });
    }
    put(tufts, new THREE.IcosahedronGeometry(1, 0), scrub);
  }

  function update(t) {
    boats.forEach((b, i) => {
      b.position.y = Math.sin(t * 0.5 + i * 2) * 0.28;
      b.rotation.z = Math.sin(t * 0.42 + i) * 0.026;
      b.rotation.y = 0.3 + Math.sin(t * 0.11 + i) * 0.18;
    });
  }
  update(0);

  return { group, update };
}
