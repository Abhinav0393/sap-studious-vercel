/* =========================================================
   SAP STUDIOS: ARCHITECTURE HOVER  (js/architecture.js)
   PARTI → PLAN → SECTION → 3D MASS → ARCHITECTURAL SPACE

   One master timeline (T = 0 … 5.8 s) scrubbed by a damped progress value p.
   One BuildingSpec (a courtyard pavilion, nine-square parti) drives the plan,
   the section A–A and the 3D mass, so the three always agree.
   Orthographic camera from start to end. Three.js only (r128), no extra libraries.

   Public API (used by js/home.js):
     SAPArchitecture.create({renderer}) → {advance, render, alpha, visible, reset,
                                          preload, resize, dispose, fade, verify, seek}
   ========================================================= */
(function (global) {
'use strict';

const DUR = 5.8;                 // master timeline (s)
const REV = 2.2;                 // reverse clock (s); with the damped follower the visible exit is ~2.5 s
const FIT_SCALE = 1.05;          // largest shared increase that retains the plan's 6% viewport clearance
const cl = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const sm = t => t * t * (3 - 2 * t);
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const win = (T, a, b) => cl((T - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const RAD = Math.PI / 180;
/* plan space: x east, y north, z up (metres, origin = SW corner).  three.js world: X east, Y up, Z south. */
const W3 = (x, y, z) => [x - 9, z, 9 - y];

/* ---------------------------------------------------------
   GEOMETRY UTILITIES
   --------------------------------------------------------- */
// Rectangle minus rectangular holes → non-overlapping rectangles [x0,x1,y0,y1]
function rectMinusHoles(o, holes) {
  const xs = new Set([o[0], o[1]]), ys = new Set([o[2], o[3]]);
  holes.forEach(h => { xs.add(h[0]); xs.add(h[1]); ys.add(h[2]); ys.add(h[3]); });
  const X = [...xs].filter(v => v >= o[0] - 1e-9 && v <= o[1] + 1e-9).sort((a, b) => a - b);
  const Y = [...ys].filter(v => v >= o[2] - 1e-9 && v <= o[3] + 1e-9).sort((a, b) => a - b);
  const out = []; let prev = new Map();
  for (let j = 0; j < Y.length - 1; j++) {
    const cy = (Y[j] + Y[j + 1]) / 2, runs = []; let s = -1;
    for (let i = 0; i < X.length; i++) {
      let on = false;
      if (i < X.length - 1) {
        const cx = (X[i] + X[i + 1]) / 2;
        on = !holes.some(h => cx > h[0] && cx < h[1] && cy > h[2] && cy < h[3]);
      }
      if (on && s < 0) s = i;
      if (!on && s >= 0) { runs.push([s, i]); s = -1; }
    }
    const cur = new Map();
    runs.forEach(([a, b]) => {
      const key = a + '_' + b, p = prev.get(key);
      if (p) { p[3] = Y[j + 1]; cur.set(key, p); }
      else { const r = [X[a], X[b], Y[j], Y[j + 1]]; out.push(r); cur.set(key, r); }
    });
    prev = cur;
  }
  return out;
}

// Union outline of axis-aligned rectangles {a0,a1,b0,b1} → merged boundary segments [a0,b0,a1,b1]
function unionOutline(rects) {
  const r5 = v => Math.round(v * 1e5) / 1e5;
  const as = [...new Set(rects.flatMap(r => [r5(r.a0), r5(r.a1)]))].sort((x, y) => x - y);
  const bs = [...new Set(rects.flatMap(r => [r5(r.b0), r5(r.b1)]))].sort((x, y) => x - y);
  const ia = new Map(as.map((v, i) => [v, i])), ib = new Map(bs.map((v, i) => [v, i]));
  const nA = as.length - 1, nB = bs.length - 1, f = new Uint8Array(Math.max(1, nA * nB));
  rects.forEach(r => {
    for (let i = ia.get(r5(r.a0)); i < ia.get(r5(r.a1)); i++)
      for (let j = ib.get(r5(r.b0)); j < ib.get(r5(r.b1)); j++) f[i * nB + j] = 1;
  });
  const g = (i, j) => (i < 0 || j < 0 || i >= nA || j >= nB) ? 0 : f[i * nB + j];
  const segs = [];
  for (let i = 0; i <= nA; i++) {
    let st = -1;
    for (let j = 0; j <= nB; j++) {
      const on = j < nB && g(i - 1, j) !== g(i, j);
      if (on && st < 0) st = j;
      if (!on && st >= 0) { segs.push([as[i], bs[st], as[i], bs[j]]); st = -1; }
    }
  }
  for (let j = 0; j <= nB; j++) {
    let st = -1;
    for (let i = 0; i <= nA; i++) {
      const on = i < nA && g(i, j - 1) !== g(i, j);
      if (on && st < 0) st = i;
      if (!on && st >= 0) { segs.push([as[st], bs[j], as[i], bs[j]]); st = -1; }
    }
  }
  return segs;
}

/* ---------------------------------------------------------
   BUILDINGSPEC: the single source of truth (metres)
   Courtyard pavilion, Hyderabad 17.4°N. Nine-square parti: the centre square is the
   courtyard void, the eight surrounding squares are rooms. N–S axis:
   entrance → courtyard → stair → roof terrace.
   --------------------------------------------------------- */
function BuildingSpec() {
  const S = {
    grid: { x: [0, 6, 12, 18], y: [0, 6, 12, 18], lx: ['A', 'B', 'C', 'D'], ly: ['1', '2', '3', '4'], bay: 6 },
    levels: { ground: 0, first: 3.6, roof: 6.8 },
    thick: { ext: .3, int: .15, col: .3, slab: .2 },
    court: { x0: 6, x1: 12, y0: 6, y1: 12 },
    axisX: 9, planCut: 1.2, parapet: 1.0,
    overhang: { S: 1.5, W: 1.5, N: .9, E: .9 },
    gallery: 1.8, porchW: 3.0,
    stair: { x: 9, w: 1.2, y0: 11.3, risers: 21, treads: 20, rise: 3.6, R: 3.6 / 21, T: .28 },
    figure: { h: 1.7, x: 9, y: 6.55 },
    boxes: [], ops: [], walls: [], cols: [], stairRects: [], stairEdges: [], extra: {}
  };
  const E = .15, ZG = 3.4, Z1 = 3.6, ZR = 6.6, ZT = 6.8;
  const add = (k, x0, x1, y0, y1, z0, z1, o) => {
    const b = Object.assign({ k, x0, x1, y0, y1, z0, z1, thr: -.2, fm: 1, edges: true, solid: true, cut: true, ea: .55 }, o || {});
    S.boxes.push(b); return b;
  };
  const op = (k, c, w, s, h, o) => Object.assign({ k, c, w, s: s === undefined ? .9 : s, h: h === undefined ? 2.1 : h }, o || {});

  /* walls: centreline a→b (axis aligned), thickness t, openings along the wall.
     Pieces: full wall, sill piece (below an opening), lintel piece (above it). */
  function wall(id, a, b, t, z0, z1, ops, trim) {
    const alongX = Math.abs(a[1] - b[1]) < 1e-9;
    const c = alongX ? a[1] : a[0];
    let u0 = alongX ? Math.min(a[0], b[0]) : Math.min(a[1], b[1]);
    let u1 = alongX ? Math.max(a[0], b[0]) : Math.max(a[1], b[1]);
    u0 += trim[0]; u1 -= trim[1];
    const H = z1 - z0, upper = z0 > 1;
    const list = (ops || []).slice().sort((p, q) => p.c - q.c);
    S.walls.push({ id, a, b, t, z0, z1, alongX, c, u0, u1 });
    const emit = (ua, ub, za, zb, k, thr) => {
      if (ub - ua < 1e-6 || zb - za < 1e-6) return;
      if (alongX) add(k, ua, ub, c - t / 2, c + t / 2, za, zb, { thr, wid: id });
      else add(k, c - t / 2, c + t / 2, ua, ub, za, zb, { thr, wid: id });
    };
    let cur = u0;
    list.forEach(o => {
      const a0 = o.c - o.w / 2, a1 = o.c + o.w / 2;
      emit(cur, a0, z0, z1, 'wall', upper ? .3 : -.2);
      if (o.s > 0) emit(a0, a1, z0, z0 + o.s, 'sill', upper ? .3 : -.2);
      if (o.h < H - 1e-6) emit(a0, a1, z0 + o.h, z1, 'lintel', upper ? .3 : .05);
      S.ops.push(Object.assign({ wid: id, alongX, wc: c, t, z0, a0, a1 }, o));
      cur = a1;
    });
    emit(cur, u1, z0, z1, 'wall', upper ? .3 : -.2);
  }

  /* ---- GROUND FLOOR (z 0 … 3.4) ---- */
  const X = S.thick.ext, I = S.thick.int;
  // exterior walls, 300. South wall stops at the porch cheeks.
  wall('S1', [0, 0], [7.5, 0], X, 0, ZG, [op('win', 3, 1.5)], [E, E]);
  wall('S2', [10.5, 0], [18, 0], X, 0, ZG, [op('win', 15, 1.5)], [E, E]);
  wall('E0', [18, 0], [18, 18], X, 0, ZG, [op('win', 4.5, 1.5), op('win', 9, 2.4), op('win', 15, 1.5)], [E, E]);
  wall('W0', [0, 0], [0, 18], X, 0, ZG, [op('win', 4.5, 1.5), op('win', 9, 2.4), op('win', 15, 1.5)], [E, E]);
  wall('N0', [0, 18], [18, 18], X, 0, ZG, [op('win', 3, 1.5), op('win', 9, 1.2), op('win', 15, 1.5)], [E, E]);
  // entrance porch: 3.000 wide recess on the axis, full height (0 … 6.6); cheeks and back wall with the double door
  wall('PC1', [7.5, -.15], [7.5, 3.15], X, 0, ZR, [], [0, 0]);
  wall('PC2', [10.5, -.15], [10.5, 3.15], X, 0, ZR, [], [0, 0]);
  wall('PB', [7.5, 3], [10.5, 3], X, 0, ZR, [op('dbl', 9, 2, 0, 2.1, { side: 1 })], [E, E]);
  // internal walls, 150. Court edges: full-height glazing (2.700) between the columns, with a door on each axis.
  wall('X6a', [6, 0], [6, 6], I, 0, ZG, [op('door', 4.5, 1, 0, 2.1, { side: 1, hinge: -1 })], [E, E]);
  wall('X6b', [6, 6], [6, 12], I, 0, ZG, [op('glaze', 7.325, 2.35, 0, 2.7), op('door', 9, 1, 0, 2.1, { side: -1, hinge: 1 }), op('glaze', 10.675, 2.35, 0, 2.7)], [E, E]);
  wall('X6c', [6, 12], [6, 18], I, 0, ZG, [op('door', 15, 1, 0, 2.1, { side: 1, hinge: -1 })], [E, E]);
  wall('X12a', [12, 0], [12, 6], I, 0, ZG, [op('door', 4.5, 1, 0, 2.1, { side: -1, hinge: 1 })], [E, E]);
  wall('X12b', [12, 6], [12, 12], I, 0, ZG, [op('glaze', 7.325, 2.35, 0, 2.7), op('door', 9, 1, 0, 2.1, { side: 1, hinge: -1 }), op('glaze', 10.675, 2.35, 0, 2.7)], [E, E]);
  wall('X12c', [12, 12], [12, 18], I, 0, ZG, [op('door', 15, 1, 0, 2.1, { side: -1, hinge: 1 })], [E, E]);
  wall('Y6a', [0, 6], [6, 6], I, 0, ZG, [op('door', 3, 1, 0, 2.1, { side: 1, hinge: -1 })], [E, E]);
  wall('Y6b', [6, 6], [12, 6], I, 0, ZG, [op('glaze', 7.075, 1.85, 0, 2.7), op('dbl', 9, 2, 0, 2.1, { side: -1 }), op('glaze', 10.925, 1.85, 0, 2.7)], [E, E]);
  wall('Y6c', [12, 6], [18, 6], I, 0, ZG, [op('door', 15, 1, 0, 2.1, { side: 1, hinge: -1 })], [E, E]);
  wall('Y12a', [0, 12], [6, 12], I, 0, ZG, [op('door', 3, 1, 0, 2.1, { side: -1, hinge: -1 })], [E, E]);
  wall('Y12b', [6, 12], [12, 12], I, 0, ZG, [op('open', 9, 5.7, 0, 2.7)], [E, E]);   // stair hall open to the court, beam above
  wall('Y12c', [12, 12], [18, 12], I, 0, ZG, [op('door', 15, 1, 0, 2.1, { side: -1, hinge: 1 })], [E, E]);

  /* ---- FIRST FLOOR (z 3.6 … 6.6) ---- */
  wall('S1u', [0, 0], [7.5, 0], X, Z1, ZR, [op('win', 3, 1.5)], [E, E]);
  wall('S2u', [10.5, 0], [18, 0], X, Z1, ZR, [op('win', 15, 1.5)], [E, E]);
  wall('E1', [18, 0], [18, 18], X, Z1, ZR, [op('win', 5.1, 1.5), op('win', 9, 2.4), op('win', 12.9, 1.5)], [E, E]);
  wall('W1', [0, 0], [0, 18], X, Z1, ZR, [op('win', 5.1, 1.5), op('jali', 9, 5.7, 0, 3), op('win', 12.9, 1.5)], [E, E]);
  wall('N1', [0, 18], [18, 18], X, Z1, ZR, [op('win', 3, 1.5), op('win', 9, 1.2), op('win', 15, 1.5)], [E, E]);
  wall('FX6a', [6, 0], [6, 6], I, Z1, ZR, [op('door', 5.1, 1, 0, 2.1)], [E, E]);
  wall('FX6c', [6, 12], [6, 18], I, Z1, ZR, [op('door', 12.9, 1, 0, 2.1)], [E, E]);
  wall('FX12a', [12, 0], [12, 6], I, Z1, ZR, [op('door', 5.1, 1, 0, 2.1)], [E, E]);
  wall('FX12c', [12, 12], [12, 18], I, Z1, ZR, [op('door', 12.9, 1, 0, 2.1)], [E, E]);
  wall('FY6a', [0, 6], [6, 6], I, Z1, ZR, [op('door', 5.1, 1, 0, 2.1)], [E, E]);
  wall('FY6c', [12, 6], [18, 6], I, Z1, ZR, [op('door', 12.9, 1, 0, 2.1)], [E, E]);
  wall('FY12a', [0, 12], [6, 12], I, Z1, ZR, [op('door', 5.1, 1, 0, 2.1)], [E, E]);
  wall('FY12c', [12, 12], [18, 12], I, Z1, ZR, [op('door', 12.9, 1, 0, 2.1)], [E, E]);

  /* ---- COLUMNS 300 × 300 at every grid intersection (full height). Perimeter columns sit inside the 300 walls. ---- */
  S.grid.x.forEach(gx => S.grid.y.forEach(gy => {
    const per = gx === 0 || gx === 18 || gy === 0 || gy === 18;
    const corner = (gx === 0 || gx === 18) && (gy === 0 || gy === 18);
    const embed = per && !corner;
    S.cols.push({ x: gx, y: gy, embed });
    add('col', gx - .15, gx + .15, gy - .15, gy + .15, 0, ZR, { embed, solid: !embed, edges: !embed, cut: false });
  }));

  /* ---- SLABS (200): ground slab, first-floor slab with voids, roof terrace slab with overhangs ---- */
  add('gslab', -.15, 18.15, -.15, 18.15, -.2, 0, { thr: 0, fm: .35 });
  const holes1 = [
    [6, 12, 6, 12],                       // courtyard void, continuous through all levels
    [6.075, 11.925, -.15, 4.2],           // entrance hall: double height behind the porch, gallery strip 1.8 wide
    [.15, 4.2, 6.075, 11.925],            // west hall
    [13.8, 17.85, 6.075, 11.925],         // east hall
    [6.075, 8.4, 13.8, 16.9],             // stair hall, west of the flight
    [9.6, 11.925, 13.8, 16.9],            // stair hall, east of the flight
    [8.4, 9.6, 13.0, 16.9]                // stairwell
  ];
  S.extra.holes1 = holes1;
  rectMinusHoles([-.15, 18.15, -.15, 18.15], holes1).forEach(r => add('slab', r[0], r[1], r[2], r[3], ZG, Z1, { thr: .22 }));
  const o = S.overhang;
  S.extra.roofOuter = [-.15 - o.W, 18.15 + o.E, -.15 - o.S, 18.15 + o.N];
  rectMinusHoles(S.extra.roofOuter, [[6, 12, 6, 12]]).forEach(r => add('roof', r[0], r[1], r[2], r[3], ZR, ZT, { thr: .4, fm: .42 }));

  /* ---- parapets (1.000) on the roof terrace: perimeter and around the courtyard opening ---- */
  const P1 = ZT + S.parapet;
  add('parapet', -.15, 18.15, -.15, .15, ZT, P1, { thr: .45 });
  add('parapet', -.15, 18.15, 17.85, 18.15, ZT, P1, { thr: .45 });
  add('parapet', -.15, .15, .15, 17.85, ZT, P1, { thr: .45 });
  add('parapet', 17.85, 18.15, .15, 17.85, ZT, P1, { thr: .45 });
  add('parapet', 6, 12, 5.925, 6.075, ZT, P1, { thr: .45 });
  add('parapet', 6, 12, 11.925, 12.075, ZT, P1, { thr: .45 });
  add('parapet', 5.925, 6.075, 6.075, 11.925, ZT, P1, { thr: .45 });
  add('parapet', 11.925, 12.075, 6.075, 11.925, ZT, P1, { thr: .45 });

  /* ---- first-floor guards (1.000): around the void and the gallery edges ---- */
  const G = (x0, x1, y0, y1) => add('guard', x0, x1, y0, y1, Z1, Z1 + 1.0, { thr: .45, solid: false, ea: .5 });
  G(6, 12, 5.95, 6.05); G(6, 12, 11.95, 12.05); G(5.95, 6.05, 6.05, 11.95); G(11.95, 12.05, 6.05, 11.95);
  G(6.075, 11.925, 4.15, 4.25); G(4.15, 4.25, 6.075, 11.925); G(13.75, 13.85, 6.075, 11.925);
  G(6.075, 8.4, 13.75, 13.85); G(9.6, 11.925, 13.75, 13.85);
  G(8.35, 8.45, 13.0, 16.9); G(9.55, 9.65, 13.0, 16.9); G(8.4, 9.6, 12.95, 13.05);
  G(6.075, 8.4, 16.85, 16.95); G(9.6, 11.925, 16.85, 16.95);

  /* ---- STAIR: one straight flight, 21 risers (R = 171.4, T = 280 → 2R+T = 623), 20 treads ---- */
  const st = S.stair, x0s = st.x - st.w / 2, x1s = st.x + st.w / 2;
  for (let k = 1; k <= st.treads; k++) {
    const ya = st.y0 + (k - 1) * st.T, yb = st.y0 + k * st.T, zt = k * st.R, zb = Math.max(0, zt - .34);
    add('stair', x0s, x1s, ya, yb, zb, zt, { thr: .12, edges: false, cut: false });
    S.stairRects.push({ a0: ya, a1: yb, b0: zb, b1: zt, k: 'stair' });
  }
  // outline edges: the stepped profile on both stringers + a line across every nosing
  unionOutline(S.stairRects).forEach(sg => {
    S.stairEdges.push([x0s, sg[0], sg[1], x0s, sg[2], sg[3]], [x1s, sg[0], sg[1], x1s, sg[2], sg[3]]);
  });
  for (let k = 1; k <= st.treads; k++) {
    const ya = st.y0 + (k - 1) * st.T, yb = st.y0 + k * st.T, zt = k * st.R;
    S.stairEdges.push([x0s, ya, zt, x1s, ya, zt], [x0s, yb, zt, x1s, yb, zt]);
  }
  // handrails (1.000) along both sides
  S.extra.rails = [];
  [x0s, x1s].forEach(xx => {
    S.extra.rails.push([xx, st.y0, st.R + 1.0, xx, st.y0 + 20 * st.T, 20 * st.R + 1.0]);
    for (let k = 2; k <= 20; k += 3) S.extra.rails.push([xx, st.y0 + (k - .5) * st.T, k * st.R, xx, st.y0 + (k - .5) * st.T, k * st.R + 1.0 - (.5 * st.R) * 0]);
  });

  /* ---- CLIMATE DEVICES ---- */
  // pergola on the roof terrace (north half): posts, two beams and slats. Light: lines only.
  const PG = (x0, x1, y0, y1, z0, z1) => add('pergola', x0, x1, y0, y1, z0, z1, { thr: .55, solid: false, cut: false, ea: .5 });
  [[7, 14.5], [11, 14.5], [7, 17], [11, 17]].forEach(p => PG(p[0] - .06, p[0] + .06, p[1] - .06, p[1] + .06, ZT, ZT + 2.4));
  PG(6.9, 11.1, 14.42, 14.58, ZT + 2.4, ZT + 2.62); PG(6.9, 11.1, 16.92, 17.08, ZT + 2.4, ZT + 2.62);
  for (let i = 0; i < 8; i++) PG(6.9 + i * .6 - .03, 6.9 + i * .6 + .03, 14.3, 17.2, ZT + 2.62, ZT + 2.7);
  // jali screen: first-floor west elevation over the west hall (fins 80 wide, pitch 300)
  const JAL = (x0, x1, y0, y1, z0, z1) => add('jali', x0, x1, y0, y1, z0, z1, { thr: .55, solid: false, cut: false, ea: .5 });
  for (let i = 0; i < 19; i++) { const yc = 6.15 + .15 + i * .3; JAL(-.15, .15, yc - .04, yc + .04, Z1, ZR); }
  JAL(-.15, .15, 6.15, 11.85, Z1, Z1 + .06); JAL(-.15, .15, 6.15, 11.85, ZR - .06, ZR); JAL(-.15, .15, 6.15, 11.85, Z1 + 1.47, Z1 + 1.53);

  /* derived sets for the drawing conventions */
  S.planCutBoxes = S.boxes.filter(b => b.k === 'wall' && b.z0 < S.planCut && b.z1 > S.planCut);
  const ax = S.axisX;
  S.sectionBoxes = S.boxes.filter(b => b.cut && b.x0 < ax && ax < b.x1);
  S.figure.cx = S.figure.x; S.figure.cy = S.figure.y;
  return S;
}


/* ---------------------------------------------------------
   BUFFER COLLECTORS
   --------------------------------------------------------- */
function mkGeo(THREE, attrs, index) {
  const g = new THREE.BufferGeometry();
  attrs.forEach(([n, arr, sz]) => g.setAttribute(n, new THREE.Float32BufferAttribute(arr, sz)));
  if (index) g.setIndex(index);
  return g;
}
function FaceSet() { this.p = []; this.n = []; this.g = []; this.i = []; this.v = 0; }
FaceSet.prototype.quad = function (c, n, g) {
  const a = c[0], b = c[1], d = c[3];
  const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
  const cr = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
  const o = (cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2]) < 0 ? [0, 3, 2, 1] : [0, 1, 2, 3];
  o.forEach(k => { this.p.push(c[k][0], c[k][1], c[k][2]); this.n.push(n[0], n[1], n[2]); this.g.push(g[0], g[1], g[2], g[3]); });
  const v = this.v; this.i.push(v, v + 1, v + 2, v, v + 2, v + 3); this.v += 4;
};
FaceSet.prototype.geo = function (THREE) { return mkGeo(THREE, [['position', this.p, 3], ['normal', this.n, 3], ['aG', this.g, 4]], this.i); };

function EdgeSet() { this.p = []; this.g = []; this.e = []; }
EdgeSet.prototype.seg = function (a, b, g, e) { this.p.push(a[0], a[1], a[2], b[0], b[1], b[2]); this.g.push(g[0], g[1], g[2], g[3], g[0], g[1], g[2], g[3]); this.e.push(e, e); };
EdgeSet.prototype.geo = function (THREE) { return mkGeo(THREE, [['position', this.p, 3], ['aG', this.g, 4], ['aE', this.e, 1]]); };

function LineSet() { this.p = []; this.s = []; this.st = []; }
LineSet.prototype.add = function (a, b, t0, dur, al, dash) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  this.p.push(a[0], a[1], a[2], b[0], b[1], b[2]);
  this.s.push(0, len, t0, dur, len, len, t0, dur);
  this.st.push(al, dash || 0, al, dash || 0);
};
LineSet.prototype.poly = function (pts, t0, dur, al, dash) {
  let tot = 0; const ls = [];
  for (let i = 0; i < pts.length - 1; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1], pts[i + 1][2] - pts[i][2]); ls.push(l); tot += l; }
  let acc = 0;
  for (let i = 0; i < pts.length - 1; i++) { this.add(pts[i], pts[i + 1], t0 + dur * acc / tot, Math.max(.01, dur * ls[i] / tot), al, dash); acc += ls[i]; }
};
LineSet.prototype.geo = function (THREE) { return mkGeo(THREE, [['position', this.p, 3], ['aSeg', this.s, 4], ['aS', this.st, 2]]); };

