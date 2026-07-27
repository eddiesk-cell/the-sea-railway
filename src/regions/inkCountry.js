import * as THREE from 'three';
import { karstPeak, cliffPine, bambooCane } from '../world/peaks.js';
import { curvedRoof, box, mulberry, fillInstances } from '../world/geo.js';
import { makePaintMaterial } from '../world/paintMaterial.js';

// ---------------------------------------------------------------------------
// The Ink Country — shui-mo, and specifically Huangshan.
//
// Four things make the picture, and none of them is the mountain's shape:
//
//   1. VERTICALITY. Blades of rock four to eight times as tall as they are
//      wide, standing in ranks, going up past the top of the frame.
//   2. THE SEA OF CLOUD. Decks of it at three altitudes, cutting across
//      everything, so no peak shows its foot and the eye cannot measure them.
//   3. TONE AS DISTANCE. Each rank paler than the one in front, until the
//      furthest is barely a stain. That single rule is the whole depth.
//   4. THE PINES. Flat, level, near-black plates clinging to the near rock.
//      They are horizontal, and that is the only reason the rest reads as
//      vertical.
//
// Nothing here is coloured. The whole region is one pigment and the water it
// was ground with — except a single seal, which the paper wears in the corner
// rather than the world.
// ---------------------------------------------------------------------------

