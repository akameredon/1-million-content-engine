# Project Brief — 1 Million Content Engine

## Outcome
Generate large batches of original, short finance and marketing content drafts from a topic and core idea; review them, store them, and export them for later publishing.

## Target user and problem
- User: creators, educators, marketers, and business owners with global audiences.
- Problem: creating a steady supply of useful short-form content takes time and repetitive effort.
- Current workaround: manually study creators, brainstorm angles, and write each post.

## Smallest useful release
- [x] Main journey: enter category, topic, lesson, audience, and batch size → generate drafts → run basic checks → copy/export.
- [x] Acceptance criteria: mobile-friendly UI; configurable batch up to 5,000; drafts stored locally; CSV export; transparent framework labels; no external API dependency.
- [x] Creator Intelligence v1: five manually curated creator records, five public source references, category/search filters, five generalized patterns, selected-pattern generation, and source IDs preserved in CSV.
- [x] Content DNA v1: seven modular dimensions, deterministic seeded recombination, per-draft component traceability, DNA signatures, diversity scoring, and CSV metadata.
- [x] Quality and Originality v1: exact and approximate near-duplicate checks, similarity references, quality scores, finance-risk language flags, numeric/evidence prompts, and CSV review metadata.
- [x] Evidence and Fact Verification v1: claim-specific source records, safe URL validation, explicit human-verified/rejected states, finance and flagged-claim approval gates, and CSV evidence trace.
- [x] AI Generation v1: optional server-side Gemini adapter, short-lived access-code gate, same-origin check, request throttling, structured JSON output, 10-draft request cap, local quality checks, and local Vite API middleware.
- [x] Explicitly out of scope: live creator scraping, cloning exact voices/posts, transcript-level systematic analysis, automated fact verification, automatic publishing, full user accounts, database storage, and million-per-day AI throughput.

## Validation and monetization
- Fastest demand test: use generated drafts in a real creator workflow and ask users to evaluate originality and time saved.
- First pilot/customer: creator or small marketing team.
- Who pays: potential subscription or content-pack purchase after quality and workflow are validated.
- Pricing hypothesis: not set; validate demand before adding payments.

## Constraints
- Platform/devices: mobile-first web, desktop compatible.
- Free-tier/budget: $0; no paid APIs or services.
- Data sensitivity: drafts stored in browser local storage; do not enter confidential client information on shared devices.

## AI provider decision
- Provider: Google Gemini Developer API, optional.
- Default model: `gemini-3.1-flash-lite`; model is server-configurable.
- Credentials: server environment only (`GEMINI_API_KEY` and `CONTENT_ENGINE_ACCESS_TOKEN`); no browser key storage.
- Per-request cap: 10 AI drafts; free quotas vary and are not guaranteed.
- Free-tier data note: Google states that free-tier submitted content may be used to improve products; do not submit confidential or sensitive data.
- Server endpoint: Vercel-style `api/generate.js`; local Vite dev/preview middleware uses the same handler.

## Technical decisions
- Frontend: React 19 + Vite.
- Backend/database: no persistent database; optional serverless generation endpoint only.
- Authentication: none in MVP.
- External services/payments: optional Gemini Developer API; no payments.
- Deployment target: not configured/verified.

## Verification evidence
- Build/test results: pending CI for AI Generation v1.
- Preview URL: not configured.
- Known gaps: small manually curated source sample; qualitative observations only; no transcript-level audits or performance attribution; local rule-based output plus optional server-configured Gemini AI; AI output is not fact-checked; structural DNA diversity is not semantic originality; quality checks are heuristic; evidence approval is a human attestation and not an independent fact-check; no automated source retrieval; browser-local persistence; no auto-publishing.
- Production approval: not requested.
- Customer/revenue evidence: none yet.
