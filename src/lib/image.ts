/**
 * Image helpers shared by Server and Client Components (no server-only imports).
 */

/** Hosts that `next/image` is allowed to optimise (mirrors next.config.ts). */
const OPTIMIZABLE_HOSTS = [
  /^images\.unsplash\.com$/,
  /\.public\.blob\.vercel-storage\.com$/,
];

export function isOptimizableImage(src: string): boolean {
  if (src.startsWith("/")) return true;
  try {
    const { protocol, hostname } = new URL(src);
    return (
      protocol === "https:" && OPTIMIZABLE_HOSTS.some((re) => re.test(hostname))
    );
  } catch {
    return false;
  }
}

/** Local Vercel Blob emulator origin (docker compose); unset in production. */
const BLOB_EMULATOR_ORIGIN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_VERCEL_BLOB_API_URL ?? "").origin;
  } catch {
    return null;
  }
})();

/** True for files in our blob store, i.e. ones we uploaded and may delete. */
export function isBlobUrl(url: string): boolean {
  try {
    const { origin, protocol, hostname } = new URL(url);
    return (
      (protocol === "https:" &&
        hostname.endsWith(".public.blob.vercel-storage.com")) ||
      origin === BLOB_EMULATOR_ORIGIN
    );
  } catch {
    return false;
  }
}

/** Aspect ratio as a CSS value, defaulting to a gallery-friendly 4:5. */
export function aspectRatioOf(
  width?: number | null,
  height?: number | null,
): string {
  if (width && height && width > 0 && height > 0) return `${width} / ${height}`;
  return "4 / 5";
}

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
] as const;

export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
