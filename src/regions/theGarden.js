import * as THREE from 'three';
import { box, hill, mulberry, fillInstances, mergePN } from '../world/geo.js';
import { makePaintMaterial, makeGlowMaterial } from '../world/paintMaterial.js';

// ---------------------------------------------------------------------------
// The Garden — Arrietty, 2010.
//
// The other end of the same trick as the Cat Bureau, and the better one: here
// nothing is small, the train is. A lawn, seen from four inches up.
//
// Grass blades stand fourteen metres. A clover leaf is a sail. A dew drop on
// one of them is the size of a shed and holds the sun. The watering can is a
// gasometer. Everything is lit THROUGH rather than on — translucency high on
// every green thing — because that is what being underneath a leaf looks like,
// and it is the one lighting note the whole region depends on.
// ---------------------------------------------------------------------------

export function buildTheGarden(shared) {
  const group = new THREE.Group();
  const rnd = mulberry(2010);

  const soil = makePaintMaterial(shared, { color: '#4b3a2c', shadowTint: '#1b1512', rim: 0.6, bands: 3, grain: 0.30, grainScale: 0.8 });
  const bladeM = makePaintMaterial(shared, {
    color: '#6f9a3a', shadowTint: '#25381a', rim: 0.9, bands: 3, grain: 0.16, grainScale: 0.25,
    side: THREE.DoubleSide, sway: 0.20, translucency: 2.2,
  });
  const bladeM2 = makePaintMaterial(shared, {
    color: '#8ab346', shadowTint: '#2e421e', rim: 0.9, bands: 3, grain: 0.16, grainScale: 0.25,
    side: THREE.DoubleSide, sway: 0.24, translucency: 2.4,
  });
  const leafM = makePaintMaterial(shared, {
    color: '#5f8f38', shadowTint: '#21331a', rim: 1.0, bands: 3, grain: 0.14, grainScale: 0.3,
    side: THREE.DoubleSide, sway: 0.12, translucency: 1.5,
  });
  const stemM = makePaintMaterial(shared, { color: '#587f34', shadowTint: '#1f2e16', rim: 0.8, bands: 3, grain: 0.18, grainScale: 0.4, sway: 0.10, translucency: 1.2 });
  const petalM = makePaintMaterial(shared, {
    color: '#f2ecdc', shadowTint: '#5c5a54', rim: 1.4, bands: 2, grain: 0.08,
    side: THREE.DoubleSide, sway: 0.10, translucency: 2.0,
  });
  const petalP = makePaintMaterial(shared, {
    color: '#d9a7c4', shadowTint: '#4e3a48', rim: 1.4, bands: 2, grain: 0.08,
    side: THREE.DoubleSide, sway: 0.10, translucency: 2.0,
  });
  const zinc = makePaintMaterial(shared, { color: '#8d939a', shadowTint: '#31363c', rim: 1.5, bands: 3, grain: 0.14, grainScale: 0.5 });
  const terracotta = makePaintMaterial(shared, { color: '#a4573c', shadowTint: '#3a1c16', rim: 0.9, bands: 3, grain: 0.24, grainScale: 0.6 });
  const dewM = makeGlowMaterial(shared, '#dff2ff', 0.75, {
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, flicker: 0.05,
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
  // Ground. Earth, not turf — at this scale you are BELOW the grass line.
  // =========================================================================
  {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 22; i++) {
        const b = new THREE.Mesh(unit, soil);
        const w = 260 + rnd() * 340;
        b.position.set(side * (13 + w / 2), 0.5, -120 - i * 126);
        b.scale.set(w, 1.8, 126 + rnd() * 30);
        group.add(b);
      }
    }
    // clods and pebbles, which at this scale are boulders
    const clods = [];
    for (let i = 0; i < 700; i++) {
      const s = 1.5 + Math.pow(rnd(), 1.6) * 9;
      clods.push({
        pos: [-18 - Math.pow(rnd(), 0.8) * 420, 1.0, -100 - rnd() * 2540],
        rot: [0, rnd() * 6.28, (rnd() - 0.5) * 0.4], scale: [s, s * 0.6, s * (0.7 + rnd() * 0.6)],
      });
    }
    put(clods, hill(1, 1, 3, { rough: 0.6, rings: 6, sectors: 9 }), soil);
  }

  // =========================================================================
  // The grass. Fourteen metres a blade, and a forest of it.
  // =========================================================================
  {
    const blade = (() => {
      const g = new THREE.PlaneGeometry(0.7, 14, 1, 7).toNonIndexed();
      const p = g.attributes.position;
      for (let v = 0; v < p.count; v++) {
        const t = p.getY(v) / 14 + 0.5;
        p.setX(v, p.getX(v) * (1 - t * 0.85));
        p.setY(v, t * 14);
        p.setZ(v, t * t * 5.2);            // the arch, which is the whole shape
      }
      g.computeVertexNormals();
      return g;
    })();
    const a = [], b = [];
    for (let i = 0; i < 15000; i++) {
      const side = rnd() > 0.72 ? 1 : -1;
      // packed from twenty metres out — closer than that and a single blade
      // fills the window and the region is a green wall
      const x = side * (20 + Math.pow(rnd(), 1.25) * 520);
      const s = 0.55 + rnd() * 1.15;
      const it = {
        pos: [x, 1.5, -100 - rnd() * 2540],
        rot: [0, rnd() * 6.28, (rnd() - 0.5) * 0.30],
        scale: [s, s * (0.7 + rnd() * 0.8), s],
      };
      (rnd() > 0.5 ? a : b).push(it);
    }
    put(a, blade, bladeM); put(b, blade, bladeM2);
  }

  // =========================================================================
  // Clover: leaves like sails, on stems like masts
  // =========================================================================
  {
    const trefoil = (() => {
      const parts = [];
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        const g = new THREE.CircleGeometry(3.4, 12, 0, Math.PI * 1.5).toNonIndexed();
        g.rotateX(-Math.PI / 2 + 0.22);
        g.translate(Math.sin(a) * 3.0, 0, Math.cos(a) * 3.0);
        g.rotateY(a);
        parts.push(g);
      }
      return mergePN(parts);
    })();
    const heads = [], stems = [];
    for (let i = 0; i < 900; i++) {
      const side = rnd() > 0.75 ? 1 : -1;
      const x = side * (26 + Math.pow(rnd(), 1.1) * 460);
      const z = -100 - rnd() * 2540;
      const h = 8 + rnd() * 16;
      const s = 0.7 + rnd() * 1.2;
      heads.push({ pos: [x, 1.5 + h, z], rot: [(rnd() - 0.5) * 0.3, rnd() * 6.28, (rnd() - 0.5) * 0.3], scale: [s, s, s] });
      stems.push({ pos: [x, 1.5 + h / 2, z], rot: [0, 0, (rnd() - 0.5) * 0.12], scale: [0.5, h, 0.5] });
    }
    put(heads, trefoil, leafM);
    put(stems, new THREE.CylinderGeometry(1, 1.2, 1, 6), stemM);

    // dew, sitting on the leaves. Few and small: this is the only specular
    // thing in the region and a hundred of them would be a disco.
    const drops = [];
    for (let i = 0; i < 90; i++) {
      const h = heads[(rnd() * heads.length) | 0];
      const s = 0.5 + rnd() * 1.3;
      drops.push({ pos: [h.pos[0] + (rnd() - 0.5) * 3, h.pos[1] + 0.8, h.pos[2] + (rnd() - 0.5) * 3], scale: [s, s * 0.8, s] });
    }
    put(drops, new THREE.SphereGeometry(1, 8, 6), dewM, 18);
  }

  // ---- one daisy and one campion, enormous, standing over the grass ----
  {
    const petals = [], centres = [], stalks = [];
    const petalGeo = (() => {
      const g = new THREE.PlaneGeometry(3.2, 11, 1, 3).toNonIndexed();
      const p = g.attributes.position;
      for (let v = 0; v < p.count; v++) {
        const t = p.getY(v) / 11 + 0.5;
        p.setX(v, p.getX(v) * (0.5 + t * 0.6) * (1 - t * t * 0.5));
        p.setY(v, t * 11);
        p.setZ(v, -t * t * 2.0);
      }
      g.computeVertexNormals();
      return g;
    })();
    const white = [], pink = [];
    for (let f = 0; f < 26; f++) {
      const side = f % 4 === 0 ? 1 : -1;
      const x = side * (44 + Math.pow(rnd(), 1.2) * 380);
      const z = -130 - rnd() * 2480;
      const h = 26 + rnd() * 26;
      const s = 0.8 + rnd() * 0.8;
      const isPink = rnd() > 0.6;
      stalks.push({ pos: [x, 1.5 + h / 2, z], rot: [0, 0, (rnd() - 0.5) * 0.16], scale: [1.1, h, 1.1] });
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        (isPink ? pink : white).push({
          pos: [x + Math.sin(a) * 2 * s, 1.5 + h, z + Math.cos(a) * 2 * s],
          rot: [-0.5, a, 0], scale: [s, s, s],
        });
      }
      centres.push({ pos: [x, 1.5 + h + 1.2, z], scale: [4 * s, 1.6 * s, 4 * s] });
    }
    put(stalks, new THREE.CylinderGeometry(1, 1.3, 1, 6), stemM);
    put(white, petalGeo, petalM);
    put(pink, petalGeo, petalP);
    put(centres, new THREE.SphereGeometry(1, 10, 6), makePaintMaterial(shared, {
      color: '#e8c84a', shadowTint: '#5a4a1c', rim: 1.2, bands: 2, grain: 0.1,
    }));
  }

  // =========================================================================
  // The watering can, which is a building
  // =========================================================================
  {
    const can = new THREE.Group();
    can.position.set(-150, 1.5, -1300);
    can.rotation.y = 0.5;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(22, 26, 52, 20), zinc);
    body.position.y = 26; can.add(body);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(23, 22, 3, 20), zinc);
    top.position.y = 53; can.add(top);
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 8, 62, 12), zinc);
    spout.rotation.z = -0.95; spout.position.set(38, 40, 0); can.add(spout);
    const rose = new THREE.Mesh(new THREE.CylinderGeometry(9, 5, 7, 14), zinc);
    rose.rotation.z = -0.95; rose.position.set(62, 55, 0); can.add(rose);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(17, 2.6, 7, 16), zinc);
    handle.rotation.y = Math.PI / 2; handle.position.set(0, 58, 0); can.add(handle);
    group.add(can);

    // and a pot lying on its side further down, half swallowed by the grass
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(20, 14, 34, 18), terracotta);
    pot.rotation.set(0, 0.4, 1.45); pot.position.set(-230, 14, -2050); group.add(pot);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(22, 21, 4, 18), terracotta);
    rim.rotation.set(0, 0.4, 1.45); rim.position.set(-213, 16, -2054); group.add(rim);
  }

  function update() { /* the wind is in the shader; nothing else stirs */ }

  return { group, update };
}
