# LotTrace — UI Design System

> Read this before building any UI component or page.
> All design decisions are made here — never invent new patterns in components.

---

## Design Philosophy
- **Functional first**: This is a compliance tool used in warehouses and offices. Clarity beats decoration.
- **Mobile-aware dashboard**: tablet usage is common; avoid tiny touch targets
- **Scan PWA**: optimized for one-handed mobile use, large touch targets, high contrast
- **Data density**: users need to see a lot of records — avoid excessive whitespace

---

## Color System (Tailwind Config)

```javascript
// tailwind.config.js — extend with these semantic tokens
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Brand
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',   // Primary blue
          600: '#2563eb',   // Hover
          700: '#1d4ed8',   // Active/pressed
          900: '#1e3a8a',
        },
        // Lot/Event Status Colors (semantic)
        status: {
          active:   '#22c55e',  // green-500
          recalled: '#ef4444',  // red-500
          void:     '#94a3b8',  // slate-400
          amended:  '#f59e0b',  // amber-500
          pending:  '#a855f7',  // purple-500
        },
        // Compliance
        gap: {
          critical: '#ef4444',  // red-500
          warning:  '#f59e0b',  // amber-500
          info:     '#3b82f6',  // blue-500
        },
        // CTE Event Type Colors
        cte: {
          creation:       '#8b5cf6',  // violet-500
          receiving:      '#3b82f6',  // blue-500
          transformation: '#f59e0b',  // amber-500
          shipping:       '#10b981',  // emerald-500
        },
      },
    },
  },
};
```

### Usage in Components (semantic, not raw colors)
```jsx
// ✅ Use semantic colors
<Badge className="bg-status-active text-white">Active</Badge>

// ❌ Never hardcode hex or raw Tailwind colors for status
<Badge className="bg-green-500">Active</Badge>
```

---

## Typography

| Element | Tailwind Classes |
|---------|----------------|
| Page title | `text-2xl font-bold text-gray-900` |
| Page subtitle | `text-sm text-muted-foreground` |
| Section heading | `text-lg font-semibold text-gray-900` |
| Card title | `text-base font-medium` |
| Table header | `text-xs font-semibold uppercase tracking-wide text-gray-500` |
| Body text | `text-sm text-gray-700` |
| Caption / label | `text-xs text-muted-foreground` |
| Lot code (mono) | `font-mono text-sm font-medium` |
| Hash / ID | `font-mono text-xs text-muted-foreground` |

---

## Spacing & Layout

### Dashboard Layout (AppLayout)
```jsx
<div className="flex h-screen bg-gray-50">
  <Sidebar />                           {/* fixed 240px */}
  <main className="flex-1 overflow-auto">
    <div className="p-6 space-y-6">    {/* page padding */}
      <PageHeader />
      {/* content */}
    </div>
  </main>
</div>
```

### Auth Layout (AuthLayout)
```jsx
<div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
  <div className="w-full max-w-md">
    <Card>
      <CardHeader>...</CardHeader>
      <CardContent>...</CardContent>
    </Card>
  </div>
</div>
```

### Page Sections
```
Between page sections: space-y-6
Between form fields:   space-y-4
Card padding:          p-6 (standard), p-4 (compact/mobile)
Table row padding:     px-4 py-3
```

---

## Components Reference

### StatusBadge — for Lot/Event Status
```jsx
// components/common/StatusBadge.jsx
const STATUS_STYLES = {
  active:   'bg-green-100 text-green-800',
  recalled: 'bg-red-100 text-red-800',
  void:     'bg-gray-100 text-gray-500',
  amended:  'bg-amber-100 text-amber-800',
  pending:  'bg-purple-100 text-purple-800',
  // Import statuses
  processing: 'bg-blue-100 text-blue-800',
  complete:   'bg-green-100 text-green-800',
  failed:     'bg-red-100 text-red-800',
};

export const StatusBadge = ({ status }) => (
  <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
    STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-800')}>
    {status}
  </span>
);
```

### CteBadge — for Event Types
```jsx
const CTE_STYLES = {
  creation:       'bg-violet-100 text-violet-800',
  receiving:      'bg-blue-100 text-blue-800',
  transformation: 'bg-amber-100 text-amber-800',
  shipping:       'bg-emerald-100 text-emerald-800',
};
```

### PageHeader
```jsx
// components/common/PageHeader.jsx
export const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);
```

### EmptyState — always include icon + title + description + CTA
```jsx
// components/common/EmptyState.jsx
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {Icon && <Icon className="h-12 w-12 text-muted-foreground mb-4" />}
    <h3 className="text-base font-semibold text-gray-900">{title}</h3>
    <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);
```

### FormField — wraps label + input + error
```jsx
// components/common/FormField.jsx
export const FormField = ({ label, required, error, children }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-gray-700">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);
```

---

## Buttons

