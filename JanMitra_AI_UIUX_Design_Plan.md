# JanMitra AI — UI/UX Design Plan
**Compatible with:** React + Vite + Tailwind (per PRD tech stack)
**Design direction:** "The District War Room" — not a SaaS dashboard, not a government portal. A command room where evidence, geography, and money meet.

---

## 0. Why not the default look

Rejected on purpose:
- Cream background + serif + terracotta accent (the generic "AI polish" look)
- Near-black + single neon accent (generic "dark mode SaaS")
- Generic KPI-card grid dashboard with rounded shadow cards

**Grounding choice:** JanMitra's real subject is *governance paperwork made intelligent* — files, dockets, stamps, ledgers, ward maps, ink. The UI should feel like a modernized version of a district magistrate's war room: physical case-file logic, rendered digitally. Every visual device should double as information (a stamp = status, a thread = evidence link, a docket = a ranked project) — nothing is decoration.

---

## 1. Design Tokens

### Color (6 named hex values)
| Token | Hex | Use |
|---|---|---|
| `ink-navy` | `#14213D` | Primary background — dashboard shell, war-room base |
| `aged-parchment` | `#EDE6D2` | Panel/card surfaces — docket paper tone |
| `marigold` | `#E8A33D` | Primary accent — CTAs, top-priority highlight, active states |
| `seal-red` | `#A6323A` | Urgency stamp ink — used ONLY for critical-severity markers, never decorative |
| `evidence-teal` | `#2F6E68` | Evidence Graph threads, verified/public-data badges, map lines |
| `slate-ink` | `#4A5064` | Secondary text, muted labels, dividers |

Rule: `seal-red` and `marigold` never appear in the same component doing the same job — red is reserved exclusively for urgency stamps so it retains meaning.

### Typography (3 roles)
| Role | Face | Why |
|---|---|---|
| Display | **Fraunces** (soft slab serif, high optical weight) | Gazette/notice-board gravity without falling into templated high-contrast serif look |
| Body/UI | **IBM Plex Sans** | Governmental-technical legibility, pairs with Fraunces without competing |
| Utility/Data | **IBM Plex Mono** | Case IDs, coordinates, scores, ward codes — signals "this is a real record," not prose |

Type scale: Display headlines set at 40/32/24px with tight tracking; body at 16/14px; mono data at 13px with slightly wider tracking for scannability.

### Radius & Surface
- Sharp-ish corners (4px radius) on dockets/panels — evokes paper/card stock, not app-store rounded-corner softness.
- Subtle paper-grain texture (very low-opacity noise) on `aged-parchment` surfaces only — never on `ink-navy`.

---

## 2. Signature Element: **The Threaded Ledger**

This is the one bold, memorable device — and it's built directly from the product's real mechanic (the Evidence Graph), not decoration bolted on top.

- The ranked action plan is rendered as a vertical stack of **docket cards** (torn-edge ledger stubs), each stamped with a large rank number in Fraunces: `№ 01`, `№ 02`...
- Numbering here is earned, not generic — this genuinely is an ordered ranking where position carries the decision.
- When a docket is hovered or selected, a thin **teal evidence thread** animates (SVG stroke-draw) from the docket out to its cluster's pin on the map — visually proving "this rank is backed by this evidence," not just a number.
- Urgency is shown as a rotated **ink-stamp badge** ("CRITICAL" / "MODERATE") in `seal-red` or `slate-ink` — a nod to physical file-stamping culture, and a stronger urgency signal than a colored dot.

This single motif does triple duty: it's the visual signature, it's how ranking works, and it's how "explainability" is made tangible instead of just written in a text card.

---

## 3. Core Screens

### 3.1 Citizen Ingestion Widget (mobile-first, low-connectivity)
```
┌─────────────────────────────┐
│  🟠 JanMitra   [Hindi ▾]     │   <- language switcher always visible
├─────────────────────────────┤
│                              │
│   "आपकी समस्या क्या है?"       │   <- large, one question at a time
│                              │
│   [🎤 Hold to speak]         │   <- voice-first, huge tap target
│   [📷 Add photo]             │
│   [⌨ Type instead]           │
│                              │
│   ● queued — will send when  │   <- offline queue indicator, not spinner
│     you're back online       │
└─────────────────────────────┘
```
- One question, one action per screen — no forms. Built for a citizen on a 2G connection with a shared phone.
- Voice button is the largest element on screen — voice-first is a stated differentiator, so it must be the visual default, not a small icon.
- Offline state is explicit and honest ("will send when you're back online"), never a fake spinner — matches the interface-voice principle: don't apologize, state what's happening.

