import * as THREE from 'three';
import { samplePalette, sunDirection } from '../world/sky.js';

// ---------------------------------------------------------------------------
// The line is divided into regions, laid end to end in the order of the ride.
// Each owns a stretch of track and declares the air inside it: sky keys, haze,
// exposure, wind, weather, and whether the world there is painted or brushed.
// Between two regions everything cross-fades over a couple of hundred metres,
// so the train carries you out of one world and into the next without a seam.
//
// Each also names a station — the point where the thing it was built for is
// directly out of the window — and that is where the journey controls stop.
//
// `authored` is the zNear a region's geometry was originally written against.
// Everything since is written against zero and simply slid into place, which
// is what lets the running order change without touching a builder.
// ---------------------------------------------------------------------------

const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);

export const BLEND = 280;

const ORDER = [
  {
    id: 'sea', stop: 1, title: 'The Sea Railway', film: 'Spirited Away', year: 2001,
    length: 2050, stationAt: 900, authored: 900,
    hourDriven: true,                 // this one answers to the hour slider
    ink: 0, wet: 0, wind: 0.55,
    sound: { water: 0.85, wind: 0.30, cry: 0.10 },
    fogDensity: 0.00045,
    bloom: 1.0, sat: 1.0, vignette: 0.55, mist: 0.0, mistTop: 0,
  },
  {
    id: 'drowned', stop: 2, title: 'The Drowned Road', film: 'Ponyo', year: 2008,
    length: 2400, stationAt: 1250,
    ink: 0, wet: 0, wind: 1.05,
    sound: { water: 1.00, wind: 0.55, cry: 0.30 },
    fogDensity: 0.00038,
    bloom: 1.15, sat: 1.14, vignette: 0.40, mist: 0.0, mistTop: 0,
    // Full morning, and far too bright and far too blue — a child's poster
    // paint. Ponyo is the only Ghibli sea that is cheerful about drowning you.
    palette: {
      zenith:  [0.115, 0.240, 0.520], mid: [0.240, 0.420, 0.720],
      horizon: [0.640, 0.780, 0.880], sun: [1.000, 0.960, 0.830],
      fog:     [0.640, 0.775, 0.870],
      sunY: 0.62, cloud: 0.72, exposure: 0.90,
    },
  },
  {
    id: 'koriko', stop: 5, title: 'Koriko', film: "Kiki's Delivery Service", year: 1989,
    length: 2600, stationAt: 1300,
    ink: 0, wet: 0, wind: 0.75,
    sound: { water: 0.45, wind: 0.40, town: 0.70, cry: 0.55 },
    fogDensity: 0.00042,
    bloom: 1.05, sat: 1.06, vignette: 0.46, mist: 0.0, mistTop: 0,
    // Late afternoon on a northern harbour, the light going gold on the roofs.
    palette: {
      zenith:  [0.120, 0.215, 0.430], mid: [0.290, 0.400, 0.610],
      horizon: [0.860, 0.700, 0.480], sun: [1.000, 0.830, 0.560],
      fog:     [0.780, 0.700, 0.560],
      sunY: 0.20, cloud: 0.52, exposure: 0.96,
    },
  },
  {
    id: 'bus', stop: 8, title: 'The Bus Stop', film: 'My Neighbour Totoro', year: 1988,
    length: 2750, stationAt: 1310, authored: -1150,
    ink: 0, wet: 1, wind: 0.9,
    sound: { rain: 1.00, wind: 0.30, water: 0.20 },
    fogDensity: 0.00105,
    bloom: 1.25, sat: 0.94, vignette: 0.70, mist: 0.34, mistTop: 26,
    // Night, and raining hard. Everything is blue except the one lamp, which
    // is the whole point of the picture.
    palette: {
      zenith:  [0.017, 0.026, 0.055], mid: [0.030, 0.046, 0.090],
      horizon: [0.062, 0.082, 0.130], sun: [0.150, 0.190, 0.290],
      fog:     [0.052, 0.070, 0.115],
      sunY: 0.16, cloud: 0.97, exposure: 1.30,
    },
  },
  {
    id: 'ink', stop: 15, title: 'The Ink Country', film: 'The Tale of the Princess Kaguya', year: 2013,
    length: 3400, stationAt: 1500, authored: -1150,
    ink: 1, wet: 0, wind: 0.85,
    sound: { leaves: 1.00, knock: 1.00, wind: 0.35, stream: 0.12 },
    paper: '#f6f0e4', inkTone: '#12141c',
    fogDensity: 0.00026,
    bloom: 0.10, sat: 1.0, vignette: 0.16,
    mist: 0.80, mistTop: 42,
    // A sea of cloud with three decks in it: the peaks have to be cut across
    // at height, not merely hazed at the foot, or they read as hills.
    cloudDecks: [[70, 14], [190, 20], [350, 26]],
    // The light underneath the ink still matters: it is what gives each face
    // its value, and the value is what the brush is actually painting.
    palette: {
      zenith:  [0.700, 0.720, 0.762], mid: [0.790, 0.798, 0.818],
      horizon: [0.892, 0.880, 0.848], sun: [0.930, 0.915, 0.870],
      fog:     [0.878, 0.862, 0.828],
      sunY: 0.52, cloud: 0.30, exposure: 1.02,
    },
  },
  {
    id: 'cedar', stop: 16, title: 'The Cedar Forest', film: 'Princess Mononoke', year: 1997,
    length: 2600, stationAt: 1300,
    ink: 0, wet: 0, wind: 0.30,
    sound: { stream: 0.90, leaves: 0.35, wind: 0.20, cry: 0.18 },
    fogDensity: 0.00150,
    bloom: 0.85, sat: 0.92, vignette: 0.74, mist: 0.80, mistTop: 44,
    // Green dark under a canopy that closed a thousand years ago. What light
    // there is has been through leaves twice.
    palette: {
      zenith:  [0.055, 0.100, 0.090], mid: [0.105, 0.165, 0.140],
      horizon: [0.230, 0.285, 0.235], sun: [0.520, 0.580, 0.420],
      fog:     [0.235, 0.288, 0.245],
      sunY: 0.42, cloud: 0.55, exposure: 1.24,
    },
  },
  {
    id: 'meadow', stop: 18, title: 'The Meadow', film: "Howl's Moving Castle", year: 2004,
    length: 2800, stationAt: 1400,
    ink: 0, wet: 0, wind: 0.95,
    sound: { wind: 0.85, leaves: 0.30, cry: 0.35, creak: 0.22 },
    fogDensity: 0.00034,
    bloom: 1.05, sat: 1.10, vignette: 0.38, mist: 0.0, mistTop: 0,
    // Alpine noon. The most straightforwardly happy sky on the whole line.
    palette: {
      zenith:  [0.110, 0.245, 0.560], mid: [0.290, 0.470, 0.760],
      horizon: [0.720, 0.820, 0.880], sun: [1.000, 0.965, 0.870],
      fog:     [0.700, 0.800, 0.870],
      sunY: 0.74, cloud: 0.60, exposure: 0.88,
    },
  },
  {
    id: 'valley', stop: 22, title: 'The Valley of the Wind', film: 'Nausicaä', year: 1984,
    length: 3000, stationAt: 1500,
    ink: 0, wet: 0, wind: 1.25,
    sound: { wind: 1.00, leaves: 0.45, creak: 0.80 },
    fogDensity: 0.00060,
    bloom: 1.15, sat: 1.02, vignette: 0.56, mist: 0.20, mistTop: 30,
    // Dust in the air and the wind never stopping — the one place on the line
    // where the weather is the reason anyone can live there.
    palette: {
      zenith:  [0.170, 0.220, 0.330], mid: [0.400, 0.380, 0.360],
      horizon: [0.760, 0.590, 0.360], sun: [1.000, 0.780, 0.470],
      fog:     [0.700, 0.580, 0.420],
      sunY: 0.26, cloud: 0.45, exposure: 0.98,
    },
  },
  {
    id: 'laputa', stop: 24, title: 'Laputa', film: 'Castle in the Sky', year: 1986,
    length: 3000, stationAt: 1500,
    ink: 0, wet: 0, wind: 1.15,
    sound: { wind: 1.00, thunder: 0.85, leaves: 0.25 },
    fogDensity: 0.00052,
    bloom: 1.35, sat: 1.0, vignette: 0.60, mist: 0.55, mistTop: 34,
    // Storm light: the sun is somewhere above the cloud deck and everything
    // beneath it is lit from a direction that makes no sense.
    palette: {
      zenith:  [0.100, 0.130, 0.200], mid: [0.250, 0.270, 0.310],
      horizon: [0.680, 0.640, 0.560], sun: [1.000, 0.900, 0.700],
      fog:     [0.560, 0.560, 0.540],
      sunY: 0.40, cloud: 0.88, exposure: 0.94,
    },
  },
];

