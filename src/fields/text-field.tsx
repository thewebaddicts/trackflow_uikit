"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { cn, FieldShell } from "./field";
import { blurNumberInputOnWheel } from "../lib/wheel-guard";
import { useResolvedPlaceholder } from "../i18n/use-field-placeholder";
import { useI18n } from "../i18n/I18nProvider";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className"> & {
  id?: string;
  label?: string;
  labelAccessory?: ReactNode;
  hint?: string;
  error?: string | null;
  className?: string;
  inputClassName?: string;
};

export function TextField({
  id,
  name,
  label,
  labelAccessory,
  hint,
  error,
  required,
  className,
  inputClassName,
  type = "text",
  placeholder,
  ...inputProps
}: TextFieldProps) {
  const { t } = useI18n();
  const resolvedPlaceholder = useResolvedPlaceholder({ label, type, placeholder });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword && passwordVisible ? "text" : type;

  return (
    <FieldShell
      id={id}
      name={name}
      label={label}
      labelAccessory={labelAccessory}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      {(controlId, resolvedError) => {
        const input = (
          <input
            id={controlId}
            name={name}
            type={resolvedType}
            className={cn(
              "portal-input",
              isPassword && "pr-10",
              resolvedError && "border-red-300 focus:border-red-400 focus:ring-red-500/15",
              inputClassName,
            )}
            required={required}
            aria-invalid={Boolean(resolvedError)}
            placeholder={resolvedPlaceholder}
            {...inputProps}
            onWheel={(event) => {
              if (resolvedType === "number") {
                blurNumberInputOnWheel(event);
              }
              inputProps.onWheel?.(event);
            }}
          />
        );

        if (!isPassword) {
          return input;
        }

        return (
          <div className="relative">
            {input}
            <button
              type="button"
              className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-surface-500 transition hover:bg-surface-100 hover:text-surface-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
              onClick={() => setPasswordVisible((current) => !current)}
              aria-label={passwordVisible ? t("common.hidePassword") : t("common.showPassword")}
              aria-pressed={passwordVisible}
            >
              {passwordVisible ? (
                <EyeOff className="size-4" strokeWidth={1.75} aria-hidden />
              ) : (
                <Eye className="size-4" strokeWidth={1.75} aria-hidden />
              )}
            </button>
          </div>
        );
      }}
    </FieldShell>
  );
}
