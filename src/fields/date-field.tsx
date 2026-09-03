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

export type DateFieldDayMeta = {
  date: string;
  available: boolean;
  unavailable_reason?: string | null;
  is_closed?: boolean;
};

type DateFieldProps = {
  id?: string;
  name?: string;
  label?: string;
  labelAccessory?: ReactNode;
  hint?: string;
  error?: string | null;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  placeholder?: string;
  value: string;
  days?: DateFieldDayMeta[];
  onChange: (date: string, day?: DateFieldDayMeta) => void;
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

function formatDisplayDate(date: string, dateLocale: string): string {
  const { year, month, day } = parseDateParts(date);
  return new Date(year, month - 1, day).toLocaleDateString(dateLocale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DateField({
  id,
  name,
  label,
  labelAccessory,
  hint,
  error,
  required,
  disabled = false,
  loading = false,
  className,
  placeholder,
  value,
  days = [],
  onChange,
}: DateFieldProps) {
  const { t, dateLocale } = useI18n();
  const resolvedPlaceholder = useResolvedPlaceholder({ label, type: "date", placeholder });
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

  const dayByDate = useMemo(() => {
    const map = new Map<string, DateFieldDayMeta>();
    for (const day of days) {
      map.set(day.date, day);
    }
    return map;
  }, [days]);

  const range = useMemo(() => {
    if (days.length === 0) {
      return null;
    }
    return {
      first: parseDateParts(days[0].date),
      last: parseDateParts(days[days.length - 1].date),
    };
  }, [days]);

  const initialMonth = useMemo((): YearMonth => {
    const focus = value || days.find((day) => day.available)?.date || days[0]?.date;
    if (!focus) {
      const now = new Date();
      return { year: now.getFullYear(), month: now.getMonth() + 1 };
    }
    const parts = parseDateParts(focus);
    return { year: parts.year, month: parts.month };
  }, [days, value]);

  const [view, setView] = useState<YearMonth>(initialMonth);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setView(initialMonth);
  }, [initialMonth.year, initialMonth.month]);

  const positionPanel = useCallback(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const panelWidth = 236;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 280 && rect.top > spaceBelow;
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

  const unrestricted = days.length === 0;

  const canGoPrev =
    unrestricted ||
    (range != null &&
      (view.year > range.first.year ||
        (view.year === range.first.year && view.month > range.first.month)));
  const canGoNext =
    unrestricted ||
    (range != null &&
      (view.year < range.last.year ||
        (view.year === range.last.year && view.month < range.last.month)));

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

  function selectDay(day: DateFieldDayMeta) {
    if (!day.available) {
      return;
    }
    onChange(day.date, day);
    clearFieldError();
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  }

  const triggerDisabled = disabled || loading;

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open && !triggerDisabled) {
        setOpen(true);
      }
    }
  }

  const displayValue = value ? formatDisplayDate(value, dateLocale) : "";
  const triggerLabel = loading
    ? t("common.loading")
    : displayValue || resolvedPlaceholder;

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
            disabled={triggerDisabled}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-busy={loading}
            aria-invalid={Boolean(resolvedError)}
            onClick={() => {
              if (!triggerDisabled) {
                setOpen((current) => !current);
              }
            }}
            onKeyDown={onTriggerKeyDown}
            className={cn(
              "portal-input flex items-center justify-between gap-2 text-left",
              open && "border-brand-500 ring-[3px] ring-brand-500/15",
              resolvedError && "border-red-300 focus:border-red-400 focus:ring-red-500/15",
              triggerDisabled && "cursor-not-allowed opacity-60",
            )}
          >
            <span
              className={cn(
                "min-w-0 truncate",
                !displayValue && !loading && "text-surface-500",
                loading && "text-surface-500",
              )}
            >
              {triggerLabel}
            </span>
            <CalendarIcon className="size-4 shrink-0 text-surface-500" strokeWidth={1.85} aria-hidden />
          </button>

          {open && mounted
            ? createPortal(
                <div
                  ref={panelRef}
                  style={panelStyle}
                  role="dialog"
                  aria-label={label ?? t("common.chooseDate")}
                  className="portal-date-panel"
                >
                  <div className="flex items-center justify-between gap-1 border-b border-surface-100 px-2 py-1.5">
                    <button
                      type="button"
                      className="inline-flex size-6 items-center justify-center rounded-md text-surface-600 transition hover:bg-surface-50 disabled:opacity-35"
                      disabled={!canGoPrev}
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
                      className="inline-flex size-6 items-center justify-center rounded-md text-surface-600 transition hover:bg-surface-50 disabled:opacity-35"
                      disabled={!canGoNext}
                      onClick={() => shiftMonth(1)}
                      aria-label={t("common.nextMonth")}
                    >
                      <ChevronRight className="size-3.5 rtl-flip" strokeWidth={2} />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-px px-1.5 pt-1.5">
                    {weekdayLabels.map((labelText, index) => (
                      <div
                        key={index}
                        className="flex h-5 items-center justify-center text-[9px] font-semibold tracking-[0.06em] text-surface-400"
                      >
                        {labelText}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-px px-1.5 pb-1.5">
                    {cells.map((cell) => {
                      if (cell.dayNumber == null || cell.dateKey == null) {
                        return <div key={cell.key} className="size-7" />;
                      }

                      const meta =
                        dayByDate.get(cell.dateKey) ??
                        (unrestricted
                          ? { date: cell.dateKey, available: true }
                          : null);
                      const available = unrestricted ? true : Boolean(meta?.available);
                      const selected = cell.dateKey === value;
                      const disabledDay = !unrestricted && (!meta || !available);

                      return (
                        <button
                          key={cell.key}
                          type="button"
                          disabled={disabledDay}
                          title={
                            meta?.unavailable_reason ??
                            (!unrestricted && !meta ? t("common.outsideWindow") : undefined)
                          }
                          aria-pressed={selected}
                          aria-label={`${formatDisplayDate(cell.dateKey, dateLocale)}${disabledDay ? `, ${t("common.unavailable")}` : ""}`}
                          onClick={() => {
                            if (meta) {
                              selectDay(meta);
                            }
                          }}
                          className={cn(
                            "flex size-7 items-center justify-center rounded-full text-[11px] font-semibold transition",
                            selected && "bg-brand-600 text-white",
                            !selected &&
                              available &&
                              "text-surface-800 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-500/20 dark:hover:text-brand-300",
                            disabledDay &&
                              "cursor-not-allowed text-surface-300 line-through decoration-surface-300/80",
                          )}
                        >
                          {cell.dayNumber}
                        </button>
                      );
                    })}
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
