# JanMitra AI — STATE.md

**Project:** JanMitra AI — Constituency Digital Twin + Priority Optimizer
**Milestone:** 1 (Core MVP)
**Current Phase:** 1 (Firestore Seed Data)
**Last Updated:** 2026-07-05

---

## Current Status

**Phase 0 complete.** Ready to begin Phase 1.

## What's Done

- ✅ Phase 0: Vite+React scaffolded, Tailwind v4 design tokens applied, Firebase init script created, Express backend stubbed.
- ✅ Project initialized (PROJECT.md, REQUIREMENTS.md, ROADMAP.md)
- ✅ Git initialized
- ✅ All source documents analyzed (PRD, Core MVP Plan, UI/UX Design Plan, Master Build Prompt)
- ✅ Tech stack confirmed: React+Vite+Tailwind / Node Express / Firestore / Gemini API / Web Speech API / Google Maps JS API
- ✅ Backend decision: Local Node/Express (faster for hackathon)
- ✅ API keys: .env placeholders (not available at init time)

## What's Next

Run `/gsd-plan-phase 0` to plan Phase 0 in detail, then execute.

Or immediately begin Phase 0 execution:
1. `npm create vite@latest janmitra-app -- --template react`
2. Install + configure Tailwind with design tokens
3. Firebase SDK init with .env placeholders
4. Express server scaffold

## Key Context for Next Agent

- **3 wards:** Ward 3, Ward 7, Ward 9 (Ward 7 water issue must rank #1)
- **4 issue types:** water, road, health, education
- **Design tokens:** ink-navy, aged-parchment, marigold, seal-red, evidence-teal, slate-ink
- **Scoring weights:** w1=0.25, w2=0.2, w3=0.15, w4=0.2, w5=0.1, w6=0.3
- **Critical component:** EvidenceThread SVG (stroke-draw animation) — do not skip
- **Anti-hallucination:** all Gemini calls must include verbatim grounding instruction
- **Budget simulation:** greedy by ImpactPerRupee descending, client-side only

## Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-07-05 | Local Node/Express over Firebase Cloud Functions | Faster hackathon dev loop |
| 2026-07-05 | Coarse granularity (7 phases) | Matches Master Build Prompt, faster |
| 2026-07-05 | .env placeholders | Keys not available at init |
