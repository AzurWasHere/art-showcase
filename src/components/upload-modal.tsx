"use client";

import { AlertCircle, CheckCircle2, ImagePlus, Loader2 } from "lucide-react";
import { useState } from "react";
import { CATEGORIES } from "@/components/hero-banner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Artwork } from "@/lib/artworks";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onArtworkCreated: (artwork: Artwork) => void;
}

export function UploadModal({
  open,
  onClose,
  onArtworkCreated,
}: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [featured, setFeatured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function reset() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setCategory(CATEGORIES[0]);
    setFeatured(false);
    setError(null);
  }

  function pickFile(next: File | undefined) {
    if (!next) return;
    if (!next.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setError(null);
    setSuccess(null);
    setFile(next);
    setPreview(URL.createObjectURL(next));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    if (!file) {
      setError("Please select an image to upload.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const body = new FormData();
      body.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body });
      const uploaded = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploaded.error || "Upload failed");

      const yearValue = String(data.get("year") ?? "").trim();
      const createRes = await fetch("/api/artworks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(data.get("title") ?? "").trim(),
          medium: String(data.get("medium") ?? "").trim(),
          dimensions: String(data.get("dimensions") ?? "").trim(),
          year: yearValue ? Number(yearValue) : undefined,
          description: String(data.get("description") ?? "").trim(),
          category,
          featured,
          imageUrl: uploaded.url,
        }),
      });
      const created = await createRes.json();
      if (!createRes.ok)
        throw new Error(created.error || "Could not save artwork");

      onArtworkCreated(created as Artwork);
      setSuccess(`"${created.title}" was added to the gallery.`);
      form.reset();
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset();
          setSuccess(null);
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg">Add Artwork</DialogTitle>
          <DialogDescription>
            Upload an image and describe the piece for the gallery.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <label
            htmlFor="artwork-file"
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pickFile(e.dataTransfer.files[0]);
            }}
            className={`flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed text-sm text-muted-foreground transition-colors ${
              dragging
                ? "border-primary bg-accent"
                : "border-secondary bg-muted/50 hover:bg-accent/50"
            }`}
          >
            {preview ? (
              // biome-ignore lint/performance/noImgElement: local object URL preview
              <img
                src={preview}
                alt="Preview"
                className="max-h-64 w-full object-contain"
              />
            ) : (
              <>
                <ImagePlus className="size-8 text-primary" />
                <span>Drop an image here or click to browse</span>
              </>
            )}
            <input
              id="artwork-file"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
          </label>

          <div className="grid gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="medium">Medium</Label>
              <Input id="medium" name="medium" placeholder="Oil on canvas" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="dimensions">Dimensions</Label>
              <Input
                id="dimensions"
                name="dimensions"
                placeholder="60 x 90 cm"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                name="year"
                type="number"
                min={1000}
                max={2100}
                placeholder="2026"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" />
          </div>
          <Label htmlFor="featured" className="cursor-pointer">
            <input
              id="featured"
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="size-4 accent-primary"
            />
            Feature on Homepage
          </Label>

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertCircle className="size-4 shrink-0" /> {error}
            </div>
          )}
          {success && (
            // biome-ignore lint/a11y/useSemanticElements: alert status display
            <div
              role="status"
              className="flex items-center gap-2 rounded-lg bg-secondary p-3 text-sm text-secondary-foreground"
            >
              <CheckCircle2 className="size-4 shrink-0" /> {success}
            </div>
          )}

          <Button type="submit" size="lg" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            {loading ? "Uploading..." : "Publish Artwork"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
