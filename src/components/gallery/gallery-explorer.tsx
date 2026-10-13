"use client";

import { SearchX } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArtworkCard } from "@/components/gallery/artwork-card";
import { FilterBar, type SortKey } from "@/components/gallery/filter-bar";
import { Lightbox } from "@/components/gallery/lightbox";
import { Button } from "@/components/ui/button";
import type { Artwork } from "@/lib/artworks";

interface GalleryExplorerProps {
  artworks: Artwork[];
  categories: { name: string; count: number }[];
}

const SORTS: Record<SortKey, (a: Artwork, b: Artwork) => number> = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
  title: (a, b) => a.title.localeCompare(b.title),
  year: (a, b) =>
    (b.year ?? 0) - (a.year ?? 0) || a.title.localeCompare(b.title),
};

function isSortKey(value: string | null): value is SortKey {
  return (
    value === "newest" ||
    value === "oldest" ||
    value === "title" ||
    value === "year"
  );
}

export function GalleryExplorer({
  artworks,
  categories,
}: GalleryExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [category, setCategory] = useState(
    () => searchParams.get("category") ?? "All",
  );
  const [featuredOnly, setFeaturedOnly] = useState(
    () => searchParams.get("featured") === "1",
  );
  const [sort, setSort] = useState<SortKey>(() => {
    const value = searchParams.get("sort");
    return isSortKey(value) ? value : "newest";
  });
  const [active, setActive] = useState<string | null>(null);

  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return artworks
      .filter((a) => {
        if (category !== "All" && a.category !== category) return false;
        if (featuredOnly && !a.featured) return false;
        if (!q) return true;
        return [
          a.title,
          a.medium,
          a.description,
          a.category,
          String(a.year ?? ""),
        ]
          .filter(Boolean)
          .some((field) => field?.toLowerCase().includes(q));
      })
      .sort(SORTS[sort]);
  }, [artworks, deferredQuery, category, featuredOnly, sort]);

  // Reflect filter state in the URL (replace, not push) so views are shareable.
  const initialised = useRef(false);
  useEffect(() => {
    if (!initialised.current) {
      initialised.current = true;
      return;
    }
    const params = new URLSearchParams();
    if (deferredQuery.trim()) params.set("q", deferredQuery.trim());
    if (category !== "All") params.set("category", category);
    if (featuredOnly) params.set("featured", "1");
    if (sort !== "newest") params.set("sort", sort);
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [deferredQuery, category, featuredOnly, sort, pathname, router]);

  const activeIndex = active ? filtered.findIndex((a) => a.id === active) : -1;
  const activeArtwork = activeIndex >= 0 ? filtered[activeIndex] : null;

  const navigate = useCallback(
    (direction: 1 | -1) => {
      if (activeIndex < 0 || filtered.length === 0) return;
      const next =
        (activeIndex + direction + filtered.length) % filtered.length;
      setActive(filtered[next].id);
    },
    [activeIndex, filtered],
  );

  function clearFilters() {
    setQuery("");
    setCategory("All");
    setFeaturedOnly(false);
    setSort("newest");
  }

  const hasFilters = query !== "" || category !== "All" || featuredOnly;

  return (
    <>
      <FilterBar
        query={query}
        onQueryChange={setQuery}
        category={category}
        onCategoryChange={setCategory}
        categories={categories}
        total={artworks.length}
        featuredOnly={featuredOnly}
        onFeaturedOnlyChange={setFeaturedOnly}
        sort={sort}
        onSortChange={setSort}
      />

      <div className="mt-8 flex items-center justify-between text-sm text-muted-foreground">
        <p aria-live="polite">
          Showing{" "}
          <span className="font-medium text-foreground">{filtered.length}</span>{" "}
          of {artworks.length} works
        </p>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            onClick={clearFilters}
          >
            Clear filters
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-white/60 px-6 py-20 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <SearchX className="size-6" />
          </span>
          <div>
            <h2 className="font-display text-2xl">Nothing matches that view</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Try another category or clear the search.
            </p>
          </div>
          <Button
            variant="secondary"
            className="rounded-full"
            onClick={clearFilters}
          >
            Show everything
          </Button>
        </div>
      ) : (
        <div
          key={`${category}-${featuredOnly}-${sort}`}
          className="masonry mt-6 columns-1 sm:columns-2 lg:columns-3 2xl:columns-4"
        >
          {filtered.map((artwork, i) => (
            <ArtworkCard
              key={artwork.id}
              artwork={artwork}
              onQuickLook={(a) => setActive(a.id)}
              priority={i < 4}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(i, 11) * 45}ms` }}
            />
          ))}
        </div>
      )}

      <Lightbox
        artwork={activeArtwork}
        index={activeIndex}
        total={filtered.length}
        onClose={() => setActive(null)}
        onNavigate={navigate}
      />
    </>
  );
}
