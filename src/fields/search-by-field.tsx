"use client";

import { Search, X } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "./field";
import { SelectInput } from "./select-input";
import { useI18n } from "../i18n/I18nProvider";

export type SearchByOption = {
  value: string;
  label: string;
  shortLabel?: string;
};

type SearchByFieldProps = {
  searchBy: string;
  onSearchByChange: (value: string) => void;
  searchByOptions: SearchByOption[];
  searchByAriaLabel: string;
  className?: string;
  panelMinWidth?: number;
  children?: ReactNode;
};

export function SearchByField({
  searchBy,
  onSearchByChange,
  searchByOptions,
  searchByAriaLabel,
  className,
  panelMinWidth = 240,
  children,
}: SearchByFieldProps) {
  return (
    <div className={cn("portal-field-control h-auto min-h-9 min-w-0", className)}>
      <SelectInput
        embedded
        aria-label={searchByAriaLabel}
        searchable={false}
        value={searchBy}
        options={searchByOptions}
        className="portal-phone-country w-fit shrink-0"
        panelMinWidth={panelMinWidth}
        onChange={(next) => onSearchByChange(String(next))}
      />
      <div className="portal-phone-input-wrap min-w-0">
        <span className="portal-search-field__leading" aria-hidden="true">
          <Search className="size-4" strokeWidth={1.75} />
        </span>
        {children}
      </div>
    </div>
  );
}

type SearchByFieldInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange" | "className"
> & {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
};

export function SearchByFieldInput({
  value,
  onChange,
  onClear,
  placeholder,
  "aria-label": ariaLabel,
  ...inputProps
}: SearchByFieldInputProps) {
  const { t } = useI18n();
  const canClear = value.length > 0;

  return (
    <>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        autoComplete="off"
        className={cn(
          "portal-search-field__input",
          canClear && "portal-search-field__input--clearable",
        )}
        {...inputProps}
      />
      {canClear ? (
        <button
          type="button"
          className="portal-search-field__clear"
          aria-label={t("common.clear")}
          onClick={() => {
            onChange("");
            onClear?.();
          }}
        >
          <X className="size-3.5" strokeWidth={2} aria-hidden />
        </button>
      ) : (
        <span className="portal-search-field__trailing" aria-hidden="true" />
      )}
    </>
  );
}
