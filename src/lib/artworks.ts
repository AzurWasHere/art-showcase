import { prisma } from "@/lib/prisma";

export interface Artwork {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  medium?: string;
  dimensions?: string;
  year?: number;
  category: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NewArtwork = Omit<Artwork, "id" | "createdAt" | "updatedAt">;

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;

function seed(n: number, data: NewArtwork, day: number): Artwork {
  const date = new Date(Date.UTC(2026, 0, day)).toISOString();
  return { id: `seed-${n}`, createdAt: date, updatedAt: date, ...data };
}

const CURATED_ARTWORKS: Artwork[] = [
  seed(
    1,
    {
      title: "Blush Horizon",
      description:
        "Soft pastel oils layered into a dreamy sunrise over a quiet sea.",
      imageUrl: img("photo-1579783902614-a3fb3927b6a5"),
      medium: "Oil on canvas",
      dimensions: "90 x 120 cm",
      year: 2024,
      category: "Paintings",
      featured: true,
    },
    1,
  ),
  seed(
    2,
    {
      title: "Quiet Geometry",
      description: "Minimalist digital composition in peach and lavender.",
      imageUrl: img("photo-1550684848-fac1c5b4e853"),
      medium: "Digital illustration",
      dimensions: "4000 x 5000 px",
      year: 2025,
      category: "Digital Art",
      featured: true,
    },
    2,
  ),
  seed(
    3,
    {
      title: "Watercolor Blooms",
      description: "Translucent washes of rose and mint forming wild blooms.",
      imageUrl: img("photo-1578301978693-85fa9c0320b9"),
      medium: "Watercolor on cotton paper",
      dimensions: "50 x 70 cm",
      year: 2023,
      category: "Paintings",
      featured: true,
    },
    3,
  ),
  seed(
    4,
    {
      title: "Pastel Facades",
      description: "Pastel-washed architecture caught in soft morning light.",
      imageUrl: img("photo-1513364776144-60967b0f800f"),
      medium: "Archival pigment print",
      dimensions: "60 x 90 cm",
      year: 2024,
      category: "Photography",
      featured: false,
    },
    4,
  ),
  seed(
    5,
    {
      title: "Marble Whisper",
      description:
        "A hand-carved white marble figure with flowing, soft lines.",
      imageUrl: img("photo-1544413660-299165566b1d"),
      medium: "Carrara marble",
      dimensions: "45 x 30 x 30 cm",
      year: 2022,
      category: "Sculpture",
      featured: false,
    },
    5,
  ),
  seed(
    6,
    {
      title: "Cloud Collage",
      description: "Paper, gouache and gold leaf layered in dusty pink tones.",
      imageUrl: img("photo-1541961017774-22349e4a1262"),
      medium: "Mixed media on panel",
      dimensions: "70 x 70 cm",
      year: 2025,
      category: "Mixed Media",
      featured: true,
    },
    6,
  ),
  seed(
    7,
    {
      title: "Gallery Light",
      description: "A sunlit gallery hall with pale walls and gentle shadows.",
      imageUrl: img("photo-1531913764164-f85c52e6e654"),
      medium: "Digital photograph",
      dimensions: "50 x 75 cm",
      year: 2024,
      category: "Photography",
      featured: false,
    },
    7,
  ),
  seed(
    8,
    {
      title: "Lilac Drift",
      description: "Fluid digital gradients inspired by drifting lilac clouds.",
      imageUrl: img("photo-1557672172-298e090bd0f1"),
      medium: "Generative digital art",
      dimensions: "3000 x 3000 px",
      year: 2026,
      category: "Digital Art",
      featured: false,
    },
    8,
  ),
];

const memoryStore: Artwork[] = [];

type DbArtwork = Awaited<ReturnType<typeof prisma.artwork.findMany>>[number];

function fromDb(row: DbArtwork): Artwork {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    imageUrl: row.imageUrl,
    medium: row.medium ?? undefined,
    dimensions: row.dimensions ?? undefined,
    year: row.year ?? undefined,
    category: row.category,
    featured: row.featured,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function byNewest(a: Artwork, b: Artwork): number {
  return b.createdAt.localeCompare(a.createdAt);
}

export async function getArtworks(): Promise<Artwork[]> {
  if (process.env.DATABASE_URL) {
    try {
      const rows = await prisma.artwork.findMany({
        orderBy: { createdAt: "desc" },
      });
      if (rows.length > 0) return rows.map(fromDb);
    } catch (error) {
      console.error("Failed to load artworks from database:", error);
    }
  }
  return [...memoryStore, ...CURATED_ARTWORKS].sort(byNewest);
}

export async function createArtwork(data: NewArtwork): Promise<Artwork> {
  let artwork: Artwork | undefined;

  if (process.env.DATABASE_URL) {
    try {
      const row = await prisma.artwork.create({
        data: {
          title: data.title,
          description: data.description,
          imageUrl: data.imageUrl,
          medium: data.medium,
          dimensions: data.dimensions,
          year: data.year,
          category: data.category,
          featured: data.featured,
        },
      });
      artwork = fromDb(row);
    } catch (error) {
      console.error("Failed to create artwork in database:", error);
    }
  }

  if (!artwork) {
    const now = new Date().toISOString();
    artwork = {
      ...data,
      id: `mem-${crypto.randomUUID()}`,
      createdAt: now,
      updatedAt: now,
    };
  }

  memoryStore.unshift(artwork);
  return artwork;
}

export async function deleteArtwork(id: string): Promise<boolean> {
  let deleted = false;

  if (process.env.DATABASE_URL) {
    try {
      const result = await prisma.artwork.deleteMany({ where: { id } });
      deleted = result.count > 0;
    } catch (error) {
      console.error("Failed to delete artwork from database:", error);
    }
  }

  const index = memoryStore.findIndex((a) => a.id === id);
  if (index !== -1) {
    memoryStore.splice(index, 1);
    deleted = true;
  }

  return deleted;
}

export function getCategories(): string[] {
  return Array.from(
    new Set([
      ...CURATED_ARTWORKS.map((a) => a.category),
      ...memoryStore.map((a) => a.category),
    ]),
  );
}
