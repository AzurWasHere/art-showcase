# AURA — Contemporary Art Showcase & Gallery

AURA is a contemporary art showcase and gallery with a public browsing experience and a protected Admin Studio for curating artwork.

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router)
- React 19
- Tailwind CSS v4
- Lucide React icons
- Shadcn UI
- Prisma Postgres v7
- Vercel Blob (image storage)
- NextAuth v5 (authentication)

## Base Color Palette

- **Soft Pastel Pink**
- **Serenity Pastel Blue**
- **Pure White**

## Features

- Responsive art gallery grid
- Category filtering
- Search
- Modal lightbox with high-res details
- Protected Admin Studio with a drag-and-drop artwork uploader via Vercel Blob
- Live artwork deletion/curation

## Environment Variables

Create a `.env` file in the project root:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Postgres connection string used by Prisma. |
| `BLOB_READ_WRITE_TOKEN` | Read/write token for your Vercel Blob store. |
| `AUTH_SECRET` | Secret used by NextAuth to sign sessions. Generate with `npx auth secret` or `openssl rand -base64 32`. |
| `ADMIN_EMAIL` | Email address for the Admin Studio login. |
| `ADMIN_PASSWORD` | Password for the Admin Studio login. |

## Getting Started

```bash
pnpm install
npx prisma generate
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Other scripts: `pnpm lint`, `pnpm build`, `pnpm start`.

## Admin Studio

Demo login (change before going to production):

- Email: `admin@artshowcase.com`
- Password: `admin12345`

## Deploying to Vercel

1. Push the repository to GitHub and import it at [vercel.com/new](https://vercel.com/new).
2. In the project's **Storage** tab, create or connect a **Postgres** database (Prisma Postgres). This sets `DATABASE_URL`.
3. In **Storage**, create a **Blob** store and connect it to the project. This sets `BLOB_READ_WRITE_TOKEN`.
4. In **Settings → Environment Variables**, add `AUTH_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.
5. Deploy. To use the same storage locally, run `vercel env pull .env.local`.
6. Apply the database schema to the connected database if needed (for example `npx prisma migrate deploy` or `npx prisma db push`).
