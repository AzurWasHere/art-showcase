import { z } from "zod";
import { CATEGORIES } from "@/lib/artwork-shared";

/**
 * Single source of truth for the artwork form. TanStack Form validates the
 * input shape on the client; the server actions re-parse with the same schema
 * and store the transformed output.
 */

const MAX_YEAR = new Date().getFullYear() + 1;

/** Local `/uploads/` files only exist in development; otherwise require https. */
export function isAllowedImageUrl(url: string): boolean {
  if (url.startsWith("/uploads/")) return process.env.NODE_ENV !== "production";
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

const optionalText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
    .transform((value) => (value === "" ? null : value));

const pixels = z.number().int().positive().max(50_000).nullable();

export const artworkSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Give the work a title.")
      .max(120, "Keep the title under 120 characters."),
    description: optionalText("Description", 2000),
    image: z
      .object({ url: z.string().trim(), width: pixels, height: pixels })
      .refine((image) => image.url !== "", "Upload an image before saving.")
      .refine(
        (image) => image.url === "" || isAllowedImageUrl(image.url),
        "Use an uploaded image or a full https:// URL.",
      ),
    medium: optionalText("Medium", 120),
    dimensions: optionalText("Dimensions", 120),
    year: z
      .string()
      .trim()
      .refine(
        (value) =>
          value === "" ||
          (/^\d{4}$/.test(value) &&
            Number(value) >= 1000 &&
            Number(value) <= MAX_YEAR),
        `Year must be between 1000 and ${MAX_YEAR}.`,
      )
      .transform((value) => (value === "" ? null : Number(value))),
    category: z.enum(CATEGORIES, "Choose a category."),
    featured: z.boolean(),
  })
  .transform(({ image, ...rest }) => ({
    ...rest,
    imageUrl: image.url,
    imageWidth: image.width,
    imageHeight: image.height,
  }));

/** What the form edits. */
export type ArtworkFormValues = z.input<typeof artworkSchema>;
/** What gets written to the database. */
export type ArtworkData = z.output<typeof artworkSchema>;

/** Only failures come back; success redirects on the server. */
export type ArtworkActionResult = {
  ok: false;
  message: string;
  fieldErrors?: Partial<Record<keyof ArtworkFormValues, string>>;
};
