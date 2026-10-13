/**
 * WebGPU engine for the hero watercolour sheet. Framework-agnostic: hand it a
 * canvas and its host element, get back a stop function. Reports readiness /
 * fallback via callbacks so the React wrapper can cross-fade from CSS.
 */
import {
  compositeShader,
  simulateShader,
  UNIFORM_FLOATS,
} from "./watercolor.wgsl";

export type StopWatercolor = () => void;

export interface WatercolorCallbacks {
  onReady: () => void;
  onFallback: (reason: string) => void;
}

const SIM_SCALE = 0.5; // sheet resolution relative to the canvas
const WORKGROUP = 8;
const WARMUP_SECONDS = 2.2;

/** Which GPUDevice currently has a given canvas configured. */
const contextOwners = new WeakMap<HTMLCanvasElement, GPUDevice>();

type Brush = {
  prevX: number;
  prevY: number;
  x: number;
  y: number;
  radius: number;
  hue: number;
  strength: number;
};

function supportsWebGPU(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "gpu" in navigator &&
    Boolean(navigator.gpu)
  );
}

async function compile(device: GPUDevice, code: string, label: string) {
  const module = device.createShaderModule({ code, label });
  const info = await module.getCompilationInfo();
  const errors = info.messages.filter((m) => m.type === "error");
  if (errors.length > 0) {
    const detail = errors
      .map((m) => `${label}:${m.lineNum}:${m.linePos} ${m.message}`)
      .join("\n");
    throw new Error(`WGSL compile failed\n${detail}`);
  }
  return module;
}

