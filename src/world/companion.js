import * as THREE from 'three';
import { box, mulberry } from './geo.js';
import { makePaintMaterial } from './paintMaterial.js';

// ---------------------------------------------------------------------------
// The traveller.
//
// Eddie asked for a companion and suggested a character out of one of the
// films. I have not done that, and the reason is worth writing down.
//
// A named character fixes the film. Walk Kiki through Iron Town and the world
// stops being twenty-seven countries and becomes a crossover — you are not
// arriving anywhere any more, you are touring with a celebrity. Every Ghibli
// film opens with somebody who does not belong there yet: Chihiro at the gate,
// Ashitaka riding west, Sophie walking out of the hat shop. Being the stranger
// IS the feeling, and a famous face standing next to you takes it away.
//
// There are two duller reasons as well, and both are real. A beloved character
// rendered slightly wrong is far worse than a tree rendered slightly wrong —
// the face is the whole performance, and no procedural mesh under a Kuwahara
// filter is going to hold it. And this is a public repository: an homage that
// borrows a silhouette is one thing, one that ships a named character is
// another.
//
// So: an original traveller. A coat, a satchel, a scarf, and hair. You never
// see the face, because there is never a face to see — she walks a little ahead
// of you and turns to look at whatever you are looking at, which is what a
// person beside you actually does. She gives the world scale, which is the
// thing a painted landscape most badly needs and the reason the Cat Bureau only
// worked once there was a flowerpot standing next to it.
// ---------------------------------------------------------------------------

