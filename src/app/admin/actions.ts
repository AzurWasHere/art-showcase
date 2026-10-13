"use server";

import { unlink } from "node:fs/promises";
import path from "node:path";
import { del } from "@vercel/blob";
import { refresh, revalidateTag, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth";
import type { ArtworkFormState, ArtworkFormValues } from "@/lib/artwork-form";
import { CATEGORIES, isCategory, shortId, slugify } from "@/lib/artwork-shared";
import { ARTWORKS_TAG, artworkTag } from "@/lib/artworks";
import { db } from "@/lib/prisma";

type ParsedArtwork = {
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
};

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optional(value: string, max: number): string | null {
  return value.length === 0 ? null : value.slice(0, max);
}

function parseDimension(value: string): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 && n < 50_000 ? n : null;
}

function isAllowedImageUrl(url: string): boolean {
  if (url.startsWith("/uploads/")) return process.env.NODE_ENV !== "production";
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

function parseArtworkForm(
  formData: FormData,
): { ok: true; data: ParsedArtwork } | { ok: false; state: ArtworkFormState } {
  const values: ArtworkFormValues = {
    title: text(formData, "title"),
    description: text(formData, "description"),
    imageUrl: text(formData, "imageUrl"),
    imageWidth: text(formData, "imageWidth"),
    imageHeight: text(formData, "imageHeight"),
    medium: text(formData, "medium"),
    dimensions: text(formData, "dimensions"),
    year: text(formData, "year"),
    category: text(formData, "category"),
    featured: formData.get("featured") === "on",
  };
  const errors: ArtworkFormState["errors"] = {};

  if (values.title.length < 1 || values.title.length > 120) {
    errors.title = "Give the work a title (1–120 characters).";
  }
  if (!values.imageUrl) {
    errors.imageUrl = "Upload an image before publishing.";
  } else if (!isAllowedImageUrl(values.imageUrl)) {
    errors.imageUrl = "Image must be an https URL.";
  }
  if (!isCategory(values.category)) {
    errors.category = `Choose one of: ${CATEGORIES.join(", ")}.`;
  }
  const currentYear = new Date().getFullYear();
  let year: number | null = null;
  if (values.year) {
    const parsed = Number(values.year);
    if (
      !Number.isInteger(parsed) ||
      parsed < 1000 ||
      parsed > currentYear + 1
    ) {
      errors.year = `Year must be between 1000 and ${currentYear + 1}.`;
    } else {
      year = parsed;
    }
  }
  if (values.description.length > 2000) {
    errors.description = "Keep the description under 2000 characters.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      state: {
        status: "error",
        message: "Please fix the highlighted fields.",
        errors,
        values,
      },
    };
  }

  return {
    ok: true,
    data: {
      title: values.title,
      description: optional(values.description, 2000),
      imageUrl: values.imageUrl,
      imageWidth: parseDimension(values.imageWidth),
      imageHeight: parseDimension(values.imageHeight),
      medium: optional(values.medium, 120),
      dimensions: optional(values.dimensions, 120),
      year,
      category: values.category,
      featured: values.featured,
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
  _previous: ArtworkFormState,
  formData: FormData,
): Promise<ArtworkFormState> {
  const user = await requireAdmin();
  const parsed = parseArtworkForm(formData);
  if (!parsed.ok) return parsed.state;

  let slug: string;
  try {
    slug = await uniqueSlug(parsed.data.title);
    await db().artwork.create({
      data: { ...parsed.data, slug, authorId: await authorIdFor(user.id) },
    });
  } catch (error) {
    console.error("[admin] createArtwork failed:", error);
    return {
      status: "error",
      message:
        "The artwork couldn't be saved. Check the database connection and try again.",
      values: formValuesFrom(formData),
    };
  }

  invalidate(slug);
  redirect(`/gallery/${slug}?published=1`);
}

export async function updateArtworkAction(
  id: string,
  _previous: ArtworkFormState,
  formData: FormData,
): Promise<ArtworkFormState> {
  await requireAdmin();
  const parsed = parseArtworkForm(formData);
  if (!parsed.ok) return parsed.state;

  let slug: string;
  let previousImage: string | null = null;
  try {
    const existing = await db().artwork.findUnique({
      where: { id },
      select: { slug: true, imageUrl: true },
    });
    if (!existing) {
      return { status: "error", message: "This artwork no longer exists." };
    }
    slug = existing.slug;
    previousImage = existing.imageUrl;
    await db().artwork.update({ where: { id }, data: parsed.data });
  } catch (error) {
    console.error("[admin] updateArtwork failed:", error);
    return {
      status: "error",
      message: "Changes couldn't be saved. Please try again.",
      values: formValuesFrom(formData),
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

function formValuesFrom(formData: FormData): ArtworkFormValues {
  return {
    title: text(formData, "title"),
    description: text(formData, "description"),
    imageUrl: text(formData, "imageUrl"),
    imageWidth: text(formData, "imageWidth"),
    imageHeight: text(formData, "imageHeight"),
    medium: text(formData, "medium"),
    dimensions: text(formData, "dimensions"),
    year: text(formData, "year"),
    category: text(formData, "category"),
    featured: formData.get("featured") === "on",
  };
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
