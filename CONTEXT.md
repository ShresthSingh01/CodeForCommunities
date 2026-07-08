# JanMitra AI — Project Context Document

**Version:** 2.1 (Prototype Readiness Fixes)
**Stack:** React + Vite + Tailwind CSS v4 / Node.js + Express / Google Firebase / Google Gemini API
**Pilot Constituency:** Varanasi, India
**Purpose:** AI-powered constituency management system for Members of Parliament — complaint analysis, priority ranking, budget simulation, and a live digital twin of constituency health.

---

## 1. Directory Structure

```
d:\GDG\
├── janmitra-app/                 ← Main monorepo
│   ├── .env                      ← Environment variables (see §7)
│   ├── package.json
│   ├── vite.config.js
│   ├── public/
│   │   └── wards.geojson         ← Ward boundary polygons (synthetic for Varanasi pilot)
│   ├── scripts/
│   │   ├── seed.js               ← Seeds Firestore with clusters + complaints
│   │   └── recluster.js          ← Re-embeds + re-clusters existing Firestore complaints
│   ├── server/
│   │   └── index.js              ← Express server (port 3001)
│   └── src/
│       ├── App.jsx               ← Root: routing, Firestore listener, shared state
│       ├── firebase.js           ← Firebase SDK initialisation (reads VITE_* env vars)
│       ├── i18n.js               ← react-i18next init (en + hi locales)
│       ├── components/
│       │   ├── CSTEPanel.jsx     ← Digital Twin telemetry panel
│       │   ├── ExplanationBlock.jsx
│       │   ├── KpiCard.jsx
│       │   ├── MapPanel.jsx      ← Google Maps (Phase 9 — @googlemaps/react-wrapper)
│       │   ├── ScoreTriadChip.jsx
│       │   ├── Sidebar.jsx
│       │   └── TopBar.jsx
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── IssuesPage.jsx
│       │   ├── PortfolioPlanner.jsx
│       │   ├── BudgetSimulator.jsx
│       │   ├── CitizenWidget.jsx
│       │   └── WardMapPage.jsx
│       └── scoring/
│           ├── weights.js        ← All tunable constants (weights, thresholds, matrices)
│           ├── priorityEngine.js ← computeRankings() + greedyBudgetSelect()
│           ├── csteEngine.js     ← computeBaselineFromClusters() + simulateCSTE()
│           └── clusterEngine.js  ← cosineSimilarity(), buildSimilarityMatrix(), formClusters(), assignClusterIds()
├── CONTEXT.md                   ← This file
├── JanMitra_AI_Pitch_Deck.md
└── .planning/
    ├── PROJECT.md
    ├── REQUIREMENTS.md
    ├── ROADMAP.md
    └── STATE.md
```

---

## 2. npm Scripts

| Command | Action |
|---|---|
| `npm run start` | Start server + Vite client concurrently |
| `npm run client` | Vite dev server only |
| `npm run server` | Node/Express server with --watch |
| `npm run seed` | Seed Firestore with sample data |
| `npm run recluster` | Re-embed + re-cluster all Firestore complaints |
| `npm run build` | Production build |

---

## 3. Tech Stack & Dependencies

### Frontend

| Dependency | Version | Notes |
|---|---|---|
| react | ^19.2.7 | |
| react-dom | ^19.2.7 | |
| vite | ^8.1.1 | |
| tailwindcss | ^4.3.2 | v4 — uses @import "tailwindcss" NOT @tailwind directives |
| @googlemaps/react-wrapper | latest | Phase 9: replaces Leaflet |
| react-i18next | ^17.0.8 | |
| i18next | ^26.3.4 | |
| firebase | ^12.15.0 | Client SDK (Firestore real-time listeners) |

> **Removed in Phase 9:** leaflet, react-leaflet are no longer in package.json.

### Backend (server/index.js)

| Dependency | Version | Notes |
|---|---|---|
| express | ^5.2.1 | |
| cors | ^2.8.6 | |
| firebase-admin | ^14.1.0 | Admin SDK for server-side Firestore writes |
| puppeteer | ^25.3.0 | PDF report generation |

---

## 4. Architecture Overview

```
Browser
  ├── App.jsx (root)
  │     ├── Firestore onSnapshot listener → updates clusters state
  │     ├── Fallback: reads from localStorage if Firebase not configured
  │     └── Shared state: clusters[], budget, selectedCluster, currentConstituency
  │
  ├── Pages (routed by currentView state — NOT React Router)
  │     ├── Dashboard       → KPI cards + CSTEPanel + top clusters list
  │     ├── IssuesPage      → ranked cluster list, cluster detail, MapPanel
  │     ├── PortfolioPlanner → drag-and-fund cluster portfolio
  │     ├── BudgetSimulator  → greedy optimizer, CSTE telemetry, snapshot save
  │     ├── CitizenWidget    → voice/text complaint, Gemini AI extraction
  │     └── WardMapPage      → full-screen Google Maps
  │
  └── Express Server (port 3001)
        ├── POST /api/extract-complaint    ← Gemini AI + embedding
        ├── POST /api/embed-complaint      ← Vertex AI text-embedding-004
        ├── POST /api/cste-state           ← Live CSTE computation
        ├── POST /api/save-cste-snapshot   ← Write snapshot to Firestore
        ├── GET  /api/geocode-ward         ← Google Geocoding API + Firestore cache
        └── POST /api/generate-report      ← Puppeteer PDF generation
```

