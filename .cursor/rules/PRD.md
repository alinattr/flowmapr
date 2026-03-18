# Flowmapr — Product Requirements Document v1.3

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
- AI generation from text prompt (EN only)
- Visual drag-and-drop editor (React Flow)
- Save diagrams to personal workspace
- Share via public read-only link
- Export PNG and PDF
- Auto-save (debounced 2s)
- Generation counter enforcement
- Account & subscription management (upgrade, downgrade, cancel, delete account)
- Landing page (/)
- Version history
- Confluence / Notion / Jira integrations

### Out of scope (Post-MVP)
- Team workspace
- Real-time multiplayer editing
- Mobile app
- API access
- Priority support / SLA

---

## 4. Monetization

| Feature | Free Trial | Basic ($12/mo) | Pro ($30/mo) |
|---|---|---|---|
| AI generations | 2 total (lifetime) | 100 / month | 500 / month |
| Diagrams stored | Up to 5 | Up to 50 | Unlimited |
| Export PNG / PDF | ✓ | ✓ | ✓ |
| Public sharing | ✓ | ✓ | ✓ |
| Version history | ✗ | ✗ | Post-MVP |
| Upload doc as context | ✗ | ✓ | ✓ |

- Payments via Polar.sh
- Re-prompting an existing diagram costs 1 generation credit
- Generation counter resets on billing anniversary date

---

## 5. Generation Loading UX

Generation can take up to 60 seconds. Always show a full loading screen with step-by-step progress:
1. "Analysing prompt…"
2. "Building structure…"
3. "Rendering diagram…"

Never show a blank screen or generic spinner during AI generation.

---

## 6. Auto-Save

Diagrams auto-save on every canvas change, debounced at 2 seconds after the last change. No manual Save button. Show a subtle "Saved" indicator in the top bar after each save.

---

## 7. Account & Subscription Settings

All accessible from user menu in top nav:
- View current plan + generation counter (used / remaining)
- Cancel subscription (access until end of paid period, then reverts to Free Trial limits)
- View billing history + download invoices (Polar.sh customer portal)
- Delete account (confirmation modal required, permanently deletes all data)

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

## 9. Key Product Decisions (Closed)

| Decision | Resolution |
|---|---|
| UI language | English only (MVP) |
| Loading experience | Step-by-step progress screen, up to 60s |
| Save mechanism | Auto-save, debounced 2s, no manual button |
| Basic plan limit | 100 generations / month |
| Re-prompt credit | Yes, consumes 1 credit |
| Version history | Post-MVP |
| Dark mode | Post-MVP (use semantic CSS tokens now) |
