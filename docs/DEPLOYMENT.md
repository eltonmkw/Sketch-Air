# Development, Testing, and Production

Sketch Air uses one Git repository and one Vercel project. Develop locally, open
a PR, test its Preview deployment, merge into the configured production branch,
then verify Production. Keep short-lived feature branches; no persistent
development or staging branch is needed.

## Environment mapping

`ENV` is a case-sensitive application build selector. It does not rename
Vercel's built-in environments or Vite's modes.

| Application `ENV` | Vercel scope | Behavior |
| --- | --- | --- |
| `DEVELOPMENT` | Development | Local app with real Gemini validation using a user-provided key; drawing needs no key |
| `TESTING` | Preview | Offline key-dialog QA: only dummy key `TESTING` works; generation is disabled |
| `PRODUCTION` | Production | Real Gemini validation and generation using the user's own key |

Local `npm run dev:testing` also selects `TESTING`. Unset or unrecognized `ENV`
uses real validation. An ordinary local build never enables mocks. Vercel
Production always vetoes mocks, even with `ENV=TESTING`. For a Preview that needs
real-service testing, change only that Preview's `ENV` to `PRODUCTION` and rebuild;
the automated remote suite below requires a `TESTING` Preview.

Both `DEVELOPMENT` and `PRODUCTION` use the real service. `DEVELOPMENT` does not
create a Google sandbox. Use separate non-production Google projects/keys and
test sketches for authorized live development or QA. Do not use production
credentials or live customer data in Preview.

## Repository and commands

The repository root is the application root: React 19, TypeScript, Vite 6, npm,
and `package-lock.json`. It is not a monorepo. Vite builds a static site into
`dist/`; there is no application server or routed SPA requiring custom rewrites.
Use Node 24.x, matching Vercel and CI.

```sh
npm ci
cp .env.example .env.local
# Edit .env.local so its assignment reads ENV=DEVELOPMENT.
npm run dev
```

Open http://localhost:3000. For offline QA, stop that server and run:

```sh
npm run dev:testing
```

Enter the dummy key `TESTING`, click Test Connection, then Done. No Google
request is made in this mode; the visible TESTING notice identifies it.

`vite.config.ts` explicitly loads `ENV` from Vite environment files, because
Vite does not load them before evaluating config. Shell values take precedence.
Vite loads `.env`, `.env.local`, `.env.[mode]`, and `.env.[mode].local`, with
mode-specific files taking precedence over generic files. `npm run dev` uses
development mode; `npm run build` uses production mode; `dev:testing` uses test
mode. Restart the dev server after changing configuration.

Do not set `NODE_ENV=TESTING` or `NODE_ENV=DEVELOPMENT`: `NODE_ENV` follows the
toolchain's lowercase development/production/test conventions. `ENV` controls
this application's selector independently.

Optional Vercel CLI setup, after checking the selected team/project:

```sh
vercel link --project sketch-air --scope eltonmkws-projects
vercel env pull .env.local --environment=development
npm run dev
```

The CLI must already be installed and authenticated. Pulling replaces the target
file; preserve any local overrides privately first. These commands are setup
instructions, not commands run during this preparation. Neither linking nor
pulling is required for the standalone local workflow above.

## Configuration inventory and secret boundaries

| Name | Consumer | Configuration |
| --- | --- | --- |
| `ENV` | `vite.config.ts` | Set `DEVELOPMENT`, `TESTING`, `PRODUCTION` in their respective Vercel scopes |
| `VERCEL_ENV` | `vite.config.ts` | Vercel system variable; do not put in local env files or override in dashboard |
| `VERCEL_TARGET_ENV` | `vite.config.ts` | Vercel system variable; additional Production veto |
| `NODE_ENV` | Vite/config and test harness | Tool-managed; builds use `production`, even on Preview |
| `CI` | `playwright.config.ts` | CI-provided worker-limit flag |
| `PLAYWRIGHT_BASE_URL` | Playwright/config and browser tests | Optional exact HTTPS Preview origin; test runner only |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Browser test request routing | Optional private test-runner credential for protected Preview access |

