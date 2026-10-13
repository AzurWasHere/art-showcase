/**
 * WGSL for the AURA hero: a watercolour paintbrush simulated on the GPU.
 *
 * Two stages share one uniform block:
 *  1. `simulateShader`  – compute pass over a half-resolution "sheet" texture.
 *     Channels: r = pink pigment, g = blue pigment, b = water. Water spreads and
 *     evaporates; pigment diffuses and drifts only while wet (wet-in-wet blooms)
 *     and concentrates where water is drying (edge darkening). Brushes deposit
 *     ragged, bristled splats along the segment they moved this frame.
 *  2. `compositeShader` – fullscreen pass: paper texture × pigment absorption
 *     (Kubelka-Munk-ish exponential), granulation, rim darkening, wet sheen.
 */

export const BRUSH_COUNT = 2;
export const UNIFORM_FLOATS = 8 + BRUSH_COUNT * 8; // 96 bytes

export const commonWGSL = /* wgsl */ `
struct Brush {
  prev     : vec2<f32>,   // world space, y down
  cur      : vec2<f32>,
  radius   : f32,
  hue      : f32,         // 0 = pink, 1 = blue, 0.5 = lavender (both)
  strength : f32,         // 0 disables the brush
  pad      : f32,
};

struct Uniforms {
  resolution : vec2<f32>,   // canvas pixels
  simSize    : vec2<f32>,   // sheet texels
  time       : f32,
  dt         : f32,
  seed       : f32,
  intensity  : f32,         // 0 for reduced motion
  brushes    : array<Brush, ${BRUSH_COUNT}>,
};
@group(0) @binding(0) var<uniform> u : Uniforms;

fn hash21(p : vec2<f32>) -> f32 {
  var q = fract(p * vec2<f32>(123.34, 456.21));
  q = q + dot(q, q + 45.32);
  return fract(q.x * q.y);
}

fn noise(p : vec2<f32>) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let s = f * f * (3.0 - 2.0 * f);
  let a = hash21(i);
  let b = hash21(i + vec2<f32>(1.0, 0.0));
  let c = hash21(i + vec2<f32>(0.0, 1.0));
  let d = hash21(i + vec2<f32>(1.0, 1.0));
  return mix(mix(a, b, s.x), mix(c, d, s.x), s.y);
}

fn fbm(p0 : vec2<f32>) -> f32 {
  var p = p0;
  var v = 0.0;
  var amp = 0.5;
  let rot = mat2x2<f32>(0.8, 0.6, -0.6, 0.8);
  for (var i = 0; i < 4; i = i + 1) {
    v = v + amp * noise(p);
    p = rot * p * 2.03 + vec2<f32>(1.7, 9.2);
    amp = amp * 0.5;
  }
  return v;
}

// Divergence-free flow used to let wet pigment wander.
fn curl(p : vec2<f32>, t : f32) -> vec2<f32> {
  let e = 0.1;
  let n1 = fbm(p + vec2<f32>(0.0, e) + t);
  let n2 = fbm(p - vec2<f32>(0.0, e) + t);
  let n3 = fbm(p + vec2<f32>(e, 0.0) + t);
  let n4 = fbm(p - vec2<f32>(e, 0.0) + t);
  return vec2<f32>(n1 - n2, -(n3 - n4)) / (2.0 * e);
}

const BLUSH = vec3<f32>(0.975, 0.72, 0.85);
const SKY   = vec3<f32>(0.72, 0.86, 0.975);
`;

