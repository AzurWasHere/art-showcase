import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { ArtworkImage } from "@/components/gallery/artwork-image";
import { getArtworks } from "@/lib/artworks";

export async function CategoryTiles() {
  const artworks = await getArtworks();
  if (artworks.length === 0) return null;

  const tiles = new Map<
    string,
    { count: number; cover: (typeof artworks)[number] }
  >();
  for (const artwork of artworks) {
    const existing = tiles.get(artwork.category);
    if (existing) {
      existing.count += 1;
      if (artwork.featured && !existing.cover.featured)
        existing.cover = artwork;
    } else {
      tiles.set(artwork.category, { count: 1, cover: artwork });
    }
  }
  const entries = [...tiles.entries()].sort((a, b) => b[1].count - a[1].count);

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-deep">
          Browse by discipline
        </p>
        <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
          Five rooms, one palette
        </h2>
        <p className="mt-4 text-muted-foreground">
          Each discipline gets its own room. Wander in, or filter the whole
          collection from the gallery page.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {entries.map(([name, { count, cover }], i) => (
          <Link
            key={name}
            href={`/gallery?category=${encodeURIComponent(name)}`}
            className={[
              "group relative overflow-hidden rounded-[1.75rem] ring-1 ring-foreground/8 shadow-soft card-lift",
              i === 0
                ? "sm:col-span-2 lg:col-span-4 lg:row-span-2 min-h-72"
                : "lg:col-span-2 min-h-56",
            ].join(" ")}
          >
            <ArtworkImage
              src={cover.imageUrl}
              alt=""
              fill
              sizes={
                i === 0
                  ? "(min-width: 1024px) 60vw, 100vw"
                  : "(min-width: 1024px) 30vw, 50vw"
              }
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white">
              <div>
                <h3
                  className={`font-display leading-none ${i === 0 ? "text-4xl" : "text-2xl"}`}
                >
                  {name}
                </h3>
                <p className="mt-1.5 text-xs tracking-wide text-white/75 uppercase">
                  {count} {count === 1 ? "work" : "works"}
                </p>
              </div>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur transition-all group-hover:bg-white group-hover:text-ink">
                <ArrowUpRight className="size-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
