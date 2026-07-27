import * as THREE from 'three';
import { REGIONS } from '../regions/index.js';
import { pal, trail } from './kit.js';

import sea from './sea.js';
import drowned from './drowned.js';
import marsh from './marsh.js';
import poppy from './poppy.js';
import koriko from './koriko.js';
import cove from './cove.js';
import ocean from './ocean.js';
import bus from './bus.js';
import hillside from './hillside.js';
import safflower from './safflower.js';
import tama from './tama.js';
import rotary from './rotary.js';
import cats from './cats.js';
import garden from './garden.js';
import ink from './ink.js';
import cedar from './cedar.js';
import iron from './iron.js';
import meadow from './meadow.js';
import market from './market.js';
import hort from './hort.js';
import crooked from './crooked.js';
import valley from './valley.js';
import slag from './slag.js';
import laputa from './laputa.js';
import wind1920 from './wind1920.js';
import tower from './tower.js';
import sketch from './sketch.js';

// ---------------------------------------------------------------------------
// The places off the line.
//
// The ride gives each country one picture, held for twenty seconds. That is
// what a window seat is for and it should not change. But it means a country is
// used up in twenty seconds, and there is no reason to get down.
//
// So every country also holds the film's other places, and they are all OFF the
// axis — two hundred to a thousand metres either side, behind a ridge, round a
// headland, up a valley. You cannot see them from the seat. You have to go.
//
// Three rules, and they are the whole design:
//
//   1. The station keeps the headline image. Nothing moves to make room.
//   2. Everything else is out of sight from the train. A place you can see from
//      your seat is not a discovery, it is scenery.
//   3. Nothing is ever labelled in advance. There are no signs, no captions, no
//      markers hanging in the air saying what a thing is. The compass shows a
//      mark where SOMETHING is and no more, the ground shows you a path, and
//      the name only arrives once you are standing in the place — which makes
//      it a confirmation of what you already recognised rather than a caption
//      that recognises it for you.
//
// A country's places are written in that region's own local coordinates — the
// same numbers its builder uses — and slid into the running order by the same
// shift, so a place file can be read side by side with its region file.
//
// Rule 2 has a geometry to it. A window seat looks toward -x, so the +x side of
// the line is territory the ride can never see at all, and it is territory the
// regions leave empty because they were all composed toward the window. That is
// where most of this goes. The rest sits far enough out on the -x side to be
// behind the haze, or far enough up the line to be out of the frame at the one
// moment anyone is looking.
// ---------------------------------------------------------------------------

const COUNTRIES = [
  sea, drowned, marsh, poppy, koriko, cove, ocean, bus, hillside, safflower,
  tama, rotary, cats, garden, ink, cedar, iron, meadow, market, hort,
  crooked, valley, slag, laputa, wind1920, tower, sketch,
];

// One palette per country, made the first time anything in it is built.
const palettes = new Map();
function paletteFor(country, shared) {
  if (!palettes.has(country.region)) palettes.set(country.region, pal(shared, country.pal ?? {}));
  return palettes.get(country.region);
}

// Flatten to world space. `at` is region-local; the region's shift puts it on
// the line. Everything downstream deals in world coordinates only.
export const PLACES = [];
COUNTRIES.forEach((c) => {
  const region = REGIONS.find(r => r.id === c.region);
  if (!region) return;
  c.places.forEach((p, i) => {
    PLACES.push({
      ...p,
      key: `${c.region}:${p.id ?? i}`,
      country: c,
      region,
      film: p.film ?? region.film,
      x: p.at[0],
      z: p.at[1] + region.shift,
      r: p.r ?? 70,
      ground: p.ground ?? 1.5,
      trailFrom: p.trail ? [p.trail.from[0], p.trail.from[1] + region.shift] : null,
    });
  });
});

// ---------------------------------------------------------------------------
// Building. A place is made the first time you come near it ON FOOT — never
// while riding, because by rule 2 there is nothing to see from the train, and
// building ninety places for a journey that passes all of them would cost the
// ride everything it has.
// ---------------------------------------------------------------------------
export function createPlaces(scene, shared) {
  const live = new Map();

  function build(p) {
    if (live.has(p.key)) return live.get(p.key);
    const K = paletteFor(p.country, shared);
    const group = new THREE.Group();
    const made = p.build(K, { THREE, place: p }) ?? null;
    if (made) group.add(made);
    // The path there. It runs from somewhere near the station to the place
    // itself, and it is the only direction this world ever gives you.
    if (p.trail) {
      group.add(trail(K, {
        style: 'path', y: p.trail.y ?? p.ground - 0.02, seed: p.trail.from[0] | 0,
        ...p.trail, to: p.at,
      }));
    }
    group.position.set(0, 0, p.region.shift);
    scene.add(group);
    const entry = { place: p, group, update: made?.userData?.update ?? null };
    live.set(p.key, entry);
    return entry;
  }

  return {
    live,
    // Reach is generous on purpose: a place should already be standing when it
    // comes over the ridge, not pop into existence while you are looking at it.
    ensureNear(pos, reach = 900) {
      PLACES.forEach((p) => {
        if (Math.abs(p.z - pos.z) < reach && Math.abs(p.x - pos.x) < reach + 400) build(p);
      });
    },
    update(t, pos) {
      live.forEach((e) => {
        if (!e.update) return;
        const d = Math.hypot(e.place.x - pos.x, e.place.z - pos.z);
        e.update(t, 1 - THREE.MathUtils.smoothstep(d, e.place.r * 0.5, e.place.r * 2.2));
      });
    },
    get count() { return live.size; },
  };
}

// ---------------------------------------------------------------------------
// Where things are, for the compass and for arriving
// ---------------------------------------------------------------------------

// Everything within range, nearest first. Used by the compass strip, which
// shows a mark and a distance and never a name.
export function placesNear(pos, range = 1100) {
  const out = [];
  PLACES.forEach((p) => {
    const dx = p.x - pos.x, dz = p.z - pos.z;
    const d = Math.hypot(dx, dz);
    if (d < range) out.push({ place: p, d, bearing: Math.atan2(dx, -dz) });
  });
  out.sort((a, b) => a.d - b.d);
  return out;
}

// The one you are standing in, if you are standing in one.
export function placeAt(pos) {
  let best = null, bd = Infinity;
  PLACES.forEach((p) => {
    const d = Math.hypot(p.x - pos.x, p.z - pos.z);
    if (d < p.r && d < bd) { bd = d; best = p; }
  });
  return best;
}

// How high the ground is where you are standing. There is no heightfield in
// this world — every region lays its own shelves — so each place declares the
// level it sits on and the walk follows whichever one you are inside. Away from
// any place it is the region's own floor.
export function groundAt(pos) {
  let g = 1.5, bw = 0;
  PLACES.forEach((p) => {
    const d = Math.hypot(p.x - pos.x, p.z - pos.z);
    const w = 1 - THREE.MathUtils.smoothstep(d, p.r * 0.7, p.r * 1.9);
    if (w > bw) { bw = w; g = THREE.MathUtils.lerp(1.5, p.ground, w); }
  });
  return g;
}

export const PLACE_COUNT = PLACES.length;
