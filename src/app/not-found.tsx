import Link from "next/link";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="pastel-mesh flex flex-1 flex-col items-center justify-center px-4 py-32 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          404
        </p>
        <h1 className="mt-3 font-display text-6xl">Blank canvas</h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          There's nothing hanging at this address. Try the gallery instead.
        </p>
        <Button
          className="mt-8 rounded-full"
          nativeButton={false}
          render={<Link href="/gallery" />}
        >
          Go to the gallery
        </Button>
      </main>
      <SiteFooter />
    </>
  );
}
