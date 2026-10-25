# Sketch Air — prototype-derived user stories

Draft for refinement · 25 October 2026 · source revision `e991ca7`

This backlog describes the current local prototype. It does not approve a redesign. Refine the stories and open questions before turning them into UI changes.

## Evidence and reading guide

- **Observed in source:** controls, state, or behavior directly present in the implementation. This does not mean tested in a browser.
- **Inferred:** a user role, motivation, or intended outcome inferred from those controls. All “so that” benefits below are inferred and need your review.
- **Proposed:** a possible future requirement, separated from existing behavior.

The working role is **creator**: someone sketching with a webcam and optionally generating artwork. No account, team, administrator, or role permissions are implemented. Whether beginners, artists, children, or another audience are the intended users remains open.

Evidence comes from [App](./App.tsx), [AirCanvas](./components/AirCanvas.tsx), [VoiceInput](./components/VoiceInput.tsx), [ApiKeyDialog](./components/ApiKeyDialog.tsx), [key storage](./services/apiKeyStorage.ts), [generation service](./services/geminiService.ts), [style definitions](./types.ts), and [style prompts](./constants.ts). [DESIGN.md](./DESIGN.md) supplies supporting context; implementation takes precedence.

No screenshots, live browser interactions, camera/microphone tests, connection tests, or AI generation were performed. No paid tools or API calls were used to produce this backlog. Generating artwork in the app uses the creator’s Gemini key and may incur Google charges.

## Screen and state inventory

The prototype is one workspace with overlays and a sidebar, rather than several routed pages.

| Surface | Current states and controls | Source |
| --- | --- | --- |
| Workspace shell | Title bar; API key access; gallery toggle/count; File, Tools, Colors, Styles, Magic ribbon; status bar | [App](./App.tsx) |
| Key dialog | Untested, testing, connected/Done, invalid key, storage fallback, removal | [ApiKeyDialog](./components/ApiKeyDialog.tsx) |
| Camera onboarding | Component loading; Enable Webcam; starting with Cancel; permission/device error with retry | [AirCanvas](./components/AirCanvas.tsx) |
| Active drawing area | Mirrored video, ink, tracking cursor, gesture legend, drawing on/off, Stop, temporary feedback | [AirCanvas](./components/AirCanvas.tsx) |
| Generation feedback | Transform spinner; request error strip; missing-canvas message | [App](./App.tsx) |
| Result overlay | Generated image, submitted description, style controls, three-finger save hint, close | [App](./App.tsx) |
| Gallery sidebar | Empty guidance or newest-first thumbnails; description/time; hover download/delete actions | [App](./App.tsx) |

## Current user flows

1. **Start drawing:** open app → close key dialog if no generation is needed → wait for tracking components → Start → allow camera → camera warmup → pinch and draw.
2. **Describe and transform:** draw → type or dictate description → choose style → Transform or hold two fingers → supply/test key and click Done if missing → invoke Transform again → await result or error. Adding a key does not automatically resume the earlier request.
3. **Explore a result:** inspect image and submitted description → choose a result style → await replacement → close to return to the retained sketch, or save by gesture.
4. **Keep an image:** hold three fingers while a result is visible → image enters session gallery and result closes → download from gallery. Alternatively, use Save File while the result is visible to download directly.
5. **Manage workspace:** undo or clear ink → pause drawing or stop camera → show/hide gallery → download/delete gallery entries. Refresh loses the sketch, result, and gallery; an explicitly remembered key can survive.

## Existing capability stories

Each story has **observed-in-source capability** and **inferred motivation**. Criteria describe the existing implementation, including limitations; they are a baseline to edit, not new requirements to implement.

### US-01 — Start without configuring AI

As a creator, I want to access drawing without an API key, so that I can try sketching before configuring image generation.

- With no valid remembered key, opening the app shows the key dialog.
- Closing it with X or Escape permits access to the workspace without activating a key.
- Drawing does not require a key; Transform without a key reopens the dialog.
- Saving a valid key with Done closes the dialog; the user must invoke Transform again.

Source: [App — initialization and handleGenerate](./App.tsx), [dialog close and submit](./components/ApiKeyDialog.tsx).

### US-02 — Configure and validate my own AI key

As a creator, I want to test my Gemini key before using it, so that I can identify connection problems.

- The dialog provides a password input named “Gemini API key.”
- Test Connection uses the entered key or the active key when the input is empty.
- Testing displays textual status and prevents duplicate form submissions.
- A successful model-information request offers Done; the key becomes active only after Done.
- Failure shows a field-associated error; editing or retrying clears validation.
- The dialog explains direct Google requests, possible charges, and that connection success does not guarantee image-generation access.

Source: [ApiKeyDialog — handleTest/handleSubmit](./components/ApiKeyDialog.tsx), [testApiKey](./services/geminiService.ts).

