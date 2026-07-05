# JanMitra AI — Product Requirements Document
**Track:** People's Priorities Hackathon (Google Technologies Track)
**Pitch:** JanMitra AI helps MPs convert citizen complaints and public data into explainable, multilingual development priorities.

---

## 1. Problem Statement

MP offices receive high volumes of citizen complaints across issues (water, roads, health, education) but have no systematic way to decide **what to fix first** under limited budget. Existing tools (complaint trackers, dashboards) summarize the past — they don't help decide the future. JanMitra AI is a **Constituency Digital Twin + Priority Optimizer**, not a complaint tracker.

---

## 2. Users & Personas

| User | Need |
|---|---|
| Citizen | Submit an issue in their own language, via voice/text/image, with zero friction (WhatsApp-like flow) |
| MP / Office Staff | See a ranked, explainable action plan — not a raw complaint feed |
| Analyst | Simulate budget scenarios and defend prioritization decisions publicly |

---

## 3. Core Pipeline → Google Technology Mapping

| Step | What Happens | Google Tech |
|---|---|---|
| 1. Ingestion | Citizen submits via text/voice/image/WhatsApp | **Firebase Hosting/Auth**, Firebase Cloud Messaging, Business Messages or WhatsApp Cloud API webhook → Cloud Functions |
| 2. Extraction | Language ID, transcription, entity extraction (location, issue type, urgency, affected group) | **Gemini API (multimodal)** for text/image reasoning, **Cloud Speech-to-Text** for voice, **Cloud Translation API** for multilingual normalization, **Cloud Natural Language API** for entity/sentiment |
| 3. Clustering | Group similar complaints into one real "problem" | **Vertex AI** embeddings (`text-embedding-004`) + vector similarity (Vertex AI Vector Search or Firestore + cosine sim for MVP) |
| 4. Public Data Enrichment | Attach census, school/hospital locations, ward boundaries, rainfall data | **BigQuery public datasets**, **Google Maps Platform** (Geocoding, Places) for facility proximity, static datasets in **Cloud Storage** |
| 5. Impact Estimation | Compute service-gap scores per cluster | Cloud Functions / Cloud Run microservice (Python) — deterministic scoring, Gemini for qualitative gap reasoning |
| 6. Priority Engine | Rank projects using weighted multi-criteria scoring | Custom algorithm (Section 5) running on **Cloud Run**, results cached in **Firestore** |
| 7. Explanation | Generate natural-language "why this first" cards | **Gemini API** with structured JSON output grounded in the Evidence Graph (no hallucinated numbers — model only narrates pre-computed scores) |
| 8. Dashboard | MP-facing ranked plan + map + simulation | **React + Firebase Hosting**, **Google Maps JavaScript API** for the map, optional **Looker Studio** embed for analyst view |

**Why this framing wins:** every Google product is doing real work (multimodal ingestion, geodata, embeddings, generative explanation) — not decoration. This directly satisfies "best use of Google technologies" judging criteria.

---

## 4. Evidence Graph — Data Model

Each complaint becomes a node connected to structured facts, stored in **Firestore** (hackathon-speed) with a graph-like schema (upgradeable to Neo4j/Spanner Graph post-hackathon):

```
Complaint {
  id, raw_text, media_url, language, transcribed_text,
  extracted: { issue_type, location{lat,lng,ward}, urgency, affected_group },
  cluster_id, timestamp
}

Cluster (= "Real Problem") {
  id, issue_type, location, complaint_count, recurrence_score,
  affected_population (from enrichment),
  nearest_facility (from enrichment),
  public_evidence[] (e.g. rainfall spike, census gap),
  priority_score, rank, explanation
}
```

Relationships: `Complaint —belongs_to→ Cluster —located_in→ Ward —enriched_by→ PublicDataPoint`

---

## 5. Priority Simulation Engine (Core IP)

**Score formula (transparent, judge-defensible — not a black box):**

```
PriorityScore = w1*UrgencySeverity
              + w2*AffectedPopulation
              + w3*RecurrenceFrequency
              + w4*ServiceGap (distance/access to nearest facility)
              + w5*VulnerabilityIndex (affected group weighting)
              - w6*EstimatedCost
```

- Weights (`w1..w6`) are configurable by the MP office → makes it feel like a real decision tool, not a fixed script.
- `ImpactPerRupee = PriorityScore / EstimatedCost` → answers "best bang for buck."

**Simulation questions the demo must answer live:**
1. "Which 3 projects maximize benefit under ₹X budget?" → knapsack-style greedy/optimization over `ImpactPerRupee`
2. "Which area is most underserved?" → aggregate ServiceGap by ward
3. "What if this issue is solved first?" → recompute affected-population coverage delta