| Variant | When to Use |
|---------|------------|
| `<Button>` (default) | Primary action (1 per section) |
| `<Button variant="outline">` | Secondary action |
| `<Button variant="ghost">` | Low-emphasis action |
| `<Button variant="destructive">` | Destructive (void, delete) |
| `<Button size="sm">` | Table row actions |
| `<Button size="lg">` | CTAs in empty states |

Rules:
- Every button that fires an async action: `disabled={isPending}` + loading spinner
- Destructive actions: always show confirm dialog first
- Primary action button is always `type="submit"` in forms

```jsx
// Async button pattern
<Button disabled={isPending} onClick={handleCreate}>
  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  Create Lot
</Button>
```

---

## Forms

All forms use react-hook-form + Zod:
```jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  traceabilityLotCode: z.string().min(1, 'Lot code is required'),
  quantity: z.number({ invalid_type_error: 'Must be a number' }).positive(),
});

export const CreateLotForm = ({ onSubmit }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Lot Code" required error={errors.traceabilityLotCode?.message}>
        <Input {...register('traceabilityLotCode')} placeholder="e.g. LOT-2024-0115-A" />
      </FormField>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create Lot
      </Button>
    </form>
  );
};
```

---

## Tables

All tables use @tanstack/react-table via the `DataTable` wrapper:
```jsx
// Always include: sorting, column visibility, loading skeleton, empty state
<DataTable
  columns={columns}
  data={data?.data ?? []}
  isLoading={isLoading}
  pagination={data?.pagination}
  onPaginationChange={setPagination}
/>
```

Table column definition pattern:
```javascript
const columns = [
  {
    accessorKey: 'traceabilityLotCode',
    header: 'Lot Code',
    cell: ({ row }) => (
      <span className="font-mono text-sm font-medium">{row.original.traceabilityLotCode}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: 'actions',
    cell: ({ row }) => <LotActions lot={row.original} />,
  },
];
```

---

## Loading States

| Context | Component |
|---------|----------|
| Full page loading | `<PageSkeleton />` — skeleton rows, not spinner |
| Button action | Spinner inside button + `disabled` |
| Table loading | Skeleton rows (5 rows) |
| Inline data | `<Skeleton className="h-4 w-32" />` |
| Modal loading | Skeleton fields |

Never use a full-page spinner for page-level loading.

---

## Error States

| Context | Pattern |
|---------|---------|
| API error (toast) | `toast.error('Failed to create lot')` via `sonner` |
| Form validation | Inline below field via FormField |
| Page-level error | `<ErrorState message="..." onRetry={() => refetch()} />` |
| 404 page | Dedicated `NotFoundPage.jsx` |
| Empty list | `<EmptyState />` with CTA |

Never show raw error messages to users — always a friendly message:
```javascript
// In React Query onError:
onError: (err) => {
  const message = err.response?.data?.message ?? 'Something went wrong. Please try again.';
  toast.error(message);
}
```

---

## Icons (Lucide Only)
```jsx
import { Package, MapPin, Truck, FlaskConical, ArrowUpDown, Loader2 } from 'lucide-react';

// Icon for each CTE:
const CTE_ICONS = {
  creation:       FlaskConical,
  receiving:      Package,
  transformation: ArrowUpDown,
  shipping:       Truck,
};

// Standard icon sizes:
// Sidebar nav:    h-5 w-5
// Button (left):  h-4 w-4 mr-2
// Empty state:    h-12 w-12 text-muted-foreground
// Table action:   h-4 w-4
// Loading:        h-4 w-4 animate-spin
```

---

## Scan PWA — Mobile-Specific Rules

The scan PWA (`/scan-pwa`) has additional rules for mobile UX:
- Minimum touch target: 44x44px (use `min-h-[44px] min-w-[44px]`)
- Font size minimum: `text-base` (16px — prevents iOS zoom on input focus)
- Full-width buttons always: `w-full`
- Camera viewfinder: full-width, aspect-ratio 4:3
- Scan feedback: haptic + visual (green flash on success)
- High contrast mode support: don't rely on color alone for status

---

## Responsive Breakpoints
- `sm`: 640px — rarely used in this app
- `md`: 768px — tablet/iPad
- `lg`: 1024px — desktop
- `xl`: 1280px — wide desktop

Mobile-first defaults, `md:` prefix for desktop:
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

---

## shadcn/ui Component Usage

Run to add components:
```bash
npx shadcn-ui@latest add button card dialog table badge input textarea select label
```

Never modify files in `src/components/ui/` — these are managed by shadcn CLI.
Create wrapper components in `src/components/common/` if custom behavior is needed.

Installed shadcn components for LotTrace:
- `button`, `card`, `dialog`, `alert-dialog`, `table`, `badge`
- `input`, `textarea`, `select`, `label`, `checkbox`, `switch`
- `dropdown-menu`, `popover`, `command` (for search/select)
- `tabs`, `separator`, `scroll-area`
- `skeleton`, `progress`, `toast` (replaced by sonner)
- `sheet` (mobile sidebar)
- `form` (react-hook-form integration)
