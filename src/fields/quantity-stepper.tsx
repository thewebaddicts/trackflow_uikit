"use client";

import { FieldShell } from "./field";
import { useClearFieldError } from "../validation/form-validation";
import { useI18n } from "../i18n/I18nProvider";

type QuantityStepperProps = {
  id?: string;
  name?: string;
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  className?: string;
};

export function QuantityStepper({
  id,
  name,
  label,
  required,
  hint,
  error,
  value,
  onChange,
  min = 1,
  max,
  className = "",
}: QuantityStepperProps) {
  const { t } = useI18n();
  const clearFieldError = useClearFieldError(name);

  function emitChange(next: number) {
    clearFieldError();
    onChange(next);
  }

  return (
    <FieldShell
      id={id}
      name={name}
      label={label}
      required={required}
      hint={hint}
      error={error}
      className={className}
    >
      {(controlId, resolvedError) => (
        <div className={`portal-field-control ${resolvedError ? "border-red-300" : ""}`.trim()}>
          <button
            type="button"
            className="flex w-9 shrink-0 items-center justify-center border-e border-surface-200 text-[13px] text-surface-600 transition hover:bg-surface-50 disabled:opacity-40"
            disabled={value <= min}
            aria-label={t("common.decrease")}
            onClick={() => emitChange(Math.max(min, value - 1))}
          >
            −
          </button>
          <input
            id={controlId}
            name={name}
            type="number"
            min={min}
            max={max}
            step={1}
            className="min-w-0 flex-1 border-0 bg-transparent text-center text-[13px] font-medium text-surface-900 outline-none"
            value={value}
            aria-invalid={Boolean(resolvedError)}
            onChange={(e) => {
              const raw = Math.floor(Number(e.target.value) || min);
              const capped = max == null ? raw : Math.min(max, raw);
              emitChange(Math.max(min, capped));
            }}
          />
          <button
            type="button"
            className="flex w-9 shrink-0 items-center justify-center border-s border-surface-200 text-[13px] text-surface-600 transition hover:bg-surface-50 disabled:opacity-40"
            aria-label={t("common.increase")}
            disabled={max != null && value >= max}
            onClick={() => {
              const next = value + 1;
              emitChange(max == null ? next : Math.min(max, next));
            }}
          >
            +
          </button>
        </div>
      )}
    </FieldShell>
  );
}
