# Bring-your-own-key QA scenarios

The first implementation slice was approved in chat on 30 October 2026. These
scenarios derive from current source and repository instructions, not assumptions
about a backend. Follow the [QA skill](../../.agents/skills/sketch-air-qa/SKILL.md)
and [testing guide](../TESTING.md).

## Confirmed flow

- [App](../../App.tsx) owns the active key in React memory. Without a remembered
  key, the dialog opens. X/Escape permit drawing; Transform requests setup again.
- [ApiKeyDialog](../../components/ApiKeyDialog.tsx) tests trimmed input or the active
  key, then activates only after Done. Setup does not automatically retry Transform.
- [geminiService](../../services/geminiService.ts) uses the browser Google SDK:
  model lookup with a 15-second timeout, then separate image-generation requests.
  Connection success does not guarantee quota, billing, or generation access.
- [Storage](../../services/apiKeyStorage.ts) defaults to no persistence. Remember
  plus Done writes plaintext localStorage with a 30-day expiry checked on load.
  Removal clears active state and verifies local/session deletion or warns.
- Explicit TESTING mode substitutes an offline service accepting only `TESTING`;
  generation is disabled. Production vetoes that alias.

## Approved first slice

P1 denotes first-pass regression coverage. All cases below automate with synthetic
credentials and intercepted provider responses. Test titles carry the scenario ID
in [api-key-provider.spec.ts](../../tests/browser/api-key-provider.spec.ts).

| ID / Title | Risk | Priority | Test layer | Automate? | Reason |
| --- | --- | --- | --- | --- | --- |
| BYOK-01 Empty/whitespace submission | Unnecessary request or activation | P1 | Browser | Yes | Stable input boundary; zero provider calls |
| BYOK-02 Dismiss and request setup again | Drawing requires credentials or generation bypasses setup | P1 | Browser | Yes | Covers X/Escape and Transform without camera access |
| BYOK-03 Successful lookup waits for Done | Premature activation/persistence | P1 | Browser + real SDK, mocked HTTP | Yes | Covers default memory, consent, refresh, removal, and subsequent Transform gating |
| BYOK-04 Provider errors and edited retry | Invalid key activates or error recovery fails | P1 | Browser + mocked HTTP | Yes | 400/401/403/429/500/503 with associated error and focus assertions |
| BYOK-05 Network failure and retry | Controls remain stuck | P1 | Browser + aborted request | Yes | Distinguishes transport errors and retry without editing |
| BYOK-06 Connection timeout | Indefinite pending state | P1 | Browser + fake clock | Yes | Exercises the actual SDK deadline without a fixed sleep |
| BYOK-07 Duplicate submission and stale response | Previous dialog session changes current validation | P1 | Browser + controlled responses | Yes | Delays old success/error until a new request is pending |
| BYOK-08 Connection-path key exposure | Credential reaches URLs, unrelated requests, logs, or errors | P1 | Shared browser fixture audit | Yes | Every case audits emitted traffic and console/page errors; error fixtures echo the sentinel |

Actions and expected outcomes:

1. **BYOK-01:** enter empty/whitespace input; press Enter. Submission remains
   disabled, Done is absent, no request occurs, and neither key store is written.
2. **BYOK-02:** dismiss with X; use Transform; repeat with Escape. The workspace
   is available and setup reopens, without contacting the provider.
3. **BYOK-03:** enter padded synthetic input; choose retention; test successfully.
   No activation/storage occurs until Done. Default refresh clears activation;
   consent survives refresh; removal empties storage and Transform requires setup.
4. **BYOK-04:** return each listed error with an echoed sentinel. The field has
   an associated error and receives focus, Done is absent, and storage is empty.
   Edit and retry with a success response; validation clears and Done appears.
5. **BYOK-05:** abort the request; retry with success. Guidance appears, controls
   recover, and successful retry clears the error without persisting the key.
6. **BYOK-06:** leave the response pending; advance the browser clock past 15
   seconds. Failure guidance replaces pending state and enables retry.
