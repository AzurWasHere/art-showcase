"use client";

import { Menu, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

const LINKS = [
  { label: "Home", href: "/" },
  { label: "Gallery", href: "/gallery" },
  { label: "For you", href: "/for-you" },
  { label: "Curator login", href: "/login" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full md:hidden"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
      >
        <Menu />
      </Button>
      <DialogContent
        showCloseButton
        className="top-4 left-1/2 w-[calc(100%-2rem)] max-w-sm translate-y-0 rounded-3xl p-6 data-open:slide-in-from-top-4"
      >
        <DialogTitle className="sr-only">Navigation</DialogTitle>
        <DialogDescription className="sr-only">
          Site navigation links
        </DialogDescription>
        <Logo />
        <nav className="mt-6 flex flex-col gap-1" aria-label="Mobile">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center justify-between rounded-2xl px-4 py-3 font-display text-2xl transition-colors ${
                  active ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                }`}
              >
                {link.label}
                {link.href === "/login" && (
                  <Sparkles className="size-4 text-primary" />
                )}
              </Link>
            );
          })}
        </nav>
      </DialogContent>
    </Dialog>
  );
}
