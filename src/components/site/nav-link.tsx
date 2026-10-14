"use client";

import { cn } from "cn";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  children,
  className,
  exact = false,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
        "after:absolute after:inset-x-3.5 after:-bottom-px after:h-px after:origin-left after:scale-x-0 after:bg-brand-gradient after:transition-transform after:duration-300 hover:after:scale-x-100",
        active && "text-foreground after:scale-x-100",
        className,
      )}
    >
      {children}
    </Link>
  );
}