No Gemini key belongs in Vercel environment variables. The app accepts it from
the user in the browser and sends requests directly to Google. Never introduce
a shared key as `VITE_*`: those variables are public and bundled into JavaScript.
The custom `ENV` loader does not expose a private environment object to the
browser. `.env.example` has placeholders only. `.env*` files other than the
example, `.vercel/`, and browser test artifacts are ignored by Git.

There is no database, application authentication, OAuth callback, backend service
account, or hosted object storage. Sketches/results/gallery are session-memory
data. Keys are memory-only unless the user opts into plaintext browser storage
with a 30-day expiry. Browser storage is separated by origin; repeated visits to
the same origin can reuse remembered state. Use fresh browser contexts for QA.

External services are Gemini (`generativelanguage.googleapis.com`), MediaPipe
JavaScript/WASM from jsDelivr, model assets from Google Storage, Tailwind CDN,
and Google Fonts. They require network access. Camera access needs HTTPS or
localhost. Browser speech recognition availability depends on the browser.

Separate deployments and environment variables do not create separate service
resources. If databases, authentication, storage, or shared APIs are added later,
provision separate non-production and production projects/accounts/buckets and
scope their credentials separately before enabling Preview access. For real
Gemini QA, configure API and website/referrer restrictions for the exact approved
local/Preview origins in a separate Google project. Avoid broad wildcard access.

## Verification

Run from the repository root:

```sh
npm ci
npm test
npm run typecheck
npm run build
npx playwright install chromium
npm run test:browser
```

To inspect a normal production build locally:

```sh
npm run build
npm run preview -- --host 127.0.0.1
```

There is no lint script. Existing GitHub Actions workflow `.github/workflows/ci.yml`
runs the checks above on non-draft PRs into `main` and pushes to `main`. It uses
the npm lockfile, Node 24, and the job name **Build and typecheck**. Vercel's Git
integration owns deployment; CI does not need a Vercel deployment token or a
second deployment workflow.

### Preparation results (2026-10-27)

Unit tests, TypeScript, production build, local documentation links, ignore rules,
and `git diff --check` passed. All eight local browser tests passed using installed
system Chromium through a temporary config because the Playwright-managed browser
was absent. A local HTTPS fixture requiring a dummy bypass header also passed
seven remote-mode tests; its local-only Production check was intentionally skipped.
The fixture used a self-signed certificate with trust relaxed only in that temporary
test config; the committed config retains normal HTTPS verification. Temporary
configs were removed. No actual Vercel Preview, Production smoke test, real
camera/microphone session, or live Gemini call was performed. CI and the dashboard
items below still need verification for the eventual PR/deployment.

### Test a Preview

Find the Vercel Preview for the latest PR commit. Record its URL, branch, SHA,
and Ready status; an older deployment is not evidence for the current PR.
Set `ENV=TESTING` in Preview and create a fresh deployment before running:

```sh
PLAYWRIGHT_BASE_URL=https://your-preview.vercel.app npm run test:browser
```

Replace the example origin with the exact deployment URL (no trailing slash).
Remote mode starts no local servers, requires the TESTING notice, and runs the
key-dialog/storage tests. The local Production isolation test is skipped in
remote mode; run the normal local suite as well. MediaPipe, styles/fonts, and
Google requests are stubbed or blocked. These tests do not verify real camera,
microphone, visual styling, Google access, billing, or image generation.

If Deployment Protection is enabled, supply the project's authorized automation
bypass credential as `VERCEL_AUTOMATION_BYPASS_SECRET` in the test runner's private
environment or CI secrets. Do not paste it into commands, URLs, source, or PRs.
The suite adds the bypass header only for the target origin and does not forward
it across redirects. Remote traces, screenshots, and video are disabled. No
automated remote-test workflow or bypass credential is provisioned here. Any
future CI job with that secret must run only reviewed code with appropriate
approval; do not expose it to untrusted PR code.

For manual QA, use an authorized Vercel session and exercise drawing/camera,
cancel/stop, key dialog, storage removal, and affected controls. Do not disable
protection to test. Real Gemini calls or billable generation need separate
authorization and a non-production key. Do not use Production as a substitute
when the matching Preview is unavailable.

## Vercel and Git provider checklist

