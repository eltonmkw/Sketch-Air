# Instructions for working on Sketch Air

## Superpowers startup

At the start of every new session in this repository, read
[using-superpowers](./.agents/skills/using-superpowers/SKILL.md) and its
[Codex adaptation](./.agents/skills/using-superpowers/references/codex-tools.md)
before beginning task work. Apply the relevant bundled skills throughout the task.
Codex discovers project skills in `.agents/skills/`; if a skill is not listed by
the runtime, read its `SKILL.md` directly from that directory. References such as
`superpowers:systematic-debugging` map to `.agents/skills/systematic-debugging/SKILL.md`.

User and runtime instructions take precedence over bundled skill instructions.
Keep the project-specific boundaries below in force. Use the tools and model
allowlist actually available in the session; when subagents are unavailable or
not permitted, execute the plan sequentially. Do not change global Codex settings
as part of startup.

The skills are vendored and require no startup download. See
[installation notes](./.agents/SUPERPOWERS.md) for provenance and update guidance.

## Read first

Read [DESIGN.md](./DESIGN.md) before changing the interface or interaction model. It records the current design and its limitations; this file defines how to maintain it. Read the relevant implementation before editing. If an approved change alters the design, update both documents so they remain consistent. Do not treat documented gaps as authorization to expand task scope.

## Project structure

Sketch Air uses React 19, TypeScript, Vite 6, Lucide icons, Google GenAI, and MediaPipe hand tracking. It is a static browser application with no application backend. Tailwind loads from a CDN in [index.html](./index.html); there is no local Tailwind build configuration.

| Location | Responsibility |
| --- | --- |
| [App.tsx](./App.tsx) | Layout, ribbon controls, state, generation orchestration, result overlay, gallery |
| [components/AirCanvas.tsx](./components/AirCanvas.tsx) | Webcam lifecycle, hand tracking, drawing layers, undo history, gesture recognition |
| [components/VoiceInput.tsx](./components/VoiceInput.tsx) | Browser speech recognition and imperative voice toggle |
| [components/ApiKeyDialog.tsx](./components/ApiKeyDialog.tsx) | Native API key dialog and connection-test feedback |
| [services/geminiService.ts](./services/geminiService.ts) | Google requests and sketch-to-image prompt construction |
| [services/apiKeyStorage.ts](./services/apiKeyStorage.ts) | Session/local key storage and removal |
| [types.ts](./types.ts), [constants.ts](./constants.ts) | Shared models, style labels, style icons, style prompts |
| [index.html](./index.html) | Document shell, external styles, global font and scrollbar styling |
| [vite.config.ts](./vite.config.ts) | Development server, React plugin, relative build base, root alias |

## Preserve the design

- Keep the compact desktop painting-tool character described in [DESIGN.md](./DESIGN.md): title bar, grouped ribbon, dominant canvas, optional gallery, status bar.
- Put related controls in the existing ribbon group; preserve group order and captions unless the task calls for a redesign.
- Reuse neutral panels, thin borders, blue hover states, yellow ribbon style selection, and purple transformation emphasis. Match the existing icon and typography vocabulary.
- Keep primary drawing space flexible and gallery scrolling internal. Check overflow when changing fixed dimensions or introducing responsive behavior.
- Make new controls semantic and keyboard-operable, with accessible labels and visible focus. Status feedback must include text. Address reduced motion when touching animated feedback.
- Keep gesture help, feedback messages, and recognition logic consistent. Do not change gesture thresholds or cooldowns as incidental cleanup.

## Preserve behavior and data boundaries

- Allow drawing without a key. Request a key at generation time when absent.
- Keep API keys out of source, environment bundles, logs, screenshots, and documentation examples. Keep keys in memory by default and clear on refresh; persist only with Remember on this device after Done, using a 30-day expiry in local storage. Clear expired or malformed saved keys on load, and show Remove saved key only for a nonempty active key.
- Preserve the dialog's storage, Google-request, and billing disclosures. Do not equate a successful connection test with guaranteed image generation.
- Keep the API key field accessible by name even though its visible label is omitted.
- Confirm browser-storage deletion before reporting success. Always clear the active key on removal, and warn when saved browser data could not be removed. Keep dummy-key acceptance limited to explicit `ENV=TESTING` local development or Vercel Preview builds (`VERCEL_ENV=preview`). The only dummy key is `TESTING`; generation stays disabled. Vercel Production always vetoes mocks, regardless of `ENV`. Scope the testing variable to Preview only and rebuild after environment changes.
- Test Connection validates keys; success shows an accented Done button. Only Done activates the validated key and dismisses the modal. Show accessible field validation immediately on failure, clear it when editing or retrying, and prevent duplicate submissions. Keep Use key and Continue without key removed; preserve the accessible top-right X button and Escape for drawing without a key.
- Start requests camera access only. Keep startup progress and an enabled Cancel action visible until video playback succeeds, show accessible recovery guidance on failure, and release streams that arrive after cancellation.
- Keep browser media and recognition resources cleaned up when their lifecycle ends. Preserve alignment between mirrored video, ink, cursor, and exported sketch when editing canvas code.
- Keep submitted `resultPrompt` separate from the editable prompt. Retain the sketch after generation and use the submitted description for result-style changes and gallery metadata.
- Keep tracking available for save gestures while a result is visible, while preventing drawing beneath that result.
- Treat gallery entries as session-memory data. Add durable storage or project files only when requested; do not describe the existing gallery as persistent.
- Keep style labels, icons, prompt modifiers, and types synchronized when adding or changing an art style.
- Preserve browser-to-Google generation unless a requested architecture change explicitly replaces it. Do not add a backend or dependencies for routine UI changes.

