# JanMitra AI — STATE.md

**Project:** JanMitra AI — Constituency Digital Twin + Priority Optimizer
**Milestone:** v2.1 (Prototype Readiness Fixes)
**Current Phase:** Not started (defining requirements)
**Last Updated:** 2026-07-08

---

## Current Status

**Milestone v2.1 started.** Requirements being defined.

---

## What's Done (v2.0 — Complete)

- ✅ Phase 8: Live Constituency Digital Twin (CSTE) rewrite + persistence
- ✅ Phase 7: Vertex AI Embedding Pipeline + Dynamic Clustering

---

## What's Next (v2.1 — Prototype Readiness Fixes)

- Define requirements for fixing demo-killers.
- Create roadmap.

---

## Accumulated Context for Next Agent

### Architecture
- **Frontend:** React + Vite + Tailwind CSS (Tailwind v4)
- **Backend:** Local Node/Express (`server/index.js`, port 3001)
- **Database:** Firestore (real-time `onSnapshot` listeners in `App.jsx`)
- **AI:** Gemini API + Vertex AI Embeddings
- **Maps (current):** Leaflet + react-leaflet + OpenStreetMap → **to be replaced with Google Maps**
- **Voice:** `window.SpeechRecognition` (currently English only → needs Hindi)
- **i18n:** react-i18next with `en` and `hi` locales

### Scoring Formula (DO NOT TOUCH)
```
PriorityScore = (Need × Impact × (1 + Synergy)) / Cost_Lakhs
```
Weights: `w1=0.25, w2=0.20, w3=0.15, w4=0.20, w5=0.10`
These are validated and must not change.

### Known Demo Killers (To Fix in v2.1)
1. Hindi voice is broken (`rec.lang` not set).
2. `simulateCSTE(fundedClusters)` missing `clusters` arg.
3. `CitizenWidget.jsx` discards `embedding` instead of saving to Firestore.
4. "Offline Queuing" is claimed in pitch deck but unimplemented.
5. Pitch deck score numbers don't match actual priority engine output.
6. Maps currently use OSM tiles.
