import { Images, Layers, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { ArtworkTable } from "@/components/admin/artwork-table";
import { RevalidateButton } from "@/components/admin/revalidate-button";
import { Button } from "@/components/ui/button";
import { getArtworks, getCollectionStats } from "@/lib/artworks";

export default async function AdminDashboardPage() {
  const [artworks, stats] = await Promise.all([
    getArtworks(),
    getCollectionStats(),
  ]);

  const cards = [
    { label: "Works", value: stats.total, icon: Images },
    { label: "Featured", value: stats.featured, icon: Sparkles },
    { label: "Disciplines", value: stats.categories.length, icon: Layers },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Dashboard
          </p>
          <h1 className="mt-2 font-display text-5xl leading-none">
            The collection
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <RevalidateButton />
          <Button
            className="rounded-full bg-brand-gradient text-white hover:opacity-95"
            nativeButton={false}
            render={<Link href="/admin/new" />}
          >
            <Plus /> Add artwork
          </Button>
        </div>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="flex items-start justify-between gap-4 rounded-3xl bg-white p-5 ring-1 ring-foreground/8 shadow-soft"
          >
            <div>
              <dt className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {card.label}
              </dt>
              <dd
                className={"mt-2 font-display text-4xl tabular-nums"}
              >
                {card.value}
              </dd>
            </div>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <card.icon className="size-5" />
            </span>
          </div>
        ))}
      </dl>

      <ArtworkTable artworks={artworks} />
    </div>
  );
}
