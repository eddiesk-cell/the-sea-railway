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
// Get this wrong by a hundred metres and the region appears to be empty: the
// house, the tower, the lit door are all still there, just not in the window
// at the one moment anyone is looking. Check stationAt against the z the
// subject was authored at, every time.
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
    grass: '#5f7a33', grassLo: '#1a2a22',
    length: 2050, stationAt: 900, authored: 900,
    hourDriven: true,                 // this one answers to the hour slider
    ink: 0, wet: 0, wind: 0.55,
    sound: { water: 0.85, wind: 0.30, cry: 0.10 },
    fogDensity: 0.00045,
    bloom: 1.0, sat: 1.0, vignette: 0.55, mist: 0.0, mistTop: 0,
  },
  {
    id: 'drowned', stop: 2, title: 'The Drowned Road', film: 'Ponyo', year: 2008,
    grass: '#5f8a3e', grassLo: '#1d3524',
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
    id: 'marsh', stop: 3, title: 'The Marsh House', film: 'When Marnie Was There', year: 2014,
    grass: '#7f8a52', grassLo: '#2c3226',
    length: 2600, stationAt: 1300,
    ink: 0, wet: 0, wind: 0.60,
    sound: { water: 0.55, wind: 0.55, leaves: 0.45, cry: 0.30 },
    fogDensity: 0.00055, bloom: 1.20, sat: 1.02, vignette: 0.58, mist: 0.32, mistTop: 22,
    // The last twenty minutes of light over a tidal flat: the sky has gone
    // rose and the water is holding it, which is why the mud is the brightest
    // thing in the region and the house is nearly a silhouette.
    waterDeep: '#38384a', waterShallow: '#7d6f74',
    palette: {
      zenith:  [0.075, 0.105, 0.220], mid: [0.230, 0.215, 0.330],
      horizon: [0.780, 0.520, 0.430], sun: [1.000, 0.720, 0.520],
      fog:     [0.480, 0.400, 0.420],
      sunY: 0.10, az: 1.22, cloud: 0.55, exposure: 0.94,
    },
  },
  {
    id: 'poppy', stop: 4, title: 'Poppy Hill', film: 'From Up on Poppy Hill', year: 2011,
    grass: '#6d8f36', grassLo: '#22331f',
    length: 2700, stationAt: 1350,
    ink: 0, wet: 0, wind: 0.85,
    sound: { town: 0.75, water: 0.70, cry: 0.55, wind: 0.45 },
    fogDensity: 0.00042, bloom: 0.92, sat: 1.08, vignette: 0.42, mist: 0.05, mistTop: 26,
    // Eight in the morning in 1963, and nothing bad has happened yet.
    waterDeep: '#0d2030', waterShallow: '#2b4a54',
    palette: {
      zenith:  [0.105, 0.230, 0.520], mid: [0.280, 0.440, 0.720],
      horizon: [0.800, 0.820, 0.800], sun: [1.000, 0.950, 0.840],
      fog:     [0.700, 0.760, 0.820],
      sunY: 0.44, az: 1.10, cloud: 0.42, exposure: 0.88,
    },
  },
  {
    id: 'koriko', stop: 5, title: 'Koriko', film: "Kiki's Delivery Service", year: 1989,
    grass: '#66883a', grassLo: '#20301e',
    length: 2600, stationAt: 1300,
    ink: 0, wet: 0, wind: 0.75,
    sound: { water: 0.45, wind: 0.40, town: 0.70, cry: 0.55 },
    fogDensity: 0.00042,
    bloom: 0.85, sat: 1.06, vignette: 0.46, mist: 0.06, mistTop: 30,
    // Late afternoon on a northern harbour, the light going gold on the roofs.
    palette: {
      zenith:  [0.120, 0.215, 0.430], mid: [0.290, 0.400, 0.610],
      horizon: [0.860, 0.700, 0.480], sun: [1.000, 0.830, 0.560],
      fog:     [0.780, 0.700, 0.560],
      sunY: 0.20, az: 1.05, cloud: 0.52, exposure: 0.78,
    },
  },
  {
    id: 'cove', stop: 6, title: 'The Hidden Cove', film: 'Porco Rosso', year: 1992,
    grass: '#8a9146', grassLo: '#2e3220',
    length: 2700, stationAt: 1350,
    ink: 0, wet: 0, wind: 0.55,
    sound: { water: 1.00, wind: 0.35, cry: 0.45 },
    fogDensity: 0.00030, bloom: 0.70, sat: 1.02, vignette: 0.36, mist: 0.0, mistTop: 0,
    // Directly overhead. The only region on the line with no low sun in it,
    // because Porco is the only Ghibli film with no dusk in it — and the one
    // that needed the exposure pulled hardest DOWN, because white limestone
    // under a noon sun with any bloom at all is just a white rectangle.
    waterDeep: '#062a3a', waterShallow: '#186370',
    palette: {
      zenith:  [0.055, 0.180, 0.520], mid: [0.170, 0.380, 0.680],
      horizon: [0.560, 0.680, 0.740], sun: [0.900, 0.890, 0.820],
      fog:     [0.520, 0.640, 0.700],
      sunY: 0.86, az: 1.20, cloud: 0.22, exposure: 0.58,
    },
  },
  {
    id: 'ocean', stop: 7, title: 'Ocean Waves', film: 'Ocean Waves', year: 1993,
    grass: '#5c8038', grassLo: '#1c2c1e',
    length: 2400, stationAt: 1300,
    ink: 0, wet: 0, wind: 0.40,
    sound: { water: 0.65, leaves: 0.70, town: 0.30, cry: 0.20, wind: 0.20 },
    fogDensity: 0.00040, bloom: 0.80, sat: 0.94, vignette: 0.34, mist: 0.09, mistTop: 18,
    // Three in the afternoon in August. Heat haze, not fog — the first pass
    // ran the density and the mist so high that the region was a white sheet
    // with a green stripe in it, which is what "hazy" always turns into if you
    // reach for the fog slider instead of desaturating the far distance.
    waterDeep: '#20404e', waterShallow: '#5a7c84',
    palette: {
      zenith:  [0.190, 0.300, 0.520], mid: [0.420, 0.510, 0.650],
      horizon: [0.760, 0.770, 0.740], sun: [0.960, 0.930, 0.840],
      fog:     [0.700, 0.720, 0.700],
      sunY: 0.70, az: 1.05, cloud: 0.35, exposure: 0.70,
    },
  },
  {
    id: 'bus', stop: 8, title: 'The Bus Stop', film: 'My Neighbour Totoro', year: 1988,
    grass: '#4e7a30', grassLo: '#16281a',
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
    id: 'hillside', stop: 9, title: 'The Hillside', film: 'Grave of the Fireflies', year: 1988,
    grass: '#7a7c3c', grassLo: '#28281a',
    length: 2600, stationAt: 1300,
    ink: 0, wet: 0, wind: 0.30,
    // the quietest mix on the line, and it stays that way
    sound: { water: 0.22, wind: 0.30, leaves: 0.25 },
    fogDensity: 0.00080, bloom: 1.30, sat: 0.86, vignette: 0.78, mist: 0.40, mistTop: 24,
    waterDeep: '#0a1018', waterShallow: '#16202a',
    palette: {
      zenith:  [0.022, 0.032, 0.058], mid: [0.048, 0.062, 0.096],
      horizon: [0.110, 0.120, 0.150], sun: [0.230, 0.240, 0.280],
      fog:     [0.075, 0.086, 0.110],
      sunY: 0.07, az: 1.15, cloud: 0.62, exposure: 1.22,
    },
  },
  {
    id: 'safflower', stop: 10, title: 'Safflower Fields', film: 'Only Yesterday', year: 1991,
    grass: '#84913f', grassLo: '#2c2f1c',
    length: 2600, stationAt: 1300,
    ink: 0, wet: 0, wind: 0.50,
    sound: { leaves: 0.55, wind: 0.45, cry: 0.30, stream: 0.20 },
    fogDensity: 0.00050, bloom: 1.05, sat: 1.10, vignette: 0.46, mist: 0.28, mistTop: 26,
    // First light on a hill farm: the mist still in the terraces and the sun
    // only just onto the top one.
    palette: {
      zenith:  [0.115, 0.150, 0.290], mid: [0.330, 0.310, 0.400],
      horizon: [0.880, 0.640, 0.450], sun: [1.000, 0.800, 0.520],
      fog:     [0.620, 0.530, 0.470],
      sunY: 0.12, az: 1.20, cloud: 0.48, exposure: 0.90,
    },
  },
  {
    id: 'tama', stop: 11, title: 'Tama Hills', film: 'Pom Poko', year: 1994,
    grass: '#587c33', grassLo: '#1b2a1c',
    // the station sits exactly ON the boundary, so the window holds wood on one
    // side of the frame and cut earth on the other — which is the whole region
    length: 2800, stationAt: 1330,
    ink: 0, wet: 0, wind: 0.55,
    sound: { leaves: 0.60, wind: 0.35, town: 0.40, knock: 0.55, creak: 0.25 },
    fogDensity: 0.00055, bloom: 0.85, sat: 0.94, vignette: 0.50, mist: 0.16, mistTop: 30,
    // Flat overcast, which is the right light for this: no sun to make the cut
    // earth beautiful.
    palette: {
      zenith:  [0.240, 0.290, 0.380], mid: [0.430, 0.470, 0.530],
      horizon: [0.660, 0.670, 0.660], sun: [0.780, 0.780, 0.760],
      fog:     [0.580, 0.600, 0.600],
      sunY: 0.50, az: 1.10, cloud: 0.86, exposure: 0.78,
    },
  },
  {
    id: 'rotary', stop: 12, title: 'The Rotary', film: 'Whisper of the Heart', year: 1995,
    grass: '#5d7f37', grassLo: '#1e2c1e',
    length: 2700, stationAt: 1290,
    ink: 0, wet: 0, wind: 0.45,
    sound: { town: 0.55, wind: 0.35, leaves: 0.30, cry: 0.20 },
    fogDensity: 0.00075, bloom: 1.10, sat: 1.06, vignette: 0.52, mist: 0.20, mistTop: 26,
    // The half hour before sunrise, with the street lights still on down there.
    palette: {
      zenith:  [0.085, 0.115, 0.245], mid: [0.270, 0.265, 0.360],
      horizon: [0.840, 0.610, 0.470], sun: [1.000, 0.790, 0.540],
      fog:     [0.560, 0.500, 0.470],
      sunY: 0.09, az: 1.25, cloud: 0.54, exposure: 0.86,
    },
  },
  {
    id: 'cats', stop: 13, title: 'The Cat Bureau', film: 'The Cat Returns', year: 2002,
    grass: '#6f9440', grassLo: '#233420',
    length: 2400, stationAt: 1300,
    ink: 0, wet: 0, wind: 0.50,
    sound: { leaves: 0.45, wind: 0.35, town: 0.45, cry: 0.20 },
    fogDensity: 0.00042, bloom: 1.10, sat: 1.12, vignette: 0.42, mist: 0.08, mistTop: 18,
    // Late afternoon, low and warm, so a town the size of a hedge throws long
    // shadows across its own square.
    palette: {
      zenith:  [0.130, 0.230, 0.450], mid: [0.330, 0.430, 0.620],
      horizon: [0.860, 0.720, 0.520], sun: [1.000, 0.860, 0.620],
      fog:     [0.720, 0.660, 0.560],
      sunY: 0.19, az: 1.18, cloud: 0.44, exposure: 0.82,
    },
  },
  {
    id: 'garden', stop: 14, title: 'The Garden', film: 'Arrietty', year: 2010,
    grass: '#4a7332', grassLo: '#152418',
    length: 2600, stationAt: 1300,
    ink: 0, wet: 0, wind: 0.85,
    sound: { leaves: 1.00, wind: 0.45, stream: 0.18, cry: 0.15 },
    fogDensity: 0.00048, bloom: 1.15, sat: 1.14, vignette: 0.44, mist: 0.24, mistTop: 26,
    // Sun through leaves rather than onto them: everything green in this
    // region is lit from behind, which is what four inches off the ground
    // actually looks like on a summer afternoon.
    palette: {
      zenith:  [0.110, 0.230, 0.470], mid: [0.300, 0.450, 0.640],
      horizon: [0.700, 0.760, 0.640], sun: [1.000, 0.960, 0.740],
      fog:     [0.600, 0.680, 0.560],
      sunY: 0.44, az: 1.15, cloud: 0.40, exposure: 0.74,
    },
  },
  {
    id: 'ink', stop: 15, title: 'The Ink Country', film: 'The Tale of the Princess Kaguya', year: 2013,
    grass: '#7c8a54', grassLo: '#2a2f22',
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
    grass: '#3f6b3a', grassLo: '#122019',
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
    id: 'iron', stop: 17, title: 'Iron Town', film: 'Princess Mononoke', year: 1997,
    grass: '#5a6b34', grassLo: '#1c231a',
    length: 2600, stationAt: 1300,
    ink: 0, wet: 0, wind: 0.45,
    sound: { town: 0.95, knock: 0.90, water: 0.35, wind: 0.25, creak: 0.30 },
    fogDensity: 0.00090,
    bloom: 1.55, sat: 0.96, vignette: 0.72, mist: 0.55, mistTop: 40,
    // Night on a lake, and one furnace. Everything is the colour of nothing so
    // that the one orange in the middle of it can be the whole picture.
    palette: {
      zenith:  [0.030, 0.042, 0.062], mid: [0.062, 0.078, 0.098],
      horizon: [0.150, 0.140, 0.130], sun: [0.360, 0.260, 0.180],
      fog:     [0.115, 0.112, 0.112],
      sunY: 0.14, az: 1.30, cloud: 0.80, exposure: 1.26,
    },
  },
  {
    id: 'meadow', stop: 18, title: 'The Meadow', film: "Howl's Moving Castle", year: 2004,
    grass: '#79a043', grassLo: '#253620',
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
    id: 'market', stop: 19, title: 'Market Chipping', film: "Howl's Moving Castle", year: 2004,
    grass: '#6b8c3c', grassLo: '#22301e',
    length: 2600, stationAt: 1300,
    ink: 0, wet: 0, wind: 0.55,
    sound: { town: 1.00, wind: 0.30, cry: 0.35, creak: 0.30, leaves: 0.25 },
    fogDensity: 0.00040,
    bloom: 1.00, sat: 1.08, vignette: 0.42, mist: 0.14, mistTop: 34,
    // Mid-morning in a valley town: warm, hazy, and entirely untroubled.
    palette: {
      zenith:  [0.130, 0.255, 0.520], mid: [0.330, 0.480, 0.720],
      horizon: [0.830, 0.800, 0.700], sun: [1.000, 0.940, 0.800],
      fog:     [0.760, 0.750, 0.680],
      sunY: 0.52, az: 0.95, cloud: 0.50, exposure: 0.92,
    },
  },
  {
    id: 'hort', stop: 20, title: 'Hort Town', film: 'Tales from Earthsea', year: 2006,
    grass: '#8c8544', grassLo: '#2e2a1c',
    length: 2600, stationAt: 1300,
    ink: 0, wet: 0, wind: 0.60,
    sound: { town: 0.65, water: 0.55, wind: 0.50, cry: 0.35, creak: 0.25 },
    fogDensity: 0.00048, bloom: 0.95, sat: 1.04, vignette: 0.50, mist: 0.16, mistTop: 30,
    // Mid-afternoon, dry, and the light has gone the colour of the walls.
    waterDeep: '#123444', waterShallow: '#3a6a70',
    palette: {
      zenith:  [0.110, 0.210, 0.420], mid: [0.330, 0.400, 0.540],
      horizon: [0.820, 0.700, 0.500], sun: [1.000, 0.880, 0.640],
      fog:     [0.700, 0.630, 0.500],
      sunY: 0.34, az: 1.20, cloud: 0.30, exposure: 0.76,
    },
  },
  {
    id: 'crooked', stop: 21, title: 'The Crooked House', film: 'Earwig and the Witch', year: 2020,
    grass: '#5e7a3c', grassLo: '#1e2a1e',
    length: 2400, stationAt: 1300,
    ink: 0, wet: 1, wind: 0.75,
    sound: { rain: 0.90, wind: 0.45, leaves: 0.25, creak: 0.30 },
    fogDensity: 0.00110, bloom: 1.30, sat: 0.88, vignette: 0.76, mist: 0.40, mistTop: 22,
    // Night, wet, and English about it: everything blue-grey except one door.
    palette: {
      zenith:  [0.020, 0.028, 0.048], mid: [0.040, 0.052, 0.080],
      horizon: [0.090, 0.104, 0.130], sun: [0.190, 0.210, 0.260],
      fog:     [0.072, 0.084, 0.104],
      sunY: 0.14, az: 1.05, cloud: 0.95, exposure: 1.24,
    },
  },
  {
    id: 'valley', stop: 22, title: 'The Valley of the Wind', film: 'Nausicaä', year: 1984,
    grass: '#7d8f4a', grassLo: '#2a2f20',
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
    id: 'slag', stop: 23, title: 'Slag Ravine', film: 'Castle in the Sky', year: 1986,
    grass: '#6a6f3a', grassLo: '#24241a',
    length: 2600, stationAt: 1300,
    ink: 0, wet: 0, wind: 0.35,
    sound: { town: 0.70, knock: 1.00, wind: 0.45, stream: 0.22, creak: 0.45 },
    fogDensity: 0.00055,
    bloom: 1.40, sat: 0.90, vignette: 0.70, mist: 0.22, mistTop: 46,
    // First light at the bottom of a gorge. Night was the honest instinct and
    // the wrong one: with no sun at all the rock, the town and the sky all
    // resolve to the same black, and the region has nothing in it but three
    // lit windows. Dawn keeps the coal and gives the walls something to be
    // seen against.
    palette: {
      zenith:  [0.190, 0.235, 0.360], mid: [0.420, 0.400, 0.440],
      horizon: [0.860, 0.620, 0.400], sun: [1.000, 0.780, 0.480],
      fog:     [0.520, 0.440, 0.400],
      sunY: 0.17, az: 1.15, cloud: 0.72, exposure: 0.98,
    },
  },
  {
    id: 'laputa', stop: 24, title: 'Laputa', film: 'Castle in the Sky', year: 1986,
    grass: '#6da44a', grassLo: '#203220',
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
  {
    id: 'wind1920', stop: 25, title: 'The Meadow of 1920', film: 'The Wind Rises', year: 2013,
    grass: '#84a047', grassLo: '#2a3620',
    length: 2800, stationAt: 1310,
    ink: 0, wet: 0, wind: 1.15,
    sound: { wind: 0.95, leaves: 0.55, cry: 0.25 },
    fogDensity: 0.00034, bloom: 0.95, sat: 1.08, vignette: 0.38, mist: 0.0, mistTop: 0,
    // High summer, high sun, and the deepest blue on the line.
    palette: {
      zenith:  [0.070, 0.190, 0.560], mid: [0.170, 0.390, 0.740],
      horizon: [0.540, 0.690, 0.790], sun: [1.000, 0.960, 0.840],
      fog:     [0.500, 0.640, 0.740],
      sunY: 0.72, az: 1.10, cloud: 0.55, exposure: 0.70,
    },
  },
  {
    id: 'tower', stop: 26, title: 'The Tower', film: 'The Boy and the Heron', year: 2023,
    grass: '#4d6f38', grassLo: '#18251c',
    length: 2700, stationAt: 1300,
    ink: 0, wet: 0, wind: 0.55,
    sound: { leaves: 0.55, water: 0.45, wind: 0.50, cry: 0.40, creak: 0.20 },
    fogDensity: 0.00090, bloom: 0.80, sat: 0.82, vignette: 0.62, mist: 0.48, mistTop: 36,
    // Overcast and almost directionless. The one region that must not look
    // picturesque, so there is no sun in it to make it so.
    waterDeep: '#2a3238', waterShallow: '#59646a',
    palette: {
      zenith:  [0.200, 0.240, 0.290], mid: [0.380, 0.410, 0.440],
      horizon: [0.600, 0.615, 0.610], sun: [0.700, 0.710, 0.700],
      fog:     [0.520, 0.545, 0.545],
      sunY: 0.40, az: 1.05, cloud: 0.92, exposure: 0.86,
    },
  },
  {
    id: 'sketch', stop: 27, title: 'The Sketch', film: 'My Neighbors the Yamadas', year: 1999,
    grass: '#7fa04a', grassLo: '#2a3420',
    length: 3000, stationAt: 1500,
    ink: 1, wet: 0, wind: 0.65,
    sound: { leaves: 0.40, wind: 0.30, cry: 0.20 },
    // brighter paper and a softer, bluer ink than Kaguya: felt pen on a smooth
    // white page, not charcoal on a rough one
    paper: '#fcfaf5', inkTone: '#3a4450',
    fogDensity: 0.00016, bloom: 0.10, sat: 1.0, vignette: 0.12, mist: 0.0, mistTop: 0,
    palette: {
      zenith:  [0.860, 0.868, 0.880], mid: [0.900, 0.906, 0.914],
      horizon: [0.944, 0.940, 0.930], sun: [0.960, 0.955, 0.945],
      fog:     [0.940, 0.938, 0.930],
      sunY: 0.60, az: 1.10, cloud: 0.18, exposure: 1.00,
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
    sunY: p.sunY, az: p.az, cloud: p.cloud, exposure: p.exposure,
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

  // The sea is a different colour in every country it turns up in, and until
  // now it was the same flooded-plain slate everywhere — which made an
  // Adriatic cove read as a puddle in Yorkshire.
  tmpA.set(a.waterDeep ?? '#060c17').convertSRGBToLinear();
  tmpB.set(b.waterDeep ?? '#060c17').convertSRGBToLinear();
  const waterDeep = tmpA.clone().lerp(tmpB, t);
  tmpA.set(a.waterShallow ?? '#11202c').convertSRGBToLinear();
  tmpB.set(b.waterShallow ?? '#11202c').convertSRGBToLinear();
  const waterShallow = tmpA.clone().lerp(tmpB, t);

  // And so is the ground. One green for every country made the meadow at
  // Iron Town the same meadow as the lawn outside the Cat Bureau, and half
  // of what tells you which film you are in is what colour the grass is.
  tmpA.set(a.grass ?? '#5f7a33').convertSRGBToLinear();
  tmpB.set(b.grass ?? '#5f7a33').convertSRGBToLinear();
  const grass = tmpA.clone().lerp(tmpB, t);
  tmpA.set(a.grassLo ?? '#1a2a22').convertSRGBToLinear();
  tmpB.set(b.grassLo ?? '#1a2a22').convertSRGBToLinear();
  const grassLo = tmpA.clone().lerp(tmpB, t);

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
    paper, inkTone, waterDeep, waterShallow, grass, grassLo,
    PAPER_DEFAULT, INK_DEFAULT,
  };
}
