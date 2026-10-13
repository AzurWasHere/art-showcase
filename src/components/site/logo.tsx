import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="AURA home"
    >
      <span className="relative flex size-9 items-center justify-center overflow-hidden rounded-xl bg-brand-gradient shadow-soft transition-transform duration-500 group-hover:rotate-6">
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,oklch(1_0_0/0.55),transparent_55%)]" />
        <svg
          viewBox="0 0 24 24"
          className="relative size-5 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3c2.5 3 6 5.5 6 9.5a6 6 0 0 1-12 0C6 8.5 9.5 6 12 3Z" />
          <path d="M9.5 14.5c.5 1.5 1.5 2.5 2.5 2.5" />
        </svg>
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-xl tracking-[0.18em]">AURA</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Gallery
          </span>
        </span>
      )}
    </Link>
  );
}