Read-only Vercel inspection on 2026-10-27 confirmed project `sketch-air` in
`eltonmkws-projects`, framework Vite, Node 24.x, production domain
https://play-sketch-air.vercel.app, and Vercel Authentication configured as
`all_except_custom_domains`. Password and trusted-IP protection were disabled.
The API response did not expose the other settings below. **Unchecked items
remain unverified; no dashboard or external account settings were changed.**

- [ ] Connect GitHub repository `eltonmkw/Sketch-Air` to this existing project;
  verify the actual repository connection and automatic deployments.
- [ ] Verify Production Branch is `main`, as required by `AGENTS.md` and CI.
  If the actual release branch differs, resolve that discrepancy and update CI
  and documentation together before enabling releases.
- [ ] Confirm root directory is the repository root (blank/default in Vercel),
  framework preset **Vite**, install command `npm ci`, build command
  `npm run build`, and output directory `dist`. Existing defaults may suffice;
  no `vercel.json` is needed for this static application.
- [ ] Configure `ENV`: Development=`DEVELOPMENT`, Preview=`TESTING`,
  Production=`PRODUCTION`. Check branch-specific Preview overrides too.
- [ ] Confirm Vercel system environment variables are available to builds so
  `VERCEL_ENV` and `VERCEL_TARGET_ENV` enforce the Production veto.
- [ ] Keep shared Gemini secrets out of all app scopes. For authorized live QA,
  use separate Google non-production resources and approved origin restrictions.
  No database/auth/storage provisioning is currently applicable.
- [ ] Authentication callbacks/allowed origins: no app OAuth callbacks exist.
  If authentication is introduced, register separate Preview and Production
  callbacks and allowed origins in the respective service projects.
- [ ] Retain appropriate Preview protection; verify reviewers can access it.
  If automated protected testing is needed, configure an authorized automation
  bypass privately and restrict the runner's access to it. Verify protection on
  every intended hostname, especially custom domains, which the inspected policy
  excludes.
- [ ] Protect `main` in GitHub: require PR review and the latest **Build and
  typecheck** CI result, plus the actual Vercel Preview status/check. Confirm
  exact status names in GitHub before selecting required checks. Draft PRs skip
  the CI job; mark ready for review to run checks. Branch protection is unverified.
- [ ] Require Preview verification before merging. Git integration builds and CI
  run independently; configuring GitHub required checks does not itself gate a
  manually triggered Vercel production deployment.
- [ ] After any Vercel environment-variable change, redeploy in the intended
  environment. Existing builds do not pick up changed values. Re-pull Development
  variables and restart local Vite when appropriate.

## Release and recovery

1. Develop locally on a short-lived branch; use `dev:testing` for offline QA.
2. Run checks, push the branch, and open a PR into the verified production branch.
3. Confirm CI and the matching Preview SHA; run remote tests and affected manual QA.
4. After review, merge. The native Git integration builds Production with its
   own variables; do not copy a TESTING `dist/` into Production.
5. Confirm Production is Ready for the merged commit (a squash merge changes the
   SHA), serves the intended domain, and passes a focused manual smoke test.
   Ready status alone does not prove the app works.

No deployment, merge, live-data change, credential rotation, or external setting
change was authorized by this local preparation. Those actions need explicit
authorization. No matching remote deployment is created by local checks.

There are no migrations now. If a database is introduced, deploy backward-
compatible schema changes separately, use non-production migration tests and
backups, and define an explicit migration/recovery policy. Rolling back code does
not roll back database data, browser storage, external API activity, or billing.

For an authorized rollback, choose a known-good Production deployment and verify
its commit and behavior. Vercel documents that instant rollback disables automatic
production-domain assignment until production is explicitly resumed/promoted;
verify the current project state before relying on the next merge to go live.
Do not promote a TESTING Preview build as a release. Recovery is a release action,
not part of this setup.

## Platform references

Current Vercel documentation was consulted on 2026-10-27:

- [Environments](https://vercel.com/docs/deployments/environments)
- [Git integration](https://vercel.com/docs/git)
- [Build settings](https://vercel.com/docs/builds/configure-a-build)
- [Environment variables](https://vercel.com/docs/environment-variables)
- [Development variable pull](https://vercel.com/docs/cli/env)
- [Automation protection bypass](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation)
- [Instant rollback](https://vercel.com/docs/instant-rollback)
