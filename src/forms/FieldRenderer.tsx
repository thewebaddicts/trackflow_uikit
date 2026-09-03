"use client";

import type { ReactNode } from "react";
import {
  CheckboxField,
  DateRangeField,
  PhoneField,
  SelectInput,
  TagsInput,
  TextField,
  TextareaField,
  ToggleField,
  TranslatableTextField,
} from "../fields";
import { phoneCountryFieldName } from "../lib/phone-validation";
import { useI18n } from "../i18n/I18nProvider";
import { cn } from "../lib/cn";
import {
  isFieldVisible,
  localizedFieldHint,
  localizedFieldLabel,
  localizedFieldPlaceholder,
  mapFieldOptions,
  selectFieldValue,
  setFieldValue,
  stringValue,
} from "../schema/helpers";
import type { FieldSchema, FieldValues } from "../schema/types";

export type FieldRendererProps = {
  field: FieldSchema;
  fields: FieldSchema[];
  values: FieldValues;
  onChange: (values: FieldValues) => void;
  idPrefix?: string;
};

function updateField(
  fields: FieldSchema[],
  values: FieldValues,
  onChange: (values: FieldValues) => void,
  name: string,
  value: unknown,
) {
  onChange(setFieldValue(fields, values, name, value));
}

export function FieldRenderer({
  field,
  fields,
  values,
  onChange,
  idPrefix = "field",
}: FieldRendererProps) {
  const { locale } = useI18n();

  if (!isFieldVisible(field, values)) {
    return null;
  }

  const fieldId = `${idPrefix}-${field.name}`;
  const label = localizedFieldLabel(field, locale);
  const placeholder = localizedFieldPlaceholder(field, locale);
  const hint = localizedFieldHint(field, locale);
  const resolvedStringValue = stringValue(values[field.name]);

  const handleChange = (name: string, value: unknown) => {
    updateField(fields, values, onChange, name, value);
  };

  if (field.type === "translatable-text" && field.locale_fields) {
    const englishField = field.locale_fields.en;
    const englishValue = englishField ? stringValue(values[englishField]) : "";

    const localeValues = Object.fromEntries(
      Object.entries(field.locale_fields).map(([code, fieldName]) => {
        const raw = stringValue(values[fieldName]);
        if (code === "ar" && !raw.trim() && englishValue.trim()) {
          return [code, englishValue];
        }
        return [code, raw];
      }),
    );

    return (
      <TranslatableTextField
        label={label}
        localeFields={field.locale_fields}
        localeLabels={field.locale_labels}
        localePlaceholders={field.locale_placeholders}
        placeholder={field.placeholder}
        values={localeValues}
        onChange={(fieldName, nextValue) => handleChange(fieldName, nextValue)}
        hint={field.help ?? hint}
        required={field.required}
      />
    );
  }

  if (field.type === "textarea") {
    return (
      <TextareaField
        id={fieldId}
        name={field.name}
        label={label}
        value={resolvedStringValue}
        onChange={(event) => handleChange(field.name, event.target.value)}
        placeholder={placeholder}
        hint={hint ?? field.help ?? undefined}
        required={field.required}
        maxLength={field.max_length}
        disabled={field.disabled}
      />
    );
  }

  if (field.type === "select" || field.type === "multiselect") {
    const options = mapFieldOptions(field, locale, values);
    const parentValue = field.depends_on ? String(values[field.depends_on] ?? "") : "";
    const selectDisabled = Boolean(field.disabled || (field.depends_on && !parentValue));
    const multiple = field.type === "multiselect" || field.multiple;

    if (options.length === 0) {
      return (
        <TextField
          id={fieldId}
          name={field.name}
          label={label}
          value={resolvedStringValue}
          onChange={(event) => handleChange(field.name, event.target.value)}
          placeholder={placeholder}
          hint={hint ?? field.help ?? undefined}
          required={field.required}
          maxLength={field.max_length}
          disabled={field.disabled}
        />
      );
    }

    return (
      <SelectInput
        id={fieldId}
        name={field.name}
        label={label}
        value={selectFieldValue(field, values)}
        onChange={(next) => handleChange(field.name, next)}
        options={options}
        placeholder={placeholder}
        hint={hint ?? field.help ?? undefined}
        required={field.required}
        disabled={selectDisabled}
        searchable={field.searchable ?? options.length >= 8}
        multiple={multiple}
      />
    );
  }

  if (field.type === "toggle") {
    return (
      <ToggleField
        id={fieldId}
        name={field.name}
        label={label}
        checked={Boolean(values[field.name])}
        onChange={(checked) => handleChange(field.name, checked)}
        hint={hint ?? field.help ?? undefined}
        required={field.required}
        disabled={field.disabled}
      />
    );
  }

  if (field.type === "checkbox") {
    return (
      <CheckboxField
        id={fieldId}
        name={field.name}
        label={label}
        checked={Boolean(values[field.name])}
        onChange={(checked) => handleChange(field.name, checked)}
        hint={hint ?? field.help ?? undefined}
        required={field.required}
        disabled={field.disabled}
      />
    );
  }

  if (field.type === "phone") {
    const countryValue = String(values[phoneCountryFieldName(field.name)] ?? "AE");

    return (
      <PhoneField
        id={fieldId}
        name={field.name}
        label={label}
        placeholder={placeholder}
        value={resolvedStringValue}
        country={countryValue}
        required={field.required}
        disabled={field.disabled}
        onChange={(next) => handleChange(field.name, next)}
        onCountryChange={(next) =>
          handleChange(phoneCountryFieldName(field.name), next)
        }
      />
    );
  }

  if (field.type === "date-range" && field.end_name) {
    return (
      <DateRangeField
        id={fieldId}
        name={field.name}
        label={label}
        value={{ from: resolvedStringValue, to: stringValue(values[field.end_name]) }}
        onChange={(next) => {
          onChange({
            ...values,
            [field.name]: next.from,
            [field.end_name!]: next.to,
          });
        }}
        placeholder={placeholder}
        hint={hint ?? field.help ?? undefined}
        required={field.required}
        disabled={field.disabled}
      />
    );
  }

  if (field.type === "tags") {
    const tagValue = Array.isArray(values[field.name])
      ? (values[field.name] as string[])
      : [];

    return (
      <div className="min-w-0">
        {label ? <label className="portal-label mb-1.5 block">{label}</label> : null}
        <TagsInput
          id={fieldId}
          value={tagValue}
          onValueChange={(next) => handleChange(field.name, next)}
          placeholder={placeholder}
        />
        {hint ? <p className="mt-1.5 text-[11px] text-surface-500">{hint}</p> : null}
      </div>
    );
  }

  if (field.type === "number" || field.type === "money" || field.type === "currency-amount") {
    return (
      <TextField
        id={fieldId}
        name={field.name}
        type="number"
        label={label}
        value={resolvedStringValue}
        onChange={(event) => handleChange(field.name, event.target.value)}
        placeholder={placeholder}
        hint={hint ?? field.help ?? undefined}
        required={field.required}
        min={field.min}
        max={field.max}
        step={field.step ?? (field.type === "money" ? 0.01 : undefined)}
        disabled={field.disabled}
      />
    );
  }

  const inputType =
    field.type === "email"
      ? "email"
      : field.type === "password"
        ? "password"
        : field.type === "date"
          ? "date"
          : field.type === "time"
            ? "time"
            : field.type === "datetime-local"
              ? "datetime-local"
              : "text";

  return (
    <TextField
      id={fieldId}
      name={field.name}
      type={inputType}
      label={label}
      value={resolvedStringValue}
      onChange={(event) => handleChange(field.name, event.target.value)}
      placeholder={placeholder}
      hint={hint ?? field.help ?? undefined}
      required={field.required}
      maxLength={field.max_length}
      disabled={field.disabled}
    />
  );
}

