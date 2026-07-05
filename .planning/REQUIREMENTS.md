# JanMitra AI — Requirements

**Milestone 1:** Core MVP (hackathon demo)
**Status:** Active

---

## Functional Requirements

### FR-01: Citizen Widget
- **Must:** Text input field accepting plain text complaints
- **Must:** Submit complaint to Firestore with Gemini extraction (issue_type, location ward, urgency, affected_group)
- **Must:** WhatsApp-styled UI (dark green header, message bubbles, send button)
- **Should:** Web Speech API voice input (hold-to-speak, large tap target)
- **Should not:** Image input (out of scope)
- **Should not:** Require login

### FR-02: MP Dashboard — Threaded Ledger
- **Must:** Render ranked docket cards from Firestore cluster data
- **Must:** Docket cards show: `№ XX` rank (Fraunces font), issue type, ward, affected population, urgency stamp
- **Must:** Google Maps panel with ward pins, colored by rank position
- **Must:** EvidenceThread SVG animation: on docket hover/select, draw teal line from docket to map pin
- **Must:** Dashboard loads and draws threads once on initial render

### FR-03: Explanation Card
- **Must:** Opens as overlay/modal when docket card is clicked
- **Must:** Calls Gemini API once, passing pre-computed evidence bullets as input
- **Must:** Gemini prompt includes verbatim: *"Narrate these facts in plain language. Do not calculate, estimate, or add any number not provided above."*
- **Must:** Displays: why this rank, affected population, facility distance, complaint count, recurrence pattern, public evidence
- **Must not:** Display any number not in the seed data or computed by the formula

### FR-04: Budget Simulation Slider
- **Must:** Slider control on MP Dashboard (range: ₹5L to ₹1Cr)
- **Must:** On slider release, client-side greedy algorithm selects clusters by ImpactPerRupee descending until budget exhausted
- **Must:** Docket list re-renders with spring animation (150–200ms) showing new ranking
- **Must:** Newly top-ranked docket gets ink-press stamp animation on reshuffle
- **Must not:** Make backend API call on slider drag (client-side only)

---

## Non-Functional Requirements

### NFR-01: Performance
- Budget simulation re-render must feel instant (<100ms compute for ≤20 clusters)
- No map tiles or heavy libraries loaded on Citizen Widget

### NFR-02: Design Compliance
- All 6 color tokens defined in Tailwind config (`ink-navy`, `aged-parchment`, `marigold`, `seal-red`, `evidence-teal`, `slate-ink`)
- No raw hex values in component files
- Google Fonts loaded: Fraunces (display), IBM Plex Sans (body), IBM Plex Mono (data)
- Sharp corners (4px border-radius) on docket/panel surfaces
- `prefers-reduced-motion` respected: animations appear instantly, no motion

### NFR-03: Data Integrity
- Seed data: exactly 3 wards, 4 issue types, 15–20 complaints, 8–10 clusters
- All cluster scores computed by the exact formula with exact default weights
- Ward 7 water issue should rank convincingly #1 in default state

### NFR-04: Anti-Hallucination
- All `// MOCK` labels on any API fallback or simulated call
- Gemini never called without pre-computed evidence in the prompt
- No placeholder statistics that look real

### NFR-05: Configuration
- All API keys in `.env` (VITE_GEMINI_API_KEY, VITE_MAPS_API_KEY, FIREBASE_PROJECT_ID, etc.)
- Priority weights exposed as named constants in a dedicated `weights.js` file (not inline magic numbers)

---

## Acceptance Criteria (Demo Script Verification)

- [ ] **AC-01:** Submit a text complaint via Citizen Widget → complaint appears in Firestore → dashboard updates
- [ ] **AC-02:** MP Dashboard shows ranked docket list in correct order (Ward 7 water #1 with default weights/budget)
- [ ] **AC-03:** Hover/click a docket → teal evidence thread draws to map pin
- [ ] **AC-04:** Click top docket → Explanation Card opens with Gemini-generated narrative (real API call)
- [ ] **AC-05:** Drag budget slider from ₹1Cr to ₹20L → ranking reshuffles live, some dockets drop off, animation plays
- [ ] **AC-06:** All design tokens visible: navy background, parchment cards, marigold accent, red urgency stamps, teal threads
- [ ] **AC-07:** No broken API calls, no fake success paths without `// MOCK` label

---

## Out of Scope

| Item | Reason |
|---|---|
| Image complaint input | No demo payoff |
| Auth / login screens | Not in demo path |
| Real WhatsApp Business API | Web widget is sufficient for demo |
| Cloud Speech-to-Text | Web Speech API sufficient |
| BigQuery live joins | Pre-joined into Firestore at seed time |
| Vertex AI embeddings | Hand-crafted synthetic clusters |
| Multi-ward data beyond 3 wards | Depth over breadth |
| Admin panel, settings pages | Not in 4-screen scope |
