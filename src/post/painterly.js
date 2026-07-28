import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// ---------------------------------------------------------------------------
// This is the part that makes it a painting rather than a render.
//
// Pass 1 — Kuwahara. For every pixel, look at four overlapping neighbourhoods
// and keep the flattest one. Flat areas get flatter; edges stay sharp and shift
// to whichever side is calmer. That is what a loaded brush does to a canvas.
// The sampling kernel is rotated by a slow noise field so the strokes lean and
// curve instead of sitting on a grid.
//
// Pass 2 — the finish: ink lines pulled from depth, a little posterisation with
// a dither so it never bands, split-toning, paper tooth, vignette.
// ---------------------------------------------------------------------------

const FS_VERT = /* glsl */`
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const KUWAHARA = {
  uniforms: {
    tDiffuse:   { value: null },
    uTexel:     { value: new THREE.Vector2(1 / 1280, 1 / 720) },
    uRadius:    { value: 3.0 },
    uStrength:  { value: 1.0 },
    uExposure:  { value: 1.0 },
    uFlow:      { value: 1.0 },
    uTime:      { value: 0 },
  },
  vertexShader: FS_VERT,
  fragmentShader: /* glsl */`
    precision highp float;
    uniform sampler2D tDiffuse;
    uniform vec2  uTexel;
    uniform float uRadius, uStrength, uExposure, uFlow, uTime;
    varying vec2 vUv;

    float h21(vec2 p){
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }
    float vn(vec2 p){
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(h21(i), h21(i + vec2(1,0)), u.x),
                 mix(h21(i + vec2(0,1)), h21(i + vec2(1,1)), u.x), u.y);
    }

    // AgX-ish filmic curve — keeps the lantern cores from blowing to white paper
    vec3 tonemap(vec3 x){
      x *= uExposure;
      vec3 a = x * (2.51 * x + 0.03);
      vec3 b = x * (2.43 * x + 0.59) + 0.14;
      return clamp(a / b, 0.0, 1.0);
    }
    vec3 fetch(vec2 uv){ return tonemap(texture2D(tDiffuse, uv).rgb); }
    float luma(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

    void main(){
      vec3 centre = fetch(vUv);

      // stroke direction: a slow, smooth field, so neighbouring strokes agree
      float ang = (vn(vUv * 4.3) - 0.5) * 6.2831 * uFlow
                + (vn(vUv * 11.0 + 3.1) - 0.5) * 1.1 * uFlow;
      float ca = cos(ang), sa = sin(ang);
      mat2 rot = mat2(ca, -sa, sa, ca);

      // a little per-pixel variation in brush size
      float rj = 0.72 + 0.55 * vn(vUv * 26.0 + 7.0);
      vec2 brush = uTexel * uRadius * rj;

      vec3 bestMean = centre;
      float bestVar = 1e9;

      // four overlapping quadrants
      for (int q = 0; q < 4; q++){
        vec2 sgn = q == 0 ? vec2( 1.0,  1.0)
                 : q == 1 ? vec2(-1.0,  1.0)
                 : q == 2 ? vec2( 1.0, -1.0)
                          : vec2(-1.0, -1.0);
        vec3 sum = vec3(0.0);
        float sl = 0.0, sl2 = 0.0, n = 0.0;
        for (int i = 0; i <= 3; i++){
          for (int j = 0; j <= 3; j++){
            vec2 o = rot * (vec2(float(i), float(j)) * sgn * brush);
            vec3 c = fetch(vUv + o);
            float l = luma(c);
            sum += c; sl += l; sl2 += l * l; n += 1.0;
          }
        }
        vec3 mean = sum / n;
        float varr = sl2 / n - (sl / n) * (sl / n);
        if (varr < bestVar){ bestVar = varr; bestMean = mean; }
      }

      // hold on to the original where the picture is light — a soft glow run
      // through a flattening filter turns into polygons, and the eye sees it
      float keep = smoothstep(0.42, 0.88, luma(centre));
      vec3 col = mix(centre, bestMean, uStrength * (1.0 - keep * 0.85));
      gl_FragColor = vec4(col, 1.0);
    }`,
};

const FINISH = {
  uniforms: {
    tDiffuse:  { value: null },
    tDepth:    { value: null },
    uTexel:    { value: new THREE.Vector2(1 / 1280, 1 / 720) },
    uNear:     { value: 0.1 },
    uFar:      { value: 6000 },
    uInk:      { value: 0.85 },
    uPosterize:{ value: 26.0 },
    uGrain:    { value: 0.5 },
    uVignette: { value: 0.55 },
    uSat:      { value: 1.14 },
    uWarm:     { value: new THREE.Color('#ffd7a8') },
    uCool:     { value: new THREE.Color('#2a3d63') },
    uPaint:    { value: 1.0 },
    uInkMode:  { value: 0.0 },
    uPaper:    { value: new THREE.Color('#efe8d9') },
    uTime:     { value: 0 },
  },
  vertexShader: FS_VERT,
  fragmentShader: /* glsl */`
    precision highp float;
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform vec2  uTexel;
    uniform float uNear, uFar, uInk, uPosterize, uGrain, uVignette, uSat, uPaint, uTime, uInkMode;
    uniform vec3  uWarm, uCool, uPaper;
    varying vec2 vUv;

    float h21(vec2 p){
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }
    float vn(vec2 p){
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(h21(i), h21(i + vec2(1,0)), u.x),
                 mix(h21(i + vec2(0,1)), h21(i + vec2(1,1)), u.x), u.y);
    }
    float fbm2(vec2 p){
      float a = 0.5, s = 0.0;
      for (int i = 0; i < 4; i++){ s += a * vn(p); p *= 2.11; a *= 0.5; }
      return s;
    }
    float linDepth(vec2 uv){
      float z = texture2D(tDepth, uv).x;
      float ndc = z * 2.0 - 1.0;
      return (2.0 * uNear * uFar) / (uFar + uNear - ndc * (uFar - uNear));
    }
    float luma(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
    vec3 lin2srgb(vec3 c){
      return mix(c * 12.92, 1.055 * pow(max(c, 1e-5), vec3(1.0/2.4)) - 0.055, step(0.0031308, c));
    }

    void main(){
      vec2 uv = vUv;

      // the paper is not flat — the image sits on it and moves a hair
      vec2 warp = (vec2(fbm2(uv * 7.0), fbm2(uv * 7.0 + 19.0)) - 0.5) * uTexel * 2.4 * uPaint;
      vec3 col = texture2D(tDiffuse, uv + warp).rgb;

      // ---- ink lines, pulled from where the depth breaks ----
      if (uPaint > 0.001){
        vec2 e = uTexel * 1.35;
        float d0 = linDepth(uv);
        float dx = abs(linDepth(uv + vec2(e.x, 0.0)) - linDepth(uv - vec2(e.x, 0.0)));
        float dy = abs(linDepth(uv + vec2(0.0, e.y)) - linDepth(uv - vec2(0.0, e.y)));
        float dEdge = (dx + dy) / max(d0, 0.6);

        float l0 = luma(col);
        float lx = abs(luma(texture2D(tDiffuse, uv + vec2(e.x, 0.0)).rgb) - luma(texture2D(tDiffuse, uv - vec2(e.x, 0.0)).rgb));
        float ly = abs(luma(texture2D(tDiffuse, uv + vec2(0.0, e.y)).rgb) - luma(texture2D(tDiffuse, uv - vec2(0.0, e.y)).rgb));
        float lEdge = (lx + ly);

        float ink = smoothstep(0.030, 0.30, dEdge) * 0.90 + smoothstep(0.24, 0.62, lEdge) * 0.22;
        // strokes break up the way a wet line does
        ink *= 0.62 + 0.6 * fbm2(uv * vec2(220.0, 90.0));
        ink *= uInk;
        // never outline light itself — lanterns must not get boxed in
        ink *= 1.0 - smoothstep(0.26, 0.62, l0) * 0.97;
        col *= 1.0 - clamp(ink, 0.0, 0.72) * 0.55;

        if (uInkMode > 0.001){
          // A brush line is not a hairline. It swells where the hand slowed,
          // breaks where the brush ran dry, and bleeds into the paper's grain.
          float wet = smoothstep(0.016, 0.20, dEdge) * 1.35
                    + smoothstep(0.10, 0.42, lEdge) * 0.55;
          float dry = 0.45 + 0.75 * fbm2(uv * vec2(300.0, 120.0) + 9.0);
          float bleed = smoothstep(0.010, 0.14, dEdge) * 0.5 * fbm2(uv * 55.0);
          float line = clamp((wet * dry + bleed) * uInkMode, 0.0, 1.0);
          col = mix(col, mix(col, uPaper * 0.055, 0.92), line);
        }
      }

      // ---- grade: shadows lean cool, lights lean warm, exposure held ----
      float l = luma(col);
      col = mix(vec3(l), col, uSat);
      vec3 tone = mix(uCool, uWarm, smoothstep(0.05, 0.70, l));
      tone /= max((tone.r + tone.g + tone.b) / 3.0, 1e-3);
      col *= mix(vec3(1.0), tone, 0.28 * (1.0 - uInkMode));

      if (uInkMode > 0.001){
        // one pigment, so the colour goes and the values stay
        vec3 mono = uPaper * mix(0.045, 1.0, pow(clamp(l * 1.06, 0.0, 1.0), 0.88));
        col = mix(col, mono, uInkMode);
        // and the paper shows through the pale end of the wash
        float tooth2 = fbm2(uv * vec2(340.0, 330.0));
        col = mix(col, uPaper, smoothstep(0.62, 0.99, luma(col)) * 0.55 * uInkMode);
        col *= 1.0 + (tooth2 - 0.5) * 0.10 * uInkMode;
      }

      // ---- contrast: give the picture a ceiling, but stop crushing the floor ----
      // An S-curve with its toe at zero takes a quarter of the value out of
      // everything in the lower midtones — which in a world already painted
      // with near-black shadows is where the whole picture lived. The toe now
      // sits BELOW black, so the curve shapes the highlights and leaves the
      // darks where the painter put them.
      col = clamp(col, 0.0, 1.0);
      col = mix(col, smoothstep(vec3(-0.10), vec3(0.985), col), 0.34);

      // ---- posterise, dithered so it reads as mixed paint not banding ----
      if (uPaint > 0.001){
        float bayer = fract(dot(floor(gl_FragCoord.xy), vec2(0.5, 0.25))) - 0.25;
        float steps = mix(255.0, uPosterize, uPaint);
        col = floor(col * steps + 0.5 + bayer * 0.9) / steps;
      }

      // ---- paper tooth ----
      float tooth = fbm2(uv * vec2(560.0, 540.0)) * 0.6 + fbm2(uv * 150.0) * 0.4;
      col *= 1.0 + (tooth - 0.5) * uGrain * 0.22 * uPaint;
      col += (h21(uv * 900.0 + fract(uTime) * 13.0) - 0.5) * 0.012;

      // ---- vignette ----
      vec2 q = (uv - 0.5) * vec2(1.0, 0.92);
      // A Ghibli frame is barely vignetted at all — the corners of a painted
      // background are as bright as the middle, and the focus is done with
      // drawing rather than with a dark ring. Scaled back everywhere at once
      // instead of in twenty-seven region entries.
      float v = 1.0 - dot(q, q) * uVignette * 1.08 * (1.0 - uInkMode * 0.82);
      col *= clamp(v, 0.0, 1.0);

      gl_FragColor = vec4(lin2srgb(max(col, 0.0)), 1.0);
    }`,
};

export function createPost(renderer, scene, camera) {
  const size = new THREE.Vector2();
  renderer.getSize(size);
  const dpr = renderer.getPixelRatio();
  const w = Math.max(2, Math.floor(size.x * dpr));
  const h = Math.max(2, Math.floor(size.y * dpr));

  const target = new THREE.WebGLRenderTarget(w, h, {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: true,
  });
  target.depthTexture = new THREE.DepthTexture(w, h);
  target.depthTexture.type = THREE.UnsignedIntType;

  const composer = new EffectComposer(renderer, target);
  composer.setPixelRatio(dpr);

  composer.addPass(new RenderPass(scene, camera));

  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.78, 0.85, 0.62);
  composer.addPass(bloom);

  const kuwahara = new ShaderPass(KUWAHARA);
  composer.addPass(kuwahara);

  const finish = new ShaderPass(FINISH);
  finish.uniforms.uNear.value = camera.near;
  finish.uniforms.uFar.value = camera.far;
  finish.renderToScreen = true;
  composer.addPass(finish);

  // RenderPass draws into the composer's *read* buffer (renderTarget2), and the
  // clone made in the constructor carries its own depth texture — so that is
  // the one holding the scene depth the ink pass reads.
  finish.uniforms.tDepth.value = composer.renderTarget2.depthTexture;

  function setSize(width, height, pixelRatio) {
    composer.setPixelRatio(pixelRatio);
    composer.setSize(width, height);
    const pw = Math.max(2, Math.floor(width * pixelRatio));
    const ph = Math.max(2, Math.floor(height * pixelRatio));
    // setSize() resizes colour attachments only; the depth textures need telling
    for (const rt of [composer.renderTarget1, composer.renderTarget2]) {
      if (!rt.depthTexture) continue;
      rt.depthTexture.image.width = pw;
      rt.depthTexture.image.height = ph;
      rt.depthTexture.needsUpdate = true;
    }
    finish.uniforms.tDepth.value = composer.renderTarget2.depthTexture;
    kuwahara.uniforms.uTexel.value.set(1 / pw, 1 / ph);
    finish.uniforms.uTexel.value.set(1 / pw, 1 / ph);
    // keep the brush the same physical size on a phone and on a 5K display
    kuwahara.uniforms.uRadius.value = THREE.MathUtils.clamp(2.15 * (ph / 1080), 1.15, 3.6);
  }
  setSize(size.x, size.y, dpr);

  return { composer, bloom, kuwahara, finish, target, setSize };
}
