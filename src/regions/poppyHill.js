import * as THREE from 'three';
import { box, hill, mulberry, fillInstances, mergePN, hillSampler } from '../world/geo.js';
import { makePaintMaterial, makeGlowMaterial } from '../world/paintMaterial.js';

// ---------------------------------------------------------------------------
// Poppy Hill — From Up on Poppy Hill, 2011.
//
// A port town on a slope in 1963, and a girl who runs a string of signal flags
// up a pole every morning for a boy on a boat who may or may not be looking.
//
// The flags are the subject, so the geography is built to put them in the
// window: the harbour lies along the near side of the line, the hill rises out
// of the far shore of it, and the boarding house stands on a spur that comes
// FORWARD into the water. A hoist of flags on the summit of a hill six hundred
// metres away is a row of pixels. On a headland a hundred and twenty metres
// out it is eleven flags you can count.
// ---------------------------------------------------------------------------

export function buildPoppyHill(shared) {
  const group = new THREE.Group();
  const rnd = mulberry(1963);

  const grassM = makePaintMaterial(shared, { color: '#7e9450', shadowTint: '#2c3a26', rim: 0.55, bands: 3, grain: 0.22, grainScale: 0.55, sway: 0.02, translucency: 0.7 });
  const wallA = makePaintMaterial(shared, { color: '#cfc9b6', shadowTint: '#4a4642', rim: 0.75, bands: 3, grain: 0.16 });
  const wallB = makePaintMaterial(shared, { color: '#b9ad92', shadowTint: '#413c38', rim: 0.75, bands: 3, grain: 0.18 });
  const wallC = makePaintMaterial(shared, { color: '#a3a99e', shadowTint: '#3a3e3b', rim: 0.75, bands: 3, grain: 0.16 });
  const tileA = makePaintMaterial(shared, { color: '#4f6068', shadowTint: '#1c242c', rim: 0.95, bands: 3, grain: 0.14, side: THREE.DoubleSide });
  const tileB = makePaintMaterial(shared, { color: '#a4573f', shadowTint: '#331d1c', rim: 0.95, bands: 3, grain: 0.14, side: THREE.DoubleSide });
  const timber = makePaintMaterial(shared, { color: '#6a5641', shadowTint: '#241d19', rim: 0.85, bands: 3, grain: 0.26, grainScale: 1.4 });
  const concrete = makePaintMaterial(shared, { color: '#9d9a90', shadowTint: '#3b3a3a', rim: 0.6, bands: 3, grain: 0.24, grainScale: 1.8 });
  const hullDark = makePaintMaterial(shared, { color: '#2f3438', shadowTint: '#121518', rim: 1.1, bands: 3, grain: 0.14 });
  const hullRust = makePaintMaterial(shared, { color: '#7c4436', shadowTint: '#2c1a17', rim: 1.0, bands: 3, grain: 0.20 });
  const superM = makePaintMaterial(shared, { color: '#ddd9cd', shadowTint: '#4c4c4a', rim: 1.0, bands: 3, grain: 0.12 });
  const glassM = makeGlowMaterial(shared, '#ffe2ab', 0.30, { flicker: 0.03 });

  const unit = box(1, 1, 1);
  const roofGeo = (() => {
    const g = new THREE.ConeGeometry(0.71, 1, 4, 1);
    g.rotateY(Math.PI / 4); g.translate(0, 0.5, 0);
    return g;
  })();
  const put = (items, geo, mat, ro) => {
    if (!items.length) return null;
    const m = new THREE.InstancedMesh(geo, mat, items.length);
    fillInstances(m, items); m.frustumCulled = false;
    if (ro) m.renderOrder = ro;
    group.add(m);
    return m;
  };

  // =========================================================================
  // The harbour along the near side, the hill out of the far shore of it
  // =========================================================================
  // The quay edge sits close, and its lip is a KERB and not a parapet. At
  // forty metres out with a two-and-a-half-metre wall on it, the wall hid the
  // entire harbour from a seated eye: every ship, every reflection, the lot.
  const QUAY = -22;                       // the near edge of the water
  const FAR = -232;                       // where the far shore starts
  const HX = -560, HZ = -1350, HR = 330, HH = 142;
  const hillSurf = hillSampler(HR, HH, 41, { rough: 0.16 });
  const groundAt = (x, z) => {
    const s = hillSurf(x - HX, z - HZ);
    return s === null ? 1.6 : -4 + s;
  };
  {
    // the quay you are running along
    for (let i = 0; i < 24; i++) {
      const b = new THREE.Mesh(unit, concrete);
      b.position.set(-13 - (Math.abs(QUAY) - 13) / 2, 0.7, -110 - i * 120);
      b.scale.set(Math.abs(QUAY) - 13, 2.2, 120 + rnd() * 20);
      group.add(b);
    }
    const lip = new THREE.Mesh(box(1.6, 1.8, 2700), concrete);
    lip.position.set(QUAY, 0.7, -1350); group.add(lip);
    const bolls = [];
    for (let i = 0; i < 90; i++) bolls.push({ pos: [QUAY + 3, 2.0, -120 - rnd() * 2500], scale: [0.55, 1.4, 0.55] });
    put(bolls, new THREE.CylinderGeometry(1, 1.25, 1, 7), hullDark);

    // the +x side: sheds and cranes, mostly seen out of the corner of an eye
    for (let i = 0; i < 22; i++) {
      const b = new THREE.Mesh(unit, concrete);
      const w = 200 + rnd() * 300;
      b.position.set(13 + w / 2, 0.6, -120 - i * 126);
      b.scale.set(w, 2.0, 126 + rnd() * 26);
      group.add(b);
    }
    for (let i = 0; i < 18; i++) {
      const z = -160 - i * 150;
      const x = 40 + rnd() * 200;
      const shed = new THREE.Mesh(box(40 + rnd() * 60, 12 + rnd() * 10, 40 + rnd() * 50), i % 2 ? wallC : wallB);
      shed.position.set(x, 7, z); group.add(shed);
      if (rnd() > 0.6) {
        const leg = new THREE.Mesh(box(3, 44, 3), hullDark);
        leg.position.set(x - 30, 24, z); group.add(leg);
        const jib = new THREE.Mesh(box(70, 2.4, 2.4), hullDark);
        jib.position.set(x - 60, 44, z); jib.rotation.z = -0.24; group.add(jib);
      }
    }

    // the far shore, and the hill standing straight out of it
    for (let i = 0; i < 24; i++) {
      const b = new THREE.Mesh(unit, grassM);
      b.position.set(FAR - 60, 0.8, -110 - i * 122);
      b.scale.set(120, 3.2, 122 + rnd() * 26);
      group.add(b);
    }
    const h = new THREE.Mesh(hill(HR, HH, 41, { rough: 0.16, rings: 18, sectors: 26 }), grassM);
    h.position.set(HX, -4, HZ); group.add(h);
  }

  // ---- trees over both hills, or they are two bald green domes ----
  {
    const dark = makePaintMaterial(shared, {
      color: '#4a6a3c', shadowTint: '#182619', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.35,
      sway: 0.02, translucency: 0.55,
    });
    const clump = (() => {
      const parts = [];
      for (let i = 0; i < 3; i++) {
        const g = new THREE.IcosahedronGeometry(1, 0);
        const q = g.attributes.position;
        for (let v = 0; v < q.count; v++) {
          const n = 0.74 + ((v * 9 + i * 21) % 14) / 30;
          q.setXYZ(v, q.getX(v) * n, q.getY(v) * n * 0.85, q.getZ(v) * n);
        }
        g.computeVertexNormals();
        const sc = 0.52 + (i % 3) * 0.14;
        g.scale(sc, sc, sc);
        g.translate((i - 1) * 0.40, 0.42 + (i % 2) * 0.26, ((i * 5) % 3 - 1) * 0.34);
        parts.push(g.toNonIndexed());
      }
      return mergePN(parts);
    })();
    const items = [];
    for (let i = 0; i < 2600; i++) {
      const a = rnd() * Math.PI * 2, d = Math.pow(rnd(), 0.5) * (HR + 90);
      const x = HX + Math.cos(a) * d, z = HZ + Math.sin(a) * d;
      const s = 3.5 + rnd() * 7;
      items.push({ pos: [x, groundAt(x, z) - 1, z], rot: [0, rnd() * 6.28, 0], scale: [s, s * (1 + rnd() * 0.6), s] });
    }
    put(items, clump, dark);
  }

  // =========================================================================
  // The town. Bigger than it wants to be, because a nine-metre house on a
  // three-hundred-metre hill is a speck and forty of them are a rash.
  // =========================================================================
  {
    const wallsets = [[], [], []], mats = [wallA, wallB, wallC];
    const roofsA = [], roofsB = [], wins = [];
    for (let ring = 0; ring < 8; ring++) {
      const rr = 322 - ring * 38;
      const n = Math.max(12, Math.round(rr * 0.16));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + ring * 0.29;
        const x = HX + Math.cos(a) * rr, z = HZ + Math.sin(a) * rr;
        const y = groundAt(x, z) - 2;
        if (y < 2) continue;
        const w = 15 + rnd() * 9, dp = 13 + rnd() * 8, ht = 10 + rnd() * 8;
        const ry = a + Math.PI / 2 + (rnd() - 0.5) * 0.22;
        wallsets[(rnd() * 3) | 0].push({ pos: [x, y + ht / 2, z], rot: [0, ry, 0], scale: [w, ht, dp] });
        (rnd() > 0.42 ? roofsA : roofsB).push({
          pos: [x, y + ht + 2.6, z], rot: [0, ry, 0], scale: [(w + 3.4) / 1.42, 5.0 + rnd() * 2.4, (dp + 3.4) / 1.42],
        });
        if (rnd() > 0.45) {
          wins.push({
            pos: [x + Math.cos(ry) * (dp / 2 + 0.06), y + ht * 0.55, z - Math.sin(ry) * (dp / 2 + 0.06)],
            rot: [0, ry + Math.PI / 2, 0], scale: [4.0, 2.2, 1],
          });
        }
      }
    }
    wallsets.forEach((s, i) => put(s, unit, mats[i]));
    put(roofsA, roofGeo, tileA); put(roofsB, roofGeo, tileB);
    put(wins, new THREE.PlaneGeometry(1, 1), glassM, 6);

    // the roads that hold it together: pale contour lines round the hill
    const roads = [];
    for (let ring = 0; ring < 5; ring++) {
      const rr = 300 - ring * 52;
      const n = Math.round(rr * 0.5);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const x = HX + Math.cos(a) * rr, z = HZ + Math.sin(a) * rr;
        roads.push({ pos: [x, groundAt(x, z) - 1.4, z], rot: [0, -a, 0], scale: [7, 0.5, rr * 6.3 / n + 1] });
      }
    }
    put(roads, unit, concrete);

    // telegraph poles beside the line, the way they run beside every Japanese
    // railway ever drawn
    const poles = [], arms = [];
    for (let i = 0; i < 44; i++) {
      const z = -120 - i * 62;
      poles.push({ pos: [-19, 6, z], scale: [0.34, 12, 0.34] });
      arms.push({ pos: [-19, 10.8, z], scale: [3.0, 0.2, 0.2] });
      arms.push({ pos: [-19, 9.6, z], scale: [2.4, 0.18, 0.18] });
    }
    put(poles, new THREE.CylinderGeometry(1, 1.1, 1, 6), timber);
    put(arms, unit, timber);
  }

  // =========================================================================
  // The spur, the boarding house on top of it, and the flags
  // =========================================================================
  const flagSets = [];
  {
    // The spur is LOW. At sixty metres the flags hung between twenty and
    // twenty-seven degrees above the eye — off the top of the window, which
    // is a strange place to put the one thing the region was built for.
    const SX = -196, SZ = -1300, SR = 118, SH = 38;
    const spur = new THREE.Mesh(hill(SR, SH, 88, { rough: 0.20, rings: 14, sectors: 22 }), grassM);
    spur.position.set(SX, -4, SZ); group.add(spur);
    const spurSurf = hillSampler(SR, SH, 88, { rough: 0.20 });
    const spurAt = (x, z) => {
      const s = spurSurf(x - SX, z - SZ);
      return s === null ? 1.6 : -4 + s;
    };
    {
      const bushM = makePaintMaterial(shared, {
        color: '#54733e', shadowTint: '#1b2818', rim: 0.5, bands: 3, grain: 0.24, grainScale: 0.4,
        sway: 0.03, translucency: 0.6,
      });
      const bits = [];
      for (let i = 0; i < 700; i++) {
        const a = rnd() * Math.PI * 2, d = Math.pow(rnd(), 0.55) * SR;
        const x = SX + Math.cos(a) * d, z = SZ + Math.sin(a) * d;
        const s = 2.2 + rnd() * 5;
        bits.push({ pos: [x, spurAt(x, z) - 0.8, z], rot: [0, rnd() * 6.28, 0], scale: [s, s * (0.8 + rnd() * 0.7), s] });
      }
      put(bits, new THREE.IcosahedronGeometry(1, 0), bushM);
    }

    const MY = SH - 10;
    const m = new THREE.Group();
    m.position.set(SX + 12, MY, SZ + 8);
    m.rotation.y = Math.PI / 2 - 0.28;    // its front to the water, like everything here
    const body = new THREE.Mesh(box(26, 13, 17), wallA);
    body.position.y = 6.5; m.add(body);
    const upper = new THREE.Mesh(box(19, 8, 13), wallA);
    upper.position.set(-2, 16.5, 0); m.add(upper);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(17, 7, 4, 1), tileB);
    roof.rotation.y = Math.PI / 4; roof.position.y = 23.5; m.add(roof);
    const porch = new THREE.Mesh(box(11, 0.6, 5), timber);
    porch.position.set(6, 13.4, 9.5); m.add(porch);
    for (let i = 0; i < 4; i++) {
      const p = new THREE.Mesh(box(0.45, 13, 0.45), timber);
      p.position.set(2 + i * 3, 6.5, 11.5); m.add(p);
    }
    for (let r = 0; r < 2; r++) {
      for (let i = 0; i < 5; i++) {
        const w = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.2), glassM);
        w.position.set(-10 + i * 5, 5.4 + r * 10.5, 8.56); m.add(w);
      }
    }
    group.add(m);

    // the pole, and two halyards of flags running down off the top of it
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.4, 30, 7), superM);
    mast.position.set(SX + 34, MY + 15, SZ - 6); group.add(mast);
    const stay = new THREE.Mesh(box(0.1, 0.1, 26), hullDark);
    stay.position.set(SX + 34, MY + 18, SZ + 6); stay.rotation.x = 0.6; group.add(stay);

    // Maritime flags: shape and colour per flag, never one rectangle repeated.
    const COLS = ['#d94f3d', '#f2c33c', '#3d6fb4', '#f0ece0', '#2b3138'];
    const mats2 = COLS.map(c => makePaintMaterial(shared, {
      color: c, shadowTint: '#4a4640', rim: 1.1, bands: 2, grain: 0.08,
      side: THREE.DoubleSide, sway: 0.34, translucency: 1.6,
    }));
    const sets = COLS.map(() => []);
    for (const dir of [1, -1]) {
      for (let k = 0; k < 11; k++) {
        const t = k / 11;
        const y = MY + 29 - t * 26;
        const off = dir * (2 + t * 20);
        sets[(rnd() * 5) | 0].push({
          pos: [SX + 34 + off * 0.30, y, SZ - 6 + off],
          rot: [0, 0.35, 0], scale: [5.2, 3.8, 1],
        });
      }
    }
    sets.forEach((items, i) => {
      const im = put(items, new THREE.PlaneGeometry(1, 1), mats2[i], 7);
      if (im) flagSets.push(im);
    });
  }

  // =========================================================================
  // The harbour: three ships in the water, and a tug that never stops working
  // =========================================================================
  function ship(len, beam, ht, rust) {
    const g = new THREE.Group();
    const h = new THREE.Mesh(box(beam, ht, len), rust ? hullRust : hullDark);
    h.position.y = ht / 2 - 1.4; g.add(h);
    const strake = new THREE.Mesh(box(beam + 0.4, 1.2, len * 0.98), superM);
    strake.position.y = ht - 1.9; g.add(strake);
    const house = new THREE.Mesh(box(beam * 0.72, ht * 0.9, len * 0.16), superM);
    house.position.set(0, ht * 0.9, -len * 0.3); g.add(house);
    const bridge = new THREE.Mesh(box(beam * 0.9, 2.2, len * 0.09), superM);
    bridge.position.set(0, ht * 1.4, -len * 0.3); g.add(bridge);
    const funnel = new THREE.Mesh(new THREE.CylinderGeometry(beam * 0.13, beam * 0.15, ht * 0.75, 8), hullRust);
    funnel.position.set(0, ht * 1.75, -len * 0.34); g.add(funnel);
    for (const mz of [len * 0.28, -len * 0.12]) {
      const mm = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.4, ht * 1.5, 6), superM);
      mm.position.set(0, ht * 1.0, mz); g.add(mm);
      const boom = new THREE.Mesh(box(0.5, 0.5, len * 0.2), superM);
      boom.position.set(0, ht * 1.1, mz + len * 0.08); boom.rotation.x = 0.5; g.add(boom);
    }
    return g;
  }
  const tug = new THREE.Group();
  {
    // one of them has to be AT the station, or the harbour is empty at exactly
    // the moment the region was built to be looked at
    // Out in the middle, not alongside. A hundred-metre hull moored twenty
    // metres off the quay is a grey band across the whole window with its
    // funnel out of shot; the same ship at a hundred and eighty is a SHIP.
    const a = ship(104, 16, 12, false); a.position.set(-176, 0, -1330); a.rotation.y = 0.10; group.add(a);
    const b = ship(126, 19, 14, true); b.position.set(-208, 0, -680); b.rotation.y = -0.07; group.add(b);
    const c = ship(84, 13, 10, true); c.position.set(-150, 0, -2120); c.rotation.y = 0.14; group.add(c);

    const hull = new THREE.Mesh(box(7, 5, 22), hullRust);
    hull.position.y = 1.2; tug.add(hull);
    const house2 = new THREE.Mesh(box(5.4, 4.4, 7), superM);
    house2.position.set(0, 5.6, -2); tug.add(house2);
    const fun = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 4.4, 8), hullDark);
    fun.position.set(0, 9.4, -4); tug.add(fun);
    const mast2 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 9, 6), superM);
    mast2.position.set(0, 10, 1); tug.add(mast2);
    group.add(tug);
  }

  const flagPhase = flagSets.map((_, i) => i * 0.7);

  function update(t) {
    // the tug works up and down the harbour, never getting anywhere
    const w = (t * 11) % 2400;
    tug.position.set(-70 + Math.sin(t * 0.04) * 18, 0, -200 - w);
    tug.rotation.y = Math.PI + Math.sin(t * 0.3) * 0.03;
    // the sway in the shader gives each flag its ripple; this gives the whole
    // hoist its breath
    flagSets.forEach((m, i) => { m.rotation.y = Math.sin(t * 0.5 + flagPhase[i]) * 0.06; });
  }
  update(0);

  return { group, update };
}
