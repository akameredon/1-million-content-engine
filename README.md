# AI App Starter

The reusable, mobile-first starting point for new software projects in the AI App Factory. It includes React, Vite, a responsive UI, React render smoke tests, a DOM-backed interaction test, and automated production-build verification.

## Quick start

Requirements: Node.js 22.13 or newer in the Node 22 line (or another compatible current LTS).

```bash
npm ci
npm test
npm run build
npm run dev
```

Framework and build-tool dependencies are pinned, and `package-lock.json` records the full dependency tree. CI uses `npm ci` so builds install the exact lockfile versions. The interaction test mounts the real checklist in a DOM environment and verifies that checking and unchecking items updates both the visible count and accessible progress value.

## Start a new product

1. Use GitHub's **Use this template** action to create a new repository.
2. Rename the product in `index.html` and `src/App.jsx`.
3. Read `AGENTS.md` and complete `PROJECT_BRIEF.md` before substantial coding.
4. Build one end-to-end user journey first; keep later features out of the MVP.
5. Add a backend only when the product needs it. Keep credentials in server-side/provider environment settings, never source code.
6. Run tests and the production build. GitHub Actions does this on every push and pull request.
7. Deploy a preview and test the critical journey on a phone-sized viewport before release.

No database, authentication, payment provider, or paid AI API is included by default. Add only what the product needs, and inspect security and cost first.

Canonical operating process: [AI App Factory](https://github.com/akameredon/ai-app-factory).
