import { useId, type ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import { useClearFieldError, useFieldError } from "../validation/form-validation";
import { cn } from "../lib/cn";

export type FieldOption = {
  value: string;
  label: string;
  label_ar?: string;
  shortLabel?: string;
  description?: string;
  disabled?: boolean;
  parent_value?: string;
};

type FieldShellProps = {
  id?: string;
  name?: string;
  label?: string;
  labelAccessory?: ReactNode;
  hint?: string;
  error?: string | null;
  required?: boolean;
  className?: string;
  labelPlacement?: "stacked" | "inline";
  children: (controlId: string, resolvedError: string | null) => ReactNode;
};

export function FieldShell({
  id,
  name,
  label,
  labelAccessory,
  hint,
  error,
  required,
  className = "",
  labelPlacement = "stacked",
  children,
}: FieldShellProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const resolvedError = useFieldError(name, error);
  const clearFieldError = useClearFieldError(name);
  const showStackedLabel = labelPlacement === "stacked" && label;

  return (
    <div className={cn("min-w-0", className)} onInput={clearFieldError} onChange={clearFieldError}>
      {showStackedLabel ? (
        <div className="relative mb-1.5 flex h-5 shrink-0 items-center gap-1 overflow-visible">
          <label className="portal-label !mb-0 truncate" htmlFor={controlId}>
            {label}
            {required ? <span className="ml-0.5 text-brand-600">*</span> : null}
          </label>
          {labelAccessory ? <span className="relative z-20 shrink-0">{labelAccessory}</span> : null}
        </div>
      ) : null}
      {labelPlacement === "inline" ? <div className="portal-field-label-spacer" aria-hidden="true" /> : null}
      <div className="portal-field-slot">{children(controlId, resolvedError)}</div>
      {hint && !resolvedError ? (
        <p className="mt-1.5 text-[11px] leading-snug text-surface-500">{hint}</p>
      ) : null}
      {resolvedError ? (
        <p className="mt-1.5 text-[11px] leading-snug font-medium text-red-600" role="alert">
          {resolvedError}
        </p>
      ) : null}
    </div>
  );
}

export { cn };

export function FieldHelpTooltip({ text }: { text: string }) {
  return (
    <span className="portal-help-tooltip group relative z-20 shrink-0">
      <button
        type="button"
        className="inline-flex size-4 items-center justify-center rounded-full text-surface-400 transition hover:text-surface-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
        aria-label={text}
      >
        <CircleHelp className="size-3.5" strokeWidth={1.75} aria-hidden />
      </button>
      <span className="portal-help-tooltip-content" role="tooltip">
        {text}
      </span>
    </span>
  );
}
