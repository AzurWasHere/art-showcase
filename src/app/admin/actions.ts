"use server";

import { unlink } from "node:fs/promises";
import path from "node:path";
import { del } from "@vercel/blob";
import { refresh, revalidateTag, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/auth";
import {
  type ArtworkActionResult,
  type ArtworkData,
  artworkSchema,
} from "@/lib/artwork-schema";
import { shortId, slugify } from "@/lib/artwork-shared";
import { ARTWORKS_TAG, artworkTag } from "@/lib/artworks";
import { db } from "@/lib/prisma";

/** Re-validate on the server: the client schema is a convenience, not a guard. */
function parseArtwork(
  values: unknown,
):
  | { ok: true; data: ArtworkData }
  | { ok: false; result: ArtworkActionResult } {
  const parsed = artworkSchema.safeParse(values);
  if (parsed.success) return { ok: true, data: parsed.data };
  const { fieldErrors } = z.flattenError(parsed.error);
  return {
    ok: false,
    result: {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: Object.fromEntries(
        Object.entries(fieldErrors).map(([key, messages]) => [
          key,
          messages?.[0],
        ]),
      ),
    },
  };
}
async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || "untitled";
  const existing = await db().artwork.findUnique({
    where: { slug: base },
    select: { id: true },
  });
  return existing ? `${base}-${shortId(4)}` : base;
}

async function authorIdFor(userId: string): Promise<string | null> {
  if (userId === "env-admin") return null;
  const user = await db().user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  return user?.id ?? null;
}

function invalidate(slug?: string) {
  updateTag(ARTWORKS_TAG);
  if (slug) updateTag(artworkTag(slug));
}

export async function createArtworkAction(
  values: unknown,
): Promise<ArtworkActionResult> {
  const user = await requireAdmin();
  const parsed = parseArtwork(values);
  if (!parsed.ok) return parsed.result;

  let slug: string;
  try {
    slug = await uniqueSlug(parsed.data.title);
    await db().artwork.create({
      data: { ...parsed.data, slug, authorId: await authorIdFor(user.id) },
    });
  } catch (error) {
    console.error("[admin] createArtwork failed:", error);
    return {
      ok: false,
      message:
        "The artwork couldn't be saved. Check the database connection and try again.",
    };
  }

  invalidate(slug);
  redirect(`/gallery/${slug}?published=1`);
}

export async function updateArtworkAction(
  id: string,
  values: unknown,
): Promise<ArtworkActionResult> {
  await requireAdmin();
  const parsed = parseArtwork(values);
  if (!parsed.ok) return parsed.result;

  let slug: string;
  let previousImage: string | null = null;
  try {
    const existing = await db().artwork.findUnique({
      where: { id },
      select: { slug: true, imageUrl: true },
    });
    if (!existing) {
      return { ok: false, message: "This artwork no longer exists." };
    }
    slug = existing.slug;
    previousImage = existing.imageUrl;
    await db().artwork.update({ where: { id }, data: parsed.data });
  } catch (error) {
    console.error("[admin] updateArtwork failed:", error);
    return {
      ok: false,
      message: "Changes couldn't be saved. Please try again.",
    };
  }

  if (previousImage && previousImage !== parsed.data.imageUrl) {
    await removeStoredImage(previousImage);
  }
  invalidate(slug);
  redirect(`/gallery/${slug}?updated=1`);
}
export async function deleteArtworkAction(
  id: string,
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  try {
    const existing = await db().artwork.delete({
      where: { id },
      select: { slug: true, title: true, imageUrl: true },
    });
    await removeStoredImage(existing.imageUrl);
    invalidate(existing.slug);
    refresh();
    return { ok: true, message: `"${existing.title}" was removed.` };
  } catch (error) {
    console.error("[admin] deleteArtwork failed:", error);
    return { ok: false, message: "Couldn't delete this artwork." };
  }
}

export async function setFeaturedAction(
  id: string,
  featured: boolean,
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  try {
    const updated = await db().artwork.update({
      where: { id },
      data: { featured },
      select: { slug: true, title: true },
    });
    invalidate(updated.slug);
    refresh();
    return {
      ok: true,
      message: featured
        ? `"${updated.title}" is now featured.`
        : `"${updated.title}" removed from featured.`,
    };
  } catch (error) {
    console.error("[admin] setFeatured failed:", error);
    return { ok: false, message: "Couldn't update this artwork." };
  }
}

export async function revalidateGalleryAction(): Promise<{
  ok: boolean;
  message: string;
}> {
  await requireAdmin();
  revalidateTag(ARTWORKS_TAG, "max");
  refresh();
  return { ok: true, message: "Gallery cache refreshed." };
}

/** Best-effort cleanup of the stored image (Vercel Blob or local dev upload). */
async function removeStoredImage(url: string) {
  try {
    if (
      url.includes(".public.blob.vercel-storage.com") &&
      process.env.BLOB_READ_WRITE_TOKEN
    ) {
      await del(url);
    } else if (
      url.startsWith("/uploads/") &&
      process.env.NODE_ENV !== "production"
    ) {
      // Uploads are flat files; basename keeps the delete inside public/uploads.
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await unlink(path.join(uploadsDir, path.basename(url)));
    }
  } catch (error) {
    console.warn("[admin] could not remove stored image:", error);
  }
}
