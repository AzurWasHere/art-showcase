import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ClosingCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-ink px-6 py-16 text-white shadow-lift sm:px-12 sm:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -left-24 size-96 rounded-full bg-[radial-gradient(closest-side,oklch(0.8_0.14_350/0.7),transparent)] blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -bottom-32 size-96 rounded-full bg-[radial-gradient(closest-side,oklch(0.78_0.12_240/0.7),transparent)] blur-2xl"
        />
        <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <h2 className="font-display text-4xl leading-tight sm:text-5xl">
              Spend a quiet hour with the whole collection.
            </h2>
            <p className="mt-4 text-white/70">
              Filter by discipline, search by medium, or let the lightbox carry
              you from one piece to the next.
            </p>
          </div>
          <Button
            size="lg"
            className="h-12 rounded-full bg-white px-6 text-base text-ink hover:bg-blush-soft"
            nativeButton={false}
            render={<Link href="/gallery" />}
          >
            Open the gallery <ArrowRight />
          </Button>
        </div>
      </div>
    </section>
  );
}
