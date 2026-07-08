<div align="center">

# 🇮🇳 JanMitra AI

### *AI-Powered Civic Intelligence Platform for Indian Constituencies*

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com)
[![Gemini AI](https://img.shields.io/badge/Gemini_2.5_Flash-AI-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev)
[![Google Maps](https://img.shields.io/badge/Google_Maps-API-34A853?style=for-the-badge&logo=googlemaps)](https://developers.google.com/maps)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**Transforming how elected representatives understand, prioritize, and act on citizen needs — at the ward level, in real time.**

[Features](#-features) · [Architecture](#-architecture) · [Quick Start](#-quick-start) · [API Reference](#-api-reference) · [Contributing](#-contributing)

</div>

---

## 🧭 The Problem

India's 4,120+ parliamentary constituencies serve an average of **1.5 million citizens each**. Yet most elected officials still rely on paper complaint registers, informal channels, and gut feeling to allocate development budgets. Issues remain unaddressed, budgets are misallocated, and marginalized communities are overlooked.

**JanMitra AI changes this** — by turning raw citizen grievances into AI-ranked, data-driven development decisions.

---

## ✨ Features

### 🧠 AI-Powered Complaint Intelligence
- Citizens submit grievances in **natural language** (Hindi or English)
- **Gemini 2.5 Flash** extracts `issue_type`, `ward`, `urgency`, and `affected_group` from free-form text
- **`text-embedding-004`** converts complaints to 768-dimensional semantic vectors for intelligent clustering
- Smart fallback parser handles cases when the AI key is unavailable — **no-fail demo mode**

### 📊 Constituency Dashboard
- Live KPI cards: total complaints, critical issues, available budget, active clusters
- Real-time Firestore subscription with per-constituency filtering
- CSTE health indicators: water coverage, school attendance, healthcare access, facility distance

### 🗂️ Issues & Cluster Management
- AI-grouped complaint clusters by `(ward × issue_type)` similarity
- Priority score breakdown: **Need Score** · **Impact Score** · **Synergy Score**
- Recurrence tracking and vulnerability indexing per affected group

### 💡 Portfolio Planner
- Ranked project list sorted by **Impact-per-Rupee** (CIO Score formula)
- Cross-cluster synergy detection for co-located issues in the same ward
- One-click "Add to Portfolio" with budget auto-deduction
- PDF report generation via Puppeteer (server-side rendering)

### 💰 Budget Simulator
- Greedy knapsack algorithm for optimal budget allocation
- Real-time cost vs. impact visualization
- Save CSTE snapshots to compare before/after funding scenarios

### 🗺️ Ward Map
- Interactive Google Maps overlay with cluster pins
- Color-coded markers by issue type (water / road / health / education)
- Click-through to issue detail from map

### 🙋 Citizen Widget
- Mobile-first public-facing complaint portal
- Multilingual UI: **English** and **हिंदी** (i18next)
- Works offline using localStorage fallback when Firebase is not configured

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 Client (React 19 + Vite)                 │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │Dashboard │  │  Issues  │  │Portfolio │  │  Ward   │ │
│  │  (KPIs)  │  │   Page   │  │ Planner  │  │   Map   │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │        Priority Engine (Client-side JS)           │   │
│  │  computeRankings() · greedyBudgetSelect()        │   │
│  │  WEIGHTS · SYNERGY_MATRIX · VULNERABILITY_INDEX  │   │
│  └──────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────┘
                            │ REST API (Express 5)
┌───────────────────────────▼─────────────────────────────┐
│                  Server (Node.js)                         │
│                                                          │
│  POST /api/extract-complaint  → Gemini 2.5 Flash         │
│  POST /api/embed-complaint    → text-embedding-004        │
│  POST /api/cste-state         → Dynamic civic metrics     │
│  POST /api/generate-report    → Puppeteer PDF             │
│  POST /api/save-cste-snapshot → Firestore Admin           │
│  GET  /api/geocode-ward       → Google Maps Geocoding     │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│               Firebase / Google Cloud                     │
│                                                          │
│  Firestore: clusters · cste_snapshots · ward_coordinates │
│  Google Maps JS API (Ward visualization)                 │
│  Gemini API (Extraction + Embeddings)                    │
└─────────────────────────────────────────────────────────┘
```

### Scoring Engine — CIO Formula

```
Priority Score = (Need Score × Impact Score × (1 + Synergy)) / Cost (Lakhs ₹)

Need Score   = w1·Urgency + w3·Recurrence + w4·ServiceGap
Impact Score = w2·Population(norm) + w5·VulnerabilityIndex
Synergy      = Σ SYNERGY_MATRIX[issueA + issueB] for co-ward clusters
```

All weights are fully configurable in `src/scoring/weights.js`.

---

## 📁 Project Structure

```
janmitra-app/
├── src/
│   ├── pages/
│   │   ├── Dashboard.jsx          # KPI overview + CSTE panel
│   │   ├── IssuesPage.jsx         # Cluster list + complaint detail
│   │   ├── PortfolioPlanner.jsx   # Ranked projects + budget picker
│   │   ├── BudgetSimulator.jsx    # Budget optimization + scenarios
│   │   ├── WardMapPage.jsx        # Google Maps cluster visualization
│   │   └── CitizenWidget.jsx      # Public complaint submission portal
│   ├── components/
│   │   ├── Sidebar.jsx            # Navigation sidebar / bottom nav bar
│   │   ├── TopBar.jsx             # Constituency selector + notifications
│   │   ├── MapPanel.jsx           # Reusable map component
│   │   ├── KpiCard.jsx            # Metric card component
│   │   ├── CSTEPanel.jsx          # Civic State Tracking Engine display
│   │   ├── ScoreTriadChip.jsx     # Need / Impact / Synergy chip
│   │   └── ExplanationBlock.jsx   # Score explanation tooltip
│   ├── scoring/
│   │   ├── priorityEngine.js      # CIO score + greedy budget algorithm
│   │   ├── clusterEngine.js       # Complaint → cluster aggregation
│   │   ├── csteEngine.js          # CSTE metric computation
│   │   └── weights.js             # All tuneable scoring constants
│   ├── i18n/locales/
│   │   ├── en/                    # English translations
│   │   └── hi/                    # Hindi (हिंदी) translations
│   ├── firebase.js                # Firestore client initialization
│   └── App.jsx                    # Root: routing + shared state
├── server/
│   └── index.js                   # Express API server (all AI endpoints)
├── scripts/
│   ├── seed.js                    # Seed Firestore with demo clusters
│   └── recluster.js               # Re-run clustering on existing data
├── .env.example                   # Required environment variable template
├── firebase.json                  # Firebase hosting config
└── vite.config.js                 # Vite build config
```

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18.x |
| npm | ≥ 9.x |
| Firebase project | Optional — demo mode works without it |
| Google Gemini API Key | Optional — smart fallback enabled |

### 1. Clone the Repository

```bash
git clone https://github.com/ShresthSingh01/CodeForCommunities.git
cd CodeForCommunities/janmitra-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Open `.env` and fill in your keys:

```env
# Firebase Web SDK (Client Side)
VITE_FIREBASE_API_KEY="your_firebase_api_key"
VITE_FIREBASE_AUTH_DOMAIN="your_project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your_project_id"
VITE_FIREBASE_STORAGE_BUCKET="your_project.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
VITE_FIREBASE_APP_ID="your_app_id"

# Google AI — Gemini 2.5 Flash + text-embedding-004
VITE_GEMINI_API_KEY="your_gemini_api_key"

# Google Maps JavaScript API
VITE_MAPS_API_KEY="your_maps_api_key"
```

> **Demo Mode:** Leave any key as the placeholder value. The app automatically activates its built-in fallback parser and localStorage persistence. Every screen is fully functional for demos — no API keys required.

### 4. (Optional) Seed Firebase with Demo Data

```bash
# Place your Firebase serviceAccountKey.json in the project root first
npm run seed
```

### 5. Run the App

```bash
npm start
```

This concurrently starts the Express API server and the Vite dev client.

| Service | URL |
|---------|-----|
| Frontend (Vite) | http://localhost:5173 |
| Backend API | http://localhost:3001 |

---

## 🔌 API Reference

All endpoints are served by the Express 5 server on port `3001`.

### `POST /api/extract-complaint`
Extract structured civic data from free-form citizen text using Gemini AI.

**Request:**
```json
{
  "text": "Ward 7 mein nali band ho gayi hai, ghar mein paani aa raha hai",
  "constituency": "varanasi"
}
```

**Response:**
```json
{
  "isMock": false,
  "issue_type": "water",
  "location": { "lat": 28.62, "lng": 77.215, "ward": "Ward 7" },
  "urgency": "critical",
  "affected_group": "residents",
  "cluster_id": "CL_VAR_Ward7_WATER",
  "embedding": ["...768 floats..."]
}
```

---

### `POST /api/embed-complaint`
Generate a 768-dimensional semantic embedding via `text-embedding-004`.

**Request:** `{ "text": "road broken near school" }`
**Response:** `{ "isMock": false, "embedding": [ ...768 floats... ] }`

---

### `POST /api/cste-state`
Compute real-time CSTE (Civic State Tracking Engine) health metrics for a ward.

**Request:** `{ "ward": "Ward 7", "clusters": [ ...cluster objects... ] }`

**Response:**
```json
{
  "ward": "Ward 7",
  "waterCoverage": 72.5,
  "facilityDistance": 3.8,
  "schoolAttendance": 81.2,
  "healthcareAccess": 65.0,
  "computedAt": 1751989933000,
  "source": "client-provided"
}
```

---

### `POST /api/generate-report`
Generate a PDF constituency report via server-side Puppeteer rendering.

**Request:** `{ "reportData": { "totalComplaints": 42, "activeIssues": 7, "budget": 3500000, "topProjects": [...] } }`
**Response:** Binary PDF stream (`Content-Type: application/pdf`)

---

### `POST /api/save-cste-snapshot`
Persist a before/after CSTE snapshot to Firestore for longitudinal impact analysis.

---

### `GET /api/geocode-ward?ward=Ward+7&constituency=Varanasi`
Geocode a ward name to lat/lng via Google Maps API, with Firestore result caching.

---

## 🌐 Internationalization

JanMitra supports **English** and **हिंदी** using `i18next` with browser language auto-detection.

- Language toggle available in the Citizen Widget
- Add new locales by creating `src/i18n/locales/<lang>/translation.json`

---

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start Express server + Vite client concurrently |
| `npm run client` | Start Vite frontend only |
| `npm run server` | Start Express API server only (hot-reload via `--watch`) |
| `npm run seed` | Seed Firestore with demo cluster data |
| `npm run recluster` | Re-run clustering on existing complaint data |
| `npm run build` | Build optimized production bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run oxlint static analysis |

---

## 🛡️ Resilience & Demo Mode

JanMitra is engineered to **never fail**. Every external dependency has a graceful fallback:

| Dependency | Fallback Behavior |
|------------|------------------|
| Firebase not configured | Uses `localStorage` for full persistence |
| Gemini API key missing | Smart keyword-based parser (Hindi + English regex rules) |
| `text-embedding-004` unavailable | Returns zero-vector (768 dims); clustering still works |
| Firebase Admin not initialized | All write endpoints return mock success responses |
| Google Maps Geocoding unavailable | Returns hard-coded ward center coordinates |

This means the app runs **100% functionally for a live hackathon demo** even with zero API keys.

---

## 🛣️ Roadmap

- [ ] **Citizen Auth** — Phone OTP login via Firebase Auth
- [ ] **Photo Attachments** — Upload and link images to complaints
- [ ] **WhatsApp Integration** — Accept complaints via WhatsApp Business API
- [ ] **Multi-Constituency Scale** — Extend dynamically beyond demo constituencies
- [ ] **Predictive Analytics** — Forecast issue recurrence using embedding history
- [ ] **Offline PWA** — Service worker + background sync for rural connectivity

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

---

## 🙏 Acknowledgements

- [Google Gemini API](https://ai.google.dev) — Complaint extraction and semantic embeddings
- [Firebase](https://firebase.google.com) — Real-time database and hosting
- [Google Maps Platform](https://developers.google.com/maps) — Ward visualization and geocoding
- [React](https://react.dev) & [Vite](https://vitejs.dev) — Frontend framework and build tooling
- [Puppeteer](https://pptr.dev) — Server-side PDF report generation
- [i18next](https://www.i18next.com) — Internationalization (Hindi + English)

---

<div align="center">

**Built with ❤️ for India's 1.4 billion citizens**

*JanMitra AI — Jan ki awaaz, data ki zabaan*
*(The voice of the people, spoken in the language of data)*

</div>