export async function startWatercolor(
  canvas: HTMLCanvasElement,
  host: HTMLElement,
  callbacks: WatercolorCallbacks,
): Promise<StopWatercolor | null> {
  if (!supportsWebGPU()) {
    callbacks.onFallback("WebGPU is not available in this browser");
    return null;
  }

  let device: GPUDevice;
  let context: GPUCanvasContext;
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error("No compatible GPU adapter");
    device = await adapter.requestDevice();
    const ctx = canvas.getContext("webgpu");
    if (!ctx) throw new Error("Could not create a WebGPU canvas context");
    context = ctx;
  } catch (error) {
    callbacks.onFallback(
      error instanceof Error ? error.message : "WebGPU init failed",
    );
    return null;
  }

  const format = navigator.gpu.getPreferredCanvasFormat();
  // React Strict Mode mounts twice; the canvas context is shared, so track
  // which device last configured it and re-configure before drawing if needed.
  const configureContext = () => {
    if (contextOwners.get(canvas) !== device) {
      context.configure({ device, format, alphaMode: "opaque" });
      contextOwners.set(canvas, device);
    }
  };
  configureContext();

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const dprCap = coarsePointer ? 1.25 : 1.75;

  // ---------------------------------------------------------------- uniforms
  const uniformData = new Float32Array(UNIFORM_FLOATS);
  const uniformBuffer = device.createBuffer({
    label: "watercolor-uniforms",
    size: uniformData.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const sampler = device.createSampler({
    label: "watercolor-sampler",
    magFilter: "linear",
    minFilter: "linear",
    addressModeU: "clamp-to-edge",
    addressModeV: "clamp-to-edge",
  });

  // -------------------------------------------------------------- pipelines
  let simulatePipeline: GPUComputePipeline;
  let compositePipeline: GPURenderPipeline;
  let simulateLayout: GPUBindGroupLayout;
  let compositeLayout: GPUBindGroupLayout;

  try {
    const [simModule, compModule] = await Promise.all([
      compile(device, simulateShader, "watercolor-simulate"),
      compile(device, compositeShader, "watercolor-composite"),
    ]);

    simulateLayout = device.createBindGroupLayout({
      label: "watercolor-simulate-layout",
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "uniform" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          texture: { sampleType: "float" },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          storageTexture: { access: "write-only", format: "rgba16float" },
        },
        {
          binding: 3,
          visibility: GPUShaderStage.COMPUTE,
          sampler: { type: "filtering" },
        },
      ],
    });
    compositeLayout = device.createBindGroupLayout({
      label: "watercolor-composite-layout",
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: "float" },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: "filtering" },
        },
      ],
    });

    [simulatePipeline, compositePipeline] = await Promise.all([
      device.createComputePipelineAsync({
        label: "watercolor-simulate",
        layout: device.createPipelineLayout({
          bindGroupLayouts: [simulateLayout],
        }),
        compute: { module: simModule, entryPoint: "cs_main" },
      }),
      device.createRenderPipelineAsync({
        label: "watercolor-composite",
        layout: device.createPipelineLayout({
          bindGroupLayouts: [compositeLayout],
        }),
        vertex: { module: compModule, entryPoint: "vs_main" },
        fragment: {
          module: compModule,
          entryPoint: "fs_main",
          targets: [{ format }],
        },
        primitive: { topology: "triangle-list" },
      }),
    ]);
  } catch (error) {
    console.error("[watercolor]", error);
    device.destroy();
    callbacks.onFallback(
      error instanceof Error ? error.message : "Pipeline creation failed",
    );
    return null;
  }

  // ---------------------------------------------------------- sheet textures
  let sheets: [GPUTexture, GPUTexture] | null = null;
  let simulateGroups: GPUBindGroup[] = [];
  let compositeGroups: GPUBindGroup[] = [];
  let simWidth = 1;
  let simHeight = 1;
  let ping = 0;
  let warmupUntil = 0;

  function rebuildSheets() {
    if (sheets) for (const tex of sheets) tex.destroy();
    simWidth = Math.max(1, Math.floor(canvas.width * SIM_SCALE));
    simHeight = Math.max(1, Math.floor(canvas.height * SIM_SCALE));
    const make = (label: string) =>
      device.createTexture({
        label,
        size: [simWidth, simHeight],
        format: "rgba16float",
        usage:
          GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
      });
    sheets = [make("sheet-a"), make("sheet-b")];
    const views = [sheets[0].createView(), sheets[1].createView()];
    simulateGroups = [0, 1].map((i) =>
      device.createBindGroup({
        layout: simulateLayout,
        entries: [
          { binding: 0, resource: { buffer: uniformBuffer } },
          { binding: 1, resource: views[i] },
          { binding: 2, resource: views[1 - i] },
          { binding: 3, resource: sampler },
        ],
      }),
    );
    compositeGroups = [0, 1].map((i) =>
      device.createBindGroup({
        layout: compositeLayout,
        entries: [
          { binding: 0, resource: { buffer: uniformBuffer } },
          { binding: 1, resource: views[i] },
          { binding: 2, resource: sampler },
        ],
      }),
    );
    ping = 0;
    // A fresh sheet is blank: let the ambient brush lay a few washes quickly.
    warmupUntil = time + WARMUP_SECONDS;
  }

  // ------------------------------------------------------------ interaction
  const pointer = {
    targetX: 0.5,
    targetY: 0.5,
    x: 0.5,
    y: 0.5,
    speed: 0,
    inside: false,
    strength: 0,
    hue: 0.15,
    lastMoveAt: 0,
  };
  const ambient: Brush = {
    prevX: 0,
    prevY: 0,
    x: 0,
    y: 0,
    radius: 0.12,
    hue: 0.2,
    strength: 0,
  };
  const brush: Brush = {
    prevX: 0,
    prevY: 0,
    x: 0,
    y: 0,
    radius: 0.045,
    hue: 0.15,
    strength: 0,
  };
  const seed = Math.random() * 100;
  let visible = true;
  let stopped = false;
  let time = 0;
  let frames = 0;
  let last = performance.now();
  let raf = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    const width = Math.max(1, Math.floor(host.clientWidth * dpr));
    const height = Math.max(1, Math.floor(host.clientHeight * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      rebuildSheets();
    }
  }

  function onPointerMove(event: PointerEvent) {
    const rect = host.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (inside && !pointer.inside) {
      // New stroke: pick a fresh colour and start from the entry point so the
      // brush doesn't drag a line across the sheet from its last position.
      pointer.hue =
        Math.random() < 0.5 ? Math.random() * 0.3 : 0.7 + Math.random() * 0.3;
      pointer.x = pointer.targetX =
        (event.clientX - rect.left) / Math.max(rect.width, 1);
      pointer.y = pointer.targetY =
        (event.clientY - rect.top) / Math.max(rect.height, 1);
    }
    pointer.inside = inside;
    if (inside) {
      pointer.targetX = (event.clientX - rect.left) / Math.max(rect.width, 1);
      pointer.targetY = (event.clientY - rect.top) / Math.max(rect.height, 1);
      pointer.lastMoveAt = time;
    }
  }
  function onPointerLeave() {
    pointer.inside = false;
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resize();
  if (!sheets) rebuildSheets();

  const intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      visible = entry?.isIntersecting ?? true;
    },
    { threshold: 0.02 },
  );
  intersectionObserver.observe(host);

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("pointerleave", onPointerLeave);

  // ------------------------------------------------------------------ frame
  function toWorld(nx: number, ny: number): [number, number] {
    const aspect = canvas.width / Math.max(canvas.height, 1);
    return [(nx - 0.5) * aspect, ny - 0.5];
  }

  function writeBrush(index: number, b: Brush) {
    const o = 8 + index * 8;
    uniformData[o] = b.prevX;
    uniformData[o + 1] = b.prevY;
    uniformData[o + 2] = b.x;
    uniformData[o + 3] = b.y;
    uniformData[o + 4] = b.radius;
    uniformData[o + 5] = b.hue;
    uniformData[o + 6] = b.strength;
    uniformData[o + 7] = 0;
  }

  function updateBrushes(dt: number) {
    // Pointer brush: eased toward the cursor; slow strokes pool more paint.
    const ease = 1 - Math.exp(-dt * 14);
    const px = pointer.x;
    const py = pointer.y;
    pointer.x += (pointer.targetX - pointer.x) * ease;
    pointer.y += (pointer.targetY - pointer.y) * ease;
    const moved = Math.hypot(pointer.x - px, pointer.y - py);
    pointer.speed += (moved / Math.max(dt, 1e-4) - pointer.speed) * ease;
    const active =
      pointer.inside && time - pointer.lastMoveAt < 0.35 && !reduceMotion;
    pointer.strength +=
      ((active ? 1 : 0) - pointer.strength) *
      (1 - Math.exp(-dt * (active ? 12 : 5)));
    pointer.hue += Math.sin(time * 0.37 + seed) * 0.08 * dt;

    [brush.prevX, brush.prevY] = toWorld(px, py);
    [brush.x, brush.y] = toWorld(pointer.x, pointer.y);
    const loaded = 0.55 + 0.45 * (1 - Math.min(pointer.speed * 1.6, 1));
    brush.strength = pointer.strength * loaded;
    brush.hue = Math.min(Math.max(pointer.hue, 0), 1);
    brush.radius = 0.045 + 0.02 * (1 - Math.min(pointer.speed * 2, 1));

    // Ambient brush wanders slowly so the sheet is alive even untouched. During
    // warm-up it moves and loads up faster to dress a blank sheet.
    const warming = time < warmupUntil;
    const speed = warming ? 7 : 1;
    const t = time * speed + seed;
    const ax = 0.5 + 0.36 * Math.sin(t * 0.13) * Math.cos(t * 0.071 + 0.6);
    const ay = 0.42 + 0.28 * Math.sin(t * 0.097 + 1.7) * Math.cos(t * 0.053);
    ambient.prevX = ambient.x;
    ambient.prevY = ambient.y;
    [ambient.x, ambient.y] = toWorld(ax, ay);
    if (frames === 0) {
      ambient.prevX = ambient.x;
      ambient.prevY = ambient.y;
    }
    ambient.hue = 0.5 + 0.5 * Math.sin(t * 0.09 + 2.0);
    ambient.radius = 0.1 + 0.05 * Math.sin(t * 0.21);
    const quiet = 1 - pointer.strength * 0.75;
    ambient.strength =
      (warming ? 0.5 : 0.12) * quiet * (reduceMotion ? 0.8 : 1);
  }

  function render(dt: number) {
    if (!sheets) return;
    updateBrushes(dt);

    uniformData[0] = canvas.width;
    uniformData[1] = canvas.height;
    uniformData[2] = simWidth;
    uniformData[3] = simHeight;
    uniformData[4] = time;
    uniformData[5] = dt;
    uniformData[6] = seed;
    uniformData[7] = reduceMotion ? 0 : 1;
    writeBrush(0, brush);
    writeBrush(1, ambient);
    device.queue.writeBuffer(uniformBuffer, 0, uniformData);

    const encoder = device.createCommandEncoder({ label: "watercolor-frame" });

    const compute = encoder.beginComputePass({ label: "watercolor-simulate" });
    compute.setPipeline(simulatePipeline);
    compute.setBindGroup(0, simulateGroups[ping]);
    compute.dispatchWorkgroups(
      Math.ceil(simWidth / WORKGROUP),
      Math.ceil(simHeight / WORKGROUP),
    );
    compute.end();
    ping = 1 - ping; // the sheet we just wrote is now current

    configureContext();
    const pass = encoder.beginRenderPass({
      label: "watercolor-composite",
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          loadOp: "clear",
          clearValue: { r: 1, g: 1, b: 1, a: 1 },
          storeOp: "store",
        },
      ],
    });
    pass.setPipeline(compositePipeline);
    pass.setBindGroup(0, compositeGroups[ping]);
    pass.draw(3);
    pass.end();

    device.queue.submit([encoder.finish()]);
  }

  function frame(now: number) {
    if (stopped) return;
    raf = requestAnimationFrame(frame);
    if (!visible || document.hidden) {
      last = now;
      return;
    }
    const dt = Math.min(Math.max((now - last) / 1000, 0.0001), 0.1);
    last = now;
    time += dt;
    try {
      render(dt);
    } catch (error) {
      // Never let a GPU failure loop forever; hand over to the CSS fallback.
      stop();
      callbacks.onFallback(
        error instanceof Error ? error.message : "Render failed",
      );
      return;
    }
    frames += 1;
    if (frames === 2) callbacks.onReady();
    // Reduced motion: dress the sheet during warm-up, then hold the frame.
    if (reduceMotion && time > warmupUntil + 0.5) {
      cancelAnimationFrame(raf);
    }
  }

  raf = requestAnimationFrame(frame);

  device.lost.then((info) => {
    if (stopped) return;
    stop();
    callbacks.onFallback(`GPU device lost: ${info.message}`);
  });

  function stop() {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(raf);
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    window.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerleave", onPointerLeave);
    try {
      if (contextOwners.get(canvas) === device) {
        context.unconfigure();
        contextOwners.delete(canvas);
      }
      if (sheets) for (const tex of sheets) tex.destroy();
      device.destroy();
    } catch {
      // Device may already be lost.
    }
  }

  return stop;
}
