import * as THREE from 'three';
import { shelf, grove, scatter, put, box, hill, mulberry } from './kit.js';

// ---------------------------------------------------------------------------
// Castle in the Sky — the island.
//
// The window keeps the island, the root and the vines. Off it: the garden level
// on top, with grass and a pond and birds and a robot standing in it with moss
// growing on him; the tomb at the centre with the tree's root going through it;
// and the underside, from below, which is black stone and weather.
//
// Everything in this country is at altitude, so the places declare a high
// ground and the walk follows them up.
// ---------------------------------------------------------------------------

export default {
  region: 'laputa',
  pal: {
    turf: { color: '#4e7040', shadowTint: '#182818', rim: 0.5, bands: 3, grain: 0.22, grainScale: 0.5 },
    moss: { color: '#5c7a3a', shadowTint: '#1c2a16', rim: 0.5, bands: 3, grain: 0.26, grainScale: 0.4, sway: 0.03, translucency: 0.7 },
    stone: { color: '#8e8a80', shadowTint: '#2e2c2a', rim: 1.0, bands: 3, grain: 0.24, grainScale: 1.3, wrap: 0.55 },
    dark: { color: '#2e3038', shadowTint: '#0e1014', rim: 1.0, bands: 3, grain: 0.2, grainScale: 1.1 },
    metal: { color: '#7a7268', shadowTint: '#282622', rim: 1.6, bands: 3, grain: 0.14 },
    leaf: { color: '#42642e', shadowTint: '#14200e', rim: 0.5, bands: 3, grain: 0.22, grainScale: 0.35, sway: 0.04, translucency: 0.8 },
    root: { color: '#5e4c38', shadowTint: '#201810', rim: 0.8, bands: 3, grain: 0.28, grainScale: 1.8 },
    water: { color: '#2a5c66', shadowTint: '#0c2028', rim: 2.2, bands: 2, grain: 0.05 },
    crystal: { color: '#8ad0e0', shadowTint: '#2c5460', rim: 2.4, bands: 2, grain: 0.06, emissive: '#7fe0f0', emissiveStrength: 0.15 },
  },

  places: [
    {
      id: 'the-garden-level',
      name: 'The garden',
      at: [560, -1600], r: 150, ground: 120,
      trail: { from: [110, -1480], style: 'stones', y: 118 },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(1986);
        const C = [560, -1600];

        // A lawn on top of a stone island, with a pond in it. Ordinary — which
        // is what makes it strange, five hundred metres above the sea.
        const plate = new THREE.Mesh(hill(230, 22, 3, { rough: 0.12, rings: 10, sectors: 24 }), M.turf);
        plate.position.set(C[0], 100, C[1]); g.add(plate);
        const rim = new THREE.Mesh(new THREE.CylinderGeometry(232, 210, 60, 26, 1, true), M.stone);
        rim.position.set(C[0], 82, C[1]); g.add(rim);
        const pond = new THREE.Mesh(new THREE.CircleGeometry(46, 26), M.water);
        pond.rotation.x = -Math.PI / 2; pond.position.set(C[0] + 40, 120.6, C[1] + 20);
        pond.renderOrder = 4; g.add(pond);

        // the robot: standing, still, with a bird's nest on one shoulder
        const r = new THREE.Group();
        r.position.set(C[0] - 60, 120, C[1] - 30); r.rotation.y = 0.8;
        const torso = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.2, 8.0, 12), M.metal);
        torso.position.y = 8.0; r.add(torso);
        const headM = new THREE.Mesh(new THREE.SphereGeometry(2.4, 12, 9), M.metal);
        headM.scale.y = 0.8; headM.position.y = 13.4; r.add(headM);
        for (const sx of [-1, 1]) {
          const eye = new THREE.Mesh(new THREE.CircleGeometry(0.55, 10), M.dark);
          eye.position.set(sx * 0.9, 13.6, 2.0); r.add(eye);
          const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.7, 8.0, 8), M.metal);
          arm.position.set(sx * 3.6, 8.6, 0); arm.rotation.z = sx * 0.14; r.add(arm);
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.0, 4.2, 8), M.metal);
          leg.position.set(sx * 1.5, 2.1, 0); r.add(leg);
        }
        // moss over all of him, which is the whole character
        const mossy = [];
        for (let i = 0; i < 90; i++) {
          const a = rnd() * 6.28, y = 1 + rnd() * 13;
          const s = 0.4 + rnd() * 0.8;
          mossy.push({ pos: [Math.cos(a) * 3.0, y, Math.sin(a) * 3.0], rot: [0, rnd() * 6.28, 0], scale: [s, s * 0.4, s] });
        }
        put(r, mossy, new THREE.IcosahedronGeometry(1, 0), M.moss);
        const nest = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.0, 0.8, 10), M.root);
        nest.position.set(-2.6, 12.6, 0); r.add(nest);
        g.add(r);

        g.add(scatter(M, { n: 3600, at: C, r: 200, y: 120, mat: M.leaf, s: 1.2, seed: 12 }));
        g.add(grove(M, { n: 90, at: C, inner: 70, r: 190, kind: 'broad', mat: M.leaf, h: 12, spread: 7, seed: 5 }));
        // the great tree's trunk, at the far edge, going up out of the frame
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(16, 30, 200, 16), M.root);
        trunk.position.set(C[0] + 140, 220, C[1] - 90); g.add(trunk);
        return g;
      },
    },

    {
      id: 'the-tomb',
      name: 'The tomb at the centre',
      at: [900, -2100], r: 120, ground: 100,
      trail: { from: [160, -1980], style: 'lanterns', y: 100 },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(41);
        const C = [900, -2100];
        const plate = new THREE.Mesh(hill(190, 14, 7, { rough: 0.1, rings: 8, sectors: 22 }), M.stone);
        plate.position.set(C[0], 88, C[1]); g.add(plate);

        // A round chamber, open to the sky, with the root of the tree coming
        // down through the middle of it and out the floor.
        for (let i = 0; i < 26; i++) {
          const a = (i / 26) * Math.PI * 2;
          const col = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 24, 10), M.stone);
          col.position.set(C[0] + Math.cos(a) * 54, 112, C[1] + Math.sin(a) * 54); g.add(col);
        }
        const ring = new THREE.Mesh(new THREE.TorusGeometry(54, 3.0, 8, 34), M.stone);
        ring.rotation.x = Math.PI / 2; ring.position.set(C[0], 125, C[1]); g.add(ring);
        const root = new THREE.Mesh(new THREE.CylinderGeometry(9, 16, 90, 14), M.root);
        root.position.set(C[0], 118, C[1]); root.rotation.z = 0.08; g.add(root);
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          const r2 = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 2.6, 30, 7), M.root);
          r2.position.set(C[0] + Math.cos(a) * 14, 90, C[1] + Math.sin(a) * 14);
          r2.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); g.add(r2);
        }
        // the stone at the middle, and its light
        const core = new THREE.Mesh(new THREE.OctahedronGeometry(4.0, 0), M.crystal);
        core.position.set(C[0], 102, C[1]); core.renderOrder = 9; g.add(core);
        const dust = [];
        for (let i = 0; i < 400; i++) {
          dust.push({
            pos: [C[0] + (rnd() - 0.5) * 110, 92 + rnd() * 40, C[1] + (rnd() - 0.5) * 110],
            rot: [0, 0, 0], scale: [0.4, 0.4, 0.4],
          });
        }
        put(g, dust, new THREE.IcosahedronGeometry(1, 0), M.crystal, 9);
        g.userData.update = (t, near) => {
          core.rotation.y = t * 0.12;
          M.crystal.uniforms.uEmiStr.value = 0.12 + near * 0.55 + Math.sin(t * 0.5) * 0.05;
        };
        return g;
      },
    },

    {
      id: 'the-underside',
      name: 'The underside',
      at: [700, -2660], r: 150, ground: 20,
      trail: { from: [130, -2540], style: 'posts', y: 20 },
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(88);
        const C = [700, -2660];
        g.add(shelf(M, { r: 230, h: 20, mat: M.stone, seed: 3, rough: 0.3 }).translateX(C[0]).translateZ(C[1]));

        // Looking UP at it: black stone, a forest of stalactites, and the vines
        // that hang down out of the garden two hundred metres above.
        const under = new THREE.Mesh(new THREE.SphereGeometry(200, 22, 12, 0, 6.28, 0, 1.2), M.dark);
        under.scale.y = -0.55; under.position.set(C[0], 230, C[1]); g.add(under);
        const spikes = [];
        for (let i = 0; i < 320; i++) {
          const a = rnd() * 6.28, d = Math.pow(rnd(), 0.5) * 180;
          const s = 4 + rnd() * 22;
          spikes.push({
            pos: [C[0] + Math.cos(a) * d, 190 + rnd() * 20, C[1] + Math.sin(a) * d],
            rot: [Math.PI, rnd() * 6.28, 0], scale: [s * 0.22, s, s * 0.22],
          });
        }
        put(g, spikes, new THREE.ConeGeometry(1, 1, 6, 1), M.dark);
        const vines = [];
        for (let i = 0; i < 260; i++) {
          const a = rnd() * 6.28, d = 60 + rnd() * 140;
          const l = 30 + rnd() * 90;
          vines.push({
            pos: [C[0] + Math.cos(a) * d, 200 - l / 2, C[1] + Math.sin(a) * d],
            rot: [(rnd() - 0.5) * 0.1, rnd() * 6.28, (rnd() - 0.5) * 0.1], scale: [0.6, l, 0.6],
          });
        }
        put(g, vines, new THREE.CylinderGeometry(1, 0.6, 1, 5), M.root);
        g.add(scatter(M, { n: 900, at: C, r: 200, y: 21, mat: M.moss, s: 1.6, seed: 9 }));
        return g;
      },
    },
  ],
};
