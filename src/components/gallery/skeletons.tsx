import { Skeleton } from "@/components/ui/skeleton";

const RATIOS = [
  "4 / 5",
  "1 / 1",
  "3 / 4",
  "4 / 5",
  "1 / 1",
  "3 / 4",
  "4 / 5",
  "5 / 7",
];

export function GallerySkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="masonry columns-1 sm:columns-2 lg:columns-3 2xl:columns-4">
      {Array.from({ length: count }, (_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list
          key={i}
          className="overflow-hidden rounded-3xl bg-card ring-1 ring-foreground/8"
        >
          <Skeleton
            className="shimmer w-full rounded-none"
            style={{ aspectRatio: RATIOS[i % RATIOS.length] }}
          />
          <div className="space-y-2 p-4">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3.5 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FilterBarSkeleton() {
  return (
    <div className="glass mx-auto flex max-w-7xl flex-col gap-3 rounded-3xl px-3 py-3">
      <div className="flex gap-3">
        <Skeleton className="h-11 flex-1 rounded-full" />
        <Skeleton className="h-11 w-36 rounded-full" />
        <Skeleton className="h-11 w-40 rounded-full" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
    </div>
  );
}

export function ArtworkDetailSkeleton() {
  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(20rem,1fr)] lg:px-8">
      <Skeleton className="shimmer aspect-[4/5] w-full rounded-3xl" />
      <div className="space-y-5">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}

export function FeaturedStripSkeleton() {
  return (
    <div className="flex gap-5 overflow-hidden">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list
          key={i}
          className="shimmer aspect-[4/5] w-72 shrink-0 rounded-3xl"
        />
      ))}
    </div>
  );
}
