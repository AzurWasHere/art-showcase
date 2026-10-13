"use client";

import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { ArtworkImage } from "@/components/gallery/artwork-image";
import { ArtworkMeta } from "@/components/gallery/artwork-meta";
import { ShareButton } from "@/components/gallery/share-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Artwork } from "@/lib/artworks";
import { aspectRatioOf } from "@/lib/image";

interface LightboxProps {
  artwork: Artwork | null;
  index: number;
  total: number;
  onClose: () => void;
  onNavigate: (direction: 1 | -1) => void;
}

export function Lightbox({
  artwork,
  index,
  total,
  onClose,
  onNavigate,
}: LightboxProps) {
  const open = artwork !== null;

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      onNavigate(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      onNavigate(-1);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="max-h-[94vh] w-[calc(100%-1.5rem)] overflow-hidden rounded-3xl p-0 sm:max-w-6xl"
        showCloseButton
        onKeyDown={handleKeyDown}
      >
        {artwork && (
          <div className="grid max-h-[94vh] md:grid-cols-[minmax(0,1.6fr)_minmax(18rem,1fr)]">
            <div className="relative flex items-center justify-center bg-[radial-gradient(ellipse_at_center,oklch(0.96_0.02_320),oklch(0.93_0.03_310))] p-4 md:p-8">
              <div
                className="relative max-h-[52vh] w-full md:max-h-[86vh]"
                style={{
                  aspectRatio: aspectRatioOf(
                    artwork.imageWidth,
                    artwork.imageHeight,
                  ),
                }}
              >
                <ArtworkImage
                  key={artwork.id}
                  src={artwork.imageUrl}
                  alt={artwork.title}
                  fill
                  priority
                  sizes="(min-width: 768px) 60vw, 100vw"
                  className="rounded-xl object-contain shadow-lift"
                />
              </div>

              {total > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur"
                    onClick={() => onNavigate(-1)}
                    aria-label="Previous artwork"
                  >
                    <ChevronLeft />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur"
                    onClick={() => onNavigate(1)}
                    aria-label="Next artwork"
                  >
                    <ChevronRight />
                  </Button>
                </>
              )}
            </div>

            <div className="flex min-h-0 flex-col gap-5 overflow-y-auto p-6 md:p-8">
              <div className="flex items-center gap-2">
                <Badge className="bg-secondary text-secondary-foreground">
                  {artwork.category}
                </Badge>
                {artwork.featured && (
                  <Badge className="border-0 bg-brand-gradient text-white">
                    <Sparkles /> Featured
                  </Badge>
                )}
                <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                  {index + 1} / {total}
                </span>
              </div>

              <div>
                <DialogTitle className="font-display text-3xl leading-tight">
                  {artwork.title}
                </DialogTitle>
                <DialogDescription className="mt-3 text-sm leading-relaxed text-foreground/75">
                  {artwork.description ??
                    "No description has been written for this piece yet."}
                </DialogDescription>
              </div>

              <ArtworkMeta artwork={artwork} />

              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                <Button
                  nativeButton={false}
                  render={<Link href={`/gallery/${artwork.slug}`} />}
                  className="rounded-full"
                >
                  Open page <ArrowUpRight />
                </Button>
                <ShareButton
                  path={`/gallery/${artwork.slug}`}
                  title={artwork.title}
                  className="rounded-full"
                />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
