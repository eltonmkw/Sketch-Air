# Sketch Air design reference

This document describes the design implemented in the current source. [AGENTS.md](./AGENTS.md) translates it into instructions for contributors and coding agents. Update both documents when an intentional design change alters these conventions.

## Product and visual direction

Sketch Air is a browser-based creative tool: draw with webcam hand tracking, add a typed or spoken description, and transform the sketch into artwork with Gemini. The description determines the subject; the sketch loosely guides composition and size.

The visual language resembles a classic desktop painting application. Favor compact controls, pale neutral surfaces, thin borders, grouped tools, and a large working area. The canvas and artwork are the focus. Keep explanatory copy brief and attached to the relevant action.

## Workspace composition

The application fills the viewport in a vertical flex layout:

1. **Title bar:** white, compact quick actions, centered “Untitled - Sketch Air,” API key access, and a gallery visibility toggle with count.
2. **Ribbon:** a light gray, 128px-high strip with vertical separators and bottom captions. Preserve the group order: File, Tools, Colors, Styles, Magic. Tools contain the description, microphone, Clear action, and brush size. Magic contains the prominent Transform button.
3. **Workspace:** a flexible camera/canvas region beside an optional 256px-wide white gallery. The gallery scrolls internally; the surrounding workspace clips overflow.
4. **Status bar:** a compact pale gray strip showing canvas mode, selected color, and brush size.

The existing layout is desktop-oriented. Fixed ribbon widths and hidden body scrolling do not establish a complete small-screen layout. Future responsive work should preserve access to every action and prioritize canvas space; narrow-screen support needs explicit browser verification.

## Visual vocabulary

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

The eight brush presets are black, `#EF4444`, `#F59E0B`, `#10B981`, `#3B82F6`, `#8B5CF6`, `#EC4899`, and `#888888`. A native color picker supports custom colors. Default stroke width is 4px; the slider spans 1–20px. The default art style is Illustration; the other styles are Realistic Photo and Pixel Art.

## Canvas and interaction

[AirCanvas.tsx](./components/AirCanvas.tsx) owns camera access, tracking, drawing history, and gesture feedback. A mirrored camera feed appears at half opacity beneath the ink and tracking overlay. The camera requests 640 × 480 input; canvas dimensions follow the video. The layers use `object-cover`, so aspect-ratio changes can crop the displayed content.

| Gesture | Intended action |
| --- | --- |
| Hold thumb/index pinch | Draw |
| Thumbs up | Stop the active stroke |
| One extended finger | Toggle voice input |
| Two extended fingers | Transform |
| Three extended fingers | Save the visible result to the gallery |
| Fast swipe | Erase |

Gesture triggers use consistency checks and cooldowns to reduce accidental activation. Voice, Transform, and Save require more than 30 qualifying frames; elapsed time depends on frame rate. Preserve the separation between drawing and action gestures. Keep the gesture legend and temporary feedback aligned with actual recognition behavior.

The canvas provides component-loading and webcam-start states, a drawing on/off control, and a camera Stop action. Voice input uses browser speech recognition in `en-US`; its button is omitted when unsupported. Recognized text appends to the description. Listening uses red, pulsing feedback.

## Generation and results

- Drawing is available without an API key. Generation opens the key dialog when no key is present.
- Transform shows a purple spinner and disables its button while awaiting a response. Errors appear in a red strip above the canvas.
- Generation retains the sketch and captures the submitted description separately as `resultPrompt`. Successful generation clears the editable description.
- A result appears in a centered white card over a dark, blurred workspace overlay. Include the submitted description, three-finger save hint, style-switch buttons, and close control.
- While a result is visible, tracking remains active and drawing is disabled. Switching result style reuses the retained sketch and submitted description.
- Saving prepends an item to the gallery and closes the result. Gallery entries contain a cropped thumbnail, description, timestamp, and hover actions for download and deletion.
- The gallery exists only in React memory and is lost on reload. Downloads are separate PNG file actions; saving to the gallery does not download a file.

## API key dialog

The description reads “Enter your Gemini API key to bring your sketches to life.” The password field has an accessible name, “Gemini API key,” without a visible field label.

The native “Bring Your Own AI API Key” dialog opens on launch when no remembered key exists. Test Connection validates the entered key. Success changes the button to an accented Done action; only clicking Done activates the key and dismisses the modal. Failure immediately focuses the password field with a red border and concise accessible error. Editing or retrying clears validation. Inputs are disabled during testing and success confirmation. There is no Use key or Continue without key action. An accessible X button at the top right and Escape still allow drawing without a key; there is no footer Close button.

Keys live only in React memory by default and clear on refresh. “Remember on this device” opts into local storage after Done, retaining the key across refreshes for 30 days or until removed. Expired or malformed stored credentials are discarded on load. Show Remove saved key only for a nonempty active key. Removal clears both stores and the active key. Storage failure falls back to memory. Disclose browser-storage limitations, direct Google requests, and possible billing. A successful model-information test does not guarantee generation quota, billing, or access.

## Maintenance standards and known gaps

The following are requirements for future changes, not claims of completed accessibility or device testing:

- Preserve keyboard operation, visible focus, accessible names, and text alongside status colors. Give new icon-only actions accessible labels.
- Provide usable alternatives when adding gesture-only interactions. The current gallery-save flow is gesture-only and needs deliberate accessibility work if changed.
- Respect reduced-motion preferences when adding or revising spinners, pulsing indicators, bouncing feedback, or transitions. Existing animation classes do not establish full reduced-motion support.
- Check controls, dialog visibility, result actions, and overflow at smaller viewports and increased zoom.
- Do not describe the title-bar Save Project icon as functional: it currently has no handler. Redo is disabled. Do not imply project persistence or pointer-based drawing exists.

## Implementation sources

- [App.tsx](./App.tsx): application layout, ribbon, generation flow, results, and gallery.
- [AirCanvas.tsx](./components/AirCanvas.tsx): video and canvas layers, tracking, gestures, and camera states.
- [VoiceInput.tsx](./components/VoiceInput.tsx): browser speech recognition and microphone states.
- [ApiKeyDialog.tsx](./components/ApiKeyDialog.tsx): key entry, testing, storage choice, and disclosure.
- [types.ts](./types.ts) and [constants.ts](./constants.ts): style names, icon mapping, and generation style prompts.
- [geminiService.ts](./services/geminiService.ts) and [apiKeyStorage.ts](./services/apiKeyStorage.ts): generation and credential behavior.

This reference was reverse-engineered from source; it is not a record of live browser, webcam, microphone, or Gemini validation.
