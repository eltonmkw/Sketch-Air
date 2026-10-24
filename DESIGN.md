# Sketch Air design reference

This document describes the design implemented in the current source. It separates the shared **design system** (tokens, components, and code mapping) from **design intent** (hierarchy, states, motion, and tone). Intent is inferred from behavior and layout, not a claim about the original designer’s rationale. [AGENTS.md](./AGENTS.md) translates it into instructions for contributors and coding agents. Update both documents when an intentional design change alters these conventions.

## Product and visual direction

Sketch Air is a browser-based creative tool: draw with webcam hand tracking, add a typed or spoken description, and transform the sketch into artwork with Gemini. The description determines the subject; the sketch loosely guides composition and size.

The visual language resembles a classic desktop painting application. Favor compact controls, pale neutral surfaces, thin borders, grouped tools, and a large working area. The canvas and artwork are the focus. Keep explanatory copy brief and attached to the relevant action.

## Design system

### Tokens

These are observed values, not a centralized token system. Styling currently uses Tailwind utilities in JSX, global CSS in [index.html](./index.html), and inline styles for the API key dialog.

| Role | Existing treatment |
| --- | --- |
| App background | `#dfe8f5` |
| Workspace surround | `#e0e4eb` |
| Ribbon | `#f5f6f7` |
| Status bar | `#f0f0f0` |
| Panels and inputs | White with thin gray borders |
| Default text | `#1e293b`, with gray secondary text |
| Tool hover | `#cce8ff` background, `#99d1ff` border |
| Selected ribbon style | `#ffeb9c` background, `#ffb800` border |
| Transform | Pale purple gradient, purple border, purple Sparkles icon |
| Result style selection | Purple tint and border |
| Errors / destructive actions | Red |
| Drawing / gallery-save feedback | Green / emerald |

Use the existing Segoe UI, Tahoma, Geneva, Verdana, sans-serif stack. Most chrome uses 10–12px text; inputs use about 14px. Camera onboarding and the API key dialog use larger headings. Lucide icons provide the primary icon language; emoji reinforce gesture instructions. Ribbon controls have small corner radii and restrained shadows; result cards and dialogs are more rounded.

Shared sizing conventions include 24px color swatches, 16–20px small tool icons, and 32px primary ribbon icons. The API key dialog uses `min(440px, calc(100% - 32px))` width, 24px padding, a 12px radius, and a 22px heading. Global scrollbars are 8px wide with a gray, 4px-radius thumb.

The eight brush presets are black, `#EF4444`, `#F59E0B`, `#10B981`, `#3B82F6`, `#8B5CF6`, `#EC4899`, and `#888888`. A native color picker supports custom colors. Default stroke width is 4px; the slider spans 1–20px. The default art style is Illustration; the other styles are Realistic Photo and Pixel Art.

### Components

The reusable units are React components; most workspace chrome remains inline in `App.tsx`. There is no separate component library.

| Unit | Responsibility and interface |
| --- | --- |
| `App` | Owns ribbon selections, editable/submitted descriptions, generation state, result, gallery, and active key. Composes all other units. |
| `AirCanvas` | Owns webcam, hand tracking, ink/history, drawing toggle, and gesture feedback. Exposes `clearCanvas()` and `undo()`; emits sketch data URLs and voice/transform/save callbacks. `isResultVisible` suppresses drawing while tracking continues. |
| `VoiceInput` | Appends recognized speech through `onTranscript`; exposes `toggle()` and `isListening`. The visible button is disabled by `isProcessing`. |
| `ApiKeyDialog` | Native modal for testing and activating credentials. Receives `open`, `hasKey`, and `savedKey`; activates the key through `onSave` and requests dismissal through `onClose`. |

### Code Connect: implementation mapping

“Code Connect” here maps design decisions to source. The repository has no Figma Code Connect integration or design-to-code binding files.

| Design concern | Source of truth |
| --- | --- |
| Global font, body overflow, scrollbars, Tailwind CDN | [index.html](./index.html) |
| Ribbon, palette presets, selections, result and gallery chrome | [App.tsx](./App.tsx) |
| Camera/ink/tracking layers, gestures and canvas controls | [AirCanvas.tsx](./components/AirCanvas.tsx) |
| Microphone appearance and recognition lifecycle | [VoiceInput.tsx](./components/VoiceInput.tsx) |
| Modal dimensions, field validation and connection indicators | [ApiKeyDialog.tsx](./components/ApiKeyDialog.tsx) |
| Style labels, icons and generation modifiers | [types.ts](./types.ts), [constants.ts](./constants.ts) |
| Browser-to-Google requests and prompt construction | [geminiService.ts](./services/geminiService.ts) |
| Credential expiry, persistence and removal | [apiKeyStorage.ts](./services/apiKeyStorage.ts) |

Keep style labels, icons and prompt modifiers synchronized. Visual values are distributed across these files; changing a repeated utility in one component does not update the others.

