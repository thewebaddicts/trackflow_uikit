"use client";

import { ChevronDown, CircleHelp } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { cn } from "./field";
import { useFormValidationOptional } from "../validation/form-validation";
import { useI18n } from "../i18n/I18nProvider";

const RTL_LOCALES = new Set(["ar", "he", "fa", "ur"]);

type TranslatableTextFieldProps = {
  label: string;
  localeFields: Record<string, string>;
  localeLabels?: Record<string, string>;
  localePlaceholders?: Record<string, string>;
  placeholder?: string | null;
  values: Record<string, string>;
  onChange: (fieldName: string, value: string) => void;
  hint?: string | null;
  required?: boolean;
  className?: string;
};

function resolveLocalePlaceholder(
  locale: string,
  fieldLabel: string,
  localeLabels: Record<string, string>,
  localePlaceholders: Record<string, string>,
  fieldPlaceholder: string | null | undefined,
  enterLocaleLabel: (localeLabel: string, label: string) => string,
): string {
  const explicit = localePlaceholders[locale]?.trim();
  if (explicit) {
    return explicit;
  }

  if (locale === "en" && fieldPlaceholder?.trim()) {
    return fieldPlaceholder.trim();
  }

  const localeLabel = localeLabels[locale] ?? locale.toUpperCase();

  return enterLocaleLabel(localeLabel, fieldLabel);
}

