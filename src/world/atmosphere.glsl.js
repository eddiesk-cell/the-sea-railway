// Shared GLSL: noise + the analytic sky.
// The water samples the exact same skyColor() the dome uses, so reflections
// are automatically, perfectly consistent — and free.

export const NOISE = /* glsl */`
float hash21(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float hash31(vec3 p){
  p = fract(p * vec3(127.1, 311.7, 74.7));
  p += dot(p, p.yzx + 45.32);
  return fract((p.x + p.y) * p.z);
}
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1,0)), u.x),
             mix(hash21(i + vec2(0,1)), hash21(i + vec2(1,1)), u.x), u.y);
}
float vnoise3(vec3 p){
  vec3 i = floor(p), f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  float n000 = hash31(i), n100 = hash31(i + vec3(1,0,0));
  float n010 = hash31(i + vec3(0,1,0)), n110 = hash31(i + vec3(1,1,0));
  float n001 = hash31(i + vec3(0,0,1)), n101 = hash31(i + vec3(1,0,1));
  float n011 = hash31(i + vec3(0,1,1)), n111 = hash31(i + vec3(1,1,1));
  return mix(mix(mix(n000,n100,u.x), mix(n010,n110,u.x), u.y),
             mix(mix(n001,n101,u.x), mix(n011,n111,u.x), u.y), u.z);
}
float fbm(vec2 p){
  float a = 0.5, s = 0.0;
  for(int i = 0; i < 5; i++){ s += a * vnoise(p); p *= 2.03; p.xy = p.yx; a *= 0.5; }
  return s;
}
float fbm3(vec3 p){
  float a = 0.5, s = 0.0;
  for(int i = 0; i < 4; i++){ s += a * vnoise3(p); p *= 2.07; a *= 0.5; }
  return s;
}
`;

// uTime, uSunDir, uHour (0 = deep night .. 0.5 = dusk .. 1 = pale dawn) expected as uniforms.
export const SKY = /* glsl */`
uniform vec3  uSunDir;
uniform float uHour;      // 0..1 blend along the evening
uniform vec3  uZenith;
uniform vec3  uMidSky;
uniform vec3  uHorizon;
uniform vec3  uSunTint;
uniform float uCloudAmt;

// big soft cumulus banks, painted flat with a lit rim
float cloudField(vec3 dir, float t){
  // project the direction onto a plane far above — cheap, stable, no seams
  float y = max(dir.y, 0.012);
  vec2 uv = dir.xz / y;
  uv *= 0.62;
  uv += vec2(t * 0.0135, t * 0.0052);

  float base = fbm(uv * 1.0 + fbm(uv * 0.55) * 0.9);
  float detail = fbm(uv * 3.4 + t * 0.006);

  float d = base * 0.78 + detail * 0.22;
  float cover = mix(0.66, 0.42, uCloudAmt);
  float c = smoothstep(cover, cover + 0.155, d);

  // fade the deck out at the zenith and squash it into the horizon
  c *= smoothstep(0.0, 0.10, dir.y);
  c *= 1.0 - smoothstep(0.34, 0.95, dir.y) * 0.62;
  return c;
}

// The shadow a cloud casts on the ground, sampled from the SAME field the sky
// draws — look up at a cloud, look down, and its shadow is there. The sun is
// treated as higher than it really is when projecting, or a sunset sun would
// throw every shadow a mile downwind of its cloud.
float cloudShadowAt(vec2 p, float t){
  vec3 L = normalize(uSunDir);
  float ly = max(L.y, 0.34);
  // a lower deck than the one you see: physically the shadows would be
  // 1500 units wide and the whole landscape would sit under one of them
  vec2 uv = (p / 300.0 + L.xz / ly * 0.62) * 0.62;
  uv += vec2(t * 0.030, t * 0.012);
  float base = fbm(uv + fbm(uv * 0.55) * 0.9);
  float detail = fbm(uv * 3.4 + t * 0.006);
  float d = base * 0.78 + detail * 0.22;
  float cover = mix(0.66, 0.42, uCloudAmt);
  float c = smoothstep(cover - 0.02, cover + 0.20, d) * uCloudAmt;
  return 1.0 - c * 0.66;
}

vec3 skyColor(vec3 dir, float t){
  float y = dir.y;

  // ---- gradient ----
  float hb = pow(clamp(1.0 - y, 0.0, 1.0), 5.0);          // hugs the horizon
  float mb = smoothstep(-0.02, 0.42, y) * (1.0 - smoothstep(0.34, 0.98, y));
  vec3 col = mix(uZenith, uMidSky, smoothstep(0.55, -0.05, y));
  col = mix(col, uHorizon, hb);
  col += uMidSky * mb * 0.14;

  // ---- the low sun: a wide warm bloom sitting on the water line ----
  float sd = max(dot(normalize(dir), normalize(uSunDir)), 0.0);
  float glow = pow(sd, 9.0) * 0.150 + pow(sd, 95.0) * 0.42 + pow(sd, 2600.0) * 2.4;
  glow *= smoothstep(-0.16, 0.10, y);
  col += uSunTint * glow;

  // a broad band of warmth smeared along the whole horizon
  col += uSunTint * 0.085 * pow(clamp(1.0 - abs(y) * 4.2, 0.0, 1.0), 2.8);

  // ---- clouds ----
  float c = cloudField(dir, t) * uCloudAmt;
  if (c > 0.001){
    float lit = pow(clamp(dot(normalize(dir), normalize(uSunDir)) * 0.5 + 0.5, 0.0, 1.0), 2.6);
    vec3 shade = mix(uZenith * 1.25 + uMidSky * 0.34, uMidSky * 1.05, 0.45);
    vec3 bright = mix(uHorizon * 1.06, uSunTint * 1.4 + uHorizon * 0.55, lit);
    vec3 cloud = mix(shade, bright, lit * 0.72 + hb * 0.4);
    col = mix(col, cloud, clamp(c, 0.0, 0.94));
  }

  // ---- a scatter of stars once the light goes ----
  float night = smoothstep(0.34, 0.02, uHour);
  if (night > 0.001 && y > 0.02){
    vec2 sp = dir.xz / max(y, 0.05) * 3.4;
    float st = hash21(floor(sp * 46.0));
    float tw = 0.5 + 0.5 * sin(t * 1.7 + st * 90.0);
    float s = smoothstep(0.9955, 0.9994, st) * (0.55 + 0.45 * tw);
    col += vec3(0.86, 0.9, 1.0) * s * night * smoothstep(0.04, 0.4, y) * 1.5;
  }
  return col;
}
`;
