"use client";

import type { TextareaHTMLAttributes } from "react";
import { cn, FieldShell } from "./field";
import { useResolvedPlaceholder } from "../i18n/use-field-placeholder";

type TextareaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "className"> & {
  id?: string;
  label?: string;
  hint?: string;
  error?: string | null;
  className?: string;
  textareaClassName?: string;
};

export function TextareaField({
  id,
  name,
  label,
  hint,
  error,
  required,
  className,
  textareaClassName,
  rows = 3,
  placeholder,
  ...textareaProps
}: TextareaFieldProps) {
  const resolvedPlaceholder = useResolvedPlaceholder({ label, type: "textarea", placeholder });

  return (
    <FieldShell
      id={id}
      name={name}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      {(controlId, resolvedError) => (
        <textarea
          id={controlId}
          name={name}
          rows={rows}
          className={cn(
            "portal-input h-auto min-h-[4.5rem] py-2",
            resolvedError && "border-red-300 focus:border-red-400 focus:ring-red-500/15",
            textareaClassName,
          )}
          required={required}
          aria-invalid={Boolean(resolvedError)}
          placeholder={resolvedPlaceholder}
          {...textareaProps}
        />
      )}
    </FieldShell>
  );
}
