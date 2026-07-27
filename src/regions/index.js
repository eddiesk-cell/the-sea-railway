import * as THREE from 'three';
import { samplePalette, sunDirection } from '../world/sky.js';

// ---------------------------------------------------------------------------
// The line is divided into regions. Each owns a stretch of track and declares
// the air inside it: sky keys, haze, exposure, and whether the world there is
// painted or brushed. Between two regions everything cross-fades over a couple
// of hundred metres, so the train carries you out of one world and into the
// next without a seam anywhere.
// ---------------------------------------------------------------------------

const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);

export const BLEND = 280;

export const REGIONS = [
  {
    id: 'sea',
    title: 'The Sea Railway',
    film: 'Spirited Away',
    year: 2001,
    zNear: 900, zFar: -1150,
    hourDriven: true,                 // this one answers to the hour slider
    ink: 0,
    fogDensity: 0.00045,
    bloom: 1.0, sat: 1.0, vignette: 0.55,
    mist: 0.0, mistTop: 0,
  },
  {
    id: 'ink',
    title: 'The Ink Country',
    film: 'The Tale of the Princess Kaguya',
    year: 2013,
    zNear: -1150, zFar: -4200,
    hourDriven: false,
    ink: 1,
    paper: '#f6f0e4',
    inkTone: '#12141c',
    fogDensity: 0.00072,
    bloom: 0.10, sat: 1.0, vignette: 0.16,
    mist: 0.92, mistTop: 62,
    // The light underneath the ink still matters: it is what gives each face
    // its value, and the value is what the brush is actually painting.
    palette: {
      zenith:  [0.700, 0.720, 0.762],
      mid:     [0.790, 0.798, 0.818],
      horizon: [0.892, 0.880, 0.848],
      sun:     [0.930, 0.915, 0.870],
      fog:     [0.878, 0.862, 0.828],
      sunY: 0.52, cloud: 0.30, exposure: 1.02,
    },
  },
];

// Which region owns this stretch of line, and how far into the next one we are.
export function regionAt(z) {
  let i = REGIONS.findIndex(r => z <= r.zNear && z > r.zFar);
  if (i < 0) i = z > REGIONS[0].zNear ? 0 : REGIONS.length - 1;
  const r = REGIONS[i];
  const next = REGIONS[i + 1];
  if (next && z < r.zFar + BLEND) {
    const t = THREE.MathUtils.smoothstep((r.zFar + BLEND - z) / BLEND, 0, 1);
    return { a: r, b: next, t };
  }
  const prev = REGIONS[i - 1];
  if (prev && z > r.zNear - BLEND) {
    const t = THREE.MathUtils.smoothstep((z - (r.zNear - BLEND)) / BLEND, 0, 1);
    return { a: r, b: prev, t };
  }
  return { a: r, b: r, t: 0 };
}

function paletteOf(region, hour) {
  if (region.hourDriven) return samplePalette(hour);
  const p = region.palette;
  return {
    zenith: v3(p.zenith), mid: v3(p.mid), horizon: v3(p.horizon),
    sun: v3(p.sun), fog: v3(p.fog),
    sunY: p.sunY, cloud: p.cloud, exposure: p.exposure,
  };
}

const PAPER_DEFAULT = new THREE.Color('#f3ece0').convertSRGBToLinear();
const INK_DEFAULT = new THREE.Color('#12141c').convertSRGBToLinear();
const tmpA = new THREE.Color(), tmpB = new THREE.Color();

// Everything the air is made of, blended between the two nearest regions.
export function atmosphereAt(z, hour) {
  const { a, b, t } = regionAt(z);
  const pa = paletteOf(a, hour), pb = paletteOf(b, hour);
  const lerp3 = (x, y) => x.clone().lerp(y, t);

  tmpA.set(a.paper ?? '#f3ece0').convertSRGBToLinear();
  tmpB.set(b.paper ?? '#f3ece0').convertSRGBToLinear();
  const paper = tmpA.clone().lerp(tmpB, t);
  tmpA.set(a.inkTone ?? '#12141c').convertSRGBToLinear();
  tmpB.set(b.inkTone ?? '#12141c').convertSRGBToLinear();
  const inkTone = tmpA.clone().lerp(tmpB, t);

  const L = (k) => THREE.MathUtils.lerp(a[k] ?? 0, b[k] ?? 0, t);

  return {
    region: t < 0.5 ? a : b,
    zenith: lerp3(pa.zenith, pb.zenith),
    mid: lerp3(pa.mid, pb.mid),
    horizon: lerp3(pa.horizon, pb.horizon),
    sun: lerp3(pa.sun, pb.sun),
    fog: lerp3(pa.fog, pb.fog),
    cloud: THREE.MathUtils.lerp(pa.cloud, pb.cloud, t),
    exposure: THREE.MathUtils.lerp(pa.exposure, pb.exposure, t),
    sunDir: sunDirection(pa).lerp(sunDirection(pb), t).normalize(),
    ink: L('ink'),
    mist: L('mist'),
    mistTop: THREE.MathUtils.lerp(a.mistTop || 40, b.mistTop || 40, t),
    fogDensity: L('fogDensity'),
    bloom: L('bloom'),
    sat: L('sat'),
    vignette: L('vignette'),
    paper, inkTone,
    PAPER_DEFAULT, INK_DEFAULT,
  };
}
