# Instructions for AI Coding Assistants

Use the canonical process in https://github.com/akameredon/ai-app-factory/blob/main/WORKFLOW.md.

Before editing:
1. Inspect repository instructions, README, package scripts, source, tests, branches/status, and deployment configuration.
2. Identify the user, problem, smallest useful release, and observable acceptance criteria.
3. Reuse existing working code and avoid unrelated redesigns.

While editing:
- Keep changes small and reviewable.
- Preserve existing user data and behavior unless a change is explicitly requested.
- Never hardcode credentials, API keys, service-role keys, or secrets.
- Do not perform destructive database operations or merge/deploy/purchase without the required approval.
- Use free-first dependencies; obtain approval before introducing paid services.
- Isolate customer data, secrets, and production resources per project.

After editing:
- Run relevant tests and `npm run build`.
- Review the diff for unintended changes and secret exposure.
- Report only checks actually run, with their results and remaining risks.
- Distinguish implemented, tested, preview-verified, production-deployed, and customer/revenue-validated.