export const simulateShader = /* wgsl */ `
${commonWGSL}

@group(0) @binding(1) var prevTex : texture_2d<f32>;
@group(0) @binding(2) var nextTex : texture_storage_2d<rgba16float, write>;
@group(0) @binding(3) var linearSamp : sampler;

fn load(p : vec2<i32>) -> vec4<f32> {
  let size = vec2<i32>(u.simSize);
  let q = clamp(p, vec2<i32>(0, 0), size - vec2<i32>(1, 1));
  return textureLoad(prevTex, q, 0);
}

fn segmentDistance(p : vec2<f32>, a : vec2<f32>, b : vec2<f32>) -> f32 {
  let ab = b - a;
  let ap = p - a;
  let t = clamp(dot(ap, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
  return length(ap - ab * t);
}

@compute @workgroup_size(8, 8)
fn cs_main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let size = vec2<u32>(u.simSize);
  if (gid.x >= size.x || gid.y >= size.y) { return; }

  let p = vec2<i32>(gid.xy);
  let uv = (vec2<f32>(gid.xy) + 0.5) / u.simSize;
  let aspect = u.simSize.x / u.simSize.y;
  let world = vec2<f32>((uv.x - 0.5) * aspect, uv.y - 0.5);

  let c = load(p);
  let n = load(p + vec2<i32>(0, -1));
  let s = load(p + vec2<i32>(0, 1));
  let e = load(p + vec2<i32>(1, 0));
  let w = load(p + vec2<i32>(-1, 0));
  let lap = n + s + e + w - 4.0 * c;

  let dt = clamp(u.dt, 0.0, 0.05);
  let texel = 1.0 / u.simSize;

  // Water spreads through the paper and evaporates.
  var wet = c.b + lap.b * 0.22;
  wet = wet * (1.0 - 0.5 * dt);

  // Pigment bleeds outward only while the sheet is wet (soft feathered edges).
  let o = texel * 1.5;
  let bleed = (textureSampleLevel(prevTex, linearSamp, uv + vec2<f32>(o.x, 0.0), 0.0).rg
             + textureSampleLevel(prevTex, linearSamp, uv - vec2<f32>(o.x, 0.0), 0.0).rg
             + textureSampleLevel(prevTex, linearSamp, uv + vec2<f32>(0.0, o.y), 0.0).rg
             + textureSampleLevel(prevTex, linearSamp, uv - vec2<f32>(0.0, o.y), 0.0).rg) * 0.25;
  var pig = mix(c.rg, bleed, min(c.b * 0.2, 0.2));

  // Wet pigment also wanders with a slow flow (wet-in-wet blooms).
  let flow = curl(world * 2.4 + u.seed, u.time * 0.07) * (0.8 * c.b) * texel;
  let carried = textureSampleLevel(prevTex, linearSamp, uv - flow, 0.0).rg;
  pig = mix(pig, carried, 0.4 * c.b);

  // Pigment gathers where water is leaving fastest: the darker watercolour rim.
  let gradWet = vec2<f32>(e.b - w.b, s.b - n.b);
  pig = pig * (1.0 + min(length(gradWet) * 0.6, 0.3) * dt * 3.0);

  // Old washes fade very slowly so the sheet never clogs.
  pig = pig * (1.0 - 0.02 * dt);

  for (var i = 0; i < ${BRUSH_COUNT}; i = i + 1) {
    let b = u.brushes[i];
    if (b.strength <= 0.0005) { continue; }
    let d = segmentDistance(world, b.prev, b.cur);
    let ragged = 0.72 + 0.45 * fbm(world * 13.0 + vec2<f32>(u.seed, b.hue * 10.0));
    let r = b.radius * ragged;
    let edge = smoothstep(r, r * 0.15, d);
    let bristle = 0.55 + 0.45 * noise(world * 75.0 + u.time * 0.6);
    let splat = edge * bristle * b.strength * min(dt * 12.0, 1.0);

    let pink = 1.0 - smoothstep(0.35, 0.75, b.hue);
    let blue = smoothstep(0.25, 0.65, b.hue);
    // Paint stops pooling once the sheet is saturated.
    let room = max(0.0, 1.0 - (c.r + c.g) / 0.95);
    pig = pig + vec2<f32>(pink, blue) * splat * room;
    wet = wet + splat * 2.0;
  }

  pig = clamp(pig, vec2<f32>(0.0, 0.0), vec2<f32>(1.2, 1.2));
  wet = clamp(wet, 0.0, 1.0);
  textureStore(nextTex, p, vec4<f32>(pig, wet, 1.0));
}
`;

