/**
 * Procedural lily-of-the-valley meadow, generated once on the CPU: arching
 * flower stems with nodding scalloped bells, broad sheathing leaves, grass and
 * a ground plane. Every vertex carries what the vertex shader needs to bend it
 * in the wind (see lily.wgsl.ts for the matching layout).
 */

/** pos3 normal3 color3 uv2 [material sway phase] pivot3 [pivotSway swing flutter] */
export const VERTEX_FLOATS = 20;
export const VERTEX_STRIDE = VERTEX_FLOATS * 4;

const MATERIAL = { stem: 0, bell: 1, leaf: 2, grass: 3, ground: 4 } as const;

export type Vec3 = [number, number, number];

const UP: Vec3 = [0, 1, 0];
const ORIGIN: Vec3 = [0, 0, 0];

export const add = (a: Vec3, b: Vec3): Vec3 => [
  a[0] + b[0],
  a[1] + b[1],
  a[2] + b[2],
];
export const sub = (a: Vec3, b: Vec3): Vec3 => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2],
];
export const scale = (a: Vec3, s: number): Vec3 => [
  a[0] * s,
  a[1] * s,
  a[2] * s,
];
export const dot = (a: Vec3, b: Vec3) =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const normalize = (a: Vec3): Vec3 => {
  const len = Math.hypot(a[0], a[1], a[2]);
  return len > 1e-12 ? scale(a, 1 / len) : [0, 1, 0];
};
const mix = (a: Vec3, b: Vec3, t: number): Vec3 => add(a, scale(sub(b, a), t));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (x: number, lo: number, hi: number) =>
  Math.min(Math.max(x, lo), hi);
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
const rotateY = (v: Vec3, a: number): Vec3 => [
  v[0] * Math.cos(a) - v[2] * Math.sin(a),
  v[1],
  v[0] * Math.sin(a) + v[2] * Math.cos(a),
];

/** Deterministic PRNG so the meadow looks the same on every visit. */
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Surface = (u: number, v: number) => Vec3;

interface Attrs {
  color: Vec3;
  material: number;
  /** Bend weight: how far this point moves with the wind. */
  sway: number;
  phase: number;
  /** Bells and pedicels swing rigidly around their attachment point. */
  pivot?: Vec3;
  pivotSway?: number;
  swing?: number;
  flutter?: number;
}

/** Central-difference normal; nudges away from poles where du collapses. */
function surfaceNormal(at: Surface, u: number, v: number): Vec3 {
  const e = 1e-3;
  for (const vv of [v, clamp(v, 0.02, 0.98), clamp(v, 0.08, 0.92)]) {
    const du = sub(at(Math.min(u + e, 1), vv), at(Math.max(u - e, 0), vv));
    const dv = sub(at(u, Math.min(vv + e, 1)), at(u, Math.max(vv - e, 0)));
    const n = cross(du, dv);
    if (Math.hypot(n[0], n[1], n[2]) > 1e-12) return normalize(n);
  }
  return UP;
}

class MeshBuilder {
  private readonly vertices: number[] = [];
  private readonly indices: number[] = [];
  private count = 0;

  surface(
    uSeg: number,
    vSeg: number,
    at: Surface,
    attrs: (u: number, v: number) => Attrs,
    uvOf: (u: number, v: number) => [number, number] = (u, v) => [u, v],
    /** When given, normals are flipped to agree with this direction. */
    outward?: (u: number, v: number) => Vec3,
  ) {
    const base = this.count;
    for (let j = 0; j <= vSeg; j++) {
      const v = j / vSeg;
      for (let i = 0; i <= uSeg; i++) {
        const u = i / uSeg;
        const p = at(u, v);
        let n = surfaceNormal(at, u, v);
        if (outward && dot(n, outward(u, v)) < 0) n = scale(n, -1);
        const a = attrs(u, v);
        const [tu, tv] = uvOf(u, v);
        const pivot = a.pivot ?? ORIGIN;
        this.vertices.push(
          p[0],
          p[1],
          p[2],
          n[0],
          n[1],
          n[2],
          a.color[0],
          a.color[1],
          a.color[2],
          tu,
          tv,
          a.material,
          a.sway,
          a.phase,
          pivot[0],
          pivot[1],
          pivot[2],
          a.pivotSway ?? 0,
          a.swing ?? 0,
          a.flutter ?? 0,
        );
        this.count++;
      }
    }
    const row = uSeg + 1;
    for (let j = 0; j < vSeg; j++) {
      for (let i = 0; i < uSeg; i++) {
        const a = base + j * row + i;
        const b = a + 1;
        const c = a + row;
        const d = c + 1;
        this.indices.push(a, c, b, b, c, d);
      }
    }
  }

