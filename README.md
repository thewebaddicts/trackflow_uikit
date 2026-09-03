# @thewebaddicts/trackflow-uikit

Shared form field components and schema-driven forms for TrackFlow apps (CMS, Ops, Portal).

## Install

```bash
npm install @thewebaddicts/trackflow-uikit
```

From Git (before publish):

```bash
npm install git+ssh://git@github.com:thewebaddicts/trackflow_uikit.git
```

## Setup

### 1. Import styles

**Option A — existing apps (recommended during migration):** keep your app's `globals.css` — it already defines `portal-*` field classes.

**Option B — theme tokens only:**

```ts
import "@thewebaddicts/trackflow-uikit/styles.css";
```

**Option C — full compiled field CSS (work in progress):** run `npm run build:css` inside this repo.

### 2. Wrap your app

```tsx
import { TrackFlowUIKitProvider } from "@thewebaddicts/trackflow-uikit";

export default function RootLayout({ children }) {
  return (
    <TrackFlowUIKitProvider
      locale="en"
      themeColor={process.env.NEXT_PUBLIC_PORTAL_THEME_COLOR}
    >
      {children}
    </TrackFlowUIKitProvider>
  );
}
```

`themeColor` reads `NEXT_PUBLIC_PORTAL_THEME_COLOR` automatically when omitted.

### 3. Use fields directly

```tsx
import { TextField, SelectInput, PhoneField } from "@thewebaddicts/trackflow-uikit";

<SelectInput
  label="Country"
  options={countries}
  value={country}
  onChange={setCountry}
  searchable
/>
```

### 4. Schema-driven forms (CMS + Ops)

```tsx
import {
  SchemaFormGrid,
  emptyValuesForFields,
  type FieldSchema,
} from "@thewebaddicts/trackflow-uikit";

const fields: FieldSchema[] = [
  { name: "brand_id", type: "select", label: "Brand", depends_on: undefined, options: [...] },
  { name: "model_id", type: "select", label: "Model", depends_on: "brand_id", options: [...] },
];

<SchemaFormGrid
  fields={fields}
  values={values}
  onChange={setValues}
/>
```

**Features merged from all apps:**
- Cascading selects (`depends_on` + `parent_value` on options)
- Conditional visibility (`visibility_rules`)
- Translatable text (en/ar)
- Phone with country picker + E.164 helpers
- Tags input, file upload, toggles, date range
- API validation error mapping (`ValidatedForm`)

## Theming

Brand color is applied via CSS variables on `.tf-uikit`. Each app sets its own color:

```env
NEXT_PUBLIC_PORTAL_THEME_COLOR=#5b4fd6
```

Or pass explicitly:

```tsx
<TrackFlowUIKitProvider themeColor="#e11d48">
```

For SSR theme flash prevention:

```tsx
import { uiKitThemeInitScript } from "@thewebaddicts/trackflow-uikit";

<script dangerouslySetInnerHTML={{ __html: uiKitThemeInitScript("#5b4fd6") }} />
```

## Package contents

| Export | Description |
|--------|-------------|
| `TextField`, `SelectInput`, `PhoneField`, … | Individual field components |
| `SchemaForm`, `SchemaFormGrid`, `FieldRenderer` | API/schema-driven rendering |
| `TrackFlowUIKitProvider` | Theme + i18n + optional validation |
| `ValidatedForm` | Form with API error handling |
| `toE164Phone`, `isPhoneNumberValid` | Phone utilities |

## Workspace

Add to your Cursor/VS Code workspace:

```json
{
  "folders": [
    { "path": "trackflow_cms_frontend" },
    { "path": "trackflow_ops" },
    { "path": "trackflow_uikit" }
  ]
}
```

## Development

```bash
cd trackflow_uikit
npm install
npm run build
```

Link locally while migrating apps:

```bash
npm link
cd ../trackflow_ops && npm link @thewebaddicts/trackflow-uikit
```
