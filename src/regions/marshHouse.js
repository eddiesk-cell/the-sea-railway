import * as THREE from 'three';
import { box, hill, mulberry, fillInstances, mergePN } from '../world/geo.js';
import { makePaintMaterial, makeGlowMaterial } from '../world/paintMaterial.js';

// ---------------------------------------------------------------------------
// The Marsh House — When Marnie Was There, 2014.
//
// A tidal inlet at dusk, the water gone out, and a western house standing by
// itself on the far bank with two of its windows lit.
//
// The whole film is one image: a girl on one side of the water looking at a
// house on the other. So the region is built as a gap. The train runs along
// the near bank through reeds; the water is simply where no ground was laid;
// and everything the region is about is on the far side of it, too far to
// reach and close enough to see. Nothing in the middle. The emptiness IS the
// subject, and any attempt to fill it with detail kills the picture.
// ---------------------------------------------------------------------------

export function buildMarshHouse(shared) {
  const group = new THREE.Group();
  const rnd = mulberry(2014);

  const turf = makePaintMaterial(shared, { color: '#414c37', shadowTint: '#1a2020', rim: 0.55, bands: 3, grain: 0.24, grainScale: 0.6 });
  const mud = makePaintMaterial(shared, { color: '#7a705c', shadowTint: '#33302c', rim: 0.9, bands: 3, grain: 0.26, grainScale: 1.1 });
  const wetMud = makePaintMaterial(shared, { color: '#8d8674', shadowTint: '#3b3a36', rim: 1.4, bands: 2, grain: 0.18, grainScale: 1.4 });
  const reedM = makePaintMaterial(shared, {
    color: '#9a9364', shadowTint: '#3d3c2c', rim: 0.9, bands: 2, grain: 0.20, grainScale: 0.4,
    side: THREE.DoubleSide, sway: 0.30, translucency: 1.1,
  });
  const boardM = makePaintMaterial(shared, { color: '#ddd8c8', shadowTint: '#4a4a4e', rim: 1.0, bands: 3, grain: 0.14 });
  const trimM = makePaintMaterial(shared, { color: '#4a5560', shadowTint: '#1b2028', rim: 0.9, bands: 3, grain: 0.12 });
  const slate = makePaintMaterial(shared, { color: '#454b56', shadowTint: '#171a22', rim: 1.1, bands: 3, grain: 0.14, side: THREE.DoubleSide });
  const timber = makePaintMaterial(shared, { color: '#5f4f3c', shadowTint: '#221c19', rim: 0.8, bands: 3, grain: 0.28, grainScale: 1.5 });
  const woodDark = makePaintMaterial(shared, { color: '#232d20', shadowTint: '#0b100c', rim: 0.5, bands: 2, grain: 0.22, grainScale: 0.4 });
  const paleBird = makePaintMaterial(shared, { color: '#e8e6dc', shadowTint: '#6d6f6a', rim: 1.4, bands: 2, grain: 0.06 });
  const lamplight = makeGlowMaterial(shared, '#ffcf86', 0.62, { flicker: 0.04 });

  // =========================================================================
  // The banks. Everything between them is left alone, and that is the water.
  // =========================================================================
  // The width of the water is the whole composition. Too wide and the house
  // is a speck on the far side of a lake; too narrow and there is no crossing
  // to be unable to make. A hundred and twenty metres of it, with the house
  // set forty back from the far edge, puts a thirty-metre house at seven
  // degrees — a seventh of the window, which is a house you are looking at.
  // And the near bank has to be NARROW. Seventy metres of it put thirty
  // degrees of empty turf between the eye and the water, which is most of the
  // window filled with the one thing the region is not about. The water starts
  // more or less at the ballast now, and the foreground is reeds standing in it.
  const NEAR_EDGE = -32;          // where the near bank stops
  const FAR_EDGE = -196;          // where the far bank starts
  {
    // the near bank: a low shelf, because a thick slab this close to the
    // window is a cliff and not a marsh
    for (let i = 0; i < 24; i++) {
      const b = new THREE.Mesh(box(1, 1, 1), turf);
      const w = 15 + rnd() * 6;
      b.position.set(-13 - w / 2, 0.45, -110 - i * 120);
      b.scale.set(w, 1.5, 120 + rnd() * 30);
      group.add(b);
    }
    // the +x side is plain saltmarsh running away flat
    for (let i = 0; i < 22; i++) {
      const b = new THREE.Mesh(box(1, 1, 1), turf);
      const w = 240 + rnd() * 320;
      b.position.set(13 + w / 2, 0.4 + rnd() * 0.4, -120 - i * 128);
      b.scale.set(w, 1.6, 128 + rnd() * 34);
      group.add(b);
    }
    // the far bank, and the rise behind it
    for (let i = 0; i < 24; i++) {
      const b = new THREE.Mesh(box(1, 1, 1), turf);
      const w = 420 + rnd() * 300;
      b.position.set(FAR_EDGE - w / 2, 0.7 + rnd() * 0.5, -110 - i * 122);
      b.scale.set(w, 2.6, 122 + rnd() * 30);
      group.add(b);
    }
    [[-700, -560, 300, 44], [-980, -1500, 380, 58], [-620, -2260, 260, 36]]
      .forEach(([x, z, r, h], i) => {
        const m = new THREE.Mesh(hill(r, h, 71 + i, { rough: 0.30, rings: 12, sectors: 20 }), turf);
        m.position.set(x, -6, z); group.add(m);
      });

    // mud flats: the tide is out, and the exposed mud is the brightest thing
    // in the region because it is wet and the sky is still in it
    const flats = [];
    for (let i = 0; i < 300; i++) {
      const x = NEAR_EDGE - rnd() * 22 - (rnd() > 0.5 ? 0 : 84 + rnd() * 34);
      flats.push({
        // they have to stand PROUD of the water, not sit level with it — mud
        // at the waterline is mud you cannot see, and then the inlet is one
        // flat sheet of sky from bank to bank with nothing in it
        pos: [x, 0.44, -100 - rnd() * 2500], rot: [0, rnd() * 6.28, 0],
        scale: [16 + rnd() * 40, 0.75, 10 + rnd() * 30],
      });
    }
    const fm = new THREE.InstancedMesh(box(1, 1, 1), wetMud, flats.length);
    fillInstances(fm, flats); fm.frustumCulled = false; group.add(fm);

    // channels of mud along both edges where the bank slumps into the water
    const banks = [];
    for (let i = 0; i < 120; i++) {
      const far = rnd() > 0.5;
      banks.push({
        pos: [(far ? FAR_EDGE + 5 : NEAR_EDGE + 4) + (rnd() - 0.5) * 12, 0.5, -100 - rnd() * 2500],
        rot: [0, (rnd() - 0.5) * 0.4, 0], scale: [9 + rnd() * 12, 1.1, 26 + rnd() * 50],
      });
    }
    const bm = new THREE.InstancedMesh(box(1, 1, 1), mud, banks.length);
    fillInstances(bm, banks); bm.frustumCulled = false; group.add(bm);
  }

  // =========================================================================
  // Reeds. The near bank is nothing but reeds, which is what puts the water
  // behind something instead of starting it at your feet.
  // =========================================================================
  {
    const stand = (() => {
      const parts = [];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + (i % 2) * 0.4;
        const len = 1.0 + (i % 3) * 0.28;
        const g = new THREE.PlaneGeometry(0.06, len, 1, 4).toNonIndexed();
        const p = g.attributes.position;
        for (let v = 0; v < p.count; v++) {
          const t = p.getY(v) / len + 0.5;
          p.setX(v, p.getX(v) * (1 - t * 0.55));
          p.setY(v, t * len);
          p.setZ(v, t * t * len * 0.30);
        }
        g.computeVertexNormals(); g.rotateY(a); g.translate((i % 3 - 1) * 0.05, 0, (i % 2 - 0.5) * 0.06);
        parts.push(g);
        // the seed head, which is the only reason a reed reads as a reed
        if (i % 2 === 0) {
          const h = new THREE.PlaneGeometry(0.10, 0.34).toNonIndexed();
          h.rotateY(a); h.translate(Math.sin(a) * len * 0.28, len * 0.94, Math.cos(a) * len * 0.28);
          parts.push(h);
        }
      }
      return mergePN(parts);
    })();

    const items = [];
    for (let i = 0; i < 26000; i++) {
        // Banked along both waterlines, and the near stand starts FORTY-SIX
      // metres out. Reeds beginning at the ballast are five-metre blades
      // fifteen metres from the eye, which is not a marsh, it is a hedge
      // pressed against the glass with a house somewhere behind it.
      const far = rnd() > 0.62;
      const off = Math.pow(rnd(), 1.7) * 58;
      const x = far ? FAR_EDGE + 4 + off : -46 - off * 1.3;
      const s = 1.2 + rnd() * 1.7;
      items.push({
        pos: [x, 0.8, -95 - rnd() * 2520], rot: [0, rnd() * 6.28, 0],
        scale: [s, s * (0.8 + rnd() * 0.8), s],
      });
    }
    const m = new THREE.InstancedMesh(stand, reedM, items.length);
    fillInstances(m, items); m.frustumCulled = false; group.add(m);

    // and low saltgrass over the strip of bank between the ballast and the
    // water, which would otherwise be a bare brown ribbon across the window
    const salt = [];
    for (let i = 0; i < 14000; i++) {
      const s = 0.5 + rnd() * 0.7;
      salt.push({
        pos: [-14 - rnd() * 20, 1.2, -95 - rnd() * 2520],
        rot: [0, rnd() * 6.28, 0], scale: [s, s * (0.7 + rnd() * 0.6), s],
      });
    }
    const sm = new THREE.InstancedMesh(stand, reedM, salt.length);
    fillInstances(sm, salt); sm.frustumCulled = false; group.add(sm);
  }

  // =========================================================================
  // The house. One building, alone, and nothing built anywhere near it.
  // =========================================================================
  const winMats = [];
  {
    const HX = -238, HZ = -1300;
    const h = new THREE.Group();
    h.position.set(HX, 2.4, HZ);
    // Broadside to the line, with its front to the water. The face that has
    // the veranda and the lit windows on it has to be the face you can SEE;
    // authored pointing down the track, it showed the train a blank gable.
    h.rotation.y = Math.PI / 2 - 0.30;
    h.scale.setScalar(1.28);             // a mansion, not a farmhouse

    const body = new THREE.Mesh(box(30, 19, 20), boardM);
    body.position.y = 9.5; h.add(body);
    const wing = new THREE.Mesh(box(14, 14, 15), boardM);
    wing.position.set(-16, 7, 5); h.add(wing);

    // a steep gabled roof — the shape that says "not Japanese" instantly
    const gable = (w, d, ht) => {
      const g = new THREE.CylinderGeometry(d * 0.72, d * 0.72, w, 3, 1);
      g.rotateZ(Math.PI / 2); g.rotateY(Math.PI / 2);
      g.scale(1, ht / (d * 0.72), 1);
      return g;
    };
    const roof = new THREE.Mesh(gable(31, 21, 9), slate);
    roof.position.y = 19.6; h.add(roof);
    const wroof = new THREE.Mesh(gable(15, 16, 6.5), slate);
    wroof.position.set(-16, 14.4, 5); h.add(wroof);

    // three chimneys, because a house with one chimney is a cottage
    for (const [cx, cz, cw] of [[9, -4, 2.6], [-4, 6, 2.2], [-16, 1, 2.0]]) {
      const c = new THREE.Mesh(box(cw, 9, cw * 0.9), trimM);
      c.position.set(cx, 24, cz); h.add(c);
    }
    // the veranda along the water side, on posts over the mud
    const deck = new THREE.Mesh(box(32, 0.7, 6), timber);
    deck.position.set(1, 1.2, 12.4); h.add(deck);
    for (let i = 0; i < 9; i++) {
      const p = new THREE.Mesh(box(0.6, 3.4, 0.6), timber);
      p.position.set(-14 + i * 3.6, -0.4, 14.6); h.add(p);
    }
    for (let i = 0; i < 17; i++) {
      const r = new THREE.Mesh(box(0.18, 1.3, 0.18), trimM);
      r.position.set(-14.5 + i * 1.85, 2.2, 15.2); h.add(r);
    }

    // Windows: tall, narrow, in an even rank — and only TWO of them lit. The
    // house is meant to look empty except for whoever is in it.
    const dark = makePaintMaterial(shared, { color: '#232a33', shadowTint: '#12161c', rim: 1.6, bands: 2, grain: 0.06 });
    for (let r = 0; r < 3; r++) {
      for (let i = 0; i < 6; i++) {
        const lit = (r === 1 && i === 2) || (r === 0 && i === 4);
        const mat = lit ? lamplight : dark;
        if (lit) winMats.push(mat);
        const w = new THREE.Mesh(new THREE.PlaneGeometry(2.6, r === 2 ? 2.4 : 4.0), mat);
        w.position.set(-12 + i * 4.8, 4.8 + r * 6.0, 10.06);
        h.add(w);
      }
    }
    group.add(h);

    // A dark treeline behind it — BEHIND. The first pass started the wood
    // forty metres past the far bank and grew it to thirty, which put a
    // hedge of spires in front of the one building the region is for.
    // It stands well back now, and it is low.
    const clump = (() => {
      const parts = [];
      for (let i = 0; i < 3; i++) {
        const g = new THREE.SphereGeometry(0.62, 7, 5, 0, 6.28, 0, 2.0);
        g.scale(1, 1.25, 1);
        g.translate((i - 1) * 0.5, 0.8 + (i % 2) * 0.24, ((i * 7) % 3 - 1) * 0.4);
        parts.push(g.toNonIndexed());
      }
      return mergePN(parts);
    })();
    const trees = [];
    for (let i = 0; i < 1300; i++) {
      const s = 3.2 + rnd() * 4.4;
      trees.push({
        pos: [FAR_EDGE - 220 - Math.pow(rnd(), 0.6) * 700, 1.2, -100 - rnd() * 2500],
        rot: [0, rnd() * 6.28, 0], scale: [s, s * (0.9 + rnd() * 0.6), s],
      });
    }
    const tm = new THREE.InstancedMesh(clump, woodDark, trees.length);
    fillInstances(tm, trees); tm.frustumCulled = false; group.add(tm);
  }

  // =========================================================================
  // A rowing boat on the near mud, and birds standing in the shallows
  // =========================================================================
  const boat = new THREE.Group();
  {
    const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 6, 0, 6.28, 0, 1.57), timber);
    hull.scale.set(1.5, 0.9, 4.6); hull.rotation.z = Math.PI;
    boat.add(hull);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.09, 5, 14), timber);
    rim.rotation.x = Math.PI / 2; rim.scale.set(1.5, 4.6, 1); boat.add(rim);
    for (const bz of [-1.6, 0.4]) {
      const th = new THREE.Mesh(box(2.6, 0.16, 0.5), timber);
      th.position.set(0, -0.35, bz); boat.add(th);
    }
    const oar = new THREE.Mesh(box(0.12, 0.12, 5.2), timber);
    oar.position.set(0.5, -0.2, 0.4); oar.rotation.y = 0.22; boat.add(oar);
    boat.position.set(-58, 0.5, -1180);
    boat.rotation.y = 0.7;
    group.add(boat);
  }
  {
    const birdGeo = (() => {
      const parts = [];
      const b = new THREE.SphereGeometry(1, 7, 5); b.scale(0.5, 0.34, 0.9); b.translate(0, 0.85, 0);
      parts.push(b.toNonIndexed());
      const n = new THREE.CylinderGeometry(0.07, 0.05, 0.7, 5); n.rotateZ(0.5); n.translate(0.2, 1.2, 0.3);
      parts.push(n.toNonIndexed());
      for (const s of [-1, 1]) {
        const l = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 4); l.translate(s * 0.12, 0.4, 0);
        parts.push(l.toNonIndexed());
      }
      return mergePN(parts);
    })();
    const items = [];
    for (let i = 0; i < 46; i++) {
      const s = 1.1 + rnd() * 0.5;
      items.push({
        pos: [NEAR_EDGE - 6 - rnd() * 110, 0.2, -160 - rnd() * 2400],
        rot: [0, rnd() * 6.28, 0], scale: [s, s, s],
      });
    }
    const m = new THREE.InstancedMesh(birdGeo, paleBird, items.length);
    fillInstances(m, items); m.frustumCulled = false; group.add(m);
  }

  function update(t) {
    // the boat lifts on the last of the tide coming back up the channel
    boat.position.y = 0.5 + Math.sin(t * 0.4) * 0.10;
    boat.rotation.z = Math.sin(t * 0.33 + 1.1) * 0.020;
  }
  update(0);

  return { group, update };
}
