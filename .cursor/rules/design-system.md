# Flowmapr — Design System

## Design Philosophy

Minimal, professional, tool-invisible. Inspired by Apple, Linear, Vercel.
**"Show the work, not the tool."** The diagram is always the hero. UI disappears.

---

## Color Tokens

Define in `app/globals.css` as CSS custom properties:

```css
:root {
  /* Backgrounds */
  --color-bg:             #FAFAFA;  /* app background, canvas bg */
  --color-surface:        #FFFFFF;  /* cards, panels, modals, sidebar */
  --color-surface-raised: #F4F4F5;  /* hover states, input bg, subtle dividers */
  --color-border:         #E4E4E7;  /* all borders and dividers */

  /* Text */
  --color-text-primary:   #09090B;  /* headlines, body, labels */
  --color-text-secondary: #71717A;  /* captions, placeholders, metadata */
  --color-text-disabled:  #A1A1AA;  /* disabled states */

  /* Accent (Indigo) */
  --color-accent:         #4F46E5;  /* primary buttons, active states, links */
  --color-accent-hover:   #4338CA;  /* hover on accent */
  --color-accent-subtle:  #EEF2FF;  /* accent backgrounds, badges */

  /* Semantic */
  --color-success:        #16A34A;  /* success toasts, valid states */
  --color-warning:        #D97706;  /* warning banners (80% credits used) */
  --color-danger:         #DC2626;  /* errors, destructive actions */

  /* Diagram canvas */
  --color-diagram-bg:           #FFFFFF;
  --color-diagram-grid:         #E4E4E7;
  --color-diagram-node:         #FFFFFF;
  --color-diagram-node-border:  #09090B;
  --color-diagram-edge:         #71717A;
  --color-diagram-selected:     #4F46E5;
}
```

**Rule:** Never use hardcoded hex values in components. Always reference tokens.

---

## Typography

Fonts loaded via `next/font/google` in `app/layout.tsx`.

```tsx
import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })
```

| Token | Font | Size | Weight | Usage |
|---|---|---|---|---|
| Display | Inter | 48px | 700 | Landing hero headline only |
| Heading 1 | Inter | 30px | 600 | Page titles in app |
| Heading 2 | Inter | 20px | 600 | Section headers, panel titles |
| Heading 3 | Inter | 16px | 500 | Card titles, subsection labels |
| Body | Inter | 14px | 400 | All body text |
| Body Small | Inter | 12px | 400 | Captions, timestamps |
| Label | Inter | 12px | 500 | Form labels, table headers |
| Prompt Input | JetBrains Mono | 14px | 400 | AI prompt textarea only |

---

## Spacing

Base unit: **4px**. All spacing is a multiple of 4.

```
4px   — xs  (tight gaps, icon padding)
8px   — sm  (between label and input)
12px  — md  (inner card padding on small cards)
16px  — lg  (standard inner padding)
24px  — xl  (section gaps within a panel)
32px  — 2xl (between major sections)
48px  — 3xl (landing page section spacing)
64px  — 4xl (landing page hero padding)
```

---

## Border Radius

```
4px   — badges, tags, tooltips
6px   — buttons, inputs, small cards
8px   — cards, panels, dropdowns
12px  — modals, large dialogs
```

---

## Shadows

- **App UI:** No shadows. Use borders (`--color-border`) to separate surfaces.
- **Landing page cards only:** `box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)`
- **Modals:** `box-shadow: 0 20px 60px rgba(0,0,0,0.12)`

---

## Buttons

Only 2 variants in the entire app:

**Primary**
```tsx
// bg: --color-accent, text: white, hover: --color-accent-hover
<Button variant="default">Try free</Button>
```

**Secondary**
```tsx
// bg: transparent, border: --color-border, text: --color-text-primary
// hover bg: --color-surface-raised
<Button variant="outline">Cancel</Button>
```

No ghost buttons, no link-style buttons for main actions.

Sizes: `sm` (32px height), `default` (40px height). No `lg` in app UI. Landing page CTA can use a custom large size.

---

## Inputs

