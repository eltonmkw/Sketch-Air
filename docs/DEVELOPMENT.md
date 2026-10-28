# Developer setup and technical notes

For using the hosted app, see the [README](../README.md). For checks and offline key verification, see [Testing](./TESTING.md).

## Getting started

Use Node.js 24 (the version used in CI and Vercel) and npm. From the repository root:

```sh
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Vite uses port 3000 by default; follow the terminal URL if that port is occupied. Webcam access requires localhost or HTTPS. Internet access is needed for external styles, tracking resources, and Google requests.

An environment file is optional. To explicitly select normal local behavior, copy `.env.example` to `.env.local` and replace its placeholder with `ENV=DEVELOPMENT`. Restart Vite after changing configuration. Shell values take precedence over environment files. See the [deployment guide](./DEPLOYMENT.md) for environment-file precedence and the full environment mapping.

Drawing works without a key; enter your own key through the app's API-key dialog for real generation. Never put API keys in source, environment bundles, logs, screenshots, or documentation. Use [testing mode](./TESTING.md#api-key-verification-without-google-access) for dummy-key verification without Google calls.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run dev:testing` | Start local dummy-key mode; generation is disabled |
| `npm test` | Run storage and test-mode isolation tests |
| `npm run test:browser` | Run Playwright key-dialog tests |
| `npm run typecheck` | Check TypeScript without emitting files |
| `npm run build` | Build the production app into `dist/` |
| `npm run preview` | Serve an existing production build locally |

To inspect a production bundle locally:

```sh
npm run build
npm run preview
```

Open the URL printed by Vite. Previewing locally is separate from a Vercel Preview deployment.

## Architecture

Sketch Air is a static browser app with no application backend. It uses React 19, TypeScript, Vite 6, Lucide icons, MediaPipe hand tracking, and Google GenAI. Tailwind loads from a CDN in `index.html`; there is no local Tailwind build configuration. Google requests go directly from the browser using a user-provided key. Image generation currently uses `gemini-2.5-flash-image`.

| Source | Responsibility |
| --- | --- |
| [App.tsx](../App.tsx) | Layout, state, generation orchestration, results, and session gallery |
| [AirCanvas.tsx](../components/AirCanvas.tsx) | Camera lifecycle, tracking, drawing, undo, and gestures |
| [VoiceInput.tsx](../components/VoiceInput.tsx) | Browser speech recognition |
| [ApiKeyDialog.tsx](../components/ApiKeyDialog.tsx) | Key validation, activation, and storage controls |
| [geminiService.ts](../services/geminiService.ts) | Google requests and sketch-to-image prompts |
| [apiKeyStorage.ts](../services/apiKeyStorage.ts) | Key persistence, expiry, and removal |
| [types.ts](../types.ts), [constants.ts](../constants.ts) | Shared types, style labels, icons, and prompts |
| [vite.config.ts](../vite.config.ts) | Development server, build base, aliases, and testing-mode selection |

Keys default to memory-only storage. Opt-in persistence happens after Done and expires after 30 days, checked on load. Gallery items remain in session memory. Preserve these boundaries when contributing.

## Deployment notes

The [deployment guide](./DEPLOYMENT.md) covers local environment setup, Preview testing, verified Vercel settings, and the remaining dashboard checklist. `ENV=DEVELOPMENT` selects normal local behavior, `ENV=TESTING` selects offline Preview QA, and `ENV=PRODUCTION` selects live use; these selectors are independent of Vercel's scope names.

The intended Vercel project is `sketch-air` in `eltonmkws-projects`, connected to `eltonmkw/Sketch-Air`, with `main` as the production branch and [play-sketch-air.vercel.app](https://play-sketch-air.vercel.app) as the production domain. Verify the actual repository connection and Production Branch setting before relying on automatic deployments. Prefer the native Vercel Git integration.

Development is local execution; Preview is for branch/PR deployments; Production is for releases from `main`. These names do not require matching Git branches. Do not add a long-lived `development` branch for the Vercel Development environment.

Do not configure a shared Gemini key in Vercel or embed credentials in the Vite bundle. Browser-exposed variables are public. Set variables only when the app reads them; changing build-time variables requires a new deployment. See [Testing](./TESTING.md#enable-testing-on-vercel-preview) for Preview-only dummy-key configuration. Vercel Production always vetoes mocks; use a fresh production build for release.

Use existing authorized access for protected previews. Do not disable protection or publish credentials, authentication state, or temporary access links in review artifacts. If external services are added later, keep Preview data and sandbox credentials separate from Production.

## Further project notes

- [Contributing](../CONTRIBUTING.md): change and review workflow.
- [Design reference](../DESIGN.md): current interface, interaction model, and known limitations.
- [User stories](../USER_STORIES.md): product scenarios.
- [Hackathon submission](../SUBMISSION.md): submission notes.
- [Repository instructions](../AGENTS.md): maintenance boundaries and detailed verification workflow.

[Back to README](../README.md)
