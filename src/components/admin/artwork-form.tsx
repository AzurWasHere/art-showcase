"use client";

import { AlertCircle, Loader2, Save, Sparkles } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import {
  ImageUploadField,
  type UploadMode,
} from "@/components/admin/image-upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  type ArtworkFormState,
  initialArtworkFormState,
} from "@/lib/artwork-form";
import { CATEGORIES } from "@/lib/artwork-shared";
import type { Artwork } from "@/lib/artworks";

type FormAction = (
  state: ArtworkFormState,
  formData: FormData,
) => Promise<ArtworkFormState>;

interface ArtworkFormProps {
  mode: "create" | "edit";
  action: FormAction;
  uploadMode: UploadMode;
  artwork?: Artwork;
}

export function ArtworkForm({
  mode,
  action,
  uploadMode,
  artwork,
}: ArtworkFormProps) {
  const [state, formAction, pending] = useActionState(
    action,
    initialArtworkFormState,
  );
  const values = state.values;
  const errors = state.errors ?? {};

  const defaults = {
    title: values?.title ?? artwork?.title ?? "",
    description: values?.description ?? artwork?.description ?? "",
    medium: values?.medium ?? artwork?.medium ?? "",
    dimensions: values?.dimensions ?? artwork?.dimensions ?? "",
    year: values?.year ?? (artwork?.year ? String(artwork.year) : ""),
    category: values?.category ?? artwork?.category ?? CATEGORIES[0],
    featured: values?.featured ?? artwork?.featured ?? false,
    imageUrl: values?.imageUrl ?? artwork?.imageUrl ?? "",
    imageWidth: values?.imageWidth
      ? Number(values.imageWidth)
      : (artwork?.imageWidth ?? null),
    imageHeight: values?.imageHeight
      ? Number(values.imageHeight)
      : (artwork?.imageHeight ?? null),
  };

  return (
    <form
      action={formAction}
      className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
    >
      <section className="grid gap-3">
        <div>
          <h2 className="font-display text-2xl">Image</h2>
          <p className="text-sm text-muted-foreground">
            High-resolution, colour-matched to the original where possible.
          </p>
        </div>
        <ImageUploadField
          mode={uploadMode}
          defaultUrl={defaults.imageUrl}
          defaultWidth={defaults.imageWidth}
          defaultHeight={defaults.imageHeight}
          error={errors.imageUrl}
        />
      </section>

      <section className="grid content-start gap-5">
        <div>
          <h2 className="font-display text-2xl">Details</h2>
          <p className="text-sm text-muted-foreground">
            Everything except the title is optional, but collectors read all of
            it.
          </p>
        </div>

        <Field label="Title" htmlFor="title" error={errors.title}>
          <Input
            id="title"
            name="title"
            required
            maxLength={120}
            defaultValue={defaults.title}
            placeholder="Blush Current"
            className="h-11 rounded-xl"
            aria-invalid={Boolean(errors.title)}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category" htmlFor="category" error={errors.category}>
            <Select
              name="category"
              defaultValue={defaults.category}
              items={CATEGORIES.map((c) => ({ value: c, label: c }))}
            >
              <SelectTrigger id="category" className="h-11 w-full rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Year" htmlFor="year" error={errors.year}>
            <Input
              id="year"
              name="year"
              type="number"
              inputMode="numeric"
              min={1000}
              max={2100}
              defaultValue={defaults.year}
              placeholder="2026"
              className="h-11 rounded-xl"
              aria-invalid={Boolean(errors.year)}
            />
          </Field>

          <Field label="Medium" htmlFor="medium" error={errors.medium}>
            <Input
              id="medium"
              name="medium"
              maxLength={120}
              defaultValue={defaults.medium}
              placeholder="Oil on linen"
              className="h-11 rounded-xl"
            />
          </Field>

          <Field
            label="Dimensions"
            htmlFor="dimensions"
            error={errors.dimensions}
          >
            <Input
              id="dimensions"
              name="dimensions"
              maxLength={120}
              defaultValue={defaults.dimensions}
              placeholder="90 × 120 cm"
              className="h-11 rounded-xl"
            />
          </Field>
        </div>

        <Field
          label="Description"
          htmlFor="description"
          error={errors.description}
        >
          <Textarea
            id="description"
            name="description"
            rows={5}
            maxLength={2000}
            defaultValue={defaults.description}
            placeholder="A few honest sentences about the work: what it's made of, where it came from, what it's about."
            className="min-h-32 rounded-xl"
          />
        </Field>

        <Label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-accent/60 px-4 py-3.5">
          <span className="flex items-center gap-2.5">
            <Sparkles className="size-4 text-primary" />
            <span>
              <span className="block text-sm font-medium">
                Feature on the home page
              </span>
              <span className="block text-xs font-normal text-muted-foreground">
                Featured works appear in the hero strip and get a badge in the
                gallery.
              </span>
            </span>
          </span>
          <Switch name="featured" defaultChecked={defaults.featured} />
        </Label>

        {state.status === "error" && state.message && (
          <p
            role="alert"
            className="flex items-center gap-2 rounded-xl bg-destructive/8 px-3 py-2.5 text-sm text-destructive"
          >
            <AlertCircle className="size-4 shrink-0" />
            {state.message}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            type="submit"
            size="lg"
            disabled={pending}
            className="h-11 rounded-full bg-brand-gradient px-6 text-white hover:opacity-95"
          >
            {pending ? <Loader2 className="animate-spin" /> : <Save />}
            {pending
              ? "Saving…"
              : mode === "create"
                ? "Publish artwork"
                : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="rounded-full"
            nativeButton={false}
            render={<Link href="/admin" />}
          >
            Cancel
          </Button>
        </div>
      </section>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