function RibbonSet() { this.p = []; this.b = []; this.sd = []; this.en = []; this.w = []; this.g = []; this.i = []; this.v = 0; }
RibbonSet.prototype.add = function (a, b, t0, dur, al, wpx, thr) {
  for (let k = 0; k < 4; k++) {
    this.p.push(a[0], a[1], a[2]); this.b.push(b[0], b[1], b[2]);
    this.sd.push(k % 2 ? 1 : -1); this.en.push(k < 2 ? 0 : 1);
    this.w.push(t0, dur, al, wpx); this.g.push(thr === undefined ? -1 : thr, 1, 0, 0);
  }
  const v = this.v; this.i.push(v, v + 1, v + 2, v + 2, v + 1, v + 3); this.v += 4;
};
RibbonSet.prototype.geo = function (THREE) {
  return mkGeo(THREE, [['position', this.p, 3], ['aB', this.b, 3], ['aSide', this.sd, 1], ['aEnd', this.en, 1], ['aW', this.w, 4], ['aG', this.g, 4]], this.i);
};

function QuadSet() { this.p = []; this.f = []; this.g = []; this.i = []; this.v = 0; }
QuadSet.prototype.add = function (c, t0, dur, al, thr) {
  c.forEach(q => { this.p.push(q[0], q[1], q[2]); this.f.push(t0, dur, al); this.g.push(thr === undefined ? -1 : thr, 1, 0, 0); });
  const v = this.v; this.i.push(v, v + 1, v + 2, v, v + 2, v + 3); this.v += 4;
};
QuadSet.prototype.geo = function (THREE) { return mkGeo(THREE, [['position', this.p, 3], ['aF', this.f, 3], ['aG', this.g, 4]], this.i); };

