import * as THREE from 'three';
import { NOISE, SKY } from './atmosphere.glsl.js';

// ---------------------------------------------------------------------------
// Millions of blades, one draw call.
//
// Nothing about a blade is stored. Each instance knows only its own number.
// From that number the vertex shader works out which tile of the world it
// belongs to — relative to whichever tile the camera is standing in — hashes
// the tile and the number together to get a stable position inside it, and
// hashes again for height, width, lean, and colour. Move the camera and the
// field rebuilds itself around you, in the shader, for free: the blades you
// walk away from become the blades ahead of you, and because the hash is keyed
// to world tiles and not to the camera, none of them move.
//
// The only per-instance memory in the whole system is one float: the number.
// ---------------------------------------------------------------------------

const TILE = 6.0;        // world units per tile
const TILES = 34;        // tiles across the field, centred on the camera
const PER_TILE = 2048;   // blades per tile
export const MAX_BLADES = TILES * TILES * PER_TILE;   // 2,367,488

// A blade: three tapering quads and a point. Five triangles, seven vertices.
function bladeGeometry() {
  const widths = [1.0, 0.80, 0.50];
  const pos = [], uv = [], idx = [];
  for (let i = 0; i < 3; i++) {
    const v = i / 3, w = widths[i];
    pos.push(-w, v, 0, w, v, 0);
    uv.push(0, v, 1, v);
  }
  pos.push(0, 1, 0); uv.push(0.5, 1);
  idx.push(0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4, 4, 5, 6);

  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

// The tiles of the field, numbered NEAREST FIRST.
//
// A blade's seed says which tile it belongs to, and the tiles used to be
// numbered in raster order. That meant lowering the blade count did not thin
// the field — it cut whole ROWS off one side of it. At the default count the
// grass reached a hundred metres one way and thirty the other, and thirty
// metres is well inside the distance blades fade over, so on that side they did
// not fade at all: they simply stopped, in a straight line, a few metres from
// the window. Eddie: "the grasses still disappeared suddenly before screen
// passes."
//
// Numbered nearest-first, ANY count draws a centred disc — and the radius of
// that disc is known, so the fade can be made to finish inside it whatever the
// slider says.
const TILE_ORDER = (() => {
  const all = [];
  for (let i = 0; i < TILES * TILES; i++) {
    const tx = (i % TILES) - TILES / 2, ty = Math.floor(i / TILES) - TILES / 2;
    all.push({ i, d: Math.hypot(tx + 0.5, ty + 0.5) });
  }
  all.sort((a, b) => a.d - b.d);
  return all.map(o => o.i);
})();

// How far the field actually reaches at a given blade count, less a tile for
// the ragged edge of the disc.
function radiusFor(n) {
  const tiles = Math.max(1, Math.floor(n / PER_TILE));
  return Math.max(TILE, Math.min(TILE * TILES * 0.5 - TILE,
                                 TILE * (Math.sqrt(tiles / Math.PI) - 1.0)));
}

export function createGrass(shared, opts = {}) {
  const geo = bladeGeometry();

  // the one float each blade gets — its tile taken from the nearest-first list
  const seeds = new Float32Array(MAX_BLADES);
  for (let i = 0; i < MAX_BLADES; i++) {
    seeds[i] = TILE_ORDER[(i / PER_TILE) | 0] * PER_TILE + (i % PER_TILE);
  }
  geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
  geo.instanceCount = opts.count ?? 1_600_000;
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);

  const uniforms = Object.assign({
    uCamXZ:   { value: new THREE.Vector2() },
    uTile:    { value: TILE },
    uTiles:   { value: TILES },
    uPerTile: { value: PER_TILE },
    uRadius:  { value: radiusFor(opts.count ?? 1_600_000) },
    uHeight:  { value: 0.95 },
    uDensity: { value: 1.0 },
    uBathXZ:  { value: new THREE.Vector2(-268, -198) },
    // The eight domes of land nearest the camera, refilled as you travel —
    // so the field grows on whatever country you are standing in, not only on
    // the first one. xy = centre, z = radius, w = height.
    uHills:   { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, 0, 0)) },
    // ...and the two things that make a dome the shape it actually is: the
    // four noise offsets that roughen its rim, and (base height, roughness).
    // Without these the shader draws a smooth hemisphere over a lumpy one and
    // plants grass fifteen metres in the air near the edges, which is exactly
    // what the trees did before hillSampler existed.
    uHillO:   { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, 0, 0)) },
    uHillB:   { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, 0, 0)) },
    // Flat land, which is most of it: a town shelf, a field, a courtyard.
    // xy = centre, zw = half extents; uPadY.x = the height of the top.
    uPads:    { value: Array.from({ length: 4 }, () => new THREE.Vector4(0, 0, 0, 0)) },
    uPadY:    { value: Array.from({ length: 4 }, () => new THREE.Vector4(0, 0, 0, 0)) },
    uBlade:   { value: new THREE.Color('#5f7a33').convertSRGBToLinear() },
    uBladeLo: { value: new THREE.Color('#1a2a22').convertSRGBToLinear() },
    uFogColor:{ value: new THREE.Vector3(0.5, 0.5, 0.55) },
  }, shared);

  const mat = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      precision highp float;
      attribute float aSeed;
      uniform float uTime, uTile, uTiles, uPerTile, uRadius, uHeight, uDensity;
      uniform vec2  uCamXZ, uBathXZ;
      uniform vec4  uHills[8], uHillO[8], uHillB[8], uPads[4], uPadY[4];
      varying vec3  vWorld, vNrm;
      varying float vH, vTint, vLean;
      ${NOISE}

      vec3 hash33(vec3 p3){
        p3 = fract(p3 * vec3(0.1031, 0.1030, 0.0973));
        p3 += dot(p3, p3.yxz + 33.33);
        return fract((p3.xxy + p3.yxx) * p3.zyx);
      }
      // two octaves is plenty when it runs seven million times a frame
      float n2(vec2 p){ return vnoise(p) * 0.66 + vnoise(p * 2.17 + 5.1) * 0.34; }

      // The height of the land under a point, and how far inland it is.
      //
      // This is hillSampler() from geo.js, line for line, and it has to stay
      // that way: the roughness is applied to the RADIUS, so the height at a
      // given distance can only be recovered by solving for it, which is what
      // the four fixed-point steps are. A smooth hemisphere is not an
      // approximation of this surface — near the rim it is out by a quarter
      // of the hill's height.
      float landAt(vec2 p, out float inland){
        float y = -1e5; inland = 0.0;
        for (int i = 0; i < 8; i++){
          float r = uHills[i].z;
          if (r <= 0.0) continue;
          vec2 d2 = p - uHills[i].xy;
          float D = length(d2);
          if (D >= r * 1.28) continue;
          vec4 o = uHillO[i];
          float a = atan(d2.y, d2.x);
          float n = sin(a *  3.0 + o.x) * 0.34 + sin(a *  5.0 + o.y) * 0.22
                  + sin(a *  9.0 + o.z) * 0.12 + sin(a * 17.0 + o.w) * 0.06;
          float rough = uHillB[i].y;
          float u = D / r;
          for (int k = 0; k < 4; k++){
            if (u >= 1.0) break;
            float yy = sqrt(max(0.0, 1.0 - u * u));
            float s = max(0.2, 1.0 + n * rough * (1.0 - yy * 0.55));
            u = D / (r * s);
          }
          if (u >= 1.0) continue;
          float yy = sqrt(max(0.0, 1.0 - u * u));
          y = max(y, uHillB[i].x + yy * uHills[i].w * (1.0 + n * rough * 0.35));
          inland = max(inland, smoothstep(1.0, 0.82, u));
        }
        // flat land: a shelf, a field, a courtyard. Grass stops a metre or two
        // short of the edge, because turf growing to a sheer drop looks pasted.
        for (int i = 0; i < 4; i++){
          if (uPads[i].z <= 0.0) continue;
          vec2 q = abs(p - uPads[i].xy) - uPads[i].zw;
          float e = max(q.x, q.y);
          if (e >= 0.0) continue;
          y = max(y, uPadY[i].x);
          inland = max(inland, smoothstep(-0.5, -4.0, e));
        }
        return y;
      }

      void main(){
        // ---- which tile, and where in it ----
        float tileIdx = floor(aSeed / uPerTile);
        float local   = aSeed - tileIdx * uPerTile;
        vec2  tc      = vec2(mod(tileIdx, uTiles), floor(tileIdx / uTiles)) - uTiles * 0.5;
        vec2  cell    = floor(uCamXZ / uTile) + tc;

        vec3 r1 = hash33(vec3(cell, local));
        vec3 r2 = hash33(vec3(cell.yx + 31.7, local + 0.61));

        vec2 wxz = (cell + r1.xy) * uTile;
        float ax = abs(wxz.x);

        // ---- is this point on dry land? ----
        float inland;
        float landY = landAt(wxz, inland);
        float onLand = step(-1e4, landY) * inland;

        // ---- where grass is allowed to grow ----
        float bank  = smoothstep(3.7, 4.5, ax) * (1.0 - smoothstep(5.6, 10.5, ax));
        float shall = smoothstep(0.56, 0.78, n2(wxz * 0.021 + 11.0)) * smoothstep(6.0, 9.5, ax);
        // meadow: dense on the hillsides, thinning in patches the way real turf does
        float meadow = onLand * mix(0.72, 1.0, smoothstep(0.34, 0.72, n2(wxz * 0.035 + 41.0)));

        float dens  = clamp(max(bank + shall * 0.80, meadow), 0.0, 1.0) * uDensity;
        dens *= smoothstep(95.0, 150.0, distance(wxz, uBathXZ));   // the town keeps its floor

        // ---- ground: the hill if there is one, else the drowned shelf, then water ----
        float ground = mix(0.28 * (1.0 - smoothstep(5.2, 7.4, ax)), landY, onLand);

        float dist = distance(wxz, uCamXZ);
        // full height for most of the field, then down over the last third of
        // it — starting the fade at 0.40 left more than half the visible grass
        // half-height for no reason anybody could see
        float fade = 1.0 - smoothstep(uRadius * 0.62, uRadius, dist);

        if (r2.z > dens || fade <= 0.002) {
          gl_Position = vec4(2.0, 2.0, 2.0, 1.0);   // off-screen, costs nothing more
          return;
        }

        // ---- this blade ----
        float tall = uHeight * (0.55 + r1.z * 0.95)
                   * mix(mix(1.0, 0.68, smoothstep(6.0, 16.0, ax)), 0.62, onLand);
        float wid  = 0.030 * (0.70 + r2.x * 0.65);
        float ang  = r2.y * 6.2831853;
        float hf   = uv.y;

        // ---- wind: gusts travel across the field, blades lean together ----
        vec2 wdir = normalize(vec2(0.84, 0.54));
        float gust = smoothstep(0.28, 0.82, n2(wxz * 0.040 - wdir * uTime * 1.25));
        float flut = sin(uTime * 2.4 + wxz.x * 0.7 + wxz.y * 0.5 + r1.z * 6.28) * 0.07;
        float lean = 0.11 + r2.z * 0.14 + gust * 0.62 + flut;

        vec3 side = vec3(cos(ang), 0.0, sin(ang));
        vec3 face = vec3(-sin(ang), 0.0, cos(ang));

        vec3 p = side * (position.x * wid);
        p.y  = tall * hf * (1.0 - lean * lean * 0.34) * fade;
        p.xz += wdir * (lean * tall * hf * hf * fade);

        vec3 wp = vec3(wxz.x, ground, wxz.y) + p;

        // a flat blade shaded as if it were curved
        vec3 n = normalize(face + side * (position.x * 0.62));
        n = normalize(n + vec3(-wdir.x, 0.9, -wdir.y) * lean * hf * 0.55);

        vWorld = wp;
        vNrm   = n;
        vH     = hf;
        vTint  = r1.z;
        vLean  = lean;
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }`,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform float uTime, uFogDensity;
      uniform vec3  uBlade, uBladeLo, uFogColor, uCamPos;
      varying vec3  vWorld, vNrm;
      varying float vH, vTint, vLean;
      ${NOISE}
      ${SKY}

      void main(){
        vec3 N = normalize(vNrm);
        vec3 toEye = uCamPos - vWorld;
        float dist = length(toEye);
        vec3 V = toEye / dist;
        vec3 L = normalize(uSunDir);

        // ---- the blade's own colour: dark and damp at the root, dry at the tip ----
        vec3 base = mix(uBladeLo, uBlade, vH * 0.86 + 0.14);
        base *= mix(vec3(0.86, 0.94, 1.0), vec3(1.30, 1.08, 0.62), vTint);
        base *= 0.52 + 0.48 * vH;                  // the field shadows itself

        // ---- banded key light ----
        float lam = clamp((dot(N, L) + 0.5) / 1.5, 0.0, 1.0);
        float q = floor(lam * 3.0) / 3.0 + smoothstep(0.42, 0.58, fract(lam * 3.0)) / 3.0;
        float shade = cloudShadowAt(vWorld.xz, uTime);
        q *= mix(1.0, shade, 0.9);
        vec3 col = base * (0.62 + q * 1.05);
        col *= mix(vec3(1.0), uSunTint * 0.9 + uHorizon * 0.2, q * 0.55);

        // ---- the whole reason to put grass in front of a sunset:
        //      light coming through the blade, not off it ----
        // Light only passes THROUGH a blade that has its back to the sun.
        // Without that test every blade glows at once and the field reads as
        // wheat; with it, some blades light up and their neighbours stay green,
        // which is what a real field does at this hour.
        float back = smoothstep(0.35, -0.45, dot(N, L));
        float through = pow(clamp(dot(-V, L) * 0.5 + 0.5, 0.0, 1.0), 4.5) * back;
        vec3 sap = mix(uBlade, vec3(0.34, 0.29, 0.10), 0.30);
        col += uSunTint * sap * through * (0.22 + 0.78 * vH) * 3.3 * shade;

        // ---- sky bounce, tinted by the blade ----
        float up = N.y * 0.5 + 0.5;
        vec3 ambient = mix(uHorizon * 0.55, uZenith * 1.5 + uMidSky * 0.6, up);
        col += base * ambient * 0.85 + ambient * 0.02;

        // ---- brush and water ----
        if (uInk > 0.001) col = mix(col, inkWash(col, N, V, -0.06), uInk);

        // ---- haze ----
        float fogA = 1.0 - exp(-pow(dist * uFogDensity, 1.34) * 1.9);
        fogA = clamp(fogA + mistAt(vWorld, dist) * (1.0 - fogA), 0.0, 1.0);
        col = mix(col, uFogColor, fogA);

        gl_FragColor = vec4(col, 1.0);
      }`,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 5;

  return {
    mesh,
    uniforms,
    get count() { return geo.instanceCount; },
    setCount(n) {
      const c = Math.max(0, Math.min(MAX_BLADES, Math.round(n)));
      geo.instanceCount = c;
      // and the fade follows the count, so the blades always run out by fading
      // rather than by reaching the edge of what was drawn
      uniforms.uRadius.value = radiusFor(c);
    },
  };
}