### US-03 — Control whether my key is remembered

As a creator, I want to choose whether this browser remembers my key and remove it later, so that I control its retention.

- The default is memory only: an active key clears on refresh.
- Selecting Remember on this device persists it after Done for 30 days; expired or malformed records are discarded on load.
- If persistence fails, the key works in memory and a notice asks for a second Done click to continue.
- With an active nonempty key, Remove saved key clears active and stored credentials and reports removal.
- Storage and billing disclosures remain visible in the dialog.

Source: [ApiKeyDialog](./components/ApiKeyDialog.tsx), [key storage](./services/apiKeyStorage.ts).

### US-04 — Start, cancel, and recover camera access

As a creator, I want control over starting the webcam, so that I can begin drawing when ready.

- While tracking components load, the workspace shows “Loading components...”.
- Once loaded, Enable Webcam offers Start; it requests video without microphone access.
- Starting shows progress and an enabled Cancel action until playback succeeds.
- Cancelling returns to Start and releases streams arriving after cancellation.
- Denied permission, missing device, and unavailable camera have recovery messages and permit retry.
- Successful startup shows a mirrored feed and uses a two-second gesture/drawing warmup.

Source: [AirCanvas — model initialization, camera effect, onboarding](./components/AirCanvas.tsx).

Limitation: model-loading failure is logged without a visible retry path; loading can remain indefinitely.

### US-05 — Draw with my hand

As a creator, I want a pinch gesture to produce strokes, so that I can sketch in the air.

- With tracking active, drawing enabled, warmup complete, and no result overlay, holding a qualifying thumb/index pinch begins a stroke.
- Releasing the pinch sufficiently ends drawing; the sketch is supplied to the generation flow after a stroke ends.
- The canvas displays a tracked cursor and uses the selected stroke color and width.
- Hand movement is smoothed; a thumbs-up gesture is also recognized as a stop action.
- The on-canvas legend describes supported gestures.

Source: [AirCanvas — animate and gesture legend](./components/AirCanvas.tsx).

Limitations: there is no mouse/touch drawing path. Gesture reliability and thumbs-up conflicts need real camera testing.

### US-06 — Adjust my brush

As a creator, I want to change ink color and thickness, so that I can distinguish parts of my sketch.

- Black ink and a 4px width are the defaults.
- Eight color presets and a custom color picker update the active color.
- A size slider accepts 1–20px and updates the active width.
- The status bar reports selected size and displays the active color.

Source: [App — brush state, Tools, Colors, status bar](./App.tsx), [AirCanvas — drawLine](./components/AirCanvas.tsx).

### US-07 — Pause drawing or stop the camera

As a creator, I want to pause mark-making or end the camera session, so that I can move without adding ink and stop camera use when finished.

- Drawing ON/OFF toggles mark-making while tracking continues.
- Stop releases the active camera stream and returns to camera onboarding.
- Stopping the camera clears ink and undo history.
- Camera controls are hidden while a result overlay is visible.

Source: [AirCanvas — camera effect and control overlay](./components/AirCanvas.tsx).

### US-08 — Undo a drawing change

As a creator, I want to restore a previous ink state, so that I can recover from a mistake.

- Undo restores the latest available stored canvas state and updates the sketch supplied to generation.
- New strokes and clearing actions create history snapshots.
- With no available history, feedback says “Nothing to Undo.”
- History is limited and session-only; the Redo control is disabled.

Source: [AirCanvas — saveToHistory and imperative undo](./components/AirCanvas.tsx), [App — title bar](./App.tsx).

### US-09 — Clear the sketch

As a creator, I want to erase my current sketch, so that I can start another drawing.

- Clear in the ribbon clears ink and dismisses any current result.
- A qualifying fast swipe while drawing is allowed and no stroke is active also clears the canvas.
- Clearing updates the submitted sketch data to empty and shows temporary feedback.
- Clear/swipe saves a prior ink state for undo while history remains available.
- Clearing does not reset the typed description or gallery.

Source: [App — handleClear](./App.tsx), [AirCanvas — clearCanvas, triggerClearCanvas, swipe logic](./components/AirCanvas.tsx).

### US-10 — Describe the intended subject

As a creator, I want to type a description, so that image generation can understand my intended subject.

- The description field supports direct text editing.
- The generation prompt instructs the model to prioritize the description for subject identity and use the sketch loosely for composition and size.
- An empty description is accepted, with a generic service-side prompt fallback.
- Successful generation clears the editable field and retains the submitted description separately for the result.

Source: [App — prompt/resultPrompt and handleGenerate](./App.tsx), [generation prompt](./services/geminiService.ts).

Limitation: prompt instructions express requested model behavior; output fidelity is unverified.

### US-11 — Dictate a description

