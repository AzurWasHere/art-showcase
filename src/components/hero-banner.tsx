"use client";

import { Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const CATEGORIES = [
  "Paintings",
  "Digital Art",
  "Sculpture",
  "Photography",
  "Mixed Media",
] as const;

interface HeroBannerProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  featuredOnly: boolean;
  onFeaturedOnlyChange: (value: boolean) => void;
  counts: Record<string, number>;
}

export function HeroBanner({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  featuredOnly,
  onFeaturedOnlyChange,
  counts,
}: HeroBannerProps) {
  const pills = ["All", ...CATEGORIES];

  return (
    <section className="pastel-gradient-bg relative overflow-hidden">
      <div className="pointer-events-none absolute -left-24 top-0 size-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 size-96 rounded-full bg-secondary blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
          Curated Visions in{" "}
          <span className="bg-gradient-to-r from-pink-400 to-sky-400 bg-clip-text text-transparent">
            Pastel &amp; Light
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Explore contemporary paintings, ethereal digital compositions, and
          sculptural form in high fidelity.
        </p>

        <div className="glass-panel mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-2xl px-4 py-2">
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search title, medium, or description..."
            aria-label="Search artworks"
            className="h-9 border-0 bg-transparent px-0 focus-visible:ring-0"
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {pills.map((name) => {
            const active = category === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => onCategoryChange(name)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-white/60 bg-white/80 text-secondary-foreground hover:bg-secondary",
                )}
              >
                {name} <span className="opacity-70">({counts[name] ?? 0})</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex justify-center">
          <button
            type="button"
            aria-pressed={featuredOnly}
            onClick={() => onFeaturedOnlyChange(!featuredOnly)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              featuredOnly
                ? "border-primary bg-accent text-accent-foreground"
                : "border-white/60 bg-white/80 text-muted-foreground hover:bg-accent",
            )}
          >
            <Sparkles
              className={cn(
                "size-4",
                featuredOnly && "fill-primary text-primary",
              )}
            />
            Featured Only
          </button>
        </div>
      </div>
    </section>
  );
}
