import * as THREE from 'three';
import { box, hill, mulberry, fillInstances, mergePN, hillSampler } from '../world/geo.js';
import { makePaintMaterial, makeGlowMaterial } from '../world/paintMaterial.js';

// ---------------------------------------------------------------------------
// Market Chipping — Howl's Moving Castle, 2004.
//
// The other half of Howl's world, and nothing like the meadow: a European hill
// town of tall narrow houses leaning over a street too steep for them, a hat
// shop at the bottom, bunting across the gaps, and a tram.
//
// The thing that makes it Market Chipping and not any European town: the
// houses are TALL AND THIN — four and five storeys on a nine-metre frontage —
// and they lean. Ghibli draws the whole street slightly out of true, and the
// wrongness is the charm. A row of squared-off blocks is Zurich.
// ---------------------------------------------------------------------------

export function buildMarketChipping(shared) {
  const group = new THREE.Group();
  const rnd = mulberry(2004 * 7);

  const plasterA = makePaintMaterial(shared, { color: '#e0d2b4', shadowTint: '#5b5148', rim: 0.7, bands: 3, grain: 0.18 });
  const plasterB = makePaintMaterial(shared, { color: '#cbb492', shadowTint: '#4e443e', rim: 0.7, bands: 3, grain: 0.20 });
  const plasterC = makePaintMaterial(shared, { color: '#b9c4bd', shadowTint: '#42484c', rim: 0.7, bands: 3, grain: 0.18 });
  const plasterD = makePaintMaterial(shared, { color: '#d8a98e', shadowTint: '#553c3c', rim: 0.7, bands: 3, grain: 0.18 });
  const beam = makePaintMaterial(shared, { color: '#5a4632', shadowTint: '#1e1817', rim: 0.9, bands: 3, grain: 0.28, grainScale: 1.4 });
  const tile = makePaintMaterial(shared, { color: '#9a5340', shadowTint: '#331c22', rim: 0.9, bands: 3, grain: 0.16, side: THREE.DoubleSide });
  const tile2 = makePaintMaterial(shared, { color: '#6b6a63', shadowTint: '#26272c', rim: 0.9, bands: 3, grain: 0.16, side: THREE.DoubleSide });
  const cobble = makePaintMaterial(shared, { color: '#8b8378', shadowTint: '#333138', rim: 0.6, bands: 3, grain: 0.30, grainScale: 2.2 });
  const grassM = makePaintMaterial(shared, { color: '#6d8a44', shadowTint: '#26361f', rim: 0.5, bands: 3, grain: 0.2, grainScale: 0.5, sway: 0.02, translucency: 0.7 });
  const brass = makePaintMaterial(shared, { color: '#c9a25a', shadowTint: '#4c3a26', rim: 1.3, bands: 3, grain: 0.1 });
  const glassM = makeGlowMaterial(shared, '#ffd9a0', 0.34, { flicker: 0.05 });

  // =========================================================================
  // The hill, and the street cut into it
  // =========================================================================
  // The hill has to stand clear of the line. Centred at -360 with a radius of
  // 400 its near edge lands ON the track, and the train spends the whole
  // region running through the inside of it — which is what a bald pale plane
  // filling the window actually is.
  const HX = -760, HZ = -1350, HR = 400, HH = 150;
  const hillSurf = hillSampler(HR, HH, 23, { rough: 0.12 });
  const groundAt = (x, z) => {
    const s = hillSurf(x - HX, z - HZ);
    return s === null ? 0 : -8 + s;
  };
  {
    const h = new THREE.Mesh(hill(HR, HH, 23, { rough: 0.12, rings: 18, sectors: 26 }), grassM);
    h.position.set(HX, -8, HZ);
    group.add(h);
    // the pasture either side of the line, because the town sits in farmland
    for (const side of [-1, 1]) {
      for (let i = 0; i < 20; i++) {
        const b = new THREE.Mesh(box(1, 1, 1), grassM);
        const w = 200 + rnd() * 300;
        b.position.set(side * (14 + w / 2), 0.3 + rnd() * 0.4, -120 - i * 132);
        b.scale.set(w, 2.4, 132 + rnd() * 30);
        group.add(b);
      }
    }
    // and the hedges that divide it. Bare ground is the emptiest thing a
    // window can hold; farmland is only farmland once it has been cut up.
    const hedge = makePaintMaterial(shared, {
      color: '#43602f', shadowTint: '#16220f', rim: 0.5, bands: 3, grain: 0.30, grainScale: 0.4,
      sway: 0.03, translucency: 0.6,
    });
    const rows = [];
    for (let i = 0; i < 130; i++) {
      const side = rnd() > 0.5 ? 1 : -1;
      const x = side * (26 + Math.pow(rnd(), 0.9) * 420);
      const z = -130 - rnd() * 2500;
      const along = rnd() > 0.5;
      const len = 70 + rnd() * 190;
      rows.push({
        pos: [x, 2.6, z], rot: [0, along ? 0 : 1.5708, 0],
        scale: [2.6 + rnd() * 1.6, 2.6 + rnd() * 1.4, len],
      });
    }
    const hm = new THREE.InstancedMesh(box(1, 1, 1), hedge, rows.length);
    fillInstances(hm, rows); hm.frustumCulled = false; group.add(hm);

    // a couple of dry-stone walls, and the sheep that go with them
    const walls = [];
    for (let i = 0; i < 40; i++) {
      const side = rnd() > 0.5 ? 1 : -1;
      walls.push({
        pos: [side * (30 + rnd() * 400), 2.2, -140 - rnd() * 2400],
        rot: [0, rnd() > 0.5 ? 0 : 1.5708, 0], scale: [1.1, 1.8, 60 + rnd() * 140],
      });
    }
    const wm = new THREE.InstancedMesh(box(1, 1, 1), cobble, walls.length);
    fillInstances(wm, walls); wm.frustumCulled = false; group.add(wm);
  }

  // =========================================================================
  // The town. Tall, thin, leaning, and jammed shoulder to shoulder.
  // =========================================================================
  const facades = [];
  {
    const wallsets = [[], [], [], []];
    const mats = [plasterA, plasterB, plasterC, plasterD];
    const roofsA = [], roofsB = [], beams = [], sills = [];

    // laid in streets that ring the hill, so the roofs step up in courses
    for (let ring = 0; ring < 7; ring++) {
      const rr = 340 - ring * 44;
      const n = Math.max(10, Math.round(rr * 0.20));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + ring * 0.31 + rnd() * 0.02;
        const x = HX + Math.cos(a) * rr, z = HZ + Math.sin(a) * rr;
        const y = groundAt(x, z) - 2;
        if (y < 0) continue;
        // tall and narrow: the whole silhouette of the town is this ratio
        const w = 8 + rnd() * 5, dp = 9 + rnd() * 6;
        const h = 16 + rnd() * 17;
        const ry = a + Math.PI / 2 + (rnd() - 0.5) * 0.18;
        const lean = (rnd() - 0.5) * 0.055;         // out of true, on purpose
        wallsets[(rnd() * 4) | 0].push({
          pos: [x, y + h / 2, z], rot: [lean, ry, lean * 0.7], scale: [w, h, dp],
        });
        (rnd() > 0.4 ? roofsA : roofsB).push({
          pos: [x, y + h + 2.6, z], rot: [0, ry, 0], scale: [(w + 1.6) / 1.42, 5.4 + rnd() * 2.6, (dp + 1.6) / 1.42],
        });
        // one timber band across the front, which is what says half-timbered
        if (rnd() > 0.45) {
          beams.push({ pos: [x, y + h * 0.62, z], rot: [lean, ry, lean * 0.7], scale: [w + 0.4, 0.8, dp + 0.4] });
        }
        if (rnd() > 0.4) {
          sills.push({ pos: [x, y + h * 0.34, z], rot: [lean, ry, lean * 0.7], scale: [w + 1.5, 0.5, dp + 1.5] });
        }
        facades.push({ x, y, z, w, dp, h, ry });
      }
    }
    const unit = box(1, 1, 1);
    // a hip roof off a four-sided cone reads as a European pantile roof at
    // any distance a train ever sees one from
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
    wallsets.forEach((s, i) => put(s, unit, mats[i]));
    put(roofsA, roofGeo, tile); put(roofsB, roofGeo, tile2);
    put(beams, unit, beam); put(sills, unit, beam);

    // lit windows, in columns up each front
    const wins = [];
    facades.forEach((f) => {
      const rows = Math.max(2, Math.round(f.h / 5.5));
      for (let r = 1; r < rows; r++) {
        if (rnd() > 0.55) continue;
        const side = rnd() > 0.5 ? 1 : -1;
        const ox = side * (f.w / 2 + 0.06);
        wins.push({
          pos: [f.x + ox * Math.cos(f.ry), f.y + (r / rows) * f.h, f.z - ox * Math.sin(f.ry)],
          rot: [0, f.ry + Math.PI / 2, 0], scale: [1.5 + rnd() * 0.7, 2.0 + rnd() * 0.8, 1],
        });
      }
    });
    put(wins, new THREE.PlaneGeometry(1, 1), glassM, 6);
  }

  // ---- the top of the hill: a church, because every one of these has one ----
  {
    const t = new THREE.Group();
    t.position.set(HX + 10, groundAt(HX + 10, HZ + 6) - 2, HZ + 6);
    const nave = new THREE.Mesh(box(20, 16, 40), plasterA);
    nave.position.y = 8; t.add(nave);
    const nroof = new THREE.Mesh(new THREE.ConeGeometry(15, 9, 4, 1), tile2);
    nroof.rotation.y = Math.PI / 4; nroof.position.y = 20; t.add(nroof);
    const tower = new THREE.Mesh(box(13, 48, 13), plasterA);
    tower.position.set(0, 24, 22); t.add(tower);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(9.4, 26, 4, 1), tile2);
    spire.rotation.y = Math.PI / 4; spire.position.set(0, 61, 22); t.add(spire);
    const cock = new THREE.Mesh(new THREE.SphereGeometry(1.1, 7, 5), brass);
    cock.position.set(0, 75, 22); t.add(cock);
    for (const [dx, dz] of [[0, 6.8], [6.8, 0]]) {
      const face = new THREE.Mesh(box(dz ? 7 : 0.3, 7, dz ? 0.3 : 7), plasterC);
      face.position.set(dx, 43, 22 + dz); t.add(face);
    }
    group.add(t);
  }

  // ---- bunting across the steepest street, and the hat shop's sign ----
  {
    const flagGeo = new THREE.PlaneGeometry(1, 1);
    const cols = ['#d8635a', '#e8c05c', '#6fa8c8', '#e2e0d6'].map(c => makePaintMaterial(shared, {
      color: c, shadowTint: '#4a4640', rim: 1.0, bands: 2, grain: 0.1, side: THREE.DoubleSide, sway: 0.16, translucency: 1.4,
    }));
    const sets = [[], [], [], []];
    for (let s = 0; s < 26; s++) {
      const a = rnd() * Math.PI * 2, rr = 150 + rnd() * 180;
      const x0 = HX + Math.cos(a) * rr, z0 = HZ + Math.sin(a) * rr;
      const y0 = groundAt(x0, z0) + 12 + rnd() * 8;
      const dir = a + Math.PI / 2;
      for (let k = 0; k < 14; k++) {
        const d = (k - 7) * 2.6;
        sets[(rnd() * 4) | 0].push({
          pos: [x0 + Math.cos(dir) * d, y0 - Math.abs(d) * 0.10, z0 + Math.sin(dir) * d],
          rot: [0, dir, 0], scale: [1.1, 1.5, 1],
        });
      }
    }
    sets.forEach((items, i) => {
      if (!items.length) return;
      const m = new THREE.InstancedMesh(flagGeo, cols[i], items.length);
      fillInstances(m, items); m.frustumCulled = false; m.renderOrder = 7; group.add(m);
    });
  }

  // ---- the tram, running the lower street, because it is always in shot ----
  const tram = new THREE.Group();
  {
    const body = new THREE.Mesh(box(4.4, 5.2, 15), plasterD);
    body.position.y = 4.0; tram.add(body);
    const roof = new THREE.Mesh(box(5.0, 0.7, 16), tile2);
    roof.position.y = 6.9; tram.add(roof);
    for (const s of [-1, 1]) {
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(12.4, 2.2), glassM);
      strip.position.set(s * 2.25, 4.8, 0); strip.rotation.y = s * Math.PI / 2;
      tram.add(strip);
    }
    const pole = new THREE.Mesh(box(0.16, 4.4, 0.16), beam);
    pole.position.set(0, 9, -3); pole.rotation.x = -0.5; tram.add(pole);
    group.add(tram);
  }

  // ---- a clump of trees on the lower slope ----
  {
    const clump = (() => {
      const parts = [];
      for (let i = 0; i < 3; i++) {
        const g = new THREE.IcosahedronGeometry(1, 0);
        const p = g.attributes.position;
        for (let v = 0; v < p.count; v++) {
          const n = 0.72 + ((v * 9 + i * 21) % 14) / 26;
          p.setXYZ(v, p.getX(v) * n, p.getY(v) * n, p.getZ(v) * n);
        }
        g.computeVertexNormals();
        const s = 0.5 + (i % 3) * 0.15;
        g.scale(s, s, s);
        g.translate((i - 1) * 0.42, 0.4 + (i % 2) * 0.28, ((i * 5) % 3 - 1) * 0.36);
        parts.push(g);
      }
      return mergePN(parts);
    })();
    const dark = makePaintMaterial(shared, { color: '#4b6f38', shadowTint: '#182619', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.35, sway: 0.02, translucency: 0.55 });
    const items = [];
    for (let i = 0; i < 1400; i++) {
      const a = rnd() * Math.PI * 2, d = 330 + rnd() * 240;
      const x = HX + Math.cos(a) * d, z = HZ + Math.sin(a) * d;
      const y = groundAt(x, z);
      const s = 4 + rnd() * 8;
      items.push({ pos: [x, y - 1.5, z], rot: [0, rnd() * 6.28, 0], scale: [s, s * (1 + rnd() * 0.7), s] });
    }
    const m = new THREE.InstancedMesh(clump, dark, items.length);
    fillInstances(m, items); m.frustumCulled = false; group.add(m);
  }

  function update(t) {
    // the tram works its way round the lower street and back again
    const a = 0.9 + Math.sin(t * 0.07) * 1.5;
    const rr = 352;
    tram.position.set(HX + Math.cos(a) * rr, groundAt(HX + Math.cos(a) * rr, HZ + Math.sin(a) * rr) - 1, HZ + Math.sin(a) * rr);
    tram.rotation.y = -a + (Math.cos(t * 0.07) > 0 ? Math.PI : 0);
  }
  update(0);

  return { group, update };
}
