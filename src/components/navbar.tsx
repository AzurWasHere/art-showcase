"use client";

import { LogOut, Plus, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { label: "Gallery", href: "#gallery" },
  { label: "Featured", href: "#featured" },
  { label: "About", href: "#about" },
];

export function Navbar({ onAddArtwork }: { onAddArtwork: () => void }) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-primary">
            <Sparkles className="size-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-lg font-semibold tracking-[0.2em]">AURA</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Art Showcase
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {session?.user ? (
            <>
              <Badge className="hidden bg-accent text-accent-foreground sm:inline-flex">
                Curator Admin
              </Badge>
              <Button size="lg" onClick={onAddArtwork}>
                <Plus /> Add Artwork
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => signOut({ redirect: false })}
              >
                <LogOut /> <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          ) : (
            <Button
              size="lg"
              variant="secondary"
              nativeButton={false}
              render={<Link href="/login" />}
            >
              <UserRound /> Admin Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
