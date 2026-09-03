"use client";

import { FileSpreadsheet, Upload, X } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
} from "react";
import { cn, FieldShell } from "./field";
import { useI18n } from "../i18n/I18nProvider";

type FileFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className" | "type"> & {
  id?: string;
  label?: string;
  hint?: string;
  error?: string | null;
  className?: string;
  inputClassName?: string;
  emptyTitle?: string;
  emptyHint?: string;
  onFileChange?: (file: File | null) => void;
};

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function assignFile(input: HTMLInputElement, file: File | null) {
  const transfer = new DataTransfer();
  if (file) {
    transfer.items.add(file);
  }
  input.files = transfer.files;
}

export function FileField({
  id,
  name,
  label,
  hint,
  error,
  required,
  disabled,
  className,
  inputClassName,
  accept,
  emptyTitle,
  emptyHint,
  onFileChange,
  onChange,
  ...inputProps
}: FileFieldProps) {
  const { t } = useI18n();
  const reactId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const dropzoneId = id ?? `file-field-${reactId}`;

  useEffect(() => {
    const input = inputRef.current;
    if (!input?.form) {
      return;
    }

    const form = input.form;
    const onReset = () => {
      setFile(null);
      if (inputRef.current) {
        assignFile(inputRef.current, null);
      }
    };

    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, []);

  function commitFile(next: File | null, event?: ChangeEvent<HTMLInputElement>) {
    const input = inputRef.current;
    if (input && !event) {
      assignFile(input, next);
    }
    setFile(next);
    onFileChange?.(next);
    if (event) {
      onChange?.(event);
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    commitFile(event.target.files?.[0] ?? null, event);
  }

  function openPicker() {
    if (disabled) return;
    inputRef.current?.click();
  }

  function clearFile(event: { preventDefault: () => void; stopPropagation: () => void }) {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    commitFile(null);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    if (disabled) return;
    const next = event.dataTransfer.files?.[0] ?? null;
    if (next) {
      commitFile(next);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  }

  const title = file?.name ?? emptyTitle ?? t("import.selectFile");
  const subtitle = file
    ? [formatFileSize(file.size), t("import.replaceHint")].filter(Boolean).join(" · ")
    : emptyHint ?? t("import.dropHint");

  return (
    <FieldShell
      id={dropzoneId}
      name={name}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      {(controlId, resolvedError) => (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-controls={controlId}
          aria-disabled={disabled || undefined}
          aria-invalid={Boolean(resolvedError) || undefined}
          className={cn(
            "portal-file-field",
            file && "portal-file-field--filled",
            dragging && "portal-file-field--dragging",
            resolvedError && "portal-file-field--error",
            disabled && "portal-file-field--disabled",
            inputClassName,
          )}
          onClick={openPicker}
          onKeyDown={handleKeyDown}
          onDragEnter={(event) => {
            event.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
            setDragging(false);
          }}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            id={controlId}
            type="file"
            name={name}
            accept={accept}
            required={required}
            disabled={disabled}
            className="sr-only"
            aria-invalid={Boolean(resolvedError)}
            onChange={handleChange}
            tabIndex={-1}
            {...inputProps}
          />

          <span
            className={cn("portal-file-field__icon", file && "portal-file-field__icon--filled")}
            aria-hidden
          >
            {file ? (
              <FileSpreadsheet className="size-5" strokeWidth={1.75} />
            ) : (
              <Upload className="size-5" strokeWidth={1.75} />
            )}
          </span>

          <span className="portal-file-field__body">
            <span className="portal-file-field__title">{title}</span>
            <span className="portal-file-field__hint">{subtitle}</span>
          </span>

          {file ? (
            <button
              type="button"
              className="portal-file-field__clear"
              aria-label={t("common.clear")}
              disabled={disabled}
              onClick={clearFile}
            >
              <X className="size-4" strokeWidth={2} aria-hidden />
            </button>
          ) : null}
        </div>
      )}
    </FieldShell>
  );
}
