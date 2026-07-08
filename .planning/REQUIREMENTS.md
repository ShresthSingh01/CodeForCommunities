# JanMitra AI — REQUIREMENTS.md

**Milestone v2.0:** Real Intelligence Layer
**Status:** Active
**Last updated:** 2026-07-08

---

## Functional Requirements

### EMBED — Vertex AI Embedding Pipeline

- **EMBED-01:** When a citizen submits a complaint, the system calls Vertex AI `text-embedding-004` to generate an embedding vector for `raw_text` and stores it on the Firestore complaint document.
- **EMBED-02:** The system computes a cosine-similarity matrix across all complaint embeddings and identifies complaint pairs with similarity ≥ 0.75.
- **EMBED-03:** The system dynamically groups high-similarity complaints into a shared cluster, forming clusters from complaint content (not hardcoded type+ward keys).
- **EMBED-04:** The system auto-assigns a `cluster_id` to each complaint based on its semantic cluster membership (not `CL_W7_WATER` style hardcoded IDs).
- **EMBED-05:** Each Firestore complaint document stores its `embedding` vector as a float array field.
- **EMBED-06:** A `scripts/recluster.js` script reads all existing complaints from Firestore, generates embeddings for any without them, recomputes the similarity matrix, and updates cluster assignments — runnable as `npm run recluster`.

### TWIN — Constituency Digital Twin (CSTE)

- **TWIN-01:** The CSTE engine derives its baseline state from live Firestore cluster aggregates at query time, replacing all hardcoded constants (`facilityDistance: 4.5`, `waterCoverage: 54`, etc.).
- **TWIN-02:** The "before" (current) state is computed from actual cluster data: average `nearest_facility_km` for health clusters, average `recurrence_score`-weighted population for water/education domains.
- **TWIN-03:** The "after" (projected) state applies the CSTE improvement formula using actual `affected_population` and `recurrence_score` values from funded clusters — no synthetic multipliers.
- **TWIN-04:** A `/api/cste-state` Express endpoint accepts a `ward` query parameter and returns the current Digital Twin state for that ward (or all wards if no ward specified).
- **TWIN-05:** A CSTE metrics panel is added to the MP Dashboard, showing current vs. projected values for water coverage, healthcare access, school attendance, and average facility distance.
- **TWIN-06:** On Budget Simulator confirmation, the system writes a CSTE snapshot document to Firestore (`cste_snapshots` collection) with timestamp, budget, funded cluster IDs, and computed metrics — enabling historical trend comparison.

### MAPS — Google Maps Platform Migration