  finish() {
    return {
      vertices: new Float32Array(this.vertices),
      indices: new Uint32Array(this.indices),
    };
  }
}

type Curve = (t: number) => Vec3;

function bezier(p: [Vec3, Vec3, Vec3, Vec3]): Curve {
  return (t) => {
    const s = 1 - t;
    return add(
      add(scale(p[0], s * s * s), scale(p[1], 3 * s * s * t)),
      add(scale(p[2], 3 * s * t * t), scale(p[3], t * t * t)),
    );
  };
}

function tangent(curve: Curve, t: number): Vec3 {
  return normalize(
    sub(curve(Math.min(t + 0.01, 1)), curve(Math.max(t - 0.01, 0))),
  );
}

/** Tube around a planar curve; `ref` must never be parallel to the curve. */
function tube(curve: Curve, radius: (t: number) => number, ref: Vec3): Surface {
  return (u, v) => {
    const t = tangent(curve, v);
    const n = normalize(cross(t, ref));
    const b = cross(t, n);
    const a = u * Math.PI * 2;
    return add(
      curve(v),
      scale(add(scale(n, Math.cos(a)), scale(b, Math.sin(a))), radius(v)),
    );
  };
}

/** Radius and depth (along the hanging axis) of an open bell with six lobes. */
function bellProfile(v: number, phi: number, r: number): [number, number] {
  const height = r * 1.3;
  const lobe = (0.5 + 0.5 * Math.cos(6 * phi)) ** 2;
  const body =
    Math.sqrt(Math.sin((Math.min(v / 0.84, 1) * Math.PI) / 2)) *
    (0.84 + 0.16 * Math.sin(v * Math.PI * 0.95));
  const m = clamp((v - 0.82) / 0.18, 0, 1);
  const flare = m * m;
  return [
    r * (body + flare * (0.1 + 0.24 * lobe)),
    height * v - height * flare * m * (0.03 + 0.12 * lobe),
  ];
}

const STEM_LOW: Vec3 = [0.4, 0.56, 0.3];
const STEM_HIGH: Vec3 = [0.58, 0.7, 0.42];
const PEDICEL: Vec3 = [0.62, 0.74, 0.46];
const BELL_WHITE: Vec3 = [0.98, 0.975, 0.955];
const BELL_GREEN: Vec3 = [0.8, 0.88, 0.7];
const BUD_GREEN: Vec3 = [0.76, 0.85, 0.62];
const BLUSH: Vec3 = [1.0, 0.8, 0.88];
const LEAF_BASE: Vec3 = [0.62, 0.74, 0.44];
const LEAF_DEEP: Vec3 = [0.3, 0.52, 0.3];

interface PlantOptions {
  x: number;
  z: number;
  size: number;
  camera: Vec3;
  detail: number;
}

