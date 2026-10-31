# 1 Million Content Engine

A free-first, mobile-ready workspace for turning a topic and core idea into batches of original finance, marketing, and business content drafts.

## Current MVP

- Generate up to 5,000 short drafts per batch using a transparent local pattern engine.
- Optionally generate up to 10 AI-assisted drafts per request through a protected server-side Google Gemini adapter; AI output still passes through the local quality and evidence-review workflow.
- Browse an initial research library covering five public creator sources across finance and marketing.
- Filter creator research by category or search by creator, topic, or technique.
- Select a research-derived pattern or auto-mix all five when generating drafts.
- Recombine seven content DNA dimensions: hook, audience lens, teaching structure, evidence approach, story device, objection handling, and call to action.
- Attach a deterministic DNA signature and component trace to every draft; report the percentage of unique signatures in the current library.
- Export DNA signatures and component metadata alongside research provenance in CSV.
- Preserve pattern IDs and source IDs in each draft and in CSV exports.
- Score drafts from 0–100 using transparent local heuristics for length, exact/near-duplicates, risky promises, financial instructions, and claims needing evidence.
- Preserve structured quality flags, similarity references, and review scores in CSV; show the average score and duplicate counts in the workspace.
- Attach claim-level evidence records (claim, URL, title, publisher, date, excerpt/notes) separately from creator-pattern provenance.
- Record explicit human review decisions; finance drafts and flagged numeric/evidence claims remain blocked until the source is marked human-verified.
- Preserve evidence metadata, review state, and publication-readiness reasons in CSV.
- Keep drafts in browser storage, copy individual posts, and export the complete library as CSV.
- Filter drafts that pass basic checks from drafts needing review.

**Important:** The research library is a small, manually curated starter set based on public official creator pages, articles, and episode notes. It is not a comprehensive audit of their channels, does not measure why their content succeeds, and does not claim that a pattern caused growth. It does not scrape posts, copy scripts, train on creator accounts, or imitate distinctive voices. The local generator is a rule-based recombination engine. Optional AI generation is available only when the server owner configures the protected Gemini endpoint and access code. DNA variety is a structural diversity signal, not a guarantee that every post is factually correct, meaningfully distinct to a human reader, or ready to publish. "Ready" means only that these local heuristics found no flagged issue; it is not source verification, semantic originality certification, financial/legal review, or editorial approval. Similarity detection is approximate and uses bounded candidate comparisons to keep large batches responsive. A supplied URL is never treated as proof. A human reviewer must inspect the source and explicitly attest that it supports the stated claim. This is an editorial attestation, not independent automated fact-checking; reviewers remain responsible for source quality, context, dates, and excerpt accuracy. Rejected or merely provided sources do not pass the evidence gate. Browser-local data is not a secure multi-user review system.

## Optional AI generation (Google Gemini)

AI generation is disabled until the server owner configures both server-side environment variables:

- `GEMINI_API_KEY`: a key created in [Google AI Studio](https://aistudio.google.com/apikey).
- `CONTENT_ENGINE_ACCESS_TOKEN`: a long, random access code shared only with authorized users.
- `GEMINI_MODEL` (optional): defaults to `gemini-3.1-flash-lite`.

For a Vercel deployment, add these as server environment variables (not `VITE_*` variables), then redeploy. The API key is sent to Gemini from the server in a request header; it is never sent to the browser. The access code is entered into the page at runtime and is not saved to local storage. For local Vite development, expose the same variables to the shell before running the dev server. The Vite config mounts the same API handler at `/api/generate` for local development and preview.

AI requests are limited to 10 drafts each. A small per-instance request throttle is included, but it is not a full account, billing, or abuse-prevention system. Free-tier availability and quotas depend on the Google project, model, and current rate limits; this project does not guarantee a particular daily volume. Google's Gemini free tier may use submitted content to improve its products. Do not submit confidential client information, personal data, or sensitive financial details. AI output is not fact-checked; every draft still needs human review and claim-level evidence where applicable.

Official references: [Gemini models](https://ai.google.dev/gemini-api/docs/models), [pricing and free-tier details](https://ai.google.dev/gemini-api/docs/pricing), [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits), and [structured output](https://ai.google.dev/gemini-api/docs/structured-output).

## Run locally

Requires Node.js 22.13+.

```bash
npm ci
npm test
npm run build
npm run dev
```

## Product workflow

Research → Learn general mechanics → Recombine → Generate → Quality review → Approve → Publish → Measure.

The long-term goal is to generate a large content inventory, including potentially one million variations in a batch-processing environment. That is a generation target, not a claim about current capacity or permission to publish at that volume. Each social platform has its own API access, rate limits, spam rules, and publishing requirements. Publishing integrations remain out of scope until official API access, authorization, and platform-specific safeguards are configured.

## Next milestones

1. Expand creator coverage with dated samples, transcript-level observations, and independent human review.
2. Expand AI generation with quota-aware batching, secure multi-user authentication, and provider-specific adapters; the first Gemini adapter is optional and requires server environment setup.
3. Add compliant source retrieval and stronger claim extraction; current evidence review is manual and claim-level.
4. Add review queues and content calendar.
5. Implement official platform adapters only after permissions and rate limits are verified.

No database, account system, analytics, or paid subscription is required for the local MVP. AI mode requires an explicitly configured server-side Gemini key and access code. Drafts stay in the browser unless exported.
