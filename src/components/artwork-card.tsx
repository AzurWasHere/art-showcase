"use client";

import { Check, Heart, Loader2, Maximize2, Share2, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Artwork } from "@/lib/artworks";

interface ArtworkCardProps {
  artwork: Artwork;
  isAdmin: boolean;
  onOpen: (artwork: Artwork) => void;
  onDelete: (artwork: Artwork) => Promise<void>;
}

export function ArtworkCard({
  artwork,
  isAdmin,
  onOpen,
  onDelete,
}: ArtworkCardProps) {
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/#${artwork.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${artwork.title}"?`)) return;
    setDeleting(true);
    try {
      await onDelete(artwork);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article
      id={artwork.id}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10"
    >
      <button
        type="button"
        onClick={() => onOpen(artwork)}
        className="relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden bg-muted"
        aria-label={`View details for ${artwork.title}`}
      >
        {/* biome-ignore lint/performance/noImgElement: remote, blob and data URLs */}
        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge className="bg-secondary text-secondary-foreground">
            {artwork.category}
          </Badge>
          {artwork.featured && (
            <Badge className="bg-accent text-accent-foreground">Featured</Badge>
          )}
        </div>
      </button>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight">{artwork.title}</h3>
            {artwork.year && <Badge variant="outline">{artwork.year}</Badge>}
          </div>
          {artwork.medium && (
            <p className="mt-1 text-sm text-muted-foreground">
              {artwork.medium}
            </p>
          )}
          {artwork.dimensions && (
            <p className="text-xs text-muted-foreground">
              {artwork.dimensions}
            </p>
          )}
        </div>

        <div className="mt-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpen(artwork)}
            aria-label="View details"
          >
            <Maximize2 /> View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLiked((v) => !v)}
            aria-pressed={liked}
            aria-label="Like"
            className={liked ? "text-primary" : undefined}
          >
            <Heart className={liked ? "fill-primary" : undefined} />
            {(artwork.featured ? 12 : 4) + (liked ? 1 : 0)}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            aria-label="Copy share link"
          >
            {copied ? <Check /> : <Share2 />}
            {copied ? "Copied" : null}
          </Button>
          {isAdmin && (
            <Button
              variant="destructive"
              size="icon-sm"
              className="ml-auto"
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Delete artwork"
            >
              {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
