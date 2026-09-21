"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useI18n } from "../i18n/I18nProvider";

export type ValidationErrorMap = Record<string, string>;

export function validationErrorsFromUnknown(error: unknown): ValidationErrorMap | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const candidate = (error as { validationErrors?: unknown }).validationErrors;

  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return null;
  }

  const errors: ValidationErrorMap = {};

  for (const [key, value] of Object.entries(candidate as Record<string, unknown>)) {
    if (typeof value === "string" && value.trim() !== "") {
      errors[key] = value;
    } else if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim() !== "") {
      errors[key] = value[0];
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

export function isValidationError(
  error: unknown,
): error is { validationErrors: ValidationErrorMap } {
  return validationErrorsFromUnknown(error) != null;
}

type FormValidationContextValue = {
  errors: ValidationErrorMap;
  setErrors: (errors: ValidationErrorMap | null) => void;
  clearErrors: () => void;
  clearError: (...names: string[]) => void;
  getError: (name?: string | null) => string | null;
  applyApiError: (error: unknown, fallback?: string) => string | null;
  hasErrors: boolean;
  /** Called by fields that show their own message; returns the unregister callback. */
  registerInlineField: (name: string) => () => void;
  hasInlineField: (name: string) => boolean;
};

const FormValidationContext = createContext<FormValidationContextValue | null>(null);

export function FormValidationProvider({ children }: { children: ReactNode }) {
  const [errors, setErrorsState] = useState<ValidationErrorMap>({});
  // Fields on screen print their own message, so the summary only reports what is not visible.
  const inlineFields = useRef(new Map<string, number>());
  const [inlineFieldsVersion, bumpInlineFields] = useReducer((version: number) => version + 1, 0);

  const registerInlineField = useCallback((name: string) => {
    const counts = inlineFields.current;
    counts.set(name, (counts.get(name) ?? 0) + 1);
    bumpInlineFields();

    return () => {
      const remaining = (counts.get(name) ?? 1) - 1;

      if (remaining > 0) {
        counts.set(name, remaining);
      } else {
        counts.delete(name);
      }

      bumpInlineFields();
    };
  }, []);

  const setErrors = useCallback((next: ValidationErrorMap | null) => {
    setErrorsState(next && Object.keys(next).length > 0 ? next : {});
  }, []);

  const clearErrors = useCallback(() => {
    setErrorsState({});
  }, []);

  const clearError = useCallback((...names: string[]) => {
    if (names.length === 0) {
      return;
    }

    setErrorsState((current) => {
      let changed = false;
      const next = { ...current };

      for (const name of names) {
        if (name in next) {
          delete next[name];
          changed = true;
        }

        for (const key of Object.keys(next)) {
          if (key.startsWith(`${name}.`)) {
            delete next[key];
            changed = true;
          }
        }
      }

      return changed ? next : current;
    });
  }, []);

  const getError = useCallback(
    (name?: string | null) => {
      if (!name) {
        return null;
      }

      return errors[name] ?? null;
    },
    [errors],
  );

  const applyApiError = useCallback(
    (error: unknown, fallback?: string): string | null => {
      const fieldErrors = validationErrorsFromUnknown(error);

      if (fieldErrors) {
        setErrors(fieldErrors);
        return null;
      }

      setErrorsState({});

      if (error instanceof Error && error.message.trim() !== "") {
        return error.message;
      }

      return fallback ?? null;
    },
    [setErrors],
  );

  const value = useMemo(
    () => ({
      errors,
      setErrors,
      clearErrors,
      clearError,
      getError,
      applyApiError,
      hasErrors: Object.keys(errors).length > 0,
      registerInlineField,
      hasInlineField: (name: string) => inlineFields.current.has(name),
    }),
    // inlineFieldsVersion refreshes hasInlineField as fields mount and unmount.
    [
      errors,
      setErrors,
      clearErrors,
      clearError,
      getError,
      applyApiError,
      registerInlineField,
      inlineFieldsVersion,
    ],
  );

  return (
    <FormValidationContext.Provider value={value}>{children}</FormValidationContext.Provider>
  );
}

export function useFormValidation(): FormValidationContextValue {
  const context = useContext(FormValidationContext);

  if (!context) {
    throw new Error("useFormValidation must be used within FormValidationProvider.");
  }

  return context;
}

export function useFormValidationOptional(): FormValidationContextValue | null {
  return useContext(FormValidationContext);
}

export function useClearFieldError(name?: string | null): () => void {
  const context = useFormValidationOptional();

  return useCallback(() => {
    if (name) {
      context?.clearError(name);
    }
  }, [context, name]);
}

export function useFieldError(
  name?: string | null,
  explicitError?: string | null,
): string | null {
  const context = useFormValidationOptional();
  const registerInlineField = context?.registerInlineField;

  useEffect(() => {
    if (!name || !registerInlineField) {
      return;
    }

    return registerInlineField(name);
  }, [name, registerInlineField]);

  if (explicitError) {
    return explicitError;
  }

  return context?.getError(name) ?? null;
}

export type ValidatedFormHelpers = {
  applyApiError: (error: unknown, fallback?: string) => string | null;
  setErrors: (errors: ValidationErrorMap | null) => void;
  clearErrors: () => void;
};

export function ValidatedForm({
  children,
  className,
  onSubmit,
  showSummary = false,
}: {
  children: ReactNode;
  className?: string;
  showSummary?: boolean;
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
    helpers: ValidatedFormHelpers,
  ) => void | Promise<void>;
}) {
  return (
    <FormValidationProvider>
      <ValidatedFormInner className={className} onSubmit={onSubmit} showSummary={showSummary}>
        {children}
      </ValidatedFormInner>
    </FormValidationProvider>
  );
}

function ValidatedFormInner({
  children,
  className,
  onSubmit,
  showSummary,
}: {
  children: ReactNode;
  className?: string;
  showSummary: boolean;
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
    helpers: ValidatedFormHelpers,
  ) => void | Promise<void>;
}) {
  const { applyApiError, clearErrors, setErrors } = useFormValidation();
  const helpers = useMemo(
    () => ({ applyApiError, setErrors, clearErrors }),
    [applyApiError, setErrors, clearErrors],
  );

  return (
    <form
      className={className}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        clearErrors();
        void onSubmit(event, helpers);
      }}
    >
      {showSummary ? <FormValidationSummary /> : null}
      {children}
    </form>
  );
}

export function FormFieldError({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const message = useFieldError(name);

  if (!message) {
    return null;
  }

  return (
    <p
      className={`mt-1.5 text-[12px] leading-snug font-medium text-red-600 ${className}`.trim()}
      role="alert"
    >
      {message}
    </p>
  );
}

export function FormValidationSummary({ title }: { title?: string }) {
  const { t } = useI18n();
  const { errors, hasInlineField } = useFormValidation();
  const resolvedTitle = title ?? t("common.pleaseFix");
  const entries = Object.entries(errors).filter(([field]) => !hasInlineField(field));
  const count = entries.length;

  if (count === 0) {
    return null;
  }

  return (
    <div
      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] text-red-700"
      role="alert"
    >
      <p className="font-semibold tracking-tight">{resolvedTitle}</p>
      <p className="mt-0.5 text-red-600/90">
        {count === 1
          ? t("common.fieldNeedsAttention")
          : t("common.fieldsNeedAttention", { count })}
      </p>
      <ul className="mt-1.5 list-disc space-y-0.5 ps-4">
        {entries.map(([field, message]) => (
          <li key={field}>{message}</li>
        ))}
      </ul>
    </div>
  );
}