### 3.2 MP Dashboard — Home (the hero screen)
The hero is NOT a KPI card grid. It's the Threaded Ledger + map, live, on load.
```
┌───────────────┬─────────────────────────────┐
│ № 01  CRITICAL│                              │
│ Water access  │      [ WARD MAP ]            │
│ Ward 7 · 1,240│   ┈┈┈┈┈┈┈┈┈┈┈╮               │
│ people        │              ● pin (Ward 7)  │
│ ─────────────>┼┈┈┈┈┈┈┈┈┈┈┈┈┈┈╯               │
│ № 02          │                              │
│ Road damage   │        ● pin (Ward 3)        │
│ Ward 3        │                              │
│ ─────────────>┤                              │
│ № 03          │                              │
│ School access │        ● pin (Ward 9)        │
└───────────────┴─────────────────────────────┘
   ↑ docket stack (scrollable)     ↑ live map, teal threads on select
```
- Left: docket stack, always visible, this is the primary decision surface.
- Right: map with facility icons (school/hospital/road), pins colored by rank position not generic markers.
- No sidebar navigation clutter — MP-facing tool should feel like one workspace, not an admin panel with 12 menu items.

### 3.3 Explanation Card (opens on docket click)
Framed as a **case file**, not a chatbot bubble:
```
┌──────────────────────────────┐
│  CASE FILE — Ward 7 Water Gap │
│  ────────────────────────────│
│  Why this is № 01:            │
│  • 1,240 residents affected   │
│  • Nearest facility: 2.3km    │
│    (2× district average)      │
│  • 42 complaints, 6-week      │
│    recurrence pattern         │
│  • Rainfall +30% this month   │
│    (public data)              │
│  ────────────────────────────│
│  Impact per ₹: ★★★★☆          │
└──────────────────────────────┘
```
- Bullet evidence, sourced and numbered — never a paragraph of prose pretending to be reasoning. This is what makes "explainable AI" feel real to a judge, not asserted.

### 3.4 Budget Simulation Panel (the wow feature)
```
Budget: ₹20L ──●───────────── ₹1Cr

[dockets reshuffle live as slider moves]
"At ₹20L: fund №01 and №03 only.
 Covers 2,100 of 4,800 affected residents."
```
- Slider is the single interactive hero of this screen — everything else recedes.
- On release, dockets physically reshuffle with a short spring animation (150–200ms), and the newly top-ranked docket gets a quick "ink-press" stamp animation — the one orchestrated motion moment for this screen. No other animation competes with it.

---

## 4. Motion Principles

- **One orchestrated moment per screen**, not scattered micro-animations:
  - Dashboard load → evidence threads draw themselves once, then settle.
  - Budget slider → docket reshuffle + stamp press.
  - Voice input → waveform pulses while `Hold to speak` is active, nothing else moves.
- Respect `prefers-reduced-motion`: threads and stamps appear instantly instead of animating.
- No parallax, no gradient blobs, no hover-glow — those read as templated AI polish and add nothing to this subject.

---

## 5. Interface Voice (copy rules)

- Buttons name the action, not the system: `"Send my complaint"` not `"Submit"`; `"See who's affected first"` not `"View analysis"`.
- Empty states are invitations, not apologies: `"No complaints yet in Ward 7 — the first one submitted here will start the case file."`
- Errors are specific: `"Voice note didn't upload — check your connection and try again"`, never `"Something went wrong."`
- Explanation cards use the vocabulary of evidence (`case file`, `evidence`, `impact per ₹`), never AI vocabulary (`confidence score`, `model output`).

---

## 6. Accessibility & Build Notes (for React + Tailwind)

- Color contrast: `ink-navy`/`aged-parchment` pairing checked at AA minimum for body text; `seal-red` on parchment used only for short stamp labels (large text exemption), never body copy.
- All docket cards and map pins reachable and operable by keyboard; visible focus ring in `marigold`.
- Tailwind config: extend theme with the 6 tokens above as named colors (`ink-navy`, `aged-parchment`, `marigold`, `seal-red`, `evidence-teal`, `slate-ink`) so no ad-hoc hex values appear in components.
- Evidence threads: implement as absolutely-positioned SVG overlay with `stroke-dasharray`/`stroke-dashoffset` animation — keep it in one shared `<EvidenceThread />` component so the signature motif stays consistent everywhere it's used.
- Citizen widget must render usably on a 5-year-old Android at 3G — no heavy map or animation libraries on that surface; map/threads are dashboard-only.

---

## 7. Why this wins on stage

- Judges see a **visual language that is inseparable from the product's actual mechanic** (threads = evidence graph, stamps = urgency, dockets = ranking) — not a skin applied after the fact.
- It signals "real workflow, real reasoning" purely through visual design, before a single word of the pitch is spoken.
- It avoids every visual cliché a judge will have seen in the other 40 teams' Gemini-wrapper dashboards that day.
