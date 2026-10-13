"use client";

import { Brush, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { type StopWatercolor, startWatercolor } from "./watercolor-engine";

type Status = "booting" | "live" | "fallback";

/**
 * Full-bleed WebGPU watercolour sheet used behind the home hero. Moving the
 * cursor paints pastel pigment that bleeds into the paper and slowly dries.
 * Renders a CSS pastel mesh immediately, then cross-fades to the GPU canvas
 * once the first frames are in. Browsers without WebGPU keep the CSS version.
 */
export function WatercolorCanvas({
  className,
  showBadge = true,
}: {
  className?: string;
  showBadge?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<Status>("booting");
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    let cancelled = false;
    let stop: StopWatercolor | null = null;

    startWatercolor(canvas, host, {
      onReady: () => {
        if (!cancelled) setStatus("live");
      },
      onFallback: (why) => {
        if (!cancelled) {
          setStatus("fallback");
          setReason(why);
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
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {/* CSS fallback / loading state: animated pastel washes. */}
      <div
        className={cn(
          "absolute inset-0 pastel-mesh transition-opacity duration-1000",
          status === "live" ? "opacity-0" : "opacity-100",
        )}
      >
        <div className="absolute -top-24 -left-20 size-[32rem] animate-float rounded-full bg-[radial-gradient(closest-side,oklch(0.88_0.09_350/0.85),transparent)] blur-2xl" />
        <div className="absolute top-1/3 -right-32 size-[36rem] animate-float-slow rounded-full bg-[radial-gradient(closest-side,oklch(0.88_0.07_232/0.85),transparent)] blur-2xl" />
        <div className="absolute -bottom-32 left-1/3 size-[30rem] animate-float rounded-full bg-[radial-gradient(closest-side,oklch(0.9_0.06_300/0.8),transparent)] blur-2xl [animation-delay:-4s]" />
      </div>

      <canvas
        ref={canvasRef}
        className={cn(
          "absolute inset-0 size-full transition-opacity duration-[1400ms] ease-out",
          status === "live" ? "opacity-100" : "opacity-0",
        )}
      />

      {showBadge && status !== "booting" && (
        <div className="pointer-events-auto absolute right-4 bottom-4 hidden items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-medium text-foreground/70 shadow-soft backdrop-blur sm:flex">
          {status === "live" ? (
            <>
              <Brush className="size-3.5 text-primary" />
              Watercolour painted live with WebGPU · move your cursor
            </>
          ) : (
            <>
              <Sparkles className="size-3.5 text-primary" />
              <span title={reason ?? undefined}>
                WebGPU unavailable · CSS fallback
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
