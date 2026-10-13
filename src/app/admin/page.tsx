import { Cloud, HardDrive, Images, Layers, Plus, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArtworkTable } from "@/components/admin/artwork-table";
import { RevalidateButton } from "@/components/admin/revalidate-button";
import { Button } from "@/components/ui/button";
import { getArtworks, getCollectionStats } from "@/lib/artworks";

export const metadata: Metadata = {
  title: "Curator Studio",
  robots: { index: false },
};

export default async function AdminDashboardPage() {
  const [artworks, stats] = await Promise.all([
    getArtworks(),
    getCollectionStats(),
  ]);
  const blobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  const cards = [
    { label: "Works", value: stats.total, icon: Images },
    { label: "Featured", value: stats.featured, icon: Sparkles },
    { label: "Disciplines", value: stats.categories.length, icon: Layers },
    {
      label: "Image storage",
      value: blobConfigured ? "Vercel Blob" : "Local (dev)",
      icon: blobConfigured ? Cloud : HardDrive,
      small: true,
    },
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
          <p className="mt-3 text-sm text-muted-foreground">
            Changes publish instantly: the gallery cache is refreshed after
            every save.
          </p>
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

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                className={`mt-2 font-display ${card.small ? "text-2xl" : "text-4xl tabular-nums"}`}
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

      {!blobConfigured && (
        <p className="rounded-2xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">
          Uploads are being written to{" "}
          <code className="font-mono">public/uploads</code> because{" "}
          <code className="font-mono">BLOB_READ_WRITE_TOKEN</code> is not set.
          Attach a Vercel Blob store before deploying so images persist in
          production.
        </p>
      )}

      <ArtworkTable artworks={artworks} />
    </div>
  );
}
