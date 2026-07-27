import * as THREE from 'three';
import { box, mulberry, fillInstances, mergePN } from '../world/geo.js';
import { makePaintMaterial } from '../world/paintMaterial.js';

// ---------------------------------------------------------------------------
// The Sketch — My Neighbors the Yamadas, 1999.
//
// The last stop, and the emptiest. White paper, a few lines, and colour only
// where somebody could be bothered.
//
// The Ink Country proved the finish pass can change medium rather than
// palette; this is the same machinery turned the opposite way. Kaguya is
// charcoal and water on rough paper, all tone. Yamadas is a felt pen on a
// smooth white page, all LINE — so the paper goes bright and cold, the ink
// goes soft, and almost nothing is built at all. What makes it read is the
// emptiness between the objects, so the temptation to fill the gaps has to be
// refused all the way to the end of the region.
//
// It is also where the line runs out, so the last thing in it is the sea
// coming back — the first country, seen again from behind.
// ---------------------------------------------------------------------------

export function buildTheSketch(shared) {
  const group = new THREE.Group();
  const rnd = mulberry(1999);

  // Under ink, albedo barely matters — what matters is VALUE, because value is
  // what the brush picks up. So everything here is a light grey with one thing
  // darker, and the two colour patches are the only saturated marks for a mile.
  const line = makePaintMaterial(shared, { color: '#b9b6ae', shadowTint: '#6a6862', rim: 0.9, bands: 2, grain: 0.10, wrap: 0.7, inkBias: 0.30 });
  const line2 = makePaintMaterial(shared, { color: '#a6a49c', shadowTint: '#5e5c58', rim: 0.9, bands: 2, grain: 0.12, wrap: 0.7, inkBias: 0.42 });
  const dark = makePaintMaterial(shared, { color: '#7c7a74', shadowTint: '#3c3b38', rim: 0.9, bands: 2, grain: 0.12, wrap: 0.6, inkBias: 0.55 });
  const red = makePaintMaterial(shared, { color: '#c8483c', shadowTint: '#6a3230', rim: 1.2, bands: 2, grain: 0.08, side: THREE.DoubleSide, inkBias: -0.4 });
  const yellow = makePaintMaterial(shared, { color: '#e0b038', shadowTint: '#7a6230', rim: 1.2, bands: 2, grain: 0.08, side: THREE.DoubleSide, inkBias: -0.4 });
  const green = makePaintMaterial(shared, {
    color: '#7fa060', shadowTint: '#465440', rim: 0.9, bands: 2, grain: 0.10,
    side: THREE.DoubleSide, sway: 0.10, translucency: 1.2, inkBias: -0.2,
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
  // A page. One flat plate, and a scribble of grass on it in three places.
  // =========================================================================
  {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 24; i++) {
        const b = new THREE.Mesh(unit, line);
        const w = 300 + rnd() * 300;
        b.position.set(side * (13 + w / 2), 0.4, -110 - i * 120);
        b.scale.set(w, 1.6, 120 + rnd() * 30);
        group.add(b);
      }
    }
    // grass, but only in patches — most of the page stays blank
    const tuft = (() => {
      const parts = [];
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        const g = new THREE.PlaneGeometry(0.09, 1.6, 1, 2).toNonIndexed();
        const p = g.attributes.position;
        for (let v = 0; v < p.count; v++) {
          const t = p.getY(v) / 1.6 + 0.5;
          p.setX(v, p.getX(v) * (1 - t * 0.9));
          p.setY(v, t * 1.6); p.setZ(v, t * t * 0.9);
        }
        g.computeVertexNormals(); g.rotateY(a); parts.push(g);
      }
      return mergePN(parts);
    })();
    const items = [];
    const patches = [[-40, -420], [-95, -1180], [-168, -1520], [-52, -1980], [-150, -2380]];
    patches.forEach(([px, pz]) => {
      for (let i = 0; i < 1500; i++) {
        const a = rnd() * Math.PI * 2, d = Math.pow(rnd(), 0.6) * 60;
        // small, and few: what makes a Yamadas frame is the paper it does not
        // touch, so a dense thicket of strokes at the station is the one thing
        // this region must not have
        const s = 0.8 + rnd() * 0.9;
        items.push({
          pos: [px + Math.cos(a) * d, 1.3, pz + Math.sin(a) * d],
          rot: [0, rnd() * 6.28, 0], scale: [s, s * (0.7 + rnd() * 0.7), s],
        });
      }
    });
    put(items, tuft, green);
  }

  // =========================================================================
  // Four objects, a long way apart, and nothing between them
  // =========================================================================

  // ---- a house, drawn in about nine strokes ----
  {
    const h = new THREE.Group();
    h.position.set(-104, 1.4, -1420);
    h.rotation.y = Math.PI / 2 - 0.2;
    const body = new THREE.Mesh(box(15, 8, 11), line);
    body.position.y = 4; h.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(11.4, 5.4, 4, 1), line2);
    roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 1.3); roof.position.y = 10.4; h.add(roof);
    const door = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 3.0), dark);
    door.position.set(-2, 1.5, 5.56); h.add(door);
    for (const wx of [3.2, 6.0]) {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), line2);
      w.position.set(wx, 5.0, 5.56); h.add(w);
    }
    // the one warm thing: a red umbrella leaning by the door
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 5), dark);
    shaft.position.set(-4.6, 1.6, 6.0); shaft.rotation.z = 0.22; h.add(shaft);
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.9, 10, 1), red);
    canopy.position.set(-5.0, 3.2, 6.0); h.add(canopy);
    group.add(h);
  }

  // ---- one tree, alone, in the middle of a great deal of paper ----
  {
    const t = new THREE.Group();
    t.position.set(-58, 1.4, -1508);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.0, 11, 7), line2);
    trunk.position.y = 5.5; t.add(trunk);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.42, 6, 5), line2);
      b.position.set(Math.cos(a) * 1.8, 9 + (i % 2) * 1.4, Math.sin(a) * 1.8);
      b.rotation.z = Math.cos(a) * -0.6; b.rotation.x = Math.sin(a) * 0.6;
      t.add(b);
    }
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(8.5, 1), green);
    crown.position.y = 15; crown.scale.set(1, 0.78, 1); t.add(crown);
    group.add(t);
  }

  // ---- a bicycle propped against nothing at all ----
  {
    const b = new THREE.Group();
    b.position.set(-26, 1.4, -1572);
    b.rotation.set(0, 0.5, -0.12);
    b.scale.setScalar(3.4);
    for (const wz of [-0.62, 0.62]) {
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.035, 5, 16), dark);
      wheel.position.set(0, 0.34, wz); b.add(wheel);
    }
    const frame = new THREE.Mesh(box(0.05, 0.05, 1.15), dark);
    frame.position.set(0, 0.62, 0); frame.rotation.x = 0.12; b.add(frame);
    const post = new THREE.Mesh(box(0.05, 0.42, 0.05), dark);
    post.position.set(0, 0.72, -0.34); b.add(post);
    const seat = new THREE.Mesh(box(0.12, 0.06, 0.30), dark);
    seat.position.set(0, 0.94, -0.36); b.add(seat);
    const bars = new THREE.Mesh(box(0.42, 0.04, 0.04), dark);
    bars.position.set(0, 0.92, 0.52); b.add(bars);
    const basket = new THREE.Mesh(box(0.30, 0.24, 0.34), yellow);
    basket.position.set(0, 0.80, 0.62); b.add(basket);
    group.add(b);
  }

  // ---- and a cloud, because on a page a cloud is just a shape ----
  {
    const c = new THREE.Group();
    c.position.set(-230, 96, -1560);
    for (let i = 0; i < 6; i++) {
      const s = 16 + rnd() * 22;
      const lump = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), line);
      lump.position.set((i - 2.5) * 22, Math.sin(i * 1.7) * 9, (i % 3 - 1) * 12);
      lump.scale.set(s, s * 0.62, s * 0.8);
      c.add(lump);
    }
    group.add(c);
  }

  function update() { /* a drawing does not move */ }

  return { group, update };
}
