import { ArrowLeft, ArrowRight, Mail, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArtworkImage } from "@/components/gallery/artwork-image";
import { ArtworkMeta } from "@/components/gallery/artwork-meta";
import { ShareButton } from "@/components/gallery/share-button";
import { ArtworkDetailSkeleton } from "@/components/gallery/skeletons";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  type Artwork,
  getArtworkBySlug,
  getArtworkNeighbors,
  getArtworks,
} from "@/lib/artworks";
import { aspectRatioOf } from "@/lib/image";
import { cn } from "@/lib/utils";

export async function generateStaticParams() {
  const artworks = await getArtworks();
  return artworks.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/gallery/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const artwork = await getArtworkBySlug(slug);
  if (!artwork) return { title: "Artwork not found" };
  const description =
    artwork.description ??
    [artwork.medium, artwork.dimensions, artwork.year]
      .filter(Boolean)
      .join(" · ");
  return {
    title: artwork.title,
    description,
    openGraph: {
      title: `${artwork.title} · AURA`,
      description,
      images: [{ url: artwork.imageUrl, alt: artwork.title }],
    },
  };
}

export default function ArtworkPage({ params }: PageProps<"/gallery/[slug]">) {
  return (
    <Suspense fallback={<ArtworkDetailSkeleton />}>
      {params.then(({ slug }) => (
        <ArtworkDetail slug={slug} />
      ))}
    </Suspense>
  );
}

async function ArtworkDetail({ slug }: { slug: string }) {
  const artwork = await getArtworkBySlug(slug);
  if (!artwork) notFound();

  const [{ previous, next }, all] = await Promise.all([
    getArtworkNeighbors(slug),
    getArtworks(),
  ]);
  const related = all
    .filter((a) => a.category === artwork.category && a.id !== artwork.id)
    .slice(0, 3);

  const inquiry = `mailto:studio@aura.gallery?subject=${encodeURIComponent(
    `Enquiry: ${artwork.title}`,
  )}&body=${encodeURIComponent(
    `Hello,\n\nI'd like to know more about "${artwork.title}" (${artwork.medium ?? "mixed media"}${artwork.year ? `, ${artwork.year}` : ""}).\n\nThanks`,
  )}`;

  return (
    <article>
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <Link
          href="/gallery"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to gallery
        </Link>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(20rem,1fr)] lg:gap-16 lg:px-8">
        <figure className="relative">
          <div className="pastel-mesh grain overflow-hidden rounded-[2rem] p-4 ring-1 ring-foreground/8 sm:p-8">
            <div
              className="relative mx-auto max-h-[80vh] w-full"
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
                priority
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="rounded-xl object-contain shadow-lift"
              />
            </div>
          </div>
          <figcaption className="mt-3 text-center text-xs text-muted-foreground">
            {artwork.title}
            {artwork.year ? `, ${artwork.year}` : ""}
            {artwork.medium ? ` — ${artwork.medium}` : ""}
          </figcaption>
        </figure>

        <div className="flex flex-col gap-7 lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-secondary text-secondary-foreground">
              {artwork.category}
            </Badge>
            {artwork.featured && (
              <Badge className="border-0 bg-brand-gradient text-white">
                <Sparkles /> Featured
              </Badge>
            )}
          </div>

          <div>
            <h1 className="font-display text-5xl leading-[0.95] text-balance sm:text-6xl">
              {artwork.title}
            </h1>
            {artwork.description && (
              <p className="mt-5 text-base leading-relaxed text-foreground/75">
                {artwork.description}
              </p>
            )}
          </div>

          <ArtworkMeta
            artwork={artwork}
            className="rounded-3xl bg-white/70 px-5 ring-1 ring-foreground/8"
          />

          <div className="flex flex-wrap gap-2">
            <a
              href={inquiry}
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 rounded-full bg-brand-gradient px-5 text-white hover:opacity-95",
              )}
            >
              <Mail /> Enquire about this work
            </a>
            <ShareButton
              path={`/gallery/${artwork.slug}`}
              title={artwork.title}
              className="h-11 rounded-full px-5"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Added{" "}
            {new Date(artwork.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
              timeZone: "UTC",
            })}
          </p>
        </div>
      </div>

      {(previous || next) && (
        <nav
          aria-label="Neighbouring artworks"
          className="mx-auto grid max-w-7xl gap-4 px-4 pb-6 sm:grid-cols-2 sm:px-6 lg:px-8"
        >
          {previous && <NeighborLink artwork={previous} direction="previous" />}
          {next && <NeighborLink artwork={next} direction="next" />}
        </nav>
      )}

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-6">
            <h2 className="font-display text-3xl sm:text-4xl">
              More {artwork.category.toLowerCase()}
            </h2>
            <Link
              href={`/gallery?category=${encodeURIComponent(artwork.category)}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/gallery/${item.slug}`}
                className="group card-lift overflow-hidden rounded-3xl bg-card ring-1 ring-foreground/8 shadow-soft"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                  <ArtworkImage
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes="(min-width: 640px) 30vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-display text-xl leading-tight">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[item.medium, item.year].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function NeighborLink({
  artwork,
  direction,
}: {
  artwork: Artwork;
  direction: "previous" | "next";
}) {
  const isNext = direction === "next";
  return (
    <Link
      href={`/gallery/${artwork.slug}`}
      className={`group flex items-center gap-4 rounded-3xl bg-white/70 p-3 ring-1 ring-foreground/8 transition-colors hover:bg-white ${
        isNext ? "sm:flex-row-reverse sm:text-right" : ""
      }`}
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-muted">
        <ArtworkImage
          src={artwork.imageUrl}
          alt=""
          fill
          sizes="80px"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {!isNext && <ArrowLeft className="size-3.5" />}
          {isNext ? "Next" : "Previous"}
          {isNext && <ArrowRight className="size-3.5" />}
        </p>
        <p className="mt-1 truncate font-display text-xl">{artwork.title}</p>
      </div>
    </Link>
  );
}
