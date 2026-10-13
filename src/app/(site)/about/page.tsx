import { Mail, MapPin, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About",
  description:
    "The story behind AURA — how the collection is chosen, photographed and shared.",
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
    q: "Are the works for sale?",
    a: "Some are, some are on loan. Use the enquiry button on any piece and the curator will reply with availability and pricing.",
  },
  {
    q: "How are pieces photographed?",
    a: "Flat works are shot under diffused daylight and colour-matched to the original. Dimensions listed are the unframed image size.",
  },
  {
    q: "Can I submit my work?",
    a: "Yes. Send three images and a short note about materials. The collection grows slowly, but it does grow.",
  },
];

export default function AboutPage() {
  return (
    <div>
      <section className="pastel-mesh grain relative overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            About the studio
          </p>
          <h1 className="mt-3 max-w-4xl font-display text-5xl leading-[0.95] text-balance sm:text-7xl">
            We collect the hour just after sunrise, in paint.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/75">
            AURA is a small, independent gallery. It began in a shared studio in
            2021 with a dozen canvases leaning against a wall and a rule: only
            keep what you'd miss. Everything on this site passed that test.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:px-8">
        <div>
          <h2 className="font-display text-4xl">The palette is the brief</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Three colours sit underneath every decision we make — on the walls,
            on this website, and in what we choose to show. They aren't a theme
            so much as a tuning fork.
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
            <h2 className="font-display text-4xl">How a piece gets in</h2>
            <ol className="mt-8 space-y-6">
              {[
                [
                  "Looked at twice",
                  "Nothing is accepted on first sight. Work is revisited a week later, in different light.",
                ],
                [
                  "Measured and written up",
                  "Medium, dimensions, year and a few honest sentences — recorded by the curator, not copied from a label.",
                ],
                [
                  "Photographed in daylight",
                  "Colour-matched to the original so the screen version doesn't lie.",
                ],
                [
                  "Published, then lived with",
                  "Pieces stay up as long as they still earn their place.",
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
            <h2 className="font-display text-4xl">Questions people ask</h2>
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
            <h2 className="font-display text-4xl">
              Visit, write, or just say hello
            </h2>
            <div className="mt-5 flex flex-col gap-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" /> Studio visits by
                appointment, Thursdays and Fridays
              </p>
              <p className="flex items-center gap-2">
                <Mail className="size-4 text-primary" /> studio@aura.gallery
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="mailto:studio@aura.gallery"
              className={cn(
                buttonVariants(),
                "rounded-full bg-brand-gradient text-white hover:opacity-95",
              )}
            >
              <Mail /> Email the curator
            </a>
            <Button
              variant="outline"
              className="rounded-full"
              nativeButton={false}
              render={<Link href="/gallery" />}
            >
              <Sparkles /> Browse the collection
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
