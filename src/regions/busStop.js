import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { box, curvedRoof, hill, mulberry, fillInstances } from '../world/geo.js';
import { makePaintMaterial, makeGlowMaterial } from '../world/paintMaterial.js';
import { camphor, shimenawa } from '../world/camphor.js';
import { patchHalo } from '../world/bathhouse.js';

// ---------------------------------------------------------------------------
// The Bus Stop — My Neighbour Totoro, 1988.
//
// Rice country at night, in heavy rain. The fields are flooded, so the water
// the whole world already sits on becomes the paddies for free; all that is
// needed is the earth walls between them and the raised lane running out to
// the stop. Everything is blue except one lamp, which is the entire picture:
// a small light, a long way from anywhere, with the rain crossing it.
//
// Behind it stands the camphor — bigger than it has any business being, roped
// and marked as a shrine, because that is why the village left it standing.
// ---------------------------------------------------------------------------

export function buildBusStop(shared) {
  const group = new THREE.Group();
  const rnd = mulberry(880);

  const earth = makePaintMaterial(shared, {
    color: '#3b3a30', shadowTint: '#0e1420', rim: 0.55, bands: 3, grain: 0.30, grainScale: 1.8,
  });
  const mud = makePaintMaterial(shared, {
    color: '#2e3128', shadowTint: '#0b111c', rim: 0.65, bands: 3, grain: 0.26, grainScale: 2.4,
  });
  const bark = makePaintMaterial(shared, {
    color: '#3a3128', shadowTint: '#0d111b', rim: 0.60, bands: 3, grain: 0.30, grainScale: 1.4,
  });
  const foliage = makePaintMaterial(shared, {
    color: '#2c4433', shadowTint: '#0b1620', rim: 0.55, bands: 3, grain: 0.20, grainScale: 0.55,
    sway: 0.030, translucency: 0.35,
  });
  const timber = makePaintMaterial(shared, {
    color: '#4a3b2c', shadowTint: '#11121c', rim: 0.70, bands: 3, grain: 0.26, grainScale: 2.2,
  });
  const wetTile = makePaintMaterial(shared, {
    color: '#232a35', shadowTint: '#090e18', rim: 1.30, bands: 3, grain: 0.12,
    side: THREE.DoubleSide,
  });
  const plaster = makePaintMaterial(shared, {
    color: '#7d7768', shadowTint: '#1c1f2a', rim: 0.60, bands: 3, grain: 0.18,
  });
  const vermilion = makePaintMaterial(shared, {
    color: '#8e2f28', shadowTint: '#2a0e1a', rim: 1.10, bands: 3, grain: 0.22, grainScale: 1.4,
  });
  const paperMat = makePaintMaterial(shared, {
    color: '#cbbfa4', shadowTint: '#33333a', rim: 0.90, bands: 3, grain: 0.14, side: THREE.DoubleSide,
  });

  // =========================================================================
  // The paddies: a grid of earth walls. The water is already there.
  // =========================================================================
  const Z0 = -1230, Z1 = -3820;
  const bunds = [];
  const fields = [];
  {
    const FW = 26, FL = 34;                    // a field, roughly
    for (const sgn of [-1, 1]) {
      for (let ix = 0; ix < 7; ix++) {
        const x0 = sgn * (16 + ix * FW);
        for (let iz = 0; iz * FL < (Z0 - Z1); iz++) {
          const z0 = Z0 - iz * FL;
          // the grid is not surveyed — it grew
          const jx = (rnd() - 0.5) * 3.4, jz = (rnd() - 0.5) * 4.0;
          const w = FW * (0.86 + rnd() * 0.2), l = FL * (0.84 + rnd() * 0.24);
          const cx = x0 + sgn * w * 0.5 + jx, cz = z0 - l * 0.5 + jz;
          const h = 0.42 + rnd() * 0.22;
          // the two walls that make this field; neighbours share the others
          bunds.push({ pos: [cx, h * 0.5 - 0.06, cz - l * 0.5], scale: [w + 0.9, h, 0.95] });
          bunds.push({ pos: [cx - sgn * w * 0.5, h * 0.5 - 0.06, cz], scale: [0.95, h, l + 0.9] });
          if (Math.abs(cx) < 210) fields.push({ cx, cz, w: w - 2.2, l: l - 2.2 });
        }
      }
    }
    const bundMesh = new THREE.InstancedMesh(box(1, 1, 1), earth, bunds.length);
    fillInstances(bundMesh, bunds);
    bundMesh.frustumCulled = false;
    group.add(bundMesh);
  }

  // ---- rice, standing in the water it grows out of ----
  {
    const tuft = riceTuft(7);
    const items = [];
    const CAP = 21000;
    for (const f of fields) {
      // the near fields are worth planting; the far ones are fog
      const near = Math.abs(f.cx) < 120;
      const n = near ? 46 : 12;
      for (let i = 0; i < n && items.length < CAP; i++) {
        const x = f.cx + (rnd() - 0.5) * f.w;
        const z = f.cz + (rnd() - 0.5) * f.l;
        const s = 0.72 + rnd() * 0.55;
        items.push({
          pos: [x, 0.02, z],
          rot: [(rnd() - 0.5) * 0.13, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.13],
          scale: [s, s * (0.85 + rnd() * 0.35), s],
        });
      }
    }
    const rice = new THREE.InstancedMesh(tuft, foliage, items.length);
    fillInstances(rice, items);
    rice.frustumCulled = false;
    group.add(rice);
  }

  // =========================================================================
  // The lane: raised earth, running from the line out past the stop
  // =========================================================================
  const LANE_Z = -2455;
  {
    const lane = new THREE.Mesh(box(210, 0.86, 5.2), mud);
    lane.position.set(-112, 0.30, LANE_Z);
    lane.rotation.y = 0.035;
    group.add(lane);
    // a shallow verge either side so it does not read as a plank on water
    const verge = new THREE.Mesh(box(210, 0.34, 8.4), earth);
    verge.position.set(-112, 0.02, LANE_Z);
    verge.rotation.y = 0.035;
    group.add(verge);
  }

  // =========================================================================
  // The stop itself. A post, a board, a lamp, and somebody's umbrella.
  // =========================================================================
  const LAMP = new THREE.Vector3(-43.4, 3.62, LANE_Z + 1.5);
  {
    const s = new THREE.Group();
    s.position.set(-42, 0.72, LANE_Z);
    s.rotation.y = -0.28;

    const post = new THREE.Mesh(box(0.26, 3.1, 0.26), timber);
    post.position.y = 1.55; s.add(post);
    const boardBack = new THREE.Mesh(box(1.15, 1.5, 0.09), timber);
    boardBack.position.set(0, 2.5, -0.02); s.add(boardBack);
    const board = new THREE.Mesh(box(1.0, 1.34, 0.07), paperMat);
    board.position.set(0, 2.5, 0.06); s.add(board);
    // the timetable, such as it is: three faint rules on the board
    for (let i = 0; i < 3; i++) {
      const rule = new THREE.Mesh(box(0.62, 0.035, 0.02), timber);
      rule.position.set(0, 2.16 + i * 0.30, 0.11);
      s.add(rule);
    }
    const cap = new THREE.Mesh(curvedRoof(1.5, 0.6, 0.24, { seg: 8, power: 1.5, corner: 0.3, flare: 0.3 }), wetTile);
    cap.position.set(0, 3.30, 0); s.add(cap);

    // the lamp on its own crooked pole — the only warm thing for a mile
    const pole = new THREE.Mesh(box(0.19, 4.2, 0.19), timber);
    pole.position.set(-1.4, 2.1, 1.5);
    pole.rotation.z = 0.035; s.add(pole);
    const arm = new THREE.Mesh(box(0.66, 0.11, 0.11), timber);
    arm.position.set(-1.1, 4.1, 1.5); s.add(arm);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.34, 10, 1, true), wetTile);
    shade.position.set(-0.84, 3.98, 1.5); s.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8), makeGlowMaterial(shared, '#ffcb84', 2.1, { flicker: 0.14 }));
    bulb.position.set(-0.84, 3.80, 1.5); s.add(bulb);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
      patchHalo(makeGlowMaterial(shared, '#ffab52', 0.62, {
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, flicker: 0.14,
      })));
    halo.scale.setScalar(4.6);
    halo.position.set(-0.84, 3.80, 1.5);
    halo.renderOrder = 20;
    s.add(halo);

    // an umbrella left leaning against the post, which is the whole story
    const umb = new THREE.Group();
    umb.position.set(0.42, 0.0, 0.36);
    umb.rotation.set(0, 0.6, -0.22);
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 1.15, 6), timber);
    stick.position.y = 0.57; umb.add(stick);
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.20, 0.86, 8, 1), vermilion);
    canopy.position.y = 0.76; umb.add(canopy);
    s.add(umb);

    group.add(s);
  }

  // =========================================================================
  // The camphor, on its mound, roped
  // =========================================================================
  {
    const TX = -152, TZ = -2545;
    const mound = new THREE.Mesh(hill(46, 9.5, 61, { rough: 0.35, rings: 12, sectors: 20 }), earth);
    mound.position.set(TX, -1.4, TZ);
    group.add(mound);

    const H = 52;
    const { bark: bg, leaf: lg } = camphor(21, { spread: 1.15 });
    const trunk = new THREE.Mesh(bg, bark);
    trunk.scale.setScalar(H);
    trunk.position.set(TX, 7.4, TZ);
    group.add(trunk);
    const crown = new THREE.Mesh(lg, foliage);
    crown.scale.setScalar(H);
    crown.position.set(TX, 7.4, TZ);
    group.add(crown);

    const rope = new THREE.Mesh(shimenawa(4.6), paperMat);
    rope.position.set(TX, 13.4, TZ);
    group.add(rope);

    // a small torii at the foot of the path up
    const t = new THREE.Group();
    t.position.set(TX + 17, 4.4, TZ + 12);
    t.rotation.y = -0.9;
    for (const sx of [-1.5, 1.5]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.21, 4.0, 8), vermilion);
      leg.position.set(sx, 2.0, 0); t.add(leg);
    }
    const lin = new THREE.Mesh(box(4.4, 0.26, 0.34), vermilion);
    lin.position.y = 3.5; t.add(lin);
    const capr = new THREE.Mesh(curvedRoof(5.4, 0.78, 0.30, { seg: 8, power: 1.5, corner: 0.4, flare: 0.35 }), vermilion);
    capr.position.y = 4.0; t.add(capr);
    group.add(t);
  }

  // =========================================================================
  // The country behind: a treeline, two farmhouses, and the hills
  // =========================================================================
  {
    const treeGeo = mergeGeometries([0, 1, 2].map(i => {
      const g = new THREE.IcosahedronGeometry(1, 1).toNonIndexed();
      const p = g.attributes.position;
      for (let v = 0; v < p.count; v++) {
        const n = 0.66 + ((v * 37 + i * 91) % 23) / 46;
        p.setXYZ(v, p.getX(v) * n, p.getY(v) * n * 1.22 + 0.7, p.getZ(v) * n);
      }
      g.computeVertexNormals();
      const out = new THREE.BufferGeometry();
      out.setAttribute('position', p.clone());
      out.setAttribute('normal', g.attributes.normal.clone());
      g.dispose();
      return out;
    }), false);

    const items = [];
    for (let i = 0; i < 1500; i++) {
      const sgn = rnd() > 0.5 ? 1 : -1;
      const x = sgn * (206 + Math.pow(rnd(), 0.6) * 260);
      const z = Z0 + 260 - rnd() * (Z0 - Z1 + 560);
      const h = 7 + rnd() * 13;
      items.push({
        pos: [x, h * 0.42, z],
        rot: [0, rnd() * 3.1, 0],
        scale: [h * (0.42 + rnd() * 0.16), h * 0.5, h * (0.42 + rnd() * 0.16)],
      });
    }
    const wood = new THREE.InstancedMesh(treeGeo, foliage, items.length);
    fillInstances(wood, items);
    wood.frustumCulled = false;
    group.add(wood);

    // hills behind the wood, only ever a silhouette in this weather
    [[-520, -2100, 300, 74, 71], [430, -3050, 350, 88, 73], [-620, -3500, 280, 62, 77]]
      .forEach(([x, z, r, h, seed]) => {
        const m = new THREE.Mesh(hill(r, h, seed, { rough: 0.5, rings: 12, sectors: 20 }), mud);
        m.position.set(x, -8, z);
        group.add(m);
      });

    // two farmhouses, one still awake
    [[-158, -2960, 0.5, true], [126, -2140, -0.8, false]].forEach(([x, z, ry, lit]) => {
      const f = new THREE.Group();
      f.position.set(x, 0.9, z);
      f.rotation.y = ry;
      const body = new THREE.Mesh(box(13, 4.4, 8.5), plaster);
      body.position.y = 2.2; f.add(body);
      const roof = new THREE.Mesh(curvedRoof(16.5, 11.5, 3.6, { seg: 12, power: 1.7, corner: 0.4, flare: 0.22 }), wetTile);
      roof.position.y = 5.1; f.add(roof);
      if (lit) {
        const w = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.0), makeGlowMaterial(shared, '#ffbe76', 1.15, { flicker: 0.05 }));
        w.position.set(-2.0, 2.4, 4.28); f.add(w);
        const wh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
          patchHalo(makeGlowMaterial(shared, '#ff9f4a', 0.34, {
            transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, flicker: 0.05,
          })));
        wh.scale.setScalar(5.0);
        wh.position.set(-2.0, 2.4, 4.4);
        wh.renderOrder = 20;
        f.add(wh);
      }
      group.add(f);
    });
  }

  return {
    group,
    lamp: LAMP,
    bounds: { zNear: -1150, zFar: -3900 },
    update() { /* the rain does the moving here */ },
  };
}

// A clump of rice: a few arching blades off one point, built to height 1.
function riceTuft(seed) {
  const rnd = mulberry(seed);
  const parts = [];
  const n = 6;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd() * 0.6;
    const len = 0.72 + rnd() * 0.42;
    const g = new THREE.PlaneGeometry(0.05, len, 1, 4).toNonIndexed();
    const p = g.attributes.position;
    for (let v = 0; v < p.count; v++) {
      const t = p.getY(v) / len + 0.5;               // 0 root, 1 tip
      p.setX(v, p.getX(v) * (1.0 - t * 0.85));       // taper
      p.setY(v, t * len);
      p.setZ(v, t * t * len * 0.42);                 // arch away
    }
    g.computeVertexNormals();
    g.rotateY(a);
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', p.clone());
    out.setAttribute('normal', g.attributes.normal.clone());
    g.dispose();
    parts.push(out);
  }
  const merged = mergeGeometries(parts, false);
  parts.forEach(p => p.dispose());
  return merged;
}
