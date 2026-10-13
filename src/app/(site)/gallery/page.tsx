import type { Metadata } from "next";
import { Suspense } from "react";
import { GalleryExplorer } from "@/components/gallery/gallery-explorer";
import {
  FilterBarSkeleton,
  GallerySkeleton,
} from "@/components/gallery/skeletons";
import { getArtworks, getCollectionStats } from "@/lib/artworks";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Browse the full AURA collection — paintings, works on paper, photography, digital and mixed media.",
};

export default function GalleryPage() {
  return (
    <div className="pastel-mesh">
      <div className="mx-auto max-w-7xl px-4 pt-14 pb-24 sm:px-6 lg:px-8">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            The collection
          </p>
          <h1 className="mt-3 font-display text-5xl leading-[0.95] sm:text-7xl">
            Gallery
          </h1>
          <Suspense
            fallback={<p className="mt-4 h-6 w-64 rounded-full shimmer" />}
          >
            <GalleryIntro />
          </Suspense>
        </header>

        <div className="mt-10">
          <Suspense
            fallback={
              <>
                <FilterBarSkeleton />
                <div className="mt-14">
                  <GallerySkeleton />
                </div>
              </>
            }
          >
            <GalleryContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function GalleryIntro() {
  const stats = await getCollectionStats();
  return (
    <p className="mt-4 text-lg text-muted-foreground">
      {stats.total} works across {stats.categories.length} disciplines
      {stats.yearRange
        ? `, made between ${stats.yearRange[0]} and ${stats.yearRange[1]}`
        : ""}
      . Search, filter, or open any piece for a closer look.
    </p>
  );
}

async function GalleryContent() {
  const [artworks, stats] = await Promise.all([
    getArtworks(),
    getCollectionStats(),
  ]);
  return <GalleryExplorer artworks={artworks} categories={stats.categories} />;
}
