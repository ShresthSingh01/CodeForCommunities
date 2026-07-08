# JanMitra AI — PROJECT.md

## Current Milestone: v2.1 — Prototype Readiness Fixes

**Goal:** Fix the critical demo-killers (Hindi voice, simulateCSTE arg, embedding save, offline queue, map provider, scores) discovered during the brutal prototype readiness audit, ensuring a flawless live presentation.

**Target features:**
- P0: Fix Hindi voice `rec.lang = 'hi-IN'` in `CitizenWidget.jsx`
- P0: Fix `simulateCSTE(fundedClusters, clusters)` missing argument in `BudgetSimulator.jsx`
- P0: Fix CitizenWidget to save the `embedding` field to Firestore
- P0: Remove "Offline Queuing" from pitch deck (fastest fix)
- P1: Migrate to Google Maps (originally Phase 9 of v2.0)
- P1: Update pitch deck numbers to match real engine output
- P2: Fix empty constituency switcher (hide it or seed data)
- P2: Replace placeholder sidebar pages with minimal content

---

## What This Is

**JanMitra AI** is a Constituency Digital Twin + Priority Optimizer built for the "People's Priorities" hackathon track (Google Technologies). It helps Members of Parliament (MPs) convert raw citizen complaints and public data into explainable, ranked development priorities — with live budget simulation.

**One-line pitch:** JanMitra AI helps MPs convert citizen complaints and public data into explainable, multilingual development priorities.

**Critical framing:** This is NOT a complaint tracker. Every screen, label, and feature reinforces that this is a decision-support system for allocating limited public budget.

---

## Core Value

The priority engine + budget simulation combo. A judge remembers the reasoning, not the CSS.

**Core pipeline (conceptual):**
Citizen submits issue → AI extracts structured facts → similar complaints cluster into one real problem → public data enriches the cluster → priority engine scores it → Gemini explains the ranking in plain language → MP dashboard shows ranked action plan + live budget simulation.

---

## Users & Personas

| User | Need |
|---|---|
| Citizen | Submit an issue in their own language, via voice/text, with zero friction (WhatsApp-like flow) |
| MP / Office Staff | See a ranked, explainable action plan — not a raw complaint feed |
| Analyst | Simulate budget scenarios and defend prioritization decisions publicly |

---

## Tech Stack (LOCKED — do not substitute)

| Layer | Tech |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Local Node/Express server (faster for hackathon demo) |
| Database | Firestore |
| AI | Gemini API (text-only calls for MVP) |
| Voice | Browser Web Speech API (no Cloud Speech-to-Text for MVP) |
| Maps | Google Maps JavaScript API |
| Hosting | Firebase Hosting |

---

## MVP Scope: 4 Screens Only

1. **Citizen Widget** — WhatsApp-styled UI, text input required, voice input via Web Speech API if time permits. Submits one complaint to Firestore.
2. **MP Dashboard** — the "Threaded Ledger": ranked docket list (left) + Google Map with ward pins (right), rendered from Firestore data.
3. **Explanation Card** — opens when a docket is clicked. Calls Gemini once, passing pre-computed scores/evidence as input. Gemini narrates numbers in plain language — never calculates or invents a number.
4. **Budget Simulation Slider** — overlays the dashboard. Re-runs the priority scoring function **client-side** on slider change and re-renders the ranked list live. No backend round-trip on drag.

---

## Data Model

```
Complaint {
  id: string
  raw_text: string
  language: string
  extracted: {
    issue_type: string  // "water" | "road" | "health" | "education"
    location: { lat: number, lng: number, ward: string }
    urgency: "low" | "moderate" | "critical"
    affected_group: string
  }
  cluster_id: string
  timestamp: string
}

Cluster {
  id: string
  issue_type: string
  ward: string
  location: { lat: number, lng: number }
  complaint_count: number
  recurrence_score: number      // 0-1
  affected_population: number
  nearest_facility_km: number
  public_evidence: string[]     // e.g. "Rainfall +30% this month"
  estimated_cost_inr: number
  priority_score: number        // computed
  rank: number                  // computed
}
```

Seed data: 15–20 Complaint records → ~8–10 Cluster records across exactly 3 wards and 4 issue types. Synthetic data only, realistic Indian constituency scale.

---

## Priority Scoring Formula (EXACT — do not modify)

```
PriorityScore = w1*UrgencySeverity          // critical=1.0, moderate=0.6, low=0.3
              + w2*AffectedPopulationNorm   // normalized 0-1 across current clusters
              + w3*RecurrenceScore          // already 0-1
              + w4*ServiceGapNorm           // nearest_facility_km normalized 0-1
              + w5*VulnerabilityIndex       // affected_group weighting lookup table
              - w6*EstimatedCostNorm        // normalized 0-1

ImpactPerRupee = PriorityScore / estimated_cost_inr
```

Default weights (exposed as adjustable constants): `w1=0.25, w2=0.2, w3=0.15, w4=0.2, w5=0.1, w6=0.3`

Budget simulation: greedy selection by `ImpactPerRupee` descending.

---

## UI Design System (EXACT — from finalized design plan)

### Colors (Tailwind theme tokens — never raw hex in components)
| Token | Hex | Use |
|---|---|---|
| `ink-navy` | `#14213D` | Primary background |
| `aged-parchment` | `#EDE6D2` | Card/panel surfaces |
| `marigold` | `#E8A33D` | Primary accent, CTAs |
| `seal-red` | `#A6323A` | Urgency stamps ONLY |
| `evidence-teal` | `#2F6E68` | Evidence threads, verified badges |
| `slate-ink` | `#4A5064` | Secondary text |

