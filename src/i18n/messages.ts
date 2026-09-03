export type UiKitLocale = "en" | "ar";

export type UiKitMessages = {
  common: {
    search: string;
    searching: string;
    noResults: string;
    selectOption: string;
    selectDate: string;
    selectDates: string;
    remove: string;
    showPassword: string;
    hidePassword: string;
    pleaseFix: string;
    fieldNeedsAttention: string;
    fieldsNeedAttention: string;
    phoneCountry: string;
    validPhone: string;
    invalidPhone: string;
    failedOptions: string;
    noFileChosen: string;
    loading: string;
    chooseDate: string;
    chooseDateRange: string;
    previousMonth: string;
    nextMonth: string;
    outsideWindow: string;
    unavailable: string;
    selectEndDate: string;
    clear: string;
  };
  fields: {
    enterValue: string;
    enterLabel: string;
    selectLabel: string;
    phonePlaceholder: string;
    selectTime: string;
    selectDateTime: string;
    enterLocaleLabel: string;
    translatableHelp: string;
    switchLanguageShortcut: string;
    languageLabel: string;
    addTag: string;
    pasteLimit: string;
    addLimit: string;
  };
  auth: {
    emailPlaceholder: string;
    passwordPlaceholder: string;
  };
  import: {
    selectFile: string;
    dropHint: string;
    replaceHint: string;
  };
};

export const enMessages: UiKitMessages = {
  common: {
    search: "Search…",
    searching: "Searching…",
    noResults: "No results",
    selectOption: "Select an option",
    selectDate: "Select date",
    selectDates: "Select dates",
    remove: "Remove {label}",
    showPassword: "Show password",
    hidePassword: "Hide password",
    pleaseFix: "Please fix the following",
    fieldNeedsAttention: "1 field needs your attention.",
    fieldsNeedAttention: "{count} fields need your attention.",
    phoneCountry: "Country code",
    validPhone: "Valid phone number",
    invalidPhone: "Invalid phone number",
    failedOptions: "Could not load options",
    noFileChosen: "No file chosen",
    loading: "Loading…",
    chooseDate: "Choose date",
    chooseDateRange: "Choose date range",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    outsideWindow: "Outside available window",
    unavailable: "Unavailable",
    selectEndDate: "Select end date",
    clear: "Clear",
  },
  fields: {
    enterValue: "Enter value",
    enterLabel: "Enter {label}",
    selectLabel: "Select {label}",
    phonePlaceholder: "Phone number",
    selectTime: "Select time",
    selectDateTime: "Select date and time",
    enterLocaleLabel: "Enter {label} ({locale})",
    translatableHelp: "Multi-language field",
    switchLanguageShortcut: "Tip: Ctrl+; to switch language",
    languageLabel: "Language: {locale}",
    addTag: "Add tag",
    pasteLimit: "You can paste up to {max} items",
    addLimit: "Maximum {max} items allowed",
  },
  auth: {
    emailPlaceholder: "you@company.com",
    passwordPlaceholder: "Password",
  },
  import: {
    selectFile: "Choose a file",
    dropHint: "Drop a file here, or click to browse",
    replaceHint: "Click to replace",
  },
};

export const arMessages: UiKitMessages = {
  common: {
    search: "بحث…",
    searching: "جاري البحث…",
    noResults: "لا توجد نتائج",
    selectOption: "اختر خياراً",
    selectDate: "اختر التاريخ",
    selectDates: "اختر التواريخ",
    remove: "إزالة {label}",
    showPassword: "إظهار كلمة المرور",
    hidePassword: "إخفاء كلمة المرور",
    pleaseFix: "يرجى تصحيح ما يلي",
    fieldNeedsAttention: "حقل واحد يحتاج انتباهك.",
    fieldsNeedAttention: "{count} حقول تحتاج انتباهك.",
    phoneCountry: "رمز الدولة",
    validPhone: "رقم هاتف صالح",
    invalidPhone: "رقم هاتف غير صالح",
    failedOptions: "تعذر تحميل الخيارات",
    noFileChosen: "لم يتم اختيار ملف",
    loading: "جاري التحميل…",
    chooseDate: "اختر التاريخ",
    chooseDateRange: "اختر نطاق التاريخ",
    previousMonth: "الشهر السابق",
    nextMonth: "الشهر التالي",
    outsideWindow: "خارج النافذة المتاحة",
    unavailable: "غير متاح",
    selectEndDate: "اختر تاريخ الانتهاء",
    clear: "مسح",
  },
  fields: {
    enterValue: "أدخل القيمة",
    enterLabel: "أدخل {label}",
    selectLabel: "اختر {label}",
    phonePlaceholder: "رقم الهاتف",
    selectTime: "اختر الوقت",
    selectDateTime: "اختر التاريخ والوقت",
    enterLocaleLabel: "أدخل {label} ({locale})",
    translatableHelp: "حقل متعدد اللغات",
    switchLanguageShortcut: "نصيحة: Ctrl+; لتبديل اللغة",
    languageLabel: "اللغة: {locale}",
    addTag: "إضافة وسم",
    pasteLimit: "يمكنك لصق حتى {max} عنصر",
    addLimit: "الحد الأقصى {max} عناصر",
  },
  auth: {
    emailPlaceholder: "you@company.com",
    passwordPlaceholder: "كلمة المرور",
  },
  import: {
    selectFile: "اختر ملفاً",
    dropHint: "أسقط ملفاً هنا، أو انقر للتصفح",
    replaceHint: "انقر للاستبدال",
  },
};

export function calendarWeekdayLabels(locale: UiKitLocale | string): string[] {
  const formatter = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    weekday: "short",
  });

  return Array.from({ length: 7 }, (_, index) =>
    formatter.format(new Date(2024, 0, index + 7)),
  );
}

export function localizedStoredLabel(
  option: { label: string; label_ar?: string },
  locale: UiKitLocale | string,
): string {
  if (locale === "ar" && option.label_ar?.trim()) {
    return option.label_ar.trim();
  }

  return option.label;
}

type InterpolationValues = Record<string, string | number>;

function interpolate(template: string, values?: InterpolationValues): string {
  if (!values) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    values[key] !== undefined ? String(values[key]) : `{${key}}`,
  );
}

export function createTranslator(messages: UiKitMessages) {
  return function t(path: string, values?: InterpolationValues): string {
    const parts = path.split(".");
    let current: unknown = messages;

    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return path;
      }
    }

    return typeof current === "string" ? interpolate(current, values) : path;
  };
}