export function createCompanion(shared, opts = {}) {
  const coatCol = opts.coat ?? '#a8622f';
  const g = new THREE.Group();
  g.visible = false;

  const coat = makePaintMaterial(shared, {
    color: coatCol, shadowTint: '#33180c', rim: 1.0, bands: 3, grain: 0.16, grainScale: 1.2,
  });
  const under = makePaintMaterial(shared, {
    color: '#d8ccb0', shadowTint: '#4c4438', rim: 0.9, bands: 3, grain: 0.14,
  });
  const dark = makePaintMaterial(shared, {
    color: '#2a2620', shadowTint: '#0d0c0a', rim: 0.9, bands: 3, grain: 0.14, grainScale: 1.5,
  });
  const hairM = makePaintMaterial(shared, {
    color: '#3a2a22', shadowTint: '#120c0a', rim: 1.2, bands: 3, grain: 0.12, grainScale: 2.0,
  });
  const skin = makePaintMaterial(shared, {
    color: '#c8a184', shadowTint: '#5a3f30', rim: 1.0, bands: 3, grain: 0.10,
  });
  const scarfM = makePaintMaterial(shared, {
    color: '#cf4f3e', shadowTint: '#4a1a16', rim: 1.1, bands: 2, grain: 0.14,
    side: THREE.DoubleSide, sway: 0.055,
  });

  // ---- the body, in parts that can move ----
  // Scale: 1.66 m to the top of the head, which is the number every building in
  // this world is now measured against whether it knows it or not.
  const hips = new THREE.Group();
  hips.position.y = 0.86;
  g.add(hips);

  const torso = new THREE.Mesh(box(0.40, 0.52, 0.24), under);
  torso.position.y = 0.26; hips.add(torso);

  // The coat: a truncated cone so the hem stands away from the legs, which is
  // the whole silhouette. Split into a fixed shoulder and a swinging skirt.
  const shoulders = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.27, 0.34, 10), coat);
  shoulders.position.y = 0.36; hips.add(shoulders);
  const skirt = new THREE.Group();
  skirt.position.y = 0.20; hips.add(skirt);
  const hem = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.36, 0.42, 10, 1, true), coat);
  hem.position.y = -0.21; skirt.add(hem);
  const hemCap = new THREE.Mesh(new THREE.RingGeometry(0.0, 0.36, 10), coat);
  hemCap.rotation.x = Math.PI / 2; hemCap.position.y = -0.42; skirt.add(hemCap);

  const arms = [];
  for (const s of [-1, 1]) {
    const a = new THREE.Group();
    a.position.set(s * 0.235, 0.48, 0);
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.46, 6), coat);
    upper.position.y = -0.23; a.add(upper);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.052, 6, 5), skin);
    hand.position.y = -0.47; a.add(hand);
    hips.add(a); arms.push(a);
  }

  const legs = [];
  for (const s of [-1, 1]) {
    const l = new THREE.Group();
    l.position.set(s * 0.10, 0, 0);
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.05, 0.84, 6), dark);
    shin.position.y = -0.42; l.add(shin);
    const boot = new THREE.Mesh(box(0.13, 0.11, 0.24), dark);
    boot.position.set(0, -0.86, 0.03); l.add(boot);
    hips.add(l); legs.push(l);
  }

  // ---- the head. There is no face on it, and there is not going to be. ----
  const neck = new THREE.Group();
  neck.position.y = 0.66; hips.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 9), skin);
  head.scale.set(1, 1.1, 0.94); head.position.y = 0.12; neck.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.128, 12, 9), hairM);
  hair.scale.set(1, 1.05, 1.0); hair.position.set(0, 0.135, -0.012); neck.add(hair);
  // a bob, cut level, hanging past the jaw — it is what keeps the face away
  const bob = new THREE.Mesh(new THREE.CylinderGeometry(0.132, 0.128, 0.20, 12, 1, true), hairM);
  bob.position.set(0, 0.055, -0.012); neck.add(bob);
  const fringe = new THREE.Mesh(new THREE.SphereGeometry(0.128, 12, 6, 0, Math.PI * 2, 0, 0.9), hairM);
  fringe.position.set(0, 0.115, 0.012); fringe.scale.set(1, 0.8, 1.02); neck.add(fringe);

  // ---- a scarf, because a still figure needs one moving thing ----
  const scarf = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.86, 1, 5), scarfM);
  scarf.position.set(0.03, 0.30, -0.14);
  scarf.rotation.x = -0.16;
  neck.add(scarf);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.10, 0.036, 5, 12), scarfM);
  collar.rotation.x = Math.PI / 2; collar.position.y = 0.02; neck.add(collar);

  // ---- the satchel: the only thing she is carrying, and it swings ----
  const bagPivot = new THREE.Group();
  bagPivot.position.set(-0.20, 0.44, 0); hips.add(bagPivot);
  const strap = new THREE.Mesh(box(0.045, 0.44, 0.02), dark);
  strap.position.y = -0.20; strap.rotation.z = -0.28; bagPivot.add(strap);
  const bag = new THREE.Mesh(box(0.24, 0.20, 0.11), dark);
  bag.position.set(-0.11, -0.42, 0); bagPivot.add(bag);
  const flap = new THREE.Mesh(box(0.25, 0.10, 0.125), coat);
  flap.position.set(-0.11, -0.34, 0); bagPivot.add(flap);

  // ---- state ----
  const pos = new THREE.Vector3();
  const want = new THREE.Vector3();
  const vel = new THREE.Vector3();
  let facing = 0, phase = 0, idle = 0, placed = false;
  const rnd = mulberry(41);
  const tmp = new THREE.Vector3();

  // How far in front she likes to be. Two and a half metres was the instinct
  // and it was wrong by a factor of three: at that range a 1.66 m figure fills
  // a fifth of the frame and you are looking down on the top of her head. At
  // seven she is a person walking ahead of you, which is the whole idea.
  const SPEED = 7.2;        // she can outwalk you a little, so she stays ahead
  const KEEP = 7.0;
  const OFF = 0.40;         // radians off your line of sight

  return {
    group: g,
    get position() { return pos; },

    // Put her down beside you — used when you first step off the train, so she
    // does not come sprinting up the line from the last place you walked.
    reset(at, yaw) {
      pos.copy(at);
      pos.x += Math.sin(yaw + OFF) * -KEEP;
      pos.z += Math.cos(yaw + OFF) * -KEEP;
      facing = yaw; vel.set(0, 0, 0); placed = true;
    },

    // camPos: where you are. yaw: which way you are looking. ground: the floor
    // under her feet. lookAt: the thing you have arrived at, if any.
    update(dt, camPos, yaw, ground, lookAt = null, active = true) {
      g.visible = active;
      if (!active) { placed = false; return; }
      if (!placed) this.reset(camPos, yaw);

      // She stands off your leading shoulder, in front and to the left, which
      // is where a person walking with you actually is. Not behind — a figure
      // that follows reads as a pet.
      want.set(
        camPos.x - Math.sin(yaw + OFF) * KEEP,
        ground,
        camPos.z - Math.cos(yaw + OFF) * KEEP,
      );
      tmp.copy(want).sub(pos); tmp.y = 0;
      const d = tmp.length();

      // A dead band, or she jitters for ever trying to hit an exact point.
      const go = d > 0.55;
      if (go) {
        tmp.multiplyScalar(1 / d);
        const sp = Math.min(SPEED, 1.1 + d * 2.4);
        vel.lerp(tmp.multiplyScalar(sp), 1 - Math.pow(0.002, dt));
      } else {
        vel.lerp(tmp.set(0, 0, 0), 1 - Math.pow(0.0006, dt));
      }
      pos.addScaledVector(vel, dt);
      pos.y = THREE.MathUtils.lerp(pos.y, ground, 1 - Math.pow(0.01, dt));

      const speed = Math.hypot(vel.x, vel.z);
      idle = speed > 0.4 ? 0 : idle + dt;

      // ---- which way she is pointing ----
      let facingWant;
      if (speed > 0.5) {
        facingWant = Math.atan2(vel.x, vel.z);
      } else if (lookAt) {
        facingWant = Math.atan2(lookAt.x - pos.x, lookAt.z - pos.z);
      } else {
        // standing still with nowhere to be: she looks where you look
        facingWant = yaw + Math.PI;
      }
      let dd = ((facingWant - facing + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      facing += dd * (1 - Math.pow(0.004, dt));

      g.position.copy(pos);
      g.rotation.y = facing;

      // ---- the walk ----
      // Stride length is fixed, so the step rate follows the speed and it never
      // moonwalks. Below a crawl it settles rather than mincing on the spot.
      phase += (speed / 1.05) * dt * Math.PI;
      const sw = Math.min(1, speed / 3.4);
      const s1 = Math.sin(phase), s2 = Math.sin(phase * 2);
      legs[0].rotation.x = s1 * 0.62 * sw;
      legs[1].rotation.x = -s1 * 0.62 * sw;
      arms[0].rotation.x = -s1 * 0.42 * sw;
      arms[1].rotation.x = s1 * 0.42 * sw;
      hips.position.y = 0.86 + Math.abs(s2) * 0.035 * sw;
      hips.rotation.y = s1 * 0.09 * sw;
      hips.rotation.x = 0.055 * sw;
      skirt.rotation.x = -s1 * 0.16 * sw;
      skirt.rotation.z = s2 * 0.05 * sw;
      bagPivot.rotation.x = -s1 * 0.20 * sw - 0.04;

      // ---- and when nothing is happening, she has a look round ----
      if (idle > 2.2) {
        const t = idle - 2.2;
        neck.rotation.y = Math.sin(t * 0.42 + rnd() * 0.001) * 0.34;
        neck.rotation.x = Math.sin(t * 0.27) * 0.10;
      } else {
        neck.rotation.y *= Math.pow(0.02, dt);
        neck.rotation.x *= Math.pow(0.02, dt);
      }
    },
  };
}
