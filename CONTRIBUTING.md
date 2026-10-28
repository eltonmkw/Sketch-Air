# Contributing to Sketch Air

## Set up and choose a change

Follow [developer setup](./docs/DEVELOPMENT.md) to run the app. Read [repository instructions](./AGENTS.md) before making changes, and the [design reference](./DESIGN.md) before changing the interface or interaction model. Documented gaps are context, not a requirement to fix them as part of another task.

Use a short-lived branch from the latest `main`, keep changes focused, and open a pull request targeting `main`. Describe the problem, resulting behavior, and how you verified it. Preserve unrelated work and avoid adding a backend or dependencies for routine UI changes.

## Maintain behavior and documentation

- Keep drawing usable without an API key and preserve the dialog's storage, Google-request, and billing disclosures.
- Never commit real credentials or embed shared keys in client code. Use mocks for verification unless real API use is authorized.
- Clean up camera and recognition resources. Keep mirrored video, ink, cursor, and exported sketches aligned.
- Keep gesture instructions consistent with recognition behavior, and preserve session-only gallery storage.
- Use accessible names, keyboard-operable controls, visible focus, and textual status feedback for UI changes. Account for reduced motion when changing animation.
- Keep style labels, icons, prompt modifiers, and types synchronized. Update `DESIGN.md` and `AGENTS.md` when an approved design change alters their conventions.
- Put user instructions in [README.md](./README.md), setup and technical notes in [DEVELOPMENT.md](./docs/DEVELOPMENT.md), and verification instructions in [TESTING.md](./docs/TESTING.md).

## Verify your change

Follow the [testing guide](./docs/TESTING.md). For code changes, run applicable tests, TypeScript checks, and the production build when dependencies are available. Exercise affected interactions in a browser. Documentation-only changes need content, source-reference, and link checks rather than new tests; normal CI still applies.

Before merging, inspect the **Build and typecheck** CI result for the latest PR commit. Locate the Vercel Preview and record its URL, branch, commit SHA, and deployment status. Confirm it matches the current PR head. An older Ready deployment does not verify the current change; report a missing matching preview rather than substituting Production.

For app changes, exercise affected flows on that Preview, inspect browser errors and failed requests, and check relevant viewport sizes. A Ready build or HTTP 200 alone does not verify the app. For documentation-only PRs, review the diff, references, CI, and deployment metadata when available; unrelated camera or microphone checks are unnecessary.

Report passed, failed, and untested checks separately, identifying mocks and unavailable hardware, credentials, network access, or deployment evidence. Do not claim live generation or media testing based on mocked tests.

## Merge and release

Opening a PR does not authorize merging or releasing it. After an authorized merge, confirm the Production deployment comes from the merged `main` commit, reaches Ready, and serves the intended domain. For app changes, run a focused smoke test of changed behavior and the main app flow. Report failures with the deployment URL and commit. Promotion, rollback, and Production configuration changes require release authorization.

[Back to README](./README.md)
