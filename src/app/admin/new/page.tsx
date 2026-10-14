import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createArtworkAction } from "@/app/admin/actions";
import { ArtworkForm } from "@/components/admin/artwork-form";

export default function NewArtworkPage() {
  const uploadMode = process.env.BLOB_READ_WRITE_TOKEN ? "blob" : "local";

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Dashboard
        </Link>
        <h1 className="mt-4 font-display text-5xl leading-none">
          Add an artwork
        </h1>
      </div>
      <ArtworkForm
        mode="create"
        action={createArtworkAction}
        uploadMode={uploadMode}
      />
    </div>
  );
}
