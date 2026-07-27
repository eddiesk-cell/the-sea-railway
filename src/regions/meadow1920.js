import * as THREE from 'three';
import { box, hill, mulberry, fillInstances, mergePN } from '../world/geo.js';
import { makePaintMaterial, makeGlowMaterial } from '../world/paintMaterial.js';

// ---------------------------------------------------------------------------
// The Meadow of 1920 — The Wind Rises, 2013.
//
// Long grass to the horizon on a hot afternoon, an easel standing in it, and
// a glider turning overhead with nobody's hand on it.
//
// The whole region is one gust. The grass leans in a wave that crosses the
// field, the parasol tilts, and the glider rides it — all driven by the same
// uWind the shader already uses everywhere else, so the air here is not
// decoration, it is the subject. It is also the last quiet country before the
// line runs out, and it should feel like one long breath.
// ---------------------------------------------------------------------------

export function buildMeadow1920(shared) {
  const group = new THREE.Group();
  const rnd = mulberry(1920);

  const turf = makePaintMaterial(shared, { color: '#87954a', shadowTint: '#333a20', rim: 0.55, bands: 3, grain: 0.22, grainScale: 0.55, sway: 0.02, translucency: 0.8 });
  const dryM = makePaintMaterial(shared, {
    color: '#c6bb72', shadowTint: '#4c4630', rim: 0.7, bands: 2, grain: 0.18, grainScale: 0.4,
    side: THREE.DoubleSide, sway: 0.26, translucency: 1.5,
  });
  const dryM2 = makePaintMaterial(shared, {
    color: '#aab458', shadowTint: '#3f4626', rim: 0.7, bands: 2, grain: 0.18, grainScale: 0.4,
    side: THREE.DoubleSide, sway: 0.30, translucency: 1.6,
  });
  const poplar = makePaintMaterial(shared, {
    color: '#4d6b33', shadowTint: '#182312', rim: 0.55, bands: 3, grain: 0.22, grainScale: 0.35,
    sway: 0.06, translucency: 0.8,
  });
  const timber = makePaintMaterial(shared, { color: '#6d5a3c', shadowTint: '#241d16', rim: 0.85, bands: 3, grain: 0.26, grainScale: 1.5 });
  const linen = makePaintMaterial(shared, {
    color: '#e2dccb', shadowTint: '#565248', rim: 1.2, bands: 2, grain: 0.10, side: THREE.DoubleSide,
  });
  const paleWood = makePaintMaterial(shared, { color: '#c8b78e', shadowTint: '#4c4436', rim: 1.1, bands: 3, grain: 0.14 });
  const parasolM = makePaintMaterial(shared, {
    color: '#e6e0d2', shadowTint: '#5a5750', rim: 1.2, bands: 2, grain: 0.10,
    side: THREE.DoubleSide, sway: 0.10, translucency: 1.4,
  });

  const unit = box(1, 1, 1);
  const put = (items, geo, mat, ro) => {
    if (!items.length) return null;
    const m = new THREE.InstancedMesh(geo, mat, items.length);
    fillInstances(m, items); m.frustumCulled = false;
    if (ro) m.renderOrder = ro;
    group.add(m); return m;
  };

  // =========================================================================
  // A field, and nothing else at ground level for four hundred metres
  // =========================================================================
  {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 24; i++) {
        const b = new THREE.Mesh(unit, turf);
        const w = 320 + rnd() * 380;
        b.position.set(side * (13 + w / 2), 0.4 + rnd() * 0.3, -110 - i * 120);
        b.scale.set(w, 1.8, 120 + rnd() * 34);
        group.add(b);
      }
    }
    [[-880, -900, 420, 62], [-1120, -2200, 460, 74], [900, -1500, 480, 56]]
      .forEach(([x, z, r, h], i) => {
        const m = new THREE.Mesh(hill(r, h, 121 + i, { rough: 0.26, rings: 12, sectors: 20 }), turf);
        m.position.set(x, -8, z); group.add(m);
      });

    // the grass. Long, dry, and laid over — this is nearly the whole region.
    const tuft = (() => {
      const parts = [];
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + (i % 3) * 0.3;
        const len = 1.5 + (i % 4) * 0.3;
        const g = new THREE.PlaneGeometry(0.06, len, 1, 4).toNonIndexed();
        const p = g.attributes.position;
        for (let v = 0; v < p.count; v++) {
          const t = p.getY(v) / len + 0.5;
          p.setX(v, p.getX(v) * (1 - t * 0.88));
          p.setY(v, t * len);
          p.setZ(v, t * t * len * 0.68);
        }
        g.computeVertexNormals(); g.rotateY(a);
        parts.push(g);
        if (i % 2 === 0) {
          const h = new THREE.PlaneGeometry(0.07, 0.30).toNonIndexed();
          h.rotateY(a); h.translate(Math.sin(a) * len * 0.5, len * 0.92, Math.cos(a) * len * 0.5);
          parts.push(h);
        }
      }
      return mergePN(parts);
    })();
    const a = [], b = [];
    for (let i = 0; i < 60000; i++) {
      const side = rnd() > 0.7 ? 1 : -1;
      // long grass, not reeds: at the old scale a tuft stood six metres and hid
      // the easel, the poplars and most of the field behind it
      const s = 0.55 + rnd() * 0.85;
      const it = {
        pos: [side * (15 + Math.pow(rnd(), 1.25) * 360), 1.5, -100 - rnd() * 2560],
        rot: [0, rnd() * 6.28, 0], scale: [s, s * (0.7 + rnd() * 0.8), s],
      };
      (rnd() > 0.45 ? a : b).push(it);
    }
    put(a, tuft, dryM); put(b, tuft, dryM2);

    // one line of poplars, far off, so the field has an edge somewhere
    const col = (() => {
      const parts = [];
      for (let i = 0; i < 5; i++) {
        const g = new THREE.SphereGeometry(1, 8, 6);
        g.scale(0.42, 0.9, 0.42);
        g.translate(0, 1.0 + i * 1.35, 0);
        parts.push(g.toNonIndexed());
      }
      return mergePN(parts);
    })();
    const trees = [];
    for (let i = 0; i < 90; i++) {
      const s = 3.0 + rnd() * 1.8;
      trees.push({
        pos: [-430 - rnd() * 40, 1.4, -180 - i * 28 - rnd() * 10],
        rot: [0, rnd() * 6.28, 0], scale: [s, s * (1.1 + rnd() * 0.5), s],
      });
    }
    put(trees, col, poplar);
  }

  // =========================================================================
  // The easel, the parasol, and the rug: somebody has been here all afternoon
  // =========================================================================
  {
    const e = new THREE.Group();
    e.position.set(-38, 1.5, -1300);
    e.rotation.y = 1.1;
    for (const [ex, ez] of [[-0.7, -0.5], [0.7, -0.5], [0, 0.9]]) {
      const leg = new THREE.Mesh(box(0.07, 3.0, 0.07), timber);
      leg.position.set(ex, 1.5, ez); leg.rotation.x = ez > 0 ? -0.16 : 0.1; leg.rotation.z = -ex * 0.14;
      e.add(leg);
    }
    const board = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.3), linen);
    board.position.set(0, 2.6, -0.42); board.rotation.x = 0.14; e.add(board);
    const ledge = new THREE.Mesh(box(1.9, 0.08, 0.2), timber);
    ledge.position.set(0, 1.9, -0.36); e.add(ledge);
    group.add(e);

    const p = new THREE.Group();
    p.position.set(-30, 1.5, -1318);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 3.4, 6), timber);
    pole.position.y = 1.7; p.add(pole);
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(2.0, 0.75, 12, 1), parasolM);
    canopy.position.y = 3.4; p.add(canopy);
    p.rotation.z = 0.10;
    group.add(p);
    p.userData.lean = true;

    const rug = new THREE.Mesh(box(3.2, 0.08, 2.4), linen);
    rug.position.set(-31.5, 1.56, -1315); rug.rotation.y = 0.4; group.add(rug);
    // a hat, blown off and lying in the grass a little way away
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.66, 0.10, 14), paleWood);
    hat.position.set(-24, 1.62, -1338); hat.rotation.set(0.1, 0, 0.2); group.add(hat);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.32, 0.22, 12), paleWood);
    crown.position.set(-24, 1.72, -1338); crown.rotation.set(0.1, 0, 0.2); group.add(crown);

    group.userData.parasol = p;
  }

  // =========================================================================
  // The glider. It turns, it does not go anywhere, and it makes no sound.
  // =========================================================================
  const glider = new THREE.Group();
  {
    const fus = new THREE.Mesh(new THREE.CapsuleGeometry(0.75, 8, 5, 10), paleWood);
    fus.rotation.x = Math.PI / 2; fus.position.y = 0; glider.add(fus);
    const wing = new THREE.Mesh(box(31, 0.30, 2.3), linen);
    wing.position.set(0, 0.9, -0.6); glider.add(wing);
    for (const s of [-1, 1]) {
      const strut = new THREE.Mesh(box(0.12, 1.1, 0.12), timber);
      strut.position.set(s * 6.5, 0.4, -0.6); glider.add(strut);
      const tip = new THREE.Mesh(box(4.5, 0.26, 1.9), linen);
      tip.position.set(s * 17, 1.5, -0.6); tip.rotation.z = s * 0.16; glider.add(tip);
    }
    const tail = new THREE.Mesh(box(6.4, 0.22, 1.5), linen);
    tail.position.set(0, 0.5, 4.6); glider.add(tail);
    const fin = new THREE.Mesh(box(0.22, 2.1, 1.7), linen);
    fin.position.set(0, 1.4, 4.9); glider.add(fin);
    const skid = new THREE.Mesh(box(0.3, 0.18, 6), timber);
    skid.position.set(0, -0.85, 0.4); glider.add(skid);
    group.add(glider);
  }

  function update(t) {
    // a wide, slow, banked circle: it is soaring, not flying
    // The circle stays on the window side and stays LOW. Centred over the line
    // at ninety metres up it spent half its orbit behind the carriage and the
    // other half above the top of the glass.
    const a = t * 0.085;
    const r = 150 + Math.sin(t * 0.03) * 26;
    const cx = -280, cz = -1330;
    const y = 62 + Math.sin(t * 0.055) * 14;
    glider.position.set(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r * 0.75);
    glider.rotation.set(0, -a + Math.PI / 2, 0);
    glider.rotateZ(-0.34);
    glider.rotateX(Math.sin(t * 0.19) * 0.04);
    const p = group.userData.parasol;
    if (p) p.rotation.z = 0.10 + Math.sin(t * 0.7) * 0.055;
  }
  update(0);

  return { group, update };
}
