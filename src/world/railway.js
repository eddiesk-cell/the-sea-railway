import * as THREE from 'three';
import { box, curvedRoof, mulberry, fillInstances } from './geo.js';
import { makePaintMaterial, makeGlowMaterial } from './paintMaterial.js';
import { patchHalo } from './bathhouse.js';

const RAIL_HALF = 0.78;
const TRACK_LEN = 11000;

// ---------------------------------------------------------------------------
// The pane in the carriage window.
//
// Four things, all faint, which together are the difference between glass and
// a hole cut in a wall:
//   the sky lying along the top of the pane, because glass at a shallow angle
//   is a mirror; two long streaks of glare drifting slowly across it; a haze
//   of dust and old handprints that stays put; and the frame brightening at
//   the edges where the glass is bedded into it.
// All of it is additive and all of it is WEAK — the first pass was twice this
// strength and over a bright morning sky it milked the whole window out, which
// is a dirty window, not a clean one. It borrows the horizon and sun
// colours from the sky the region is currently in, so the glare in the Ink
// Country is grey paper and the glare over the Adriatic is white noon — and
// it fades out entirely where the world is ink, since brushed paper has no
// window in it.
// ---------------------------------------------------------------------------
function glassMaterial(shared, paneW, paneH) {
  return new THREE.ShaderMaterial({
    uniforms: Object.assign({ uPane: { value: new THREE.Vector2(paneW, paneH) } }, shared),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform float uTime;
      uniform float uInk;
      uniform vec3 uHorizon;
      uniform vec3 uSunTint;
      uniform vec2 uPane;
      varying vec2 vUv;

      float h21(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
      float smear(vec2 p){
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(h21(i), h21(i + vec2(1,0)), f.x),
                   mix(h21(i + vec2(0,1)), h21(i + vec2(1,1)), f.x), f.y);
      }

      void main(){
        // Work in METRES along the pane, not in uv. The pane is seventeen
        // metres long and the eye only ever sees about three of them, so
        // anything sized in uv is either invisible or one enormous smear.
        vec2 p = vUv * uPane;

        // the sky lying along the top of the pane
        float sky = pow(smoothstep(0.35, 1.0, vUv.y), 2.0) * 0.085;

        // two streaks, leaning, sliding past at walking pace. A reflection in
        // a moving window travels; one that sits still is a smudge.
        float d1 = (p.x * 0.92 + p.y * 0.55 - uTime * 0.42) / 2.6;
        float d2 = (p.x * 0.80 - p.y * 0.40 - uTime * 0.26) / 4.1;
        float g1 = exp(-pow(fract(d1) - 0.5, 2.0) * 38.0) * 0.095;
        float g2 = exp(-pow(fract(d2) - 0.5, 2.0) * 110.0) * 0.055;

        // dust and old hands, fixed to the glass
        float dust = smear(p * 0.9) * 0.6 + smear(p * 3.1) * 0.4;
        dust = smoothstep(0.58, 1.0, dust) * 0.030;

        // and the bedding along the top and bottom edges
        float edge = (1.0 - smoothstep(0.0, 0.13, vUv.y)) + smoothstep(0.87, 1.0, vUv.y);
        edge = clamp(edge, 0.0, 1.0) * 0.045;

        vec3 col = uHorizon * (sky + edge) + uSunTint * (g1 + g2) + vec3(0.9, 0.92, 1.0) * dust;
        gl_FragColor = vec4(col * (1.0 - uInk * 0.85), 1.0);
      }`,
  });
}

// The single line of track running out across the flooded plain, the little
// platform you are standing on, and the train that comes through it.
export function createRailway(shared) {
  const group = new THREE.Group();
  const rnd = mulberry(19);

  const ballast = makePaintMaterial(shared, { color: '#3a3d42', shadowTint: '#131826', rim: 0.5, bands: 3, grain: 0.28, grainScale: 1.6 });
  const wetStone = makePaintMaterial(shared, { color: '#2a2e36', shadowTint: '#0d1220', rim: 0.9, bands: 3, grain: 0.3, grainScale: 2.2 });
  const sleeper = makePaintMaterial(shared, { color: '#312720', shadowTint: '#0f1220', rim: 0.55, bands: 2, grain: 0.3, grainScale: 3.0 });
  const steel = makePaintMaterial(shared, { color: '#6e7480', shadowTint: '#20242e', rim: 1.9, bands: 4, grain: 0.06 });
  const wood = makePaintMaterial(shared, { color: '#4a3729', shadowTint: '#16111c', rim: 0.55, bands: 3, grain: 0.24, grainScale: 2.4 });
  const woodDark = makePaintMaterial(shared, { color: '#3d2f26', shadowTint: '#120f1c', rim: 0.6, bands: 3, grain: 0.26, grainScale: 2.4 });
  const tile = makePaintMaterial(shared, { color: '#232b38', shadowTint: '#0c111e', rim: 0.75, bands: 3, grain: 0.14, side: THREE.DoubleSide });
  const paper = makePaintMaterial(shared, { color: '#d9c9a4', shadowTint: '#4a4032', rim: 1.0, bands: 3, grain: 0.14 });

  // The line is twenty-four kilometres long and none of it has to exist at
  // once: everything uniform about the track lives in a group that travels
  // with the camera, snapped to the sleeper pitch so nothing appears to slide.
  const track = new THREE.Group();
  group.add(track);

  // ---- embankment: a wide drowned shelf, a dry crown on top ----
  const shelf = new THREE.Mesh(box(11.5, 1.0, TRACK_LEN), wetStone);
  shelf.position.y = -0.22;
  track.add(shelf);

  const crown = new THREE.Mesh(box(7.6, 0.9, TRACK_LEN), ballast);
  crown.position.y = 0.30;
  track.add(crown);

  // ---- sleepers ----
  const near = 4800, spacing = 1.55;
  const nSleep = Math.floor((near * 2) / spacing);
  const sleepers = new THREE.InstancedMesh(box(5.0, 0.30, 0.62), sleeper, nSleep);
  const items = [];
  for (let i = 0; i < nSleep; i++) {
    const z = -near + i * spacing;
    items.push({ pos: [(rnd() - 0.5) * 0.12, 0.76, z], rot: [0, (rnd() - 0.5) * 0.02, (rnd() - 0.5) * 0.03] });
  }
  fillInstances(sleepers, items);
  sleepers.frustumCulled = false;
  track.add(sleepers);

  // ---- rails ----
  for (const sx of [-RAIL_HALF, RAIL_HALF]) {
    const rail = new THREE.Mesh(box(0.16, 0.24, TRACK_LEN), steel);
    rail.position.set(sx, 1.02, 0);
    track.add(rail);
  }

  // ---- the platform ----
  const plat = new THREE.Group();
  plat.position.set(5.6, 0, 4);
  group.add(plat);

  const deck = new THREE.Mesh(box(6.4, 0.34, 24), wood);
  deck.position.y = 1.28;
  plat.add(deck);
  const facing = new THREE.Mesh(box(6.7, 1.5, 24.3), woodDark);
  facing.position.y = 0.5;
  plat.add(facing);

  for (let i = -5; i <= 5; i++) {
    const post = new THREE.Mesh(box(0.34, 2.6, 0.34), woodDark);
    post.position.set(-3.0, -0.2, i * 2.2);
    plat.add(post);
    const post2 = post.clone(); post2.position.x = 3.0;
    plat.add(post2);
  }

  // shelter over the far half
  const shelterY = 1.45;
  for (const [px, pz] of [[-2.5, -7.5], [2.5, -7.5], [-2.5, 1.5], [2.5, 1.5]]) {
    const p = new THREE.Mesh(box(0.3, 3.2, 0.3), woodDark);
    p.position.set(px, shelterY + 1.6, pz);
    plat.add(p);
  }
  const shelterRoof = new THREE.Mesh(curvedRoof(8.2, 13.5, 1.9, { seg: 10, power: 1.7, corner: 0.3, flare: 0.16 }), tile);
  shelterRoof.position.set(0, shelterY + 3.2, -3.0);
  plat.add(shelterRoof);

  // bench
  const bench = new THREE.Mesh(box(0.9, 0.2, 5.0), woodDark);
  bench.position.set(-2.0, 1.95, -3.0);
  plat.add(bench);
  for (const bz of [-5, -1]) {
    const bl = new THREE.Mesh(box(0.7, 0.6, 0.24), woodDark);
    bl.position.set(-2.0, 1.6, bz);
    plat.add(bl);
  }

  // the sign
  const signPost = new THREE.Mesh(box(0.22, 3.0, 0.22), woodDark);
  signPost.position.set(2.2, 2.9, 8.0);
  plat.add(signPost);
  const signBoard = new THREE.Mesh(box(0.14, 1.05, 3.4), paper);
  signBoard.position.set(2.2, 3.9, 8.0);
  plat.add(signBoard);

  // the lamp — the one warm thing within reach
  const lampPost = new THREE.Mesh(box(0.2, 4.2, 0.2), woodDark);
  lampPost.position.set(-2.6, 3.5, 6.5);
  plat.add(lampPost);
  const lampArm = new THREE.Mesh(box(1.1, 0.14, 0.14), woodDark);
  lampArm.position.set(-2.1, 5.5, 6.5);
  plat.add(lampArm);

  // a paper lantern: a soft barrel of light with dark caps and a bleed of glow
  const lampGeo = new THREE.SphereGeometry(0.40, 12, 10);
  lampGeo.scale(1, 1.28, 1);
  const lampMat = makeGlowMaterial(shared, '#ffb765', 1.45, { flicker: 0.09 });
  const lamp = new THREE.Mesh(lampGeo, lampMat);
  lamp.position.set(-1.6, 5.05, 6.5);
  plat.add(lamp);
  for (const cy of [5.05 + 0.46, 5.05 - 0.46]) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.10, 10), woodDark);
    cap.position.set(-1.6, cy, 6.5);
    plat.add(cap);
  }
  const lampHalo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
    patchHalo(makeGlowMaterial(shared, '#ff9c3c', 0.75, {
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, flicker: 0.09,
    })));
  lampHalo.scale.setScalar(5.2);
  lampHalo.position.set(-1.6, 5.05, 6.5);
  lampHalo.renderOrder = 20;
  plat.add(lampHalo);

  const lampWorld = new THREE.Vector3(5.6 - 1.6, 5.15, 4 + 6.5);

  // snap to the sleeper pitch: at any other offset the ties visibly crawl
  const follow = (z) => { track.position.z = Math.round(z / spacing) * spacing; };

  return { group, lampWorld, lampMat, platform: plat, follow };
}

// ---------------------------------------------------------------------------
// The train. Comes out of the haze, runs the length of the world, and is gone.
// ---------------------------------------------------------------------------
export function createTrain(shared) {
  const group = new THREE.Group();

  const shell = makePaintMaterial(shared, { color: '#2b3630', shadowTint: '#0c1220', rim: 1.5, bands: 3, grain: 0.12 });
  const trim = makePaintMaterial(shared, { color: '#4a3128', shadowTint: '#140f1c', rim: 1.1, bands: 3, grain: 0.14 });
  const steel = makePaintMaterial(shared, { color: '#5a6068', shadowTint: '#181c26', rim: 1.7, bands: 4, grain: 0.08 });

  // Windows with people in them, drawn procedurally in the fragment shader:
  // a row of lit panes, some with a shoulders-and-head silhouette sitting still.
  const winMat = makeGlowMaterial(shared, '#ffc274', 1.25, { flicker: 0.03 });
  winMat.fragmentShader = winMat.fragmentShader
    .replace('varying float vSeed;', 'varying float vSeed;\n      varying vec2 vUv;\n      uniform float uPanes;')
    .replace('gl_FragColor = vec4(col, 1.0);', /* glsl */`
       vec2 uv = vUv;
       float cell = floor(uv.x * uPanes);
       float fx = fract(uv.x * uPanes);
       // pane frame
       float frame = smoothstep(0.0, 0.10, fx) * smoothstep(1.0, 0.90, fx)
                   * smoothstep(0.0, 0.14, uv.y) * smoothstep(1.0, 0.86, uv.y);
       float h = fract(sin(cell * 12.9898 + vSeed) * 43758.5453);
       // a passenger, sitting very still: head, then shoulders
       float body = 0.0;
       if (h > 0.52){
         float cx = 0.32 + h * 0.36;
         vec2 q = vec2(fx - cx, uv.y);
         float head  = smoothstep(0.085, 0.062, length(q * vec2(1.0, 0.92) - vec2(0.0, 0.46)));
         float shldr = smoothstep(0.235, 0.185, length(q * vec2(0.62, 1.25) - vec2(0.0, 0.10)));
         body = clamp(head + shldr, 0.0, 1.0) * step(uv.y, 0.62);
       }
       vec3 lit = col * (0.55 + 0.45 * (1.0 - abs(uv.y - 0.55) * 1.2));
       vec3 outc = mix(vec3(0.02, 0.025, 0.04), lit, frame);
       outc = mix(outc, vec3(0.012, 0.02, 0.035), body * frame * 0.94);
       gl_FragColor = vec4(outc, 1.0);`);
  winMat.uniforms.uPanes = { value: 9.0 };
  winMat.vertexShader = winMat.vertexShader
    .replace('varying float vSeed;', 'varying float vSeed;\n      varying vec2 vUv;')
    .replace('void main(){', 'void main(){\n        vUv = uv;');
  winMat.needsUpdate = true;

  const headMat = makeGlowMaterial(shared, '#fff0cf', 2.4);

  const CAR_LEN = 17, CAR_W = 3.9, CAR_H = 3.7;
  const cars = 5;
  for (let i = 0; i < cars; i++) {
    const z = i * (CAR_LEN + 1.6);
    const car = new THREE.Group();
    car.position.z = z;

    const body = new THREE.Mesh(box(CAR_W, CAR_H, CAR_LEN), shell);
    body.position.y = 2.9;
    car.add(body);

    const roof = new THREE.Mesh(box(CAR_W + 0.24, 0.5, CAR_LEN + 0.3), trim);
    roof.position.y = 2.9 + CAR_H / 2 + 0.16;
    car.add(roof);

    const skirt = new THREE.Mesh(box(CAR_W - 0.5, 1.0, CAR_LEN - 0.6), steel);
    skirt.position.y = 1.45;
    car.add(skirt);

    for (const sx of [-1, 1]) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(CAR_LEN * 0.88, 1.62), winMat);
      win.position.set(sx * (CAR_W / 2 + 0.03), 3.61, 0);
      win.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2;
      car.add(win);
    }

    // ---- the inside of the left-hand wall, for the seat by the window ----
    // A box shows nothing from within — its faces point outward — so the wall
    // you look through is built as its own inward panels with a gap left for
    // the glass. Only this one wall: anything else just clutters the frame.
    const inner = makePaintMaterial(shared, {
      color: '#2c2119', shadowTint: '#0a0910', rim: 0.45, bands: 2, grain: 0.24, grainScale: 2.0,
    });
    const seatMat = makePaintMaterial(shared, {
      color: '#26382e', shadowTint: '#0c1216', rim: 0.5, bands: 2, grain: 0.2, grainScale: 2.2,
    });
    const inX = -(CAR_W / 2 - 0.07);
    // A picture window, not a letterbox. It grew upward — that is where the
    // view is, since a train window's whole job is mountains and sky — and
    // the mullions went from five to three, so the pane you are actually
    // sitting in front of is five and a half metres wide instead of three.
    // The ceiling of it is set by the eye, not by taste: sitting 1.88 m off
    // the glass with a 52° lens, anything above 4.35 is outside the frame —
    // and a window whose frame you cannot see is not a window, it is a hole,
    // which is exactly how the first, greedier version of this came out.
    const WTOP = 4.34, WBOT = 2.72, FLOOR = 1.46;
    const header = new THREE.Mesh(box(0.12, 4.68 - WTOP, CAR_LEN - 0.2), inner);
    header.position.set(inX, (4.68 + WTOP) / 2, 0);
    car.add(header);
    // the sill runs all the way to the floor: a seated eye sees a good deal
    // below the glass, and if it stops short you are looking at open sky
    const sill = new THREE.Mesh(box(0.20, WBOT - FLOOR, CAR_LEN - 0.2), inner);
    sill.position.set(inX, (WBOT + FLOOR) / 2, 0);
    car.add(sill);
    for (let m = -1; m <= 1; m++) {
      const mull = new THREE.Mesh(box(0.12, WTOP - WBOT, 0.22), inner);
      mull.position.set(inX, (WTOP + WBOT) / 2, m * (CAR_LEN / 3));
      car.add(mull);
    }
    // ---- the glass itself ----
    // Until now the window was a hole. A hole and a pane look identical until
    // something crosses the pane, so this adds the two things that only glass
    // does: the sky lying along the top of it, and a soft streak of glare
    // sliding across as the world goes by. It is additive and weak on purpose
    // — glass you notice is a dirty window, glass you don't notice is a hole.
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(CAR_LEN - 0.24, WTOP - WBOT),
                                 glassMaterial(shared, CAR_LEN - 0.24, WTOP - WBOT));
    glass.position.set(inX + 0.05, (WTOP + WBOT) / 2, 0);
    glass.rotation.y = Math.PI / 2;
    glass.renderOrder = 30;
    car.add(glass);
    // and the ends, so the carriage is a room rather than a strip of wall
    for (const ez of [-1, 1]) {
      const end = new THREE.Mesh(box(2.90, 4.68 - FLOOR, 0.14), inner);
      end.position.set(inX + 1.45, (4.68 + FLOOR) / 2, ez * (CAR_LEN / 2 - 0.1));
      car.add(end);
    }
    const floorPanel = new THREE.Mesh(box(2.90, 0.12, CAR_LEN - 0.2), inner);
    floorPanel.position.set(inX + 1.45, FLOOR, 0);
    car.add(floorPanel);
    const ceiling = new THREE.Mesh(box(2.90, 0.12, CAR_LEN - 0.2), inner);
    ceiling.position.set(inX + 1.45, 4.68, 0);
    car.add(ceiling);

    const bench = new THREE.Mesh(box(1.0, 0.20, CAR_LEN - 1.6), seatMat);
    bench.position.set(inX + 0.56, 2.30, 0);
    car.add(bench);
    // the seat back stops below the glass now, or it eats the bottom of the
    // window it is supposed to be sitting under
    const backRest = new THREE.Mesh(box(0.14, 0.40, CAR_LEN - 1.6), seatMat);
    backRest.position.set(inX + 0.13, 2.50, 0);
    car.add(backRest);
    for (const bz of [-CAR_LEN * 0.28, 0, CAR_LEN * 0.28]) {
      const leg = new THREE.Mesh(box(0.9, 0.72, 0.16), inner);
      leg.position.set(inX + 0.60, 1.88, bz);
      car.add(leg);
    }

    for (const wz of [-CAR_LEN * 0.32, CAR_LEN * 0.32]) {
      for (const wx of [-RAIL_HALF, RAIL_HALF]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.2, 10), steel);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 1.1, wz);
        car.add(wheel);
      }
    }
    group.add(car);
  }

  // the headlamp, up front
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), headMat);
  head.position.set(0, 3.4, -CAR_LEN / 2 - 0.4);
  group.add(head);

  group.visible = false;
  const totalLen = cars * (CAR_LEN + 1.6);

  return { group, totalLen, winMat };
}
