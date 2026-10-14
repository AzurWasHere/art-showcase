"use client";

import { upload } from "@vercel/blob/client";
import { cn } from "cn";
import {
  CheckCircle2,
  ImagePlus,
  Link2,
  Loader2,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";
import { ArtworkImage } from "@/components/gallery/artwork-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { shortId } from "@/lib/artwork-shared";
import {
  ACCEPTED_IMAGE_TYPES,
  aspectRatioOf,
  formatBytes,
  MAX_IMAGE_BYTES,
} from "@/lib/image";

export interface ImageValue {
  url: string;
  width: number | null;
  height: number | null;
}

interface ImageUploadFieldProps {
  value: ImageValue;
  onChange: (value: ImageValue) => void;
  error?: string;
}

type Phase = "idle" | "uploading" | "done" | "error";

async function readDimensions(
  source: File | string,
): Promise<{ width: number; height: number } | null> {
  try {
    if (source instanceof File) {
      const bitmap = await createImageBitmap(source);
      const dims = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return dims;
    }
    return await new Promise((resolve) => {
      const img = new Image();
      img.onload = () =>
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve(null);
      img.src = source;
    });
  } catch {
    return null;
  }
}

/** Controlled upload field: owns the upload UX, the form owns the value. */
export function ImageUploadField({
  value,
  onChange,
  error,
}: ImageUploadFieldProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { url, width, height } = value;
  const [phase, setPhase] = useState<Phase>(url ? "done" : "idle");
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      setPhase("error");
      setMessage("Use a JPEG, PNG, WebP, AVIF or GIF image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setPhase("error");
      setMessage(`That file is ${formatBytes(file.size)}; the limit is 25 MB.`);
      return;
    }

    setPhase("uploading");
    setProgress(0);
    setMessage(null);
    const dims = await readDimensions(file);

    try {
      // Unique path chosen here (not via the token's addRandomSuffix) so Vercel
      // Blob and the local emulator name files identically.
      const blob = await upload(`artworks/${shortId(10)}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        contentType: file.type,
        onUploadProgress: ({ percentage }) => setProgress(percentage),
      });
      onChange({
        url: blob.url,
        width: dims?.width ?? null,
        height: dims?.height ?? null,
      });
      setPhase("done");
      setMessage(`${file.name} · ${formatBytes(file.size)}`);
      toast.success("Image uploaded");
    } catch (err) {
      setPhase("error");
      setMessage(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function applyUrl() {
    const candidate = urlDraft.trim();
    if (!/^https:\/\//.test(candidate)) {
      setPhase("error");
      setMessage("Paste a full https:// image URL.");
      return;
    }
    setPhase("uploading");
    const dims = await readDimensions(candidate);
    onChange({
      url: candidate,
      width: dims?.width ?? null,
      height: dims?.height ?? null,
    });
    setPhase("done");
    setMessage(
      dims ? "Linked external image" : "Linked external image (size unknown)",
    );
    setShowUrlInput(false);
  }

  function clear() {
    onChange({ url: "", width: null, height: null });
    setPhase("idle");
    setMessage(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="grid gap-3">
      {url ? (
        <div className="overflow-hidden rounded-3xl bg-card ring-1 ring-foreground/8">
          <div
            className="pastel-mesh relative mx-auto max-h-96 w-full"
            style={{ aspectRatio: aspectRatioOf(width, height) }}
          >
            <ArtworkImage
              src={url}
              alt="Uploaded artwork preview"
              fill
              sizes="(min-width: 1024px) 40rem, 100vw"
              className="object-contain p-3"
            />
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <p className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="size-4 shrink-0 text-sky-deep" />
              <span className="truncate">{message ?? "Image ready"}</span>
              {width && height && (
                <span className="shrink-0 font-mono text-xs">
                  {width}×{height}
                </span>
              )}
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={clear}>
              <Trash2 /> Replace
            </Button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files[0]);
          }}
          className={cn(
            "relative flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 text-center transition-colors",
            dragging
              ? "border-primary bg-accent"
              : "border-border bg-white/60 hover:border-primary/50 hover:bg-accent/40",
            error && "border-destructive/60",
          )}
        >
          {phase === "uploading" ? (
            <>
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Uploading · {Math.round(progress)}%
              </p>
              <div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-brand-gradient transition-[width]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-soft">
                {dragging ? (
                  <UploadCloud className="size-6" />
                ) : (
                  <ImagePlus className="size-6" />
                )}
              </span>
              <div>
                <p className="font-medium">
                  Drop an image here, or click to browse
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  JPEG, PNG, WebP, AVIF or GIF up to 25 MB
                </p>
              </div>
            </>
          )}
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            className="sr-only"
            disabled={phase === "uploading"}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
      )}

      {!url && (
        <div className="flex flex-col gap-2">
          {showUrlInput ? (
            <div className="flex gap-2">
              <Input
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                placeholder="https://…/image.jpg"
                className="h-10 rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyUrl();
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                className="h-10 rounded-xl"
                onClick={applyUrl}
              >
                Use URL
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowUrlInput(true)}
              className="inline-flex items-center gap-1.5 self-start text-xs text-muted-foreground hover:text-foreground"
            >
              <Link2 className="size-3.5" /> …or link an image by URL
            </button>
          )}
        </div>
      )}

      {(error || (phase === "error" && message)) && (
        <p role="alert" className="text-sm text-destructive">
          {error ?? message}
        </p>
      )}
    </div>
  );
}