## Design intent

### Hierarchy

The canvas has priority; compact chrome reserves space for drawing, and the gallery is secondary. Transform has the strongest action emphasis. A generated result temporarily takes priority over the canvas; its overlay leaves the ribbon and gallery outside it.

The application fills the viewport in a vertical flex layout:

1. **Title bar:** white, compact quick actions, centered “Untitled - Sketch Air,” API key access, and a gallery visibility toggle with count.
2. **Ribbon:** a light gray, 128px-high strip with vertical separators and bottom captions. Preserve the group order: File, Tools, Colors, Styles, Magic. Tools contain the description, microphone, Clear action, and brush size. Magic contains the prominent Transform button.
3. **Workspace:** a flexible camera/canvas region beside an optional 256px-wide white gallery. The gallery scrolls internally; the surrounding workspace clips overflow.
4. **Status bar:** a compact pale gray strip showing canvas mode, selected color, and brush size.

The existing layout is desktop-oriented. Fixed ribbon widths and hidden body scrolling do not establish a complete small-screen layout. Future responsive work should preserve access to every action and prioritize canvas space; narrow-screen support needs explicit browser verification.

### States

These states describe observed behavior, including incomplete failure feedback.

| State / trigger | Visible response and behavior |
| --- | --- |
| Tracking model loading | “Loading components...” and a blue spinner. Model-load failures only log to the console; the loading screen can remain. |
| Camera inactive | “Enable Webcam” card with Start. Camera setup initially requests audio and video, then retries video only. Failures log to the console rather than a dedicated error panel. |
| Camera active | Mirrored video, ink, tracking cursor, gesture legend, Drawing ON/OFF and Stop controls. A two-second warmup prevents drawing/action triggers. Stop clears ink and undo history. |
| Drawing disabled | Red “Drawing: OFF” control; drawing stops while tracking continues. |
| Voice listening | Red pulsing microphone; recognized text appends to the description. The button is omitted without browser speech recognition support. |
| Generation pending | Purple Transform spinner; Transform, API-key access, visible microphone button and result-style buttons are disabled. Other drawing/ribbon controls remain available. |
| Generation failure | Red text strip above the canvas. Missing canvas data shows “Canvas is empty!” for three seconds; request errors remain until another action clears them. |
| Result visible | Artwork card over the canvas; tracking continues, ink is hidden and drawing is disabled. Camera controls and legend are hidden. |
| Gallery empty / populated | Gesture-save guidance, or newest-first thumbnails with description, local time, download and delete actions. Visibility toggle preserves entries in memory. |
| Credential testing / success / failure | Text and color indicators, an explicit Done step after success, or focused field validation. See [API key dialog](#api-key-dialog). |

Gesture feedback reports recognition, not completion: “Listening...”, “Transforming...” and “Saving to Gallery...” can appear even when their callback performs no action.

### Motion

Motion reinforces activity, selection and feedback. These treatments are declared in [App.tsx](./App.tsx), [AirCanvas.tsx](./components/AirCanvas.tsx) and [VoiceInput.tsx](./components/VoiceInput.tsx):

| Treatment | Current use |
| --- | --- |
| Spin | Model loading, Transform pending, selected result style during regeneration |
| Pulse | Listening microphone and three-finger result-save hint |
| Bounce | Temporary centered gesture feedback; messages last roughly 1–2 seconds |
| Opacity transition, 500ms | Camera and ink layer visibility |
| Microphone transition, 300ms | Listening/idle button appearance |
| Hover/selection transitions | Color swatches scale to 110%; style buttons, gallery shadows and hover actions transition |

The result overlay declares `animate-in fade-in duration-300`, but the repository supplies no matching animation plugin or custom keyframes; a working entrance fade is unverified. Reduced-motion variants are absent. When revising motion, provide a reduced-motion treatment and retain textual feedback.

### Tone

Use short action labels for tools (“Clear”, “Transform”, “Stop”) and explicit state text for feedback (“Drawing: ON”, “Connection failed”). Keep onboarding instructions next to the required action, as in “Enable Webcam” and “Describe object...”. Gesture help pairs emoji, finger count and action; keep all three aligned with recognition behavior.

Creative language belongs in onboarding and generation (“bring your sketches to life”, “Magic”). Credential copy stays factual: where the key is stored, where requests go, and when charges may apply. Connection errors identify a recovery step rather than promising generation access. Preserve the distinction between gallery save and PNG download in labels and help.

### Canvas and interaction

[AirCanvas.tsx](./components/AirCanvas.tsx) owns camera access, tracking, drawing history, and gesture feedback. A mirrored camera feed appears at half opacity beneath the ink and tracking overlay. The camera requests 640 × 480 input; canvas dimensions follow the video. The layers use `object-cover`, so aspect-ratio changes can crop the displayed content.

| Gesture | Intended action |
| --- | --- |
| Hold thumb/index pinch | Draw |
| Thumbs up | Stop the active stroke |
| One extended finger | Toggle voice input |
| Two extended fingers | Transform |
| Three extended fingers | Save the visible result to the gallery |
| Fast swipe | Erase |

Gesture triggers use consistency checks and cooldowns to reduce accidental activation. Pinch starts after five qualifying frames below a normalized thumb/index distance of `0.04` and stops above `0.08`. Voice, Transform, and Save require more than 30 qualifying frames and share a three-second cooldown after the two-second camera warmup; elapsed hold time depends on frame rate. Swipe erase uses wrist movement above `0.06` normalized units per frame and a separate one-second cooldown. Preserve the separation between drawing and action gestures. Keep the gesture legend and temporary feedback aligned with actual recognition behavior.

The canvas provides component-loading and webcam-start states, a drawing on/off control, and a camera Stop action. Voice input uses browser speech recognition in `en-US`; its button is omitted when unsupported. Recognized text appends to the description. Listening uses red, pulsing feedback.

### Generation and results

[geminiService.ts](./services/geminiService.ts) sends the sketch, description and style prompt directly from the browser to Google’s `gemini-2.5-flash-image`; there is no application backend. Style switching reads the current `canvasDataUrl` and submitted `resultPrompt`, not an immutable snapshot of the original sketch.

- Drawing is available without an API key. Generation opens the key dialog when no key is present.
- Transform shows a purple spinner and disables its button while awaiting a response. Errors appear in a red strip above the canvas.
- The ribbon’s Save File action downloads the visible result; it is distinct from the inactive title-bar Save Project icon.
- Generation retains the sketch and captures the submitted description separately as `resultPrompt`. Successful generation clears the editable description.
- A result appears in a centered white card over a dark, blurred workspace overlay. Include the submitted description, three-finger save hint, style-switch buttons, and close control.
- While a result is visible, tracking remains active and drawing is disabled. Switching result style reuses the retained sketch and submitted description, keeps the old image visible while pending, and replaces it on success. A failed style request leaves the old image visible with an error. The selected style updates before the request, so a failed switch can leave the selection out of sync with the image.
- Saving prepends an item to the gallery and closes the result. Gallery entries contain a cropped thumbnail, description, timestamp, and hover actions for download and deletion.
- The gallery exists only in React memory and is lost on reload. Downloads are separate PNG file actions; saving to the gallery does not download a file.

### API key dialog

The description reads “Enter your Gemini API key to bring your sketches to life.” The password field has an accessible name, “Gemini API key,” without a visible field label.

The native “Bring Your Own AI API Key” dialog opens on launch when no remembered key exists. Test Connection checks model information for the entered or active key with a 15-second timeout. Success changes the button to an accented Done action; only clicking Done activates the key and dismisses the modal. Failure immediately focuses the password field with a red border and concise accessible error. Editing or retrying clears validation. The password field is disabled while testing and after success; the Remember checkbox is disabled only while testing. There is no Use key or Continue without key action. An accessible X button at the top right and Escape still allow drawing without a key; there is no footer Close button.

Keys live only in React memory by default and clear on refresh. “Remember on this device” opts into local storage after Done, retaining the key across refreshes for 30 days or until removed. Expired or malformed stored credentials are discarded on load. Show Remove saved key only for a nonempty active key. Removal clears local storage, session storage, and the active key. Storage failure still activates the key in memory, keeps the dialog open with a notice, and requires a second Done click to dismiss it. Disclose browser-storage limitations, direct Google requests, and possible billing. A successful model-information test does not guarantee generation quota, billing, or access.

## Maintenance standards and known gaps

The following are requirements for future changes, not claims of completed accessibility or device testing:

- Preserve keyboard operation, visible focus, accessible names, and text alongside status colors. Give new icon-only actions accessible labels.
- Provide usable alternatives when adding gesture-only interactions. The current gallery-save flow is gesture-only and needs deliberate accessibility work if changed.
- The result overlay is a styled `div`, without dialog semantics or focus management; its icon-only close button lacks an accessible name.
- Normal sketch export composites ink onto white as JPEG; undo emits PNG, while the generation service always labels sketch input `image/png`. This MIME mismatch remains an implementation gap.
- Respect reduced-motion preferences when adding or revising spinners, pulsing indicators, bouncing feedback, or transitions. Existing animation classes do not establish full reduced-motion support.
- Check controls, dialog visibility, result actions, and overflow at smaller viewports and increased zoom.
- Do not describe the title-bar Save Project icon as functional: it currently has no handler. Redo is disabled. Do not imply project persistence or pointer-based drawing exists.

## Verification scope

This reference was reverse-engineered from source; it is not a record of live browser, webcam, microphone, or Gemini validation. Source ownership is listed under [Code Connect](#code-connect-implementation-mapping). Treat inferred intent and declared animation classes separately from verified runtime behavior.