/* box → faces (5, no bottom) + 12 edges, in world space */
function emitBox(b, F, E) {
  const { x0, x1, y0, y1, z0, z1 } = b, c = W3;
  if (b.solid) {
    const g = [b.thr, b.fm, 0, 0];
    F.quad([c(x0, y0, z1), c(x1, y0, z1), c(x1, y1, z1), c(x0, y1, z1)], [0, 1, 0], g);
    F.quad([c(x0, y0, z0), c(x1, y0, z0), c(x1, y0, z1), c(x0, y0, z1)], [0, 0, 1], g);
    F.quad([c(x0, y1, z0), c(x1, y1, z0), c(x1, y1, z1), c(x0, y1, z1)], [0, 0, -1], g);
    F.quad([c(x0, y0, z0), c(x0, y1, z0), c(x0, y1, z1), c(x0, y0, z1)], [-1, 0, 0], g);
    F.quad([c(x1, y0, z0), c(x1, y1, z0), c(x1, y1, z1), c(x1, y0, z1)], [1, 0, 0], g);
  }
  if (b.edges) {
    const P = [c(x0, y0, z0), c(x1, y0, z0), c(x1, y1, z0), c(x0, y1, z0), c(x0, y0, z1), c(x1, y0, z1), c(x1, y1, z1), c(x0, y1, z1)];
    const g = [b.thr, 1, 0, 0];
    [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(e => E.seg(P[e[0]], P[e[1]], g, b.ea));
  }
}

/* ---------------------------------------------------------
   SHADERS  (screen-space ribbons, draw-on lines, depth-prepass solids)
   --------------------------------------------------------- */
const SH = {
  solidVS: `uniform float uRise; attribute vec4 aG;
varying vec3 vN; varying float vVis; varying float vX; varying float vFm;
void main(){ vec3 p=position; p.y*=uRise; vVis=smoothstep(aG.x,aG.x+.15,uRise); vFm=aG.y; vN=normal; vX=p.x;
gl_Position=projectionMatrix*viewMatrix*vec4(p,1.); }`,
  prepassFS: `uniform float uClipMin; varying float vVis; varying float vX;
void main(){ if(vX<uClipMin-.002||vVis<.02) discard; gl_FragColor=vec4(0.); }`,
  colorFS: `uniform float uClipMin,uExt,uFill; uniform vec3 uL; varying vec3 vN; varying float vVis; varying float vX; varying float vFm;
void main(){ if(vX<uClipMin-.002||vVis<.02) discard;
float d=max(dot(normalize(vN),uL),0.); float tone=.18+.82*d;
float wave=1.-smoothstep(uExt-1.6,uExt,abs(vX));
float a=uFill*vFm*(.30+.55*tone)*vVis*wave;
gl_FragColor=vec4(mix(vec3(.36,.35,.33),vec3(.93,.91,.86),tone),a); }`,
  capFS: `uniform float uCapOn; varying float vVis; void main(){ if(uCapOn<.5||vVis<.02) discard; gl_FragColor=vec4(0.); }`,
  edgeVS: `uniform float uRise; attribute vec4 aG; attribute float aE; varying float vA; varying float vX;
void main(){ vec3 p=position; p.y*=uRise; vX=p.x; vA=aE*smoothstep(aG.x,aG.x+.15,uRise); gl_Position=projectionMatrix*viewMatrix*vec4(p,1.); }`,
  edgeFS: `uniform float uClipMin,uClipSoft,uEdgeA; uniform vec3 uCol; varying float vA; varying float vX;
void main(){ if(vX<uClipMin-.002) discard; float s=smoothstep(uClipMin-.002,uClipMin+uClipSoft,vX); gl_FragColor=vec4(uCol,vA*uEdgeA*s); }`,
  lineVS: `attribute vec4 aSeg; attribute vec2 aS; uniform float uT;
varying float vS; varying float vLen; varying float vPr; varying float vA; varying float vDash;
void main(){ float pr=clamp((uT-aSeg.z)/max(aSeg.w,1e-4),0.,1.); pr=pr*pr*(3.-2.*pr);
vS=aSeg.x; vLen=aSeg.y; vPr=pr; vA=aS.x; vDash=aS.y; gl_Position=projectionMatrix*viewMatrix*vec4(position,1.); }`,
  lineFS: `uniform float uA; uniform vec3 uCol; varying float vS; varying float vLen; varying float vPr; varying float vA; varying float vDash;
void main(){ if(vPr<=.0005) discard; if(vS>vPr*vLen+1e-4) discard;
if(vDash>.5&&vDash<1.5){ float m=mod(vS,1.5); if(!(m<.85||(m>1.05&&m<1.17))) discard; }
else if(vDash>1.5){ float m=mod(vS,.5); if(m>.3) discard; }
gl_FragColor=vec4(uCol,vA*uA); }`,
  ribVS: `attribute vec3 aB; attribute float aSide; attribute float aEnd; attribute vec4 aW; attribute vec4 aG;
uniform float uT,uRise; uniform vec2 uVp; varying float vA;
void main(){ float pr=clamp((uT-aW.x)/max(aW.y,1e-4),0.,1.); pr=pr*pr*(3.-2.*pr);
vec3 A=position, B=aB; float vis=1.;
#ifdef GROW
A.y*=uRise; B.y*=uRise; vis=smoothstep(aG.x,aG.x+.15,uRise);
#endif
vec4 cA=projectionMatrix*viewMatrix*vec4(A,1.), cB=projectionMatrix*viewMatrix*vec4(B,1.);
vec2 d=(cB.xy-cA.xy)*uVp*.5; float L=length(d); vec2 dir=L>1e-4?d/L:vec2(1.,0.); vec2 n=vec2(-dir.y,dir.x);
vec4 c=mix(cA,cB,aEnd*pr); float w=aW.w;
c.xy+=(n*aSide*w*.5+dir*(aEnd*2.-1.)*w*.5)*2./uVp;
vA=aW.z*step(.0005,pr)*vis; gl_Position=c; }`,
  flatFS: `uniform float uA; uniform vec3 uCol; varying float vA; void main(){ gl_FragColor=vec4(uCol,vA*uA); }`,
  fillVS: `attribute vec3 aF; attribute vec4 aG; uniform float uT,uRise; varying float vA; varying float vVis;
void main(){ vec3 p=position; float vis=1.;
#ifdef GROW
p.y*=uRise; vis=smoothstep(aG.x,aG.x+.15,uRise);
#endif
float pr=clamp((uT-aF.x)/max(aF.y,1e-4),0.,1.); pr=pr*pr*(3.-2.*pr); vA=aF.z*pr*vis; vVis=vis;
gl_Position=projectionMatrix*viewMatrix*vec4(p,1.); }`,
  capVS: `attribute vec4 aG; uniform float uRise; varying float vVis;
void main(){ vec3 p=position; p.y*=uRise; vVis=smoothstep(aG.x,aG.x+.15,uRise); gl_Position=projectionMatrix*viewMatrix*vec4(p,1.); }`,
  labVS: `attribute vec3 aP; attribute vec2 aC; attribute vec4 aS; attribute vec2 aO; attribute vec2 aUV; attribute float aA;
uniform vec2 uVp; varying vec2 vUV; varying float vA;
void main(){ vec4 c=projectionMatrix*viewMatrix*vec4(aP,1.); vec2 px=(aC-aS.zw)*aS.xy+aO; c.xy+=px*2./uVp; vUV=aUV; vA=aA; gl_Position=c; }`,
  labFS: `uniform sampler2D uTex; uniform vec3 uCol; varying vec2 vUV; varying float vA;
void main(){ float a=texture2D(uTex,vUV).a*vA; if(a<.003) discard; gl_FragColor=vec4(uCol,a); }`
};

/* ---------------------------------------------------------
   PLAN DRAWING (z = 0). Construction order follows the architect's method.
   --------------------------------------------------------- */
function buildPlan(S) {
  const L = new LineSet(), R = new RibbonSet(), F = new QuadSet();
  const P = (x, y) => W3(x, y, 0);
  const ln = (a, b, t0, d, al, dash) => L.add(P(a[0], a[1]), P(b[0], b[1]), t0, d, al, dash);
  const rb = (a, b, t0, d, al, w) => R.add(P(a[0], a[1]), P(b[0], b[1]), t0, d, al, w);
  const ring = (cx, cy, r, t0, d) => {
    const pts = []; for (let i = 0; i <= 28; i++) { const a = i / 28 * Math.PI * 2; pts.push(P(cx + Math.cos(a) * r, cy + Math.sin(a) * r)); }
    L.poly(pts, t0, d, .5, 0);
  };
  const g = S.grid;
  /* STAGE 0 — PARTI: axis, the central void, the nine squares unfolding outward */
  ln([9, -1.5], [9, 19.5], 0, .22, .5, 0);
  rb([6, 6], [12, 6], .14, .12, .9, 1.6); rb([12, 6], [12, 12], .2, .12, .9, 1.6);
  rb([12, 12], [6, 12], .26, .12, .9, 1.6); rb([6, 12], [6, 6], .32, .12, .9, 1.6);
  g.x.forEach((gx, i) => {
    const mid = i === 1 || i === 2, t0 = mid ? .28 : .34, d = mid ? .18 : .16;
    if (mid) { ln([gx, 6], [gx, 0], t0, d, .32, 1); ln([gx, 12], [gx, 18], t0, d, .32, 1); }
    else { ln([gx, 9], [gx, 0], t0, d, .32, 1); ln([gx, 9], [gx, 18], t0, d, .32, 1); }
    ln([gx, 0], [gx, -1.8], .5, .35, .3, 1); ln([gx, 18], [gx, 19.8], .5, .35, .3, 1);
    ring(gx, -2.35, .55, .7, .25);
  });
  g.y.forEach((gy, i) => {
    const mid = i === 1 || i === 2, t0 = mid ? .28 : .34, d = mid ? .18 : .16;
    if (mid) { ln([6, gy], [0, gy], t0, d, .32, 1); ln([12, gy], [18, gy], t0, d, .32, 1); }
    else { ln([9, gy], [0, gy], t0, d, .32, 1); ln([9, gy], [18, gy], t0, d, .32, 1); }
    ln([0, gy], [-1.8, gy], .5, .35, .3, 1); ln([18, gy], [19.8, gy], .5, .35, .3, 1);
    ring(-2.35, gy, .55, .7, .25);
  });
  /* STAGE 1 — PLAN */
  // 2. exterior walls along their centrelines
  S.walls.filter(w => w.t > .25 && w.z0 === 0).forEach((w, i) => {
    ln(w.alongX ? [w.u0 - .15, w.c] : [w.c, w.u0 - .15], w.alongX ? [w.u1 + .15, w.c] : [w.c, w.u1 + .15], .62 + i * .03, .35, .3, 2);
  });
  // poche (cut at 1.200) and the heavy cut outline
  const rects = S.planCutBoxes.map(b => ({ a0: b.x0, a1: b.x1, b0: b.y0, b1: b.y1, ext: Math.min(b.x1 - b.x0, b.y1 - b.y0) > .25 }));
  rects.forEach((r, i) => {
    const t0 = r.ext ? .85 + (i % 9) * .035 : 1.05 + (i % 11) * .03;
    F.add([P(r.a0, r.b0), P(r.a1, r.b0), P(r.a1, r.b1), P(r.a0, r.b1)], t0 + .1, .3, .2);
  });
  const segs = unionOutline(rects);
  const isExt = s => {
    const mx = (s[0] + s[2]) / 2, my = (s[1] + s[3]) / 2, d = Math.min(mx, 18 - mx, my, 18 - my);
    return d < .2 || (mx > 7.3 && mx < 10.7 && my > -.2 && my < 3.2);
  };
  const ex = segs.filter(isExt).sort((a, b) => Math.atan2((a[1] + a[3]) / 2 - 9, (a[0] + a[2]) / 2 - 9) - Math.atan2((b[1] + b[3]) / 2 - 9, (b[0] + b[2]) / 2 - 9));
  const inn = segs.filter(s => !isExt(s)).sort((a, b) => Math.hypot((a[0] + a[2]) / 2 - 9, (a[1] + a[3]) / 2 - 9) - Math.hypot((b[0] + b[2]) / 2 - 9, (b[1] + b[3]) / 2 - 9));
  ex.forEach((s, i) => rb([s[0], s[1]], [s[2], s[3]], .85 + .3 * i / ex.length, .22, 1, 1.9));
  inn.forEach((s, i) => rb([s[0], s[1]], [s[2], s[3]], 1.05 + .3 * i / inn.length, .2, 1, 1.9));
  // 4. openings: windows (three lines), doors (leaf + swing)
  const pt = (o, u, pp) => o.alongX ? [u, o.wc + pp] : [o.wc + pp, u];
  S.ops.filter(o => o.z0 === 0).forEach((o, i) => {
    const t0 = 1.25 + (i % 12) * .02;
    if (o.k === 'win' || o.k === 'glaze') {
      [-o.t / 2, 0, o.t / 2].forEach(pp => ln(pt(o, o.a0, pp), pt(o, o.a1, pp), t0, .2, .42, 0));
    } else if (o.k === 'door' || o.k === 'dbl') {
      const side = o.side === undefined ? 1 : o.side;
      const leaf = (uh, q, len) => {
        const h0 = pt(o, uh, side * o.t / 2), h1 = pt(o, uh, side * (o.t / 2 + len));
        ln(h0, h1, t0, .12, .75, 0);
        const pts = [];
        for (let k = 0; k <= 10; k++) { const th = k / 10 * Math.PI / 2; pts.push(P(...pt(o, uh + q * len * Math.cos(th), side * (o.t / 2 + len * Math.sin(th))))); }
        L.poly(pts, t0 + .05, .2, .35, 0);
      };
      if (o.k === 'door') { const hg = o.hinge === undefined ? -1 : o.hinge; leaf(hg < 0 ? o.a0 : o.a1, hg < 0 ? 1 : -1, o.w); }
      else { leaf(o.a0, 1, o.w / 2); leaf(o.a1, -1, o.w / 2); }
    }
  });
  // 5. columns: small solid squares on the grid intersections
  S.cols.forEach((c, i) => F.add([P(c.x - .15, c.y - .15), P(c.x + .15, c.y - .15), P(c.x + .15, c.y + .15), P(c.x - .15, c.y + .15)], 1.4 + (i % 8) * .02, .2, .85));
  // 6. courtyard: water court lines and the entrance threshold
  [[6.9, 6.9, 11.1, 6.9], [11.1, 6.9, 11.1, 10.7], [11.1, 10.7, 6.9, 10.7], [6.9, 10.7, 6.9, 6.9]].forEach((s, i) => ln([s[0], s[1]], [s[2], s[3]], 1.45 + i * .03, .2, .4, 0));
  [7.6, 8.3, 9.0].forEach((y, i) => ln([7.4, y], [10.6, y], 1.52 + i * .04, .2, .22, 0));
  ln([7.65, 0], [10.35, 0], 1.5, .15, .6, 0); ln([7.65, -.4], [10.35, -.4], 1.55, .15, .4, 0);
  // 7. stair: 21 riser lines (20 treads), then the direction arrow
  const st = S.stair, xa = st.x - st.w / 2, xb = st.x + st.w / 2;
  for (let k = 0; k <= st.treads; k++) { const y = st.y0 + k * st.T; ln([xa, y], [xb, y], 1.5 + k * .012, .06, .35, 0); }
  ln([xa, st.y0], [xa, st.y0 + 20 * st.T], 1.5, .25, .35, 0); ln([xb, st.y0], [xb, st.y0 + 20 * st.T], 1.5, .25, .35, 0);
  ln([9, 11.75], [9, 16.5], 1.7, .1, .6, 0); ln([9, 16.5], [8.8, 16.1], 1.78, .03, .6, 0); ln([9, 16.5], [9.2, 16.1], 1.78, .03, .6, 0);
  // 8. annotations: dimensions (overall, courtyard, bay), north arrow, level marker, section cut A–A with arrowheads
  const dim = (a0, a1, yy, ext0, ext1, t0) => {
    ln([a0, yy], [a1, yy], t0, .15, .5, 0);
    [a0, a1].forEach(x => { ln([x, ext0], [x, ext1], t0, .12, .3, 0); ln([x - .25, yy - .25], [x + .25, yy + .25], t0 + .05, .05, .7, 0); });
  };
  dim(0, 18, -5.4, -3.1, -5.7, 1.55); dim(6, 12, -4.1, -3.1, -4.4, 1.6); dim(0, 6, 22, 20.3, 22.3, 1.62);
  rb([9, -1.75], [9, -.6], 1.6, .12, 1, 2.2); rb([9, 18.6], [9, 19.75], 1.6, .12, 1, 2.2);
  [-1.75, 19.75].forEach(y => { rb([9, y], [11.3, y], 1.64, .1, 1, 1.5); ln([11.3, y], [10.8, y + .3], 1.7, .04, .9, 0); ln([11.3, y], [10.8, y - .3], 1.7, .04, .9, 0); });
  ring(9, -2.35, .55, 1.6, .15); ring(9, 20.35, .55, 1.6, .15);
  ring(-4.2, 22.3, .9, 1.55, .15); ln([-4.2, 21.5], [-4.2, 23.0], 1.62, .1, .8, 0); ln([-4.2, 23.0], [-4.45, 22.5], 1.7, .03, .8, 0); ln([-4.2, 23.0], [-3.95, 22.5], 1.7, .03, .8, 0);
  ln([19.4, 15.7], [19.4, 16.3], 1.65, .06, .6, 0); ln([19.4, 15.7], [18.9, 16.0], 1.68, .05, .6, 0); ln([19.4, 16.3], [18.9, 16.0], 1.7, .05, .6, 0);
  return { L, R, F, hasDim: true };
}

/* ---------------------------------------------------------
   SECTION A–A (plane x = 9, viewed from the west): cut elements are heavy, the rest is light.
   --------------------------------------------------------- */
function buildSection(S) {
  const R = new RibbonSet(), F = new QuadSet(), L = new LineSet(), Sun = new LineSet();
  const Q = (y, z) => [0, z, 9 - y];
  const rects = S.sectionBoxes.map(b => ({ a0: b.y0, a1: b.y1, b0: b.z0, b1: b.z1, k: b.k })).concat(S.stairRects);
  rects.forEach(r => F.add([Q(r.a0, r.b0), Q(r.a1, r.b0), Q(r.a1, r.b1), Q(r.a0, r.b1)], -10, 1, .2, 0));
  unionOutline(rects).forEach(s => R.add(Q(s[0], s[1]), Q(s[2], s[3]), -10, 1, 1, 2.2, 0));
  R.add(Q(-2.6, 0), Q(20.4, 0), 2.35, .45, .9, 2.8, .3);                       // ground line, heavy
  // projection lines rising from every plan feature that crosses A–A
  const ys = [...new Set(rects.flatMap(r => [Math.round(r.a0 * 1e3) / 1e3, Math.round(r.a1 * 1e3) / 1e3]))].sort((a, b) => a - b);
  ys.forEach((y, i) => L.add(Q(y, 0), Q(y, 9.7), 1.85 + .35 * i / ys.length, .45, .1, 0));
  S.grid.y.forEach(y => L.add(Q(y, -.4), Q(y, 9.9), 2.0, .5, .32, 1));         // grid lines 1–4 stand up
  // datum lines with level markers
  [0, 3.6, 6.8].forEach((z, i) => {
    L.add(Q(-2.4, z), Q(20.2, z), 2.4 + i * .06, .4, .38, 0);
    L.add(Q(20.2, z), Q(20.7, z + .28), 2.7 + i * .06, .1, .6, 0); L.add(Q(20.2, z), Q(20.7, z - .28), 2.7 + i * .06, .1, .6, 0); L.add(Q(20.7, z + .28), Q(20.7, z - .28), 2.75 + i * .06, .1, .6, 0);
  });
  // ONE beat of climate: summer sun 84° blocked by the overhang, winter sun 49° reaching deep into the court
  const cs = 1 / Math.tan(84 * RAD), cw = 1 / Math.tan(49 * RAD);
  Sun.add(Q(-.9, 9.2), Q(-.9 + (9.2 - 6.8) * cs, 6.8), 2.6, .35, .75, 2);
  Sun.add(Q(-.9 + (9.2 - 6.8) * cs, 6.8), Q(-.9 + (9.2 - 6.8) * cs + .35, 6.8 + .0), 2.9, .05, .75, 0);
  const wy0 = 6.075 - (9.2 - 7.8) * cw;
  const wy1 = 12.22, wz1 = 7.8 - (wy1 - 6.075) / cw;
  Sun.add(Q(wy0, 9.2), Q(wy1, wz1), 2.7, .4, .75, 2);
  return { R, F, L, Sun };
}


/* =========================================================
   create(): scene, materials, labels, camera, master timeline, API
   ========================================================= */
function create(opts) {
  const THREE = global.THREE, renderer = opts.renderer;
  const reduce = global.matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = global.matchMedia('(pointer:coarse)');
  const DEBUG = /arch-debug/.test(global.location.hash);
  const S = BuildingSpec();
  let built = false, building = false, T = 0, c = 0, idle = 0, idleStart = -1, seekT = -1, lost = false, lite = false, slowAcc = 0;
  let labelK = 1, px = 0, py = 0, tx = 0, ty = 0, parK = 0;
  const sizeV = new THREE.Vector2(1, 1);

  /* shared uniforms (every material references the same objects) */
  const U = {
    uT: { value: 0 }, uRise: { value: 0 }, uClipMin: { value: -100 }, uClipSoft: { value: .002 }, uExt: { value: 0 },
    uFill: { value: 0 }, uL: { value: new THREE.Vector3(-.45, .75, .5).normalize() }, uVp: { value: new THREE.Vector2(1, 1) },
    uCol: { value: new THREE.Color(0xF2F0EB) }, uEdgeA: { value: 0 }, uCapOn: { value: 1 }
  };
  const A = { plan: { value: 1 }, secFill: { value: 1 }, secRib: { value: 1 }, secLine: { value: 1 }, sun: { value: 1 }, site: { value: 0 }, water: { value: 0 }, fig: { value: 0 } };
  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-10, 10, 10, -10, .1, 600);
  const base = new THREE.Vector3(-.45, .75, .5).normalize();
  const fitC = { plan: 28, sec: 40, axo: 24, planT: new THREE.Vector3(), secT: new THREE.Vector3(0, 4.6, 0), axoT: new THREE.Vector3(0, 4.6, 0) };
  const tgt = new THREE.Vector3(), dirV = new THREE.Vector3(), tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
  const mats = [], geos = [];
  let tex = null;

  const mat = (vs, fs, uni, defs, o) => { const m = new THREE.ShaderMaterial(Object.assign({ vertexShader: vs, fragmentShader: fs, uniforms: uni, defines: defs || {}, transparent: true, depthWrite: false, depthTest: false }, o || {})); mats.push(m); return m; };
  const put = (geo, m, order, line) => {
    geos.push(geo);
    const o = line ? new THREE.LineSegments(geo, m) : new THREE.Mesh(geo, m);
    o.frustumCulled = false; o.renderOrder = order; scene.add(o); return o;
  };

  function ensureBuilt() {
    if (built || building) return; building = true;
    /* ---- MASS: faces (depth prepass + translucent colour pass) and edges ---- */
    const F = new FaceSet(), E = new EdgeSet();
    S.boxes.forEach(b => emitBox(b, F, E));
    S.stairEdges.forEach(e => E.seg(W3(e[0], e[1], e[2]), W3(e[3], e[4], e[5]), [.12, 1, 0, 0], .55));
    S.extra.rails.forEach(e => E.seg(W3(e[0], e[1], e[2]), W3(e[3], e[4], e[5]), [.55, 1, 0, 0], .45));
    const fg = F.geo(THREE), eg = E.geo(THREE);
    const solidU = { uRise: U.uRise, uClipMin: U.uClipMin };
    put(fg, mat(SH.solidVS, SH.prepassFS, solidU, null, { transparent: false, depthWrite: true, depthTest: true, colorWrite: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, side: THREE.FrontSide }), 0);
    put(fg, mat(SH.solidVS, SH.colorFS, { uRise: U.uRise, uClipMin: U.uClipMin, uExt: U.uExt, uFill: U.uFill, uL: U.uL }, null, { depthTest: true, side: THREE.FrontSide }), 3);
    put(eg, mat(SH.edgeVS, SH.edgeFS, { uRise: U.uRise, uClipMin: U.uClipMin, uClipSoft: U.uClipSoft, uEdgeA: U.uEdgeA, uCol: U.uCol }, null, { depthTest: true }), 6, true);

    /* ---- PLAN ---- */
    const pl = buildPlan(S);
    const lineU = a => ({ uT: U.uT, uA: a, uCol: U.uCol });
    put(pl.F.geo(THREE), mat(SH.fillVS, SH.flatFS, { uT: U.uT, uRise: U.uRise, uA: A.plan, uCol: U.uCol }), 1);
    put(pl.L.geo(THREE), mat(SH.lineVS, SH.lineFS, lineU(A.plan)), 2, true);
    put(pl.R.geo(THREE), mat(SH.ribVS, SH.flatFS, { uT: U.uT, uRise: U.uRise, uVp: U.uVp, uA: A.plan, uCol: U.uCol }), 2);

    /* ---- SECTION ---- */
    const sc = buildSection(S), sg = sc.F.geo(THREE);
    put(sg, mat(SH.capVS, SH.capFS, { uRise: U.uRise, uCapOn: U.uCapOn }, null, { transparent: false, depthWrite: true, depthTest: true, colorWrite: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, side: THREE.DoubleSide }), 0);
    put(sg, mat(SH.fillVS, SH.flatFS, { uT: U.uT, uRise: U.uRise, uA: A.secFill, uCol: U.uCol }, { GROW: 1 }, { depthTest: true, side: THREE.DoubleSide }), 4);
    put(sc.R.geo(THREE), mat(SH.ribVS, SH.flatFS, { uT: U.uT, uRise: U.uRise, uVp: U.uVp, uA: A.secRib, uCol: U.uCol }, { GROW: 1 }, { side: THREE.DoubleSide }), 7);
    put(sc.L.geo(THREE), mat(SH.lineVS, SH.lineFS, lineU(A.secLine)), 7, true);
    put(sc.Sun.geo(THREE), mat(SH.lineVS, SH.lineFS, lineU(A.sun)), 7, true);

    /* ---- SITE, FIGURE, WATER ---- */
    const site = new LineSet(), sw = (x, z) => [x, -.25, z];
    for (let i = -7; i <= 7; i++) {
      [[sw(i * 3, -21), sw(i * 3, 21)], [sw(-21, i * 3), sw(21, i * 3)]].forEach(p => {
        const n = 7; for (let k = 0; k < n; k++) {
          const a = [lerp(p[0][0], p[1][0], k / n), -.25, lerp(p[0][2], p[1][2], k / n)], b = [lerp(p[0][0], p[1][0], (k + 1) / n), -.25, lerp(p[0][2], p[1][2], (k + 1) / n)];
          const d = Math.hypot((a[0] + b[0]) / 2, (a[2] + b[2]) / 2); site.add(a, b, -10, 1, .11 * cl(1 - d / 28, 0, 1), 0);
        }
      });
    }
    if (!(coarse.matches)) [17, 20, 23.5].forEach((r0, k) => {
      const pts = []; for (let i = 0; i <= 90; i++) { const a = i / 90 * Math.PI * 2, r = r0 + 1.1 * Math.sin(3 * a + k) + .6 * Math.sin(5 * a + 2 * k); pts.push([Math.cos(a) * r, -.25, Math.sin(a) * r]); }
      site.poly(pts, -10, 1, .07, 0);
    });
    put(site.geo(THREE), mat(SH.lineVS, SH.lineFS, lineU(A.site), null, { depthTest: true }), 0, true);

    const fe = new EdgeSet(), fig = S.figure, fgp = [.55, 1, 0, 0];
    const fring = (z, r) => { for (let i = 0; i < 16; i++) { const a0 = i / 16 * 6.2832, a1 = (i + 1) / 16 * 6.2832; fe.seg(W3(fig.x + Math.cos(a0) * r, fig.y + Math.sin(a0) * r * .7, z), W3(fig.x + Math.cos(a1) * r, fig.y + Math.sin(a1) * r * .7, z), fgp, .8); } };
    [[.06, .1], [.45, .16], [.85, .19], [1.2, .18], [1.42, .13], [1.58, .08], [1.7, .03]].forEach(r => fring(r[0], r[1]));
    for (let k = 0; k < 4; k++) { const a = k * 1.5708, cx = Math.cos(a), cy = Math.sin(a) * .7; fe.seg(W3(fig.x + cx * .1, fig.y + cy * .1, .06), W3(fig.x + cx * .19, fig.y + cy * .19, .85), fgp, .6); fe.seg(W3(fig.x + cx * .19, fig.y + cy * .19, .85), W3(fig.x + cx * .08, fig.y + cy * .08, 1.58), fgp, .6); }
    put(fe.geo(THREE), mat(SH.edgeVS, SH.edgeFS, { uRise: U.uRise, uClipMin: U.uClipMin, uClipSoft: U.uClipSoft, uEdgeA: A.fig, uCol: U.uCol }, null, { depthTest: true }), 8, true);
    const we = new EdgeSet(), wg = [.5, 1, 0, 0];
    [[6.9, 6.9, 11.1, 6.9], [11.1, 6.9, 11.1, 10.7], [11.1, 10.7, 6.9, 10.7], [6.9, 10.7, 6.9, 6.9]].forEach(s => we.seg(W3(s[0], s[1], .03), W3(s[2], s[3], .03), wg, .7));
    for (let i = 0; i < 7; i++) { const y = 7.2 + i * .5, ins = .3 + (i % 3) * .45; we.seg(W3(6.9 + ins, y, .03), W3(11.1 - ins, y, .03), wg, .35); }
    put(we.geo(THREE), mat(SH.edgeVS, SH.edgeFS, { uRise: U.uRise, uClipMin: U.uClipMin, uClipSoft: U.uClipSoft, uEdgeA: A.water, uCol: U.uCol }, null, { depthTest: true }), 8, true);

    /* ---- projected shadow planes, sun patch and light shaft (no shadow maps) ---- */
    const qg = new THREE.PlaneGeometry(1, 1); geos.push(qg);
    const shM = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }); mats.push(shM);
    const mkQ = (m, order) => { const q = new THREE.Mesh(qg, m); q.frustumCulled = false; q.renderOrder = order; scene.add(q); return q; };
    shadows.s1 = mkQ(shM, 5); shadows.s2 = mkQ(shM, 5); shadows.w = mkQ(shM, 5);
    shadows.s1.position.set(-5.25, 3, 9.17); shadows.s2.position.set(5.25, 3, 9.17); shadows.w.position.set(-9.17, 3, 0); shadows.w.rotation.y = -Math.PI / 2;
    shadows.s1.scale.x = 7.8; shadows.s2.scale.x = 7.8; shadows.w.scale.x = 18.3; shadows.mat = shM;
    const pM = new THREE.MeshBasicMaterial({ color: 0xfff1dc, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }); mats.push(pM);
    shadows.patch = mkQ(pM, 5); shadows.patch.rotation.x = -Math.PI / 2; shadows.pMat = pM;
    const shg = new THREE.BufferGeometry(); shg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(48), 3));
    const shi = []; for (let i = 0; i < 4; i++) { const v = i * 4; shi.push(v, v + 1, v + 2, v, v + 2, v + 3); } shg.setIndex(shi); geos.push(shg);
    const sM = new THREE.MeshBasicMaterial({ color: 0xfff1dc, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }); mats.push(sM);
    shadows.shaft = mkQ(sM, 5); shadows.shaft.geometry = shg; shadows.sMat = sM;

    buildLabels();
    if (global.document.fonts && global.document.fonts.ready) global.document.fonts.ready.then(() => { if (built && !lost) buildLabels(); });
    fit(); built = true; building = false;
  }
  const shadows = {};

  /* ---------------------------------------------------------
     LABELS: one small canvas atlas, one mesh. Small uppercase, wide tracking, grey.
     --------------------------------------------------------- */
  const LD = [];
  (function defs() {
    const g = S.grid;
    g.lx.forEach((t, i) => LD.push({ t, p: [g.x[i], -2.35, 0], al: [.5, .5], w: [.85, 1.05, 2.3, 2.7], sz: 11, wt: 600 }));
    g.ly.forEach((t, i) => LD.push({ t, p: [-2.35, g.y[i], 0], al: [.5, .5], w: [.85, 1.05, 2.3, 2.7], sz: 11, wt: 600 }));
    LD.push({ t: '18.000', p: [15.5, -5.4, 0], al: [.5, .5], off: [30, 0], w: [1.65, 1.85, 2.3, 2.6] });
    LD.push({ t: '6.000', p: [9, -4.1, 0], al: [.5, .5], off: [26, 0], w: [1.7, 1.9, 2.3, 2.6] });
    LD.push({ t: '6.000', p: [3, 22, 0], al: [.5, .5], off: [-26, 0], w: [1.72, 1.92, 2.3, 2.6] });
    LD.push({ t: 'A-101', p: [-3.4, -5.0, 0], al: [.5, .5], w: [1.3, 1.55, 1.8, 2.05] });
    LD.push({ t: '1:100', p: [-3.4, -5.0, 0], al: [.5, .5], off: [0, -17], w: [1.7, 1.9, 2.2, 2.45] });
    LD.push({ t: 'N', p: [-4.2, 23.9, 0], al: [.5, .5], w: [1.5, 1.7, 2.1, 2.35], sz: 11, wt: 600 });
    LD.push({ t: 'SECTION A-A', p: [9, -2.35, 0], al: [.5, .5], off: [0, 28], w: [1.95, 2.15, 2.4, 2.7] });
    LD.push({ t: 'A', p: [9, -2.35, 0], al: [.5, .5], w: [1.65, 1.8, 2.3, 2.6], sz: 11, wt: 600 });
    LD.push({ t: 'A', p: [9, 20.35, 0], al: [.5, .5], w: [1.65, 1.8, 2.3, 2.6], sz: 11, wt: 600 });
    LD.push({ t: 'UP', p: [9.6, 11.5, 0], al: [0, .5], off: [6, 0], w: [1.72, 1.85, 2.3, 2.6] });
    LD.push({ t: '+0.000', p: [19.4, 16, 0], al: [.5, 0], off: [0, 10], w: [1.65, 1.8, 2.2, 2.5] });
    [0, 3.6, 6.8].forEach((z, i) => LD.push({ t: ['+0.000', '+3.600', '+6.800'][i], p: [9, 20.9, z], al: [1, .5], off: [-4, 0], w: [2.75, 3.0, 3.3, 3.6], sec: 1 }));
    LD.push({ t: 'SECTION A-A', p: [9, 9, -1.3], al: [.5, .5], w: [2.85, 3.05, 3.3, 3.6], sec: 1 });
    LD.push({ t: '+3.600', p: [-.15, -.15, 3.6], al: [1, .5], off: [-10, 0], cyc: 0 });
    LD.push({ t: 'SECTION A-A', p: [9, -2.2, 0], al: [.5, 1], off: [0, -10], cyc: 1 });
    LD.push({ t: '+6.800', p: [-.15, -.15, 6.8], al: [1, .5], off: [-10, 0], cyc: 2 });
  })();
  let labMesh = null, labA = null;
  function buildLabels() {
    if (labMesh) { scene.remove(labMesh); labMesh.geometry.dispose(); }
    if (tex) tex.dispose();
    const K = 2, TR = 2.2, cv = global.document.createElement('canvas'), ctx = cv.getContext('2d');
    const font = (l) => (l.wt || 500) + ' ' + ((l.sz || 10) * K) + 'px Montserrat, Arial, sans-serif';
    const uniq = new Map(); let x = 4, y = 4, rowH = 0; const W = 1024;
    LD.forEach(l => {
      const key = l.t + '|' + (l.sz || 10) + '|' + (l.wt || 500);
      if (uniq.has(key)) { l.cell = uniq.get(key); return; }
      ctx.font = font(l);
      let w = 0; for (const ch of l.t) w += ctx.measureText(ch).width + TR * K; w -= TR * K;
      const h = (l.sz || 10) * K * 1.5, cw = Math.ceil(w) + 8;
      if (x + cw > W) { x = 4; y += rowH + 4; rowH = 0; }
      const cell = { x, y, w: cw, h: Math.ceil(h) + 4, tw: w, key }; uniq.set(key, cell); l.cell = cell;
      x += cw + 4; rowH = Math.max(rowH, cell.h);
    });
    cv.width = W; cv.height = Math.max(64, y + rowH + 8); ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle';
    uniq.forEach((cell, key) => {
      const l = LD.find(q => q.cell === cell); ctx.font = font(l);
      let xx = cell.x + 4; for (const ch of l.t) { ctx.fillText(ch, xx, cell.y + cell.h / 2); xx += ctx.measureText(ch).width + TR * K; }
    });
    tex = new THREE.CanvasTexture(cv); tex.minFilter = tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false;
    const P = [], C = [], Sz = [], O = [], UV = [], Al = [], I = [];
    LD.forEach((l, i) => {
      const cw = l.cell.w / K, ch = l.cell.h / K, p = W3(l.p[0], l.p[1], l.p[2]);
      const u0 = l.cell.x / cv.width, u1 = (l.cell.x + l.cell.w) / cv.width, v0 = 1 - (l.cell.y + l.cell.h) / cv.height, v1 = 1 - l.cell.y / cv.height;
      [[0, 0, u0, v0], [1, 0, u1, v0], [1, 1, u1, v1], [0, 1, u0, v1]].forEach(q => {
        P.push(p[0], p[1], p[2]); C.push(q[0], q[1]); Sz.push(cw, ch, l.al[0], l.al[1]); O.push(l.off ? l.off[0] : 0, l.off ? l.off[1] : 0); UV.push(q[2], q[3]); Al.push(0);
      });
      I.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
    });
    const g = mkGeo(THREE, [['aP', P, 3], ['aC', C, 2], ['aS', Sz, 4], ['aO', O, 2], ['aUV', UV, 2], ['aA', Al, 1]], I);
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(Al.length * 3), 3));
    labA = g.attributes.aA; labA.setUsage(THREE.DynamicDrawUsage);
    const m = mat(SH.labVS, SH.labFS, { uVp: U.uVp, uTex: { value: tex }, uCol: { value: new THREE.Color(0x8A8A85) } });
    labMesh = new THREE.Mesh(g, m); labMesh.frustumCulled = false; labMesh.renderOrder = 9; scene.add(labMesh);
  }
  function updateLabels() {
    if (!labA) return;
    const arr = labA.array, cyc = ((idle % 9.6) + 9.6) % 9.6, slot = Math.floor(cyc / 3.2), f = (cyc % 3.2) / 3.2;
    const finalK = sm(win(T, 5.3, 5.8));
    for (let i = 0; i < LD.length; i++) {
      const l = LD[i]; let a;
      if (l.cyc !== undefined) a = slot === l.cyc ? sm(win(f, 0, .15)) * (1 - sm(win(f, .8, 1))) * finalK : 0;
      else a = sm(win(T, l.w[0], l.w[1])) * (1 - sm(win(T, l.w[2], l.w[3])));
      a *= labelK; arr[i * 4] = arr[i * 4 + 1] = arr[i * 4 + 2] = arr[i * 4 + 3] = a;
    }
    labA.needsUpdate = true;
  }

  /* ---------------------------------------------------------
     CAMERA (orthographic only): plan = top-down, section = elevation from the west, final = axonometric
     --------------------------------------------------------- */
  function fit() {
    renderer.getSize(sizeV); const vw = sizeV.x, vh = sizeV.y; U.uVp.value.set(vw, vh);
    fitC.plan = FIT_SCALE * Math.min(.58 * Math.min(vw, vh) / 18.3, .92 * vw / 30.5, .9 * vh / 26);
    fitC.sec = FIT_SCALE * Math.min(.66 * vw / 22.8, .56 * vh / 10.2);
    const az = -40 * RAD, pt = 32 * RAD;
    dirV.set(Math.sin(az) * Math.cos(pt), Math.sin(pt), Math.cos(az) * Math.cos(pt));
    const fw = tmpA.copy(dirV).negate(), rt = tmpB.copy(fw).cross(new THREE.Vector3(0, 1, 0)).normalize(), up = new THREE.Vector3().copy(rt).cross(fw);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    [-10.65, 10.05].forEach(X => [-.2, 9.4].forEach(Y => [-10.05, 10.65].forEach(Z => {
      const a = X * rt.x + Y * rt.y + Z * rt.z, b = X * up.x + Y * up.y + Z * up.z;
      x0 = Math.min(x0, a); x1 = Math.max(x1, a); y0 = Math.min(y0, b); y1 = Math.max(y1, b);
    })));
    fitC.axo = FIT_SCALE * Math.min(.64 * vw / (x1 - x0), .7 * vh / (y1 - y0));
    fitC.axoT.set(-.3, 4.6, .3);
  }
  function setCamera(t) {
    const w1 = eio(win(t, 1.8, 2.7)), w2 = eio(win(t, 3.2, 4.8));
    let pitch = lerp(89.9, 0, w1); pitch = lerp(pitch, 32, w2);
    let az = lerp(-90, -40, w2);
    const par = parK * (.18 + .82 * w2);
    az += 3 * px * par + (lite ? 0 : 1.2 * Math.sin(idle * 2 * Math.PI / 14) * w2);
    pitch += -2 * py * par;
    tgt.copy(fitC.planT);
    tgt.lerp(fitC.secT, w1); tgt.lerp(fitC.axoT, w2);
    let ppm = Math.exp(lerp(Math.log(fitC.plan), Math.log(fitC.sec), w1)); ppm = Math.exp(lerp(Math.log(ppm), Math.log(fitC.axo), w2));
    const pr = pitch * RAD, ar = az * RAD;
    dirV.set(Math.sin(ar) * Math.cos(pr), Math.sin(pr), Math.cos(ar) * Math.cos(pr));
    cam.position.copy(tgt).addScaledVector(dirV, 200);
    cam.up.set(0, 1, 0); cam.lookAt(tgt);
    const hw = sizeV.x / 2 / ppm, hh = sizeV.y / 2 / ppm;
    cam.left = -hw; cam.right = hw; cam.top = hh; cam.bottom = -hh; cam.updateProjectionMatrix();
  }

  /* ---------------------------------------------------------
     MASTER TIMELINE: every stage is a pure function of T
     --------------------------------------------------------- */
  function frame() {
    U.uT.value = T;
    U.uRise.value = eio(win(T, 1.95, 2.85));
    const sweep = eio(win(T, 3.3, 4.7));
    U.uClipMin.value = T < 1.9 ? -100 : T < 3.3 ? lerp(-11, 0, eio(win(T, 1.9, 2.3))) : -sweep * 12;
    U.uClipSoft.value = T > 3.25 ? 1.4 : .002;
    U.uExt.value = T < 3.3 ? 0 : sweep * 13;
    U.uFill.value = .5 * sm(win(T, 3.25, 3.6));
    U.uCapOn.value = T < 3.25 ? 1 : 0;
    U.uEdgeA.value = sm(win(T, 1.2, 1.7)) * (1 + .5 * sm(win(T, 3.3, 4.6)));
    A.plan.value = 1 - sm(win(T, 2.15, 2.85));
    A.secFill.value = 1 - sm(win(T, 3.2, 3.7));
    A.secRib.value = 1 - sm(win(T, 3.3, 4.0));
    A.secLine.value = 1 - sm(win(T, 3.2, 3.7));
    A.sun.value = lerp(1, .12, sm(win(T, 3.05, 3.25))) * (1 - sm(win(T, 3.3, 3.8)));
    const s4 = sm(win(T, 4.7, 5.6));
    A.site.value = s4; A.fig.value = sm(win(T, 2.8, 3.1)); A.water.value = sm(win(T, 4.5, 5.2)) * (.8 + .2 * Math.sin(idle * 1.3));
    /* light drifts ±8° over ~20 s */
    const ang = (lite ? 0 : 8) * RAD * Math.sin(idle * 2 * Math.PI / 20), ca = Math.cos(ang), sa = Math.sin(ang);
    const lx = base.x * ca - base.z * sa, lz = base.x * sa + base.z * ca, ly = base.y;
    U.uL.value.set(lx, ly, lz);
    if (shadows.mat) {
      const dW = cl(1.5 * ly / Math.max(.15, -lx), 0, 3.4), dS = cl(1.5 * ly / Math.max(.15, lz), 0, 3.4);
      [shadows.s1, shadows.s2].forEach(q => { q.scale.y = dS; q.position.y = 6.6 - dS / 2; });
      shadows.w.scale.y = dW; shadows.w.position.y = 6.6 - dW / 2;
      shadows.mat.opacity = .4 * s4;
      const sx = -lx * 6.8 / ly, sz = -lz * 6.8 / ly;
      const tx0 = Math.max(-3, -3 - sx), tx1 = Math.min(3, 3 - sx), tz0 = Math.max(-3, -3 - sz), tz1 = Math.min(3, 3 - sz);
      const ok = tx1 > tx0 + .05 && tz1 > tz0 + .05 && !lite;
      shadows.shaft.visible = shadows.patch.visible = ok;
      if (ok) {
        shadows.patch.position.set((tx0 + tx1) / 2 + sx, .045, (tz0 + tz1) / 2 + sz);
        shadows.patch.scale.set(tx1 - tx0, tz1 - tz0, 1);
        const p = shadows.shaft.geometry.attributes.position.array, tc = [[tx0, tz0], [tx1, tz0], [tx1, tz1], [tx0, tz1]];
        for (let i = 0; i < 4; i++) {
          const a = tc[i], b = tc[(i + 1) % 4], o = i * 12;
          p[o] = a[0]; p[o + 1] = 6.8; p[o + 2] = a[1]; p[o + 3] = b[0]; p[o + 4] = 6.8; p[o + 5] = b[1];
          p[o + 6] = b[0] + sx; p[o + 7] = .045; p[o + 8] = b[1] + sz; p[o + 9] = a[0] + sx; p[o + 10] = .045; p[o + 11] = a[1] + sz;
        }
        shadows.shaft.geometry.attributes.position.needsUpdate = true;
        shadows.sMat.opacity = .05 * s4; shadows.pMat.opacity = .1 * s4;
      }
    }
    setCamera(T);
    updateLabels();
  }

  /* ---------------------------------------------------------
     INTERACTION (forward only): hover plays Parti → Plan → Section → Mass → Space.
     Leaving is handled by home.js (quick fade, then reset): nothing plays backwards.
     --------------------------------------------------------- */
  const PARALLAX_DEAD_ZONE = .015;
  const onMove = e => {
    const nx = (e.clientX / global.innerWidth - .5) * 2, ny = (e.clientY / global.innerHeight - .5) * 2;
    if (Math.abs(nx - tx) >= PARALLAX_DEAD_ZONE) tx = nx;
    if (Math.abs(ny - ty) >= PARALLAX_DEAD_ZONE) ty = ny;
  };
  global.addEventListener('pointermove', onMove, { passive: true });
  const cvs = renderer.domElement;
  const onLost = e => { e.preventDefault(); lost = true; }, onRest = () => { lost = false; };
  cvs.addEventListener('webglcontextlost', onLost); cvs.addEventListener('webglcontextrestored', onRest);

  const api = {
    DUR,
    advance(dt, active) {
      if (seekT >= 0) { T = seekT; return T / DUR; }
      if (active) {
        ensureBuilt(); if (!built) return 0;
        if (reduce.matches || lite) c = 1; else c = Math.min(1, c + dt / DUR);
        if (c >= 1) {
          const now = global.performance.now();
          if (idleStart < 0) idleStart = now;
          idle = (now - idleStart) / 1000;
        } else { idle = 0; idleStart = -1; }
        if (!DEBUG && coarse.matches && dt > .045 && c < 1) { slowAcc += dt; if (slowAcc > 1.4) { lite = true; c = 1; } }
        px += (tx - px) * (1 - Math.exp(-dt * 2.2)); py += (ty - py) * (1 - Math.exp(-dt * 2.2));
        parK = Math.min(1, parK + dt * 2);
        labelK = Math.min(1, labelK + dt * 4);
      } else { parK = 0; labelK = Math.max(0, labelK - dt * 6); }
      T = c * DUR; return c;
    },
    visible() { return built && T > .002 && !lost && !global.document.hidden; },
    render(r) { if (!api.visible()) return false; frame(); (r || renderer).render(scene, cam); return true; },
    reset() { c = 0; T = 0; idle = 0; idleStart = -1; slowAcc = 0; labelK = 1; },
    fade() { },
    preload() { ensureBuilt(); if (built && renderer.compile) { try { renderer.compile(scene, cam); } catch (e) { } } },
    resize() { if (built) fit(); },
    seek(t) { seekT = t; if (!built) ensureBuilt(); labelK = 1; parK = 1; },
    verify() {
      const bad = [], g = S.grid, near = (a, b) => Math.abs(a - b) < 1e-6;
      S.cols.forEach(q => { if (!g.x.some(v => near(v, q.x)) || !g.y.some(v => near(v, q.y))) bad.push('column off grid'); });
      const st = S.stair; if (st.risers !== st.treads + 1) bad.push('stair counts'); if (Math.abs(2 * st.R * 1000 + 280 - 622) > 1.5) bad.push('2R+T=' + (2 * st.R * 1000 + 280));
      if (Math.abs(st.R * st.risers - 3.6) > 1e-9) bad.push('rise');
      const sec = S.sectionBoxes.length, plan = S.planCutBoxes.length; if (!sec || !plan) bad.push('empty cut sets');
      return { ok: bad.length === 0, bad, boxes: S.boxes.length, sectionCut: sec, planCut: plan, R: st.R * 1000, T: st.T * 1000 };
    },
    dispose() {
      global.removeEventListener('pointermove', onMove);
      cvs.removeEventListener('webglcontextlost', onLost); cvs.removeEventListener('webglcontextrestored', onRest);
      geos.forEach(g => g.dispose()); mats.forEach(m => m.dispose()); if (tex) tex.dispose();
      if (labMesh) labMesh.geometry.dispose();
      geos.length = 0; mats.length = 0; built = false;
    }
  };
  if (DEBUG) global.__sapArch = api;
  return api;
}

global.SAPArchitecture = { create, BuildingSpec };
})(window);