export const compositeShader = /* wgsl */ `
${commonWGSL}

@group(0) @binding(1) var sheetTex : texture_2d<f32>;
@group(0) @binding(2) var linearSamp : sampler;

// Absorption per unit of pigment (white × exp(-k·density)); tuned so a
// typical stroke (density ≈ 0.35) lands on the brand pastel pink / blue.
const PINK_K = vec3<f32>(0.09, 0.98, 0.50);
const BLUE_K = vec3<f32>(0.98, 0.46, 0.12);

struct VSOut {
  @builtin(position) position : vec4<f32>,
  @location(0) uv : vec2<f32>,
};

@vertex
fn vs_main(@builtin(vertex_index) i : u32) -> VSOut {
  var pos = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0), vec2<f32>(3.0, -1.0), vec2<f32>(-1.0, 3.0));
  var out : VSOut;
  out.position = vec4<f32>(pos[i], 0.0, 1.0);
  out.uv = pos[i] * 0.5 + vec2<f32>(0.5, 0.5);
  return out;
}

@fragment
fn fs_main(in : VSOut) -> @location(0) vec4<f32> {
  let uv = in.uv;                                  // y up
  let sheetUv = vec2<f32>(uv.x, 1.0 - uv.y);       // texture space, y down
  let aspect = u.resolution.x / max(u.resolution.y, 1.0);
  let world = vec2<f32>((uv.x - 0.5) * aspect, uv.y - 0.5);
  let px = uv * u.resolution;

  let sheet = textureSample(sheetTex, linearSamp, sheetUv);

  // Cold-pressed paper: tooth, fibres, a faint pastel wash so it is never plain.
  let fibres = (noise(px * 0.55) - 0.5) * 0.035 + (noise(px * 0.11 + 7.3) - 0.5) * 0.03;
  let tooth = 0.965 + 0.035 * fbm(px * 0.015);
  var paper = vec3<f32>(0.997, 0.99, 0.986) * tooth + fibres;
  let washField = fbm(world * 1.2 + u.time * 0.012 + u.seed);
  let washTint = mix(BLUSH, SKY, smoothstep(0.35, 0.65, washField));
  let washAmount = 0.16 * smoothstep(0.25, 0.8, fbm(world * 0.8 - u.time * 0.008 + 3.1));
  paper = mix(paper, washTint, washAmount);

  // Granulation: pigment settles into the paper tooth unevenly.
  let grain = fbm(px * 0.08 + u.seed);
  let densityPink = sheet.r * (0.8 + 0.45 * grain);
  let densityBlue = sheet.g * (0.8 + 0.45 * (1.0 - grain));

  // Rim darkening where density changes quickly.
  let density = sheet.r + sheet.g;
  let rim = length(vec2<f32>(dpdx(density), dpdy(density))) * 3.5;
  let darken = 1.0 + clamp(rim, 0.0, 0.4);

  var col = paper * exp(-densityPink * PINK_K * darken) * exp(-densityBlue * BLUE_K * darken);

  // A hint of gloss while the paint is still wet.
  col = col + sheet.b * 0.035 * vec3<f32>(1.0, 0.97, 1.0);

  // Keep the lower edge airy for the copy and cards that follow.
  col = mix(vec3<f32>(1.0, 1.0, 1.0), col, smoothstep(0.0, 0.2, uv.y));

  let vignette = smoothstep(1.5, 0.45, length((uv - 0.5) * vec2<f32>(aspect, 1.0)));
  col = mix(col * 0.95, col, vignette);
  col = col + (hash21(px + fract(u.time) * 10.0) - 0.5) * 0.02;

  return vec4<f32>(col, 1.0);
}
`;
