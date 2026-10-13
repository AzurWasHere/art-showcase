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

export function extensionForMime(type: string): string {
  switch (type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/avif":
      return "avif";
    case "image/gif":
      return "gif";
    default:
      return "bin";
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
