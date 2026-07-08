# JanMitra AI — ROADMAP.md

**Milestone v2.0:** Real Intelligence Layer
**Granularity:** Coarse (4 phases)
**Mode:** YOLO
**Parallelization:** Yes (independent plans within a phase run in parallel)
**Phase numbering:** Continues from v1.0 (Phase 6 was last) → starts at Phase 7

---

## Phase 7 — Vertex AI Embedding Pipeline

**Goal:** Every complaint is semantically embedded using Vertex AI `text-embedding-004`; complaints are clustered by cosine similarity instead of hardcoded `cluster_id` keys; a batch recluster script brings all seed data up to standard.

**Status:** 🔲 Not started

**Requirements covered:** EMBED-01, EMBED-02, EMBED-03, EMBED-04, EMBED-05, EMBED-06, NFR-EMBED-01, NFR-EMBED-02

**Plans:**

- **7.1 — Embedding API integration (server-side)**
  - Add `/api/embed-complaint` POST endpoint to `server/index.js`
  - Calls `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent` with the complaint `raw_text`
  - Returns 768-dim float array; label `// MOCK` with zero-vector fallback if key missing
  - Add `VITE_GEMINI_API_KEY` reuse or separate `GEMINI_EMBEDDING_KEY` env var (document in `.env.example`)

- **7.2 — Client-side cluster engine (`src/scoring/clusterEngine.js`)**
  - `cosineSimilarity(vecA, vecB)` — pure JS, unit-testable
  - `buildSimilarityMatrix(complaints)` — O(n²) pairwise cosine; n ≤ 50 for demo scale
  - `formClusters(complaints, threshold)` — Union-Find / greedy agglomeration: complaints within threshold join same cluster; cluster centroid = mean of member embeddings
  - `assignClusterIds(complaints, clusters)` — returns updated complaint array with semantic `cluster_id`s (format: `CL_SEM_{ward}_{dominantIssueType}_{index}`)
  - `SIMILARITY_THRESHOLD = 0.75` exported from `src/scoring/weights.js`

- **7.3 — Complaint submission pipeline update**
  - In `server/index.js` `/api/extract-complaint`: after Gemini extraction, call `/api/embed-complaint` internally
  - Attach `embedding` array and `cluster_id` (via cluster engine) to the complaint doc before writing to Firestore
  - In `CitizenWidget.jsx`: submission flow unchanged from user perspective; internals now produce richer documents

- **7.4 — Batch recluster script (`scripts/recluster.js`)**
  - Reads all complaints from Firestore `complaints` collection
  - Generates embeddings for any complaint missing `embedding` field (batch mode, rate-limited)
  - Runs cluster engine to recompute all `cluster_id` assignments
  - Updates Firestore complaint docs and rebuilds cluster aggregate docs
  - Add `"recluster": "node scripts/recluster.js"` to `package.json`

- **7.5 — Unit tests**
  - `src/scoring/__tests__/clusterEngine.test.js`
  - Test: `cosineSimilarity([1,0], [1,0])` = 1.0; orthogonal = 0.0
  - Test: two water-shortage complaints produce similarity > 0.75 (use precomputed mock vectors)
  - Test: `formClusters` correctly merges high-similarity pairs

**Success criteria:**
1. Submit a complaint via CitizenWidget → Firestore doc contains `embedding` array of 768 floats (not null/empty)
2. Submit two differently-worded water complaints for Ward 7 → both get the same `cluster_id`
3. Submit a road complaint for Ward 3 → gets a different `cluster_id` than the water ones
4. `npm run recluster` completes without error; all seed complaint docs get `embedding` field
5. `cosineSimilarity` unit test passes; `formClusters` unit test passes

