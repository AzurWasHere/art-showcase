"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type LoginState = { error: string; email: string } | undefined;

/** Only allow same-origin relative redirects after login. */
function safeCallbackUrl(value: FormDataEntryValue | null): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return "/admin";
  }
  return value;
}

export async function authenticate(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Enter your email and password.", email };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: safeCallbackUrl(formData.get("callbackUrl")),
    });
    return undefined;
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        email,
        error:
          error.type === "CredentialsSignin"
            ? "That email and password don't match."
            : "Sign-in failed. Please try again.",
      };
    }
    // `signIn` redirects by throwing; let Next handle it.
    throw error;
  }
}
