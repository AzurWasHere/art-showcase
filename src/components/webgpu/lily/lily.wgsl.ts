/**
 * WGSL for the lily-of-the-valley scene. One module, three passes:
 *  - vs_sky / fs_sky: pastel dawn sky with a low sun, cloud wisps and bokeh
 *  - vs_mesh / fs_mesh: wind-bent plants, grass and ground, fogged into the sky
 *  - vs_particle / fs_particle: pollen motes drifting on the breeze
 * Uniform layout must match lily-engine.ts (UNIFORM_FLOATS).
 */

export const UNIFORM_FLOATS = 40;

/** Direction toward the sun; mirrored in lily-engine.ts for screen projection. */
export const SUN_DIR: [number, number, number] = [0.32, 0.12, -0.94];

const common = /* wgsl */ `
struct Uniforms {
  viewProj: mat4x4f,
  camPos: vec3f,
  time: f32,
  wind: vec4f,      // dir.xz, base strength, pointer gust (signed, along x)
  res: vec4f,       // width, height, aspect, motion (0 when reduced)
  camRight: vec4f,
  camUp: vec4f,
  sun: vec4f,       // sun position in screen uv
};
@group(0) @binding(0) var<uniform> U: Uniforms;

const PI = 3.14159265;
const SUN_DIR = vec3f(${SUN_DIR.join(", ")});
const FILL_DIR = vec3f(-0.45, 0.8, 0.55);
const BEND = 0.16;

fn hash11(n: f32) -> f32 { return fract(sin(n * 127.1) * 43758.5453); }
fn hash21(p: vec2f) -> f32 { return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453); }

fn noise2(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  let a = hash21(i);
  let b = hash21(i + vec2f(1.0, 0.0));
  let c = hash21(i + vec2f(0.0, 1.0));
  let d = hash21(i + vec2f(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

fn fbm(p0: vec2f) -> f32 {
  var p = p0;
  var amp = 0.5;
  var sum = 0.0;
  for (var i = 0; i < 5; i++) {
    sum += amp * noise2(p);
    p = p * 2.03 + vec2f(1.7, 9.2);
    amp *= 0.5;
  }
  return sum;
}

fn toLinear(c: vec3f) -> vec3f { return pow(c, vec3f(2.2)); }

// Linear up to 0.8, then a soft shoulder so glows never clip harshly.
fn toDisplay(c: vec3f) -> vec3f {
  let over = max(c - vec3f(0.8), vec3f(0.0));
  let shaped = min(c, vec3f(0.8)) + 0.2 * (vec3f(1.0) - exp(-over / 0.2));
  return pow(shaped, vec3f(1.0 / 2.2));
}

fn sky(uv: vec2f) -> vec3f {
  let t = U.time;
  let aspect = U.res.z;
  let top = toLinear(vec3f(0.69, 0.81, 0.96));
  let mid = toLinear(vec3f(0.96, 0.94, 0.98));
  let low = toLinear(vec3f(0.99, 0.83, 0.89));
  var c = mix(top, mid, smoothstep(0.0, 0.5, uv.y));
  c = mix(c, low, smoothstep(0.42, 0.9, uv.y));

  // High cloud wisps drifting slowly.
  let q = vec2f(uv.x * aspect, uv.y) * vec2f(1.6, 3.2) + vec2f(t * 0.012, 0.0);
  let cloud = smoothstep(0.5, 0.85, fbm(q + fbm(q * 0.5 + vec2f(t * 0.005))));
  c = mix(c, vec3f(1.0, 0.99, 1.0), cloud * 0.45 * (1.0 - smoothstep(0.15, 0.6, uv.y)));

  // Low sun behind the flowers, with faint rays.
  let dv = (uv - U.sun.xy) * vec2f(aspect, 1.0);
  let d = length(dv);
  let glow = toLinear(vec3f(1.0, 0.9, 0.82));
  c += glow * (exp(-d * d * 90.0) * 0.9 + exp(-d * 3.5) * 0.28);
  let ang = atan2(dv.y, dv.x);
  let rays = pow(0.5 + 0.5 * sin(ang * 9.0 + sin(ang * 4.0 + t * 0.06) * 2.0), 4.0);
  c += glow * rays * exp(-d * 2.4) * 0.09 * smoothstep(0.02, 0.15, d);

  // Out-of-focus highlights drifting with the breeze.
  for (var i = 0; i < 16; i++) {
    let fi = f32(i);
    let h1 = hash11(fi * 3.17 + 0.5);
    let h2 = hash11(fi * 7.31 + 1.7);
    let h3 = hash11(fi * 1.93 + 4.1);
    let bx = fract(h1 + t * (0.003 + h3 * 0.006)) * 1.4 - 0.2;
    let by = 0.1 + h2 * 0.65 + sin(t * 0.21 + fi * 1.3) * 0.015;
    let r = 0.02 + h3 * 0.06;
    let bd = length((uv - vec2f(bx, by)) * vec2f(aspect, 1.0));
    let disc = smoothstep(r, r * 0.8, bd);
    let ring = disc * smoothstep(r * 0.55, r * 0.95, bd);
    var tint = vec3f(1.0, 0.98, 0.99);
    if (h1 > 0.66) {
      tint = toLinear(vec3f(0.98, 0.8, 0.9));
    } else if (h1 > 0.33) {
      tint = toLinear(vec3f(0.82, 0.9, 1.0));
    }
    c = mix(c, tint * 1.05, (disc * 0.22 + ring * 0.12) * (0.4 + 0.6 * h2));
  }
  return c;
}

// Breeze at a point: travelling gust waves, a pointer gust and some flutter.
fn windAt(p: vec3f, phase: f32) -> vec3f {
  let t = U.time;
  let dir = U.wind.xy;
  let wave = 0.5 + 0.5 * sin(dot(p.xz, dir) * 1.3 - t * 1.6);
  let swell = 0.6 + 0.4 * sin(t * 0.43 + p.x * 0.2);
  let strength = U.wind.z * (0.35 + 0.65 * wave * swell);
  let flutter = sin(t * 3.7 + phase * 6.283 + p.y * 4.0) * 0.16
    + sin(t * 5.3 + phase * 11.0) * 0.07;
  let side = vec2f(-dir.y, dir.x);
  let w = dir * strength + side * flutter * (0.3 + strength) * U.res.w
    + vec2f(U.wind.w, 0.0);
  return vec3f(w.x, 0.0, w.y);
}

fn rotateAxis(v: vec3f, k: vec3f, a: f32) -> vec3f {
  let c = cos(a);
  let s = sin(a);
  return v * c + cross(k, v) * s + k * dot(k, v) * (1.0 - c);
}
`;

