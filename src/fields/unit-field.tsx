"use client";

import {
  useLayoutEffect,
  useRef,
  type ChangeEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
} from "react";
import { cn, FieldShell } from "./field";
import { SelectInput } from "./select-input";
import { useResolvedPlaceholder } from "../i18n/use-field-placeholder";
import { formatAmountInput, parseAmountInput } from "../lib/format-amount";

export type UnitOption = {
  value: string;
  label: string;
};

type UnitFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "className" | "value" | "onChange"
> & {
  id?: string;
  label?: string;
  hint?: string;
  error?: string | null;
  className?: string;
  value: string;
  onChange: (value: string) => void;
  unit: string;
  units: UnitOption[];
  onUnitChange?: (unit: string) => void;
  /** Format the value with thousand separators (amount / money inputs). */
  thousandSeparated?: boolean;
};

function minForbidsNegatives(min: InputHTMLAttributes<HTMLInputElement>["min"]): boolean {
  if (min === undefined || min === "") {
    return false;
  }
  const parsed = Number(min);
  return Number.isFinite(parsed) && parsed >= 0;
}

/** Strip minus signs when the field's min does not allow negatives. */
function sanitizeNumericValue(
  raw: string,
  min: InputHTMLAttributes<HTMLInputElement>["min"],
): string {
  if (!minForbidsNegatives(min)) {
    return raw;
  }
  return raw.replace(/-/g, "");
}

function blockNegativeKey(
  event: KeyboardEvent<HTMLInputElement>,
  min: InputHTMLAttributes<HTMLInputElement>["min"],
): void {
  if (!minForbidsNegatives(min)) {
    return;
  }
  if (event.key === "-" || event.key === "Subtract") {
    event.preventDefault();
  }
}

function caretAfterFormat(raw: string, caret: number, formatted: string): number {
  const digitsBeforeCaret = raw.slice(0, caret).replace(/[^\d]/g, "").length;
  let pos = 0;
  let digitsSeen = 0;

  while (pos < formatted.length && digitsSeen < digitsBeforeCaret) {
    if (/\d/.test(formatted[pos] ?? "")) {
      digitsSeen += 1;
    }
    pos += 1;
  }

  return pos;
}

export function UnitField({
  id,
  name,
  label,
  hint,
  error,
  required,
  className,
  value,
  onChange,
  unit,
  units,
  onUnitChange,
  thousandSeparated = false,
  disabled,
  onKeyDown,
  onFocus,
  onBlur,
  min,
  type,
  inputMode,
  placeholder,
  ...inputProps
}: UnitFieldProps & { name?: string }) {
  const resolvedPlaceholder = useResolvedPlaceholder({
    label,
    type: thousandSeparated ? "money" : (type ?? "text"),
    placeholder,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaret = useRef<number | null>(null);
  const unitLocked = !onUnitChange || units.length <= 1;

  const displayValue = thousandSeparated ? formatAmountInput(value) : value;
  const resolvedType = thousandSeparated ? "text" : type;
  const resolvedInputMode = thousandSeparated ? (inputMode ?? "decimal") : inputMode;

  useLayoutEffect(() => {
    if (pendingCaret.current === null || !inputRef.current) {
      return;
    }

    const nextCaret = pendingCaret.current;
    pendingCaret.current = null;
    inputRef.current.setSelectionRange(nextCaret, nextCaret);
  }, [displayValue]);

  const handleChange = (raw: string, caret: number | null) => {
    const parsed = thousandSeparated ? parseAmountInput(raw) : raw;
    const next = sanitizeNumericValue(parsed, min);

    if (thousandSeparated && caret !== null) {
      pendingCaret.current = caretAfterFormat(raw, caret, formatAmountInput(next));
    }

    onChange(next);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    blockNegativeKey(event, min);
    onKeyDown?.(event);
  };

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
        <div
          className={cn(
            "portal-field-control",
            disabled && "bg-surface-50 opacity-60",
            resolvedError && "border-red-300",
          )}
        >
          <input
            ref={inputRef}
            id={controlId}
            name={name}
            className="min-w-0 flex-1 border-0 bg-transparent px-3 text-[13px] text-surface-900 outline-none placeholder:text-surface-500"
            value={displayValue}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(resolvedError)}
            placeholder={resolvedPlaceholder}
            {...inputProps}
            type={resolvedType}
            inputMode={resolvedInputMode}
            min={min}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              handleChange(e.target.value, e.target.selectionStart);
            }}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            onBlur={onBlur}
          />
          {unitLocked ? (
            <span className="portal-field-unit">
              {units.find((option) => option.value === unit)?.label ?? unit}
            </span>
          ) : (
            <div className="portal-field-unit portal-field-unit-select relative min-w-[4.25rem] shrink-0 px-0">
              <SelectInput
                embedded
                size="xs"
                aria-label={`${label ?? "Value"} unit`}
                options={units}
                value={unit}
                disabled={disabled}
                searchable={units.length > 6}
                panelMinWidth={140}
                className="h-full w-full"
                triggerClassName="justify-center"
                onChange={(next) => {
                  const resolved = typeof next === "string" ? next : (next[0] ?? "");
                  if (resolved !== "") {
                    onUnitChange?.(resolved);
                  }
                }}
              />
            </div>
          )}
        </div>
      )}
    </FieldShell>
  );
}
