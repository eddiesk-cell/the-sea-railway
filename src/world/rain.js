import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Rain. A fixed set of streaks living in a box that travels with the camera —
// nothing is stored, nothing is updated on the CPU, the fall is just time
// folded back on itself in the vertex shader. Each streak is billboarded so it
// always presents its width to the eye, and slanted so the whole downpour is
// clearly going somewhere.
//
// It only exists where a region says it is raining: uWet fades the lot in and
// out over the border, so the world dries as the train leaves.
// ---------------------------------------------------------------------------

export function createRain(shared, opts = {}) {
  const COUNT = opts.count ?? 6500;
  const BOX = opts.box ?? 44;      // half-width of the volume around the camera
  const HIGH = opts.high ?? 46;    // how far up it falls from

  const geo = new THREE.InstancedBufferGeometry();
  const quad = new THREE.PlaneGeometry(1, 1, 1, 1);
  geo.index = quad.index;
  geo.attributes.position = quad.attributes.position;
  geo.attributes.uv = quad.attributes.uv;

  const seeds = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) seeds[i] = i;
  geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
  geo.instanceCount = COUNT;

  const uniforms = Object.assign({
    uCamPos2: { value: new THREE.Vector3() },
    uWet:     { value: 0 },
    uBox:     { value: BOX },
    uHigh:    { value: HIGH },
    uTint:    { value: new THREE.Color('#cddcf0').convertSRGBToLinear() },
  }, shared);

  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      precision highp float;
      attribute float aSeed;
      uniform vec3  uCamPos2;
      uniform float uTime, uBox, uHigh;
      varying float vA;
      varying vec2  vUv;

      vec3 h31(float n){
        return fract(sin(vec3(n * 12.9898, n * 78.233, n * 37.719)) * 43758.5453);
      }

      void main(){
        vec3 r = h31(aSeed + 1.0);
        vec3 r2 = h31(aSeed * 1.37 + 9.1);

        // the volume follows the camera, snapped so the pattern does not swim
        vec2 base = floor(uCamPos2.xz / uBox) * uBox;
        vec3 p;
        p.xz = base + (r.xz - 0.5) * 2.0 * uBox;
        // falling: speed varies, and the fall wraps inside the column
        float speed = 26.0 + r2.x * 22.0;
        float y0 = r.y * uHigh;
        p.y = uHigh - mod(uHigh - y0 + uTime * speed, uHigh);
        p.y += uCamPos2.y - uHigh * 0.42;

        // wind slant, and a longer streak for the faster drops
        // A painted downpour is not photographic rain: the strokes have to be
        // wide enough to survive the brush pass, or the Kuwahara filter eats
        // every one of them and the storm renders as nothing at all.
        float len = 0.95 + r2.y * 1.9;
        float wid = 0.040 + r2.z * 0.045;
        vec3 fall = normalize(vec3(0.30, -1.0, 0.10));

        vec3 toCam = uCamPos2 - p;
        float dist = length(toCam);
        vec3 side = normalize(cross(fall, toCam / max(dist, 0.001)));

        vec3 wp = p + side * position.x * wid + fall * (-position.y) * len;

        // do not paint the lens: kill anything nearly touching the camera, and
        // let the far end of the box fade out rather than end
        vA = smoothstep(0.7, 3.0, dist) * (1.0 - smoothstep(uBox * 0.55, uBox * 1.05, dist));
        vUv = uv;
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }`,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform vec3  uTint, uSunTint, uHorizon;
      uniform float uWet;
      varying float vA;
      varying vec2  vUv;
      void main(){
        if (uWet < 0.004 || vA <= 0.001) discard;
        // a streak is bright along its spine and gone at the ends
        float t = 1.0 - abs(vUv.x - 0.5) * 2.0;
        float head = smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
        float a = t * t * (0.34 + head * 0.80) * vA * uWet * 0.92;
        vec3 col = uTint * 0.55 + uHorizon * 1.3 + uSunTint * 0.10;
        gl_FragColor = vec4(col * a, a);
      }`,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 24;

  return {
    mesh, uniforms,
    update(camPos, wet) {
      uniforms.uCamPos2.value.copy(camPos);
      uniforms.uWet.value = wet;
      mesh.visible = wet > 0.004;
    },
  };
}
