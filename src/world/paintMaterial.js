import * as THREE from 'three';
import { NOISE, SKY } from './atmosphere.glsl.js';

// One material for every solid thing in the world.
//
// Not PBR. Light is banded into a few flat steps the way a background painter
// lays down base / shadow / accent, with a wrap term so nothing ever goes fully
// black, sky bounce from above, a rim off the low sun, and the same fog the
// water uses. Because everything shares it, everything agrees.
export function makePaintMaterial(shared, opts = {}) {
  const {
    color = '#8a8f98',
    shadowTint = null,      // where the dark side leans; defaults to a cool of the base
    emissive = '#000000',
    emissiveStrength = 0.0,
    rim = 0.85,
    bands = 3.0,
    wrap = 0.42,
    grain = 0.10,           // hand-mixed pigment, breaks up flat fills
    grainScale = 0.9,
    fogDensity = 0.00085,
    side = THREE.FrontSide,
    transparent = false,
    opacity = 1.0,
    flatShading = false,
    depthWrite = true,
    sway = 0,               // wind, for things that grow
    translucency = 0,       // light coming THROUGH the surface, for foliage
  } = opts;

  const base = new THREE.Color(color).convertSRGBToLinear();
  const shade = shadowTint
    ? new THREE.Color(shadowTint).convertSRGBToLinear()
    : base.clone().lerp(new THREE.Color(0.10, 0.14, 0.26), 0.55);

  const uniforms = Object.assign({
    uBase:      { value: base },
    uShade:     { value: shade },
    uEmissive:  { value: new THREE.Color(emissive).convertSRGBToLinear() },
    uEmiStr:    { value: emissiveStrength },
    uRim:       { value: rim },
    uBands:     { value: bands },
    uWrap:      { value: wrap },
    uGrain:     { value: grain },
    uGrainScale:{ value: grainScale },
    uFogColor:  { value: new THREE.Vector3(0.5, 0.5, 0.55) },
    uFogDensity:{ value: fogDensity },
    uCamPos:    { value: new THREE.Vector3() },
    uOpacity:   { value: opacity },
    uTrans:     { value: translucency },
  }, shared);

  const mat = new THREE.ShaderMaterial({
    uniforms, side, transparent, depthWrite,
    vertexShader: /* glsl */`
      uniform float uTime;
      // three declares the instanceColor attribute itself when the define is on
      varying vec3 vWorld;
      varying vec3 vNormalW;
      varying vec3 vLocal;
      varying vec3 vInst;
      void main(){
        #ifdef USE_INSTANCING_COLOR
          vInst = instanceColor;
        #else
          vInst = vec3(1.0);
        #endif
        vLocal = position;
        #ifdef USE_INSTANCING
          mat4 mm = modelMatrix * instanceMatrix;
        #else
          mat4 mm = modelMatrix;
        #endif
        vec4 wp = mm * vec4(position, 1.0);
        ${sway > 0 ? /* glsl */`
        {   // wind: bends hardest at the tip, in step with its neighbours
          float hgt = length(mm[1].xyz);
          float ph  = wp.x * 0.28 + wp.z * 0.21;
          float k   = clamp(position.y, 0.0, 4.0);
          float b   = sin(uTime * 1.05 + ph) * 0.62 + sin(uTime * 2.31 + ph * 1.7) * 0.38;
          b *= ${sway.toFixed(4)} * k * k * hgt;
          wp.x += b;
          wp.z += b * 0.55;
        }` : ''}
        vWorld = wp.xyz;
        vNormalW = normalize(mat3(mm) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform float uTime;
      uniform vec3  uBase, uShade, uEmissive, uFogColor, uCamPos;
      uniform float uEmiStr, uRim, uBands, uWrap, uGrain, uGrainScale;
      uniform float uFogDensity, uOpacity, uTrans;
      uniform vec4 uLamps[3];       // xyz position, w range (0 = off)
      uniform vec3 uLampCols[3];
      varying vec3 vWorld;
      varying vec3 vNormalW;
      varying vec3 vLocal;
      varying vec3 vInst;
      ${NOISE}
      ${SKY}

      void main(){
        vec3 uBaseI = uBase * vInst;
        vec3 N = normalize(vNormalW);
        ${flatShading ? 'N = normalize(cross(dFdx(vWorld), dFdy(vWorld)));' : ''}
        vec3 toEye = uCamPos - vWorld;
        float dist = length(toEye);
        vec3 V = toEye / dist;
        vec3 L = normalize(uSunDir);

        // ---- banded key light ----
        float ndl = dot(N, L);
        float lam = clamp((ndl + uWrap) / (1.0 + uWrap), 0.0, 1.0);
        float b   = max(uBands, 1.0);
        float q   = floor(lam * b) / b;
        float fr  = fract(lam * b);
        q += smoothstep(0.42, 0.58, fr) / b;      // soften the terraces a little

        vec3 sunCol = uSunTint * 0.85 + uHorizon * 0.16;
        vec3 col = mix(uShade * vInst, uBaseI, q);
        col *= mix(vec3(1.0), sunCol, q * 0.50);

        // ---- sky bounce: cool from above, warm haze from below ----
        // tinted by the surface's own colour, or every shadow in the world
        // turns the same grey and the reds stop being red
        float up = N.y * 0.5 + 0.5;
        vec3 ambient = mix(uHorizon * 0.55, uZenith * 1.5 + uMidSky * 0.6, up);
        col += uBaseI * ambient * 1.05 + ambient * 0.007;

        // ---- rim off the low sun ----
        float rimT = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.1);
        rimT *= clamp(dot(N, L) * 0.5 + 0.62, 0.0, 1.0);
        col += uSunTint * rimT * uRim * 0.40;

        ${translucency > 0 ? /* glsl */`
        // ---- light through the leaf, not off it: only where the surface has
        //      its back to the sun, so a canopy lights at its edges ----
        {
          float back = smoothstep(0.42, -0.45, dot(N, L));
          float thru = pow(clamp(dot(-V, L) * 0.5 + 0.5, 0.0, 1.0), 3.8) * back;
          col += uSunTint * (uBaseI * 2.4 + 0.02) * thru * uTrans;
        }` : ''}

        // ---- the few real lamps: platform, train, whatever is passing ----
        for (int i = 0; i < 3; i++){
          float r = uLamps[i].w;
          if (r <= 0.0) continue;
          vec3 dv = uLamps[i].xyz - vWorld;
          float dl = length(dv);
          float att = pow(clamp(1.0 - dl / r, 0.0, 1.0), 2.2);
          if (att <= 0.0) continue;
          float nd = clamp(dot(N, dv / max(dl, 0.001)), 0.0, 1.0);
          col += uLampCols[i] * att * (nd * 0.86 + 0.14);
        }

        // ---- pigment ----
        float g = fbm3(vWorld * uGrainScale) - 0.5;
        col *= 1.0 + g * uGrain * 2.0;

        col += uEmissive * uEmiStr;

        // ---- haze ----
        float fogA = 1.0 - exp(-pow(dist * uFogDensity, 1.34) * 1.9);
        col = mix(col, uFogColor, clamp(fogA, 0.0, 1.0));

        gl_FragColor = vec4(col, uOpacity);
      }`,
  });

  mat.userData.uniforms = uniforms;
  return mat;
}