```css
/* Focus ring */
input:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-color: var(--color-accent);
}
```

No floating label animations. Label always above the input.

---

## Cards

```tsx
<div className="bg-white border border-[--color-border] rounded-lg p-4">
  {/* content */}
</div>
```

---

## Toasts / Notifications

- Position: bottom-right
- Max 3 visible at once
- Auto-dismiss: 4 seconds
- Use shadcn `<Sonner />` (sonner library)
- Variants: success (green), error (red), info (indigo)

---

## Modals

- Max width: 480px
- Centered on screen
- Backdrop: `backdrop-blur(4px)` + `bg-black/50`
- Use shadcn `<Dialog />`
- Destructive actions (delete account, cancel subscription) require typed confirmation or explicit confirm button in `variant="destructive"`

---

## Loading States

| Context | Treatment |
|---|---|
| Page / list loading | Skeleton loaders (shadcn Skeleton) |
| Button action | Inline spinner (20px, indigo) inside button, button disabled |
| AI generation | Full-screen overlay with step progress (see PRD section 5) |
| Auto-save | Subtle "Saving…" → "Saved ✓" text in top bar, 12px, --color-text-secondary |

---

## App Layout

```
┌─────────────────────────────────────────────┐
│  Top nav (48px): Logo | Breadcrumb | Account │
├──────────────┬──────────────────────────────┤
│              │                              │
│  Left sidebar│   Main content / canvas      │
│  (240px)     │   (fluid)                    │
│              │                              │
│  - Workspace │                              │
│  - Folders   │                              │
│  - New +     │                              │
│              │                              │
└──────────────┴──────────────────────────────┘
```

- Sidebar collapses to 56px (icon-only) at < 1024px viewport
- Canvas takes 100% of remaining width and height
- No horizontal scroll on canvas — React Flow handles pan/zoom internally

---

## Diagram Node Styles (React Flow)

| Node Type | Shape | Fill | Border |
|---|---|---|---|
| BPMN Task | Rounded rect (6px) | #FFFFFF | 1.5px #09090B |
| BPMN Gateway XOR | Diamond | #FFFFFF | 1.5px #09090B |
| BPMN Start Event | Circle 24px | #16A34A | none |
| BPMN End Event | Circle 24px | #DC2626 | none |
| BPMN Pool | Rect with accent label bar | #FFFFFF | 1px #E4E4E7 |
| BPMN Lane | Horizontal strip, label bar left | #F4F4F5 label / #FFFFFF main | 1px #E4E4E7 |
| User Flow: Screen | Rounded rect (8px) | #EEF2FF | 1.5px #4F46E5 |
| User Flow: Decision | Diamond | #FEF9C3 | 1.5px #D97706 |
| User Flow: Action | Rect (4px) | #FFFFFF | 1.5px #71717A |

Selected state: replace border color with `#4F46E5` (--color-diagram-selected), 2px width.

---

## Icons

- Library: **Lucide React** (comes with shadcn)
- Stroke width: `1.5` always
- Sizes: 16px inline text, 20px in buttons, 24px in empty states and nav

---

## Logo

Wordmark only: `flowmapr` in Inter 600, lowercase, color `--color-accent` (#4F46E5).
No icon/symbol in MVP.

---

## Diagram Generation Rules

- Always use `smoothstep` edge type
- Always use `zIndex: -1` for pool, `zIndex: 0` for lanes, `zIndex: 1` for all other nodes
- Pool and lanes are never interactive (`draggable: false`, `selectable: false`)
- All gateway nodes must have 4 named handles: `left`, `right`, `top`, `bottom`
- Edge colors use CSS tokens, never hardcoded hex
- `fitView` is always called 100ms after nodes are set, with `padding: 0.15`
- Use `parseFlowData()` from `@/lib/diagram` to transform API responses before passing to React Flow

---

## Dark Mode

**Out of scope for MVP.** Do not build dark mode styles.
Use semantic tokens (`--color-bg`, `--color-surface`, etc.) — not hardcoded hex — so dark mode is a token-only change later.
