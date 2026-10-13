import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { shortId, slugify } from "@/lib/artwork-shared";
import {
  ACCEPTED_IMAGE_TYPES,
  extensionForMime,
  MAX_IMAGE_BYTES,
} from "@/lib/image";

/**
 * Development-only upload target used when BLOB_READ_WRITE_TOKEN is absent.
 * Writes into public/uploads so `next dev` can serve the file immediately.
 * Disabled in production, where the filesystem is read-only and Blob is required.
 */
export async function POST(request: Request) {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.BLOB_READ_WRITE_TOKEN
  ) {
    return NextResponse.json(
      { error: "Local uploads are disabled" },
      { status: 404 },
    );
  }

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported type ${file.type}` },
      { status: 415 },
    );
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "File is larger than 25 MB" },
      { status: 413 },
    );
  }

  const base = slugify(path.parse(file.name).name) || "artwork";
  const filename = `${base}-${shortId()}.${extensionForMime(file.type)}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads");

  await mkdir(uploadsDir, { recursive: true });
  await writeFile(
    path.join(uploadsDir, filename),
    Buffer.from(await file.arrayBuffer()),
  );

  return NextResponse.json({ url: `/uploads/${filename}` });
}
