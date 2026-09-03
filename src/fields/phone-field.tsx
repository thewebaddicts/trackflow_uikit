"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  type Country,
  getCountries,
  getCountryCallingCode,
} from "react-phone-number-input";
import ar from "react-phone-number-input/locale/ar.json";
import en from "react-phone-number-input/locale/en.json";
import { SelectInput } from "./select-input";
import { cn, FieldShell } from "./field";
import { useResolvedPlaceholder } from "../i18n/use-field-placeholder";
import { useI18n } from "../i18n/I18nProvider";
import { isPhoneNumberValid } from "../lib/phone-validation";

type PhoneFieldProps = {
  id?: string;
  name?: string;
  label?: string;
  labelAccessory?: ReactNode;
  hint?: string;
  error?: string | null;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  value: string;
  country?: string;
  defaultCountry?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onCountryChange?: (country: string) => void;
  onBlur?: () => void;
  showValidationStatus?: boolean;
};

function resolveCountry(code?: string): Country {
  const normalized = (code ?? "AE").trim().toUpperCase();

  if (/^[A-Z]{2}$/.test(normalized)) {
    return normalized as Country;
  }

  return "AE";
}

function countryFlag(iso: string): string {
  return iso
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

const countryOptions = getCountries().map((iso) => {
  const callingCode = getCountryCallingCode(iso);
  const nameEn = en[iso as keyof typeof en] ?? iso;
  const nameAr = ar[iso as keyof typeof ar] ?? nameEn;

  return {
    value: iso,
    label: `${countryFlag(iso)} ${nameEn} (+${callingCode})`,
    label_ar: `${countryFlag(iso)} ${nameAr} (+${callingCode})`,
    shortLabel: `${countryFlag(iso)} +${callingCode}`,
  };
});

/**
 * Map from calling code string → preferred country ISO.
 * Longer codes take priority (e.g. "44" exists but "441624" is IM).
 * For ambiguous codes (like "1" shared by US/CA/etc.) we default to the
 * most common country — US for +1. Build longest-first so we can match
 * greedily when scanning the typed prefix.
 */
const callingCodeToCountry: Record<string, Country> = (() => {
  // Priority overrides for ambiguous codes
  const preferred: Record<string, Country> = { "1": "US", "44": "GB", "7": "RU" };
  const map: Record<string, Country> = {};
  getCountries().forEach((iso) => {
    const code = getCountryCallingCode(iso);
    if (!map[code] || preferred[code] === iso) {
      map[code] = iso as Country;
    }
  });
  return map;
})();

/** Detect country from a +XXX prefix by trying 1-, 2-, 3-digit codes. */
function detectCountryFromPrefix(text: string): Country | null {
  if (!text.startsWith("+")) return null;
  const digits = text.slice(1).replace(/\D/g, "");
  // Try longest match first (3 → 2 → 1)
  for (const len of [3, 2, 1]) {
    const code = digits.slice(0, len);
    if (code.length === len && callingCodeToCountry[code]) {
      return callingCodeToCountry[code];
    }
  }
  return null;
}

function IconCheck() {
  return (
    <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden>
      <path
        d="m5.5 10.2 2.4 2.4 6.6-6.6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconX() {
  return (
    <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden>
      <path
        d="m6.5 6.5 7 7M13.5 6.5l-7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PhoneField({
  id,
  name,
  label,
  labelAccessory,
  hint,
  error,
  required,
  disabled = false,
  className,
  value,
  country,
  defaultCountry = "AE",
  placeholder,
  onChange,
  onCountryChange,
  onBlur,
  showValidationStatus = true,
}: PhoneFieldProps) {
  const { t } = useI18n();
  const resolvedPlaceholder = useResolvedPlaceholder({ label, type: "tel", placeholder });
  const resolvedCountry = resolveCountry(country ?? defaultCountry);
  const [selectedCountry, setSelectedCountry] = useState<Country>(resolvedCountry);

  // Raw text the user is typing — kept separately so nothing is ever hardcoded
  const [rawText, setRawText] = useState(value ?? "");

  // Sync country prop changes from outside
  useEffect(() => {
    setSelectedCountry(resolvedCountry);
  }, [resolvedCountry]);

  // Sync value prop changes from outside (e.g. form reset)
  const prevValue = useRef(value);
  useEffect(() => {
    if (value !== prevValue.current) {
      prevValue.current = value;
      setRawText(value ?? "");
    }
  }, [value]);

  const trimmedValue = rawText.trim();
  const isValid = isPhoneNumberValid(trimmedValue, selectedCountry);
  const showStatus = showValidationStatus && trimmedValue.length > 0;

  function handleTextChange(text: string) {
    setRawText(text);
    onChange(text);

    // Detect country as soon as the calling code prefix is recognisable
    const detected = detectCountryFromPrefix(text);
    if (detected && detected !== selectedCountry) {
      setSelectedCountry(detected);
      onCountryChange?.(detected);
    }
  }

  function handleCountrySelect(iso: string) {
    setSelectedCountry(iso as Country);
    onCountryChange?.(iso);

    // If the current text starts with a +, replace the calling code prefix
    if (rawText.startsWith("+")) {
      const newCode = `+${getCountryCallingCode(iso as Country)}`;
      const oldCode = `+${getCountryCallingCode(selectedCountry)}`;
      const rest = rawText.startsWith(oldCode)
        ? rawText.slice(oldCode.length)
        : rawText.replace(/^\+\d{1,4}/, "");
      const updated = newCode + rest;
      setRawText(updated);
      onChange(updated);
    }
  }

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
      {(controlId, resolvedError) => (
        <div
          className={cn(
            "portal-field-control portal-phone-field",
            disabled && "bg-surface-50 opacity-60",
            resolvedError && "border-red-300",
            showStatus && isValid && "portal-phone-field--valid",
            showStatus && !isValid && "portal-phone-field--invalid",
          )}
          aria-invalid={Boolean(resolvedError)}
          aria-required={required}
        >
          <SelectInput
            embedded
            aria-label={t("common.phoneCountry")}
            options={countryOptions}
            value={selectedCountry}
            searchable
            disabled={disabled}
            panelMinWidth={300}
            className="portal-phone-country"
            onChange={(next) => {
              const iso = typeof next === "string" ? next : (next[0] ?? "");
              if (iso) {
                handleCountrySelect(iso);
              }
            }}
          />
          <div className="portal-phone-input-wrap">
            <input
              id={controlId}
              name={name}
              type="tel"
              className="portal-phone-number-input"
              value={rawText}
              onChange={(e) => handleTextChange(e.target.value)}
              onBlur={onBlur}
              disabled={disabled}
              placeholder={resolvedPlaceholder}
              required={required}
              autoComplete="tel"
            />
            {showStatus ? (
              <span
                className={cn(
                  "portal-phone-status",
                  isValid ? "is-valid" : "is-invalid",
                )}
                aria-label={isValid ? t("common.validPhone") : t("common.invalidPhone")}
              >
                {isValid ? <IconCheck /> : <IconX />}
              </span>
            ) : null}
          </div>
        </div>
      )}
    </FieldShell>
  );
}