function addPlant(mb: MeshBuilder, rand: () => number, o: PlantOptions) {
  const root: Vec3 = [o.x, 0, o.z];
  const phase = rand();
  const height = o.size * (0.86 + rand() * 0.24);
  const toCam = normalize([o.camera[0] - o.x, 0, o.camera[2] - o.z]);
  const camAngle = Math.atan2(toCam[2], toCam[0]);

  // Arch roughly across the line of sight so the bells read in profile, and
  // hang them on the side facing the viewer.
  const theta =
    camAngle + (rand() < 0.5 ? 1 : -1) * Math.PI * 0.5 + (rand() - 0.5) * 1.1;
  const arch: Vec3 = [Math.cos(theta), 0, Math.sin(theta)];
  let side: Vec3 = [-arch[2], 0, arch[0]];
  if (dot(side, toCam) < 0) side = scale(side, -1);

  const stem = bezier([
    root,
    add(root, [0, 0.55 * height, 0]),
    add(root, add(scale(arch, 0.2 * height), [0, 1.02 * height, 0])),
    add(root, add(scale(arch, 0.46 * height), [0, 0.9 * height, 0])),
  ]);
  const stemSway = (t: number) => height * t ** 1.8;

  // Leaves: two or three broad blades splayed around the stem, cupped and
  // pointed, kept mostly behind it so they frame rather than hide the bells.
  const leafCount = rand() < 0.35 ? 3 : 2;
  for (let leaf = 0; leaf < leafCount; leaf++) {
    const spread = (leaf - (leafCount - 1) / 2) * (1.9 / leafCount);
    const psi = camAngle + Math.PI + spread + (rand() - 0.5) * 0.9;
    const dir: Vec3 = [Math.cos(psi), 0, Math.sin(psi)];
    const perp: Vec3 = [-dir[2], 0, dir[0]];
    const length = height * (0.8 + rand() * 0.3);
    const width = o.size * (0.07 + rand() * 0.035);
    const lean = 0.35 + rand() * 0.3;
    const twist = (rand() - 0.5) * 0.9;
    const tint = rand() * 0.25;
    const spine: Curve = (v) =>
      add(
        root,
        add(scale(dir, length * lean * v ** 1.7 + 0.008), [
          0,
          length * (v - 0.2 * v * v),
          0,
        ]),
      );
    const leafWidth = (v: number) =>
      width *
      Math.sin(Math.PI * v ** 0.72) ** 0.85 *
      (0.18 + 0.82 * smoothstep(0, 0.28, v));
    mb.surface(
      Math.max(4, Math.round(8 * o.detail)),
      Math.max(10, Math.round(26 * o.detail)),
      (u, v) => {
        const across = u * 2 - 1;
        const t = tangent(spine, v);
        const tw = twist * v;
        const sideways = normalize(
          add(scale(perp, Math.cos(tw)), scale(cross(t, perp), Math.sin(tw))),
        );
        const face = normalize(cross(sideways, t));
        const w = leafWidth(v);
        return add(
          spine(v),
          add(scale(sideways, across * w), scale(face, 0.4 * w * across ** 2)),
        );
      },
      (u, v) => ({
        color: mix(
          mix(LEAF_BASE, LEAF_DEEP, smoothstep(0, 0.35, v)),
          LEAF_BASE,
          tint,
        ),
        material: MATERIAL.leaf,
        sway: length * 0.7 * v * v,
        phase,
        flutter: Math.abs(u * 2 - 1) * v + 0.3 * v,
      }),
      (u, v) => [u * 2 - 1, v],
    );
  }

  mb.surface(
    6,
    Math.max(16, Math.round(32 * o.detail)),
    tube(stem, (t) => o.size * (0.0105 - 0.0045 * t), side),
    (_u, v) => ({
      color: mix(STEM_LOW, STEM_HIGH, v),
      material: MATERIAL.stem,
      sway: stemSway(v),
      phase,
    }),
  );

  // Flowers: open bells shrinking toward the tip, then a couple of buds.
  const open = 6 + Math.floor(rand() * 3);
  const total = open + 2;
  const blush = rand() < 0.45 ? 0.35 + rand() * 0.5 : 0;
  const bellU = Math.max(12, Math.round(30 * o.detail));
  const bellV = Math.max(7, Math.round(14 * o.detail));

  for (let i = 0; i < total; i++) {
    const k = i / (total - 1);
    const t = 0.42 + 0.55 * k;
    const attach = stem(t);
    const attachSway = stemSway(t);
    const isBud = i >= open;
    const swingPhase = rand();

    const jitter = (i % 2 === 0 ? 1 : -1) * (0.2 + rand() * 0.3);
    const out = normalize(rotateY(side, jitter));
    const reach = o.size * (0.085 - 0.03 * k);
    const pedicel = bezier([
      attach,
      add(attach, add(scale(out, reach * 0.45), scale(UP, reach * 0.15))),
      add(attach, scale(out, reach * 0.9)),
      add(attach, add(scale(out, reach), scale(UP, -reach * 0.45))),
    ]);
    const top = pedicel(1);
    const swinging = {
      phase: swingPhase,
      pivot: attach,
      pivotSway: attachSway,
      sway: attachSway,
      swing: 1,
    };

    mb.surface(
      4,
      8,
      tube(pedicel, () => o.size * 0.0035, cross(out, UP)),
      () => ({ ...swinging, color: PEDICEL, material: MATERIAL.stem }),
    );

    const axis = normalize(
      add(add(scale(UP, -1), scale(out, 0.18)), [
        (rand() - 0.5) * 0.12,
        0,
        (rand() - 0.5) * 0.12,
      ]),
    );
    const e1 = normalize(cross(axis, out));
    const e2 = cross(axis, e1);
    const spin = rand() * Math.PI * 2;
    // Outward from the bell's axis; the top pole points up the pedicel.
    const radial = (u: number, v: number): Vec3 => {
      const a = u * Math.PI * 2;
      const ring = add(scale(e1, Math.cos(a)), scale(e2, Math.sin(a)));
      return v < 0.05 ? scale(axis, -1) : ring;
    };

    if (isBud) {
      const r = o.size * lerp(0.022, 0.016, i - open);
      mb.surface(
        Math.max(8, Math.round(14 * o.detail)),
        8,
        (u, v) => {
          const a = u * Math.PI * 2;
          const radius = r * Math.sin(Math.PI * v) ** 0.85;
          const depth = r * 1.3 * (1 - Math.cos(Math.PI * v));
          return add(
            add(top, scale(axis, depth)),
            scale(add(scale(e1, Math.cos(a)), scale(e2, Math.sin(a))), radius),
          );
        },
        (_u, v) => ({
          ...swinging,
          color: mix(BUD_GREEN, BELL_WHITE, 0.25 + 0.35 * v),
          material: MATERIAL.bell,
        }),
        undefined,
        (u, v) => add(radial(u, 0.5), scale(axis, (v - 0.5) * 2)),
      );
      continue;
    }

    const r = o.size * lerp(0.042, 0.027, i / Math.max(open - 1, 1));
    mb.surface(
      bellU,
      bellV,
      (u, v) => {
        const a = u * Math.PI * 2;
        const [radius, depth] = bellProfile(v, a + spin, r);
        return add(
          add(top, scale(axis, depth)),
          scale(add(scale(e1, Math.cos(a)), scale(e2, Math.sin(a))), radius),
        );
      },
      (u, v) => {
        const lobe = (0.5 + 0.5 * Math.cos(6 * (u * Math.PI * 2 + spin))) ** 2;
        const flare = clamp((v - 0.8) / 0.2, 0, 1) ** 2;
        return {
          ...swinging,
          color: mix(
            mix(BELL_GREEN, BELL_WHITE, smoothstep(0, 0.3, v)),
            BLUSH,
            flare * (0.4 + 0.6 * lobe) * blush,
          ),
          material: MATERIAL.bell,
        };
      },
      undefined,
      radial,
    );
  }
}

