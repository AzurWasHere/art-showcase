import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/site/logo";

const COLUMNS = [
  {
    heading: "Explore",
    links: [
      { label: "Gallery", href: "/gallery" },
      { label: "Featured works", href: "/gallery?featured=1" },
      { label: "About the studio", href: "/about" },
    ],
  },
  {
    heading: "Collect",
    links: [
      { label: "Enquiries", href: "mailto:studio@aura.gallery" },
      { label: "Curator login", href: "/login" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-border/70 bg-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--blush),var(--sky),transparent)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,oklch(0.92_0.06_345/0.6),transparent)] blur-2xl"
      />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            A living collection of paintings, prints, photographs and digital
            works, curated around soft light and loud colour. New pieces arrive
            most weeks.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.heading}>
            <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              {column.heading}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-1 text-sm text-foreground/80 transition-colors hover:text-primary"
                  >
                    {link.label}
                    <ArrowUpRight className="size-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="relative border-t border-border/70">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p>
            © AURA Gallery. All artworks remain the property of their makers.
          </p>
          <p className="font-mono">
            Built with Next.js · Prisma Postgres · Vercel Blob · WebGPU
          </p>
        </div>
      </div>
    </footer>
  );
}
