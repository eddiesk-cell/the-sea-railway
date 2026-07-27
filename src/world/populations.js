// ---------------------------------------------------------------------------
// Who is where.
//
// One table, in each region's own local coordinates, the same numbers its
// builder and its place file use. Everything is laid out so that at least one
// population is visible FROM THE SEAT — a town you can only find on foot is a
// town nobody knows is inhabited — and the rest waits at the places.
//
// Two countries are deliberately empty of people. The Hillside is Grave of the
// Fireflies and a crowd there would be obscene; the Garden is four inches off
// the ground, where a person is a weather event. Emptiness is a choice in both.
// ---------------------------------------------------------------------------

export const POPULATIONS = {
  sea: [
    // the street of stalls on the way to the bathhouse — the first thing in
    // the film that is wrong, and it is wrong because it is laid out for
    // customers who have not arrived
    { kind: 'stall', at: [-150, -96], y: 1.4, rot: 1.4 },
    { kind: 'stall', at: [-150, -128], y: 1.4, rot: 1.5 },
    { kind: 'stall', at: [-176, -112], y: 1.4, rot: -1.6 },
    { kind: 'walkers', n: 26, speed: 0.9, width: 6,
      path: { type: 'street', from: [-140, -60], to: [-190, -220], y: 1.4 } },
    { kind: 'walkers', n: 18, speed: 0.8, width: 14, scale: 1.05,
      path: { type: 'ring', at: [-268, -198], r: 120, r2: 90, y: 1.4 } },
    { kind: 'boats', n: 5, speed: 3.0, width: 30,
      path: { type: 'ring', at: [-200, -320], r: 260, r2: 190, y: 0.2 } },
  ],

  drowned: [
    // a car on the road that is under the tide, which is the picture
    { kind: 'cars', n: 4, speed: 11, width: 2.6, pause: false,
      path: { type: 'street', from: [-26, -180], to: [-26, -2180], y: 0.5 } },
    { kind: 'boats', n: 4, speed: 4.0, width: 40,
      path: { type: 'ring', at: [180, -1200], r: 260, r2: 180, y: 0.3 } },
    { kind: 'walkers', n: 10, speed: 0.9, width: 8,
      path: { type: 'ring', at: [560, -1200], r: 40, y: 26.5 } },
  ],

  marsh: [
    { kind: 'boats', n: 2, speed: 2.0, width: 14,
      path: { type: 'ring', at: [-300, -1400], r: 150, r2: 90, y: 0.2 } },
    { kind: 'walkers', n: 12, speed: 0.8, width: 10,
      path: { type: 'ring', at: [700, -2060], r: 44, y: 1.5 } },
  ],

  poppy: [
    { kind: 'walkers', n: 30, speed: 1.1, width: 5,
      path: { type: 'street', from: [-30, -300], to: [-30, -2400], y: 1.6 } },
    { kind: 'cars', n: 5, speed: 9, width: 3, pause: false,
      path: { type: 'street', from: [-44, -260], to: [-44, -2450], y: 1.6 } },
    { kind: 'boats', n: 4, speed: 2.6, width: 30,
      path: { type: 'ring', at: [-150, -1400], r: 130, r2: 300, y: 0.2 } },
    { kind: 'walkers', n: 16, speed: 1.0, width: 8, path: { type: 'ring', at: [520, -1300], r: 34, y: 1.5 } },
  ],

  koriko: [
    { kind: 'walkers', n: 34, speed: 1.0, width: 4.4,
      path: { type: 'street', from: [480, -1200], to: [480, -1300], y: 1.6 } },
    { kind: 'boats', n: 5, speed: 3.2, width: 40,
      path: { type: 'ring', at: [-180, -1300], r: 90, r2: 320, y: 0.3 } },
    { kind: 'cars', n: 3, speed: 7, width: 2.4, pause: false,
      path: { type: 'street', from: [-60, -400], to: [-60, -2300], y: 1.6 } },
  ],

  cove: [
    // Porco's own country, so the aircraft matter more than the people
    { kind: 'planes', n: 3, speed: 34, width: 60, scale: 1.1,
      path: { type: 'ring', at: [-100, -1350], r: 620, r2: 420, y: 96 } },
    { kind: 'boats', n: 4, speed: 3.6, width: 40,
      path: { type: 'ring', at: [-260, -1350], r: 320, r2: 240, y: 0.3 } },
    { kind: 'walkers', n: 14, speed: 0.9, width: 10, path: { type: 'ring', at: [700, -1250], r: 34, y: 3.0 } },
  ],

  ocean: [
    { kind: 'walkers', n: 22, speed: 1.0, width: 5,
      path: { type: 'street', from: [50, -300], to: [50, -2200], y: 1.5 } },
    { kind: 'cars', n: 4, speed: 10, width: 2.6, pause: false,
      path: { type: 'street', from: [-40, -260], to: [-40, -2260], y: 1.5 } },
  ],

  bus: [
    // one vehicle, once, in the rain. Anything more would fill a scene whose
    // entire subject is that there is nobody about.
    { kind: 'cars', n: 1, speed: 8, width: 0, pause: false,
      path: { type: 'street', from: [-112, -1250], to: [-112, -3800], y: 0.4 } },
  ],

  hillside: [],           // deliberately, and permanently, empty

  safflower: [
    { kind: 'walkers', n: 18, speed: 0.55, width: 20, scale: 0.95,
      path: { type: 'ring', at: [-180, -1300], r: 120, r2: 70, y: 2.0 } },
    { kind: 'walkers', n: 8, speed: 0.6, width: 8, path: { type: 'ring', at: [500, -1210], r: 26, y: 1.6 } },
  ],

  tama: [
    { kind: 'cars', n: 6, speed: 9, width: 3, pause: false,
      path: { type: 'ring', at: [1000, -2200], r: 110, r2: 110, y: 1.6 } },
    { kind: 'walkers', n: 16, speed: 0.9, width: 12,
      path: { type: 'ring', at: [1000, -2200], r: 150, r2: 150, y: 1.6 } },
    { kind: 'cars', n: 3, speed: 12, width: 2.4, pause: false,
      path: { type: 'street', from: [-40, -400], to: [-40, -2500], y: 1.6 } },
  ],

  rotary: [
    { kind: 'walkers', n: 24, speed: 1.0, width: 5,
      path: { type: 'street', from: [-40, -900], to: [-40, -1900], y: 1.6 } },
    { kind: 'cars', n: 4, speed: 8, width: 2.6, pause: false,
      path: { type: 'street', from: [-56, -700], to: [-56, -2100], y: 1.6 } },
    { kind: 'walkers', n: 12, speed: 0.85, width: 9, path: { type: 'ring', at: [520, -1240], r: 30, y: 1.5 } },
  ],

  cats: [],               // it is a cat town; the cats are in the place files

  garden: [],             // four inches off the ground, where a person is weather

  ink: [
    { kind: 'walkers', n: 14, speed: 0.7, width: 8, scale: 0.95,
      path: { type: 'ring', at: [-260, -2650], r: 70, r2: 44, y: 1.5 } },
    { kind: 'walkers', n: 9, speed: 0.6, width: 6, path: { type: 'ring', at: [900, -3300], r: 60, y: 1.6 } },
  ],

  cedar: [],              // nobody comes here, which is the point of it

  iron: [
    // inside the works, all night, going round the bellows floor
    { kind: 'walkers', n: 26, speed: 0.8, width: 9, scale: 1.0,
      path: { type: 'ring', at: [-260, -1300], r: 120, r2: 90, y: 2.0 } },
    { kind: 'walkers', n: 14, speed: 0.7, width: 7, path: { type: 'ring', at: [430, -1180], r: 22, r2: 34, y: 1.6 } },
    { kind: 'walkers', n: 12, speed: 0.7, width: 10, path: { type: 'ring', at: [1080, -2380], r: 50, y: 4.6 } },
    { kind: 'boats', n: 2, speed: 2.2, width: 20,
      path: { type: 'ring', at: [-300, -1500], r: 220, r2: 150, y: 0.2 } },
  ],

  meadow: [
    { kind: 'planes', n: 4, speed: 40, width: 70, scale: 0.9,
      path: { type: 'ring', at: [-200, -1400], r: 700, r2: 520, y: 150 } },
    { kind: 'ship', at: [-900, 340, -1500], len: 130, rot: 0.7, speed: 1.2, seed: 5 },
  ],

  market: [
    { kind: 'stall', at: [500, -1224], y: 1.5, rot: 1.6 },
    { kind: 'walkers', n: 30, speed: 1.0, width: 5,
      path: { type: 'street', from: [500, -1300], to: [500, -1180], y: 1.5 } },
    { kind: 'walkers', n: 20, speed: 1.0, width: 6,
      path: { type: 'ring', at: [-760, -1350], r: 160, r2: 130, y: 78 } },
    { kind: 'cars', n: 3, speed: 7, width: 2.4, pause: false,
      path: { type: 'street', from: [-50, -400], to: [-50, -2300], y: 1.6 } },
  ],

  hort: [
    { kind: 'stall', at: [474, -1240], y: 1.5, rot: 1.6 },
    { kind: 'stall', at: [486, -1272], y: 1.5, rot: -1.6 },
    { kind: 'walkers', n: 34, speed: 0.95, width: 6,
      path: { type: 'street', from: [480, -1330], to: [480, -1180], y: 1.5 } },
    { kind: 'boats', n: 4, speed: 3.0, width: 30,
      path: { type: 'ring', at: [-260, -1300], r: 240, r2: 180, y: 0.3 } },
    { kind: 'walkers', n: 10, speed: 0.8, width: 12, path: { type: 'ring', at: [800, -1820], r: 40, y: 1.6 } },
  ],

  crooked: [
    { kind: 'cars', n: 2, speed: 9, width: 0, pause: false,
      path: { type: 'street', from: [-28, -300], to: [-28, -2200], y: 1.9 } },
  ],

  valley: [
    { kind: 'ship', at: [-1100, 300, -1500], len: 150, rot: 0.9, speed: 1.0, seed: 11 },
    { kind: 'planes', n: 5, speed: 46, width: 80, scale: 1.2,
      path: { type: 'ring', at: [-500, -1500], r: 820, r2: 600, y: 175 } },
    { kind: 'walkers', n: 14, speed: 0.85, width: 10,
      path: { type: 'ring', at: [-220, -1500], r: 90, r2: 60, y: 1.6 } },
  ],

  slag: [
    { kind: 'walkers', n: 22, speed: 0.9, width: 6,
      path: { type: 'street', from: [-58, -400], to: [-58, -2400], y: 9.0 } },
    { kind: 'walkers', n: 10, speed: 0.8, width: 8, path: { type: 'ring', at: [780, -1900], r: 40, y: 26.5 } },
    { kind: 'ship', at: [-1300, 420, -1400], len: 110, rot: 0.5, speed: 1.4, seed: 21 },
  ],

  laputa: [
    // the fleet that came looking for it, standing off at a distance
    { kind: 'ship', at: [-1000, 260, -1200], len: 170, rot: 0.6, speed: 1.1, seed: 31 },
    { kind: 'ship', at: [-1500, 420, -2100], len: 120, rot: 1.1, speed: 0.8, seed: 37 },
    { kind: 'planes', n: 6, speed: 52, width: 90, scale: 1.1,
      path: { type: 'ring', at: [-300, -1500], r: 900, r2: 700, y: 230 } },
    { kind: 'walkers', n: 8, speed: 0.7, width: 10, path: { type: 'ring', at: [560, -1600], r: 60, y: 121 } },
  ],

  wind1920: [
    // the whole country is about aircraft, so the sky is where the life is
    { kind: 'planes', n: 6, speed: 44, width: 80, scale: 1.0,
      path: { type: 'ring', at: [-200, -1310], r: 640, r2: 460, y: 120 } },
    { kind: 'planes', n: 3, speed: 30, width: 40, scale: 0.8,
      path: { type: 'ring', at: [500, -1240], r: 260, r2: 200, y: 55 } },
    { kind: 'ship', at: [-1200, 380, -1800], len: 140, rot: 0.8, speed: 1.3, seed: 41 },
    { kind: 'walkers', n: 12, speed: 0.9, width: 10, path: { type: 'ring', at: [500, -1240], r: 36, y: 1.6 } },
  ],

  tower: [
    { kind: 'boats', n: 2, speed: 1.8, width: 20,
      path: { type: 'ring', at: [-600, -1500], r: 240, r2: 180, y: 0.2 } },
    { kind: 'walkers', n: 6, speed: 0.7, width: 8, path: { type: 'ring', at: [860, -2260], r: 44, y: 1.6 } },
  ],

  sketch: [
    // four people, drawn, walking nowhere in particular
    { kind: 'walkers', n: 4, speed: 0.8, width: 4, scale: 1.1,
      path: { type: 'ring', at: [-104, -1420], r: 40, r2: 26, y: 1.4 } },
  ],
};
