import { getCollectionStats } from "@/lib/artworks";

export async function StatsBand() {
  const stats = await getCollectionStats();
  if (stats.total === 0) return null;

  const items = [
    { label: "Works in the collection", value: stats.total },
    { label: "Disciplines", value: stats.categories.length },
    { label: "Featured right now", value: stats.featured },
    {
      label: "Years spanned",
      value: stats.yearRange
        ? `${stats.yearRange[0]}–${stats.yearRange[1]}`
        : "—",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[2rem] bg-border/70 ring-1 ring-foreground/8 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="bg-white px-6 py-8 sm:px-8">
            <dd className="font-display text-5xl tabular-nums text-gradient">
              {item.value}
            </dd>
            <dt className="mt-2 text-sm text-muted-foreground">{item.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
