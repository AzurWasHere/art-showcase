import { createHash, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { connection } from "next/server";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { db } from "@/lib/prisma";

type AdminUser = { id: string; name: string; email: string; role: string };

/** Constant-time comparison that doesn't leak length differences. */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * Bootstrap credentials from the environment. Lets a fresh deployment log in
 * before the database has been seeded; the seed script hashes the same pair
 * into the `User` table.
 */
function matchEnvAdmin(email: string, password: string): AdminUser | null {
  const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const envPassword = process.env.ADMIN_PASSWORD;
  if (!envEmail || !envPassword) return null;
  if (safeEqual(email, envEmail) && safeEqual(password, envPassword)) {
    return { id: "env-admin", name: "Curator", email: envEmail, role: "ADMIN" };
  }
  return null;
}

async function matchDbUser(
  email: string,
  password: string,
): Promise<AdminUser | null> {
  try {
    const user = await db().user.findUnique({ where: { email } });
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return null;
    return {
      id: user.id,
      name: user.name ?? "Curator",
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    console.error("[auth] database lookup failed:", error);
    return null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        const user =
          (await matchDbUser(email, password)) ??
          matchEnvAdmin(email, password);
        return user;
      },
    }),
  ],
});

/** Narrow session read for Server Components and Server Actions. */
export async function getCurrentUser() {
  // Auth.js generates a CSRF token (crypto.getRandomValues) while reading the
  // session; opting into request time keeps that out of the static prerender.
  await connection();
  const session = await auth();
  if (!session?.user?.email) return null;
  return {
    id: session.user.id,
    name: session.user.name ?? "Curator",
    email: session.user.email,
    role: session.user.role,
  };
}

/** Throws when no admin session is present. Use at the top of every mutation. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return user;
}
