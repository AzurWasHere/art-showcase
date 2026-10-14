/**
 * WebGPU renderer for the lily-of-the-valley page. Framework-agnostic: hand it
 * a canvas and its host element, get back a stop function. Readiness and
 * fallback are reported through callbacks so the React wrapper can cross-fade.
 */

import { lilyShader, SUN_DIR, UNIFORM_FLOATS } from "./lily.wgsl";
import {
  add,
  buildLilyScene,
  cross,
  dot,
  normalize,
  scale,
  sub,
  VERTEX_STRIDE,
  type Vec3,
} from "./lily-geometry";

export type StopLily = () => void;

export interface LilyCallbacks {
  onReady: () => void;
  onFallback: (reason: string) => void;
}

const SAMPLES = 4;
const DEPTH_FORMAT: GPUTextureFormat = "depth24plus";
const PARTICLES = 170;
const TARGET: Vec3 = [0.05, 0.62, -0.3];
const EYE_OFFSET: Vec3 = [0, 0.22, 2.4];
const WIND_DIR = normalize([1, 0, 0.18]);

/** Which GPUDevice currently has a given canvas configured. */
const contextOwners = new WeakMap<HTMLCanvasElement, GPUDevice>();

function perspective(fovY: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fovY / 2);
  const m = new Float32Array(16);
  m[0] = f / aspect;
  m[5] = f;
  m[10] = far / (near - far);
  m[11] = -1;
  m[14] = (near * far) / (near - far);
  return m;
}

function lookAt(eye: Vec3, target: Vec3) {
  const z = normalize(sub(eye, target));
  const x = normalize(cross([0, 1, 0], z));
  const y = cross(z, x);
  const m = new Float32Array(16);
  m.set([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0]);
  m[12] = -dot(x, eye);
  m[13] = -dot(y, eye);
  m[14] = -dot(z, eye);
  m[15] = 1;
  return { m, x, y };
}

function multiply(a: Float32Array, b: Float32Array) {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += a[k * 4 + r] * b[c * 4 + k];
      out[c * 4 + r] = sum;
    }
  }
  return out;
}

function supportsWebGPU(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "gpu" in navigator &&
    Boolean(navigator.gpu)
  );
}

