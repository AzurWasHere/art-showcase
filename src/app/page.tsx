"use client";

import { Loader2, SearchX } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { ArtworkCard } from "@/components/artwork-card";
import { ArtworkModal } from "@/components/artwork-modal";
import { Footer } from "@/components/footer";
import { HeroBanner } from "@/components/hero-banner";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { UploadModal } from "@/components/upload-modal";
import type { Artwork } from "@/lib/artworks";

export default function Home() {
  const { data: session } = useSession();
  const isAdmin = Boolean(session?.user);

  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [selected, setSelected] = useState<Artwork | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/artworks")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json() as Promise<Artwork[]>;
      })
      .then((data) => {
        if (!cancelled) setArtworks(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(() => {
    const result: Record<string, number> = { All: artworks.length };
    for (const a of artworks)
      result[a.category] = (result[a.category] ?? 0) + 1;
    return result;
  }, [artworks]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return artworks.filter((a) => {
      if (category !== "All" && a.category !== category) return false;
      if (featuredOnly && !a.featured) return false;
      if (!q) return true;
      return [a.title, a.medium, a.description, a.category]
        .filter(Boolean)
        .some((field) => field?.toLowerCase().includes(q));
    });
  }, [artworks, search, category, featuredOnly]);

  async function handleDelete(artwork: Artwork) {
    const res = await fetch(`/api/artworks/${artwork.id}`, {
      method: "DELETE",
    });
    if (res.ok || res.status === 404) {
      setArtworks((prev) => prev.filter((a) => a.id !== artwork.id));
    } else {
      window.alert("Could not delete artwork.");
    }
  }

  function clearFilters() {
    setSearch("");
    setCategory("All");
    setFeaturedOnly(false);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar onAddArtwork={() => setUploadOpen(true)} />
      <HeroBanner
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        featuredOnly={featuredOnly}
        onFeaturedOnlyChange={setFeaturedOnly}
        counts={counts}
      />

      <main
        id="gallery"
        className="mx-auto w-full max-w-7xl flex-1 scroll-mt-20 px-4 py-12 sm:px-6"
      >
        <span id="featured" className="sr-only" />
        {loading ? (
          <div className="flex justify-center py-20 text-primary">
            <Loader2 className="size-8 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <SearchX className="size-6" />
            </span>
            <h2 className="text-xl font-semibold">
              {loadError ? "Could not load artworks" : "No artworks found"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {loadError
                ? "Please refresh the page to try again."
                : "Try a different search or clear your filters."}
            </p>
            {!loadError && (
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((artwork) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                isAdmin={isAdmin}
                onOpen={setSelected}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      <ArtworkModal artwork={selected} onClose={() => setSelected(null)} />
      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onArtworkCreated={(artwork) =>
          setArtworks((prev) => [artwork, ...prev])
        }
      />
      <Footer />
    </div>
  );
}
