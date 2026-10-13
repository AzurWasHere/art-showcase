"use client";

import { Expand, Sparkles } from "lucide-react";
import Link from "next/link";
import { ArtworkImage } from "@/components/gallery/artwork-image";
import { Badge } from "@/components/ui/badge";
import type { Artwork } from "@/lib/artworks";
import { aspectRatioOf } from "@/lib/image";
import { cn } from "@/lib/utils";

interface ArtworkCardProps {
  artwork: Artwork;
  onQuickLook?: (artwork: Artwork) => void;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function ArtworkCard({
  artwork,
  onQuickLook,
  priority = false,
  className,
  style,
}: ArtworkCardProps) {
  const href = `/gallery/${artwork.slug}`;
  const meta = [artwork.medium, artwork.year].filter(Boolean).join(" · ");

  return (
    <article
      style={style}
      className={cn(
        "group card-lift relative flex flex-col overflow-hidden rounded-3xl bg-card ring-1 ring-foreground/8 shadow-soft",
        className,
      )}
    >
      <div
        className="relative w-full overflow-hidden bg-muted"
        style={{
          aspectRatio: aspectRatioOf(artwork.imageWidth, artwork.imageHeight),
        }}
      >
        <Link
          href={href}
          className="absolute inset-0 block"
          aria-label={`View ${artwork.title}`}
        >
          <ArtworkImage
            src={artwork.imageUrl}
            alt={artwork.title}
            fill
            priority={priority}
            sizes="(min-width: 1536px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
          />
        </Link>

        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <Badge className="glass border-0 bg-white/75 px-2.5 text-[11px] font-medium text-foreground/80 shadow-none">
            {artwork.category}
          </Badge>
          {artwork.featured && (
            <Badge className="border-0 bg-brand-gradient px-2 text-[11px] text-white shadow-soft">
              <Sparkles className="size-3!" /> Featured
            </Badge>
          )}
        </div>

        {onQuickLook && (
          <button
            type="button"
            onClick={() => onQuickLook(artwork)}
            className="absolute right-3 bottom-3 z-10 inline-flex size-9 translate-y-2 items-center justify-center rounded-full bg-white/85 text-foreground opacity-0 shadow-soft backdrop-blur transition-all duration-300 hover:bg-white focus-visible:translate-y-0 focus-visible:opacity-100 group-hover:translate-y-0 group-hover:opacity-100"
            aria-label={`Quick look at ${artwork.title}`}
          >
            <Expand className="size-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1 px-4 pt-3.5 pb-4">
        <h3 className="font-display text-xl leading-tight">
          <Link
            href={href}
            className="after:absolute after:inset-0 after:rounded-3xl focus-visible:outline-none"
          >
            <span className="relative">{artwork.title}</span>
          </Link>
        </h3>
        {meta && <p className="text-sm text-muted-foreground">{meta}</p>}
        {artwork.dimensions && (
          <p className="text-xs tracking-wide text-muted-foreground/80">
            {artwork.dimensions}
          </p>
        )}
      </div>
    </article>
  );
}
