"use client";

import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn, FieldShell } from "./field";
import { useResolvedPlaceholder } from "../i18n/use-field-placeholder";
import { useClearFieldError } from "../validation/form-validation";
import { useI18n } from "../i18n/I18nProvider";
import { calendarWeekdayLabels } from "../i18n/I18nProvider";

export type DateRangeValue = {
  from: string;
  to: string;
};

type DateRangeFieldProps = {
  id?: string;
  name?: string;
  label?: string;
  labelAccessory?: ReactNode;
  hint?: string;
  error?: string | null;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
};

type YearMonth = { year: number; month: number };

function parseDateParts(date: string): YearMonth & { day: number } {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function weekdaySundayFirst(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getDay();
}

function formatYearMonth(year: number, month: number, dateLocale: string): string {
  return new Date(year, month - 1, 1).toLocaleDateString(dateLocale, {
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(date: string, dateLocale: string): string {
  const { year, month, day } = parseDateParts(date);
  return new Date(year, month - 1, day).toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRangeLabel(from: string, to: string, dateLocale: string): string {
  if (!from && !to) {
    return "";
  }

  if (from && !to) {
    return formatShortDate(from, dateLocale);
  }

  if (!from && to) {
    return formatShortDate(to, dateLocale);
  }

  if (from === to) {
    return formatShortDate(from, dateLocale);
  }

  const start = parseDateParts(from);
  const end = parseDateParts(to);

  if (start.year === end.year && start.month === end.month) {
    const monthLabel = new Date(start.year, start.month - 1, 1).toLocaleDateString(dateLocale, {
      month: "short",
    });
    return `${start.day} – ${end.day} ${monthLabel} ${start.year}`;
  }

  return `${formatShortDate(from, dateLocale)} – ${formatShortDate(to, dateLocale)}`;
}

function todayIsoDate(): string {
  const now = new Date();
  return toDateKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function DateRangeField({
  id,
  name,
  label,
  labelAccessory,
  hint,
  error,
  required,
  disabled = false,
  className,
  placeholder,
  value,
  onChange,
}: DateRangeFieldProps) {
  const { t, dateLocale } = useI18n();
  const resolvedPlaceholder = useResolvedPlaceholder({ label, type: "date-range", placeholder });
  const clearFieldError = useClearFieldError(name);
  const weekdayLabels = useMemo(() => calendarWeekdayLabels(dateLocale), [dateLocale]);
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const [draftStart, setDraftStart] = useState<string | null>(null);

  const focusDate = value.from || value.to || todayIsoDate();
  const initialMonth = useMemo((): YearMonth => {
    const parts = parseDateParts(focusDate);
    return { year: parts.year, month: parts.month };
  }, [focusDate]);

  const [view, setView] = useState<YearMonth>(initialMonth);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setView(initialMonth);
      setDraftStart(null);
    }
  }, [initialMonth.month, initialMonth.year, open]);

  const positionPanel = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const panelWidth = 280;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 320 && rect.top > spaceBelow;
    let left = rect.left;
    if (left + panelWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - panelWidth - 12);
    }

    setPanelStyle({
      position: "fixed",
      top: openUp ? undefined : rect.bottom + 6,
      bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
      left,
      width: panelWidth,
      zIndex: 110,
    });
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    positionPanel();
    const onReposition = () => positionPanel();
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, positionPanel]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus({ preventScroll: true });
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const cells = useMemo(() => {
    const leadingBlank = weekdaySundayFirst(view.year, view.month, 1);
    const totalDays = daysInMonth(view.year, view.month);
    const next: Array<{ key: string; dayNumber: number | null; dateKey: string | null }> = [];

    for (let i = 0; i < leadingBlank; i += 1) {
      next.push({ key: `blank-start-${i}`, dayNumber: null, dateKey: null });
    }
    for (let dayNumber = 1; dayNumber <= totalDays; dayNumber += 1) {
      const dateKey = toDateKey(view.year, view.month, dayNumber);
      next.push({ key: dateKey, dayNumber, dateKey });
    }
    while (next.length % 7 !== 0) {
      next.push({ key: `blank-end-${next.length}`, dayNumber: null, dateKey: null });
    }
    return next;
  }, [view.month, view.year]);

  function shiftMonth(delta: number) {
    setView((current) => {
      const monthIndex = current.month - 1 + delta;
      const year = current.year + Math.floor(monthIndex / 12);
      const month = ((monthIndex % 12) + 12) % 12 + 1;
      return { year, month };
    });
  }

  function selectDay(dateKey: string) {
    if (!draftStart) {
      setDraftStart(dateKey);
      onChange({ from: dateKey, to: dateKey });
      clearFieldError();
      return;
    }

    const from = draftStart <= dateKey ? draftStart : dateKey;
    const to = draftStart <= dateKey ? dateKey : draftStart;
    onChange({ from, to });
    clearFieldError();
    setDraftStart(null);
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  }

  function selectToday() {
    const today = todayIsoDate();
    onChange({ from: today, to: today });
    clearFieldError();
    setDraftStart(null);
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open && !disabled) {
        setOpen(true);
      }
    }
  }

  const displayValue = formatRangeLabel(value.from, value.to, dateLocale);
  const rangeFrom = draftStart ?? value.from;
  const rangeTo = draftStart ? draftStart : value.to;

  return (
    <FieldShell
      id={controlId}
      name={name}
      label={label}
      labelAccessory={labelAccessory}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      {(resolvedId, resolvedError) => (
        <div ref={rootRef} className="relative min-w-0">
          <button
            ref={triggerRef}
            id={resolvedId}
            type="button"
            disabled={disabled}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-invalid={Boolean(resolvedError)}
            onClick={() => {
              if (!disabled) {
                setOpen((current) => !current);
              }
            }}
            onKeyDown={onTriggerKeyDown}
            className={cn(
              "portal-input flex items-center justify-between gap-2 text-left",
              open && "border-brand-500 ring-[3px] ring-brand-500/15",
              resolvedError && "border-red-300 focus:border-red-400 focus:ring-red-500/15",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <span className={cn("min-w-0 truncate", !displayValue && "text-surface-500")}>
              {displayValue || resolvedPlaceholder}
            </span>
            <CalendarIcon className="size-4 shrink-0 text-surface-500" strokeWidth={1.85} aria-hidden />
          </button>

          {open && mounted
            ? createPortal(
                <div
                  ref={panelRef}
                  style={panelStyle}
                  role="dialog"
                  aria-label={label ?? t("common.chooseDateRange")}
                  className="portal-date-panel"
                >
                  <div className="flex items-center justify-between gap-1 border-b border-surface-100 px-2 py-1.5">
                    <button
                      type="button"
                      className="inline-flex size-6 items-center justify-center rounded-md text-surface-600 transition hover:bg-surface-50"
                      onClick={() => shiftMonth(-1)}
                      aria-label={t("common.previousMonth")}
                    >
                      <ChevronLeft className="size-3.5 rtl-flip" strokeWidth={2} />
                    </button>
                    <p className="text-[12px] font-semibold tracking-tight text-surface-900">
                      {formatYearMonth(view.year, view.month, dateLocale)}
                    </p>
                    <button
                      type="button"
                      className="inline-flex size-6 items-center justify-center rounded-md text-surface-600 transition hover:bg-surface-50"
                      onClick={() => shiftMonth(1)}
                      aria-label={t("common.nextMonth")}
                    >
                      <ChevronRight className="size-3.5 rtl-flip" strokeWidth={2} />
                    </button>
                  </div>

                  <p className="border-b border-surface-100 px-3 py-1.5 text-[11px] text-surface-500">
                    {draftStart ? t("common.selectEndDate") : t("common.selectDates")}
                  </p>

                  <div className="grid grid-cols-7 gap-0 px-1.5 pt-1.5">
                    {weekdayLabels.map((labelText, index) => (
                      <div
                        key={index}
                        className="flex h-5 items-center justify-center text-[9px] font-semibold tracking-[0.06em] text-surface-400"
                      >
                        {labelText}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-0 px-1.5 pb-1.5">
                    {cells.map((cell) => {
                      if (cell.dayNumber == null || cell.dateKey == null) {
                        return <div key={cell.key} className="h-7 w-full" />;
                      }

                      const dateKey = cell.dateKey;
                      const isStart = dateKey === rangeFrom;
                      const isEnd = dateKey === rangeTo;
                      const inRange =
                        Boolean(rangeFrom) &&
                        Boolean(rangeTo) &&
                        dateKey >= rangeFrom &&
                        dateKey <= rangeTo;
                      const isEdge = isStart || isEnd;
                      const hasSpan = inRange && rangeFrom !== rangeTo;

                      return (
                        <div
                          key={cell.key}
                          className={cn(
                            "relative flex h-7 w-full items-center justify-center",
                            hasSpan && "bg-brand-50 dark:bg-brand-500/20",
                            hasSpan && isStart && "rounded-s-full",
                            hasSpan && isEnd && "rounded-e-full",
                          )}
                        >
                          <button
                            type="button"
                            aria-label={formatShortDate(dateKey, dateLocale)}
                            aria-pressed={isEdge}
                            onClick={() => selectDay(dateKey)}
                            className={cn(
                              "relative z-10 flex size-7 items-center justify-center rounded-full text-[11px] font-semibold transition",
                              isEdge && "bg-brand-600 text-white",
                              inRange &&
                                !isEdge &&
                                "text-brand-700 dark:text-brand-300",
                              !inRange &&
                                "text-surface-800 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-500/20 dark:hover:text-brand-300",
                            )}
                          >
                            {cell.dayNumber}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-surface-100 px-2 py-1.5">
                    <button
                      type="button"
                      className="rounded-md px-2 py-1 text-[11px] font-semibold text-brand-700 transition hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-500/20"
                      onClick={selectToday}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      className="rounded-md px-2 py-1 text-[11px] font-semibold text-surface-600 transition hover:bg-surface-50"
                      onClick={() => {
                        setOpen(false);
                        triggerRef.current?.focus({ preventScroll: true });
                      }}
                    >
                      Done
                    </button>
                  </div>
                </div>,
                document.body,
              )
            : null}
        </div>
      )}
    </FieldShell>
  );
}
