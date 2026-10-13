import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createArtwork, getArtworks, type NewArtwork } from "@/lib/artworks";

export async function GET() {
  const artworks = await getArtworks();
  return NextResponse.json(artworks);
}

function optionalString(value: unknown): string | undefined | null {
  if (value === undefined || value === null || value === "") return undefined;
  return typeof value === "string" ? value : null;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const description = optionalString(b.description);
  const medium = optionalString(b.medium);
  const dimensions = optionalString(b.dimensions);
  const year =
    b.year === undefined || b.year === null || b.year === ""
      ? undefined
      : Number(b.year);

  if (
    typeof b.title !== "string" ||
    !b.title.trim() ||
    typeof b.imageUrl !== "string" ||
    !b.imageUrl.trim() ||
    typeof b.category !== "string" ||
    !b.category.trim() ||
    description === null ||
    medium === null ||
    dimensions === null ||
    (year !== undefined && !Number.isInteger(year)) ||
    (b.featured !== undefined && typeof b.featured !== "boolean")
  ) {
    return NextResponse.json(
      { error: "title, imageUrl and category are required; check field types" },
      { status: 400 },
    );
  }

  const data: NewArtwork = {
    title: b.title.trim(),
    imageUrl: b.imageUrl.trim(),
    category: b.category.trim(),
    description,
    medium,
    dimensions,
    year,
    featured: b.featured ?? false,
  };

  const artwork = await createArtwork(data);
  return NextResponse.json(artwork, { status: 201 });
}
