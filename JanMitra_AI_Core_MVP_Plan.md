# JanMitra AI — Core MVP Plan (Time-Constrained Build)
**Goal:** ship the smallest thing that still *feels* like the full vision on stage. Judges see 4 screens and 90 seconds of interaction — build for that, not for completeness.

---

## 1. The Rule That Governs Every Cut

**Build real what judges interact with. Fake real what judges only watch.**
A live-clickable budget slider must actually recompute. A "WhatsApp integration" can be a styled web widget — nobody's texting it live on stage.

---

## 2. MVP Feature Tier List

| Tier | Feature | Build approach |
|---|---|---|
| **Must be REAL** | Priority ranking + budget simulation | Real scoring algorithm, real recompute on slider drag — this is your whole pitch, never fake it |
| **Must be REAL** | Explanation cards | Real Gemini call, grounded on real computed scores |
| **Must be REAL** | Ranked dashboard + map | Real Firestore data (synthetic complaints), real Google Maps pins |
| **Should be REAL, keep small** | Text complaint submission → extraction → cluster | Real Gemini extraction on ~15–20 seeded complaints, one live demo submission on top |
| **Fake convincingly** | Voice input | Use browser Web Speech API for live transcription demo (fast, no Cloud STT setup) — swap for Cloud Speech-to-Text in "roadmap" slide, not code |
| **Fake convincingly** | WhatsApp channel | Build citizen widget styled exactly like WhatsApp UI; mention real WhatsApp Cloud API as next step, don't integrate it |
| **Cut entirely** | Image input | Mention as roadmap only — do not build, do not demo |
| **Cut entirely** | Multi-ward / full constituency data | Seed only 3 wards with rich synthetic data — depth over breadth |
| **Cut entirely** | Login/auth flows, user roles, settings pages | One hardcoded "MP Dashboard" view, no auth screens in the demo path |
| **Cut entirely** | Looker Studio embed, BigQuery live joins | Pre-join public data into Firestore at seed time; BigQuery becomes a "how we'd scale it" slide, not a live call |

**Net effect:** you demo 4 screens, 2 of which run real AI calls live, and the simulation engine is 100% real and interactive — that's the part that wins.

---

## 3. The 4 Screens to Actually Build (nothing else)

1. **Citizen Widget** — WhatsApp-styled, text + Web-Speech voice, submits one live complaint during demo
2. **MP Dashboard (Threaded Ledger)** — ranked docket stack + map, pre-seeded with 3 wards / ~15 clusters
3. **Explanation Card** — opens on docket click, real Gemini-generated, grounded on computed scores
4. **Budget Simulation Slider** — same dashboard, slider overlay that live-reshuffles the ledger

No settings, no onboarding, no multi-page nav. One flow, front to back.

---

## 4. Data Shortcut: Seed, Don't Scrape

Don't waste hours pulling live census/BigQuery data. Instead:
- Hand-write 15–20 realistic synthetic complaints across 3 wards, 3–4 issue categories, in Firestore
- Hand-write matching "public data" facts per ward (population, nearest facility distance, recent rainfall) — stored as flat JSON, not a live pipeline
- This gives you full control over the demo narrative (you can guarantee Ward 7 water issue is dramatically #1) instead of hoping live data cooperates

---

## 5. Build Order (compressed)

1. **Firestore seed script** — wards, complaints, public data facts (do this first, everything depends on it)
2. **Priority scoring function** — pure JS/Python function, unit-test it against your seed data until Ward 7 water is convincingly #1
3. **Dashboard: docket stack + map** — static render from seeded scores first, styling per design plan
4. **Budget slider** — wire slider to re-run scoring function client-side, re-render dockets (no backend round-trip needed — keep it instant and snappy)
5. **Explanation card** — one Gemini API call, prompt = pre-computed evidence bullets → narrate only, never let it invent numbers
6. **Citizen widget** — text input first, Web Speech API layered in only if time remains
7. **Polish pass** — stamps, thread animation, fonts, spacing — only after steps 1–5 work end-to-end

**Hard rule:** do not touch step 7 (visual polish) until the ranking + simulation is fully working. A judge forgives plain styling on a working brain; they don't forgive broken logic behind pretty UI.

---

## 6. Demo Script (fits the MVP exactly)

1. Submit one complaint live via the citizen widget (text or voice) → watch it land in the dashboard
2. Point at the ledger: "these are real citizen reports, clustered and ranked — not a list, a decision"
3. Click top docket → show the case-file explanation with real numbers
4. Drag the budget slider → ranking reshuffles live → narrate the tradeoff
5. Close: "Everything you just saw computing was real. The voice, WhatsApp, and full census integration are a two-week extension of this same engine."

That last line pre-empts the "is this real or a mockup" question judges always ask — you're naming the fake parts before they can catch you at it, which reads as honest engineering judgment, not a gap.

---

## 7. What to Skip Saying No To

If time runs out further, cut in this order and stop wherever you land:
1. Voice input (keep text only)
2. Live complaint submission during demo (use a pre-recorded video insert instead)
3. Map (replace with a simple ward list — ranking + explanation + simulation still carry the demo)

**Never cut:** the priority engine or the budget simulation. If only one thing works end-to-end, it must be that.
