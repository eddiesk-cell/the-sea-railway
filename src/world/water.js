import * as THREE from 'three';
import { NOISE, SKY } from './atmosphere.glsl.js';

// A flooded plain about ankle deep, still enough to be a mirror.
// It samples the same skyColor() the dome does, so the reflection can never
// disagree with the sky. The warm columns of light are real specular
// reflections of point lights off the rippled surface — solved analytically,
// which is why they smear the way water actually smears light.
export function createWater(sharedUniforms) {
  const uniforms = Object.assign({
    uDeep:       { value: new THREE.Color('#060c17').convertSRGBToLinear() },
    uShallow:    { value: new THREE.Color('#11202c').convertSRGBToLinear() },
    uFogColor:   { value: new THREE.Vector3(0.5, 0.5, 0.55) },
    uFogDensity: { value: 0.00045 },
    uCamPos:     { value: new THREE.Vector3() },
    // three warm sources that get to paint themselves onto the water
    uGlowA:  { value: new THREE.Vector3(-300, 46, -210) },  // the bathhouse
    uGlowAc: { value: new THREE.Vector3(1.0, 0.60, 0.26) },
    uGlowAr: { value: 62.0 },
    uGlowB:  { value: new THREE.Vector3(3.2, 5.4, 6.0) },   // the platform lamp
    uGlowBc: { value: new THREE.Vector3(1.0, 0.72, 0.38) },
    uGlowBr: { value: 1.5 },
    uGlowC:  { value: new THREE.Vector3(0, -999, 0) },      // the train, when it comes
    uGlowCc: { value: new THREE.Vector3(1.0, 0.68, 0.34) },
    uGlowCr: { value: 9.0 },
  }, sharedUniforms);

  const mat = new THREE.ShaderMaterial({
    uniforms,
    fog: false,
    vertexShader: /* glsl */`
      varying vec3 vWorld;
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform float uTime;
      uniform vec3  uDeep, uShallow, uFogColor, uCamPos;
      uniform float uFogDensity;
      uniform vec3  uGlowA, uGlowAc, uGlowB, uGlowBc, uGlowC, uGlowCc;
      uniform float uGlowAr, uGlowBr, uGlowCr;
      varying vec3 vWorld;
      ${NOISE}
      ${SKY}

      // Directional swell + drifting chop. Amplitude dies with distance so the
      // far water goes glassy — which is both true and what the eye wants.
      vec3 rippleNormal(vec2 p, float t, float atten){
        vec2 g = vec2(0.0);
        // three long, lazy swells
        g += vec2(0.055, 0.020) * cos(dot(p, vec2(0.32, 0.13)) + t * 0.62);
        g += vec2(-0.030, 0.048) * cos(dot(p, vec2(-0.19, 0.41)) + t * 0.48);
        g += vec2(0.016, -0.024) * cos(dot(p, vec2(0.77, -0.53)) + t * 0.95);
        // fine breath on the surface
        float e = 0.35;
        float n0 = fbm(p * 0.42 + vec2(t * 0.055, -t * 0.038));
        float nx = fbm((p + vec2(e,0.0)) * 0.42 + vec2(t * 0.055, -t * 0.038));
        float nz = fbm((p + vec2(0.0,e)) * 0.42 + vec2(t * 0.055, -t * 0.038));
        g += vec2(nx - n0, nz - n0) * (0.75 / e);
        // rain: the surface stops being a mirror and starts being stippled
        if (uWet > 0.004){
          float e2 = 0.11;
          vec2 q = p * 3.1 + vec2(0.0, t * 0.7);
          float m0 = fbm(q), mx = fbm(q + vec2(e2, 0.0)), mz = fbm(q + vec2(0.0, e2));
          g += vec2(mx - m0, mz - m0) * (0.55 / e2) * uWet * atten;
        }
        g *= atten;
        return normalize(vec3(-g.x, 1.0, -g.y));
      }

      // A spherical warm source reflected in the surface. Trace the reflected
      // ray up to the light's height and ask how close it lands.
      vec3 glowStreak(vec3 P, vec3 R, vec3 L, vec3 tint, float radius){
        if (R.y <= 0.0015) return vec3(0.0);
        float t = (L.y - P.y) / R.y;
        if (t <= 0.0) return vec3(0.0);
        vec3 hit = P + R * t;
        float d = length(hit.xz - L.xz);
        float core = exp(-pow(d / radius, 2.0));
        float halo = exp(-pow(d / (radius * 2.9), 2.0)) * 0.22;
        float far  = 1.0 / (1.0 + t * t * 0.000012);
        return tint * (core + halo) * far;
      }

      void main(){
        vec3  P    = vWorld;
        vec3  toEye = uCamPos - P;
        float dist = length(toEye);
        vec3  V    = toEye / dist;

        float atten = 1.0 / (1.0 + dist * 0.010);
        vec3  N     = rippleNormal(P.xz, uTime, atten);

        vec3 R = reflect(-V, N);
        R.y = abs(R.y) * 0.94 + 0.006;         // never let a ripple aim below the world

        // ---- the mirror ----
        vec3 refl = skyColor(R, uTime) * 0.88;

        // the sun's own path: ripples break it into a column of glitter
        float ss = max(dot(R, normalize(uSunDir)), 0.0);
        refl += uSunTint * (pow(ss, 260.0) * 2.6 + pow(ss, 26.0) * 0.16)
              * mix(1.0, cloudShadowAt(P.xz, uTime), 0.55);

        // ---- the body of the water ----
        float shallowness = exp(-dist * 0.0022);
        vec3 body = mix(uDeep, uShallow, shallowness * 0.7);
        body += skyColor(vec3(0.0, 1.0, 0.0), uTime) * 0.05;

        // ---- fresnel: at grazing angles this plain is a sheet of glass ----
        float f = 0.02 + 0.98 * pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 4.6);
        vec3 col = mix(body, refl, f);

        // ---- warm light laid across the water ----
        col += glowStreak(P, R, uGlowA, uGlowAc, uGlowAr) * 0.80;
        col += glowStreak(P, R, uGlowB, uGlowBc, uGlowBr) * 0.70;
        col += glowStreak(P, R, uGlowC, uGlowCc, uGlowCr) * 0.75;

        // ---- a dark seam where the water meets the embankment ----
        float bank = smoothstep(7.4, 3.1, abs(P.x));
        col *= 1.0 - bank * 0.24;
        col += vec3(0.9, 0.72, 0.5) * bank * 0.018 * (0.6 + 0.4 * sin(P.z * 1.7 + uTime * 1.4));

        // ---- brush and water: still water is a few horizontal strokes ----
        if (uInk > 0.001){
          float l = clamp(dot(col, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0);
          float strokes = fbm(vec2(P.x * 0.035, P.z * 0.55) + uTime * 0.03);
          float d = clamp(0.10 + smoothstep(0.44, 0.62, strokes) * 0.16 + (1.0 - l) * 0.30, 0.0, 1.0);
          d = floor(d * 5.0 + 0.5) / 5.0;
          col = mix(col, mix(uPaper, uInkTone, d), uInk);
        }

        // ---- into the haze ----
        float fogA = 1.0 - exp(-pow(dist * uFogDensity, 1.34) * 1.9);
        fogA = clamp(fogA + mistAt(P.y, dist) * (1.0 - fogA), 0.0, 1.0);
        col = mix(col, uFogColor, fogA);

        gl_FragColor = vec4(col, 1.0);
      }`,
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000, 1, 1), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0;
  mesh.renderOrder = -10;
  mesh.frustumCulled = false;

  return { mesh, uniforms };
}
