"use client";

import { Save, Sparkles } from "lucide-react";
import Link from "next/link";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { fieldError, useAppForm } from "@/components/form/app-form";
import { Button } from "@/components/ui/button";
import {
  type ArtworkActionResult,
  type ArtworkFormValues,
  artworkSchema,
} from "@/lib/artwork-schema";
import { CATEGORIES, isCategory } from "@/lib/artwork-shared";
import type { Artwork } from "@/lib/artworks";

interface ArtworkFormProps {
  mode: "create" | "edit";
  /** Server action: redirects on success, returns errors otherwise. */
  action: (
    values: ArtworkFormValues,
  ) => Promise<ArtworkActionResult | undefined>;
  artwork?: Artwork;
}

function defaultValues(artwork?: Artwork): ArtworkFormValues {
  return {
    title: artwork?.title ?? "",
    description: artwork?.description ?? "",
    image: {
      url: artwork?.imageUrl ?? "",
      width: artwork?.imageWidth ?? null,
      height: artwork?.imageHeight ?? null,
    },
    medium: artwork?.medium ?? "",
    dimensions: artwork?.dimensions ?? "",
    year: artwork?.year ? String(artwork.year) : "",
    category: isCategory(artwork?.category) ? artwork.category : CATEGORIES[0],
    featured: artwork?.featured ?? false,
  };
}

export function ArtworkForm({ mode, action, artwork }: ArtworkFormProps) {
  const form = useAppForm({
    defaultValues: defaultValues(artwork),
    validators: {
      onChange: artworkSchema,
      onSubmitAsync: async ({ value }) => {
        const result = await action(value);
        if (!result) return null;
        return { form: result.message, fields: result.fieldErrors ?? {} };
      },
    },
  });

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
      className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
    >
      <section className="grid gap-3">
        <div>
          <h2 className="font-display text-2xl">Image</h2>
          <p className="text-sm text-muted-foreground">
            High-resolution, colour-matched to the original where possible.
          </p>
        </div>
        <form.Field name="image">
          {(field) => (
            <ImageUploadField
              value={field.state.value}
              onChange={field.handleChange}
              error={fieldError(field.state.meta)}
            />
          )}
        </form.Field>
      </section>

      <section className="grid content-start gap-5">
        <div>
          <h2 className="font-display text-2xl">Details</h2>
          <p className="text-sm text-muted-foreground">
            Everything except the title is optional, but every detail makes the
            piece feel more complete.
          </p>
        </div>

        <form.AppField name="title">
          {(field) => (
            <field.TextField label="Title" placeholder="Blush Current" />
          )}
        </form.AppField>

        <div className="grid gap-5 sm:grid-cols-2">
          <form.AppField name="category">
            {(field) => (
              <field.SelectField label="Category" options={CATEGORIES} />
            )}
          </form.AppField>
          <form.AppField name="year">
            {(field) => (
              <field.TextField
                label="Year"
                type="number"
                inputMode="numeric"
                placeholder="2026"
              />
            )}
          </form.AppField>
          <form.AppField name="medium">
            {(field) => (
              <field.TextField label="Medium" placeholder="Oil on linen" />
            )}
          </form.AppField>
          <form.AppField name="dimensions">
            {(field) => (
              <field.TextField label="Dimensions" placeholder="90 × 120 cm" />
            )}
          </form.AppField>
        </div>

        <form.AppField name="description">
          {(field) => (
            <field.TextareaField
              label="Description"
              rows={5}
              placeholder="A few honest sentences about the work: what it's made of, where it came from, what it's about."
            />
          )}
        </form.AppField>

        <form.AppField name="featured">
          {(field) => (
            <field.SwitchField
              label="Feature on the home page"
              description="Featured works appear in the hero strip and get a badge in the gallery."
              icon={<Sparkles className="size-4 text-primary" />}
            />
          )}
        </form.AppField>

        <form.AppForm>
          <form.FormError />
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <form.SubmitButton
              icon={<Save />}
              pendingLabel="Saving…"
              className="h-11 rounded-full bg-brand-gradient px-6 text-white hover:opacity-95"
            >
              {mode === "create" ? "Publish artwork" : "Save changes"}
            </form.SubmitButton>
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
        </form.AppForm>
      </section>
    </form>
  );
}