**Files created/modified:**
- `server/index.js` (add `/api/embed-complaint`, update extract flow)
- `src/scoring/clusterEngine.js` (NEW)
- `src/scoring/__tests__/clusterEngine.test.js` (NEW)
- `src/scoring/weights.js` (add `SIMILARITY_THRESHOLD`)
- `src/pages/CitizenWidget.jsx` (minor: handle richer API response)
- `scripts/recluster.js` (NEW)
- `package.json` (add recluster script)
- `.env.example` (document embedding key)

---

## Phase 8 — Live Constituency Digital Twin (CSTE)

**Goal:** The CSTE engine derives its baseline from live Firestore cluster aggregates (not hardcoded constants); a queryable API endpoint exposes ward state; a live metrics panel on the dashboard makes the "Digital Twin" concept visible and defensible to judges.

**Status:** 🔲 Not started

**Depends on:** Phase 7 (cluster data must be dynamic before Twin can be live)

**Requirements covered:** TWIN-01, TWIN-02, TWIN-03, TWIN-04, TWIN-05, TWIN-06, NFR-TWIN-01

**Plans:**

- **8.1 — Rewrite `src/scoring/csteEngine.js`**
  - Remove all hardcoded `BASELINE_STATE` constants
  - Export `computeBaselineFromClusters(clusters)`:
    - `waterCoverage`: `100 - (avgRecurrenceScore_water × 50)` — higher complaint frequency → lower coverage estimate
    - `facilityDistance`: `avg(nearest_facility_km)` across health + education clusters
    - `schoolAttendance`: `100 - (sumComplaintCount_education / totalPopulation_education × 30)`
    - `healthcareAccess`: `100 - (avgRecurrenceScore_health × 60)`
  - Update `simulateCSTE(fundedClusters, allClusters)` to accept `allClusters` for baseline computation
  - Return `{ baseState, futureState, computedAt: Date.now() }` — no stale values

- **8.2 — CSTE API endpoint**
  - Add `GET /api/cste-state` to `server/index.js`
  - Accepts optional `?ward=Ward+7` query param
  - Reads clusters from Firestore (server-side Firestore Admin SDK) or accepts clusters in request body for demo mode
  - Returns JSON: `{ ward, waterCoverage, facilityDistance, healthcareAccess, schoolAttendance, computedAt }`
  - Add Firestore Admin SDK (`firebase-admin`) to server dependencies

- **8.3 — CSTE Snapshot persistence**
  - In `BudgetSimulator.jsx`: when user confirms funded portfolio, POST to `/api/save-cste-snapshot`
  - Snapshot doc: `{ timestamp, budget_inr, funded_cluster_ids[], base_state, future_state, constituency_id }`
  - Writes to Firestore `cste_snapshots` collection
  - Add `/api/save-cste-snapshot` endpoint to `server/index.js`

- **8.4 — CSTE Metrics Panel component (`src/components/CSTEPanel.jsx`)**
  - Shows 4 constituency health metrics as animated gauge bars
  - Each bar: domain icon + label + current value + projected value (with delta badge)
  - Color: green delta if improved, red if worsened
  - Plugged into `Dashboard.jsx` below the KPI row
  - Uses `computeBaselineFromClusters(clusters)` with current ranked clusters as input
  - Real-time: re-computes whenever `clusters` prop updates via Firestore snapshot

**Success criteria:**
1. Dashboard CSTE panel shows different values when cluster data changes (not always 54%, 4.5 km)
2. `GET /api/cste-state?ward=Ward+7` returns valid JSON with all 4 metrics
3. Confirming budget allocation in Budget Simulator → Firestore `cste_snapshots` collection gets a new doc
4. `computeBaselineFromClusters(CLUSTERS)` in unit test returns values consistent with seed data (not hardcoded)
5. CSTE panel delta badges show green for improved metrics, red for degraded

**Files created/modified:**
- `src/scoring/csteEngine.js` (REWRITE — remove all hardcoded constants)
- `src/components/CSTEPanel.jsx` (NEW)
- `src/pages/Dashboard.jsx` (add CSTEPanel)
- `src/pages/BudgetSimulator.jsx` (add snapshot save on confirm)
- `server/index.js` (add `/api/cste-state`, `/api/save-cste-snapshot`)
- `package.json` (add `firebase-admin` to server deps)
- `src/scoring/__tests__/csteEngine.test.js` (NEW — test baseline computation)