function addGrass(
  mb: MeshBuilder,
  rand: () => number,
  x: number,
  z: number,
  height: number,
) {
  const psi = rand() * Math.PI * 2;
  const dir: Vec3 = [Math.cos(psi), 0, Math.sin(psi)];
  const perp: Vec3 = [-dir[2], 0, dir[0]];
  const width = 0.006 + rand() * 0.007;
  const lean = 0.2 + rand() * 0.35;
  const phase = rand();
  const shade = rand();
  const low = mix([0.34, 0.5, 0.3], [0.46, 0.6, 0.38], shade);
  const high = mix([0.66, 0.78, 0.48], [0.8, 0.85, 0.62], shade);
  mb.surface(
    1,
    4,
    (u, v) =>
      add(
        [x, 0, z],
        add(
          add(
            scale(UP, height * v * (1 - 0.15 * v)),
            scale(dir, height * lean * v * v),
          ),
          scale(perp, (u * 2 - 1) * width * (1 - v ** 1.5)),
        ),
      ),
    (_u, v) => ({
      color: mix(low, high, v),
      material: MATERIAL.grass,
      sway: height * 1.5 * v * v,
      phase,
      flutter: v,
    }),
  );
}

export interface LilyScene {
  vertices: Float32Array<ArrayBuffer>;
  indices: Uint32Array<ArrayBuffer>;
}

/** Builds the whole meadow. `camera` is the resting eye position. */
export function buildLilyScene(camera: Vec3): LilyScene {
  const rand = mulberry32(0x1117);
  const mb = new MeshBuilder();

  mb.surface(
    1,
    1,
    (u, v) => [-14 + 28 * u, 0, 3.2 - 18 * v],
    () => ({
      color: [0.66, 0.75, 0.56],
      material: MATERIAL.ground,
      sway: 0,
      phase: 0,
    }),
  );

  // Foreground clump the camera is framed around.
  const hero: Array<[number, number]> = [
    [-1.2, -0.45],
    [-0.72, 0.12],
    [-0.22, -0.55],
    [0.24, 0.2],
    [0.7, -0.35],
    [1.12, 0.05],
    [-0.02, -1.05],
  ];
  for (const [x, z] of hero) {
    addPlant(mb, rand, {
      x: x + (rand() - 0.5) * 0.12,
      z: z + (rand() - 0.5) * 0.12,
      size: 0.95 + rand() * 0.15,
      camera,
      detail: 1,
    });
  }

  // A looser drift of plants receding into the haze.
  for (let i = 0; i < 18; i++) {
    const z = -1.6 - rand() * 3.4;
    const spread = 1.6 + -z * 0.7;
    addPlant(mb, rand, {
      x: (rand() * 2 - 1) * spread,
      z,
      size: 0.85 + rand() * 0.2,
      camera,
      detail: 0.55,
    });
  }

  for (let i = 0; i < 1800; i++) {
    const z = 1.4 - rand() * 8.2;
    const x = (rand() * 2 - 1) * (2.2 + Math.max(0, -z) * 0.9);
    const near = smoothstep(0.2, 1.3, z);
    const height = lerp(0.1 + rand() * 0.26, 0.04 + rand() * 0.07, near);
    addGrass(mb, rand, x, z, height);
  }

  return mb.finish();
}
