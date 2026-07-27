import * as THREE from 'three';
import { scatter, put, box, mulberry } from './kit.js';

// ---------------------------------------------------------------------------
// My Neighbors the Yamadas.
//
// One place, and it is the absence of one.
//
// This is the last country on the line and it is a blank page on purpose. So
// the only thing to find by walking is the edge of the drawing: go far enough
// off the line and the ground stops, the horizon stops, and there is nothing
// but paper. Standing at that edge is where the railway ends and where it
// starts again.
// ---------------------------------------------------------------------------

export default {
  region: 'sketch',
  pal: {
    line: { color: '#b9b6ae', shadowTint: '#6a6862', rim: 0.9, bands: 2, grain: 0.10, wrap: 0.7, inkBias: 0.30 },
    faint: { color: '#cfcdc6', shadowTint: '#8a8880', rim: 0.9, bands: 2, grain: 0.08, wrap: 0.8, inkBias: 0.16 },
    green: { color: '#7fa060', shadowTint: '#465440', rim: 0.9, bands: 2, grain: 0.10,
             side: THREE.DoubleSide, sway: 0.10, translucency: 1.2, inkBias: -0.2 },
  },

  places: [
    {
      id: 'the-edge-of-the-drawing',
      name: 'Where the drawing runs out',
      at: [900, -1500], r: 200, ground: 1.4,
      // no trail. There is nothing to follow, and that is the point — you find
      // this by walking away from everything until everything stops.
      build: (M) => {
        const g = new THREE.Group();
        const rnd = mulberry(1999);
        const C = [900, -1500];

        // The ground thins out rather than ending: full plates near the line,
        // then patches, then a few strokes, then paper.
        for (let i = 0; i < 90; i++) {
          const t = i / 90;
          const x = C[0] - 500 + t * 620;
          const keep = 1 - t;
          for (let k = 0; k < 8; k++) {
            if (rnd() > keep * 1.15) continue;
            const b = new THREE.Mesh(box(70 + rnd() * 40, 1.4, 60 + rnd() * 50), M.line);
            b.position.set(x + (rnd() - 0.5) * 40, 0.7, C[1] - 260 + k * 70 + (rnd() - 0.5) * 30);
            g.add(b);
          }
        }
        // a last few strokes of grass, getting sparser, and then none
        for (let p = 0; p < 6; p++) {
          const t = p / 6;
          g.add(scatter(M, {
            n: Math.round(900 * (1 - t)), at: [C[0] - 380 + t * 460, C[1] + (p % 2 ? 90 : -110)],
            r: 90, y: 1.4, mat: M.green, s: 0.9, seed: 10 + p,
          }));
        }

        // and one pencil line drawn along the ground, going out past the last
        // of it and stopping in the middle of nothing
        const strokes = [];
        for (let i = 0; i < 70; i++) {
          const t = i / 70;
          strokes.push({
            pos: [C[0] - 260 + t * 620, 1.44, C[1] + Math.sin(t * 3.1) * 26],
            rot: [0, 0.1 + Math.cos(t * 3.1) * 0.2, 0],
            scale: [9 + rnd() * 4, 0.06, 0.5 * (1 - t * 0.8)],
          });
        }
        put(g, strokes, box(1, 1, 1), M.faint);
        return g;
      },
    },
  ],
};