---

## Phase 9 — Google Maps Platform Migration

**Goal:** Replace Leaflet/OpenStreetMap with the official Google Maps JavaScript API (`@googlemaps/react-wrapper`); ward pins use rank-colored Google Maps Markers; ward coordinates resolved via Geocoding API with Firestore caching.

**Status:** 🔲 Not started

**Depends on:** Phase 7 (clusters may have updated coordinates)

**Requirements covered:** MAPS-01, MAPS-02, MAPS-03, NFR-MAPS-01, NFR-MAPS-02

**Plans:**

- **9.1 — Install and configure Google Maps SDK**
  - `npm install @googlemaps/react-wrapper` (and uninstall `leaflet`, `react-leaflet`)
  - Add `VITE_MAPS_API_KEY` usage in `MapPanel.jsx` (already in `.env.example`)
  - Styled fallback: if key missing, render `<div>` with ward names and lat/lng as text

- **9.2 — Rewrite `src/components/MapPanel.jsx`**
  - Wrap with `<Wrapper apiKey={VITE_MAPS_API_KEY} render={render} />`
  - `<Map>` component centered on constituency center (Varanasi: 28.6100, 77.2090)
  - `<Marker>` per cluster with:
    - Position: `{ lat: cluster.location.lat, lng: cluster.location.lng }`
    - Icon: SVG circle — marigold (#E8A33D) for rank 1, evidence-teal (#2F6E68) for rank 2+, seal-red (#A6323A) if urgency === 'critical'
    - `onClick`: calls `onSelectCluster(cluster)` — same interface as before (no App.jsx changes)
  - InfoWindow on marker click: shows cluster summary (ward, issue type, complaint count, priority score)
  - Remove all Leaflet imports, CSS, and tile references

- **9.3 — Geocoding backend endpoint (`/api/geocode-ward`)**
  - `GET /api/geocode-ward?name=Ward+7+Varanasi`
  - Calls Google Maps Geocoding API: `https://maps.googleapis.com/maps/api/geocode/json`
  - Caches result in Firestore `geocode_cache` collection (key = ward name) — avoids repeated API calls
  - Returns `{ lat, lng, formattedAddress }`
  - Frontend `MapPanel.jsx` calls this on mount for each ward not already having coordinates

- **9.4 — Package cleanup**
  - `npm uninstall leaflet react-leaflet`
  - Remove any Leaflet CSS imports (`import 'leaflet/dist/leaflet.css'`)
  - Verify no OpenStreetMap tile URLs remain in the codebase (`grep -r openstreetmap`)

**Success criteria:**
1. Map panel loads with Google Maps tiles (verify tile URLs: `maps.googleapis.com` not `openstreetmap.org`)
2. Ward 7 marker is marigold (#E8A33D), other ward markers are teal
3. Clicking a map marker opens Google InfoWindow with cluster summary
4. If `VITE_MAPS_API_KEY` is empty, map panel shows a styled fallback (not blank/broken)
5. `leaflet` and `react-leaflet` not present in `package.json` dependencies
6. `/api/geocode-ward?name=Ward+7+Varanasi` returns valid lat/lng JSON

**Files created/modified:**
- `src/components/MapPanel.jsx` (REWRITE — remove Leaflet, add Google Maps)
- `server/index.js` (add `/api/geocode-ward`)
- `package.json` (add `@googlemaps/react-wrapper`, remove `leaflet`, `react-leaflet`)
- `src/index.css` or `main.jsx` (remove Leaflet CSS imports)

---

## Phase 10 — Hindi Voice + Integration Polish

**Goal:** Voice recognition language tracks the active i18n language; all v2.0 components integrate cleanly end-to-end; pitch deck numbers match actual engine output; final demo script verified.

**Status:** 🔲 Not started

**Depends on:** Phases 7, 8, 9 (all v2.0 components working independently)

**Requirements covered:** VOICE-01, VOICE-02, NFR-VOICE-01

**Plans:**

- **10.1 — Hindi voice fix in `CitizenWidget.jsx`**
  - Import `useTranslation` (already imported), read `i18n.language`
  - In `startSpeechRecognition()`: `rec.lang = i18n.language === 'hi' ? 'hi-IN' : 'en-US'`
  - Test: switch language to Hindi → tap mic → confirm browser requests Hindi speech
  - Language toggle in TopBar already exists — no new UI needed

- **10.2 — Language-selector wires to speech language**
  - Ensure TopBar language selector calls `i18n.changeLanguage(lang)` (already wired)
  - `CitizenWidget` reads `i18n.language` at recording start — no separate state needed
  - Add language badge next to mic button: `🎤 हिं` or `🎤 EN` to confirm active speech language

- **10.3 — End-to-end integration verification**
  - Run full demo script: Citizen submits Hindi voice complaint → embedding generated → cluster assigned → dashboard updates → CSTE panel reflects new data → Explanation Card generates grounded narration → Budget Simulator snapshot saved
  - Fix any broken state flows between Phase 7–9 components
  - Ensure `// MOCK` labels visible on all fallback paths (Vertex AI, Maps, Gemini)

- **10.4 — Pitch deck number alignment**
  - Run priority engine on seed data, record actual output scores
  - Update worked example in `JanMitra_AI_Pitch_Deck.md` (or a companion reference) to show real computed values
  - Add the actual formula slide content as a comment in `priorityEngine.js` for reference during demo

- **10.5 — Final architecture diagram fix**
  - Update `JanMitra_AI_Pitch_Deck.md` Step 2 from "Vertex AI embeddings" to accurate description of actual stack
  - Verify all 5 architecture steps match the actual code pipeline

**Success criteria:**
1. Switch UI to Hindi → tap mic → browser SpeechRecognition uses `hi-IN` → Hindi text transcribed
2. Language badge next to mic shows current recognition language
3. Full demo script runs end-to-end without errors or broken states
4. All `// MOCK` labels visible on unconfigured fallback paths
5. Priority scores in pitch deck match actual engine output from seed data
6. Architecture diagram in pitch deck accurately describes the Phase 7 embedding pipeline

**Files modified:**
- `src/pages/CitizenWidget.jsx` (voice language fix + language badge)
- `JanMitra_AI_Pitch_Deck.md` (fix architecture diagram, update worked example numbers)
- `src/scoring/priorityEngine.js` (add formula comment)
- Various files (integration bug fixes)

---

## Backlog (Post-v2.0 / Post-Hackathon)

- 999.1 — Real WhatsApp Business API integration
- 999.2 — Cloud Speech-to-Text for production-grade transcription
- 999.3 — BigQuery public dataset live joins
- 999.4 — Firebase Auth for MP role management
- 999.5 — Looker Studio analyst view embed
- 999.6 — Multi-ward data beyond 3 seeded wards
- 999.7 — Full DP knapsack for optimal budget allocation
- 999.8 — Cross-constituency benchmarking with shared CSTE schema

---

## Notes

- **Phase 7 is the foundation.** Do not start Phase 8 until dynamic clustering writes correct `cluster_id` values to Firestore — CSTE depends on real cluster data.
- **Phase 9 (Google Maps) is independent** of Phases 7–8 and can run in parallel with Phase 8 if time allows.
- **Phase 10 is integration glue.** Keep it lightweight — the goal is verification, not new features.
- **Never touch `src/scoring/priorityEngine.js` formula or weights** — it's validated and the audit trail would be lost.
- **Fallback paths are mandatory.** Every Vertex AI, Maps, and Gemini call must have a graceful `// MOCK` or `// FALLBACK` path for demo resilience.
