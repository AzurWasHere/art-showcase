import { ArrowDown, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WatercolorCanvas } from "@/components/webgpu/watercolor-canvas";

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[calc(100svh-4rem)] items-center overflow-hidden">
      <WatercolorCanvas />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col items-start gap-8 px-4 py-24 sm:px-6 lg:px-8">
        <span className="animate-fade-up inline-flex items-center gap-2 rounded-full bg-white/70 px-3.5 py-1.5 text-xs font-medium tracking-wide text-foreground/80 shadow-soft backdrop-blur">
          <Sparkles className="size-3.5 text-primary" />
          Contemporary art, curated in pastel
        </span>

        <h1
          className="animate-fade-up max-w-4xl font-display text-[clamp(3rem,9vw,7.5rem)] leading-[0.95] tracking-tight text-balance"
          style={{ animationDelay: "80ms" }}
        >
          Soft light,
          <br />
          <span className="text-gradient italic">loud colour.</span>
        </h1>

        <p
          className="animate-fade-up max-w-xl text-lg leading-relaxed text-foreground/75 sm:text-xl"
          style={{ animationDelay: "160ms" }}
        >
          AURA is a living collection of paintings, prints, photographs and
          digital works that share one obsession: colour you can almost touch.
          Drag your cursor across this page — you are painting in watercolour on
          your own GPU.
        </p>

        <div
          className="animate-fade-up flex flex-wrap items-center gap-3"
          style={{ animationDelay: "240ms" }}
        >
          <Button
            size="lg"
            className="h-12 rounded-full bg-brand-gradient px-6 text-base text-white shadow-lift hover:opacity-95"
            nativeButton={false}
            render={<Link href="/gallery" />}
          >
            Enter the gallery <ArrowRight />
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="h-12 rounded-full bg-white/60 px-6 text-base backdrop-blur hover:bg-white"
            nativeButton={false}
            render={<Link href="/about" />}
          >
            About AURA
          </Button>
        </div>
      </div>

      <a
        href="#featured"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-xs font-medium tracking-[0.3em] text-foreground/60 uppercase transition-colors hover:text-foreground md:flex"
      >
        Scroll
        <ArrowDown className="size-4 animate-bounce" />
      </a>
    </section>
  );
}