const skyPass = /* wgsl */ `
struct SkyOut {
  @builtin(position) pos: vec4f,
};

@vertex
fn vs_sky(@builtin(vertex_index) vi: u32) -> SkyOut {
  var corners = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  var out: SkyOut;
  out.pos = vec4f(corners[vi], 0.0, 1.0);
  return out;
}

@fragment
fn fs_sky(in: SkyOut) -> @location(0) vec4f {
  let uv = in.pos.xy / U.res.xy;
  let dither = (hash21(in.pos.xy) - 0.5) / 255.0;
  return vec4f(toDisplay(sky(uv)) + vec3f(dither), 1.0);
}
`;

const meshPass = /* wgsl */ `
struct MeshIn {
  @location(0) pos: vec3f,
  @location(1) normal: vec3f,
  @location(2) color: vec3f,
  @location(3) uv: vec2f,
  @location(4) params: vec3f,   // material, sway, phase
  @location(5) pivot: vec3f,
  @location(6) extra: vec3f,    // pivotSway, swing, flutter
};

struct MeshOut {
  @builtin(position) clip: vec4f,
  @location(0) world: vec3f,
  @location(1) normal: vec3f,
  @location(2) color: vec3f,
  @location(3) uv: vec2f,
  @location(4) @interpolate(flat) material: f32,
};

@vertex
fn vs_mesh(in: MeshIn) -> MeshOut {
  let phase = in.params.z;
  var p = in.pos;
  var n = in.normal;
  let swing = in.extra.y;

  if (swing > 0.0) {
    // Bells and their pedicels swing like pendulums downwind, then ride the
    // stem's bend at the attachment point.
    let w = windAt(in.pivot, phase);
    let wl = length(w);
    let wdir = select(vec3f(1.0, 0.0, 0.0), w / max(wl, 1e-4), wl > 1e-4);
    let axis = normalize(cross(wdir, vec3f(0.0, 1.0, 0.0)));
    let wobble = sin(U.time * 2.3 + phase * 17.0 + in.pivot.x * 9.0) * 0.12 * (0.5 + wl) * U.res.w;
    let ang = swing * (wl * 0.55 + wobble);
    p = in.pivot + rotateAxis(p - in.pivot, axis, ang);
    n = rotateAxis(n, axis, ang);
    let d = w * in.extra.x * BEND;
    p += d;
    p.y -= dot(d, d) / (2.0 * max(in.pivot.y, 0.1));
  } else {
    let w = windAt(in.pos, phase);
    let d = w * in.params.y * BEND;
    p += d;
    p.y -= dot(d, d) / (2.0 * max(in.pos.y, 0.1));
    p.y += sin(U.time * 4.3 + phase * 9.0 + in.uv.y * 3.0) * 0.008 * in.extra.z * length(w) * U.res.w;
  }

  var out: MeshOut;
  out.clip = U.viewProj * vec4f(p, 1.0);
  out.world = p;
  out.normal = n;
  out.color = in.color;
  out.uv = in.uv;
  out.material = in.params.x;
  return out;
}

@fragment
fn fs_mesh(in: MeshOut) -> @location(0) vec4f {
  let V = normalize(U.camPos - in.world);
  var N = normalize(in.normal);
  // Bell normals point outward, so a back-facing one means we see the throat.
  let inside = dot(N, V) < 0.0;
  if (inside) {
    N = -N;
  }
  let L = normalize(SUN_DIR);
  let F = normalize(FILL_DIR);
  let H = normalize(L + V);
  let back = max(dot(-V, L), 0.0);
  let skyAmb = toLinear(vec3f(0.8, 0.86, 0.98));
  let sun = toLinear(vec3f(1.0, 0.9, 0.82)) * 1.6;
  let base = toLinear(in.color);
  let ao = mix(0.5, 1.0, smoothstep(0.0, 0.45, in.world.y));
  let hemi = 0.6 + 0.4 * N.y;
  let m = in.material;

  var col: vec3f;
  if (m < 0.5) {
    // Stems and pedicels.
    let diff = max(dot(N, L) * 0.5 + 0.5, 0.0);
    col = base * (skyAmb * hemi * 0.75 * ao + sun * diff * 0.4)
      + base * sun * pow(back, 6.0) * 0.35;
  } else if (m < 1.5) {
    // Bells: waxy, translucent, glowing when the sun is behind them.
    let wrap = max(dot(N, F) * 0.5 + 0.5, 0.0);
    let trans = pow(back, 5.0) * 1.2 + pow(back, 1.5) * 0.2;
    let rim = pow(1.0 - max(dot(N, V), 0.0), 2.5);
    let throat = select(1.0, 0.55, inside);
    let tint = select(base, base * vec3f(0.86, 0.95, 0.8), inside);
    let shade = 0.32 + 0.38 * wrap + 0.12 * N.y;
    col = tint * throat * (skyAmb * shade * mix(0.7, 1.0, ao) + sun * max(dot(N, L), 0.0) * 0.3)
      + tint * sun * trans * 0.45
      + mix(skyAmb, sun, 0.5) * rim * 0.22 * throat
      + sun * pow(max(dot(N, H), 0.0), 70.0) * 0.3 * throat;
  } else if (m < 2.5) {
    // Leaves: parallel veins, a midrib, sheen and backlit translucency.
    let vein = 1.0 - 0.16 * smoothstep(0.75, 1.0, abs(sin(in.uv.x * PI * 6.0)));
    let rib = 1.0 + 0.18 * (1.0 - smoothstep(0.0, 0.06, abs(in.uv.x)));
    let alb = base * vein * rib;
    let diff = max(dot(N, L), 0.0) * 0.6 + max(dot(N, F), 0.0) * 0.4;
    let trans = pow(back, 3.0) * 0.9;
    col = alb * (skyAmb * hemi * 0.55 * ao + sun * diff * 0.5)
      + alb * vec3f(1.0, 1.1, 0.6) * sun * trans * 0.45
      + sun * pow(max(dot(N, H), 0.0), 40.0) * 0.16;
  } else if (m < 3.5) {
    // Grass.
    let diff = max(dot(N, L), 0.0) * 0.5 + max(dot(N, F), 0.0) * 0.5;
    col = base * (skyAmb * hemi * 0.6 * ao + sun * diff * 0.45)
      + base * vec3f(1.0, 1.1, 0.6) * sun * pow(back, 3.0) * 0.4 * in.uv.y;
  } else {
    // Ground: soft mossy noise; the fog does most of the work.
    let g = fbm(in.world.xz * 3.0);
    col = base * (0.75 + 0.45 * g) * (skyAmb * 0.6 + sun * 0.22);
  }

  let dist = length(in.world - U.camPos);
  let fog = 1.0 - exp(-pow(max(dist - 2.9, 0.0) * 0.45, 1.6));
  if (fog > 0.002) {
    // Lift the mid-range so green fading into pink reads as bright haze
    // rather than a muddy grey band.
    let haze = sky(in.clip.xy / U.res.xy);
    col = mix(col, haze, fog) + haze * fog * (1.0 - fog) * 0.35;
  }
  return vec4f(toDisplay(col), 1.0);
}
`;