export type SchemaFormProps = {
  fields: FieldSchema[];
  values: FieldValues;
  onChange: (values: FieldValues) => void;
  idPrefix?: string;
  className?: string;
  children?: ReactNode;
  /** Render fields in grouped sections when field_group is set */
  grouped?: boolean;
};

export function SchemaForm({
  fields,
  values,
  onChange,
  idPrefix = "schema",
  className,
  children,
  grouped = false,
}: SchemaFormProps) {
  if (!grouped) {
    return (
      <>
        {fields.map((field) => (
          <FieldRenderer
            key={field.name}
            field={field}
            fields={fields}
            values={values}
            onChange={onChange}
            idPrefix={idPrefix}
          />
        ))}
        {children}
      </>
    );
  }

  const groups = new Map<string, { label?: string; fields: FieldSchema[] }>();

  for (const field of fields) {
    const key = field.field_group ?? "__default__";
    const group = groups.get(key) ?? { label: field.field_group_label, fields: [] };
    if (!group.label && field.field_group_label) {
      group.label = field.field_group_label;
    }
    group.fields.push(field);
    groups.set(key, group);
  }

  return (
    <>
      {Array.from(groups.entries()).map(([key, group]) => (
        <section
          key={key}
          className={cn(key !== "__default__" && "cms-field-group", className)}
        >
          {group.label ? <h3 className="cms-field-group-title">{group.label}</h3> : null}
          <div className="cms-field-group-grid">
            {group.fields.map((field) => (
              <FieldRenderer
                key={field.name}
                field={field}
                fields={fields}
                values={values}
                onChange={onChange}
                idPrefix={idPrefix}
              />
            ))}
          </div>
        </section>
      ))}
      {children}
    </>
  );
}

export function SchemaFormGrid({
  fields,
  values,
  onChange,
  idPrefix = "schema",
  className,
  children,
  grouped = false,
}: SchemaFormProps) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2", className)}>
      <SchemaForm
        fields={fields}
        values={values}
        onChange={onChange}
        idPrefix={idPrefix}
        grouped={grouped}
      />
      {children}
    </div>
  );
}