## Development and validation

For scenario generation, approved test automation, broken-test investigation, or
intermittent-failure triage, use the project-local
[Sketch Air QA skill](./.agents/skills/sketch-air-qa/SKILL.md). Read it directly
when runtime discovery is unavailable. Track BYOK scenario approval, test mappings,
and remaining gaps in [the scenario register](./docs/qa/byok-scenarios.md).

Use the existing npm lockfile. Install dependencies only if needed and permitted by the environment.

- `npm run dev`: Vite development server on port 3000.
- `npm run build`: production bundle.
- `npm run typecheck`: TypeScript checking with the existing configuration.
- `npm run preview`: inspect a production build locally.

`npm test` covers API-key storage and test-mode isolation; `npm run test:browser` covers the key dialog with mocked Google responses and a production build. Install Chromium with `npx playwright install chromium` first. `npm run dev:testing` enables local dummy-key verification without Google calls; generation is disabled. There is no configured lint script. For code changes, run applicable tests, build and TypeScript checks when dependencies are available; report failures accurately, including pre-existing ones. Documentation-only changes need content, source-reference, and link checks rather than a new test suite.

For relevant interaction changes, verify in a browser: camera start/stop and permission failure, drawing and undo, gesture conflicts, voice availability, key-dialog controls, loading/error feedback, result style switching, gallery save/download/delete, and gallery visibility. Limit checks to affected behavior. Use HTTPS or localhost for webcam access. External CDN resources and Google require internet access.

Do not use a real API key or trigger billable generation solely for verification without user authorization. Use mocks for generation states when appropriate, and state that the response was mocked. Distinguish build/type checks, browser inspection, real webcam/microphone testing, and live API generation in the final report. Never claim checks that were not performed.

## GitHub and Vercel workflow

See [the deployment guide](./docs/DEPLOYMENT.md) for setup commands, Preview
testing, verified settings, and the remaining dashboard checklist. The `ENV`
selector maps `DEVELOPMENT` to local use, `TESTING` to Preview QA, and
`PRODUCTION` to live use; these are independent of Vercel's built-in scope names.

Use trunk-based development: create short-lived branches from the latest `main`, open a PR targeting `main`, and keep changes small and reviewable. Do not recreate a long-lived `development` branch to match Vercel's Development environment. Approval and merging are separate actions; creating a PR does not authorize merging or releasing it.

The intended Vercel project is `sketch-air` in `eltonmkws-projects`, connected to `eltonmkw/Sketch-Air`. The public production URL is https://play-sketch-air.vercel.app. Verify the actual repository connection and Production Branch setting before relying on automatic deployments; the intended production branch is `main`. Prefer the native Vercel Git integration over adding a second deployment pipeline.

### Environment boundaries

- Development is for local execution, Preview is for branch/PR deployments, and Production is for releases from `main`. These environment names do not require matching Git branch names.
- Set environment variables only when the implementation reads them. This app currently accepts a user-provided Gemini key in the browser; do not introduce a shared Gemini key through Vercel variables or embed credentials in a Vite bundle. Browser-exposed variables are public, not a secret store.
- If external services are introduced, keep Preview data and sandbox credentials separate from Production. Check authentication callback URLs and service restrictions for preview origins. Variable changes require a new deployment to take effect.
- Use existing authorized access for protected previews. Do not disable deployment protection or expose temporary access links, credentials, or browser authentication state in PRs or test artifacts.

### Before merging: Preview verification

1. Run the applicable local checks and inspect the GitHub `Build and typecheck` CI result for the latest PR commit. Documentation-only changes still receive normal CI; validate their content and links locally.
2. Locate the PR's Vercel Preview deployment. Record its URL, branch, commit SHA, and deployment status. Confirm the SHA matches the current PR head; an older Ready deployment is not evidence for the current change. If no matching preview exists, report that gap rather than testing Production as a substitute.
3. For app changes, open the preview in a browser and exercise the affected flows using the interaction checklist above. Check browser errors and failed requests, and inspect layout at relevant viewport sizes. HTTP 200 and a downloadable bundle alone do not verify that React renders or that interactions work.
4. Report passed, failed, and untested checks separately. Identify mocks and limitations such as missing camera/microphone hardware, credentials, or network access. Keep real media and billable API verification subject to the existing authorization rules.

### After merging: Production verification

Confirm the production deployment comes from the merged `main` commit (which can differ from the PR head after squash or merge), reaches Ready, and serves the intended production domain. Run a focused smoke test of the changed behavior and the main app flow. A Ready build alone is not a production smoke test. Report failures with the deployment URL and commit; treat promotion, rollback, and production configuration changes as release actions requiring task authorization.

For documentation-only PRs, verify the diff, references, CI, and deployment metadata when available; no feature behavior changes are expected. Record unavailable deployment evidence without claiming an interactive test or blocking documentation review on unrelated hardware checks.

## Scope and handoff

Keep edits focused, preserve unrelated work, and avoid silently implementing the known gaps listed in [DESIGN.md](./DESIGN.md). Summarize what changed, what was verified, and what remains unverified. If documentation and implementation disagree, inspect the source and resolve the discrepancy explicitly; do not invent behavior to satisfy the prose.

## Additional Playwright guidance

Read [Playwright skill](./.agents/skills/playwright-skill/SKILL.md) for browser test design. Its guides target newer Playwright releases; use only APIs supported by the installed 1.56.1. Repository rules take precedence, including zero retries and retaining failing assertions.
