import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const guard = auth((request, _event: NextFetchEvent) => {
  if (request.auth?.user) return NextResponse.next();
  const login = new URL("/login", request.nextUrl);
  login.searchParams.set(
    "callbackUrl",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(login);
});

/**
 * Guards /admin at the network edge. Server Actions and the admin layout
 * re-check the session, so this is defence in depth rather than the only lock.
 */
export function proxy(request: NextRequest, event: NextFetchEvent) {
  return guard(request, event);
}

export const config = {
  matcher: ["/admin/:path*"],
};
