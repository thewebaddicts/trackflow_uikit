"use client";

import { useState } from "react";

import { FieldShell } from "./field";
import { blurNumberInputOnWheel } from "../lib/wheel-guard";
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
  // Lets the field sit empty or out of range while typing, instead of clamping every keystroke.
  const [draft, setDraft] = useState<string | null>(null);
  const [committed, setCommitted] = useState(value);

  if (value !== committed) {
    setCommitted(value);
    setDraft(null);
  }

  function emitChange(next: number) {
    setDraft(null);
    clearFieldError();
    onChange(next);
  }

  function clamp(next: number) {
    return Math.max(min, max == null ? next : Math.min(max, next));
  }

  function handleTyping(raw: string) {
    setDraft(raw);
    const parsed = Math.floor(Number(raw));
    if (raw.trim() === "" || !Number.isFinite(parsed) || parsed !== clamp(parsed)) {
      return;
    }
    clearFieldError();
    onChange(parsed);
  }

  function commitDraft() {
    if (draft == null) {
      return;
    }
    const parsed = Math.floor(Number(draft));
    setDraft(null);
    if (draft.trim() === "" || !Number.isFinite(parsed)) {
      return;
    }
    emitChange(clamp(parsed));
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
            value={draft ?? String(value)}
            aria-invalid={Boolean(resolvedError)}
            onChange={(e) => handleTyping(e.target.value)}
            onWheel={blurNumberInputOnWheel}
            onBlur={commitDraft}
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
