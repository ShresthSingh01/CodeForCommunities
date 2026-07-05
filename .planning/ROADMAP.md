# JanMitra AI — ROADMAP.md

**Milestone 1:** Core MVP (Hackathon Demo)
**Granularity:** Coarse (7 phases)
**Mode:** YOLO
**Parallelization:** Yes (independent plans within a phase run in parallel)

---

## Phase 0 — Project Scaffold & Config

**Goal:** Working React+Vite app with Tailwind design tokens, Firebase initialized, all env placeholders in place.

**Status:** 🔲 Not started

**Plans:**
- **0.1:** Initialize Vite+React app (`npm create vite@latest janmitra-app -- --template react`), install Tailwind CSS, configure `tailwind.config.js` with all 6 design tokens and Google Fonts
- **0.2:** Set up Firebase project config (`.env` placeholders for all keys), install Firebase SDK, initialize Firestore connection, create `src/firebase.js`
- **0.3:** Create Express backend scaffold (`server/index.js`) with `/api/extract-complaint` endpoint stub returning `// MOCK` response; install concurrently for dev

**Verification:**
- [ ] `npm run dev` serves the app with ink-navy background visible
- [ ] Tailwind tokens work: a `bg-ink-navy text-aged-parchment` div renders correctly
- [ ] Firebase imports don't crash (even with placeholder keys)
- [ ] Google Fonts (Fraunces, IBM Plex Sans, IBM Plex Mono) load in browser

**Files created:**
- `janmitra-app/` (entire Vite scaffold)
- `janmitra-app/tailwind.config.js`
- `janmitra-app/src/firebase.js`
- `janmitra-app/.env.example`
- `server/index.js`

---

## Phase 1 — Firestore Seed Data

**Goal:** 15–20 synthetic complaints and 8–10 clusters seeded into Firestore, with Ward 7 water issue clearly #1 in default scoring.

**Status:** 🔲 Not started

**Depends on:** Phase 0

**Plans:**
- **1.1:** Write `scripts/seedData.js` — define `COMPLAINTS` array (15–20 records) and `CLUSTERS` array (8–10 records) across 3 wards (Ward 3, Ward 7, Ward 9) and 4 issue types. Data must be realistic Indian constituency scale (populations 800–3000, costs ₹8L–₹75L, facilities 0.8km–4.5km).
- **1.2:** Write Firestore batch-write logic to push all seed data, add `clearAndReseed()` utility for dev resets, add `npm run seed` script to `package.json`
- **1.3:** Write `src/scoring/priorityEngine.js` — pure scoring function with exact formula and exact default weights (`w1=0.25, w2=0.2, w3=0.15, w4=0.2, w5=0.1, w6=0.3`), normalization helpers, `computeRankings(clusters)` function, `greedyBudgetSelect(clusters, budgetInr)` function

**Verification:**
- [ ] `npm run seed` completes without errors
- [ ] Firestore console shows 15–20 complaint docs and 8–10 cluster docs
- [ ] `priorityEngine.js` unit test: Ward 7 water cluster ranks #1 with default weights
- [ ] `greedyBudgetSelect` at ₹20L returns expected subset

**Files created:**
- `scripts/seedData.js`
- `scripts/seed.js` (runner)
- `src/scoring/priorityEngine.js`
- `src/scoring/weights.js`
- `src/scoring/__tests__/priorityEngine.test.js`

---

## Phase 2 — MP Dashboard (Static Render)

**Goal:** Full dashboard shell: docket stack + Google Maps panel, rendering real Firestore data, applying all design tokens, no simulation yet.

**Status:** 🔲 Not started

**Depends on:** Phase 1

