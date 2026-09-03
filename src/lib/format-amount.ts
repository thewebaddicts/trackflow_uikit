export function parseAmountInput(raw: string): string {
  let next = raw.replace(/,/g, "").replace(/[^\d.-]/g, "");

  const negative = next.startsWith("-");
  next = next.replace(/-/g, "");
  if (negative) {
    next = `-${next}`;
  }

  const parts = next.split(".");
  if (parts.length > 2) {
    next = `${parts[0]}.${parts.slice(1).join("")}`;
  }

  return next;
}

export function formatAmountInput(value: string): string {
  if (value === "" || value === "-" || value === "-.") {
    return value;
  }

  if (value === ".") {
    return "";
  }

  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const hasTrailingDot = unsigned.endsWith(".");
  const [intPart = "", ...rest] = unsigned.split(".");
  const decPart = rest.length > 0 ? rest.join("") : undefined;
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  let result = `${negative ? "-" : ""}${formattedInt}`;
  if (decPart !== undefined) {
    result += `.${decPart}`;
  } else if (hasTrailingDot) {
    result += ".";
  }

  return result;
}

export function formatAmountDisplay(value: string | number): string {
  if (value === "" || value === null || value === undefined) {
    return "0";
  }

  const numeric =
    typeof value === "number" ? value : Number(parseAmountInput(String(value)));

  if (!Number.isFinite(numeric)) {
    return String(value);
  }

  return numeric.toLocaleString("en-US", {
    maximumFractionDigits: 6,
  });
}
