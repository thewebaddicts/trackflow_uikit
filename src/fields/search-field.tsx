"use client";

import { Search, X } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { cn } from "./field";
import { useI18n } from "../i18n/I18nProvider";

export type SearchInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange" | "className"
> & {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  className?: string;
  inputClassName?: string;
  showClear?: boolean;
};

export function SearchInput({
  id,
  name,
  value,
  onChange,
  onClear,
  placeholder,
  className,
  inputClassName,
  showClear = true,
  "aria-label": ariaLabel,
  ...inputProps
}: SearchInputProps) {
  const { t } = useI18n();
  const resolvedPlaceholder = placeholder ?? t("common.search");
  const canClear = showClear && value.length > 0;

  function handleClear() {
    onChange("");
    onClear?.();
  }

  return (
    <div className={cn("portal-search-field", className)}>
      <span className="portal-search-field__leading" aria-hidden="true">
        <Search className="size-4" strokeWidth={1.75} />
      </span>
      <input
        id={id}
        name={name}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={resolvedPlaceholder}
        aria-label={ariaLabel ?? resolvedPlaceholder}
        autoComplete="off"
        className={cn(
          "portal-search-field__input",
          canClear && "portal-search-field__input--clearable",
          inputClassName,
        )}
        {...inputProps}
      />
      {canClear ? (
        <button
          type="button"
          className="portal-search-field__clear"
          aria-label={t("common.clear")}
          onClick={handleClear}
        >
          <X className="size-3.5" strokeWidth={2} aria-hidden />
        </button>
      ) : (
        <span className="portal-search-field__trailing" aria-hidden="true" />
      )}
    </div>
  );
}
