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
- [x] Explicitly out of scope: live creator scraping, cloning exact voices/posts, factual research automation, AI provider calls, auto-publishing, accounts, and backend storage.

## Validation and monetization
- Fastest demand test: use generated drafts in a real creator workflow and ask users to evaluate originality and time saved.
- First pilot/customer: creator or small marketing team.
- Who pays: potential subscription or content-pack purchase after quality and workflow are validated.
- Pricing hypothesis: not set; validate demand before adding payments.

## Constraints
- Platform/devices: mobile-first web, desktop compatible.
- Free-tier/budget: $0; no paid APIs or services.
- Data sensitivity: drafts stored in browser local storage; do not enter confidential client information on shared devices.

## Technical decisions
- Frontend: React 19 + Vite.
- Backend/database: none in MVP.
- Authentication: none in MVP.
- External services/payments: none.
- Deployment target: not configured/verified.

## Verification evidence
- Build/test results: pending execution in a Node.js environment.
- Preview URL: not configured.
- Known gaps: local rule-based output, basic quality checks only, browser-local persistence, no auto-publishing.
- Production approval: not requested.
- Customer/revenue evidence: none yet.