---

## 5. Data Model (Firestore)

### Collection: clusters

```js
{
  id: "auto-id",
  constituency_id: "varanasi",
  issue_type: "water",            // "water" | "road" | "health" | "education"
  ward: "Ward 7",                 // "Ward 3" | "Ward 7" | "Ward 9"
  cluster_id: "CL_SEM_Ward7_WATER_0",
  complaint_count: 34,
  affected_population: 14200,
  recurrence_score: 0.87,         // 0.0–1.0
  nearest_facility_km: 5.2,
  estimated_cost_inr: 2000000,
  urgency: "critical",            // "low" | "moderate" | "critical"
  location: { lat: 28.62, lng: 77.21, ward: "Ward 7" }
  // priority_score, need_score, impact_score, synergy_score, rank — computed client-side, not stored
}
```

### Collection: complaints

```js
{
  id: "auto-id",
  raw_text: "Ward 7 mein paani nahi aa raha...",
  issue_type: "water",
  ward: "Ward 7",
  cluster_id: "CL_SEM_Ward7_WATER_0",
  urgency: "critical",
  affected_group: "residents",
  constituency_id: "varanasi",
  embedding: [0.123, -0.456, ...],  // 768-float array from text-embedding-004
  location: { lat, lng, ward },
  submittedAt: "ISO timestamp"
}
```

### Collection: cste_snapshots

```js
{
  timestamp: "ISO string",
  budget_inr: 3500000,
  funded_cluster_ids: ["CL_SEM_Ward7_WATER_0"],
  base_state: { waterCoverage, facilityDistance, schoolAttendance, healthcareAccess },
  future_state: { waterCoverage, facilityDistance, schoolAttendance, healthcareAccess },
  constituency_id: "varanasi"
}
```

### Collection: ward_coordinates (Phase 9 geocoding cache)

```js
{ ward, constituency, lat, lng, timestamp }
```

---

## 6. Scoring Engines

### 6.1 Priority Engine (src/scoring/priorityEngine.js)

> *** DO NOT MODIFY THIS FORMULA OR WEIGHTS — VALIDATED ***

**computeRankings(clusters, customWeights?)**

```
need_score   = (w1 × 0.8) + (w3 × recurrence_score) + (w4 × norm_service_gap)
impact_score = (w2 × norm_population) + (w5 × vulnerability_index)
synergy_score = sum of SYNERGY_MATRIX bonuses for co-located type pairs

priority_score = (need_score × impact_score × (1 + synergy_score)) / cost_lakhs
impact_per_rupee = priority_score
```

**Weights (weights.js):**

| Key | Value | Meaning |
|---|---|---|
| w1 | 0.25 | Urgency severity |
| w2 | 0.20 | Affected population |
| w3 | 0.15 | Recurrence score |
| w4 | 0.20 | Service gap (nearest_facility_km) |
| w5 | 0.10 | Vulnerability index |

**Vulnerability Index:**
patients=1.0, students=0.9, residents=0.8, pedestrians=0.7, commuters=0.6, default=0.5

**Synergy Matrix:**
road+health=0.20, water+health=0.15, road+education=0.15 (and reverse combos)

**greedyBudgetSelect(rankedClusters, budgetInr)**
Iterates ranked clusters (sorted by impact_per_rupee desc), picks greedily until budget exhausted.

---

### 6.2 CSTE Engine (src/scoring/csteEngine.js)

**computeBaselineFromClusters(clusters)**

```
waterCoverage    = 100 - (avg_recurrence_water × 50)         [default: 80]
facilityDistance = avg(nearest_facility_km) health+edu        [default: 4.0]
schoolAttendance = 100 - ((sum_count_edu × 1000 / 120000) × 30) [default: 75]
healthcareAccess = 100 - (avg_recurrence_health × 60)        [default: 70]
Fallback if empty: { facilityDistance:5.0, schoolAttendance:50, waterCoverage:50, healthcareAccess:50 }
```

**simulateCSTE(fundedClusters, allClusters)**
Returns { baseState, futureState, computedAt }

```
road   → facilityDistance -= (0.5 × recurrence); roadBonus += (5 × popRatio × recurrence)
edu    → schoolAttendance += (25 × popRatio × recurrence) + roadBonus
water  → waterCoverage    += (200 × popRatio × recurrence)
health → healthcareAccess += (150 × popRatio × recurrence) + (roadBonus × 1.5)
          facilityDistance -= (0.3 × recurrence)
WARD_TOTAL_POPULATION = 120000
```

---

### 6.3 Cluster Engine (src/scoring/clusterEngine.js)

