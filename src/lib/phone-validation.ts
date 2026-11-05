import {
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumber,
  type Country,
} from "react-phone-number-input";

function resolveCountry(country?: string): Country | undefined {
  const countryCode = country?.trim().toUpperCase();

  if (countryCode && /^[A-Z]{2}$/.test(countryCode)) {
    return countryCode as Country;
  }

  return undefined;
}

export function isPhoneNumberValid(phone: string, country?: string): boolean {
  const trimmed = phone.trim();

  if (!trimmed) {
    return false;
  }

  const defaultCountry = resolveCountry(country);

  return isValidPhoneNumber(trimmed, defaultCountry);
}

export function validatePhoneNumber(phone: string, country?: string): string | null {
  const trimmed = phone.trim();

  if (!trimmed) {
    return "Phone number is required.";
  }

  if (!isPhoneNumberValid(trimmed, country)) {
    return "Enter a valid phone number for the selected country.";
  }

  return null;
}

export function toE164Phone(phone: string, country?: string): string {
  const trimmed = phone.trim();

  if (!trimmed) {
    return "";
  }

  const defaultCountry = resolveCountry(country);
  const parsed = parsePhoneNumber(trimmed, defaultCountry);

  if (parsed?.number) {
    return parsed.number;
  }

  if (trimmed.startsWith("+")) {
    return `+${trimmed.slice(1).replace(/\D/g, "")}`;
  }

  if (defaultCountry) {
    const nationalDigits = trimmed.replace(/\D/g, "").replace(/^0+/, "");
    return `+${getCountryCallingCode(defaultCountry)}${nationalDigits}`;
  }

  return trimmed;
}

export function detectPhoneCountry(phone: string, fallback = "AE"): string {
  const trimmed = phone.trim();

  if (trimmed.startsWith("+")) {
    const parsed = parsePhoneNumber(trimmed);
    if (parsed?.country) {
      return parsed.country;
    }
  }

  return resolveCountry(fallback) ?? "AE";
}

export function phoneCountryFieldName(fieldName: string): string {
  return `${fieldName}_country`;
}
