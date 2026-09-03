"use client";

import { cn, FieldShell } from "./field";

type CheckboxFieldProps = {
  id?: string;
  name?: string;
  label: string;
  hint?: string;
  error?: string | null;
  checked?: boolean;
  defaultChecked?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  onChange?: (checked: boolean) => void;
};

export function CheckboxField({
  id,
  name,
  label,
  hint,
  error,
  checked,
  defaultChecked,
  required,
  disabled,
  className,
  onChange,
}: CheckboxFieldProps) {
  const isControlled = checked !== undefined;

  return (
    <FieldShell
      id={id}
      name={name}
      hint={hint}
      error={error}
      required={required}
      labelPlacement="inline"
      className={className}
    >
      {(controlId) => (
        <label
          htmlFor={controlId}
          className={cn(
            "cms-checkbox-field",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          <input
            id={controlId}
            name={name}
            type="checkbox"
            {...(isControlled ? { checked } : { defaultChecked })}
            disabled={disabled}
            required={required}
            className="peer sr-only"
            onChange={(event) => onChange?.(event.target.checked)}
          />
          <span
            className={cn(
              "portal-checkbox",
              (isControlled ? checked : undefined) && "is-checked",
            )}
            aria-hidden="true"
          />
          <span className="cms-checkbox-label">
            {label}
            {required ? <span className="text-brand-600"> *</span> : null}
          </span>
        </label>
      )}
    </FieldShell>
  );
}

type ToggleFieldProps = CheckboxFieldProps & {
  labelPlacement?: "stacked" | "inline";
};

export function ToggleField({
  id,
  name,
  label,
  hint,
  error,
  checked = false,
  required,
  disabled,
  className,
  labelPlacement = "inline",
  onChange,
}: ToggleFieldProps) {
  return (
    <FieldShell
      id={id}
      name={name}
      label={labelPlacement === "stacked" ? label : undefined}
      hint={hint}
      error={error}
      required={required}
      labelPlacement={labelPlacement}
      className={className}
    >
      {(controlId) => (
        <div className="cms-toggle-field">
          <label htmlFor={controlId} className="cms-toggle">
            <input
              id={controlId}
              name={name}
              type="checkbox"
              checked={checked}
              disabled={disabled}
              required={required}
              className="peer sr-only"
              onChange={(event) => onChange?.(event.target.checked)}
            />
            <span className="cms-toggle-track" aria-hidden="true" />
          </label>
          {labelPlacement === "inline" ? (
            <label htmlFor={controlId} className="cms-checkbox-label cursor-pointer">
              {label}
              {required ? <span className="text-brand-600"> *</span> : null}
            </label>
          ) : null}
        </div>
      )}
    </FieldShell>
  );
}
