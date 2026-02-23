# Flowmapr — Tech Stack & Architecture

## Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | Use server components by default; client components only when needed (interactivity, hooks) |
| UI Components | shadcn/ui + Tailwind CSS | Always use shadcn primitives before writing custom components |
| Diagram Canvas | React Flow (reactflow) | MIT license. Pin version. BPMN and User Flow both rendered here |
| Auth | Supabase Auth | Email/password + Google OAuth |
| Database | Supabase (PostgreSQL) | See db-schema.md for full schema |
| File Storage | Supabase Storage | Exported PNG/PDF files |
| AI / LLM | Anthropic Claude API (claude-sonnet-4-5) | Structured JSON output for diagram generation |
| Payments | Polar.sh | Subscription billing + webhooks for plan management |
| Hosting | Vercel | Zero-config Next.js deployment |
| Icons | Lucide React | Already included with shadcn. Stroke 1.5px. |
| Fonts | Inter + JetBrains Mono | Inter via next/font/google, JetBrains Mono for prompt textarea |

---

## Project Structure

```
flowmapr/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (app)/
│   │   ├── workspace/          # diagram list
│   │   ├── diagram/[id]/       # editor view
│   │   └── settings/           # account & subscription
│   ├── share/[id]/             # public read-only view
│   ├── api/
│   │   ├── generate/           # POST: call Claude API, decrement counter
│   │   ├── diagrams/           # CRUD
│   │   └── webhooks/polar/     # Polar.sh subscription events
│   └── page.tsx                # landing page
├── components/
│   ├── ui/                     # shadcn primitives (never edit directly)
│   ├── diagram/                # React Flow canvas + node types
│   ├── editor/                 # toolbar, panel, node inspector
│   ├── workspace/              # diagram list, folder nav
│   └── shared/                 # navbar, sidebar, modals, toasts
├── lib/
│   ├── supabase/               # client, server, middleware helpers
│   ├── claude/                 # prompt builder, response parser
│   ├── polar/                  # webhook handler, plan sync
│   └── utils/                  # cn(), formatDate(), etc.
├── hooks/                      # useGeneration, useDiagram, useAuth
├── types/                      # TypeScript interfaces
└── .cursor/rules/              # this folder
```

---

## Generation Flow (Server-Side)

```
POST /api/generate
1. Authenticate user (Supabase session)
2. Check generation counter in DB (server-side only — never trust client)
3. If counter exhausted → return 402 with upgrade prompt data
4. Call Claude API with prompt + diagram type
5. Parse structured JSON response into React Flow node/edge format
6. Decrement counter atomically (UPDATE ... WHERE remaining > 0 RETURNING)
7. Save diagram snapshot to Supabase
8. Return diagram data to client
```

**Never trust client-side generation count for enforcement. Always validate server-side.**

---

## Polar.sh Webhook Events to Handle

| Event | Action |
|---|---|
| `subscription.created` | Set plan to Basic or Pro, set monthly_limit, reset counter |
| `subscription.updated` | Update plan tier and limit |
| `subscription.canceled` | Schedule revert to free_trial at period end |
| `subscription.revoked` | Immediately revert to free_trial limits |

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-only
ANTHROPIC_API_KEY=                # server-only
POLAR_WEBHOOK_SECRET=             # server-only
NEXT_PUBLIC_APP_URL=
```

---

## Key Constraints

- All Claude API calls happen server-side only. Never expose ANTHROPIC_API_KEY to the client.
- Generation enforcement is always server-side. Client counter display is cosmetic only.
- Auto-save is debounced 2 seconds. Use a debounce hook — do not call Supabase on every keystroke or node drag.
- React Flow canvas state is local (useState/useReducer). Only persist to Supabase on auto-save trigger.
- Use `next/image` for all images. Never use raw `<img>` tags.
- Use semantic CSS tokens (--color-bg, --color-accent etc.) not hardcoded hex values in components.
