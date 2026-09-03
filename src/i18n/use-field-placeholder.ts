"use client";

import { useI18n } from "./I18nProvider";

export type ResolvedPlaceholderOptions = {
  label?: string;
  type?: string;
  placeholder?: string | null;
};

export function useResolvedPlaceholder({
  label,
  type = "text",
  placeholder,
}: ResolvedPlaceholderOptions): string {
  const { t } = useI18n();

  const explicit = placeholder?.trim();
  if (explicit) {
    return explicit;
  }

  const trimmedLabel = label?.trim();

  switch (type) {
    case "email":
      return t("auth.emailPlaceholder");
    case "password":
      return t("auth.passwordPlaceholder");
    case "number":
    case "money":
    case "currency-amount":
      return trimmedLabel ? t("fields.enterLabel", { label: trimmedLabel }) : "0.00";
    case "date":
      return t("common.selectDate");
    case "date-range":
      return t("common.selectDates");
    case "time":
      return t("fields.selectTime");
    case "datetime-local":
      return t("fields.selectDateTime");
    case "tel":
      return t("fields.phonePlaceholder");
    case "textarea":
      return trimmedLabel
        ? t("fields.enterLabel", { label: trimmedLabel })
        : t("fields.enterValue");
    case "select":
      return trimmedLabel
        ? t("fields.selectLabel", { label: trimmedLabel })
        : t("common.selectOption");
    case "tags":
      return trimmedLabel
        ? t("fields.enterLabel", { label: trimmedLabel })
        : t("fields.addTag");
    default:
      return trimmedLabel
        ? t("fields.enterLabel", { label: trimmedLabel })
        : t("fields.enterValue");
  }
}

export function resolveFieldPlaceholder(
  type: string,
  label: string | undefined,
  placeholder: string | undefined,
  t: (path: string, values?: Record<string, string | number>) => string,
): string {
  const explicit = placeholder?.trim();
  if (explicit) {
    return explicit;
  }

  const trimmedLabel = label?.trim();

  if (type === "tags") {
    return trimmedLabel
      ? t("fields.enterLabel", { label: trimmedLabel })
      : t("fields.addTag");
  }

  return trimmedLabel
    ? t("fields.enterLabel", { label: trimmedLabel })
    : t("fields.enterValue");
}