### Fonts (Google Fonts)
- Display: **Fraunces** (rank numbers, case file headers)
- Body/UI: **IBM Plex Sans**
- Data/Mono: **IBM Plex Mono** (IDs, scores, coordinates)

### Signature Component
`<EvidenceThread />` — SVG with stroke-dasharray/stroke-dashoffset draw animation in evidence-teal, connecting docket card to map pin on hover/select. Build once, reuse everywhere.

### Docket Cards
- Rank number: large Fraunces `№ 01` style
- Urgency: rotated ink-stamp badge (seal-red for critical, slate-ink for others)
- Sharp corners (4px radius)

### Motion (one orchestrated animation per screen)
- Dashboard load → evidence threads draw once, then settle
- Budget slider release → docket reshuffle + stamp-press animation (150–200ms spring)
- Respect `prefers-reduced-motion`

---

## Build Phases (7 Phases, Coarse Granularity)

Aligned to Master Build Prompt phases:
- **Phase 0:** Project setup + credentials check (env placeholders, Vite+React scaffold, Tailwind config with design tokens, Firebase init)
- **Phase 1:** Firestore seed script (15–20 complaints, 8–10 clusters, 3 wards)
- **Phase 2:** Priority scoring function (pure JS, unit-testable, no UI)
- **Phase 3:** MP Dashboard (docket stack + Google Map, static render from Firestore)
- **Phase 4:** Budget Simulation Slider (client-side recompute, live re-render)
- **Phase 5:** Explanation Card (Gemini integration, grounded prompting)
- **Phase 6:** Citizen Widget + Visual Polish (text input, Web Speech API, EvidenceThread animation, stamps, fonts)

---

## Anti-Hallucination Rules (Non-Negotiable)

1. Never invent a number — all values from seed data or computed formula
2. Gemini calls are grounded — every prompt includes pre-computed evidence bullets with explicit instruction: *"Narrate these facts in plain language. Do not calculate, estimate, or add any number not provided above."*
3. Never fabricate API responses — label fallbacks as `// MOCK` explicitly
4. Do not add features/screens outside the 4-screen scope
5. Do not change tech stack, data schema, or scoring formula without flagging
6. Cite files created/modified after each phase

---

## Explicitly Out of Scope

- Image complaint input
- Real WhatsApp Business API integration
- Multi-ward data beyond 3 seeded wards
- BigQuery live joins or Looker Studio embeds
- User authentication or role management
- Login/auth screens, settings, onboarding, admin panel
- Cloud Speech-to-Text (MVP uses Web Speech API only)
- Vertex AI embeddings (synthetic seed data used instead)

---

## Key Decisions

| Decision | Rationale | Outcome |
|---|---|---|
| Local Node/Express server over Firebase Cloud Functions | Faster to run locally for hackathon demo | — Active |
| Coarse granularity (7 phases) | Matches Master Build Prompt phases, faster execution | — Active |
| .env placeholders for all API keys | Keys not available at project init time | — Active |
| Greedy knapsack (not full DP) for budget simulation | MVP-sufficient, fast client-side execution | — Active |
| Synthetic seed data (not live scraping) | Full control over demo narrative, guaranteed coherent clusters | — Active |
| Browser Web Speech API (not Cloud STT) | Zero setup overhead, sufficient for demo | — Active |

---

## Requirements

### Validated (v1.0 MVP — Shipped)
- [x] 4-screen MVP (Citizen Widget, MP Dashboard, Explanation Card, Budget Simulation)
- [x] Firestore seed: 15+ complaints, 8+ clusters, 3 wards, 4 issue types
- [x] Priority scoring formula with exact weights and greedy budget selection
- [x] Gemini grounded explanation cards with anti-hallucination constraints
- [x] Design tokens, EvidenceThread SVG, docket animations
- [x] MOCK labels on all fallback paths

### Validated (v2.0 MVP — Real Intelligence Layer)
- [x] Vertex AI text-embedding-004: embed complaints on submission
- [x] Cosine-similarity matrix + dynamic cluster formation with configurable threshold
- [x] Cluster IDs auto-assigned from semantic grouping (not hardcoded)
- [x] Embedding vectors stored in Firestore per complaint document
- [x] Batch re-clustering script for existing seed data
- [x] CSTE baseline computed from live Firestore aggregates (not hardcoded)
- [x] CSTE before/after state uses real ward population and recurrence data
- [x] CSTE queryable API: ward-state query endpoint
- [x] Live CSTE metrics panel on dashboard
- [x] CSTE state persisted to Firestore for trend tracking

### Active (v2.1 — Prototype Readiness Fixes)
- [ ] P0: Fix Hindi voice `rec.lang = 'hi-IN'`
- [ ] P0: Fix `simulateCSTE(fundedClusters, clusters)` missing arg
- [ ] P0: Fix CitizenWidget to save `embedding` field to Firestore
- [ ] P0: Remove "Offline Queuing" from pitch deck OR implement it
- [ ] P1: Migrate to Google Maps (`@googlemaps/react-wrapper`)
- [ ] P1: Update pitch deck numbers to match real engine output
- [ ] P2: Fix empty constituency switcher (hide or seed data)
- [ ] P2: Replace placeholder sidebar pages with minimal content

### Out of Scope (v2.0)
- Image complaint input — no demo payoff
- Full DP budget optimization (greedy sufficient for demo scale)
- Auth/login flows — not in demo path
- BigQuery live joins — Firestore sufficient for hackathon scale
- Looker Studio embeds — out of scope

---

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements validated? → Move to Validated
2. New requirements emerged? → Add to Active
3. Decisions to log? → Add to Key Decisions

---
*Last updated: 2026-07-08 — Milestone v2.1 started (Prototype Readiness Fixes)*
