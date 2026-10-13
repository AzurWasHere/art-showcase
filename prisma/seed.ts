/**
 * Seeds the admin user and, optionally, a local-only starter collection.
 * Idempotent: re-running updates existing rows by slug/email.
 *
 *   pnpm db:seed          (or `npx prisma db seed`)
 *
 * Sample artworks are never committed to the repo. To seed some locally,
 * drop a gitignored `prisma/seed.local.json` next to this file:
 *
 *   [{ "title": "...", "description": "...", "imageUrl": "https://...",
 *      "imageWidth": 1600, "imageHeight": 2000, "medium": "...",
 *      "dimensions": "...", "year": 2026, "category": "Paintings",
 *      "featured": false }]
 */
import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { CATEGORIES, slugify } from "../src/lib/artwork-shared";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set; aborting seed.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const LOCAL_SEED_FILE = join(
  dirname(fileURLToPath(import.meta.url)),
  "seed.local.json",
);

type SeedArtwork = {
  title: string;
  description: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  medium: string;
  dimensions: string;
  year: number;
  category: string;
  featured?: boolean;
};

function isSeedArtwork(value: unknown): value is SeedArtwork {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.title === "string" &&
    typeof v.description === "string" &&
    typeof v.imageUrl === "string" &&
    Number.isInteger(v.imageWidth) &&
    Number.isInteger(v.imageHeight) &&
    typeof v.medium === "string" &&
    typeof v.dimensions === "string" &&
    Number.isInteger(v.year) &&
    typeof v.category === "string" &&
    (CATEGORIES as readonly string[]).includes(v.category) &&
    (v.featured === undefined || typeof v.featured === "boolean")
  );
}

function loadLocalArtworks(): SeedArtwork[] {
  if (!existsSync(LOCAL_SEED_FILE)) return [];
  const parsed: unknown = JSON.parse(readFileSync(LOCAL_SEED_FILE, "utf8"));
  if (!Array.isArray(parsed)) {
    throw new Error("seed.local.json must contain an array of artworks.");
  }
  return parsed.map((entry, index) => {
    if (!isSeedArtwork(entry)) {
      throw new Error(`seed.local.json: entry #${index + 1} is invalid.`);
    }
    return entry;
  });
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("ADMIN_EMAIL / ADMIN_PASSWORD not set; skipping admin user.");
    return null;
  }
  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hash },
    create: { email, password: hash, name: "Curator", role: "ADMIN" },
  });
  console.log(`Admin user ready: ${user.email}`);
  return user;
}

async function seedArtworks(authorId: string | null) {
  const artworks = loadLocalArtworks();
  if (artworks.length === 0) {
    console.log("No prisma/seed.local.json found; skipping sample artworks.");
    return;
  }
  // Space createdAt values a day apart so "newest first" ordering is stable.
  const start = Date.UTC(2026, 0, 1);
  for (const [index, art] of artworks.entries()) {
    const slug = slugify(art.title);
    const data = { ...art, featured: art.featured ?? false, authorId };
    await prisma.artwork.upsert({
      where: { slug },
      update: data,
      create: {
        ...data,
        slug,
        createdAt: new Date(start + index * 86_400_000),
      },
    });
  }
  console.log(`Seeded ${artworks.length} artworks from seed.local.json.`);
}

async function main() {
  const admin = await seedAdmin();
  await seedArtworks(admin?.id ?? null);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
