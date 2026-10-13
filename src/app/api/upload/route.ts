import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(request: Request) {
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

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(file.name, file, { access: "public" });
      return NextResponse.json({ url: blob.url });
    } catch (error) {
      console.error("Blob upload failed:", error);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const dataUrl = `data:${file.type || "application/octet-stream"};base64,${base64}`;
  return NextResponse.json({
    url: dataUrl,
    warning:
      "Uploaded locally (set BLOB_READ_WRITE_TOKEN for production Vercel Blob storage)",
  });
}
