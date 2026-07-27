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

export function createGrass(shared, opts = {}) {
  const geo = bladeGeometry();

  // the one float each blade gets
  const seeds = new Float32Array(MAX_BLADES);
  for (let i = 0; i < MAX_BLADES; i++) seeds[i] = i;
  geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
  geo.instanceCount = opts.count ?? 1_600_000;
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);

  const uniforms = Object.assign({
    uCamXZ:   { value: new THREE.Vector2() },
    uTile:    { value: TILE },
    uTiles:   { value: TILES },
    uPerTile: { value: PER_TILE },
    uRadius:  { value: (TILE * TILES) * 0.5 - TILE },
    uHeight:  { value: 0.95 },
    uDensity: { value: 1.0 },
    uBathXZ:  { value: new THREE.Vector2(-268, -198) },
    // up to six domes of land: xy = centre, z = radius, w = height.
    // The same formula the trees are planted with, so grass and wood agree.
    uHills:   { value: Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, 0, 0)) },
    uHillBase:{ value: -10.0 },
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
      uniform float uTime, uTile, uTiles, uPerTile, uRadius, uHeight, uDensity, uHillBase;
      uniform vec2  uCamXZ, uBathXZ;
      uniform vec4  uHills[6];
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

      // the height of the land under a point, and how far inland it is
      float landAt(vec2 p, out float inland){
        float y = -1e5; inland = 0.0;
        for (int i = 0; i < 6; i++){
          float r = uHills[i].z;
          if (r <= 0.0) continue;
          float d = distance(p, uHills[i].xy);
          if (d >= r) continue;
          float t = d / r;
          y = max(y, uHillBase + uHills[i].w * sqrt(max(0.0, 1.0 - t * t)) * 0.93);
          inland = max(inland, smoothstep(0.99, 0.80, t));
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
        float fade = 1.0 - smoothstep(uRadius * 0.40, uRadius, dist);

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

        // ---- haze ----
        float fogA = 1.0 - exp(-pow(dist * uFogDensity, 1.34) * 1.9);
        col = mix(col, uFogColor, clamp(fogA, 0.0, 1.0));

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
    setCount(n) { geo.instanceCount = Math.max(0, Math.min(MAX_BLADES, Math.round(n))); },
  };
}
