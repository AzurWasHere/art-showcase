import type { Artwork } from "@/lib/artworks";

export function ArtworkMeta({
  artwork,
  className,
}: {
  artwork: Artwork;
  className?: string;
}) {
  const rows: { label: string; value: string | number | null }[] = [
    { label: "Medium", value: artwork.medium },
    { label: "Dimensions", value: artwork.dimensions },
    { label: "Year", value: artwork.year },
    { label: "Category", value: artwork.category },
  ];

  return (
    <dl className={className}>
      {rows
        .filter((row) => row.value != null && row.value !== "")
        .map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-6 border-b border-border/70 py-3 text-sm last:border-b-0"
          >
            <dt className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {row.label}
            </dt>
            <dd className="text-right font-medium">{row.value}</dd>
          </div>
        ))}
    </dl>
  );
}
