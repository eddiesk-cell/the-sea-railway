import * as THREE from 'three';
import { NOISE, SKY } from './atmosphere.glsl.js';

// ---------------------------------------------------------------------------
// Palette keys along the evening. 0 = night, 1 = the last pale gold before dark.
// These are the colours the whole world reads from: sky, water, fog, lantern
// falloff, the rim on the bathhouse roofs. Change these and the world changes.
// ---------------------------------------------------------------------------
const KEYS = [
  { // 0.00 — deep night, lanterns own the world
    zenith:  [0.028, 0.042, 0.098],
    mid:     [0.062, 0.094, 0.176],
    horizon: [0.148, 0.164, 0.245],
    sun:     [0.180, 0.130, 0.150],
    sunY: 0.012, cloud: 0.62, fog: [0.038, 0.052, 0.098], exposure: 1.14,
  },
  { // 0.35 — blue hour
    zenith:  [0.055, 0.082, 0.190],
    mid:     [0.150, 0.204, 0.352],
    horizon: [0.480, 0.404, 0.428],
    sun:     [0.640, 0.352, 0.278],
    sunY: 0.030, cloud: 0.72, fog: [0.108, 0.132, 0.205], exposure: 1.00,
  },
  { // 0.62 — dusk. the frame everyone remembers
    zenith:  [0.108, 0.162, 0.336],
    mid:     [0.352, 0.436, 0.612],
    horizon: [0.945, 0.735, 0.552],
    sun:     [1.000, 0.605, 0.352],
    sunY: 0.052, cloud: 0.86, fog: [0.286, 0.312, 0.398], exposure: 0.86,
  },
  { // 1.00 — high pale afternoon over the water
    zenith:  [0.212, 0.372, 0.628],
    mid:     [0.520, 0.652, 0.796],
    horizon: [0.905, 0.885, 0.828],
    sun:     [1.000, 0.900, 0.735],
    sunY: 0.300, cloud: 0.96, fog: [0.548, 0.596, 0.672], exposure: 0.80,
  },
];
const STOPS = [0.0, 0.35, 0.62, 1.0];

const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);

export function samplePalette(h) {
  h = THREE.MathUtils.clamp(h, 0, 1);
  let i = 0;
  while (i < STOPS.length - 2 && h > STOPS[i + 1]) i++;
  const t = THREE.MathUtils.clamp((h - STOPS[i]) / (STOPS[i + 1] - STOPS[i]), 0, 1);
  const k = THREE.MathUtils.smoothstep(t, 0, 1);
  const a = KEYS[i], b = KEYS[i + 1];
  const lerp3 = (x, y) => v3(x).lerp(v3(y), k);
  return {
    zenith:  lerp3(a.zenith,  b.zenith),
    mid:     lerp3(a.mid,     b.mid),
    horizon: lerp3(a.horizon, b.horizon),
    sun:     lerp3(a.sun,     b.sun),
    fog:     lerp3(a.fog,     b.fog),
    sunY:     THREE.MathUtils.lerp(a.sunY, b.sunY, k),
    cloud:    THREE.MathUtils.lerp(a.cloud, b.cloud, k),
    exposure: THREE.MathUtils.lerp(a.exposure, b.exposure, k),
  };
}

// The sun sits low and just left of the bathhouse, so the bathhouse reads as a
// warm silhouette with a rim, and its own lanterns do the rest.
export function sunDirection(p) {
  const az = -2.72;
  return new THREE.Vector3(Math.sin(az), p.sunY, Math.cos(az)).normalize();
}

export function createSky() {
  const uniforms = {
    uTime:     { value: 0 },
    uSunDir:   { value: new THREE.Vector3(0, 0.06, 1) },
    uHour:     { value: 0.62 },
    uZenith:   { value: new THREE.Vector3() },
    uMidSky:   { value: new THREE.Vector3() },
    uHorizon:  { value: new THREE.Vector3() },
    uSunTint:  { value: new THREE.Vector3() },
    uCloudAmt: { value: 0.84 },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main(){
        vDir = position;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_Position.z = gl_Position.w;   // pin to the far plane
      }`,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform float uTime;
      varying vec3 vDir;
      ${NOISE}
      ${SKY}
      void main(){
        vec3 d = normalize(vDir);
        vec3 c = skyColor(d, uTime);
        // below the horizon line the dome just carries the haze the water sits in
        c = mix(c, mix(uHorizon, uZenith, 0.55), smoothstep(0.0, -0.14, d.y));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1000;
  mesh.scale.setScalar(1);

  return { mesh, uniforms };
}
