"use client";

import type { ReactNode } from "react";
import { I18nProvider, type I18nProviderProps } from "./i18n/I18nProvider";
import { UiKitProvider } from "./theme/UiKitProvider";
import { FormValidationProvider } from "./validation/form-validation";

export type TrackFlowUIKitProviderProps = {
  children: ReactNode;
  /** Brand hex — falls back to NEXT_PUBLIC_PORTAL_THEME_COLOR */
  themeColor?: string | null;
  locale?: I18nProviderProps["locale"];
  messages?: I18nProviderProps["messages"];
  /** Wrap forms with shared validation context */
  withValidation?: boolean;
  className?: string;
};

export function TrackFlowUIKitProvider({
  children,
  themeColor,
  locale = "en",
  messages,
  withValidation = false,
  className,
}: TrackFlowUIKitProviderProps) {
  const content = (
    <I18nProvider locale={locale} messages={messages}>
      {children}
    </I18nProvider>
  );

  const wrapped = withValidation ? (
    <FormValidationProvider>{content}</FormValidationProvider>
  ) : (
    content
  );

  return (
    <UiKitProvider themeColor={themeColor} className={className}>
      {wrapped}
    </UiKitProvider>
  );
}
