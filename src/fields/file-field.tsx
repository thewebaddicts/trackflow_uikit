"use client";

import { Upload } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type InputHTMLAttributes } from "react";
import { cn, FieldShell } from "./field";
import { useI18n } from "../i18n/I18nProvider";

type FileFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className" | "type"> & {
  id?: string;
  label?: string;
  hint?: string;
  error?: string | null;
  className?: string;
  inputClassName?: string;
  onFileChange?: (file: File | null) => void;
};

export function FileField({
  id,
  name,
  label,
  hint,
  error,
  required,
  className,
  inputClassName,
  accept,
  onFileChange,
  onChange,
  ...inputProps
}: FileFieldProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input?.form) {
      return;
    }

    const form = input.form;
    const onReset = () => setFileName(null);

    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, []);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setFileName(file?.name ?? null);
    onFileChange?.(file);
    onChange?.(event);
  }

  return (
    <FieldShell
      id={id}
      name={name}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      {(controlId, resolvedError) => (
        <div
          className={cn(
            "portal-file-field",
            resolvedError && "portal-file-field--error",
            inputClassName,
          )}
        >
          <input
            ref={inputRef}
            id={controlId}
            type="file"
            name={name}
            accept={accept}
            required={required}
            className="hidden"
            aria-invalid={Boolean(resolvedError)}
            onChange={handleChange}
            {...inputProps}
          />
          <button
            type="button"
            className="portal-file-field__browse"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-3.5" strokeWidth={1.75} aria-hidden />
            {t("import.selectFile")}
          </button>
          <span
            className={cn(
              "portal-file-field__name",
              !fileName && "portal-file-field__name--empty",
            )}
          >
            {fileName ?? t("common.noFileChosen")}
          </span>
        </div>
      )}
    </FieldShell>
  );
}