export function buildInkCountry(shared) {
  const group = new THREE.Group();
  const rnd = mulberry(1207);

  // Values, not colours. The ink conversion reads luminance, so what these
  // materials really set is how dark a brush loads for each rank.
  const rock = [
    makePaintMaterial(shared, { color: '#2e3646', shadowTint: '#0b0e16', rim: 0.30, bands: 3, grain: 0.42, grainScale: 0.16, inkBias: 0.34 }),
    makePaintMaterial(shared, { color: '#4a5364', shadowTint: '#191d27', rim: 0.28, bands: 3, grain: 0.32, grainScale: 0.14, inkBias: 0.15 }),
    makePaintMaterial(shared, { color: '#6e7684', shadowTint: '#2e333d', rim: 0.24, bands: 2, grain: 0.14, grainScale: 0.20, inkBias: -0.04 }),
    makePaintMaterial(shared, { color: '#949aa4', shadowTint: '#4c515a', rim: 0.20, bands: 2, grain: 0.10, grainScale: 0.16, inkBias: -0.22 }),
  ];
  const timber = makePaintMaterial(shared, {
    color: '#5a5148', shadowTint: '#241f22', rim: 0.55, bands: 3, grain: 0.2, inkBias: 0.10,
  });
  const roofMat = makePaintMaterial(shared, {
    color: '#3c4048', shadowTint: '#171a20', rim: 0.6, bands: 3, grain: 0.14,
    side: THREE.DoubleSide, inkBias: 0.12,
  });

  // =========================================================================
  // The ranks
  // =========================================================================
  const RANKS = [
    // A five-hundred-metre peak has to stand a kilometre off before you can
    // see the top of it through a train window. Put the near rank any closer
    // and it stops being a mountain and becomes a wall across the glass.
    { n: 12, xMin: 620,  xMax: 1150, h: [300, 560], r: [40, 78],   mat: 0, pines: true, near: true },
    { n: 16, xMin: 1250, xMax: 2200, h: [400, 720], r: [55, 105],  mat: 1, pines: true },
    { n: 18, xMin: 2400, xMax: 3600, h: [500, 900], r: [75, 140],  mat: 2 },
    { n: 14, xMin: 3800, xMax: 5200, h: [600, 1100], r: [95, 180], mat: 3 },
  ];

  const shoulders = [];
  RANKS.forEach((band, bi) => {
    for (let i = 0; i < band.n; i++) {
      const side = rnd() > 0.5 ? 1 : -1;
      const x = side * (band.xMin + rnd() * (band.xMax - band.xMin));
      const z = -900 - rnd() * 3600;
      const h = band.h[0] + rnd() * (band.h[1] - band.h[0]);
      const r = band.r[0] + rnd() * (band.r[1] - band.r[0]);
      const m = new THREE.Mesh(karstPeak(r, h, 40 + bi * 31 + i, {
        rings: bi === 0 ? 20 : 13, sectors: bi === 0 ? 11 : 8,
      }), rock[band.mat]);
      // the feet go well below the world: nothing ever shows where a peak ends
      const base = -150 - rnd() * 90;
      m.position.set(x, base, z);
      m.rotation.y = rnd() * Math.PI * 2;
      group.add(m);
      if (band.pines) shoulders.push({ x, z, y: base + h, r, h, side, near: !!band.near });
    }
  });

  // =========================================================================
  // The pines. Level, black, and clinging where nothing should grow.
  // =========================================================================
  {
    const wood = makePaintMaterial(shared, {
      color: '#20261f', shadowTint: '#080a0c', rim: 0.42, bands: 2, grain: 0.24, inkBias: 0.30,
    });
    const needle = makePaintMaterial(shared, {
      color: '#1c241d', shadowTint: '#070a0b', rim: 0.30, bands: 2, grain: 0.30, grainScale: 0.5,
      side: THREE.DoubleSide, sway: 0.012, inkBias: 0.34,
    });
    const kinds = [0, 1, 2, 3].map(k => cliffPine(7 + k * 13, { outward: k % 2 ? 1 : -1 }));
    const woodItems = [[], [], [], []];
    shoulders.forEach(({ x, z, y, r, h: hGuess, side, near }) => {
      const n = near ? 2 + ((rnd() * 3) | 0) : 1 + ((rnd() * 2) | 0);
      for (let k = 0; k < n; k++) {
        // on the shoulder, over the drop — never in the middle of a summit
        // A pine has to stand ON the rock. Put it out at the full radius and
        // it hangs in the air beside a summit that has already tapered away.
        const a = rnd() * Math.PI * 2;
        const d = r * (0.18 + rnd() * 0.30);
        const hh = (near ? 16 : 24) + rnd() * (near ? 14 : 20);
        woodItems[(rnd() * 4) | 0].push({
          pos: [x + Math.cos(a) * d, y - hGuess * (0.10 + rnd() * 0.16), z + Math.sin(a) * d],
          rot: [0, rnd() * Math.PI * 2, 0],
          scale: [hh * side, hh, hh],
        });
      }
    });
    kinds.forEach((k, i) => {
      if (!woodItems[i].length) return;
      const a = new THREE.InstancedMesh(k.wood, wood, woodItems[i].length);
      fillInstances(a, woodItems[i]); a.frustumCulled = false; group.add(a);
      const b = new THREE.InstancedMesh(k.needle, needle, woodItems[i].length);
      fillInstances(b, woodItems[i]); b.frustumCulled = false; group.add(b);
    });
  }

  // =========================================================================
  // The bamboo, close in along the line
  // =========================================================================
  const bambooMat = makePaintMaterial(shared, {
    color: '#697a5e', shadowTint: '#2b3630', rim: 0.7, bands: 2, grain: 0.16,
    side: THREE.DoubleSide, sway: 0.085, inkBias: -0.04, translucency: 0.5,
  });
  const caneGeos = [bambooCane(3), bambooCane(11), bambooCane(29)];
  const clumps = [[], [], []];
  const CANES = 6400;
  for (let i = 0; i < CANES; i++) {
    const side = rnd() > 0.5 ? 1 : -1;
    // a grove has holes in it — the eye needs somewhere to look through
    const t = Math.pow(rnd(), 0.7);
    // stand the grove back from the line: closer than this and the window is
    // a wall of canes with the whole country hidden behind it
    const x = side * (17.0 + t * 46);
    const z = -1400 - rnd() * 2500;
    if (Math.sin(z * 0.011) * 0.5 + 0.5 < rnd() * 0.55) continue;
    // thirty metres and more — from the line you cannot see the tops
    const hgt = 25 + rnd() * 19;
    clumps[(rnd() * 3) | 0].push({
      pos: [x, 0.05, z],
      rot: [(rnd() - 0.5) * 0.06, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.06],
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

  // =========================================================================
  // A pavilion on a rock, because a landscape needs one made thing
  // =========================================================================
  {
    const pav = new THREE.Group();
    // stood in one of the grove's own gaps, so the line has something to see
    pav.position.set(-74, 0, -2427);
    pav.rotation.y = 0.5;

    const stack = new THREE.Mesh(karstPeak(15, 36, 777, { rings: 12, sectors: 9 }), rock[0]);
    stack.position.y = -17.5;
    pav.add(stack);

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

  // =========================================================================
  // Cranes: two strokes each, a long way off
  // =========================================================================
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
  for (let i = 0; i < 11; i++) {
    cranes.push({
      x: (rnd() - 0.5) * 900,
      y: 110 + rnd() * 160,
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
        e.set(Math.abs(flap) * 0.6, 0, s * (0.22 + flap));
        q.setFromEuler(e);
        sv.set(c.s * s, c.s, c.s);
        m.compose(pv, q, sv);
        craneMesh.setMatrixAt(i * 2 + w, m);
      }
    });
    craneMesh.instanceMatrix.needsUpdate = true;
  }
  update(0);

  return { group, update };
}
