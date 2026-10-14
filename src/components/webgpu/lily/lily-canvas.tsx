"use client";

import { cn } from "cn";
import { useEffect, useRef, useState } from "react";
import { type StopLily, startLily } from "./lily-engine";

type Status = "booting" | "live" | "fallback";

/**
 * Full-bleed WebGPU meadow of lily of the valley swaying in a spring breeze.
 * Shows a soft CSS sky immediately and cross-fades to the GPU canvas once the
 * first frames are in; browsers without WebGPU keep the CSS sky.
 */
export function LilyCanvas({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<Status>("booting");

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    let cancelled = false;
    let stop: StopLily | null = null;

    startLily(canvas, host, {
      onReady: () => {
        if (!cancelled) setStatus("live");
      },
      onFallback: (reason) => {
        if (!cancelled) {
          console.warn("[lily] falling back to CSS:", reason);
          setStatus("fallback");
        }
      },
    }).then((handle) => {
      if (cancelled) handle?.();
      else stop = handle;
    });

    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label="Lily of the valley swaying in a spring breeze"
      className={cn("absolute inset-0 overflow-hidden", className)}
    >
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 bg-[linear-gradient(180deg,#b1cff5_0%,#f5f0f9_52%,#fcd4e2_100%)] transition-opacity duration-1000",
          status === "live" ? "opacity-0" : "opacity-100",
        )}
      >
        <div className="absolute top-[18%] right-[14%] size-72 rounded-full bg-[radial-gradient(closest-side,#fff7ef,transparent)] blur-xl" />
        <div className="absolute top-1/4 left-[12%] size-40 animate-float rounded-full bg-[radial-gradient(closest-side,rgb(255_255_255/0.7),transparent)] blur-md" />
        <div className="absolute top-1/2 right-1/3 size-28 animate-float-slow rounded-full bg-[radial-gradient(closest-side,rgb(250_205_225/0.7),transparent)] blur-md" />
      </div>

      <canvas
        ref={canvasRef}
        className={cn(
          "absolute inset-0 size-full transition-opacity duration-1400 ease-out",
          status === "live" ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