- **MAPS-01:** `MapPanel.jsx` is rewritten to use `@googlemaps/react-wrapper` and the Google Maps JavaScript API, removing all `leaflet` and `react-leaflet` dependencies.
- **MAPS-02:** Ward pins use `google.maps.Marker` with SVG icons colored by rank: marigold (#E8A33D) for rank #1, evidence-teal (#2F6E68) for rank #2+, seal-red (#A6323A) for critical urgency.
- **MAPS-03:** Ward center coordinates are resolved via the Google Maps Geocoding API (`/api/geocode-ward` backend endpoint) rather than hardcoded lat/lng — with cached results in Firestore to avoid repeated API calls.

### VOICE — Hindi Voice Support

- **VOICE-01:** The speech recognition language (`rec.lang`) in `CitizenWidget.jsx` is set to `hi-IN` when the active i18n language is Hindi, and `en-US` when English.
- **VOICE-02:** The language selector in the Citizen Widget (or TopBar) triggers an i18n language change that also updates the active speech recognition language for the next voice recording.

---

## Non-Functional Requirements

### NFR-EMBED-01: Embedding Performance
- Embedding API call must complete within 3 seconds; show a loading indicator during embedding generation.
- If Vertex AI API key is missing or call fails, the system gracefully falls back to rule-based `type+ward` clustering and labels the complaint as `// FALLBACK CLUSTER`.

### NFR-EMBED-02: Similarity Threshold
- Cosine similarity threshold (0.75) must be exposed as a named constant in `src/scoring/weights.js` — not an inline magic number.

### NFR-TWIN-01: Live Data Contract
- CSTE baseline must query Firestore on each render cycle (or on cluster data change via `onSnapshot`) — never cache stale values indefinitely.
- CSTE state computation must be deterministic: same input clusters → same output metrics.

### NFR-MAPS-01: Maps Fallback
- If `VITE_MAPS_API_KEY` is missing, `MapPanel.jsx` falls back to a styled placeholder div showing ward names and coordinates as text — does not crash or show a blank screen.

### NFR-MAPS-02: Dependency Cleanup
- After Google Maps migration, `leaflet` and `react-leaflet` must be removed from `package.json` to avoid the OpenStreetMap tile URLs being visible during demo.

### NFR-VOICE-01: Language Parity
- Voice recognition language must stay in sync with the displayed UI language at all times. Switching language mid-session updates `rec.lang` before the next recording starts.

---

## Acceptance Criteria

- [ ] **AC-EMBED-01:** Submit a new Hindi-language complaint → complaint document in Firestore has an `embedding` array field with 768 floats.
- [ ] **AC-EMBED-02:** Submit two complaints about the same ward water issue using different wording → they are assigned the same `cluster_id` by the dynamic clustering engine.
- [ ] **AC-EMBED-03:** `npm run recluster` completes without error and updates `cluster_id` on all seed complaint documents.
- [ ] **AC-TWIN-01:** CSTE panel on dashboard shows different baseline values when cluster data changes (not always the same hardcoded 54%, 4.5 km, etc.).
- [ ] **AC-TWIN-02:** Selecting funded projects in Budget Simulator and confirming writes a document to Firestore `cste_snapshots` collection.
- [ ] **AC-TWIN-03:** `/api/cste-state?ward=Ward+7` returns a JSON object with `waterCoverage`, `facilityDistance`, `healthcareAccess`, `schoolAttendance`.
- [ ] **AC-MAPS-01:** Map panel renders with Google Maps tiles (not OpenStreetMap) — verified by inspecting tile URLs in browser DevTools.
- [ ] **AC-MAPS-02:** Ward 7 pin is marigold (#E8A33D), Ward 3 and Ward 9 pins are teal. No Leaflet CSS loaded.
- [ ] **AC-VOICE-01:** Switch language to Hindi → tap mic button → browser requests Hindi speech → transcription returns Hindi text.
- [ ] **AC-VOICE-02:** Switch language to English → mic produces English transcription.

---

## Traceability (Phase → REQ-IDs)

| Phase | Requirements |
|-------|-------------|
| Phase 7 — Vertex AI Embedding Pipeline | EMBED-01, EMBED-02, EMBED-03, EMBED-04, EMBED-05, EMBED-06, NFR-EMBED-01, NFR-EMBED-02 |
| Phase 8 — Live Constituency Digital Twin | TWIN-01, TWIN-02, TWIN-03, TWIN-04, TWIN-05, TWIN-06, NFR-TWIN-01 |
| Phase 9 — Google Maps Migration | MAPS-01, MAPS-02, MAPS-03, NFR-MAPS-01, NFR-MAPS-02 |
| Phase 10 — Hindi Voice + Integration Polish | VOICE-01, VOICE-02, NFR-VOICE-01 |

---

## Out of Scope (v2.0)

| Item | Reason |
|---|---|
| Full DP knapsack optimization | Greedy is sufficient at demo scale (≤20 clusters) |
| Auth / login screens | Not in demo path |
| BigQuery live joins | Firestore sufficient for hackathon |
| Looker Studio embeds | Out of milestone scope |
| Image complaint input | No demo payoff |
| Real WhatsApp Business API | Web widget sufficient |
| Cloud Speech-to-Text | Web Speech API sufficient |
