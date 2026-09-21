"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useClearFieldError, useFieldError } from "../validation/form-validation";
import { useI18n } from "../i18n/I18nProvider";
import { cn, FieldShell, type FieldOption } from "./field";
import { useResolvedPlaceholder } from "../i18n/use-field-placeholder";
import { localizedStoredLabel } from "../i18n/I18nProvider";

type SelectValue = string | string[];

export type SelectInputSize = "xs" | "sm" | "default" | "lg";

export type SelectInputProps = {
  id?: string;
  name?: string;
  label?: string;
  labelAccessory?: ReactNode;
  hint?: string;
  error?: string | null;
  options?: FieldOption[];
  value?: SelectValue | null;
  defaultValue?: SelectValue | null;
  placeholder?: string;
  multiple?: boolean;
  searchable?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  size?: SelectInputSize;
  panelMinWidth?: number;
  embedded?: boolean;
  /** Set to -1 to keep the trigger out of the tab sequence while staying clickable. */
  tabIndex?: number;
  "aria-label"?: string;
  api?: string | null;
  searchParam?: string;
  valueKey?: string;
  labelKey?: string;
  creatableLabel?: string;
  onCreatable?: () => void;
  onChange?: (value: SelectValue) => void;
  onBlur?: () => void;
};

const SELECT_PANEL_FALLBACK_WIDTH: Record<SelectInputSize, number> = {
  xs: 120,
  sm: 140,
  default: 280,
  lg: 320,
};

/** Above `.portal-modal-backdrop` (z-100) so portaled panels work inside modals. */
const SELECT_PANEL_Z_INDEX = 110;

function floatingPortalHost(trigger: HTMLElement | null): HTMLElement {
  if (!trigger) {
    return document.body;
  }

  const dialogHost = trigger.closest(".cms-dialog-root, dialog[open]");

  return dialogHost instanceof HTMLElement ? dialogHost : document.body;
}

/** Some browsers use an open <dialog> as the fixed-position containing block. */
function fixedContainingOrigin(panel: HTMLElement): { left: number; top: number } {
  panel.style.position = "fixed";
  panel.style.left = "0px";
  panel.style.top = "0px";
  panel.style.visibility = "hidden";

  const probe = panel.getBoundingClientRect();

  return { left: probe.left, top: probe.top };
}

function selectTriggerClass(size: SelectInputSize, embedded: boolean): string {
  if (embedded) {
    return cn(
      "portal-select-trigger--embedded",
      size === "xs" && "portal-select-trigger--embedded-xs",
      size === "sm" && "portal-select-trigger--embedded-sm",
      size === "lg" && "portal-select-trigger--embedded-lg",
    );
  }

  return cn(
    "portal-select-trigger",
    size === "xs" && "portal-select-trigger--xs",
    size === "sm" && "portal-select-trigger--sm",
    size === "lg" && "portal-select-trigger--lg",
  );
}

function normalizeValue(value: SelectValue | null | undefined, multiple: boolean): string[] {
  if (value == null || value === "") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map(String).filter((item) => item !== "");
  }

  return multiple ? [String(value)] : [String(value)];
}

function normalizeRemoteOption(
  item: unknown,
  valueKey: string,
  labelKey: string,
): FieldOption | null {
  if (item == null) {
    return null;
  }

  if (typeof item !== "object") {
    return { value: String(item), label: String(item) };
  }

  const record = item as Record<string, unknown>;
  const value = record[valueKey] ?? record.value ?? record.id;
  const label = record[labelKey] ?? record.label ?? record.name ?? record.display_name;
  const description =
    typeof record.service_notice === "string"
      ? record.service_notice
      : typeof record.description === "string"
        ? record.description
        : undefined;

  if (value == null || label == null) {
    return null;
  }

  return {
    value: String(value),
    label: String(label),
    description,
  };
}

function extractRemoteOptions(
  payload: unknown,
  valueKey: string,
  labelKey: string,
): FieldOption[] {
  const nestedResponse =
    payload && typeof payload === "object" && "response" in payload
      ? (payload as { response?: { data?: unknown } }).response?.data
      : undefined;

  const source = nestedResponse ?? payload;

  const list = Array.isArray(source)
    ? source
    : Array.isArray((source as { data?: unknown })?.data)
      ? ((source as { data: unknown[] }).data)
      : Array.isArray((source as { options?: unknown })?.options)
        ? ((source as { options: unknown[] }).options)
        : [];

  return list
    .map((item) => normalizeRemoteOption(item, valueKey, labelKey))
    .filter((item): item is FieldOption => item !== null);
}

