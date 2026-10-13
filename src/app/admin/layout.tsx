import { ExternalLink, LayoutDashboard, LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { signOutAction } from "@/app/(auth)/actions";
import { getCurrentUser } from "@/auth";
import { Logo } from "@/components/site/logo";
import { NavLink } from "@/components/site/nav-link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<AdminShellSkeleton />}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}

async function AdminGate({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin");

  return (
    <div className="flex min-h-svh flex-col bg-[oklch(0.985_0.008_320)]">
      <header className="sticky top-0 z-40 glass border-x-0 border-t-0">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Logo compact />
            <span className="hidden h-6 w-px bg-border sm:block" />
            <span className="hidden font-display text-xl sm:block">
              Curator Studio
            </span>
          </div>

          <nav className="flex items-center gap-1" aria-label="Studio">
            <NavLink href="/admin" exact>
              <span className="inline-flex items-center gap-1.5">
                <LayoutDashboard className="size-4" /> Dashboard
              </span>
            </NavLink>
            <NavLink href="/admin/new">
              <span className="inline-flex items-center gap-1.5">
                <Plus className="size-4" /> New
              </span>
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="hidden rounded-full sm:inline-flex"
              nativeButton={false}
              render={<Link href="/" />}
            >
              <ExternalLink /> View site
            </Button>
            <span className="hidden max-w-40 truncate rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground md:block">
              {user.email}
            </span>
            <form action={signOutAction}>
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="Sign out"
              >
                <LogOut />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

function AdminShellSkeleton() {
  return (
    <div className="flex min-h-svh flex-col">
      <div className="h-16 border-b border-border/70" />
      <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list
            <Skeleton key={i} className="h-28 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    </div>
  );
}
