import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/site/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Curator login",
  robots: { index: false },
};

/**
 * Auth.js's proxy redirect passes an absolute `callbackUrl`; reduce it to a
 * same-site path so the Server Action's relative-only check accepts it.
 */
function normalizeCallbackUrl(raw: string | undefined): string {
  if (!raw) return "/admin";
  try {
    const url = new URL(raw, "http://placeholder.local");
    const path = `${url.pathname}${url.search}`;
    return path.startsWith("/") && !path.startsWith("//") ? path : "/admin";
  } catch {
    return "/admin";
  }
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="pastel-mesh grain relative flex min-h-svh items-center justify-center px-4 py-16">
      <div className="absolute top-6 left-6">
        <Logo />
      </div>

      <div className="relative w-full max-w-md">
        <div className="glass rounded-[2rem] p-8 shadow-lift sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Curator login
          </p>
          <h1 className="mt-3 font-display text-4xl leading-none">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to upload new work and curate the collection.
          </p>

          <div className="mt-8">
            <Suspense
              fallback={<Skeleton className="h-64 w-full rounded-2xl" />}
            >
              {searchParams.then((params) => {
                const raw = params.callbackUrl;
                return (
                  <LoginForm
                    callbackUrl={normalizeCallbackUrl(
                      Array.isArray(raw) ? raw[0] : raw,
                    )}
                  />
                );
              })}
            </Suspense>
          </div>
        </div>

        <Link
          href="/"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to the gallery
        </Link>
      </div>
    </main>
  );
}
