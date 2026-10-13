import { Suspense } from "react";
import { FeaturedStripSkeleton } from "@/components/gallery/skeletons";
import { CategoryTiles } from "@/components/home/category-tiles";
import { ClosingCta } from "@/components/home/closing-cta";
import { FeaturedStrip } from "@/components/home/featured-strip";
import { Hero } from "@/components/home/hero";
import { Manifesto } from "@/components/home/manifesto";
import { StatsBand } from "@/components/home/stats-band";

export default function HomePage() {
  return (
    <>
      <Hero />
      {/* Data sections read from the cached collection; Suspense keeps the shell
          instant even if the first read has to hit the database. */}
      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <FeaturedStripSkeleton />
          </div>
        }
      >
        <FeaturedStrip />
      </Suspense>
      <Suspense fallback={null}>
        <StatsBand />
      </Suspense>
      <Suspense fallback={null}>
        <CategoryTiles />
      </Suspense>
      <Manifesto />
      <div className="py-20 sm:py-28">
        <ClosingCta />
      </div>
    </>
  );
}