- `cosineSimilarity(vecA, vecB)` → float
- `buildSimilarityMatrix(items, vecKey='embedding')` → N×N matrix
- `formClusters(complaints, threshold)` → greedy agglomerative (centroid updated as running avg)
- `assignClusterIds(complaints, clusters, prefix='CL_SEM')` → format: CL_SEM_Ward7_WATER_0

**SIMILARITY_THRESHOLD = 0.75** (in weights.js)

---

## 7. API Endpoints (Express — port 3001)

**POST /api/extract-complaint**
Request: `{ text, constituency? }` → Response: `{ isMock, issue_type, location, urgency, affected_group, cluster_id, embedding: [float×768] }`
Fallback: getSmartFallback() keyword heuristic when API key missing.

**POST /api/embed-complaint**
Request: `{ text }` → Response: `{ isMock, embedding: [float×768] }`
Mock: new Array(768).fill(0) when key missing.

**POST /api/cste-state**
Request: `{ ward?, clusters? }` → Response: `{ ward, waterCoverage, facilityDistance, schoolAttendance, healthcareAccess, computedAt, source }`

**POST /api/save-cste-snapshot**
Request: `{ budget_inr, funded_cluster_ids, base_state, future_state, constituency_id }` → Response: `{ success, id }` or `{ success, mock: true }`

**GET /api/geocode-ward?ward=Ward+7&constituency=Varanasi**
Checks ward_coordinates Firestore cache → Google Geocoding API → caches result.
Mock: `{ lat: 28.610, lng: 77.210, mock: true }` when key missing.

**POST /api/generate-report**
Request: `{ reportData: { totalComplaints, activeIssues, budget, topProjects: [...] } }` → PDF binary.

---

## 8. Environment Variables (.env)

```
# Firebase (Client SDK)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Gemini AI (server + embedding)
VITE_GEMINI_API_KEY=

# Google Maps
VITE_MAPS_API_KEY=

# Firebase Admin reads from: serviceAccountKey.json (in janmitra-app root)
```

**Fallback rules:**
- No Firebase → `localStorage` for clusters
- No Gemini → keyword fallback + zero-vector embedding
- No Maps → styled placeholder list in MapPanel

---

## 9. Key Component Notes

**App.jsx:** State-based routing via `currentView`. Values: home|issues|portfolio|simulator|wardmap|citizen|reports|settings|help. reports/settings/help render `<PlaceholderView>`.

**MapPanel.jsx (Phase 9):** Uses `@googlemaps/react-wrapper`. Dark style map. Markers use google.maps.SymbolPath.CIRCLE. Loads wards.geojson into map.data. Fallback to text list if API key missing.

**CSTEPanel.jsx:** POSTs to `/api/cste-state` with clusters prop. Shows waterCoverage, facilityDistance, schoolAttendance, healthcareAccess with animated bars.

**CitizenWidget.jsx:** Web Speech API for voice. Language: `rec.lang = i18n.language === 'hi' ? 'hi-IN' : 'en-US'`. Calls `/api/extract-complaint`. Saves to Firestore complaints collection including `embedding` field.

**BudgetSimulator.jsx:** Calls `greedyBudgetSelect(rankedClusters, budget)`. Calls `simulateCSTE(fundedClusters, clusters)` — BOTH args required. On confirm: POSTs to `/api/save-cste-snapshot`.

---

## 10. Known Bugs (Phase 10 — To Fix)

| ID | File | Bug | Fix |
|---|---|---|---|
| BUG-01 | CitizenWidget.jsx | rec.lang not set for Hindi | rec.lang = i18n.language === 'hi' ? 'hi-IN' : 'en-US' |
| BUG-02 | BudgetSimulator.jsx | simulateCSTE() missing second arg | simulateCSTE(fundedClusters, clusters) |
| BUG-03 | CitizenWidget.jsx | embedding not saved to Firestore | include embedding: extractedData.embedding in addDoc call |
| BUG-04 | JanMitra_AI_Pitch_Deck.md | Priority scores in deck don't match engine output | Re-run engine on seed data, update deck |
| BUG-05 | JanMitra_AI_Pitch_Deck.md | "Offline Queuing" claimed but not implemented | Remove claim |

---

## 11. Constituency Data

- Pilot: Varanasi (ID: varanasi)
- Wards seeded: Ward 3, Ward 7, Ward 9
- Issue types: water, road, health, education
- Default budget: 3500000 INR (₹35 Lakh)
- TopBar has switcher for Lucknow/Amethi but no data seeded for those

---

## 12. Critical Rules for Any Agent

1. NEVER modify `src/scoring/priorityEngine.js` formula or weights in `weights.js` — validated.
2. Every Vertex AI, Maps, and Gemini call must have a graceful `// MOCK` fallback path.
3. `computeRankings()` runs client-side in the browser — scoring is NOT on the server.
4. Always include `constituency_id` when writing new cluster documents to Firestore.
5. `simulateCSTE(fundedClusters, allClusters)` — always pass BOTH arguments.
6. Tailwind is v4 — use `@import "tailwindcss"` syntax only.
