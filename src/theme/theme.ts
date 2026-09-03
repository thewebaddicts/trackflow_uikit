function hexToRgbChannels(hex: string): string {
  const normalized = hex.replace("#", "");
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  return `${r} ${g} ${b}`;
}

function parseHex(hex: string): [number, number, number] | null {
  const normalized = hex.trim().replace("#", "");
  if (!/^[0-9A-Fa-f]{6}$/.test(normalized)) {
    return null;
  }

  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b]
    .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

function mixHex(base: string, other: string, amount: number): string {
  const a = parseHex(base);
  const b = parseHex(other);
  if (!a || !b) {
    return base;
  }

  return toHex([
    a[0] * amount + b[0] * (1 - amount),
    a[1] * amount + b[1] * (1 - amount),
    a[2] * amount + b[2] * (1 - amount),
  ]);
}

export const DEFAULT_THEME_COLOR = "#5b4fd6";

export type UiKitTheme = {
  /** Primary brand hex — from NEXT_PUBLIC_PORTAL_THEME_COLOR or similar */
  brandColor?: string;
};

export function deriveBrandPalette(themeColor: string): Record<string, string> {
  return {
    50: mixHex(themeColor, "#ffffff", 0.08),
    100: mixHex(themeColor, "#ffffff", 0.16),
    200: mixHex(themeColor, "#ffffff", 0.3),
    300: mixHex(themeColor, "#ffffff", 0.52),
    500: themeColor,
    600: mixHex(themeColor, "#000000", 0.82),
    700: mixHex(themeColor, "#000000", 0.66),
  };
}

const BRAND_SHADES = ["50", "100", "200", "300", "500", "600", "700"] as const;

/** Apply brand palette CSS variables on a host element (wrapper or documentElement). */
export function applyUiKitTheme(host: HTMLElement, themeColor: string = DEFAULT_THEME_COLOR): void {
  const palette = deriveBrandPalette(themeColor);

  host.style.setProperty("--tf-org-brand", themeColor);
  host.style.setProperty("--tf-primary", palette["600"]);
  host.style.setProperty("--tf-ring", palette["600"]);

  for (const shade of BRAND_SHADES) {
    const hex = palette[shade];
    host.style.setProperty(`--tf-brand-${shade}`, hex);
    host.style.setProperty(`--tf-brand-${shade}-rgb`, hexToRgbChannels(hex));
  }

  // Compatibility aliases for apps already using --brand-brand-* tokens
  for (const shade of BRAND_SHADES) {
    const hex = palette[shade];
    host.style.setProperty(`--brand-brand-${shade}`, hex);
    host.style.setProperty(`--brand-brand-${shade}-rgb`, hexToRgbChannels(hex));
  }

  host.style.setProperty("--primary", palette["600"]);
  host.style.setProperty("--ring", palette["600"]);
}

/** Inline script for SSR — prevents theme flash before React hydrates. */
export function uiKitThemeInitScript(themeColor: string = DEFAULT_THEME_COLOR): string {
  const escaped = themeColor.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  return `(function(){try{var h="${escaped}";function p(x){var n=x.replace("#","");return[parseInt(n.slice(0,2),16),parseInt(n.slice(2,4),16),parseInt(n.slice(4,6),16)]}function t(a){return"#"+a.map(function(v){return Math.round(v).toString(16).padStart(2,"0")}).join("")}function m(a,b,w){var A=p(a),B=p(b);return t([A[0]*w+B[0]*(1-w),A[1]*w+B[1]*(1-w),A[2]*w+B[2]*(1-w)])}function rgb(x){var A=p(x);return A[0]+" "+A[1]+" "+A[2]}var pal={50:m(h,"#ffffff",0.08),100:m(h,"#ffffff",0.16),200:m(h,"#ffffff",0.3),300:m(h,"#ffffff",0.52),500:h,600:m(h,"#000000",0.82),700:m(h,"#000000",0.66)};function apply(r){r.style.setProperty("--tf-org-brand",h);["50","100","200","300","500","600","700"].forEach(function(s){r.style.setProperty("--tf-brand-"+s,pal[s]);r.style.setProperty("--tf-brand-"+s+"-rgb",rgb(pal[s]));r.style.setProperty("--brand-brand-"+s,pal[s]);r.style.setProperty("--brand-brand-"+s+"-rgb",rgb(pal[s]))});r.style.setProperty("--tf-primary",pal["600"]);r.style.setProperty("--tf-ring",pal["600"]);r.style.setProperty("--primary",pal["600"]);r.style.setProperty("--ring",pal["600"])}apply(document.documentElement)}catch(e){}})();`;
}

export function resolveThemeColor(
  explicit?: string | null,
  envValue?: string | null,
): string {
  const candidate = explicit?.trim() || envValue?.trim() || "";
  return /^#[0-9A-Fa-f]{6}$/.test(candidate) ? candidate : DEFAULT_THEME_COLOR;
}
