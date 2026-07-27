import * as THREE from 'three';
import { curvedRoof, box, hill, mulberry, fillInstances } from './geo.js';
import { makePaintMaterial, makeGlowMaterial } from './paintMaterial.js';

// Aburaya. Built out of a stack of shrinking tiers, each capped with a sweeping
// roof, each roof hung with lanterns, each wall punched with lit windows.
// It is the only warm thing in the world, and everything else is arranged so
// you keep looking at it.
export function createBathhouse(shared, opts = {}) {
  const group = new THREE.Group();
  const at = opts.position ?? new THREE.Vector3(-300, 0, -210);
  group.position.copy(at);
  group.rotation.y = opts.rotation ?? 0.42;
  const rnd = mulberry(7);

  const lacquer   = makePaintMaterial(shared, { color: '#8e2721', shadowTint: '#2c0d18', rim: 1.15, bands: 3, grain: 0.16 });
  const lacquerLo = makePaintMaterial(shared, { color: '#65211e', shadowTint: '#210b14', rim: 0.9,  bands: 3, grain: 0.16 });
  const tile      = makePaintMaterial(shared, { color: '#2f3946', shadowTint: '#131a2c', rim: 1.35, bands: 3, grain: 0.13, side: THREE.DoubleSide });
  const tileDark  = makePaintMaterial(shared, { color: '#242c39', shadowTint: '#0e1424', rim: 1.2,  bands: 3, grain: 0.13, side: THREE.DoubleSide });
  const timber    = makePaintMaterial(shared, { color: '#4a3a30', shadowTint: '#1a1420', rim: 0.7,  bands: 3, grain: 0.2 });
  const stone     = makePaintMaterial(shared, { color: '#3b3f45', shadowTint: '#141824', rim: 0.6,  bands: 3, grain: 0.24 });
  const rock      = makePaintMaterial(shared, { color: '#1c2622', shadowTint: '#080d14', rim: 0.4, bands: 3, grain: 0.3 });
  const gold      = makePaintMaterial(shared, { color: '#c99a4e', shadowTint: '#4a3320', rim: 1.6,  bands: 3, grain: 0.1 });

  const windowMat = makeGlowMaterial(shared, '#ffc472', 2.6, { flicker: 0.055 });

  // --- the rock the whole thing stands on ---
  const island = new THREE.Mesh(hill(104, 15, 3, { rough: 0.4 }), rock);
  island.position.y = -1.5;
  group.add(island);

  const shelf = new THREE.Mesh(hill(88, 9, 17, { rough: 0.55, rings: 12, sectors: 24 }), rock);
  shelf.position.y = -0.5;
  shelf.scale.set(1.5, 1, 1.25);
  group.add(shelf);

  // --- the stack ---
  // [width, depth, wallHeight, roofRise, roofOverhang, material]
  const tiers = [
    [ 96, 74, 17, 12.0, 11, stone,     0.62 ],
    [ 82, 62, 15, 10.0,  9, lacquerLo, 0.72 ],
    [ 66, 50, 14,  9.0,  8, lacquer,   0.78 ],
    [ 52, 40, 13,  8.0,  7, lacquer,   0.82 ],
    [ 40, 31, 12,  7.0,  6, lacquer,   0.86 ],
    [ 29, 23, 11,  6.0,  5, lacquer,   0.9  ],
    [ 19, 16, 13,  7.5,  4.5, lacquer, 0.94 ],
  ];

  const windowSlots = [];
  const lanternSlots = [];
  let y = 5.0;

  tiers.forEach(([w, d, wh, rr, ov, mat, litness], ti) => {
    // wall
    const wall = new THREE.Mesh(box(w, wh, d), mat);
    wall.position.y = y + wh / 2;
    group.add(wall);

    // a banded sill and a dark base line, so the tiers read separately
    const sill = new THREE.Mesh(box(w + 1.6, 1.1, d + 1.6), timber);
    sill.position.y = y + 0.4;
    group.add(sill);

    // roof
    const roof = new THREE.Mesh(curvedRoof(w + ov * 2, d + ov * 2, rr, {
      power: 1.8, flare: 0.14, corner: 0.36, seg: 18,
    }), ti === 0 ? tileDark : tile);
    roof.position.y = y + wh;
    group.add(roof);

    // ridge beam + a pair of gold finials
    const ridge = new THREE.Mesh(box(w * 0.30, 1.5, d * 0.24), tileDark);
    ridge.position.y = y + wh + rr - 0.4;
    group.add(ridge);

    // windows: two bands per tier, on all four faces
    const rows = wh > 13 ? 2 : 1;
    const cols = Math.max(3, Math.round(w / 7));
    const colsD = Math.max(2, Math.round(d / 7));
    for (let r = 0; r < rows; r++) {
      const wy = y + wh * (rows === 1 ? 0.55 : 0.36 + r * 0.36);
      const place = (count, span, axis) => {
        for (let c = 0; c < count; c++) {
          if (rnd() > litness) continue;
          const f = (c + 0.5) / count - 0.5;
          const jitter = 0.9 + rnd() * 0.3;
          if (axis === 'x') {
            windowSlots.push({ pos: [f * span, wy, d / 2 + 0.16], rot: [0, 0, 0], scale: [1.7 * jitter, 1.25 * jitter, 1] });
            windowSlots.push({ pos: [f * span, wy, -d / 2 - 0.16], rot: [0, Math.PI, 0], scale: [1.7 * jitter, 1.25 * jitter, 1] });
          } else {
            windowSlots.push({ pos: [w / 2 + 0.16, wy, f * span], rot: [0, Math.PI / 2, 0], scale: [1.7 * jitter, 1.25 * jitter, 1] });
            windowSlots.push({ pos: [-w / 2 - 0.16, wy, f * span], rot: [0, -Math.PI / 2, 0], scale: [1.7 * jitter, 1.25 * jitter, 1] });
          }
        }
      };
      place(cols, w * 0.86, 'x');
      place(colsD, d * 0.84, 'z');
    }

    // lanterns strung under the eave, all the way round
    const ey = y + wh + 0.6;
    const ew = w / 2 + ov * 0.72, ed = d / 2 + ov * 0.72;
    const nx = Math.max(4, Math.round(w / 5.2)), nz = Math.max(3, Math.round(d / 5.2));
    for (let i = 0; i < nx; i++) {
      const f = (i + 0.5) / nx - 0.5;
      lanternSlots.push({ pos: [f * ew * 2, ey, ed], scale: 0.62 + rnd() * 0.3 });
      lanternSlots.push({ pos: [f * ew * 2, ey, -ed], scale: 0.62 + rnd() * 0.3 });
    }
    for (let i = 0; i < nz; i++) {
      const f = (i + 0.5) / nz - 0.5;
      lanternSlots.push({ pos: [ew, ey, f * ed * 2], scale: 0.62 + rnd() * 0.3 });
      lanternSlots.push({ pos: [-ew, ey, f * ed * 2], scale: 0.62 + rnd() * 0.3 });
    }

    y += wh + rr * 0.36;
  });

  const topY = y;

  // --- finial on the very top ---
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.9, 6, 8), gold);
  spire.position.y = topY + 3;
  group.add(spire);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 10), gold);
  orb.position.y = topY + 6.6;
  group.add(orb);

  // --- the boiler chimney, off the back ---
  const stack = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.4, 30, 10), stone);
  stack.position.set(-38, 20, -34);
  group.add(stack);

  // --- the town at its feet: stalls and small roofs along the water ---
  const townRoofs = [];
  const townWalls = new THREE.Group();
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2 + rnd() * 0.2;
    const r = 60 + rnd() * 34;
    const px = Math.cos(a) * r, pz = Math.sin(a) * r * 0.82;
    const w = 8 + rnd() * 9, d = 7 + rnd() * 8, h = 5 + rnd() * 5;
    const b = new THREE.Mesh(box(w, h, d), rnd() > 0.55 ? lacquerLo : timber);
    b.position.set(px, 4 + h / 2, pz);
    b.rotation.y = rnd() * Math.PI;
    townWalls.add(b);
    const rf = new THREE.Mesh(curvedRoof(w + 3.6, d + 3.6, h * 0.55, { seg: 8, power: 1.7, corner: 0.3 }), tile);
    rf.position.set(px, 4 + h, pz);
    rf.rotation.y = b.rotation.y;
    townRoofs.push(rf);
    // one lantern per stall
    lanternSlots.push({ pos: [px + (rnd() - 0.5) * 5, 4 + h + 1.2, pz + (rnd() - 0.5) * 5], scale: 0.8 + rnd() * 0.4 });
    if (rnd() > 0.35) {
      windowSlots.push({ pos: [px, 4 + h * 0.5, pz + d / 2 + 0.2], rot: [0, b.rotation.y, 0], scale: [w * 0.34, h * 0.26, 1] });
    }
  }
  group.add(townWalls);
  townRoofs.forEach(r => group.add(r));

  // --- instanced windows + lanterns ---
  const winGeo = new THREE.PlaneGeometry(1, 1);
  const windows = new THREE.InstancedMesh(winGeo, windowMat, windowSlots.length);
  fillInstances(windows, windowSlots);
  windows.frustumCulled = false;
  group.add(windows);

  const lampMat = makeGlowMaterial(shared, '#ffb055', 3.2, { flicker: 0.10 });
  const lanternGeo = new THREE.SphereGeometry(0.72, 8, 6);
  lanternGeo.scale(1, 1.22, 1);
  const lanterns = new THREE.InstancedMesh(lanternGeo, lampMat, lanternSlots.length);
  fillInstances(lanterns, lanternSlots);
  lanterns.frustumCulled = false;
  group.add(lanterns);

  // a soft halo billboard around each lantern so the light bleeds into the air
  const haloMat = makeGlowMaterial(shared, '#ff9c3c', 0.46, {
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, flicker: 0.10,
  });
  patchHalo(haloMat);
  const halos = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), haloMat, lanternSlots.length);
  fillInstances(halos, lanternSlots.map(s => ({ ...s, scale: (typeof s.scale === 'number' ? s.scale : 1) * 7.5 })));
  halos.frustumCulled = false;
  halos.renderOrder = 20;
  group.add(halos);

  return {
    group,
    glowCenter: new THREE.Vector3(at.x, 46, at.z),
    height: topY,
    halos,
  };
}

