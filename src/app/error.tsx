"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="pastel-mesh flex flex-1 flex-col items-center justify-center px-4 py-32 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
        Something slipped
      </p>
      <h1 className="mt-3 font-display text-5xl">
        The paint hasn't dried on this page
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        An unexpected error interrupted the render. You can try again, or head
        back to the gallery.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          ref {error.digest}
        </p>
      )}
      <Button className="mt-8 rounded-full" onClick={reset}>
        <RotateCcw /> Try again
      </Button>
    </div>
  );
}