// Pure light — lanterns, windows, the glow inside a paper lamp.
export function makeGlowMaterial(shared, color = '#ffb254', strength = 1.0, opts = {}) {
  const uniforms = Object.assign({
    uGlow:     { value: new THREE.Color(color).convertSRGBToLinear() },
    uStrength: { value: strength },
    uCamPos:   { value: new THREE.Vector3() },
    uFogColor: { value: new THREE.Vector3(0.5, 0.5, 0.55) },
    uFogDensity: { value: opts.fogDensity ?? 0.00085 },
    uFlicker:  { value: opts.flicker ?? 0.0 },
  }, shared);

  return new THREE.ShaderMaterial({
    uniforms,
    transparent: opts.transparent ?? false,
    depthWrite: opts.depthWrite ?? true,
    side: opts.side ?? THREE.FrontSide,
    blending: opts.blending ?? THREE.NormalBlending,
    vertexShader: /* glsl */`
      varying vec3 vWorld;
      varying float vSeed;
      void main(){
        #ifdef USE_INSTANCING
          mat4 mm = modelMatrix * instanceMatrix;
        #else
          mat4 mm = modelMatrix;
        #endif
        vec4 wp = mm * vec4(position, 1.0);
        vWorld = wp.xyz;
        // a stable per-instance seed, taken from where the thing actually sits
        vSeed = fract(dot(mm[3].xyz, vec3(0.1731, 0.7219, 0.2903))) * 57.0;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform vec3  uGlow, uFogColor, uCamPos;
      uniform float uStrength, uFogDensity, uFlicker, uTime;
      varying vec3 vWorld;
      varying float vSeed;
      void main(){
        float f = 1.0;
        if (uFlicker > 0.0){
          f = 1.0 + uFlicker * (sin(uTime * 2.3 + vSeed * 12.9) * 0.5
                              + sin(uTime * 5.7 + vSeed * 31.4) * 0.3
                              + sin(uTime * 11.3 + vSeed * 7.7) * 0.2);
        }
        float dist = length(uCamPos - vWorld);
        vec3 col = uGlow * uStrength * f;
        float fogA = 1.0 - exp(-pow(dist * uFogDensity, 1.34) * 1.9);
        col = mix(col, uFogColor * 1.1, clamp(fogA, 0.0, 1.0) * 0.78);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}
