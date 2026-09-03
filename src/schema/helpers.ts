import type { FieldOption, FieldSchema, FieldValues, VisibilityRule } from "./types";

export function localizedFieldLabel(
  field: FieldSchema,
  locale: "en" | "ar",
): string {
  if (locale === "ar" && field.label_ar?.trim()) {
    return field.label_ar.trim();
  }

  return field.label;
}

export function localizedFieldHint(
  field: FieldSchema,
  locale: "en" | "ar",
): string | undefined {
  const hint = locale === "ar" ? field.hint_ar ?? field.hint : field.hint ?? field.hint_ar;
  return hint?.trim() || undefined;
}

export function localizedFieldPlaceholder(
  field: FieldSchema,
  locale: "en" | "ar",
): string | undefined {
  const placeholder =
    locale === "ar"
      ? field.placeholder_ar ?? field.placeholder
      : field.placeholder ?? field.placeholder_ar;

  return placeholder?.trim() || undefined;
}

export function localizedOptionLabel(
  option: FieldOption,
  locale: "en" | "ar",
): string {
  if (locale === "ar" && option.label_ar?.trim()) {
    return option.label_ar.trim();
  }

  return option.label;
}

export function mapFieldOptions(
  field: FieldSchema,
  locale: "en" | "ar",
  values: FieldValues,
): FieldOption[] {
  const options: FieldOption[] = [];

  if (field.empty_option) {
    options.push({
      ...field.empty_option,
      label: localizedOptionLabel(field.empty_option, locale),
    });
  }

  const parentValue = field.depends_on ? String(values[field.depends_on] ?? "") : "";

  for (const option of field.options ?? []) {
    if (field.depends_on && option.parent_value && option.parent_value !== parentValue) {
      continue;
    }

    options.push({
      ...option,
      label: localizedOptionLabel(option, locale),
    });
  }

  return options;
}

export function isFieldVisible(field: FieldSchema, values: FieldValues): boolean {
  if (!field.visibility_rules?.length) {
    return true;
  }

  return field.visibility_rules.every((rule) => matchesVisibilityRule(rule, values));
}

function matchesVisibilityRule(rule: VisibilityRule, values: FieldValues): boolean {
  const current = values[rule.field];
  const currentString =
    current === null || current === undefined ? "" : String(current);

  if (Array.isArray(rule.value)) {
    return rule.value.map(String).includes(currentString);
  }

  return currentString === String(rule.value);
}

export function clearDependentFields(
  fields: FieldSchema[],
  changedField: string,
  values: FieldValues,
): FieldValues {
  const updates: FieldValues = { ...values };

  for (const field of fields) {
    if (field.depends_on === changedField) {
      updates[field.name] = field.type === "multiselect" || field.multiple ? [] : "";
    }
  }

  return updates;
}

export function setFieldValue(
  fields: FieldSchema[],
  values: FieldValues,
  name: string,
  value: unknown,
): FieldValues {
  const updates: FieldValues = { ...values, [name]: value };
  return clearDependentFields(fields, name, updates);
}

export function normalizeFieldOptions(field: FieldSchema): FieldOption[] {
  if (!field.options) {
    return [];
  }

  return field.options;
}

export function stringValue(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

export function selectFieldValue(field: FieldSchema, values: FieldValues): string | string[] {
  const value = values[field.name];

  if (field.multiple) {
    if (Array.isArray(value)) {
      return value.map(String);
    }

    if (value === null || value === undefined || value === "") {
      return [];
    }

    return [String(value)];
  }

  return stringValue(value);
}

export function emptyValuesForFields(fields: FieldSchema[]): FieldValues {
  const values: FieldValues = {};

  for (const field of fields) {
    if (field.type === "multiselect" || field.multiple) {
      values[field.name] = [];
    } else if (field.type === "checkbox" || field.type === "toggle") {
      values[field.name] = false;
    } else if (field.type === "tags") {
      values[field.name] = [];
    } else {
      values[field.name] = "";
    }

    if (field.type === "phone") {
      values[`${field.name}_country`] = "AE";
    }

    if (field.type === "date-range" && field.end_name) {
      values[field.end_name] = "";
    }
  }

  return values;
}

export function groupFields(fields: FieldSchema[]): Array<{
  key: string;
  label?: string;
  fields: FieldSchema[];
}> {
  const groups = new Map<string, { label?: string; fields: FieldSchema[] }>();

  for (const field of fields) {
    const key = field.field_group ?? "__default__";
    const existing = groups.get(key) ?? {
      label: field.field_group_label,
      fields: [],
    };

    if (!existing.label && field.field_group_label) {
      existing.label = field.field_group_label;
    }

    existing.fields.push(field);
    groups.set(key, existing);
  }

  return Array.from(groups.entries()).map(([key, group]) => ({
    key,
    label: group.label,
    fields: group.fields,
  }));
}
