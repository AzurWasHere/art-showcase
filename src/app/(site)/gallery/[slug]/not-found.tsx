import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ArtworkNotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-32 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
        404
      </p>
      <h1 className="mt-3 font-display text-5xl">
        That piece isn't on the wall
      </h1>
      <p className="mt-4 text-muted-foreground">
        It may have been renamed or taken down by the curator.
      </p>
      <Button
        className="mt-8 rounded-full"
        nativeButton={false}
        render={<Link href="/gallery" />}
      >
        <ArrowLeft /> Back to the gallery
      </Button>
    </div>
  );
}
