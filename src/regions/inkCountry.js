import * as THREE from 'three';
import { karstPeak, bambooCane } from '../world/peaks.js';
import { curvedRoof, box, mulberry, fillInstances } from '../world/geo.js';
import { makePaintMaterial } from '../world/paintMaterial.js';

// ---------------------------------------------------------------------------
// The Ink Country — shui-mo. Paper instead of sky, and depth made not by
// perspective but by tone: each range of peaks paler than the one in front,
// until the furthest is only a suggestion. The haze in this region is set high
// on purpose; the far mountains are supposed to nearly disappear.
//
// Nothing here is coloured. The whole region is one pigment and the water it
// was ground with — except for a single seal, which the paper wears in the
// corner rather than the world.
// ---------------------------------------------------------------------------

export function buildInkCountry(shared) {
  const group = new THREE.Group();
  const rnd = mulberry(1207);

  // Values, not colours. The ink conversion reads luminance, so what these
  // materials really set is how dark a brush loads for each surface.
  const rockNear = makePaintMaterial(shared, {
    color: '#40495a', shadowTint: '#11141d', rim: 0.5, bands: 3, grain: 0.20, grainScale: 0.35,
  });
  const rockMid = makePaintMaterial(shared, {
    color: '#5e6675', shadowTint: '#21252f', rim: 0.45, bands: 3, grain: 0.16, grainScale: 0.28,
  });
  const rockFar = makePaintMaterial(shared, {
    color: '#828a95', shadowTint: '#3b4048', rim: 0.4, bands: 2, grain: 0.12, grainScale: 0.22,
  });
  const timber = makePaintMaterial(shared, {
    color: '#5a5148', shadowTint: '#241f22', rim: 0.55, bands: 3, grain: 0.2, inkBias: 0.10,
  });
  const roofMat = makePaintMaterial(shared, {
    color: '#3c4048', shadowTint: '#171a20', rim: 0.6, bands: 3, grain: 0.14,
    side: THREE.DoubleSide, inkBias: 0.12,
  });

  // ---- the ranges ----
  // Three bands. The near one you could climb; the far one is nearly paper.
  // A shui-mo composition needs all three: something dark and close enough to
  // read as stone, something in between, and something that is barely there.
  const bands = [
    { n: 10, xMin: 58,  xMax: 205,  h: [80, 210],  r: [20, 44],  mat: rockNear },
    { n: 13, xMin: 260, xMax: 760,  h: [130, 290], r: [36, 86],  mat: rockMid  },
    { n: 17, xMin: 850, xMax: 2100, h: [190, 440], r: [58, 145], mat: rockFar  },
  ];

  const peakTops = [];
  bands.forEach((band, bi) => {
    for (let i = 0; i < band.n; i++) {
      const side = rnd() > 0.5 ? 1 : -1;
      const x = side * (band.xMin + rnd() * (band.xMax - band.xMin));
      const z = -1350 - rnd() * 2900;
      const h = band.h[0] + rnd() * (band.h[1] - band.h[0]);
      const r = band.r[0] + rnd() * (band.r[1] - band.r[0]);
      const m = new THREE.Mesh(karstPeak(r, h, 40 + bi * 31 + i, {
        rings: bi === 0 ? 24 : 16, sectors: bi === 0 ? 16 : 12,
      }), band.mat);
      m.position.set(x, -3, z);
      m.rotation.y = rnd() * Math.PI * 2;
      group.add(m);
      if (bi === 0) peakTops.push({ x, z, h });
    }
  });

  // ---- the bamboo, close in along the line ----
  const bambooMat = makePaintMaterial(shared, {
    color: '#697a5e', shadowTint: '#2b3630', rim: 0.7, bands: 2, grain: 0.16,
    side: THREE.DoubleSide, sway: 0.055, inkBias: -0.04, translucency: 0.5,
  });
  const caneGeos = [bambooCane(3), bambooCane(11), bambooCane(29)];
  const clumps = [[], [], []];
  const CANES = 12000;
  for (let i = 0; i < CANES; i++) {
    const side = rnd() > 0.5 ? 1 : -1;
    // a grove has holes in it — the eye needs somewhere to look through
    const t = Math.pow(rnd(), 0.7);
    const x = side * (8.5 + t * 44);
    const z = -1400 - rnd() * 2500;
    if (Math.sin(z * 0.011) * 0.5 + 0.5 < rnd() * 0.55) continue;
    const hgt = 10 + rnd() * 12;
    clumps[(rnd() * 3) | 0].push({
      pos: [x, 0.05, z],
      rot: [(rnd() - 0.5) * 0.10, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.10],
      scale: [hgt * (0.85 + rnd() * 0.3), hgt, hgt * (0.85 + rnd() * 0.3)],
    });
  }
  clumps.forEach((items, gi) => {
    if (!items.length) return;
    const mesh = new THREE.InstancedMesh(caneGeos[gi], bambooMat, items.length);
    fillInstances(mesh, items);
    mesh.frustumCulled = false;
    group.add(mesh);
  });

  // ---- pines clinging to the near peaks: the one gesture in the whole frame ----
  const pineMat = makePaintMaterial(shared, {
    color: '#4c5a4e', shadowTint: '#1d2426', rim: 0.6, bands: 2, grain: 0.2, inkBias: 0.06,
  });
  peakTops.forEach(({ x, z, h }, i) => {
    const n = 2 + ((rnd() * 3) | 0);
    for (let k = 0; k < n; k++) {
      const a = rnd() * Math.PI * 2;
      const d = 4 + rnd() * 12;
      const t = new THREE.Group();
      t.position.set(x + Math.cos(a) * d, -3 + h * (0.86 + rnd() * 0.12), z + Math.sin(a) * d);
      const lean = (rnd() - 0.5) * 0.9;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.34, 7, 6), pineMat);
      trunk.rotation.z = lean * 0.5;
      trunk.position.set(lean * 1.4, 3.5, 0);
      t.add(trunk);
      for (let p = 0; p < 3; p++) {
        const plate = new THREE.Mesh(new THREE.SphereGeometry(2.2 - p * 0.5, 8, 5), pineMat);
        plate.scale.set(1, 0.22 + rnd() * 0.10, 1);
        plate.position.set(lean * (2.4 + p * 1.6) + (rnd() - 0.5), 5.4 + p * 1.9, (rnd() - 0.5));
        t.add(plate);
      }
      group.add(t);
      void i;
    }
  });

  // ---- a pavilion on a rock, because a landscape needs one made thing ----
  {
    const pav = new THREE.Group();
    pav.position.set(-74, 0, -2180);
    pav.rotation.y = 0.5;

    const rock = new THREE.Mesh(karstPeak(15, 22, 777, { rings: 14, sectors: 12 }), rockNear);
    rock.position.y = -3;
    pav.add(rock);

    const deckY = 18.5;
    const deck = new THREE.Mesh(box(11, 0.6, 11), timber);
    deck.position.y = deckY; pav.add(deck);
    for (const [px, pz] of [[-4.2, -4.2], [4.2, -4.2], [-4.2, 4.2], [4.2, 4.2]]) {
      const col = new THREE.Mesh(box(0.42, 5.4, 0.42), timber);
      col.position.set(px, deckY + 2.9, pz); pav.add(col);
    }
    const rail = new THREE.Mesh(box(11, 0.24, 11), timber);
    rail.position.y = deckY + 1.5; pav.add(rail);
    const roof = new THREE.Mesh(curvedRoof(16.5, 16.5, 4.6, {
      seg: 14, power: 1.7, corner: 0.55, flare: 0.30,
    }), roofMat);
    roof.position.y = deckY + 5.6; pav.add(roof);
    const finial = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.6, 6), roofMat);
    finial.position.y = deckY + 10.4; pav.add(finial);
    group.add(pav);
  }

  // ---- cranes: two strokes each, a long way off ----
  const craneMat = makePaintMaterial(shared, {
    color: '#e8e6e0', shadowTint: '#8d8a84', rim: 0.3, bands: 2, grain: 0.05, inkBias: -0.42,
    side: THREE.DoubleSide,
  });
  const wing = new THREE.PlaneGeometry(1, 0.24, 3, 1);
  {
    const p = wing.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const f = p.getX(i) + 0.5;
      p.setY(i, p.getY(i) * (1.0 - f * 0.7));
      p.setZ(i, -f * f * 0.30);
    }
    wing.computeVertexNormals();
  }
  const cranes = [];
  for (let i = 0; i < 9; i++) {
    cranes.push({
      x: (rnd() - 0.5) * 900,
      y: 55 + rnd() * 90,
      z: -1700 - rnd() * 1900,
      s: 3.4 + rnd() * 2.8,
      ph: rnd() * 6.28,
      sp: 0.16 + rnd() * 0.12,
    });
  }
  const craneMesh = new THREE.InstancedMesh(wing, craneMat, cranes.length * 2);
  craneMesh.frustumCulled = false;
  group.add(craneMesh);

  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(),
        sv = new THREE.Vector3(), pv = new THREE.Vector3();

  function update(t) {
    cranes.forEach((c, i) => {
      const drift = (t * c.sp * 14) % 1400;
      const x = c.x + drift - 700;
      const y = c.y + Math.sin(t * 0.3 + c.ph) * 4;
      const flap = Math.sin(t * 2.1 + c.ph) * 0.42;
      for (let w = 0; w < 2; w++) {
        const s = w === 0 ? 1 : -1;
        pv.set(x + s * c.s * 0.42, y, c.z);
        e.set(flap * s * 0.0 + Math.abs(flap) * 0.6, 0, s * (0.22 + flap));
        q.setFromEuler(e);
        sv.set(c.s * s, c.s, c.s);
        m.compose(pv, q, sv);
        craneMesh.setMatrixAt(i * 2 + w, m);
      }
    });
    craneMesh.instanceMatrix.needsUpdate = true;
  }
  update(0);

  return { group, update, bounds: { zNear: -1150, zFar: -4200 } };
}