const particlePass = /* wgsl */ `
struct ParticleOut {
  @builtin(position) clip: vec4f,
  @location(0) corner: vec2f,
  @location(1) color: vec4f,
};

@vertex
fn vs_particle(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> ParticleOut {
  var corners = array<vec2f, 6>(
    vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(-1.0, 1.0),
    vec2f(-1.0, 1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0),
  );
  let c = corners[vi];
  let fi = f32(ii);
  let h = vec3f(hash11(fi * 1.31 + 0.1), hash11(fi * 2.77 + 3.3), hash11(fi * 5.13 + 7.7));
  let t = U.time;
  let drift = vec3f(U.wind.x, 0.0, U.wind.y) * t * (0.04 + h.y * 0.1) * (0.6 + U.wind.z * 0.5);
  var p = vec3f(-3.5 + h.x * 7.0, 0.05 + h.y * 1.4, -4.0 + h.z * 5.6) + drift;
  p.x = fract((p.x + 3.5) / 7.0) * 7.0 - 3.5;
  p.z = fract((p.z + 4.0) / 5.6) * 5.6 - 4.0;
  p.y += sin(t * 0.6 + fi) * 0.05;
  p.x += sin(t * 0.9 + fi * 1.7) * 0.04;

  let size = 0.004 + h.z * h.z * 0.012;
  let world = p + (U.camRight.xyz * c.x + U.camUp.xyz * c.y) * size;

  let dist = length(p - U.camPos);
  let fade = smoothstep(0.4, 0.9, dist) * (1.0 - smoothstep(4.0, 7.0, dist));
  let twinkle = 0.55 + 0.45 * sin(t * 2.0 + fi * 3.1);
  var tint = vec3f(1.0, 0.97, 0.9);
  if (h.x > 0.6) {
    tint = vec3f(1.0, 0.86, 0.92);
  }

  var out: ParticleOut;
  out.clip = U.viewProj * vec4f(world, 1.0);
  out.corner = c;
  out.color = vec4f(tint, twinkle * fade * 0.85);
  return out;
}

@fragment
fn fs_particle(in: ParticleOut) -> @location(0) vec4f {
  let d = length(in.corner);
  let a = exp(-d * d * 4.0) * (1.0 - smoothstep(0.8, 1.0, d)) * in.color.a;
  return vec4f(in.color.rgb * a, a);
}
`;

export const lilyShader = common + skyPass + meshPass + particlePass;
