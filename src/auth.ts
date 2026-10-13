import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@artshowcase.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin12345";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string" ? credentials.email : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
          return {
            id: "admin",
            name: "Admin",
            email: ADMIN_EMAIL,
            role: "ADMIN",
          };
        }

        if (process.env.DATABASE_URL) {
          try {
            const user = await prisma.user.findUnique({ where: { email } });
            if (user && (await bcrypt.compare(password, user.password))) {
              return {
                id: user.id,
                name: user.name ?? "Admin",
                email: user.email,
                role: user.role,
              };
            }
          } catch (error) {
            console.error("Database auth lookup failed:", error);
          }
        }

        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  secret:
    process.env.AUTH_SECRET || "art-showcase-super-secret-pastel-token-2026",
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.name = user.name;
        token.email = user.email;
        token.role = user.role ?? "ADMIN";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.name = token.name ?? session.user.name;
        session.user.email = token.email ?? session.user.email;
        session.user.role =
          typeof token.role === "string" ? token.role : "ADMIN";
      }
      return session;
    },
  },
});
