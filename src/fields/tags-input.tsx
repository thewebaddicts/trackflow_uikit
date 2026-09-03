"use client";

import { X as RemoveIcon } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type SyntheticEvent,
} from "react";
import { useI18n } from "../i18n/I18nProvider";
import { resolveFieldPlaceholder } from "../i18n/use-field-placeholder";
import { cn } from "../lib/cn";

const SPLITTER_REGEX = /[\n#?=&\t,./\s-]+/;
const FORMATTING_REGEX = /^[^a-zA-Z0-9]*|[^a-zA-Z0-9]*$/g;

export type TagsInputRef = {
  commitPendingValue: () => void;
  getPendingValue: () => string;
};

export type TagsInputProps = HTMLAttributes<HTMLDivElement> & {
  value: string[];
  onValueChange: (value: string[]) => void;
  label?: string;
  placeholder?: string;
  maxItems?: number;
  minItems?: number;
  embedded?: boolean;
  onEnter?: (event: KeyboardEvent<HTMLInputElement>) => void;
  onMaxItemsExceeded?: (attemptedCount: number, maxItems: number) => void;
};

function normalizeTag(raw: string): string {
  return raw.replaceAll(FORMATTING_REGEX, "").trim();
}

export const TagsInput = forwardRef<TagsInputRef, TagsInputProps>(function TagsInput(
  {
    value,
    onValueChange,
    label,
    placeholder,
    maxItems,
    minItems = 0,
    embedded = false,
    className,
    id,
    dir,
    onEnter,
    onMaxItemsExceeded,
    ...props
  },
  ref,
) {
  const { t } = useI18n();
  const resolvedPlaceholder = resolveFieldPlaceholder("tags", label, placeholder, t);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [inputValue, setInputValue] = useState("");
  const [isValueSelected, setIsValueSelected] = useState(false);
  const [selectedValue, setSelectedValue] = useState("");

  const parseMaxItems = maxItems ?? Number.POSITIVE_INFINITY;
  const atMax = value.length >= parseMaxItems;
  const canRemove = value.length > minItems;
  const previousValueLength = useRef(value.length);

  const notifyMaxExceeded = useCallback(
    (attemptedCount: number) => {
      if (Number.isFinite(parseMaxItems)) {
        onMaxItemsExceeded?.(attemptedCount, parseMaxItems);
      }
    },
    [onMaxItemsExceeded, parseMaxItems],
  );

  const addTag = useCallback(
    (raw: string) => {
      const tag = normalizeTag(raw);
      if (!tag || value.includes(tag)) {
        return;
      }

      if (value.length >= parseMaxItems) {
        notifyMaxExceeded(value.length + 1);
        return;
      }

      onValueChange([...value, tag]);
    },
    [value, onValueChange, parseMaxItems, notifyMaxExceeded],
  );

  const removeTag = useCallback(
    (tag: string) => {
      if (!value.includes(tag) || value.length <= minItems) {
        return;
      }
      onValueChange(value.filter((item) => item !== tag));
    },
    [value, onValueChange, minItems],
  );

  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault();

      const tags = event.clipboardData
        .getData("text")
        .split(SPLITTER_REGEX)
        .map(normalizeTag)
        .filter(Boolean);

      if (Number.isFinite(parseMaxItems) && tags.length > parseMaxItems) {
        notifyMaxExceeded(tags.length);
      }

      const next = [...value];
      let attemptedCount = 0;
      let skippedCount = 0;

      for (const tag of tags) {
        attemptedCount += 1;
        if (next.includes(tag)) {
          continue;
        }
        if (next.length < parseMaxItems) {
          next.push(tag);
        } else {
          skippedCount += 1;
        }
      }

      if (skippedCount > 0) {
        notifyMaxExceeded(attemptedCount);
      }

      onValueChange(next);
      setInputValue("");
    },
    [value, onValueChange, parseMaxItems, notifyMaxExceeded],
  );

  const handleSelect = useCallback(
    (event: SyntheticEvent<HTMLInputElement>) => {
      const target = event.currentTarget;
      const selection = target.value.substring(target.selectionStart ?? 0, target.selectionEnd ?? 0);
      setSelectedValue(selection);
      setIsValueSelected(selection === inputValue);
    },
    [inputValue],
  );

  useEffect(() => {
    if (
      Number.isFinite(parseMaxItems) &&
      value.length >= parseMaxItems &&
      previousValueLength.current < parseMaxItems
    ) {
      notifyMaxExceeded(value.length);
    }

    previousValueLength.current = value.length;
  }, [value.length, parseMaxItems, notifyMaxExceeded]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      event.stopPropagation();

      const moveNext = () => {
        setActiveIndex(activeIndex + 1 > value.length - 1 ? -1 : activeIndex + 1);
      };

      const movePrev = () => {
        setActiveIndex(activeIndex - 1 < 0 ? value.length - 1 : activeIndex - 1);
      };

      const moveCurrent = () => {
        setActiveIndex(
          activeIndex - 1 <= 0 ? (value.length - 1 === 0 ? -1 : 0) : activeIndex - 1,
        );
      };

      const target = event.currentTarget;

      switch (event.key) {
        case "ArrowLeft":
          if (dir === "rtl") {
            if (value.length > 0 && activeIndex !== -1) {
              moveNext();
            }
          } else if (value.length > 0 && target.selectionStart === 0) {
            movePrev();
          }
          break;

        case "ArrowRight":
          if (dir === "rtl") {
            if (value.length > 0 && target.selectionStart === 0) {
              movePrev();
            }
          } else if (value.length > 0 && activeIndex !== -1) {
            moveNext();
          }
          break;

        case "Backspace":
        case "Delete":
          if (value.length === 0) {
            break;
          }
          if (activeIndex !== -1 && activeIndex < value.length) {
            removeTag(value[activeIndex]!);
            moveCurrent();
          } else if (
            target.selectionStart === 0 &&
            (selectedValue === inputValue || isValueSelected)
          ) {
            removeTag(value[value.length - 1]!);
          }
          break;

        case "Escape":
          setActiveIndex(activeIndex === -1 ? value.length - 1 : -1);
          break;

        case "Enter":
          event.preventDefault();
          if (inputValue.trim() !== "") {
            addTag(inputValue);
            setInputValue("");
            if (onEnter) {
              window.setTimeout(() => onEnter(event), 0);
            }
          } else if (onEnter) {
            onEnter(event);
          }
          break;

        case ",":
        case " ":
        case "Spacebar":
          if (inputValue.trim() !== "") {
            event.preventDefault();
            addTag(inputValue);
            setInputValue("");
          }
          break;
      }
    },
    [
      activeIndex,
      value,
      inputValue,
      removeTag,
      addTag,
      onEnter,
      dir,
      selectedValue,
      isValueSelected,
    ],
  );

  const mousePreventDefault = useCallback((event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.currentTarget.value);
  }, []);

  const commitPendingValue = useCallback(() => {
    if (inputValue.trim() !== "") {
      addTag(inputValue);
      setInputValue("");
    }
  }, [inputValue, addTag]);

  const getPendingValue = useCallback(() => inputValue.trim(), [inputValue]);

  useImperativeHandle(
    ref,
    () => ({
      commitPendingValue,
      getPendingValue,
    }),
    [commitPendingValue, getPendingValue],
  );

  return (
    <div
      {...props}
      id={id}
      dir={dir}
      aria-disabled={atMax || undefined}
      className={cn(
        embedded
          ? "flex min-h-0 min-w-0 flex-1 flex-wrap items-center gap-1.5 pe-1"
          : "portal-field-control flex min-h-9 w-full min-w-0 flex-wrap items-center gap-1.5 px-3 py-1.5",
        atMax && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      {value.map((item, index) => (
        <span
          key={item}
          tabIndex={activeIndex !== -1 ? 0 : undefined}
          aria-disabled={!canRemove || undefined}
          data-active={activeIndex === index}
          className={cn(
            "inline-flex max-w-full shrink-0 items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 py-0.5 pr-1 text-brand-700",
            "data-[active=true]:ring-2 data-[active=true]:ring-brand-500/40 data-[active=true]:ring-offset-1",
            !canRemove && "cursor-not-allowed opacity-50",
          )}
        >
          <span className="max-w-[12rem] truncate font-mono text-[11px] font-semibold tracking-tight">
            {item}
          </span>
          <button
            type="button"
            aria-label={t("common.remove", { label: item })}
            disabled={!canRemove}
            onMouseDown={mousePreventDefault}
            onClick={() => removeTag(item)}
            className="rounded-sm p-0.5 text-brand-600 transition hover:bg-brand-200/60 hover:text-brand-800 disabled:cursor-not-allowed"
          >
            <RemoveIcon className="size-3" aria-hidden />
          </button>
        </span>
      ))}

      <input
        tabIndex={0}
        id={id ? `${id}-input` : undefined}
        aria-label={t("fields.addTag")}
        disabled={atMax}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        value={inputValue}
        onSelect={handleSelect}
        onChange={activeIndex === -1 ? handleChange : undefined}
        onBlur={commitPendingValue}
        placeholder={value.length === 0 ? resolvedPlaceholder : undefined}
        onClick={() => setActiveIndex(-1)}
        className={cn(
          "portal-search-field__input h-auto min-w-[10rem] flex-1 py-0.5",
          activeIndex !== -1 && "caret-transparent",
        )}
      />
    </div>
  );
});
