# JanMitra AI — ROADMAP.md

**Milestone v2.1:** Prototype Readiness Fixes
**Status:** Active
**Total Phases:** 3
**Last updated:** 2026-07-08

---

## Phase 9: Google Maps Migration (Carried over from v2.0)
**Goal:** Replace Leaflet with Google Maps to align with the Google Technologies Hackathon Track.
**Requirements:** MAPS-01, MAPS-02, MAPS-03

**Success Criteria:**
1. `MapPanel.jsx` successfully renders a Google Map.
2. Ward pins appear on the map with appropriate colors based on cluster state.
3. `leaflet` and `react-leaflet` dependencies are removed.

---

## Phase 10: P0 Demo Killers (Codebase Fixes)
**Goal:** Fix the catastrophic bugs that would crash a live demo (Voice, CSTE projection, Missing embedding).
**Requirements:** FIX-01, FIX-02, FIX-03

**Success Criteria:**
1. `rec.lang` in `CitizenWidget.jsx` correctly binds to Hindi/English state.
2. `simulateCSTE(fundedClusters, clusters)` correctly passes the second argument in `BudgetSimulator.jsx`, restoring accurate telemetry.
3. `CitizenWidget.jsx` successfully stores the `embedding` vector into the Firestore document when extracting a complaint.

---

## Phase 11: P1/P2 Pitch & UI Integrity
**Goal:** Sync the pitch deck with reality and remove half-finished features that distract judges.
**Requirements:** FIX-04, FIX-05, FIX-06, FIX-07

**Success Criteria:**
1. Pitch deck numbers exactly match the priority scores produced by the engine.
2. "Offline Queuing" claim is removed from the pitch deck.
3. The constituency switcher is hidden to prevent empty state navigation.
4. Placeholder sidebar links (Reports, Settings, Help) are removed to keep the demo on the "happy path".
