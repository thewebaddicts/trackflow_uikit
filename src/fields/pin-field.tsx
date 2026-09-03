"use client";

import { useMemo } from "react";
import { unstable_OneTimePasswordField as OneTimePasswordField } from "radix-ui";
import { cn, FieldShell } from "./field";
import { useClearFieldError } from "../validation/form-validation";
import { useI18n } from "../i18n/I18nProvider";

type PinFieldProps = {
  id?: string;
  name?: string;
  label?: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  length?: number;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  autoSubmit?: boolean;
};

export function PinField({
  id,
  name,
  label,
  hint,
  error,
  required,
  disabled = false,
  className,
  length = 6,
  value,
  onChange,
  autoFocus = false,
  autoSubmit = false,
}: PinFieldProps) {
  const { dir } = useI18n();
  const clearFieldError = useClearFieldError(name);
  const slots = useMemo(() => Array.from({ length }, (_, index) => index), [length]);

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
        <OneTimePasswordField.Root
          value={value}
          validationType="numeric"
          autoComplete="one-time-code"
          disabled={disabled}
          autoFocus={autoFocus}
          autoSubmit={autoSubmit}
          dir={dir}
          className="portal-pin-field"
          onValueChange={(next) => {
            clearFieldError();
            onChange(next);
          }}
        >
          {slots.map((index) => (
            <OneTimePasswordField.Input
              key={index}
              index={index}
              id={index === 0 ? controlId : undefined}
              className={cn(
                "portal-pin-input",
                resolvedError && "border-red-300 focus:border-red-400 focus:ring-red-500/15",
              )}
              aria-invalid={Boolean(resolvedError)}
            />
          ))}
          {name ? <OneTimePasswordField.HiddenInput name={name} required={required} /> : null}
        </OneTimePasswordField.Root>
      )}
    </FieldShell>
  );
}
