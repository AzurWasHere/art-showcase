"use client";

import { AlertCircle, ArrowRight, Loader2, LockKeyhole } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authenticate } from "./actions";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState(authenticate, undefined);

  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state?.email ?? ""}
          placeholder="curator@aura.gallery"
          className="h-11 rounded-xl"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-11 rounded-xl"
        />
      </div>

      {state?.error && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-xl bg-destructive/8 px-3 py-2.5 text-sm text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" />
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="h-11 rounded-full bg-brand-gradient text-white hover:opacity-95"
      >
        {pending ? <Loader2 className="animate-spin" /> : <LockKeyhole />}
        {pending ? "Signing in…" : "Sign in"}
        {!pending && <ArrowRight />}
      </Button>
    </form>
  );
}
