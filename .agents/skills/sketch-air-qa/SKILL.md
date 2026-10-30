---
name: sketch-air-qa
description: Use when generating QA scenarios, automating approved scenarios, investigating broken tests, or triaging intermittent failures in Sketch Air.
---

# Sketch Air QA workflow

## Start from evidence

Read root `AGENTS.md`, `README.md`, `docs/TESTING.md`, relevant documentation,
implementation, tests, and `.github/workflows/ci.yml` before proposing changes.
State the actual architecture and distinguish requirements, observed behaviour,
assumptions, and questions. Do not implement documented gaps incidentally.

Use the requested mode below. Existing user approval persists: check the
conversation and approved scope before asking for another approval.

## Generate scenarios

1. Trace the feature through UI, state, storage, external calls, and cleanup.
2. Inventory existing coverage; merge duplicate outcomes and propose meaningful gaps.
3. Produce `ID | Title | Risk | Priority | Test layer | Automate? | Reason`.
   Give each automated scenario short actions and a clear expected result.
4. Identify confirmed requirements separately from assumptions and questions.
5. Recommend a small first slice. Obtain scenario approval before implementation
   unless the conversation already authorizes those scenarios.

Keep approved BYOK scenarios and test mappings in
[`docs/qa/byok-scenarios.md`](../../../docs/qa/byok-scenarios.md).
Mark deferred cases explicitly; approval of an initial slice does not authorize
all follow-up work.

## Write tests from approved scenarios

1. Map the scenario ID to a test title and name the regression it catches.
2. Run applicable existing checks first and record the baseline.
3. Inspect real rendered UI before selecting locators. Use Playwright directly
   if browser MCP is unavailable. Prefer roles and labels, then web-first assertions.
4. Follow existing Node `.test.mjs` and Playwright TypeScript conventions.
   Mock provider responses at the network boundary; keep the app and SDK real
   when testing their integration. Use Node tests for service/storage matrices
   and browser tests for observable UI transitions.
5. Run the focused tests. Explain failures before editing tests. Then run
   relevant Node checks, typecheck, build, and the complete local browser suite.
6. Update scenario status and report changes, passed/failed/untested checks,
   mocks, remaining gaps, and manual checks. A failing assertion stays evidence.

Never require, read, or expose a real API key, and never make paid provider calls.
Use only synthetic test values. Block external requests except local app traffic;
fulfill provider requests with deterministic fixtures. Test-mode dummy acceptance
must remain confined to explicit local/Preview TESTING mode, with generation
disabled and Production veto intact. Real-service-path tests belong to the local
production build, not an aliased remote TESTING Preview.

Keys intentionally persist as plaintext only after Remember plus Done. Assert
the appropriate boundary, not a blanket ban on browser storage. Inspect emitted
requests for keys in URLs, bodies, or unrelated headers; check logs, errors, and
retention. Use synthetic provider errors that echo the sentinel to test redaction.
Do not claim those checks prove safety for untested generation paths.

Never skip, weaken, swallow, or remove an assertion to get green. Never add fixed
sleeps, blanket retries, or longer timeouts as a substitute for understanding a
failure. Use controlled responses, observable state, or a fake clock for deadlines.
Keep credentials, browser authentication state, and sensitive traces out of
commits and reports. Existing remote artifact restrictions still apply.

## Investigate a broken test

1. Preserve the failure, command, commit, mode, browser version, and relevant
   trace/error context. Use synthetic evidence; redact secrets without printing them.
2. Read the test and compare changes since the last passing revision.
3. Reproduce and classify: intentional behaviour change, product regression,
   test defect, or environment failure. State evidence and uncertainty.
4. Update locators only after observing the intentional UI change. A product bug
   requires an application fix within authorized scope, not weaker expectations.
   If the scope is tests only, report the bug separately and retain the failure.
5. Make the smallest justified change; rerun the original failure and relevant suite.

Use the bundled `systematic-debugging` skill for root-cause investigation.

## Triage an intermittent failure

1. Preserve initial evidence. Repeat only the affected case in a bounded run,
   for example `npx playwright test --grep BYOK-07 --repeat-each=20`.
2. Compare passed and failed traces, response order, data, browser storage,
   worker counts, and isolated versus suite execution.
3. Classify timing, test data, shared state/order, environment, or product bug.
   Explain the evidence and what would rule out competing explanations.
4. Propose and verify the root-cause fix. Repeat after the change only enough
   to test that hypothesis. Do not claim a small passing sample proves no flakes.

## Provenance

Adapted from the four examples in
[`fzsdi/thetesttribe`](https://github.com/fzsdi/thetesttribe/tree/main/.github/skills):
`generate-qa-scenarios`, `write-playwright-tests`, `fix-broken-test`, and
`triage-flaky-test`. They are examples, not overriding instructions. Sketch Air's
Node test layer, Codex `.agents/skills` discovery, architecture, and user scope
take precedence over the Copilot demo's conventions.
