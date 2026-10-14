"use client";

/**
 * App-wide TanStack Form setup. `useAppForm` comes with shadcn-styled field
 * components pre-bound, so a field is one line:
 *
 *   <form.AppField name="title">
 *     {(field) => <field.TextField label="Title" />}
 *   </form.AppField>
 *
 * Errors show once a field is touched (every field is touched on submit) and
 * accept both plain strings and Standard Schema issues from Zod.
 */
import {
  createFormHook,
  createFormHookContexts,
  useStore,
} from "@tanstack/react-form";
import { AlertCircle, Loader2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

function messageOf(error: unknown): string | undefined {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    const { message } = error as { message: unknown };
    if (typeof message === "string") return message;
  }
  return undefined;
}

/** First visible error for a field, or undefined until it has been touched. */
export function fieldError(meta: {
  isTouched: boolean;
  errors: readonly unknown[];
}): string | undefined {
  if (!meta.isTouched) return undefined;
  for (const error of meta.errors) {
    const message = messageOf(error);
    if (message) return message;
  }
  return undefined;
}

function FieldShell({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

type TextFieldProps = { label: string } & Omit<
  ComponentProps<typeof Input>,
  "id" | "name" | "value" | "onChange" | "onBlur"
>;

function TextField({ label, className, ...props }: TextFieldProps) {
  const field = useFieldContext<string>();
  const error = fieldError(field.state.meta);
  return (
    <FieldShell id={field.name} label={label} error={error}>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onChange={(event) => field.handleChange(event.target.value)}
        onBlur={field.handleBlur}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${field.name}-error` : undefined}
        className={className ?? "h-11 rounded-xl"}
        {...props}
      />
    </FieldShell>
  );
}

type TextareaFieldProps = { label: string } & Omit<
  ComponentProps<typeof Textarea>,
  "id" | "name" | "value" | "onChange" | "onBlur"
>;

function TextareaField({ label, className, ...props }: TextareaFieldProps) {
  const field = useFieldContext<string>();
  const error = fieldError(field.state.meta);
  return (
    <FieldShell id={field.name} label={label} error={error}>
      <Textarea
        id={field.name}
        name={field.name}
        value={field.state.value}
        onChange={(event) => field.handleChange(event.target.value)}
        onBlur={field.handleBlur}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${field.name}-error` : undefined}
        className={className ?? "min-h-32 rounded-xl"}
        {...props}
      />
    </FieldShell>
  );
}

function SelectField({
  label,
  options,
}: {
  label: string;
  options: readonly string[];
}) {
  const field = useFieldContext<string>();
  const error = fieldError(field.state.meta);
  return (
    <FieldShell id={field.name} label={label} error={error}>
      <Select
        value={field.state.value}
        onValueChange={(value) => {
          if (typeof value === "string") field.handleChange(value);
        }}
        items={options.map((option) => ({ value: option, label: option }))}
      >
        <SelectTrigger
          id={field.name}
          onBlur={field.handleBlur}
          aria-invalid={Boolean(error)}
          className="h-11 w-full rounded-xl"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-2xl">
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  );
}

function SwitchField({
  label,
  description,
  icon,
}: {
  label: string;
  description?: string;
  icon?: ReactNode;
}) {
  const field = useFieldContext<boolean>();
  return (
    <Label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-accent/60 px-4 py-3.5">
      <span className="flex items-center gap-2.5">
        {icon}
        <span>
          <span className="block text-sm font-medium">{label}</span>
          {description && (
            <span className="block text-xs font-normal text-muted-foreground">
              {description}
            </span>
          )}
        </span>
      </span>
      <Switch
        checked={field.state.value}
        onCheckedChange={(checked) => field.handleChange(checked)}
        onBlur={field.handleBlur}
      />
    </Label>
  );
}

function SubmitButton({
  children,
  pendingLabel,
  icon,
  className,
}: {
  children: ReactNode;
  pendingLabel: string;
  icon?: ReactNode;
  className?: string;
}) {
  const form = useFormContext();
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  return (
    <Button
      type="submit"
      size="lg"
      disabled={isSubmitting}
      className={className}
    >
      {isSubmitting ? <Loader2 className="animate-spin" /> : icon}
      {isSubmitting ? pendingLabel : children}
    </Button>
  );
}

/** Form-level error returned by an `onSubmitAsync` validator (e.g. the server). */
function FormError() {
  const form = useFormContext();
  const error = useStore(form.store, (state) =>
    messageOf(state.errorMap.onSubmit),
  );
  if (!error) return null;
  return (
    <p
      role="alert"
      className="flex items-center gap-2 rounded-xl bg-destructive/8 px-3 py-2.5 text-sm text-destructive"
    >
      <AlertCircle className="size-4 shrink-0" />
      {error}
    </p>
  );
}

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField, TextareaField, SelectField, SwitchField },
  formComponents: { SubmitButton, FormError },
});
