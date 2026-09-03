"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  applyUiKitTheme,
  resolveThemeColor,
  type UiKitTheme,
} from "./theme";

type UiKitProviderProps = {
  children: ReactNode;
  /** Brand hex color — overrides env */
  themeColor?: string | null;
  /** Read from process.env.NEXT_PUBLIC_PORTAL_THEME_COLOR when true (default) */
  useEnvTheme?: boolean;
  className?: string;
  style?: CSSProperties;
};

const UiKitContext = createContext<{ themeColor: string } | null>(null);

export function UiKitProvider({
  children,
  themeColor,
  useEnvTheme = true,
  className = "",
  style,
}: UiKitProviderProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  const resolvedColor = useMemo(() => {
    const envColor =
      useEnvTheme && typeof globalThis !== "undefined"
        ? (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
            ?.env?.NEXT_PUBLIC_PORTAL_THEME_COLOR
        : undefined;

    return resolveThemeColor(themeColor, envColor);
  }, [themeColor, useEnvTheme]);

  useEffect(() => {
    if (rootRef.current) {
      applyUiKitTheme(rootRef.current, resolvedColor);
    }
  }, [resolvedColor]);

  const value = useMemo(() => ({ themeColor: resolvedColor }), [resolvedColor]);

  return (
    <UiKitContext.Provider value={value}>
      <div
        ref={rootRef}
        className={`tf-uikit ${className}`.trim()}
        style={style}
        data-tf-theme={resolvedColor}
      >
        {children}
      </div>
    </UiKitContext.Provider>
  );
}

export function useUiKitTheme(): UiKitTheme {
  const context = useContext(UiKitContext);
  return { brandColor: context?.themeColor };
}
