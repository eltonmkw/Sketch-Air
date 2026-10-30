# Testing Sketch Air

Follow [developer setup](./DEVELOPMENT.md) first. Use Node.js 24 and install dependencies with `npm ci`.

## Automated checks

```sh
npm test
npx playwright install chromium
npm run test:browser
npm run typecheck
npm run build
```

On Linux, Playwright may also need system dependencies; use `npx playwright install --with-deps chromium` where permitted. Browser tests start their own servers on ports 4173, 4174, and 4175; keep those ports free.

- `npm test` checks API-key storage and test-mode isolation using Node's test runner.
- `npm run test:browser` checks the key dialog in a local testing server, a production build, and a testing Preview build. It covers memory-only refresh, opt-in persistence after Done, removal, blocked-storage feedback, and production rejection of the dummy key.
- `tests/browser/api-key-provider.spec.ts` adds local production-path coverage with
  the real Google SDK and intercepted responses: successful lookup, empty input,
  provider errors, retry, timeout, stale responses, and key exposure boundaries.
  It is excluded when `PLAYWRIGHT_BASE_URL` selects a remote TESTING Preview,
  because that target replaces the real service and starts no local production server.
- Browser tests mock Google responses and stub or block external CDN resources. They do not verify live Gemini access, billing, camera, or microphone behavior.
- TypeScript and build checks validate types and bundling. There is no configured lint script.

The [CI workflow](../.github/workflows/ci.yml) runs these checks for pushes to `main` and non-draft pull requests targeting `main`.

CI uses Node 24 inside the Playwright `v1.56.1-noble` image, which already includes browser binaries and system dependencies. Keep that image version matched to `@playwright/test` when upgrading. See the [deployment guide](./DEPLOYMENT.md#verification) for the Docker equivalent.

## Repeatable AI-assisted QA

Use the [Sketch Air QA skill](../.agents/skills/sketch-air-qa/SKILL.md) for four modes:
generate scenarios, write approved tests, investigate a broken test, or triage an
intermittent failure. The [BYOK register](./qa/byok-scenarios.md) records approved
scenario IDs, test mappings, deferred coverage, and discovered defects.

Example requests:

- “Use sketch-air-qa to generate scenarios for this change; stop for approval.”
- “Use sketch-air-qa to automate approved scenario BYOK-03.”
- “Use sketch-air-qa to investigate BYOK-04 using this failure and trace.”
- “Use sketch-air-qa to triage intermittent BYOK-07 failures from repeated runs.”

Run the production-path slice locally with:

```sh
npm run test:browser -- api-key-provider.spec.ts
```

All provider traffic is intercepted; no real key or paid request is permitted.
Do not treat mocked success as evidence of live Google access. A product defect
must remain a failing assertion until an authorized application fix resolves it;
see the register's QA-01 focus finding. CI will report such failures normally.

## API-key verification without Google access

Run `npm run dev:testing` (or `ENV=TESTING npm run dev`) locally and enter
the **dummy value** `TESTING`. Test Connection succeeds without
contacting Google, then Done activates the dummy key. Other values are rejected.
Image generation is disabled in this mode, so verification cannot incur Google
charges. A TESTING notice identifies the mocked environment. Do not enter real
credentials in testing mode.

`ENV` is a case-sensitive build-time selector. `ENV=TESTING` enables the offline
mock in local development and Vercel Preview builds (`VERCEL_ENV=preview`).
`ENV=DEVELOPMENT`, `ENV=PRODUCTION`, unset, and unrecognized values keep real validation. Vercel
Production always uses real validation, even if `ENV=TESTING` is accidentally set.
Ordinary local builds also keep real validation unless explicitly simulating Vercel Preview.

### Enable testing on Vercel Preview

1. Open **sketch-air → Settings → Environment Variables** in Vercel.
2. Add `ENV` with value `TESTING`, selecting **Preview only**. No `VITE_` prefix is needed.
3. Redeploy the Preview after saving; environment changes do not alter existing builds.
4. Open the new Preview, enter `TESTING` as the API key, click **Test Connection**, then **Done**.

The TESTING notice identifies the mock. Test Connection makes no Google request,
and generation stays disabled. For normal Preview validation, change Preview's
`ENV` to `PRODUCTION` and redeploy. Production may explicitly use `ENV=PRODUCTION`;
its deployment target also prevents the mock from being bundled. Release through
a fresh production build rather than copying testing build files.

## Manual checks

For automated checks against a deployed TESTING Preview, use the [remote Preview instructions](./DEPLOYMENT.md#test-a-preview). They cover `PLAYWRIGHT_BASE_URL`, authorized protection bypass, and the checks skipped in remote mode. Run the normal local suite as well for Production isolation.

For interaction changes, check only the affected flows in a browser:

- Camera Start, Cancel, Stop, permission denial, and retry. Use HTTPS or localhost.
- Pinch drawing, undo, clearing, and gesture conflicts.
- Voice input availability and microphone permission handling.
- API-key validation, Done, dismissal, remembering, and removal.
- Generation loading and error feedback, result style changes, and returning to the sketch.
- Gallery save, download, delete, and visibility; confirm that refresh clears the gallery.
- Layout at relevant viewport sizes, browser console errors, and failed requests.

Use mocks for generation states when possible. Do not use a real API key or trigger billable generation solely for verification without authorization. Report which checks passed, failed, or were not run, and distinguish mocked behavior from real media or live API checks. See [contribution guidance](../CONTRIBUTING.md) for Preview verification.

For documentation-only changes, check content against source, relative links, and the diff; a new test suite is unnecessary.

[Back to README](../README.md)
