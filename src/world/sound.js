// ---------------------------------------------------------------------------
// The sound of each place.
//
// Nothing is recorded — there are no audio files here any more than there are
// textures. Every bed is noise through a filter, and every event is one
// oscillator with an envelope on it. A grove of bamboo in wind, acoustically,
// is a wide band of leaf hiss that swells with the gust, a narrower rustle
// underneath, and every so often two canes knocking together. Rain is a hiss
// with a low rumble under it. A river is the same hiss an octave up and never
// changing. Wind is the same hiss two octaves down, breathing.
//
// Each REGION declares how much of each bed it wants, and those levels
// cross-fade at the border exactly like the sky does — so a soundscape belongs
// to its own country and to nowhere else. Point sources (the bamboo grove) get
// a vicinity factor on top, so they also fade with distance inside a region.
//
// The gust that drives the leaf volume is the SAME number that bends the canes
// in the vertex shader, so what you hear is what you are watching move.
//
// A browser will not make a sound until the user has touched the page, so
// nothing is created until the first click or keypress.
// ---------------------------------------------------------------------------

export const BEDS = ['leaves', 'rustle', 'rain', 'water', 'stream', 'wind', 'town'];

export function createSound() {
  let ctx = null;
  let master = null;
  let enabled = true;
  const gains = {};                 // bed name -> GainNode
  const evBus = {};                 // event name -> GainNode
  const timers = { knock: 1.2, creak: 3.0, cry: 2.0, thunder: 9.0 };

  function noiseBuffer(seconds, brown) {
    const N = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, N, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < N; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = w * (1 - brown) + last * 12 * brown;
    }
    // the loop point has to be silent or it ticks once a cycle, forever
    const F = 3000;
    for (let i = 0; i < F; i++) { const a = i / F; d[i] *= a; d[N - 1 - i] *= a; }
    return buf;
  }

  function layer(buf, type, freq, q, pan, rate, into, level) {
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true; src.playbackRate.value = rate;
    const f = ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    const p = ctx.createStereoPanner(); p.pan.value = pan;
    const g = ctx.createGain(); g.gain.value = level;
    src.connect(f); f.connect(p); p.connect(g); g.connect(into);
    src.start();
  }

  function bed(name) {
    const g = ctx.createGain();
    g.gain.value = 0;
    g.connect(master);
    gains[name] = g;
    return g;
  }

  function build() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const white = noiseBuffer(3.1, 0.0);
    const soft = noiseBuffer(2.7, 0.45);

    // ---- leaves: the bright brush of a thousand small blades ----
    const lv = bed('leaves');
    layer(white, 'bandpass', 3400, 0.62, -0.42, 1.00, lv, 1.00);
    layer(white, 'bandpass', 5200, 0.75, 0.46, 0.87, lv, 0.55);
    layer(soft, 'bandpass', 1500, 0.55, 0.05, 0.93, lv, 0.62);

    // ---- rustle: the bed under it that never quite stops ----
    const ru = bed('rustle');
    layer(white, 'highpass', 2600, 0.4, 0.0, 1.07, ru, 1.0);

    // ---- rain ----
    const rn = bed('rain');
    layer(white, 'bandpass', 1900, 0.35, -0.30, 1.00, rn, 1.00);
    layer(soft, 'lowpass', 640, 0.70, 0.30, 1.00, rn, 0.85);

    // ---- water: a shore, breathing ----
    const wa = bed('water');
    layer(soft, 'lowpass', 420, 0.60, -0.25, 0.62, wa, 1.0);
    layer(white, 'bandpass', 900, 0.40, 0.28, 0.55, wa, 0.42);

    // ---- stream: a river over stones. Brighter, and it does not breathe.
    const st = bed('stream');
    layer(white, 'bandpass', 2400, 0.50, -0.35, 0.93, st, 1.0);
    layer(white, 'bandpass', 4200, 0.80, 0.38, 1.11, st, 0.48);
    layer(soft, 'lowpass', 520, 0.60, 0.0, 0.80, st, 0.55);

    // ---- wind: the same noise, two octaves down, and huge ----
    const wi = bed('wind');
    layer(soft, 'lowpass', 300, 0.50, -0.20, 0.42, wi, 1.0);
    layer(white, 'bandpass', 720, 0.35, 0.24, 0.60, wi, 0.30);

    // ---- town: a harbour heard from a hillside, which is almost nothing ----
    const tw = bed('town');
    layer(soft, 'bandpass', 260, 0.40, 0.0, 0.50, tw, 1.0);

    ['knock', 'creak', 'cry', 'thunder'].forEach((k) => {
      const g = ctx.createGain(); g.gain.value = 0; g.connect(master); evBus[k] = g;
    });
    return true;
  }

  // ---- events ----------------------------------------------------------

  // Two canes meeting: hollow, pitched, no attack to speak of, gone in a
  // quarter second. It is what makes a grove read as wood rather than weather.
  function knock(vel) {
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    const f0 = 150 + Math.random() * 210;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f0 * 0.72, t + 0.22);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = f0 * 2.1; bp.Q.value = 2.6;
    env(o, bp, vel, 0.004, 0.18 + Math.random() * 0.16, evBus.knock, t);
  }

  // A windmill turning: a long wooden complaint, once per revolution.
  function creak(vel) {
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    const f0 = 62 + Math.random() * 40;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.linearRampToValueAtTime(f0 * (1.1 + Math.random() * 0.3), t + 0.7);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 320 + Math.random() * 260; bp.Q.value = 6.0;
    env(o, bp, vel, 0.12, 0.7, evBus.creak, t);
  }

  // A gull, or something like one: a falling cry with a rasp on it.
  function cry(vel) {
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    const f0 = 700 + Math.random() * 700;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f0 * 0.55, t + 0.32);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = f0 * 1.2; bp.Q.value = 4.5;
    env(o, bp, vel, 0.02, 0.30, evBus.cry, t);
  }

  // Thunder a long way off: almost no pitch, and it takes its time.
  function thunder(vel) {
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(48 + Math.random() * 26, t);
    o.frequency.exponentialRampToValueAtTime(26, t + 2.4);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 180; lp.Q.value = 0.8;
    env(o, lp, vel, 0.35, 2.6, evBus.thunder, t);
  }

  function env(osc, filt, vel, atk, rel, into, t) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(vel, 0.0002), t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + atk + rel);
    const p = ctx.createStereoPanner();
    p.pan.value = Math.random() * 1.6 - 0.8;
    osc.connect(filt); filt.connect(g); g.connect(p); p.connect(into);
    osc.start(t); osc.stop(t + atk + rel + 0.3);
  }

  return {
    get on() { return enabled; },
    get live() { return !!ctx; },

    start() {
      if (!ctx && !build()) return;
      if (ctx.state === 'suspended') ctx.resume();
    },

    toggle() {
      enabled = !enabled;
      if (enabled) this.start();
      if (ctx) master.gain.setTargetAtTime(enabled ? 1 : 0, ctx.currentTime, 0.12);
      return enabled;
    },

    // mix: a level per bed, already blended between regions and already
    // multiplied by any vicinity the caller cares about. wind is the gust.
    update(dt, mix, wind) {
      if (!ctx) return;
      const now = ctx.currentTime;
      const gust = Math.max(0, wind);
      const set = (node, v, tau) => node.gain.setTargetAtTime(v, now, tau);

      // Leaves and wind are the two beds that breathe with the gust; the rest
      // are steady, because rain and rivers do not care how hard it is blowing.
      set(gains.leaves, (mix.leaves || 0) * (0.05 + 0.50 * gust) * 0.30, 0.28);
      set(gains.rustle, (mix.leaves || 0) * (0.05 + 0.16 * gust) * 0.30, 0.45);
      set(gains.wind, (mix.wind || 0) * (0.10 + 0.55 * gust) * 0.26, 0.40);
      set(gains.rain, (mix.rain || 0) * 0.24, 0.55);
      set(gains.water, (mix.water || 0) * 0.30, 0.60);
      set(gains.stream, (mix.stream || 0) * 0.22, 0.55);
      set(gains.town, (mix.town || 0) * 0.20, 0.70);
      set(evBus.knock, (mix.knock || 0) * 0.42, 0.40);
      set(evBus.creak, (mix.creak || 0) * 0.30, 0.40);
      set(evBus.cry, (mix.cry || 0) * 0.22, 0.40);
      set(evBus.thunder, (mix.thunder || 0) * 0.55, 0.60);
      set(master, enabled ? 1 : 0, 0.15);

      const fire = (name, rate, fn, vel) => {
        const amt = mix[name] || 0;
        if (amt < 0.12) { timers[name] = Math.max(timers[name], 0.4); return; }
        timers[name] -= dt * rate;
        if (timers[name] <= 0) { fn(vel()); timers[name] = 0.3 + Math.random() * (2.6 / rate); }
      };
      fire('knock', 0.35 + gust * 1.9, knock, () => 0.05 + Math.random() * 0.11 * (0.4 + gust));
      fire('creak', 0.30 + gust * 0.5, creak, () => 0.04 + Math.random() * 0.06);
      fire('cry', 0.45, cry, () => 0.05 + Math.random() * 0.07);
      fire('thunder', 0.10, thunder, () => 0.20 + Math.random() * 0.35);
    },
  };
}

// The wind itself: one number, shared by the shader that bends the canes and
// the gain that makes them audible, so the two can never disagree.
export function windAt(t) {
  const w = 0.42
    + 0.30 * Math.sin(t * 0.117)
    + 0.20 * Math.sin(t * 0.313 + 1.3)
    + 0.12 * Math.sin(t * 0.79 + 2.7);
  return Math.max(0.04, w);
}
