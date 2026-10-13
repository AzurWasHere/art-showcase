import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { ArtworkImage } from "@/components/gallery/artwork-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getFeaturedArtworks } from "@/lib/artworks";
import { aspectRatioOf } from "@/lib/image";

export async function FeaturedStrip() {
  const featured = await getFeaturedArtworks(6);
  if (featured.length === 0) return null;

  return (
    <section id="featured" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Featured works
            </p>
            <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
              Pieces the curator
              <br className="hidden sm:block" /> keeps returning to
            </h2>
          </div>
          <Button
            variant="ghost"
            className="rounded-full"
            nativeButton={false}
            render={<Link href="/gallery?featured=1" />}
          >
            See all featured <ArrowRight />
          </Button>
        </div>
      </div>

      <div className="scrollbar-none mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-6 sm:px-6 lg:px-[max(2rem,calc((100vw-80rem)/2+2rem))]">
        {featured.map((artwork, i) => (
          <Link
            key={artwork.id}
            href={`/gallery/${artwork.slug}`}
            className="group card-lift relative w-[78vw] shrink-0 snap-start overflow-hidden rounded-[2rem] bg-card ring-1 ring-foreground/8 shadow-soft sm:w-[22rem] lg:w-[24rem]"
          >
            <div
              className="relative w-full overflow-hidden bg-muted"
              style={{
                aspectRatio: aspectRatioOf(
                  artwork.imageWidth,
                  artwork.imageHeight,
                ),
              }}
            >
              <ArtworkImage
                src={artwork.imageUrl}
                alt={artwork.title}
                fill
                priority={i < 2}
                sizes="(min-width: 1024px) 24rem, (min-width: 640px) 22rem, 78vw"
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent opacity-80 transition-opacity group-hover:opacity-95" />
              <Badge className="absolute top-4 left-4 border-0 bg-white/80 text-foreground/80 backdrop-blur">
                {artwork.category}
              </Badge>
              <Sparkles className="absolute top-4 right-4 size-5 text-white drop-shadow" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <h3 className="font-display text-3xl leading-none">
                  {artwork.title}
                </h3>
                <p className="mt-2 text-sm text-white/80">
                  {[artwork.medium, artwork.year].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
          </Link>
        ))}
        <Link
          href="/gallery"
          className="group flex w-[60vw] shrink-0 snap-start flex-col items-center justify-center gap-3 rounded-[2rem] border border-dashed border-border bg-white/60 text-center transition-colors hover:border-primary/40 hover:bg-accent/40 sm:w-[16rem]"
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-brand-gradient text-white shadow-soft transition-transform group-hover:scale-110">
            <ArrowRight />
          </span>
          <span className="font-display text-2xl">Browse everything</span>
        </Link>
      </div>
    </section>
  );
}
