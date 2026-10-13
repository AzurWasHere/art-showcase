import Image, { type ImageProps } from "next/image";
import { isOptimizableImage } from "@/lib/image";

type ArtworkImageProps = Omit<ImageProps, "src" | "alt" | "unoptimized"> & {
  src: string;
  alt: string;
};

/**
 * `next/image` with a safety valve: sources outside the configured
 * `remotePatterns` (e.g. a pasted URL from an unknown host) are rendered
 * unoptimised instead of throwing at render time.
 */
export function ArtworkImage({ src, alt, ...props }: ArtworkImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      unoptimized={!isOptimizableImage(src)}
      {...props}
    />
  );
}
