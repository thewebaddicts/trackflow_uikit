// Fields
export * from "./fields";

// Schema-driven forms
export {
  FieldRenderer,
  SchemaForm,
  SchemaFormGrid,
  type FieldRendererProps,
  type SchemaFormProps,
} from "./forms/FieldRenderer";

export type {
  FieldSchema,
  FieldType,
  FieldValues,
  VisibilityRule,
} from "./schema/types";

export {
  emptyValuesForFields,
  groupFields,
  isFieldVisible,
  localizedFieldHint,
  localizedFieldLabel,
  localizedFieldPlaceholder,
  localizedOptionLabel,
  mapFieldOptions,
  normalizeFieldOptions,
  selectFieldValue,
  setFieldValue,
  stringValue,
} from "./schema/helpers";

// Theme
export { UiKitProvider, useUiKitTheme } from "./theme/UiKitProvider";
export {
  applyUiKitTheme,
  uiKitThemeInitScript,
  resolveThemeColor,
  deriveBrandPalette,
  DEFAULT_THEME_COLOR,
} from "./theme/theme";

// i18n
export {
  I18nProvider,
  useI18n,
  useI18nOptional,
  calendarWeekdayLabels,
  localizedStoredLabel,
} from "./i18n/I18nProvider";

export { useResolvedPlaceholder, resolveFieldPlaceholder } from "./i18n/use-field-placeholder";
export { enMessages, arMessages, type UiKitMessages, type UiKitLocale } from "./i18n/messages";

// Validation
export {
  FormValidationProvider,
  ValidatedForm,
  FormFieldError,
  FormValidationSummary,
  useFormValidation,
  useFormValidationOptional,
  useClearFieldError,
  useFieldError,
  isValidationError,
  validationErrorsFromUnknown,
  type ValidationErrorMap,
  type ValidatedFormHelpers,
} from "./validation/form-validation";

// Phone utilities
export {
  isPhoneNumberValid,
  validatePhoneNumber,
  toE164Phone,
  detectPhoneCountry,
  phoneCountryFieldName,
} from "./lib/phone-validation";

export { parseAmountInput, formatAmountInput, formatAmountDisplay } from "./lib/format-amount";
export { cn } from "./lib/cn";

// Root provider
export { TrackFlowUIKitProvider, type TrackFlowUIKitProviderProps } from "./TrackFlowUIKitProvider";