// lay them end to end
let cursor = 900;
export const REGIONS = ORDER.map((r) => {
  const zNear = cursor;
  const zFar = cursor - r.length;
  cursor = zFar;
  return { ...r, zNear, zFar, station: zNear - r.stationAt, shift: zNear - (r.authored ?? 0) };
});

export const LINE_START = REGIONS[0].zNear;
export const LINE_END = REGIONS[REGIONS.length - 1].zFar;

// The whole route, including the stretches not laid yet — because a line you
// can see the length of is a different thing from a line you can't.
export const LINE = [
  ['The Sea Railway', 'Spirited Away', 2001],
  ['The Drowned Road', 'Ponyo', 2008],
  ['The Marsh House', 'When Marnie Was There', 2014],
  ['Poppy Hill', 'From Up on Poppy Hill', 2011],
  ['Koriko', "Kiki's Delivery Service", 1989],
  ['The Hidden Cove', 'Porco Rosso', 1992],
  ['Ocean Waves', 'Ocean Waves', 1993],
  ['The Bus Stop', 'My Neighbour Totoro', 1988],
  ['The Hillside', 'Grave of the Fireflies', 1988],
  ['Safflower Fields', 'Only Yesterday', 1991],
  ['Tama Hills', 'Pom Poko', 1994],
  ['The Rotary', 'Whisper of the Heart', 1995],
  ['The Cat Bureau', 'The Cat Returns', 2002],
  ['The Garden', 'Arrietty', 2010],
  ['The Ink Country', 'The Tale of the Princess Kaguya', 2013],
  ['The Cedar Forest', 'Princess Mononoke', 1997],
  ['Iron Town', 'Princess Mononoke', 1997],
  ['The Meadow', "Howl's Moving Castle", 2004],
  ['Market Chipping', "Howl's Moving Castle", 2004],
  ['Hort Town', 'Tales from Earthsea', 2006],
  ['The Crooked House', 'Earwig and the Witch', 2020],
  ['The Valley of the Wind', 'Nausicaä', 1984],
  ['Slag Ravine', 'Castle in the Sky', 1986],
  ['Laputa', 'Castle in the Sky', 1986],
  ['The Meadow of 1920', 'The Wind Rises', 2013],
  ['The Tower', 'The Boy and the Heron', 2023],
  ['The Sketch', 'My Neighbors the Yamadas', 1999],
].map(([title, film, year], i) => {
  const built = REGIONS.find(r => r.stop === i + 1) || null;
  return { n: i + 1, title, film, year, built };
});

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
const SOUND_KEYS = ['leaves', 'rain', 'water', 'stream', 'wind', 'town', 'knock', 'creak', 'cry', 'thunder'];
const NO_DECKS = [[0, 1], [0, 1], [0, 1]];

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

  // The soundscape blends exactly like the sky does, which is what makes a
  // region's sound belong to that region and to nowhere else on the line.
  const sound = {};
  SOUND_KEYS.forEach((k) => {
    const v = THREE.MathUtils.lerp(a.sound?.[k] ?? 0, b.sound?.[k] ?? 0, t);
    if (v > 0.0005) sound[k] = v;
  });

  // Decks belong to whichever region is nearer, and fade with its ink rather
  // than sliding: lerping a deck's altitude would drag it through the peaks.
  const decks = (t < 0.5 ? a : b).cloudDecks ?? NO_DECKS;

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
    wet: L('wet'),
    wind: THREE.MathUtils.lerp(a.wind ?? 0.7, b.wind ?? 0.7, t),
    mist: L('mist'),
    mistTop: THREE.MathUtils.lerp(a.mistTop || 40, b.mistTop || 40, t),
    decks, deckAmt: L('ink'),
    fogDensity: L('fogDensity'),
    bloom: L('bloom'),
    sat: L('sat'),
    vignette: L('vignette'),
    sound,
    paper, inkTone,
    PAPER_DEFAULT, INK_DEFAULT,
  };
}
