# Flowmapr — Code Conventions

## General

- Language: TypeScript everywhere. No `any` types — use proper interfaces.
- Formatting: Prettier with default settings. Run before committing.
- Imports: absolute paths using `@/` alias (configured in tsconfig).

---

## Next.js App Router Rules

- **Server components by default.** Only add `"use client"` when the component needs: event handlers, hooks, browser APIs, or React state.
- **Data fetching in server components** using Supabase server client.
- **Client components** only for interactivity: canvas, forms, modals, real-time updates.
- API routes live in `app/api/`. All sensitive operations (Claude API, generation enforcement, Polar webhooks) are server-side only.

---

## Component Structure

```tsx
// Good: clear separation
// app/(app)/workspace/page.tsx — server component, fetches data
// components/workspace/DiagramList.tsx — client component, renders list

// File naming
// PascalCase for components: DiagramCard.tsx
// camelCase for hooks: useDiagram.ts
// kebab-case for route folders: app/(app)/diagram/[id]/
```

---

## Supabase Client Usage

```tsx
// Server component or API route → use server client
import { createClient } from '@/lib/supabase/server'
const supabase = createClient()

// Client component → use browser client
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
```

Never use the service role key outside of API routes and webhook handlers.

---

## Generation Enforcement Pattern

Always enforce server-side. Template for `/api/generate/route.ts`:

```tsx
// 1. Auth check
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

// 2. Atomic decrement — if 0 rows returned, quota exceeded
const { data, error } = await supabase
  .from('subscriptions')
  .update({ generations_used: supabase.rpc('increment', { x: 1 }) })
  .eq('user_id', user.id)
  .lt('generations_used', supabase.raw('monthly_limit')) // only update if under limit
  .select()
  .single()

if (!data) return NextResponse.json({ error: 'quota_exceeded' }, { status: 402 })

// 3. Call Claude API...
```

---

## Auto-Save Pattern

```tsx
// hooks/useAutoSave.ts
const debouncedSave = useDebouncedCallback(async (flowData) => {
  await saveDiagram(diagramId, flowData)
}, 2000) // 2 second debounce

// Call on every React Flow onChange
const onNodesChange = useCallback((changes) => {
  setNodes((nds) => applyNodeChanges(changes, nds))
  debouncedSave(getCurrentFlowData())
}, [])
```

---

## Error Handling

- API routes: always return `{ error: string }` with appropriate HTTP status
- Client components: use toast notifications for user-facing errors
- Never expose raw Supabase or Claude error messages to users

```tsx
// Good
return NextResponse.json({ error: 'quota_exceeded' }, { status: 402 })

// Bad
return NextResponse.json({ error: supabaseError.message }, { status: 500 })
```

---

## CSS / Styling Rules

- Use Tailwind utility classes for layout and spacing
- Use CSS token variables for colors: `text-[--color-text-primary]` or inline `style={{ color: 'var(--color-accent)' }}`
- Never hardcode hex values in components
- Never write custom CSS for things shadcn already handles
- `cn()` utility from `@/lib/utils` for conditional classNames

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Components | PascalCase | `DiagramCard.tsx` |
| Hooks | camelCase with `use` prefix | `useGeneration.ts` |
| API routes | `route.ts` in folder | `app/api/generate/route.ts` |
| Types | PascalCase interface | `DiagramFlowData` |
| DB columns | snake_case | `flow_data`, `user_id` |
| CSS tokens | kebab-case with prefix | `--color-accent` |
| Supabase functions | snake_case | `handle_new_user()` |

---

## What Not To Do

- ❌ Never call Claude API from client-side code
- ❌ Never trust client-side generation counter for enforcement
- ❌ Never use `<img>` — use `next/image`
- ❌ Never hardcode hex colors in components
- ❌ Never write dark mode styles (Post-MVP)
- ❌ Never add `"use client"` to a component that doesn't need it
- ❌ Never store ANTHROPIC_API_KEY or SUPABASE_SERVICE_ROLE_KEY in client-accessible env vars
