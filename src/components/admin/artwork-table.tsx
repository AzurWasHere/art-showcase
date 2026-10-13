"use client";

import { ExternalLink, Loader2, Pencil, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteArtworkAction, setFeaturedAction } from "@/app/admin/actions";
import { ArtworkImage } from "@/components/gallery/artwork-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Artwork } from "@/lib/artworks";

export function ArtworkTable({ artworks }: { artworks: Artwork[] }) {
  if (artworks.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-white/60 px-6 py-16 text-center">
        <h2 className="font-display text-2xl">The walls are bare</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your first piece to open the gallery.
        </p>
        <Button
          className="mt-6 rounded-full"
          nativeButton={false}
          render={<Link href="/admin/new" />}
        >
          Add an artwork
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-foreground/8">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-20 pl-4">Work</TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="hidden md:table-cell">Category</TableHead>
            <TableHead className="hidden lg:table-cell">Medium</TableHead>
            <TableHead className="hidden sm:table-cell">Year</TableHead>
            <TableHead>Featured</TableHead>
            <TableHead className="pr-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {artworks.map((artwork) => (
            <ArtworkRow key={artwork.id} artwork={artwork} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ArtworkRow({ artwork }: { artwork: Artwork }) {
  const [pending, startTransition] = useTransition();
  const [featured, setOptimisticFeatured] = useOptimistic(artwork.featured);

  function toggleFeatured(next: boolean) {
    startTransition(async () => {
      setOptimisticFeatured(next);
      const result = await setFeaturedAction(artwork.id, next);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <TableRow>
      <TableCell className="pl-4">
        <Link
          href={`/gallery/${artwork.slug}`}
          className="relative block size-14 overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/8"
        >
          <ArtworkImage
            src={artwork.imageUrl}
            alt=""
            fill
            sizes="56px"
            className="object-cover"
          />
        </Link>
      </TableCell>
      <TableCell>
        <p className="font-medium">{artwork.title}</p>
        <p className="font-mono text-xs text-muted-foreground">
          /{artwork.slug}
        </p>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Badge className="bg-secondary text-secondary-foreground">
          {artwork.category}
        </Badge>
      </TableCell>
      <TableCell className="hidden max-w-48 truncate text-muted-foreground lg:table-cell">
        {artwork.medium ?? "—"}
      </TableCell>
      <TableCell className="hidden tabular-nums sm:table-cell">
        {artwork.year ?? "—"}
      </TableCell>
      <TableCell>
        <div className="inline-flex items-center gap-2">
          <Switch
            checked={featured}
            onCheckedChange={toggleFeatured}
            disabled={pending}
            aria-label={`Feature ${artwork.title}`}
          />
          {featured && <Sparkles className="size-3.5 text-primary" />}
        </div>
      </TableCell>
      <TableCell className="pr-4">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Open page"
            nativeButton={false}
            render={<Link href={`/gallery/${artwork.slug}`} target="_blank" />}
          >
            <ExternalLink />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Edit"
            nativeButton={false}
            render={<Link href={`/admin/${artwork.id}/edit`} />}
          >
            <Pencil />
          </Button>
          <DeleteArtworkButton artwork={artwork} />
        </div>
      </TableCell>
    </TableRow>
  );
}

export function DeleteArtworkButton({ artwork }: { artwork: Artwork }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteArtworkAction(artwork.id);
      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Delete ${artwork.title}`}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <Trash2 />
      </Button>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Remove “{artwork.title}”?
          </DialogTitle>
          <DialogDescription>
            The artwork and its stored image will be deleted. This can't be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton>
          <Button
            variant="destructive"
            onClick={confirmDelete}
            disabled={pending}
          >
            {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