export async function startLily(
  canvas: HTMLCanvasElement,
  host: HTMLElement,
  callbacks: LilyCallbacks,
): Promise<StopLily | null> {
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
  // React Strict Mode mounts twice and the canvas context is shared, so track
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
  const dprCap = coarsePointer ? 1.25 : 1.6;

  // ------------------------------------------------------------- resources
  const restingEye = add(TARGET, EYE_OFFSET);
  const scene = buildLilyScene(restingEye);
  const vertexBuffer = device.createBuffer({
    label: "lily-vertices",
    size: scene.vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, scene.vertices);
  const indexBuffer = device.createBuffer({
    label: "lily-indices",
    size: scene.indices.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(indexBuffer, 0, scene.indices);
  const indexCount = scene.indices.length;

  const uniformData = new Float32Array(UNIFORM_FLOATS);
  const uniformBuffer = device.createBuffer({
    label: "lily-uniforms",
    size: uniformData.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const bindLayout = device.createBindGroupLayout({
    label: "lily-bind-layout",
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" },
      },
    ],
  });
  const bindGroup = device.createBindGroup({
    layout: bindLayout,
    entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
  });
  const layout = device.createPipelineLayout({
    bindGroupLayouts: [bindLayout],
  });

  let skyPipeline: GPURenderPipeline;
  let meshPipeline: GPURenderPipeline;
  let particlePipeline: GPURenderPipeline;
  try {
    const module = device.createShaderModule({
      code: lilyShader,
      label: "lily",
    });
    const info = await module.getCompilationInfo();
    const errors = info.messages.filter((m) => m.type === "error");
    if (errors.length > 0) {
      throw new Error(
        `WGSL compile failed\n${errors
          .map((m) => `lily:${m.lineNum}:${m.linePos} ${m.message}`)
          .join("\n")}`,
      );
    }
    const multisample = { count: SAMPLES };
    [skyPipeline, meshPipeline, particlePipeline] = await Promise.all([
      device.createRenderPipelineAsync({
        label: "lily-sky",
        layout,
        vertex: { module, entryPoint: "vs_sky" },
        fragment: { module, entryPoint: "fs_sky", targets: [{ format }] },
        primitive: { topology: "triangle-list" },
        depthStencil: {
          format: DEPTH_FORMAT,
          depthWriteEnabled: false,
          depthCompare: "always",
        },
        multisample,
      }),
      device.createRenderPipelineAsync({
        label: "lily-mesh",
        layout,
        vertex: {
          module,
          entryPoint: "vs_mesh",
          buffers: [
            {
              arrayStride: VERTEX_STRIDE,
              attributes: [
                { shaderLocation: 0, offset: 0, format: "float32x3" },
                { shaderLocation: 1, offset: 12, format: "float32x3" },
                { shaderLocation: 2, offset: 24, format: "float32x3" },
                { shaderLocation: 3, offset: 36, format: "float32x2" },
                { shaderLocation: 4, offset: 44, format: "float32x3" },
                { shaderLocation: 5, offset: 56, format: "float32x3" },
                { shaderLocation: 6, offset: 68, format: "float32x3" },
              ],
            },
          ],
        },
        fragment: { module, entryPoint: "fs_mesh", targets: [{ format }] },
        primitive: { topology: "triangle-list", cullMode: "none" },
        depthStencil: {
          format: DEPTH_FORMAT,
          depthWriteEnabled: true,
          depthCompare: "less",
        },
        multisample,
      }),
      device.createRenderPipelineAsync({
        label: "lily-particles",
        layout,
        vertex: { module, entryPoint: "vs_particle" },
        fragment: {
          module,
          entryPoint: "fs_particle",
          targets: [
            {
              format,
              blend: {
                color: {
                  srcFactor: "one",
                  dstFactor: "one-minus-src-alpha",
                  operation: "add",
                },
                alpha: {
                  srcFactor: "one",
                  dstFactor: "one-minus-src-alpha",
                  operation: "add",
                },
              },
            },
          ],
        },
        primitive: { topology: "triangle-list" },
        depthStencil: {
          format: DEPTH_FORMAT,
          depthWriteEnabled: false,
          depthCompare: "less",
        },
        multisample,
      }),
    ]);
  } catch (error) {
    console.error("[lily]", error);
    device.destroy();
    callbacks.onFallback(
      error instanceof Error ? error.message : "Pipeline creation failed",
    );
    return null;
  }

  // ------------------------------------------------------- render targets
  let colorTarget: GPUTexture | null = null;
  let depthTarget: GPUTexture | null = null;

  function rebuildTargets() {
    colorTarget?.destroy();
    depthTarget?.destroy();
    const size = [canvas.width, canvas.height];
    colorTarget = device.createTexture({
      label: "lily-msaa-color",
      size,
      format,
      sampleCount: SAMPLES,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    depthTarget = device.createTexture({
      label: "lily-depth",
      size,
      format: DEPTH_FORMAT,
      sampleCount: SAMPLES,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    const width = Math.max(1, Math.floor(host.clientWidth * dpr));
    const height = Math.max(1, Math.floor(host.clientHeight * dpr));
    if (canvas.width !== width || canvas.height !== height || !colorTarget) {
      canvas.width = width;
      canvas.height = height;
      rebuildTargets();
    }
  }

  // ----------------------------------------------------------- interaction
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, vx: 0, lastX: 0, lastT: 0 };
  let gust = 0;

  function onPointerMove(event: PointerEvent) {
    const rect = host.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    ) {
      return;
    }
    const nx = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
    const ny = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1;
    const now = performance.now() / 1000;
    const dt = Math.max(now - pointer.lastT, 1 / 240);
    if (now - pointer.lastT < 0.2) {
      const v = (nx - pointer.lastX) / dt;
      pointer.vx += (v - pointer.vx) * 0.35;
    }
    pointer.lastX = nx;
    pointer.lastT = now;
    pointer.tx = nx;
    pointer.ty = ny;
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resize();

  let visible = true;
  const intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      visible = entry?.isIntersecting ?? true;
    },
    { threshold: 0.02 },
  );
  intersectionObserver.observe(host);
  window.addEventListener("pointermove", onPointerMove, { passive: true });

  // ----------------------------------------------------------------- frame
  let stopped = false;
  let time = 0;
  let frames = 0;
  let last = performance.now();
  let raf = 0;

  function writeUniforms(dt: number) {
    const ease = 1 - Math.exp(-dt * 2.5);
    pointer.x += (pointer.tx - pointer.x) * ease;
    pointer.y += (pointer.ty - pointer.y) * ease;
    pointer.vx *= Math.exp(-dt * 5);
    // Sweeping the cursor sideways pushes a gust through the meadow.
    const gustTarget = Math.max(-1.6, Math.min(1.6, pointer.vx * 0.35));
    gust += (gustTarget - gust) * (1 - Math.exp(-dt * 3));

    const yaw = pointer.x * 0.1 + Math.sin(time * 0.07) * 0.035;
    const lift = -pointer.y * 0.05 + Math.sin(time * 0.05 + 1) * 0.012;
    const eye: Vec3 = add(TARGET, [
      EYE_OFFSET[0] * Math.cos(yaw) + EYE_OFFSET[2] * Math.sin(yaw),
      EYE_OFFSET[1] + lift,
      -EYE_OFFSET[0] * Math.sin(yaw) + EYE_OFFSET[2] * Math.cos(yaw),
    ]);

    const aspect = canvas.width / Math.max(canvas.height, 1);
    // Widen a little on tall screens, but cap it so phones get a close-up of
    // the central plants rather than a tiny distant meadow.
    const tanHalfY = Math.min(
      Math.max(
        Math.tan((17.5 * Math.PI) / 180),
        Math.tan((19 * Math.PI) / 180) / aspect,
      ),
      Math.tan((23 * Math.PI) / 180),
    );
    const proj = perspective(2 * Math.atan(tanHalfY), aspect, 0.05, 40);
    const view = lookAt(eye, TARGET);
    const viewProj = multiply(proj, view.m);

    const sunPoint = add(eye, scale(normalize(SUN_DIR), 30));
    const sx =
      viewProj[0] * sunPoint[0] +
      viewProj[4] * sunPoint[1] +
      viewProj[8] * sunPoint[2] +
      viewProj[12];
    const sy =
      viewProj[1] * sunPoint[0] +
      viewProj[5] * sunPoint[1] +
      viewProj[9] * sunPoint[2] +
      viewProj[13];
    const sw =
      viewProj[3] * sunPoint[0] +
      viewProj[7] * sunPoint[1] +
      viewProj[11] * sunPoint[2] +
      viewProj[15];

    const strength = reduceMotion
      ? 0.25
      : 0.85 + 0.25 * Math.sin(time * 0.11) + 0.15 * Math.sin(time * 0.29);

    uniformData.set(viewProj, 0);
    uniformData.set(eye, 16);
    uniformData[19] = time;
    uniformData[20] = WIND_DIR[0];
    uniformData[21] = WIND_DIR[2];
    uniformData[22] = strength;
    uniformData[23] = reduceMotion ? 0 : gust;
    uniformData[24] = canvas.width;
    uniformData[25] = canvas.height;
    uniformData[26] = aspect;
    uniformData[27] = reduceMotion ? 0 : 1;
    uniformData.set(view.x, 28);
    uniformData.set(view.y, 32);
    uniformData[36] = (sx / sw) * 0.5 + 0.5;
    uniformData[37] = 0.5 - (sy / sw) * 0.5;
    device.queue.writeBuffer(uniformBuffer, 0, uniformData);
  }

  function render(dt: number) {
    if (!colorTarget || !depthTarget) return;
    writeUniforms(dt);
    configureContext();

    const encoder = device.createCommandEncoder({ label: "lily-frame" });
    const pass = encoder.beginRenderPass({
      label: "lily-scene",
      colorAttachments: [
        {
          view: colorTarget.createView(),
          resolveTarget: context.getCurrentTexture().createView(),
          loadOp: "clear",
          clearValue: { r: 1, g: 1, b: 1, a: 1 },
          storeOp: "discard",
        },
      ],
      depthStencilAttachment: {
        view: depthTarget.createView(),
        depthClearValue: 1,
        depthLoadOp: "clear",
        depthStoreOp: "discard",
      },
    });
    pass.setBindGroup(0, bindGroup);

    pass.setPipeline(skyPipeline);
    pass.draw(3);

    pass.setPipeline(meshPipeline);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.setIndexBuffer(indexBuffer, "uint32");
    pass.drawIndexed(indexCount);

    pass.setPipeline(particlePipeline);
    pass.draw(6, reduceMotion ? 0 : PARTICLES);

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
    time += reduceMotion ? 0 : dt;
    try {
      render(dt);
    } catch (error) {
      stop();
      callbacks.onFallback(
        error instanceof Error ? error.message : "Render failed",
      );
      return;
    }
    frames += 1;
    if (frames === 2) callbacks.onReady();
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
    try {
      if (contextOwners.get(canvas) === device) {
        context.unconfigure();
        contextOwners.delete(canvas);
      }
      colorTarget?.destroy();
      depthTarget?.destroy();
      vertexBuffer.destroy();
      indexBuffer.destroy();
      uniformBuffer.destroy();
      device.destroy();
    } catch {
      // Device may already be lost.
    }
  }

  return stop;
}
