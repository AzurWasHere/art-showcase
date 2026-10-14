import { ArrowRight, Droplets, Palette, Sun } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const PRINCIPLES = [
  {
    icon: Sun,
    title: "Light before line",
    body: "Every work is chosen for how it holds light. Edges, subject and style come second.",
  },
  {
    icon: Palette,
    title: "Three colours, infinitely",
    body: "Blush, sky and white are the gallery's grammar; the work supplies the vocabulary.",
  },
  {
    icon: Droplets,
    title: "Slow additions",
    body: "New pieces arrive when they're ready, each with its materials, size and story recorded.",
  },
];

export function Manifesto() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 pastel-mesh opacity-70"
      />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            The idea
          </p>
          <h2 className="mt-3 font-display text-4xl leading-tight text-balance sm:text-5xl">
            A gallery built like a sketchbook:{" "}
            <span className="italic">open, unfinished, alive.</span>
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-foreground/75">
            AURA is a personal collection, made with love. Every piece is
            uploaded by hand, written up with care, and shown without pretence —
            just the work, given the room it deserves.
          </p>
          <Button
            className="mt-8 rounded-full"
            variant="secondary"
            nativeButton={false}
            render={<Link href="/for-you" />}
          >
            A little something for you <ArrowRight />
          </Button>
        </div>

        <ul className="grid gap-4">
          {PRINCIPLES.map((principle) => (
            <li
              key={principle.title}
              className="glass flex gap-4 rounded-3xl p-5 shadow-soft"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white">
                <principle.icon className="size-5" />
              </span>
              <div>
                <h3 className="font-sans text-base font-semibold">
                  {principle.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {principle.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
