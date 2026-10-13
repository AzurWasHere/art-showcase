/** Allowed artwork categories (admin form options). */
export const CATEGORIES = [
  "Paintings",
  "Digital Art",
  "Photography",
  "Sculpture",
  "Works on Paper",
  "Mixed Media",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: unknown): value is Category {
  return (
    typeof value === "string" &&
    (CATEGORIES as readonly string[]).includes(value)
  );
}

/** URL-safe slug: lowercase, ASCII, hyphen separated, max 80 chars. */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Short random suffix used to de-duplicate slugs and file names. */
export function shortId(length = 6): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}
