import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer id="about" className="mt-auto bg-white">
      <div className="h-px bg-gradient-to-r from-pink-200 via-sky-200 to-pink-200" />
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <span className="font-semibold tracking-[0.2em] text-foreground">
            AURA
          </span>
          <span>Art Showcase</span>
        </div>
        <p>© AURA. All artworks belong to their creators.</p>
      </div>
    </footer>
  );
}
