# AURA — Art Showcase

A gallery website for uploading and showcasing artwork. Visitors browse a
masonry gallery with search, category and featured filters, a keyboard-navigable
lightbox and per-artwork pages; a signed-in curator manages the collection from
an admin dashboard. The home page opens with a WebGPU watercolor simulation that
reacts to the pointer, and `/for-you` is a full-screen WebGPU meadow of lily of
the valley swaying in the wind.

**Palette:** pastel pink · pastel blue · white.

## Stack

| Area | Choice |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router, Cache Components, React Compiler) |
| UI | [shadcn/ui](https://ui.shadcn.com) on Base UI, Tailwind CSS v4, [lucide-react](https://lucide.dev) icons, [sonner](https://sonner.emilkowal.ski) toasts |
| Data | [Prisma 7](https://www.prisma.io) + PostgreSQL (`@prisma/adapter-pg`) |
| Images | [Vercel Blob](https://vercel.com/storage/blob) in production, `public/uploads/` in development |
| Auth | [Auth.js v5](https://authjs.dev) (NextAuth) credentials provider, JWT sessions, `proxy.ts` route guard |
| WebGPU | Watercolor compute simulation (home hero) and a procedural 3D lily-of-the-valley scene with vertex-shader wind (`/for-you`), both with reduced-motion and no-WebGPU fallbacks |

## Project layout

```
src/
  app/
    (site)/            public pages: home, gallery, gallery/[slug]
    (immersive)/       full-screen pages without the footer: for-you
    (auth)/login/      curator sign-in (Server Action)
    admin/             protected dashboard: list, new, [id]/edit
    api/upload/        Vercel Blob client-upload token route
    api/upload/local/  dev-only local upload route
    api/auth/          Auth.js handlers
  components/
    site/ home/ gallery/ admin/ ui/   feature and shadcn components
    webgpu/            watercolor hero; lily/ = meadow geometry, shaders, engine
  lib/
    prisma.ts          lazy Prisma client (pg adapter)
    artworks.ts        cached data layer ("use cache" + cache tags)
  auth.ts, auth.config.ts, proxy.ts
prisma/
  schema.prisma, migrations/, seed.ts
```

Reads go through `src/lib/artworks.ts`, which is cached with `"use cache"` and
tagged. Server Actions in `src/app/admin/actions.ts` perform writes and call
`updateTag()` so every page reflects changes immediately.

## Local development

Requirements: Node 20+, [pnpm](https://pnpm.io), Docker Desktop (for Postgres).

```bash
pnpm install
cp .env.example .env        # then fill in AUTH_SECRET (npx auth secret) and ADMIN_*
pnpm db:up                  # Postgres 17 in Docker on localhost:5433
pnpm db:migrate             # apply migrations (also regenerates the Prisma client)
pnpm db:seed                # create the admin user (+ optional local sample data)
pnpm dev
```

Open <http://localhost:3000>. Sign in at `/login` with `ADMIN_EMAIL` /
`ADMIN_PASSWORD` and add artwork from `/admin`.

Without `BLOB_READ_WRITE_TOKEN`, uploads are written to `public/uploads/`
(gitignored) so the full flow works offline.

### Sample data

The repository ships with no sample artworks. To seed some on your machine, add
a gitignored `prisma/seed.local.json` containing an array of:

```json
{
  "title": "Blush Current",
  "description": "…",
  "imageUrl": "https://images.unsplash.com/photo-…?auto=format&fit=crop&w=1600&q=80",
  "imageWidth": 1600,
  "imageHeight": 2400,
  "medium": "Acrylic pour on canvas",
  "dimensions": "90 × 120 cm",
  "year": 2025,
  "category": "Paintings",
  "featured": true
}
```

`category` must be one of the values in `src/lib/artwork-shared.ts`. Re-running
`pnpm db:seed` upserts by slug, so it is safe to repeat.

### Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js dev server / production build / serve |
| `pnpm lint` / `pnpm format` | Biome check / format |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm db:up` / `pnpm db:down` | Start / stop the Docker Postgres container |
| `pnpm db:migrate` | `prisma migrate dev` (create + apply migrations locally) |
| `pnpm db:deploy` | `prisma migrate deploy` (apply committed migrations, e.g. in production) |
| `pnpm db:seed` | Run `prisma/seed.ts` |
| `pnpm db:studio` | Open Prisma Studio |

## Environment variables

See [`.env.example`](./.env.example).

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string. Local default targets the Docker container. |
| `AUTH_SECRET` | yes | Signs Auth.js sessions. `npx auth secret` generates one. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | yes | Seeded admin account; also accepted directly by the login form as a fallback. |
| `BLOB_READ_WRITE_TOKEN` | production | Vercel Blob token. Omit locally to use `public/uploads/`. |
| `DB_PORT` | no | Host port for the Docker Postgres container (default `5433`). |

## Deploying to Vercel

1. Import the repository at [vercel.com/new](https://vercel.com/new) (this
   project is linked to `art-showcase`).
2. **Storage → Create → Postgres** (Prisma Postgres) and connect it to the
   project; this provides `DATABASE_URL`.
3. **Storage → Create → Blob** and connect it; this provides
   `BLOB_READ_WRITE_TOKEN`.
4. **Settings → Environment Variables:** add `AUTH_SECRET`, `ADMIN_EMAIL`,
   `ADMIN_PASSWORD`.
5. Apply the schema to the production database once:
   `vercel env pull .env.production.local && pnpm prisma migrate deploy`
   (or run `pnpm db:deploy` with `DATABASE_URL` pointed at production).
6. Deploy. The build runs `prisma generate && next build`; artwork pages are
   prerendered and revalidated on demand through cache tags.

Allowed remote image hosts are configured in `next.config.ts`
(`images.unsplash.com` and `*.public.blob.vercel-storage.com`).