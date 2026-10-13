import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/prisma";

/** Cache tag covering every artwork read. Mutations call `updateTag(ARTWORKS_TAG)`. */
export const ARTWORKS_TAG = "artworks";
export const artworkTag = (slug: string) => `artwork:${slug}`;

/** Serialisable artwork shape shared by Server and Client Components. */
export type Artwork = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  imageUrl: string;
  imageWidth: number | null;
  imageHeight: number | null;
  medium: string | null;
  dimensions: string | null;
  year: number | null;
  category: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CollectionStats = {
  total: number;
  featured: number;
  categories: { name: string; count: number }[];
  yearRange: [number, number] | null;
};

type Row = Awaited<
  ReturnType<ReturnType<typeof db>["artwork"]["findMany"]>
>[number];

function serialize(row: Row): Artwork {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    imageUrl: row.imageUrl,
    imageWidth: row.imageWidth,
    imageHeight: row.imageHeight,
    medium: row.medium,
    dimensions: row.dimensions,
    year: row.year,
    category: row.category,
    featured: row.featured,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Every artwork, newest first. Cached into the static shell; freshness is
 * driven by tags (`updateTag` after each mutation) rather than time.
 *
 * If the database is unreachable (for example during a build that runs before
 * storage is attached) we return an empty list with a very short lifetime, so
 * the gallery becomes a request-time hole and recovers on the next visit
 * instead of baking an empty collection into the prerender.
 */
export async function getArtworks(): Promise<Artwork[]> {
  "use cache";
  cacheTag(ARTWORKS_TAG);
  try {
    const rows = await db().artwork.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    cacheLife("days");
    return rows.map(serialize);
  } catch (error) {
    console.error("[artworks] getArtworks failed:", error);
    cacheLife("seconds");
    return [];
  }
}

export async function getArtworkBySlug(slug: string): Promise<Artwork | null> {
  "use cache";
  cacheTag(ARTWORKS_TAG, artworkTag(slug));
  try {
    const row = await db().artwork.findUnique({ where: { slug } });
    if (!row) {
      cacheLife("minutes");
      return null;
    }
    cacheLife("days");
    return serialize(row);
  } catch (error) {
    console.error(`[artworks] getArtworkBySlug(${slug}) failed:`, error);
    cacheLife("seconds");
    return null;
  }
}

/** Featured pieces for the home page; falls back to the newest work if nothing is flagged. */
export async function getFeaturedArtworks(limit = 6): Promise<Artwork[]> {
  const all = await getArtworks();
  const featured = all.filter((a) => a.featured);
  return (featured.length > 0 ? featured : all).slice(0, limit);
}

/** Previous/next neighbours in gallery order, wrapping at the ends. */
export async function getArtworkNeighbors(
  slug: string,
): Promise<{ previous: Artwork | null; next: Artwork | null }> {
  const all = await getArtworks();
  const index = all.findIndex((a) => a.slug === slug);
  if (index === -1 || all.length < 2) return { previous: null, next: null };
  return {
    previous: all[(index - 1 + all.length) % all.length] ?? null,
    next: all[(index + 1) % all.length] ?? null,
  };
}

export async function getCollectionStats(): Promise<CollectionStats> {
  const all = await getArtworks();
  const counts = new Map<string, number>();
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const a of all) {
    counts.set(a.category, (counts.get(a.category) ?? 0) + 1);
    if (a.year != null) {
      min = Math.min(min, a.year);
      max = Math.max(max, a.year);
    }
  }
  return {
    total: all.length,
    featured: all.filter((a) => a.featured).length,
    categories: [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((x, y) => y.count - x.count || x.name.localeCompare(y.name)),
    yearRange: Number.isFinite(min) ? [min, max] : null,
  };
}

/** Uncached read for the admin edit form, so curators always see the latest row. */
export async function getArtworkByIdFresh(id: string): Promise<Artwork | null> {
  const row = await db().artwork.findUnique({ where: { id } });
  return row ? serialize(row) : null;
}
