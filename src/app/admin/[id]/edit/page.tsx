import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { updateArtworkAction } from "@/app/admin/actions";
import { ArtworkForm } from "@/components/admin/artwork-form";
import { DeleteArtworkButton } from "@/components/admin/artwork-table";
import { Skeleton } from "@/components/ui/skeleton";
import { getArtworkByIdFresh } from "@/lib/artworks";

export default function EditArtworkPage({
  params,
}: PageProps<"/admin/[id]/edit">) {
  return (
    <Suspense fallback={<Skeleton className="h-128 rounded-3xl" />}>
      {params.then(({ id }) => (
        <EditArtwork id={id} />
      ))}
    </Suspense>
  );
}

async function EditArtwork({ id }: { id: string }) {
  const artwork = await getArtworkByIdFresh(id);
  if (!artwork) notFound();
  const uploadMode = process.env.BLOB_READ_WRITE_TOKEN ? "blob" : "local";
  const action = updateArtworkAction.bind(null, artwork.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Dashboard
          </Link>
          <h1 className="mt-4 font-display text-5xl leading-none">
            Edit “{artwork.title}”
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Public URL:{" "}
            <code className="font-mono">/gallery/{artwork.slug}</code>
          </p>
        </div>
        <DeleteArtworkButton artwork={artwork} />
      </div>
      <ArtworkForm
        mode="edit"
        action={action}
        uploadMode={uploadMode}
        artwork={artwork}
      />
    </div>
  );
}
