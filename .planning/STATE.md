# JanMitra AI — STATE.md

**Project:** JanMitra AI — Constituency Digital Twin + Priority Optimizer
**Milestone:** v2.0 (Real Intelligence Layer)
**Current Phase:** Not started (defining requirements)
**Last Updated:** 2026-07-08

---

## Current Status

**Milestone v2.0 started.** Requirements defined. Roadmap created. Ready to execute Phase 7.

---

## What's Done (v1.0 — Complete)

- ✅ Phase 6: Final Visual Polish Pass (animations, ink-stamps, fonts, accessibility)
- ✅ Phase 5: WhatsApp-styled Citizen Widget with text + voice input, Gemini extraction
- ✅ Phase 4: Grounded Gemini AI Explanation Card with anti-hallucination constraints
- ✅ Phase 3: Client-side Budget Simulation Slider with CSTE before/after projection
- ✅ Phase 2: MP Dashboard (docket stack + MapPanel + EvidenceThread SVG)
- ✅ Phase 1: Firestore seed data + Priority Engine (Ward 7 water ranks #1)
- ✅ Phase 0: Vite+React scaffold, Tailwind design tokens, Firebase init, Express backend

---

## What's Next (v2.0 — Real Intelligence Layer)

**Phase 7:** Vertex AI Embedding Pipeline
**Phase 8:** Live Constituency Digital Twin (CSTE)
**Phase 9:** Google Maps Migration
**Phase 10:** Hindi Voice + Integration Polish

---

## Accumulated Context for Next Agent

### Architecture
- **Frontend:** React + Vite + Tailwind CSS (Tailwind v4)
- **Backend:** Local Node/Express (`server/index.js`, port 3001)
- **Database:** Firestore (real-time `onSnapshot` listeners in `App.jsx`)
- **AI:** Gemini API via `generativelanguage.googleapis.com` REST calls
- **Maps (current):** Leaflet + react-leaflet + OpenStreetMap → **to be replaced with Google Maps**
- **Voice:** `window.SpeechRecognition` (currently English only → needs Hindi)
- **i18n:** react-i18next with `en` and `hi` locales

### Key Files to Touch in v2.0
- `server/index.js` → add `/api/embed-complaint` endpoint (Vertex AI embedding call)
- `scripts/seedData.js` → add embedding vectors, update cluster_id assignment logic
- `scripts/recluster.js` → NEW: batch re-clustering script
- `src/scoring/clusterEngine.js` → NEW: cosine similarity + dynamic cluster formation
- `src/scoring/csteEngine.js` → REWRITE: derive state from Firestore, not hardcoded constants
- `src/components/MapPanel.jsx` → REPLACE: Leaflet → Google Maps `@googlemaps/react-wrapper`
- `src/pages/CitizenWidget.jsx` → FIX: `rec.lang` to use i18n language
- `src/pages/Dashboard.jsx` → ADD: CSTE metrics panel component

### Scoring Formula (DO NOT TOUCH)
```
PriorityScore = (Need × Impact × (1 + Synergy)) / Cost_Lakhs
```
Weights: `w1=0.25, w2=0.20, w3=0.15, w4=0.20, w5=0.10`
These are validated and must not change.

### Vertex AI Embedding Approach
- Model: `text-embedding-004` (via Google AI API or Vertex AI API)
- Input: `raw_text` field from complaint document
- Output: 768-dim float vector stored as `embedding` array on complaint doc
- Clustering: cosine similarity threshold = 0.75 (configurable in `weights.js`)
- Graceful fallback: if Vertex AI unconfigured, fall back to rule-based type+ward matching

### CSTE Rewrite Approach
- Replace `BASELINE_STATE` hardcoded object with Firestore aggregate query
- Baseline = average of actual cluster data per domain:
  - `waterCoverage`: derived from water cluster `recurrence_score` and `affected_population`
  - `facilityDistance`: average `nearest_facility_km` across health clusters
  - `schoolAttendance`: derived from education cluster data
- After-state: applies CSTE formula on top of real baseline
- Persist snapshot to Firestore `cste_snapshots` collection

---

## Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-07-05 | Local Node/Express over Firebase Cloud Functions | Faster hackathon dev loop |
| 2026-07-05 | Greedy knapsack (not full DP) for budget simulation | MVP-sufficient, fast client-side |
| 2026-07-05 | Synthetic seed data | Full control over demo narrative |
| 2026-07-08 | `text-embedding-004` over `text-embedding-gecko` | Better quality, same API surface |
| 2026-07-08 | Cosine similarity threshold = 0.75 | Balances precision vs. fragmentation |
| 2026-07-08 | Firestore-driven CSTE baseline | Eliminates hardcoded constants, makes Twin truly "live" |
| 2026-07-08 | `@googlemaps/react-wrapper` over `@react-google-maps/api` | Official Google wrapper, lighter |