As a creator, I want to add spoken text to my description, so that I can supply instructions while sketching.

- Supported browsers show a microphone button; recognized final text appends to existing text.
- The button toggles listening and shows a red pulsing listening state.
- Holding the qualifying one-finger gesture invokes the same voice toggle.
- Speech recognition is configured for US English and a single utterance.
- Unsupported browsers omit the microphone control; typed input remains available.
- The visible microphone button is disabled during generation.

Source: [VoiceInput](./components/VoiceInput.tsx), [App — handleTranscript/handleVoiceTrigger](./App.tsx), [AirCanvas — one-finger gesture](./components/AirCanvas.tsx).

Limitations: speech failures mostly lack actionable on-screen guidance; gesture toggling does not enforce the visible button’s processing guard. Interim-transcript fallback is present in code but not verified.

### US-12 — Choose an art style

As a creator, I want to choose an output style, so that generated artwork matches my preferred appearance.

- Illustration is selected initially.
- Realistic Photo, Illustration, and Pixel Art appear as ribbon choices.
- Selecting a ribbon style changes the active selection without immediately generating an image.
- Transform sends the selected style and its modifier prompt to the generation service.

Source: [App — Styles ribbon](./App.tsx), [ArtStyle](./types.ts), [STYLE_PROMPTS](./constants.ts).

### US-13 — Transform a sketch into artwork

As a creator, I want to generate artwork from my sketch and description, so that I can explore a polished interpretation.

- Transform can be invoked by its button or the qualifying two-finger gesture.
- Missing key opens the key dialog; missing canvas data shows “Canvas is empty!” temporarily.
- A request sends sketch, description, and style directly from the browser to Google.
- Pending state shows a spinner and disables Transform, API-key access, the visible microphone button, and result-style buttons.
- Success displays the generated image with the submitted description and retains the sketch.
- Failure shows an error strip; text-only/no-image responses are surfaced as errors.

Source: [App — handleGenerate/handleGenerateTrigger](./App.tsx), [generateImageFromSketch](./services/geminiService.ts).

Limitations: no user-facing generation cancellation exists. Other sketch/ribbon controls remain active during a request. The empty check tests for a data URL, not actual visible ink.

### US-14 — Review and restyle a result

As a creator, I want to inspect a result and try another style, so that I can compare interpretations of my idea.

- The result overlay shows artwork, submitted description, style choices, a save hint, and a close control.
- Tracking remains active for gestures; ink is hidden and drawing is gated while a result is visible.
- A result-style selection immediately requests another image using the current retained sketch and submitted description.
- The previous image stays visible while the request is pending and is replaced on success.
- Failure retains the previous image and displays an error.
- Closing the result returns to the underlying sketch without saving that result to the gallery.

Source: [App — handleStyleSwitch/result overlay](./App.tsx), [AirCanvas — isResultVisible](./components/AirCanvas.tsx).

Limitations: failed style requests can leave selected style out of sync with the image. The sketch is not an immutable generation snapshot. Closing during regeneration does not cancel the request.

### US-15 — Save a result to the session gallery

As a creator, I want to collect a generated result in the gallery, so that I can keep it nearby while making another sketch.

- Holding the qualifying three-finger gesture while a result exists prepends a gallery entry.
- The entry stores the image, submitted description, selected style, and timestamp in session memory.
- Saving closes the result and updates the gallery count.
- Saving does not download a file or persist the gallery across refreshes.
- The empty gallery explains the three-finger save action.

Source: [App — handleSaveToGallery/gallery](./App.tsx), [AirCanvas — three-finger gesture](./components/AirCanvas.tsx).

Limitation: no button or keyboard alternative saves to the gallery; the camera must be tracking for the gesture path.

### US-16 — Browse, hide, and delete gallery entries

As a creator, I want to manage saved results during the session, so that I can organize my workspace.

- Gallery starts visible; its toggle shows/hides the sidebar without removing entries.
- Entries appear newest first, with thumbnails, descriptions, and local creation times.
- Hover actions include Download and Delete.
- Delete immediately removes the selected entry; there is no confirmation or gallery undo.
- Refresh clears gallery entries; no reopen/enlarge-result interaction is implemented.

Source: [App — gallery state, deleteFromGallery, Gallery Sidebar](./App.tsx).

### US-17 — Download generated artwork

As a creator, I want to download a generated image, so that I can retain it outside this browser session.

- Save File downloads the current result when one exists; otherwise it performs no download.
- Each gallery entry offers its own Download action.
- Downloads use a timestamp-based filename with a `.png` extension.
- Downloading does not add to or remove from the gallery.

Source: [App — handleDownload, File ribbon, gallery actions](./App.tsx).

Limitations: the title-bar Save Project icon has no handler. The download extension is fixed even though the model response can specify another image MIME type.
