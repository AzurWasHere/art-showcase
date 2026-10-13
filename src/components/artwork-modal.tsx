"use client";

import { Check, Link2, Mail } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Artwork } from "@/lib/artworks";

interface ArtworkModalProps {
  artwork: Artwork | null;
  onClose: () => void;
}

function Detail({ label, value }: { label: string; value?: string | number }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

export function ArtworkModal({ artwork, onClose }: ArtworkModalProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (!artwork) return;
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/#${artwork.id}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Dialog
      open={artwork !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-5xl">
        {artwork && (
          <div className="grid md:grid-cols-[1.5fr_1fr]">
            <div className="flex items-center justify-center bg-muted">
              {/* biome-ignore lint/performance/noImgElement: remote, blob and data URLs */}
              <img
                src={artwork.imageUrl}
                alt={artwork.title}
                className="max-h-[70vh] w-full object-contain md:max-h-[88vh]"
              />
            </div>
            <div className="flex flex-col gap-5 p-6">
              <div className="flex flex-wrap gap-1.5">
                <Badge className="bg-secondary text-secondary-foreground">
                  {artwork.category}
                </Badge>
                {artwork.featured && (
                  <Badge className="bg-accent text-accent-foreground">
                    Featured
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-2xl leading-tight">
                {artwork.title}
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                {artwork.description || "No description provided."}
              </DialogDescription>
              <dl className="grid grid-cols-2 gap-4">
                <Detail label="Category" value={artwork.category} />
                <Detail label="Year" value={artwork.year} />
                <Detail label="Medium" value={artwork.medium} />
                <Detail label="Dimensions" value={artwork.dimensions} />
                <Detail
                  label="Created"
                  value={new Date(artwork.createdAt).toLocaleDateString(
                    "en-US",
                    { year: "numeric", month: "long", day: "numeric" },
                  )}
                />
              </dl>
              <div className="mt-auto flex flex-col gap-2">
                <Button
                  size="lg"
                  nativeButton={false}
                  render={
                    // biome-ignore lint/a11y/useAnchorContent: content is injected by Button via render prop
                    <a
                      href={`mailto:curator@artshowcase.com?subject=${encodeURIComponent(
                        `Inquiry: ${artwork.title}`,
                      )}`}
                    />
                  }
                >
                  <Mail /> Inquire / Collector Note
                </Button>
                <Button size="lg" variant="outline" onClick={copyLink}>
                  {copied ? <Check /> : <Link2 />}
                  {copied ? "Link Copied" : "Copy Link"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
