"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useI18n } from "../i18n/I18nProvider";

export type ValidationErrorMap = Record<string, string>;

export function isValidationError(
  error: unknown,
): error is { validationErrors: ValidationErrorMap } {
  return (
    typeof error === "object" &&
    error !== null &&
    "validationErrors" in error &&
    typeof (error as { validationErrors: unknown }).validationErrors === "object"
  );
}

type FormValidationContextValue = {
  errors: ValidationErrorMap;
  setErrors: (errors: ValidationErrorMap | null) => void;
  clearErrors: () => void;
  clearError: (...names: string[]) => void;
  getError: (name?: string | null) => string | null;
  applyApiError: (error: unknown, fallback?: string) => string | null;
  hasErrors: boolean;
};

const FormValidationContext = createContext<FormValidationContextValue | null>(null);

export function FormValidationProvider({ children }: { children: ReactNode }) {
  const [errors, setErrorsState] = useState<ValidationErrorMap>({});

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
      if (isValidationError(error)) {
        setErrors(error.validationErrors);
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
    }),
    [errors, setErrors, clearErrors, clearError, getError, applyApiError],
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

  if (explicitError) {
    return explicitError;
  }

  return context?.getError(name) ?? null;
}

export type ValidatedFormHelpers = {
  applyApiError: (error: unknown, fallback?: string) => string | null;
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
  const { applyApiError, clearErrors } = useFormValidation();
  const helpers = useMemo(
    () => ({ applyApiError, clearErrors }),
    [applyApiError, clearErrors],
  );

  return (
    <form
      className={className}
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
  const { hasErrors, errors } = useFormValidation();
  const resolvedTitle = title ?? t("common.pleaseFix");

  if (!hasErrors) {
    return null;
  }

  const entries = Object.entries(errors);
  const count = entries.length;

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