// Turn a glow material into a camera-facing soft blob.
export function patchHalo(mat) {
  mat.vertexShader = /* glsl */`
    varying vec3 vWorld;
    varying float vSeed;
    varying vec2 vUv;
    void main(){
      vUv = uv;
      #ifdef USE_INSTANCING
        mat4 mm = modelMatrix * instanceMatrix;
      #else
        mat4 mm = modelMatrix;
      #endif
      vec3 center = mm[3].xyz;
      vSeed = fract(dot(center, vec3(0.1731, 0.7219, 0.2903))) * 57.0;
      float sx = length(mm[0].xyz), sy = length(mm[1].xyz);
      vec4 mv = viewMatrix * vec4(center, 1.0);
      mv.xy += position.xy * vec2(sx, sy);
      vWorld = center;
      gl_Position = projectionMatrix * mv;
    }`;
  mat.fragmentShader = mat.fragmentShader.replace(
    'varying float vSeed;',
    'varying float vSeed;\n      varying vec2 vUv;'
  ).replace(
    'gl_FragColor = vec4(col, 1.0);',
    `float r = length(vUv - 0.5) * 2.0;
       float k = clamp(1.0 - r, 0.0, 1.0);
       float a = pow(k, 3.6) * 0.85 + pow(k, 13.0) * 0.7;
       if (a < 0.0025) discard;
       gl_FragColor = vec4(col * a, a);`
  );
  mat.needsUpdate = true;
  return mat;
}