**Plans:**
- **2.1:** Build `src/components/DocketCard.jsx` — Fraunces `№ XX` rank, issue type, ward, affected population, urgency ink-stamp badge (seal-red critical, slate-ink others), sharp corners, aged-parchment surface
- **2.2:** Build `src/components/MapPanel.jsx` — Google Maps JS API integration, ward pins colored by rank (marigold #1, evidence-teal #2+), clickable pins sync with docket selection
- **2.3:** Build `src/pages/Dashboard.jsx` — two-column layout (docket stack left, map right), load clusters from Firestore, compute rankings via `priorityEngine.js`, pass data to DocketCard and MapPanel
- **2.4:** Build `src/components/EvidenceThread.jsx` — absolutely-positioned SVG overlay, `stroke-dasharray`/`stroke-dashoffset` CSS animation, draws teal line from selected docket to its map pin on hover/select. Implement `prefers-reduced-motion` fallback.

**Verification:**
- [ ] Dashboard loads and shows 8–10 ranked dockets from Firestore
- [ ] Docket cards show correct design: Fraunces rank number, ink-stamp urgency, parchment background
- [ ] Ward pins visible on map at correct locations
- [ ] Hover/click docket → EvidenceThread draws to corresponding pin
- [ ] Ward 7 water shows as № 01

**Files created/modified:**
- `src/components/DocketCard.jsx`
- `src/components/MapPanel.jsx`
- `src/components/EvidenceThread.jsx`
- `src/pages/Dashboard.jsx`
- `src/App.jsx` (route Dashboard)

---

## Phase 3 — Budget Simulation Slider

**Goal:** Working budget slider that live-reshuffles the docket list client-side with spring animation.

**Status:** 🔲 Not started

**Depends on:** Phase 2

**Plans:**
- **3.1:** Build `src/components/BudgetSlider.jsx` — range input (₹5L to ₹1Cr, formatted as ₹XX L/Cr), overlay on Dashboard footer/header, dispatches budget value to parent state
- **3.2:** Wire slider to `Dashboard.jsx`: on value change, call `greedyBudgetSelect(clusters, budget)` from `priorityEngine.js`, update displayed dockets — no API call
- **3.3:** Implement reshuffle animation — CSS transition on docket position change (150–200ms spring), ink-press stamp animation on newly top-ranked docket. Respect `prefers-reduced-motion`.
- **3.4:** Add summary text: "At ₹XX L: funding № 01 and № 02 only. Covers X of Y affected residents."

**Verification:**
- [ ] Slider renders and shows formatted budget value
- [ ] Dragging slider live updates the docket list (no page reload, no API call)
- [ ] At ₹20L budget, only the top 1–2 dockets by ImpactPerRupee are shown
- [ ] Reshuffle animation plays on slider release
- [ ] Summary text updates correctly

**Files created/modified:**
- `src/components/BudgetSlider.jsx`
- `src/pages/Dashboard.jsx` (wired slider state)

---

## Phase 4 — Explanation Card (Gemini Integration)

**Goal:** Real Gemini API call that generates grounded natural-language explanation for a docket, displayed as a case-file overlay.

**Status:** 🔲 Not started

**Depends on:** Phase 2 (Dashboard with docket click)

**Plans:**
- **4.1:** Build `src/components/ExplanationCard.jsx` — case-file modal overlay (aged-parchment surface), displays: "CASE FILE — Ward X Issue", evidence bullets (sourced), "Impact per ₹" star rating, close button
- **4.2:** Build `src/api/gemini.js` — Gemini API call function. Prompt template must include: pre-computed evidence bullets from cluster data + verbatim instruction: `"Narrate these facts in plain language. Do not calculate, estimate, or add any number not provided above."`. Label as `// MOCK` if API key missing.
- **4.3:** Wire docket click in Dashboard → open ExplanationCard → trigger Gemini call → stream/display response. Show loading state during API call.

**Verification:**
- [ ] Clicking a docket opens the Explanation Card overlay
- [ ] Gemini API is called with pre-computed evidence (not raw complaint text)
- [ ] Response displays as formatted case-file bullets (not prose paragraph)
- [ ] Loading state visible during API call
- [ ] If `VITE_GEMINI_API_KEY` missing, `// MOCK` response shown with clear label

**Files created/modified:**
- `src/components/ExplanationCard.jsx`
- `src/api/gemini.js`
- `src/pages/Dashboard.jsx` (click handler, card state)

---

## Phase 5 — Citizen Widget

**Goal:** WhatsApp-styled complaint submission widget that submits to Firestore and triggers Gemini extraction.

**Status:** 🔲 Not started

**Depends on:** Phase 0 (Firebase), Phase 1 (seed data structure)

**Plans:**
- **5.1:** Build `src/pages/CitizenWidget.jsx` — WhatsApp UI (dark header with JanMitra logo, message bubbles, text input bar, send button). Language selector visible. Mobile-first layout.
- **5.2:** Build `src/api/extractComplaint.js` — calls backend `/api/extract-complaint` which calls Gemini to extract `{issue_type, location, urgency, affected_group}` from raw text. Saves to Firestore with `cluster_id` lookup.
- **5.3:** Add Web Speech API voice input — `Hold to speak` button, waveform pulse animation while recording, transcribed text fills input field. Graceful fallback if browser unsupported.
- **5.4:** Add success state after submission: "Your complaint was registered. Case #XXXX" bubble. Wire navigation from Widget to Dashboard.

**Verification:**
- [ ] Widget renders with WhatsApp styling on mobile viewport
- [ ] Text submission → Firestore document created → dashboard shows updated count
- [ ] Voice button appears and works in Chrome (hold → speak → release → text appears)
- [ ] Success confirmation bubble appears after submit

**Files created/modified:**
- `src/pages/CitizenWidget.jsx`
- `src/api/extractComplaint.js`
- `server/index.js` (extract endpoint with Gemini call)
- `src/App.jsx` (route CitizenWidget)

---

## Phase 6 — Visual Polish Pass

**Goal:** Full design fidelity: thread animation on dashboard load, stamp animations, paper texture, fonts, spacing, final QA.

**Status:** 🔲 Not started

**Depends on:** Phases 1–5 working end-to-end

**Plans:**
- **6.1:** Dashboard load animation — EvidenceThread SVG draws once on mount (staggered: #1 draws at 200ms, #2 at 350ms, etc.), then settles. No animation on subsequent selections (instant thread).
- **6.2:** Ink-stamp animation — urgency stamp badge does a quick rotate+scale press on card mount. Budget reshuffle: top docket gets fresh stamp-press.
- **6.3:** Typography audit — verify Fraunces loads for all `№` numbers, IBM Plex Sans for all body text, IBM Plex Mono for all scores/IDs/coordinates. Fix any fallback rendering.
- **6.4:** Paper texture — apply very low-opacity noise CSS filter to aged-parchment surfaces only. Verify design on ink-navy shell.
- **6.5:** Final spacing / accessibility pass — keyboard navigation for dockets and map pins, visible focus ring in marigold, ARIA labels on interactive elements, `prefers-reduced-motion` final audit.

**Verification:**
- [ ] EvidenceThread draws on dashboard load (staggered)
- [ ] Urgency stamps do ink-press animation on mount
- [ ] All three Google Fonts render correctly
- [ ] Paper texture visible on parchment surfaces, not on navy background
- [ ] All dockets keyboard-navigable with marigold focus ring
- [ ] `prefers-reduced-motion: reduce` shows instant threads, no spring animations

**Files modified:**
- `src/components/EvidenceThread.jsx`
- `src/components/DocketCard.jsx`
- `src/index.css`
- Various component files (accessibility, final spacing)

---

## Backlog (Post-Hackathon)

999.1 — Real WhatsApp Business API integration
999.2 — Cloud Speech-to-Text replacement for Web Speech API
999.3 — Vertex AI embeddings for real complaint clustering
999.4 — BigQuery public dataset live joins
999.5 — Firebase Auth for MP role management
999.6 — Looker Studio analyst view embed
999.7 — Multi-ward data beyond 3 seeded wards

---

## Notes

- **Never touch Phase 6 (polish) until Phases 1–4 work end-to-end.** A judge forgives plain styling on a working brain.
- **Phase 5 (Citizen Widget) can be built in parallel with Phase 3/4** since it has a separate data path, but depends on Phase 0 Firebase init.
- If time runs out: cut Phase 5 voice input first, then cut live Citizen Widget submission (use pre-seeded data only), then cut Map (use ward list). Never cut the priority engine or budget simulation.
