import { LayoutDashboard, LogOut, Sparkles } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { signOutAction } from "@/app/(auth)/actions";
import { getCurrentUser } from "@/auth";
import { Logo } from "@/components/site/logo";
import { MobileNav } from "@/components/site/mobile-nav";
import { NavLink } from "@/components/site/nav-link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const NAV_ITEMS = [
  { label: "Gallery", href: "/gallery" },
  { label: "About", href: "/about" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40">
      <div className="glass border-x-0 border-t-0">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Logo />

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            <NavLink href="/" exact>
              Home
            </NavLink>
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} href={item.href}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Session is request-time data: it streams in behind Suspense so the
                rest of the header stays in the static shell. */}
            <Suspense fallback={<HeaderAuthSkeleton />}>
              <HeaderAuth />
            </Suspense>
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}

function HeaderAuthSkeleton() {
  return <Skeleton className="hidden h-8 w-28 rounded-full md:block" />;
}

async function HeaderAuth() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Button
        variant="ghost"
        className="hidden rounded-full md:inline-flex"
        nativeButton={false}
        render={<Link href="/login" />}
      >
        <Sparkles className="text-primary" />
        Curator login
      </Button>
    );
  }

  return (
    <div className="hidden items-center gap-1.5 md:flex">
      <Button
        variant="secondary"
        className="rounded-full"
        nativeButton={false}
        render={<Link href="/admin" />}
      >
        <LayoutDashboard />
        Dashboard
      </Button>
      <form action={signOutAction}>
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label="Sign out"
          title={`Signed in as ${user.email}`}
        >
          <LogOut />
        </Button>
      </form>
    </div>
  );
}
