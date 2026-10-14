import { ArrowRight, Heart } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description:
    "The story behind AURA — a small, personal gallery made with love.",
};

const SWATCHES = [
  {
    name: "Blush",
    hex: "#F7B4D6",
    css: "var(--blush)",
    note: "Warmth, skin, dawn",
  },
  {
    name: "Sky",
    hex: "#B6DAF5",
    css: "var(--sky)",
    note: "Air, distance, calm",
  },
  {
    name: "White",
    hex: "#FFFFFF",
    css: "#ffffff",
    note: "Paper, silence, room to breathe",
  },
];

const FAQ = [
  {
    q: "Who is this for?",
    a: "For the person who made these pieces, and for anyone lucky enough to be shown them. It's a gift, not a shop.",
  },
  {
    q: "How are pieces photographed?",
    a: "Flat works are shot under diffused daylight and colour-matched to the original. Dimensions listed are the unframed image size.",
  },
  {
    q: "Will there be more?",
    a: "Always. New work is added whenever it's ready, so it's worth coming back.",
  },
];

export default function AboutPage() {
  return (
    <div>
      <section className="pastel-mesh grain relative overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            About AURA
          </p>
          <h1 className="mt-3 max-w-4xl font-display text-5xl leading-[0.95] text-balance sm:text-7xl">
            A quiet place for work that deserves to be seen.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/75">
            AURA is a small, personal gallery made with love. It exists for one
            reason: so every piece here has a home of its own, somewhere to be
            looked at slowly and come back to.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:px-8">
        <div>
          <h2 className="font-display text-4xl">The palette is the brief</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Three colours sit underneath every part of this site. They aren't a
            theme so much as a tuning fork.
          </p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-3">
          {SWATCHES.map((swatch) => (
            <li
              key={swatch.name}
              className="overflow-hidden rounded-3xl bg-white ring-1 ring-foreground/8 shadow-soft"
            >
              <div className="h-32" style={{ background: swatch.css }} />
              <div className="p-4">
                <p className="font-display text-2xl">{swatch.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {swatch.hex}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {swatch.note}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="font-display text-4xl">How a piece is shown</h2>
            <ol className="mt-8 space-y-6">
              {[
                [
                  "Uploaded by hand",
                  "Every piece is added one at a time, never in bulk.",
                ],
                [
                  "Written up with care",
                  "Medium, dimensions, year and a few honest sentences about what it is and why it matters.",
                ],
                [
                  "Kept true to colour",
                  "Photographed in daylight so the screen version doesn't lie.",
                ],
                [
                  "Favourites get featured",
                  "The pieces that stop you mid-scroll earn a place on the front page.",
                ],
              ].map(([title, body], i) => (
                <li key={title} className="flex gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient font-mono text-sm text-white">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-sans font-semibold">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h2 className="font-display text-4xl">A few questions</h2>
            <dl className="mt-8 divide-y divide-border">
              {FAQ.map((item) => (
                <div key={item.q} className="py-5">
                  <dt className="font-semibold">{item.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="glass flex flex-col gap-8 rounded-[2rem] p-8 shadow-soft md:flex-row md:items-center md:justify-between md:p-12">
          <div>
            <h2 className="font-display text-4xl">Take your time with it</h2>
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Heart className="size-4 text-primary" /> Made with love, in blush
              and sky.
            </p>
          </div>
          <Button
            size="lg"
            className="h-12 rounded-full bg-brand-gradient px-6 text-base text-white hover:opacity-95"
            nativeButton={false}
            render={<Link href="/gallery" />}
          >
            Open the gallery <ArrowRight />
          </Button>
        </div>
      </section>
    </div>
  );
}