function useDebouncedCallback<T extends (...args: never[]) => void>(fn: T, wait = 280) {
  const fnRef = useRef(fn);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    },
    [],
  );

  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }

      timerRef.current = window.setTimeout(() => {
        fnRef.current(...args);
      }, wait);
    },
    [wait],
  );
}

function CheckIcon() {
  return (
    <svg className="size-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg className="size-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-4.35-4.35m1.35-5.15a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
      />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

export function SelectInput({
  id,
  name,
  label,
  labelAccessory,
  hint,
  error,
  options: initialOptions = [],
  value,
  defaultValue,
  placeholder,
  multiple = false,
  searchable = true,
  required = false,
  disabled = false,
  className,
  triggerClassName,
  size = "default",
  panelMinWidth,
  embedded = false,
  tabIndex = 0,
  "aria-label": ariaLabel,
  api = null,
  searchParam = "search",
  valueKey = "value",
  labelKey = "label",
  creatableLabel,
  onCreatable,
  onChange,
  onBlur,
}: SelectInputProps) {
  const { locale, dir, t } = useI18n();
  const resolvedPlaceholder = useResolvedPlaceholder({ label, type: "select", placeholder });
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const listboxId = `${controlId}-listbox`;
  const resolvedError = useFieldError(name, error);
  const clearFieldError = useClearFieldError(name);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<FieldOption[]>(initialOptions);
  const [selected, setSelected] = useState<string[]>(() =>
    normalizeValue(value ?? defaultValue, multiple),
  );
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const [mounted, setMounted] = useState(false);
  const [portalHost, setPortalHost] = useState<HTMLElement>(() => document.body);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (value !== undefined) {
      setSelected(normalizeValue(value, multiple));
    }
  }, [value, multiple]);

  useEffect(() => {
    setOptions(initialOptions);
  }, [initialOptions]);

  const emitChange = useCallback(
    (next: string[]) => {
      clearFieldError();
      if (multiple) {
        onChange?.(next);
      } else {
        onChange?.(next[0] ?? "");
      }
    },
    [clearFieldError, multiple, onChange],
  );

  const selectedLabels = useMemo(
    () =>
      selected.map((item) => {
        const option = options.find((candidate) => candidate.value === item);

        if (!option) {
          return item;
        }

        if (option.shortLabel?.trim()) {
          return option.shortLabel.trim();
        }

        return localizedStoredLabel(option, locale);
      }),
    [locale, options, selected],
  );

  const filteredOptions = useMemo(() => {
    if (api) {
      return options;
    }

    const q = query.trim().toLowerCase();

    if (!q) {
      return options;
    }

    return options.filter((option) => {
      const haystack = [option.label, option.label_ar, option.shortLabel, option.value]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [api, options, query]);

  const positionPanel = useCallback(() => {
    const trigger = triggerRef.current;
    const panel = dropdownRef.current;

    if (!trigger || !panel) {
      return false;
    }

    const rect = trigger.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      return false;
    }

    const origin = fixedContainingOrigin(panel);
    const minWidth = panelMinWidth ?? Math.max(rect.width, SELECT_PANEL_FALLBACK_WIDTH[size]);
    const panelWidth = minWidth;
    const isRtl = document.documentElement.dir === "rtl";
    let left = isRtl ? rect.right - panelWidth : rect.left;
    const maxLeft = window.innerWidth - panelWidth - 8;

    if (left > maxLeft) {
      left = Math.max(8, maxLeft);
    }

    if (left < 8) {
      left = 8;
    }

    panel.style.minWidth = `${panelWidth}px`;
    panel.style.width = `${panelWidth}px`;

    const panelHeight = panel.offsetHeight || 180;
    const gap = 6;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const top =
      panelHeight <= spaceBelow || spaceBelow >= spaceAbove
        ? rect.bottom + gap - origin.top
        : Math.max(gap, rect.top - gap - panelHeight) - origin.top;

    const resolvedLeft = left - origin.left;

    Object.assign(panel.style, {
      position: "fixed",
      top: `${top}px`,
      left: `${resolvedLeft}px`,
      width: `${panelWidth}px`,
      zIndex: String(SELECT_PANEL_Z_INDEX),
      visibility: "visible",
      pointerEvents: "auto",
    });

    setPanelStyle({
      position: "fixed",
      top,
      left: resolvedLeft,
      width: panelWidth,
      zIndex: SELECT_PANEL_Z_INDEX,
      visibility: "visible",
      pointerEvents: "auto",
    });

    return true;
  }, [size, panelMinWidth]);

  const focusDropdown = useCallback(() => {
    if (searchable && searchRef.current) {
      searchRef.current.focus({ preventScroll: true });
      return;
    }

    if (filteredOptions.length > 0) {
      setActiveIndex(0);
      const firstOption = dropdownRef.current?.querySelector<HTMLElement>(
        "button.portal-select-option:not([disabled])",
      );
      firstOption?.focus({ preventScroll: true });
    }
  }, [filteredOptions.length, searchable]);

  const fetchOptions = useCallback(
    async (searchQuery: string) => {
      if (!api) {
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);

      try {
        const url = new URL(api, window.location.origin);

        if (searchQuery.trim() !== "") {
          url.searchParams.set(searchParam, searchQuery.trim());
        }

        const response = await fetch(url.toString(), {
          headers: {
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(t("common.failedOptions"));
        }

        const payload = await response.json();
        setOptions(extractRemoteOptions(payload, valueKey, labelKey));
      } catch (error) {
        if ((error as Error)?.name === "AbortError") {
          return;
        }

        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [api, labelKey, searchParam, valueKey],
  );

  const debouncedFetch = useDebouncedCallback(fetchOptions, 280);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(-1);
    onBlur?.();
  }, [onBlur]);

  const openDropdown = useCallback(() => {
    if (disabled) {
      return;
    }

    // Keep the portaled panel off-document until we measure + place it, so focus
    // cannot scroll the page to the bottom of <body>.
    setPanelStyle({
      position: "fixed",
      top: 0,
      left: 0,
      width: panelMinWidth ?? SELECT_PANEL_FALLBACK_WIDTH[size],
      zIndex: SELECT_PANEL_Z_INDEX,
      visibility: "hidden",
      pointerEvents: "none",
    });
    setPortalHost(floatingPortalHost(triggerRef.current));
    setOpen(true);
    setActiveIndex(-1);

    if (api && options.length === 0) {
      void fetchOptions("");
    }
  }, [api, disabled, fetchOptions, options.length, panelMinWidth, size]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    let frame = 0;
    let attempts = 0;

    const runPosition = () => {
      attempts += 1;

      if (!positionPanel()) {
        if (attempts < 8) {
          frame = window.requestAnimationFrame(runPosition);
        }
        return;
      }

      frame = window.requestAnimationFrame(() => {
        focusDropdown();
      });
    };

    runPosition();

    return () => window.cancelAnimationFrame(frame);
  }, [open, filteredOptions.length, loading, positionPanel, focusDropdown, portalHost]);

  useEffect(() => {
    if (!open) {
      return;
    }

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
      const inRoot = rootRef.current?.contains(target);
      const inDropdown = dropdownRef.current?.contains(target);

      if (!inRoot && !inDropdown) {
        close();
      }
    }

    document.addEventListener("mousedown", onPointerDown);

    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [close, open]);

  function toggleValue(option: FieldOption) {
    let next: string[];

    if (multiple) {
      next = selected.includes(option.value)
        ? selected.filter((item) => item !== option.value)
        : [...selected, option.value];
    } else {
      next = [option.value];
    }

    if (!options.some((item) => item.value === option.value)) {
      setOptions((current) => [...current, option]);
    }

    setSelected(next);
    emitChange(next);

    if (!multiple) {
      close();
      triggerRef.current?.focus({ preventScroll: true });
    }
  }

  function removeSelected(index: number) {
    const next = selected.filter((_, i) => i !== index);

    setSelected(next);
    emitChange(next);
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) {
      return;
    }
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) {
        openDropdown();
      }
    }
  }

  function onDropdownKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!open) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      close();
      triggerRef.current?.focus({ preventScroll: true });
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, filteredOptions.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0 && filteredOptions[activeIndex]) {
      event.preventDefault();
      toggleValue(filteredOptions[activeIndex]);
    }
  }

  function onSearchChange(nextQuery: string) {
    setQuery(nextQuery);
    setActiveIndex(-1);

    if (api) {
      debouncedFetch(nextQuery);
    }
  }

  const fieldName = name ? (multiple ? (name.endsWith("[]") ? name : `${name}[]`) : name) : undefined;

  const hiddenInputs: ReactNode =
    fieldName == null ? null : selected.length === 0 ? (
      multiple ? null : (
        <input type="hidden" name={fieldName.replace(/\[\]$/, "")} value="" />
      )
    ) : (
      selected.map((item) => <input key={item} type="hidden" name={fieldName} value={item} />)
    );

  const dropdown = open && mounted
    ? createPortal(
        <div
          ref={dropdownRef}
          id={listboxId}
          dir={dir}
          className={cn("portal-select-dropdown is-floating", `portal-select-dropdown--${size}`)}
          data-size={size}
          style={panelStyle}
          role="listbox"
          aria-multiselectable={multiple || undefined}
          onKeyDown={onDropdownKeyDown}
        >
          {searchable ? (
            <div className="portal-select-search">
              <span className="portal-select-search-icon" aria-hidden="true">
                <SearchIcon />
              </span>
              <input
                ref={searchRef}
                type="search"
                className="portal-select-search-input"
                placeholder={t("common.search")}
                autoComplete="off"
                value={query}
                onChange={(event) => onSearchChange(event.target.value)}
              />
            </div>
          ) : null}

          <div className="portal-select-options">
            {creatableLabel && !multiple ? (
              <button
                type="button"
                className="portal-select-option portal-select-option--create"
                role="option"
                onClick={() => {
                  close();
                  window.requestAnimationFrame(() => onCreatable?.());
                }}
              >
                <span className="flex items-center gap-2 font-medium text-brand-600">
                  <span aria-hidden="true">+</span>
                  <span>{creatableLabel}</span>
                </span>
              </button>
            ) : null}

            {loading ? <p className="portal-select-loading">{t("common.searching")}</p> : null}

            {!loading && filteredOptions.length === 0 ? (
              <p className="portal-select-empty">{t("common.noResults")}</p>
            ) : null}

            {!loading
              ? filteredOptions.map((option, index) => {
                  const isSelected = selected.includes(option.value);
                  const isActive = index === activeIndex;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={option.disabled}
                      className={cn(
                        "portal-select-option",
                        isSelected && "is-selected",
                        isActive && "is-active",
                      )}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => toggleValue(option)}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{localizedStoredLabel(option, locale)}</span>
                        {option.description ? (
                          <span className="mt-0.5 block truncate text-[11px] font-medium text-amber-700">
                            {option.description}
                          </span>
                        ) : null}
                      </span>
                      {isSelected ? (
                        <span className="portal-select-check" aria-hidden="true">
                          <CheckIcon />
                        </span>
                      ) : null}
                    </button>
                  );
                })
              : null}
          </div>
        </div>,
        portalHost,
      )
    : null;

  const selectControl = (resolvedId: string, controlError: string | null) => (
    <div
      ref={rootRef}
      dir={dir}
      className={cn(
        "portal-select-field",
        embedded && "portal-select-field--embedded",
        open && "is-open",
      )}
      data-size={size}
      data-disabled={disabled || undefined}
      onKeyDown={onDropdownKeyDown}
    >
      {hiddenInputs}

      <div
        ref={triggerRef}
        role="button"
        tabIndex={disabled ? -1 : tabIndex}
        id={resolvedId}
        className={cn(
          selectTriggerClass(size, embedded),
          multiple && "portal-select-trigger--multiple",
          controlError && "portal-select-error",
          triggerClassName,
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        aria-invalid={Boolean(controlError)}
        aria-disabled={disabled || undefined}
        data-required={required || undefined}
        onClick={() => {
          if (disabled) {
            return;
          }
          open ? close() : openDropdown();
        }}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="portal-select-trigger-content">
          {selected.length === 0 ? (
            <span className="portal-select-placeholder">{resolvedPlaceholder}</span>
          ) : multiple ? (
            <div className="portal-select-chips">
              {selectedLabels.map((itemLabel, index) => (
                <span key={`${selected[index]}-${itemLabel}`} className="portal-select-chip">
                  <span className="truncate">{itemLabel}</span>
                  <button
                    type="button"
                    className="portal-select-chip-remove"
                    aria-label={t("common.remove", { label: itemLabel })}
                    disabled={disabled}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      removeSelected(index);
                    }}
                  >
                    <RemoveIcon />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <span className="portal-select-single-label">{selectedLabels[0]}</span>
          )}
        </span>
        <span className="portal-select-chevron" aria-hidden="true">
          <ChevronIcon />
        </span>
      </div>

      {dropdown}
    </div>
  );

  if (embedded) {
    return <div className={className}>{selectControl(controlId, resolvedError)}</div>;
  }

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
      {(resolvedId, shellError) => selectControl(resolvedId, shellError)}
    </FieldShell>
  );
}
