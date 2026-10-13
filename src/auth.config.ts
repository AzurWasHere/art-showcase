import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js configuration shared by `proxy.ts` and `auth.ts`.
 * Contains no database or Node-only imports so the proxy bundle stays small.
 */
export function resolveAuthSecret(): string | undefined {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "development") {
    console.warn(
      "[auth] AUTH_SECRET is not set; using an insecure development-only secret.",
    );
    return "development-only-secret-set-AUTH_SECRET-in-.env";
  }
  return undefined;
}

export const authConfig = {
  secret: resolveAuthSecret(),
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role ?? "ADMIN";
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub ?? "";
      session.user.role = typeof token.role === "string" ? token.role : "ADMIN";
      return session;
    },
  },
} satisfies NextAuthConfig;
