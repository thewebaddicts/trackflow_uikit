export type FieldOption = {
  value: string;
  label: string;
  label_ar?: string;
  shortLabel?: string;
  description?: string;
  disabled?: boolean;
  /** Cascading select: only show when parent field has this value */
  parent_value?: string;
};

export type VisibilityRule = {
  field: string;
  value: string | string[];
};

export type FieldType =
  | "text"
  | "email"
  | "password"
  | "phone"
  | "date"
  | "time"
  | "datetime-local"
  | "number"
  | "money"
  | "currency-amount"
  | "textarea"
  | "select"
  | "multiselect"
  | "checkbox"
  | "toggle"
  | "translatable-text"
  | "date-range"
  | "tags"
  | "file";

export type FieldSchema = {
  name: string;
  label: string;
  label_ar?: string;
  type: FieldType;
  required?: boolean;
  nullable?: boolean;
  placeholder?: string | null;
  placeholder_ar?: string | null;
  hint?: string | null;
  hint_ar?: string | null;
  help?: string | null;
  options?: FieldOption[];
  empty_option?: FieldOption;
  multiple?: boolean;
  searchable?: boolean;
  min?: number;
  max?: number;
  step?: number;
  max_length?: number;
  integers?: boolean;
  /** Grid column span (1 or 2) */
  span?: 1 | 2;
  col_span?: 1 | 2;
  /** Parent field name — child is disabled until parent has a value */
  depends_on?: string;
  /** Show field only when rules match */
  visibility_rules?: VisibilityRule[];
  /** Date range end field name */
  end_name?: string;
  /** Translatable field locale map: { en: "name", ar: "name_ar" } */
  locale_fields?: Record<string, string>;
  locale_labels?: Record<string, string>;
  locale_placeholders?: Record<string, string>;
  field_group?: string;
  field_group_label?: string;
  disabled?: boolean;
};

export type FieldValues = Record<string, unknown>;

export type FieldSchemaFormProps = {
  fields: FieldSchema[];
  values: FieldValues;
  onChange: (values: FieldValues) => void;
  idPrefix?: string;
  className?: string;
};
