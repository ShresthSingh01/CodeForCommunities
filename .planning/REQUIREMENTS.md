# JanMitra AI — REQUIREMENTS.md

**Milestone v2.1:** Prototype Readiness Fixes
**Status:** Active
**Last updated:** 2026-07-08

---

## Functional Requirements

### FIX — Critical Prototype Fixes

- **FIX-01 (Hindi Voice):** In `CitizenWidget.jsx`, `rec.lang` must be dynamically set to `hi-IN` when the language is Hindi, and `en-US` when English.
- **FIX-02 (CSTE Argument):** In `BudgetSimulator.jsx`, the call to `simulateCSTE` must be updated to pass `clusters` as the second argument (`simulateCSTE(fundedClusters, clusters)`), so that the baseline calculates correctly from live data.
- **FIX-03 (Save Embedding):** In `CitizenWidget.jsx`, the `handleExtract` function must extract the `embedding` array from the API response and include it in the `extractedData` state, and the `handleSubmit` function must save it to the Firestore complaint document.
- **FIX-04 (Pitch Deck Sync):** Update the numbers on Slide 4 of `JanMitra_AI_Pitch_Deck.md` to reflect the actual priority scores output by the engine for the seeded clusters.
- **FIX-05 (Remove Offline Claim):** Remove the "Offline Queuing" claim from `JanMitra_AI_Pitch_Deck.md` to avoid presenting a false capability.
- **FIX-06 (Constituency Switcher):** In `TopBar.jsx`, remove the constituency switcher dropdown and hardcode the display to "Varanasi (Pilot)" or seed data for Lucknow and Amethi. (Simplest: Hide switcher).
- **FIX-07 (Placeholder Pages):** In `App.jsx`, either add minimal real content for the Reports, Settings, and Help views, or remove them from the Sidebar entirely to prevent judges from clicking on unfinished pages.

### MAPS — Google Maps Platform Migration (Moved from v2.0)

- **MAPS-01:** `MapPanel.jsx` is rewritten to use `@googlemaps/react-wrapper` and the Google Maps JavaScript API, removing all `leaflet` and `react-leaflet` dependencies.
- **MAPS-02:** Ward pins use `google.maps.Marker` with custom colored icons based on cluster rank/urgency.
- **MAPS-03:** Map centers correctly on Varanasi and shows markers for seeded clusters.

---

## Acceptance Criteria

- [ ] **AC-FIX-01:** Starting voice recognition in Hindi mode transcribes Hindi text.
- [ ] **AC-FIX-02:** Budget Simulator's CSTE Digital Twin telemetry correctly shows live baseline data (not 50/50/50/50).
- [ ] **AC-FIX-03:** Submitting a complaint from Citizen Widget saves the `embedding` to Firestore.
- [ ] **AC-FIX-04:** Pitch deck no longer claims offline queuing and has correct Priority Scores.
- [ ] **AC-FIX-05:** Constituency switcher is gone and placeholder pages are hidden or minimally filled.
- [ ] **AC-MAPS-01:** Map panel renders with Google Maps tiles (not OpenStreetMap) — verified by inspecting tile URLs in browser DevTools. No Leaflet CSS loaded.

---

## Traceability (Phase → REQ-IDs)

| Phase | Requirements |
|-------|-------------|
| Phase 9 (v2.0 leftover) | MAPS-01, MAPS-02, MAPS-03 |
| Phase 11 — P0 Demo Killers | FIX-01, FIX-02, FIX-03 |
| Phase 12 — P1/P2 Pitch & UI Fixes | FIX-04, FIX-05, FIX-06, FIX-07 |

---

## Out of Scope (v2.1)

- Complex offline queuing implementation (we are removing the claim instead).
- Full state data generation for multiple constituencies.
