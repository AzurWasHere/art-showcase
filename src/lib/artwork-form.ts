export type ArtworkFormValues = {
  title: string;
  description: string;
  imageUrl: string;
  imageWidth: string;
  imageHeight: string;
  medium: string;
  dimensions: string;
  year: string;
  category: string;
  featured: boolean;
};

export type ArtworkFormState = {
  status: "idle" | "error";
  message?: string;
  errors?: Partial<Record<keyof ArtworkFormValues, string>>;
  values?: ArtworkFormValues;
};

export const initialArtworkFormState: ArtworkFormState = { status: "idle" };