This is the single highest-leverage feature for judge appeal — build it early, not last.

---

## 6. MVP Scope

**In scope:**
- 3–4 issue categories (e.g., water supply, road damage, health access, school infrastructure)
- Text + voice input (image optional stretch), WhatsApp-style chat UI (can simulate via web widget if WhatsApp API approval is slow)
- Clustering via embeddings
- Public data enrichment (synthetic but realistic, 1–2 real datasets if time permits)
- Priority ranking with adjustable weights
- Explanation cards (Gemini-generated, grounded)
- Map + ranked list dashboard
- **One wow feature: live budget simulation slider**

**Out of scope (explicitly do not build):**
- Generic chatbot Q&A
- Full complaint-management CRUD (edit/delete/assign tickets)
- Real WhatsApp Business API approval flow (fake it with a WhatsApp-styled web UI unless approval is already in hand)
- More than 4 issue categories
- Any feature without a demo payoff

---

## 7. Recommended Tech Stack

| Layer | Tech |
|---|---|
| Frontend (Citizen) | React + Vite, styled as chat widget (WhatsApp-like) |
| Frontend (MP Dashboard) | React + Vite + Tailwind, Google Maps JS API, Recharts for simulation charts |
| Auth | Firebase Auth |
| Backend/API | Cloud Run (Python FastAPI) or Cloud Functions (lighter, faster to ship) |
| AI/LLM | Gemini API (1.5/2.x Flash for speed, Pro for explanation quality) |
| Speech | Cloud Speech-to-Text (+ Text-to-Speech for reply-in-voice, stretch) |
| Translation | Cloud Translation API |
| Embeddings/Clustering | Vertex AI `text-embedding-004` |
| Database | Firestore (fast to build), BigQuery for public dataset joins |
| Storage | Cloud Storage (voice notes, images) |
| Hosting | Firebase Hosting |
| Maps/Geo | Google Maps Platform (Geocoding + Maps JS API) |
| Analytics (stretch) | Looker Studio embedded view for "analyst mode" |

This stack is 90%+ Google-native — strong for a Google-technologies track.

---

## 8. Build Order (Hackathon Sprint)

1. **Hour 0–2:** Firestore schema + synthetic dataset (complaints, ward boundaries, facilities, population) generated realistically
2. **Hour 2–5:** Ingestion + extraction pipeline (Gemini + Speech-to-Text + Translation) — get raw complaint → structured JSON working
3. **Hour 5–8:** Clustering (embeddings + similarity) — turn 50+ synthetic complaints into ~8–10 real clusters
4. **Hour 8–11:** Public data enrichment join (Maps API distance-to-facility + census stub)
5. **Hour 11–15:** Priority engine + scoring + simulation logic (this is your differentiator — protect this time block)
6. **Hour 15–19:** Dashboard UI — ranked list, map, explanation cards
7. **Hour 19–22:** Budget simulation slider (the wow feature) + Gemini explanation grounding
8. **Hour 22–24:** Demo polish, script rehearsal, fallback recorded demo video

**Rule:** the priority/simulation engine must work end-to-end before polishing UI. A judge remembers the reasoning, not the CSS.

---

## 9. Demo Script Outline

1. Show a citizen submitting a voice complaint in a regional language → live transcription + extraction (Google AI on display)
2. Cut to dashboard: complaint auto-joins an existing cluster with 40 similar reports
3. Show enrichment: "This cluster is 2.3km from nearest hospital, affects ~1,200 people, ward has 3x rainfall this month"
4. Show ranked action plan with explanation card: "Why this project is #1"
5. **Live wow moment:** drag budget slider from ₹50L to ₹20L → ranking re-optimizes instantly, explain tradeoff
6. Close with the reframe line: "This isn't a complaint tracker. It's a decision system for public money."

---

## 10. Judge Appeal Checklist

- ✅ Real Google AI doing real reasoning (not just an API badge)
- ✅ Explainable, non-black-box scoring
- ✅ Live simulation = interactivity judges remember
- ✅ Narrow, polished scope over broad/unfinished
- ✅ Clear reframe from "tracker" to "decision system" in the pitch itself

---

## 11. Key Risks & Mitigations

| Risk | Mitigation |
|---|---|
| WhatsApp API approval delay | Build WhatsApp-styled web widget as fallback; mention real integration as roadmap |
| Gemini hallucinating numbers in explanations | Prompt Gemini with pre-computed scores only — it narrates, never calculates |
| Clustering quality on synthetic data | Hand-craft synthetic complaints with intentional overlap so clusters are visibly coherent in demo |
| Running out of build time | Priority engine + one clean demo flow > multiple half-built features |
