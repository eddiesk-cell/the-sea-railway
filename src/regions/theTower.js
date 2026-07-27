import * as THREE from 'three';
import { box, hill, mulberry, fillInstances, mergePN } from '../world/geo.js';
import { makePaintMaterial, makeGlowMaterial } from '../world/paintMaterial.js';

// ---------------------------------------------------------------------------
// The Tower — The Boy and the Heron, 2023.
//
// A wood that has grown up round something that was not built by anybody, and
// a flat grey sea on the other side of it.
//
// The tower has to be WRONG rather than grand. It is windowless except for one
// slot; its stones do not course; it leans a degree and a half; and the wood
// stops in a ring round it that nothing has crossed in a long time. The light
// is overcast and almost directionless, because the one thing this region must
// never look is picturesque.
// ---------------------------------------------------------------------------

export function buildTheTower(shared) {
  const group = new THREE.Group();
  const rnd = mulberry(2023);

  const turf = makePaintMaterial(shared, { color: '#46543a', shadowTint: '#1a2018', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.55 });
  const moss = makePaintMaterial(shared, { color: '#59683c', shadowTint: '#20281a', rim: 0.5, bands: 3, grain: 0.26, grainScale: 0.4, sway: 0.02, translucency: 0.6 });
  const canopy = makePaintMaterial(shared, {
    color: '#37502e', shadowTint: '#111a10', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.35,
    sway: 0.03, translucency: 0.55,
  });
  const canopy2 = makePaintMaterial(shared, {
    color: '#465c33', shadowTint: '#161f12', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.35,
    sway: 0.035, translucency: 0.6,
  });
  const trunkM = makePaintMaterial(shared, { color: '#48403a', shadowTint: '#171412', rim: 0.7, bands: 3, grain: 0.26, grainScale: 1.7 });
  const stoneA = makePaintMaterial(shared, { color: '#7d7b74', shadowTint: '#2c2c2e', rim: 0.8, bands: 3, grain: 0.26, grainScale: 1.5, wrap: 0.55 });
  const stoneB = makePaintMaterial(shared, { color: '#6a6962', shadowTint: '#252528', rim: 0.8, bands: 3, grain: 0.28, grainScale: 1.2, wrap: 0.55 });
  const stoneC = makePaintMaterial(shared, { color: '#8b877c', shadowTint: '#323230', rim: 0.8, bands: 3, grain: 0.24, grainScale: 1.8, wrap: 0.55 });
  const paleBird = makePaintMaterial(shared, { color: '#dfe0da', shadowTint: '#6a6c68', rim: 1.4, bands: 2, grain: 0.06 });
  const slitGlow = makeGlowMaterial(shared, '#ffd9a2', 0.85, { flicker: 0.05 });

  const unit = box(1, 1, 1);
  const put = (items, geo, mat, ro) => {
    if (!items.length) return null;
    const m = new THREE.InstancedMesh(geo, mat, items.length);
    fillInstances(m, items); m.frustumCulled = false;
    if (ro) m.renderOrder = ro;
    group.add(m); return m;
  };

  // =========================================================================
  // Wood on the near side of the line, the sea on the far side of the wood
  // =========================================================================
  const SEA = -430;                    // where the ground stops and the water is
  // Two hundred metres out: near enough that it looms over the wood, far
  // enough that most of it is in the window. Pushed back to three hundred the
  // whole tower fitted and stopped being frightening, which is a worse trade
  // than losing the top of it.
  const TX = -200, TZ = -1300;         // the tower
  {
    for (let i = 0; i < 24; i++) {
      const b = new THREE.Mesh(unit, turf);
      b.position.set(-13 - (Math.abs(SEA) - 13) / 2, 0.6, -110 - i * 120);
      b.scale.set(Math.abs(SEA) - 13, 2.2, 120 + rnd() * 30);
      group.add(b);
      const g = new THREE.Mesh(unit, turf);
      const w = 260 + rnd() * 300;
      g.position.set(13 + w / 2, 0.5, -110 - i * 120);
      g.scale.set(w, 1.8, 120 + rnd() * 30);
      group.add(g);
    }
    // a low shore lip where the land ends
    const lip = new THREE.Mesh(box(6, 2.6, 2700), stoneB);
    lip.position.set(SEA, 1.0, -1350); group.add(lip);
    // and one island out on the water, flat and grey
    const isle = new THREE.Mesh(hill(150, 22, 37, { rough: 0.4, rings: 10, sectors: 16 }), turf);
    isle.position.set(-760, -8, -1700); group.add(isle);
  }

  // =========================================================================
  // The wood. Dense, and it stops in a ring round the tower.
  // =========================================================================
  {
    const clump = (() => {
      const parts = [];
      for (let i = 0; i < 4; i++) {
        const g = new THREE.IcosahedronGeometry(1, 0);
        const q = g.attributes.position;
        for (let v = 0; v < q.count; v++) {
          const n = 0.72 + ((v * 11 + i * 17) % 13) / 26;
          q.setXYZ(v, q.getX(v) * n, q.getY(v) * n * 0.95, q.getZ(v) * n);
        }
        g.computeVertexNormals();
        const sc = 0.46 + (i % 3) * 0.15;
        g.scale(sc, sc, sc);
        g.translate((i % 3 - 1) * 0.42, 0.5 + (i % 2) * 0.3, ((i * 5) % 3 - 1) * 0.38);
        parts.push(g.toNonIndexed());
      }
      return mergePN(parts);
    })();
    const a = [], b = [], trunks = [];
    for (let i = 0; i < 5600; i++) {
      const side = rnd() > 0.72 ? 1 : -1;
      const x = side * (62 + Math.pow(rnd(), 0.72) * 360);
      const z = -100 - rnd() * 2540;
      // the clearing: nothing grows within seventy metres of it
      if (Math.hypot(x - TX, z - TZ) < 120) continue;
      const s = 4 + rnd() * 6;
      const it = { pos: [x, 1.4, z], rot: [0, rnd() * 6.28, 0], scale: [s, s * (1.2 + rnd() * 0.8), s] };
      (rnd() > 0.5 ? a : b).push(it);
      trunks.push({ pos: [x, 1.4, z], scale: [s * 0.11, s * 1.0, s * 0.11] });
    }
    put(a, clump, canopy); put(b, clump, canopy2);
    put(trunks, new THREE.CylinderGeometry(1, 1.4, 1, 5), trunkM);

    // moss and fallen stone in the clearing
    const stones = [];
    for (let i = 0; i < 260; i++) {
      const ang = rnd() * Math.PI * 2, d = 24 + rnd() * 48;
      const s = 1.4 + Math.pow(rnd(), 1.5) * 6;
      stones.push({
        pos: [TX + Math.cos(ang) * d, 1.4, TZ + Math.sin(ang) * d],
        rot: [0, rnd() * 6.28, (rnd() - 0.5) * 0.24], scale: [s, s * 0.55, s * (0.7 + rnd() * 0.7)],
      });
    }
    put(stones, hill(1, 1, 11, { rough: 0.55, rings: 6, sectors: 9 }), stoneB);
    const tufts = [];
    for (let i = 0; i < 3000; i++) {
      const ang = rnd() * Math.PI * 2, d = 8 + rnd() * 66;
      const s = 1.0 + rnd() * 2.2;
      tufts.push({
        pos: [TX + Math.cos(ang) * d, 1.4, TZ + Math.sin(ang) * d],
        rot: [0, rnd() * 6.28, 0], scale: [s, s * 0.5, s],
      });
    }
    put(tufts, new THREE.IcosahedronGeometry(1, 0), moss);
  }

  // =========================================================================
  // The tower
  // =========================================================================
  {
    const t = new THREE.Group();
    t.position.set(TX, 1.4, TZ);
    t.rotation.z = 0.026;                    // a degree and a half out of plumb

    // courses that do not course: each ring a different height and radius
    let y = 0;
    const mats = [stoneA, stoneB, stoneC];
    for (let i = 0; i < 34; i++) {
      const h = 3.0 + rnd() * 3.0;
      const r = 19 - i * 0.26 + (rnd() - 0.5) * 1.2;
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(r, r + 0.2, h, 14), mats[i % 3]);
      ring.position.y = y + h / 2;
      ring.rotation.y = rnd() * 0.4;
      t.add(ring);
      y += h;
    }
    // the crown: a shallow dome, and a ring of stubs round it like a jaw
    const dome = new THREE.Mesh(new THREE.SphereGeometry(11.5, 18, 9, 0, 6.28, 0, 1.3), stoneC);
    dome.position.y = y + 1; t.add(dome);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const st = new THREE.Mesh(box(2.2, 4.4, 2.2), stoneA);
      st.position.set(Math.cos(a) * 11.5, y + 1.6, Math.sin(a) * 11.5);
      st.rotation.y = a; st.rotation.z = (rnd() - 0.5) * 0.14;
      t.add(st);
    }
    // one slot, three quarters of the way up, and it is lit
    const slot = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 9), slitGlow);
    slot.position.set(12.6, y * 0.72, 0); slot.rotation.y = Math.PI / 2;
    slot.renderOrder = 9; t.add(slot);
    const lintel = new THREE.Mesh(box(1.2, 1.0, 4.4), stoneB);
    lintel.position.set(12.4, y * 0.72 + 5.2, 0); t.add(lintel);
    // and a door at the foot that is far too small for the building
    const door = new THREE.Mesh(box(1.0, 3.4, 2.2), stoneB);
    door.position.set(16.6, 1.7, 0); t.add(door);
    group.add(t);
  }

  // ---- herons, standing at the water's edge and not doing anything ----
  {
    const bird = (() => {
      const parts = [];
      const b = new THREE.SphereGeometry(1, 8, 6); b.scale(0.55, 0.45, 1.25); b.translate(0, 2.1, 0);
      parts.push(b.toNonIndexed());
      const n = new THREE.CylinderGeometry(0.10, 0.07, 1.7, 5); n.rotateZ(0.25); n.translate(0.24, 3.0, 0.5);
      parts.push(n.toNonIndexed());
      const bk = new THREE.CylinderGeometry(0.05, 0.02, 0.9, 4); bk.rotateZ(1.15); bk.translate(0.85, 3.5, 0.9);
      parts.push(bk.toNonIndexed());
      for (const s of [-0.16, 0.16]) {
        const l = new THREE.CylinderGeometry(0.06, 0.06, 2.0, 4); l.translate(s, 1.0, 0);
        parts.push(l.toNonIndexed());
      }
      return mergePN(parts);
    })();
    const items = [];
    for (let i = 0; i < 26; i++) {
      const s = 1.0 + rnd() * 0.5;
      items.push({
        pos: [SEA - 4 - rnd() * 60, 0.4, -160 - rnd() * 2400],
        rot: [0, rnd() * 6.28, 0], scale: [s, s, s],
      });
    }
    put(items, bird, paleBird);
  }

  function update() { /* deliberately still */ }

  return { group, update };
}