function isLocaleSwitchKey(event: KeyboardEvent): boolean {
  return (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.code === "Semicolon";
}

export function TranslatableTextField({
  label,
  localeFields,
  localeLabels = {},
  localePlaceholders = {},
  placeholder,
  values,
  onChange,
  hint,
  required = false,
  className,
}: TranslatableTextFieldProps) {
  const { locale: uiLocale, t } = useI18n();
  const enterLocaleLabel = useCallback(
    (localeLabel: string, fieldLabel: string) =>
      t("fields.enterLocaleLabel", { locale: localeLabel, label: fieldLabel }),
    [t],
  );
  const validation = useFormValidationOptional();
  const rootRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const localeCodes = useMemo(() => Object.keys(localeFields), [localeFields]);

  const locales = useMemo(
    () =>
      Object.entries(localeFields).map(([code, fieldName]) => ({
        code,
        fieldName,
        label: localeLabels[code] ?? code.toUpperCase(),
        placeholder: resolveLocalePlaceholder(
          code,
          label,
          localeLabels,
          localePlaceholders,
          placeholder,
          enterLocaleLabel,
        ),
        value: values[code] ?? "",
        dir: RTL_LOCALES.has(code) ? ("rtl" as const) : ("ltr" as const),
        error: validation?.getError(fieldName) ?? null,
        required,
      })),
    [
      enterLocaleLabel,
      label,
      localeFields,
      localeLabels,
      localePlaceholders,
      placeholder,
      required,
      validation,
      values,
    ],
  );

  const defaultLocale = localeCodes.includes(uiLocale) ? uiLocale : localeCodes[0] ?? "en";

  const [activeLocale, setActiveLocale] = useState(defaultLocale);
  const [open, setOpen] = useState(false);

  const activeItem = locales.find((item) => item.code === activeLocale) ?? locales[0];
  const hasInputError = locales.some((item) => Boolean(item.error));

  const localeWithError = useMemo(() => {
    return locales.find((item) => item.error)?.code ?? null;
  }, [locales]);

  const showLocale = useCallback(
    (locale: string, { focusInput = true }: { focusInput?: boolean } = {}) => {
      if (!localeCodes.includes(locale)) {
        return;
      }

      setActiveLocale(locale);
      setOpen(false);

      if (focusInput) {
        window.requestAnimationFrame(() => {
          rootRef.current
            ?.querySelector<HTMLInputElement>(`input[data-locale="${locale}"]`)
            ?.focus();
        });
      }
    },
    [localeCodes],
  );

  const cycleLocale = useCallback(() => {
    if (localeCodes.length <= 1) {
      return;
    }

    const currentIndex = localeCodes.indexOf(activeLocale);
    const nextIndex = (currentIndex + 1) % localeCodes.length;
    showLocale(localeCodes[nextIndex] ?? activeLocale);
  }, [activeLocale, localeCodes, showLocale]);

  useEffect(() => {
    if (localeWithError) {
      setActiveLocale(localeWithError);
      return;
    }

    if (localeCodes.includes(uiLocale)) {
      setActiveLocale(uiLocale);
    }
  }, [localeWithError, localeCodes, uiLocale]);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  function handleLocaleSwitchKey(event: KeyboardEvent) {
    if (!isLocaleSwitchKey(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    cycleLocale();
  }

  if (!activeItem) {
    return null;
  }

  return (
    <div ref={rootRef} className={cn("min-w-0", className)} onKeyDown={handleLocaleSwitchKey}>
      <div className="relative mb-1.5 flex h-5 shrink-0 items-center gap-1 overflow-visible">
        <label
          className="portal-label !mb-0 truncate"
          htmlFor={`${generatedId}-${activeItem.code}-input`}
        >
          {label}
          {required ? <span className="ml-0.5 text-brand-600">*</span> : null}
        </label>

        <span className="portal-help-tooltip group relative z-20 shrink-0">
          <button
            type="button"
            className="inline-flex size-4 items-center justify-center rounded-full text-surface-400 transition hover:text-surface-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
            aria-label={t("fields.translatableHelp")}
          >
            <CircleHelp className="size-3.5" strokeWidth={1.75} aria-hidden />
          </button>
          <span className="portal-help-tooltip-content" role="tooltip">
            {hint ? <span>{hint}</span> : null}
            <span className={hint ? "mt-1 block text-white/80" : "block"}>
              {t("fields.switchLanguageShortcut")}
            </span>
          </span>
        </span>
      </div>

      <div
        className={cn(
          "portal-translatable-control",
          hasInputError && "portal-translatable-control-error",
        )}
      >
        <div className="portal-translatable-inputs">
          {locales.map((item) => {
            const isActive = item.code === activeLocale;

            return (
              <input
                key={item.code}
                id={isActive ? `${generatedId}-${item.code}-input` : `${generatedId}-${item.code}`}
                type="text"
                name={item.fieldName}
                value={item.value}
                dir={item.dir}
                placeholder={item.placeholder}
                required={item.required && isActive}
                data-locale={item.code}
                className={cn(
                  "portal-translatable-input",
                  !isActive && "hidden",
                  item.error && "text-red-700",
                )}
                aria-invalid={Boolean(item.error)}
                onChange={(event) => {
                  validation?.clearError(item.fieldName);
                  onChange(item.fieldName, event.target.value);
                }}
                onKeyDown={handleLocaleSwitchKey}
              />
            );
          })}
        </div>

        {locales.length > 1 ? (
          <div className={cn("portal-translatable-locale-field", open && "is-open")}>
            <button
              type="button"
              className="portal-translatable-locale-trigger"
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-label={t("fields.languageLabel", { locale: activeItem.label })}
              onClick={() => setOpen((current) => !current)}
              onKeyDown={(event) => {
                if (isLocaleSwitchKey(event)) {
                  return;
                }

                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setOpen((current) => !current);
                }
              }}
            >
              <span>{activeLocale}</span>
              <ChevronDown className="portal-translatable-locale-chevron size-3" strokeWidth={2} aria-hidden />
            </button>

            {!open ? null : (
              <div className="portal-translatable-locale-dropdown" role="listbox">
                {locales.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    role="option"
                    aria-selected={item.code === activeLocale}
                    aria-label={item.label}
                    className={cn(
                      "portal-translatable-locale-option",
                      item.code === activeLocale && "is-selected",
                    )}
                    onClick={() => showLocale(item.code)}
                  >
                    {item.code}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {activeItem.error ? (
        <p className="mt-1.5 text-[11px] leading-snug font-medium text-red-600" role="alert">
          {activeItem.error}
        </p>
      ) : null}
    </div>
  );
}
