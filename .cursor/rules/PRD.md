# Flowmapr — Product Requirements Document v1.4

## 1. Product Overview

Flowmapr is a web-based SaaS that generates professional BPMN and User Flow diagrams from plain-text descriptions. Built for Business Analysts, Systems Analysts, and Product Managers — not developers.

**Core value:** Describe a process in plain language → get a clean, editable diagram in seconds. No code. No Visio. No moving boxes for 40 minutes.

---

## 2. Target Users

| Persona | Role | Key Pain |
|---|---|---|
| Anna | Systems / Business Analyst | Spends 2–3 hrs/week in draw.io building BPMN from scratch |
| Pavel | Product Manager | Uses Miro for flows but it's a whiteboard, not a proper flow tool |
| Maria | Tech Lead | No single source of truth for business diagrams across the team |

---

## 3. MVP Scope

### In scope
- BPMN 2.0 (core subset: tasks, gateways, events, pools, lanes)
- User Flow / Journey Map
- ERD / Entity-Relationship Diagram (entities, relationships, PlantUML code export via Copy button in top bar)
- UML Class Diagram
- UML Sequence Diagram
- C4 Model (Level 1 System Context + Level 2 Container)
- API Lens — structured API documentation + auto-generated C4 architecture diagrams
- AI generation from text prompt (EN only)
- Update Diagram with AI — incremental AI editing of existing diagrams (Basic+)
- Visual drag-and-drop editor (React Flow) with snapToGrid (15px grid)
- Save diagrams to personal workspace
- Share via public read-only link (all diagram types including API Lens and UML Sequence)
- Export PNG and PDF (theme-aware: respects dark/light mode background)
- Auto-save (debounced 2s)
- Generation counter enforcement
- Rate limiting: 10 req/min for /api/generate, 20 req/min for lens endpoints (Upstash Redis)
- Account & subscription management (upgrade, downgrade, cancel, delete account)
- Landing page (/)
- Blog section at /blog with SEO articles
- Version history (with BPMN restore fixed for pool/lane layout)
- Confluence / Notion / Jira integrations (GitHub push from export dialog)
- Character counters on all AI input fields (max 2000 for prompts, 8000 for API Lens, 6000 for Code Lens)
- Password strength indicator on signup
- Contact support button in sidebar (opens Crisp chat)
- Billing history with real invoices from Polar + next billing date in Settings

### Out of scope (Post-MVP)
- Team workspace
- Real-time multiplayer editing
- Mobile app
- API access
- Priority support / SLA

---

## 4. Monetization

| Feature | Free | Basic ($15/mo) | Pro ($45/mo) |
|---|---|---|---|
| AI generations | 3 total (lifetime) | 100 / month | 500 / month |
| Diagrams stored | Up to 5 | Unlimited | Unlimited |
| Export PNG / PDF | ✓ | ✓ | ✓ |
| Public sharing | ✓ | ✓ | ✓ |
| Version history | ✓ | ✓ | ✓ |
| Update Diagram with AI | ✗ | ✓ | ✓ |
| API Lens | ✗ | ✓ | ✓ |
| Code Lens | ✗ | ✓ | ✓ |

- Payments via Polar.sh (production)
- Re-prompting an existing diagram costs 1 generation credit
- Generation counter resets on billing anniversary date
- Billing history and invoices available in Settings

---

## 5. Generation Loading UX

Generation can take up to 60 seconds. Always show a full loading screen with step-by-step progress:
1. "Analysing prompt…"
2. "Building structure…"
3. "Rendering diagram…"

Never show a blank screen or generic spinner during AI generation.
The same full-screen loader is shown for both Regenerate and Update Diagram operations.

---

## 6. Auto-Save

Diagrams auto-save on every canvas change, debounced at 2 seconds after the last change. No manual Save button. Show a subtle "Saved" indicator in the top bar after each save.

---

## 7. Account & Subscription Settings

All accessible from user menu in top nav:
- View current plan + generation counter (used / remaining)
- Cancel subscription (access until end of paid period, then reverts to Free limits)
- View billing history + download invoices (real invoices from Polar)
- Next billing date displayed in Settings
- Delete account (confirmation modal required, permanently deletes all data)
- Update profile name (synced to auth session and reflected app-wide immediately)

---

## 8. Landing Page Sections

1. **Hero** — Headline, subheadline, CTA "Try free — no credit card required", demo screenshot
2. **Problem** — 3 pain points (draw.io slow, Eraser is for devs, ChatGPT can't save)
3. **How it works** — 3 steps with UI screenshots
4. **Demo** — Looping screen recording of a real generation
5. **Pricing** — 3-column table, Basic highlighted as "Most popular"
6. **FAQ** — 5–7 questions
7. **Footer** — Logo, Privacy Policy, Terms of Service, Contact

**Hero headline:** "Turn requirements into diagrams. Instantly."
**Primary CTA everywhere:** "Try free — no credit card required" → /signup

---

## 9. Technical Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React, TypeScript, Tailwind CSS |
| Diagram canvas | React Flow (@xyflow/react) |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| AI | OpenAI GPT-4o |
| Payments | Polar.sh (production) |
| Rate limiting | Upstash Redis |
| Error monitoring | Sentry |
| Support | Crisp |
| Analytics | Vercel Analytics + Speed Insights |
| Email | Resend (SMTP) + ImprovMX (forwarding) |
| SEO | Google Search Console, sitemap.xml, JSON-LD structured data |
| Hosting | Vercel |

---

## 10. Key Product Decisions (Closed)

| Decision | Resolution |
|---|---|
| UI language | English only (MVP) |
| Loading experience | Step-by-step progress screen, up to 60s |
| Save mechanism | Auto-save, debounced 2s, no manual button |
| Basic plan limit | 100 generations / month |
| Pro plan limit | 500 generations / month |
| Re-prompt credit | Yes, consumes 1 credit |
| Update Diagram credit | Yes, consumes 1 credit (Basic+ only) |
| Dark mode | Shipped — full dark/light theme with CSS tokens |
| Grid snapping | 15px snap grid on all React Flow canvases |
| PNG/PDF export background | Theme-aware (dark: #0D0D10, light: #ffffff) |
| Version history restore | Fixed for BPMN — runs full fixBpmnLayout + parseFlowData pipeline |
| Pricing | Basic $15/mo, Pro $45/mo |
