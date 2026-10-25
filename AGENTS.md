# Instructions for working on Sketch Air

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
- Test Connection validates keys; success shows an accented Done button. Only Done activates the validated key and dismisses the modal. Show accessible field validation immediately on failure, clear it when editing or retrying, and prevent duplicate submissions. Keep Use key and Continue without key removed; preserve the accessible top-right X button and Escape for drawing without a key.
- Start requests camera access only. Keep startup progress visible until video playback succeeds, show accessible recovery guidance on failure, and release streams that arrive after cancellation.
- Keep browser media and recognition resources cleaned up when their lifecycle ends. Preserve alignment between mirrored video, ink, cursor, and exported sketch when editing canvas code.
- Keep submitted `resultPrompt` separate from the editable prompt. Retain the sketch after generation and use the submitted description for result-style changes and gallery metadata.
- Keep tracking available for save gestures while a result is visible, while preventing drawing beneath that result.
- Treat gallery entries as session-memory data. Add durable storage or project files only when requested; do not describe the existing gallery as persistent.
- Keep style labels, icons, prompt modifiers, and types synchronized when adding or changing an art style.
- Preserve browser-to-Google generation unless a requested architecture change explicitly replaces it. Do not add a backend or dependencies for routine UI changes.

## Development and validation

Use the existing npm lockfile. Install dependencies only if needed and permitted by the environment.

- `npm run dev`: Vite development server on port 3000.
- `npm run build`: production bundle.
- `npx tsc --noEmit`: TypeScript checking with the existing configuration.
- `npm run preview`: inspect a production build locally.

There are no configured test or lint scripts in [package.json](./package.json). For code changes, run build and TypeScript checks when dependencies are available; report failures accurately, including pre-existing ones. Documentation-only changes need content, source-reference, and link checks rather than a new test suite.

For relevant interaction changes, verify in a browser: camera start/stop and permission failure, drawing and undo, gesture conflicts, voice availability, key-dialog controls, loading/error feedback, result style switching, gallery save/download/delete, and gallery visibility. Limit checks to affected behavior. Use HTTPS or localhost for webcam access. External CDN resources and Google require internet access.

Do not use a real API key or trigger billable generation solely for verification without user authorization. Use mocks for generation states when appropriate, and state that the response was mocked. Distinguish build/type checks, browser inspection, real webcam/microphone testing, and live API generation in the final report. Never claim checks that were not performed.

## Scope and handoff

Keep edits focused, preserve unrelated work, and avoid silently implementing the known gaps listed in [DESIGN.md](./DESIGN.md). Summarize what changed, what was verified, and what remains unverified. If documentation and implementation disagree, inspect the source and resolve the discrepancy explicitly; do not invent behavior to satisfy the prose.
