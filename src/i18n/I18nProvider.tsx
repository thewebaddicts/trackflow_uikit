"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  arMessages,
  calendarWeekdayLabels,
  createTranslator,
  enMessages,
  localizedStoredLabel,
  type UiKitLocale,
  type UiKitMessages,
} from "./messages";

type I18nContextValue = {
  locale: UiKitLocale;
  dir: "ltr" | "rtl";
  dateLocale: string;
  t: (path: string, values?: Record<string, string | number>) => string;
  messages: UiKitMessages;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export type I18nProviderProps = {
  children: ReactNode;
  locale?: UiKitLocale;
  /** Merge app-specific overrides on top of defaults */
  messages?: Partial<UiKitMessages>;
};

function deepMerge<T extends Record<string, unknown>>(base: T, override?: Partial<T>): T {
  if (!override) {
    return base;
  }

  const result = { ...base } as T;

  for (const key of Object.keys(override) as Array<keyof T>) {
    const value = override[key];
    const existing = base[key];

    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      existing &&
      typeof existing === "object" &&
      !Array.isArray(existing)
    ) {
      result[key] = deepMerge(
        existing as Record<string, unknown>,
        value as Record<string, unknown>,
      ) as T[keyof T];
    } else if (value !== undefined) {
      result[key] = value as T[keyof T];
    }
  }

  return result;
}

export function I18nProvider({
  children,
  locale = "en",
  messages: messageOverrides,
}: I18nProviderProps) {
  const value = useMemo<I18nContextValue>(() => {
    const base = locale === "ar" ? arMessages : enMessages;
    const messages = deepMerge(base, messageOverrides as Partial<UiKitMessages>);

    return {
      locale,
      dir: locale === "ar" ? "rtl" : "ltr",
      dateLocale: locale === "ar" ? "ar" : "en",
      messages,
      t: createTranslator(messages),
    };
  }, [locale, messageOverrides]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within I18nProvider.");
  }

  return context;
}

export function useI18nOptional(): I18nContextValue | null {
  return useContext(I18nContext);
}

export { calendarWeekdayLabels, localizedStoredLabel };