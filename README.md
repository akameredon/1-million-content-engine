# 1 Million Content Engine

A free-first, mobile-ready workspace for turning a topic and core idea into batches of original finance, marketing, and business content drafts.

## Current MVP

- Generate up to 5,000 short drafts per batch using a transparent local pattern engine.
- Combine reusable communication frameworks: contrarian education, story-led teaching, numbers-first analysis, direct response, and myth-to-method explanation.
- Run basic quality checks for length, duplicates, and claims that need evidence.
- Keep drafts in browser storage, copy individual posts, and export the complete library as CSV.
- Filter drafts that pass basic checks from drafts needing review.

**Important:** This first milestone does not scrape creators, train on creator accounts, call an AI model, verify factual claims, or publish to social platforms. Frameworks are broad communication patterns, not imitations of named creators. "Ready" means only that basic automated checks found no flagged issue; it is not fact-checking or editorial approval.

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

1. Add a source-backed creator research library with citations, dates, and human review.
2. Add optional AI provider adapters behind explicit configuration; no paid provider is assumed.
3. Improve originality, duplicate detection, and evidence checks.
4. Add review queues and content calendar.
5. Implement official platform adapters only after permissions and rate limits are verified.

No backend, login, analytics, AI provider, or paid subscription is required for this local MVP. Drafts stay in the browser unless exported.