7. **BYOK-07:** hold request A; attempt duplicate submission; close/reopen; start
   B; release A as success/error. B stays pending with no stale result, then its
   own successful response offers Done. Exactly two requests occurred.
8. **BYOK-08:** throughout those actions, inspect actual emitted requests and
   diagnostics. Only the expected Google model GET carries the key in its auth
   header. URLs, request bodies, unrelated request headers, console/page errors,
   and visible text never contain the sentinel. BYOK-01/03/04/05/06/07 also assert
   storage at relevant consent boundaries. This is connection-path coverage only.

Existing tests remain in [api-key.spec.ts](../../tests/browser/api-key.spec.ts),
[api-key-storage.test.mjs](../../tests/api-key-storage.test.mjs), and
[testing-config.test.mjs](../../tests/testing-config.test.mjs). They cover offline
mode, expiry/malformed records, storage failures, removal, and environment isolation.

## Deferred scenarios from the proposal

These require a further implementation slice; they are not completed coverage.

| Title | Risk | Priority | Test layer | Automate? | Reason |
| --- | --- | --- | --- | --- | --- |
| Successful generation and restyle | Wrong key/payload/result | P2 | Service integration + focused browser | Yes | Fixed sketch/image fixtures; controlled media/tracking boundary |
| Lookup succeeds but generation fails | Connection is mistaken for quota/billing approval | P2 | Service integration + browser | Yes | Check errors, recovery, retained sketch/result |
| Text-only/empty/malformed image response | Crash or misleading success | P2 | Service integration | Yes | Response parsing matrix independent of camera |
| Generation diagnostics echo key | Key exposure through raw provider text/errors | P1 | Service integration + browser | Yes | Existing generation logs/provider errors need a separate exposure test |
| Expired/malformed records in UI | Invalid saved key activates | P2 | Browser | Yes | Node coverage exists; browser integration is missing |
| Remembered-to-memory replacement | Old key returns on reload | P1 | Browser extension | Yes | Node coverage exists; add UI integration |
| Secrets in tracked files/bundles/history | Published credentials | P1 | Static/build audit | Yes | Ignore rules alone are insufficient; scans must not print secret values |
| Disclosure, keyboard, zoom, narrow viewport | Misunderstood retention or inaccessible controls | P2 | Browser + exploratory QA | Partial | Semantics automate; usability requires judgement |

Open decisions: expiry during an active session, cross-tab removal, desired
sanitized generation errors, and supported browsers beyond Chromium. Current
behaviour does not establish requirements for those changes.

## Verification and discovered defects

The initial existing baseline passed Node checks, typecheck, build, and all eight
browser tests with system Chromium. The managed environment blocks localhost
binding in its default sandbox and lacks Playwright's managed browser binary;
local verification used an ignored temporary config selecting `/usr/bin/chromium`
with permission to start localhost servers. The committed browser configuration
continues using the normal Playwright browser installation.

**QA-01 — validation focus:** the new provider-error cases reproduce failure to
focus the key field. `handleTest` calls `.focus()` while the field is disabled;
React re-enables it after that call. Error text, association, and invalid state
appear, but focus is inactive. The focus assertion is retained; application fixes
are separate from the approved tests-only slice. Recovery assertions after that
failure are not reached in those cases. Do not weaken expectations to hide it.

Final local run: **17 browser tests passed, 6 failed** with two workers and zero
retries. All six failures are QA-01 across the provider-status matrix; the eight
pre-existing cases still pass. Node checks, typecheck, production build, local
documentation links, skill frontmatter, and `git diff --check` passed. Remote-mode
test discovery was checked without connecting to a deployment: the local-only
provider spec is excluded and the original eight cases remain discoverable.
The suite is not green and will fail CI until QA-01 is resolved. No assertion was
removed, loosened, or skipped to hide this defect. No intermittent-failure claim
is made from these runs; this is a reproducible product failure.

No live provider, billing, camera, microphone, deployed Preview, visual styling,
cross-browser, or comprehensive historical secret verification is established.
