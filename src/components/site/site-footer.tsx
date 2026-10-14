import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/site/logo";

const COLUMNS = [
  {
    heading: "Explore",
    links: [
      { label: "Gallery", href: "/gallery" },
      { label: "Featured works", href: "/gallery?featured=1" },
      { label: "For you", href: "/for-you" },
    ],
  },
  {
    heading: "Curate",
    links: [
      { label: "Curator login", href: "/login" },
      { label: "Add new work", href: "/admin/new" },
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
            A personal collection of paintings, prints, photographs and digital
            works, gathered around soft light and loud colour. New pieces arrive
            whenever they're ready.
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
    </footer>
  );
}
