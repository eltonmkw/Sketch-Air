# Sketch Air design system

This is the standalone, reverse-engineered design system reference for Sketch Air. Every value below was read from the current source and is cited to the file it came from. It is not a record of live browser, webcam, microphone, or Gemini runtime validation (see [Verification scope](#verification-scope)).

Sketch Air has **no centralized token system**. Styling is produced three ways:

1. **Tailwind CDN utility classes written inline in JSX.** Tailwind loads from `https://cdn.tailwindcss.com` in [index.html](../index.html). There is no `tailwind.config`, no CSS modules, and no separate component library.
2. **Global CSS in [index.html](../index.html).** Font stack, body background, text color, body overflow, and custom scrollbars.
3. **Inline `style={{...}}` objects** for the API key dialog in [components/ApiKeyDialog.tsx](../components/ApiKeyDialog.tsx).

Colors are hardcoded hex literals, mostly as Tailwind arbitrary values (for example `bg-[#dfe8f5]`, `bg-[#ffeb9c]`, `border-[#ffb800]`). The same literal can repeat across components; changing one occurrence does not update the others.

This document is the expanded, standalone design system. [DESIGN.md](../DESIGN.md) covers the same system more briefly and additionally records **design intent** (hierarchy, states, motion, tone) and maintenance standards. [AGENTS.md](../AGENTS.md) translates DESIGN.md into contributor and coding-agent instructions. This reference stays consistent with both; where a value here is more specific, it cross-links rather than contradicts, and where the source and DESIGN.md disagree it trusts the source and notes the reconciliation (see [Reconciliation and known gaps](#reconciliation-and-known-gaps)).

## Color tokens

These are observed color roles, not a declared token set. Values are exact and cited to file.

### Global and chrome surfaces

| Role | Value | Source |
| --- | --- | --- |
| App background | `#dfe8f5` (`bg-[#dfe8f5]` on App root; `background-color: #dfe8f5` on body) | [App.tsx](../App.tsx) root `div`; [index.html](../index.html) body |
| Workspace surround | `#e0e4eb` (`bg-[#e0e4eb]`) | [App.tsx](../App.tsx) workspace |
| Ribbon | `#f5f6f7` (`bg-[#f5f6f7]`) | [App.tsx](../App.tsx) ribbon |
| Status bar | `#f0f0f0` (`bg-[#f0f0f0]`) | [App.tsx](../App.tsx) status bar |
| Camera loading/start backdrop | `#f0f0f0` (`bg-[#f0f0f0]`) | [components/AirCanvas.tsx](../components/AirCanvas.tsx) start/loading screen |
| Title bar | White with `border-gray-300` bottom border | [App.tsx](../App.tsx) title bar |
| Panels and inputs | White (`bg-white`) with thin gray borders (`border-gray-300` / `border-gray-200`) | [App.tsx](../App.tsx) |
| Default text | `#1e293b` (body `color`) | [index.html](../index.html) body; also dialog `color: '#1e293b'` in [components/ApiKeyDialog.tsx](../components/ApiKeyDialog.tsx) |
| Scrollbar track | `#f1f1f1` | [index.html](../index.html) `::-webkit-scrollbar-track` |
| Scrollbar thumb | `#c1c1c1`, hover `#a8a8a8`, radius `4px` | [index.html](../index.html) `::-webkit-scrollbar-thumb` |

### Interactive and state colors

| Role | Value | Source |
| --- | --- | --- |
| Tool / style hover | `bg-[#cce8ff]` with `border-[#99d1ff]` | [App.tsx](../App.tsx) ribbon tool and style buttons |
| Selected ribbon style | `bg-[#ffeb9c]` `border-[#ffb800]` with `shadow-[inset_0_0_2px_rgba(255,184,0,0.5)]` | [App.tsx](../App.tsx) Styles group |
| Transform button (idle) | `bg-gradient-to-b from-purple-50 to-purple-100 border-purple-300 hover:bg-purple-200 active:bg-purple-300` | [App.tsx](../App.tsx) Magic group |
| Transform Sparkles icon | `text-purple-600` (idle), `text-purple-400` (pending spinner) | [App.tsx](../App.tsx) |
| Transform label | `text-purple-900` | [App.tsx](../App.tsx) |
| Transform disabled | `bg-gray-100 text-gray-400 border-gray-300` | [App.tsx](../App.tsx) |
| Result-style button (selected) | `bg-purple-100 border-purple-400 text-purple-900`; unselected `bg-white border-gray-200 text-gray-600`; hover `hover:bg-purple-50 hover:border-purple-300` | [App.tsx](../App.tsx) result overlay style switcher |
| Error strip | `bg-red-100 text-red-700 border-red-300` | [App.tsx](../App.tsx) error bar |
| Clear (eraser) icon | `text-red-500` | [App.tsx](../App.tsx) Tools group |
| Undo icon | `text-blue-600` | [App.tsx](../App.tsx) title bar |
| Save File (download) icon | `text-blue-600` | [App.tsx](../App.tsx) File group |
| Save Project (title bar) icon | `text-purple-700` (no handler; see known gaps) | [App.tsx](../App.tsx) title bar |
| Redo icon | `text-gray-400` (disabled) | [App.tsx](../App.tsx) title bar |
| Gallery count badge | `bg-blue-100 text-blue-700` (also the active Gallery toggle) | [App.tsx](../App.tsx) |
| Save feedback / three-finger hint | emerald: `text-emerald-600`, `bg-emerald-50` (hint); toast icon `text-emerald-400` | [App.tsx](../App.tsx) result overlay; [components/AirCanvas.tsx](../components/AirCanvas.tsx) toast |
| Result overlay backdrop | `bg-black/80 backdrop-blur-sm` | [App.tsx](../App.tsx) |
| Gallery hover action backdrop | `bg-black/50` | [App.tsx](../App.tsx) |

### Voice input button colors

| State | Value | Source |
| --- | --- | --- |
| Listening | `bg-red-500 animate-pulse text-white shadow-lg shadow-red-500/50` | [components/VoiceInput.tsx](../components/VoiceInput.tsx) |
| Idle | `bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600` | [components/VoiceInput.tsx](../components/VoiceInput.tsx) |
| Processing (disabled) | `opacity-50 cursor-not-allowed` | [components/VoiceInput.tsx](../components/VoiceInput.tsx) |

### API key dialog colors (inline styles)

All from [components/ApiKeyDialog.tsx](../components/ApiKeyDialog.tsx).

| Role | Value |
| --- | --- |
| Dialog border | `#cbd5e1` |
| Dialog text | `#1e293b` |
| Input border (normal) | `#94a3b8` |
| Input border (error) | `#dc2626` |
| Field error text | `#b91c1c` |
| Submit button (success/Done) background | `#1d4ed8` with white text; otherwise white background with `#1e293b` text and `#94a3b8` border |
| Status indicator: idle | `#64748b` ("Not tested") |
| Status indicator: testing | `#eab308` ("Checking connection") |
| Status indicator: success | `#15803d` ("Connected") |
| Status indicator: error | `#dc2626` ("Connection failed") |

### Canvas overlay drawing colors

Set directly on the canvas 2D context in [components/AirCanvas.tsx](../components/AirCanvas.tsx) (not Tailwind): drawing cursor fill uses the active `strokeColor` with a `#ffffff` ring; hover cursor uses `rgba(0, 150, 255, 0.4)` fill with `rgba(255, 255, 255, 0.8)` ring; trigger "loading ring" colors are `red` (voice), `purple` (transform), `#10B981` (save), `#2563EB` (thumbs up); pinch proximity line uses orange `rgba(255, 165, 0, 0.8)` while holding.

## Brush palette

The eight presets are defined in `PRESET_COLORS` in [App.tsx](../App.tsx), listed here verbatim with their source comments:

| Swatch | Hex | Name |
| --- | --- | --- |
| 1 | `#000000` | Black |
| 2 | `#EF4444` | Red |
| 3 | `#F59E0B` | Orange |
| 4 | `#10B981` | Emerald |
| 5 | `#3B82F6` | Blue |
| 6 | `#8B5CF6` | Violet |
| 7 | `#EC4899` | Pink |
| 8 | `#888888` | Gray |

- A native `<input type="color">` custom picker ("Edit Colors") supports arbitrary colors. Source: [App.tsx](../App.tsx) Colors group.
- Default `strokeColor` is `#000000`. Source: `useState('#000000')` in [App.tsx](../App.tsx).
- Default `strokeWidth` is `4`. Source: `useState(4)` in [App.tsx](../App.tsx).
- Size slider `<input type="range">` spans `min="1"` to `max="20"` (pixels). Source: [App.tsx](../App.tsx) Tools group.
- The status bar reflects the current swatch and size: `Color:` shows a small round swatch filled with `strokeColor`, and `Size: {strokeWidth}px`. Source: [App.tsx](../App.tsx) status bar.
- Selected preset swatch gets `border-2 border-black shadow-sm`; unselected gets `border-gray-300`. Hover scales to `110%` (`hover:scale-110 transition-transform`). Source: [App.tsx](../App.tsx).

## Typography and iconography

### Type

- Font stack: `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`. Source: body `font-family` in [index.html](../index.html).
- Weights loaded from Google Fonts: Segoe UI `300`, `400`, `600`, `700`. Source: `<link ... family=Segoe+UI:wght@300;400;600;700 ...>` in [index.html](../index.html).

Observed sizing conventions (Tailwind utilities unless noted):

| Context | Size | Source |
| --- | --- | --- |
| Ribbon captions / small labels | `text-[10px]` / `text-[11px]` | [App.tsx](../App.tsx) group captions, size label, gallery meta |
| Ribbon body / buttons | `text-xs` (~12px) | [App.tsx](../App.tsx) title bar, Clear, status bar, result style buttons |
| Description input | `text-sm` (~14px) | [App.tsx](../App.tsx) prompt input |
| ApiKeyDialog heading `h1` | `fontSize: 22`, `fontWeight: 600` | [components/ApiKeyDialog.tsx](../components/ApiKeyDialog.tsx) |
| ApiKeyDialog body / status | `fontSize: 13` | [components/ApiKeyDialog.tsx](../components/ApiKeyDialog.tsx) |
| AirCanvas "Enable Webcam" heading `h3` | `text-lg`, `font-semibold` | [components/AirCanvas.tsx](../components/AirCanvas.tsx) |
| AirCanvas feedback toast | `text-xl`, `font-bold` | [components/AirCanvas.tsx](../components/AirCanvas.tsx) |
| Gallery thumbnail title / timestamp | `text-[10px]` / `text-[9px]` | [App.tsx](../App.tsx) |

### Icon language

Icons come from `lucide-react`. Emoji reinforce gesture instructions (see [Gesture model](#gesture-model)).

Imported icons and their roles:

- [App.tsx](../App.tsx): `Sparkles` (Transform), `Download` (Save File / gallery download), `RefreshCw` (pending spinner, style-switch spinner), `Eraser` (Clear), `Image as ImageIcon` (Gallery toggle), `Save` (title-bar Save Project), `Undo`, `Redo`, `MousePointer2` (status-bar canvas indicator), `Palette` (imported), `X` (close result card), `Trash2` (gallery delete).
- [components/AirCanvas.tsx](../components/AirCanvas.tsx): `Video` (Enable Webcam), `Play` (Start), `Power` (Cancel / Stop), `Trash2` (cleared toast), `Mic` (listening toast), `Sparkles` (transforming toast), `Save` (saving toast), `ThumbsUp` (stopped toast).
- [components/VoiceInput.tsx](../components/VoiceInput.tsx): `Mic` (listening), `MicOff` (idle).
- [components/ApiKeyDialog.tsx](../components/ApiKeyDialog.tsx): `X` (close dialog).
- [constants.ts](../constants.ts) `STYLE_ICONS`: `Camera` -> Realistic Photo, `Palette` -> Illustration, `Grid` -> Pixel Art.

Icon sizes:

| Size | Class | Where | Source |
| --- | --- | --- | --- |
| 32px | `w-8 h-8` | Primary ribbon actions (Download / Transform), feedback toast icons | [App.tsx](../App.tsx), [components/AirCanvas.tsx](../components/AirCanvas.tsx) |
| ~16px | `w-4 h-4` | Small tools (Undo/Redo/Save Project, Clear eraser, gallery download/delete) | [App.tsx](../App.tsx) |
| ~20px | `w-5 h-5` | Style icons in ribbon, voice Mic/MicOff, dialog `X` (`size={20}`) | [App.tsx](../App.tsx), [components/VoiceInput.tsx](../components/VoiceInput.tsx), [components/ApiKeyDialog.tsx](../components/ApiKeyDialog.tsx) |
| 24px | `w-6 h-6` | Color swatches and native color input | [App.tsx](../App.tsx) |

## Spacing, sizing, and radii

All classes are Tailwind utilities in [App.tsx](../App.tsx) unless noted.

| Element | Value | Source |
| --- | --- | --- |
| Ribbon height | `h-32` (128px) | [App.tsx](../App.tsx) |
| Gallery sidebar width | `w-64` (256px) | [App.tsx](../App.tsx) |
| Color swatches / custom picker | `w-6 h-6` (24px) | [App.tsx](../App.tsx) |
| Description input height | `h-8` (32px) | [App.tsx](../App.tsx) |
| Size slider width | `w-20` | [App.tsx](../App.tsx) |
| Ribbon group min-widths | File `min-w-[70px]`, Tools `min-w-[200px]`, Colors `min-w-[140px]`, Magic `min-w-[100px]`; Styles group is `flex-1 max-w-sm` | [App.tsx](../App.tsx) |
| Result card | `rounded-lg`, `max-w-4xl`; image `max-h-[60vh] object-contain` | [App.tsx](../App.tsx) |
| Result overlay padding | `p-8` | [App.tsx](../App.tsx) |
| Gallery thumbnails | `h-32 object-cover` | [App.tsx](../App.tsx) |
| ApiKeyDialog | width `min(440px, calc(100% - 32px))`, `padding: 24`, `borderRadius: 12` | [components/ApiKeyDialog.tsx](../components/ApiKeyDialog.tsx) |
| Scrollbars | width/height `8px`, thumb radius `4px` | [index.html](../index.html) |

### Radii convention

Ribbon controls use small corner radii: `rounded` and `rounded-sm` (for example swatches `rounded-sm`, ribbon tool wrappers `rounded`). Cards, dialogs, and toasts are more rounded: result card `rounded-lg`, gallery cards `rounded-md`, feedback toast `rounded-xl`, gallery badge `rounded-full`, ApiKeyDialog `borderRadius: 12`. Source: [App.tsx](../App.tsx), [components/AirCanvas.tsx](../components/AirCanvas.tsx), [components/ApiKeyDialog.tsx](../components/ApiKeyDialog.tsx).

## Component inventory

The reusable units are React components. Most workspace chrome is inline in [App.tsx](../App.tsx); there is no separate component library.

### `App` — [App.tsx](../App.tsx)

- **Responsibility:** owns the full layout and application state: ribbon selections (`strokeColor`, `strokeWidth`, `selectedStyle`), editable `prompt` versus submitted `resultPrompt`, generation state (`isGenerating`, `generatedImage`, `error`), `gallery` and `showGallery`, and the active `apiKey` / `showApiKeyDialog`. Composes all other components and orchestrates generation via `generateImageFromSketch`.
- **Key visual states:** error strip, generation spinner, result overlay, gallery empty vs populated.

### `AirCanvas` — [components/AirCanvas.tsx](../components/AirCanvas.tsx)

- **Props:** `onCanvasUpdate(dataUrl)`, `onVoiceTrigger()`, `onGenerateTrigger()`, `onSaveTrigger()`, `isDrawingMode`, `strokeColor`, `strokeWidth`, `isResultVisible`.
- **Imperative handle (`AirCanvasHandle`):** `clearCanvas()`, `undo()`.
- **Responsibility:** owns the webcam (requests `640 x 480`, `facingMode: "user"`, `audio: false`), the MediaPipe `HandLandmarker` (tasks-vision `0.10.0` via CDN, `numHands: 1`, confidences `0.5`), two canvas layers (ink `drawingCanvasRef` + cursor/UI `overlayCanvasRef`) plus a mirrored video layer at `opacity-50`, undo history capped at **20** `ImageData` steps, gesture recognition, and transient feedback toasts. A 2000ms warmup (`isWarmup`) blocks triggers after the camera starts.
- **Key visual states:** model loading, camera inactive (Start/Cancel), camera active (mirrored video, gesture legend, Drawing ON/OFF, Stop), feedback toast.

### `VoiceInput` — [components/VoiceInput.tsx](../components/VoiceInput.tsx)

- **Props:** `onTranscript(text)`, `isProcessing?` (default `false`).
- **Imperative handle (`VoiceInputHandle`):** `toggle()`, `isListening`.
- **Responsibility:** wraps the Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) with `continuous = false`, `interimResults = true`, `lang = 'en-US'`. Returns `null` (renders nothing) when the browser has no speech recognition support. Appends recognized text through `onTranscript`.
- **Key visual states:** listening (`bg-red-500 animate-pulse`, `Mic`), idle (`bg-slate-700`, `MicOff`), disabled while `isProcessing`.

### `ApiKeyDialog` — [components/ApiKeyDialog.tsx](../components/ApiKeyDialog.tsx)

- **Props:** `open`, `hasKey`, `savedKey`, `onSave(key)`, `onClose()`.
- **Responsibility:** native `<dialog>` opened with `showModal()`. "Test Connection" calls `testApiKey` and, on success, swaps the submit button to an accented "Done" (`#1d4ed8`); only Done activates the key via `onSave` and dismisses. On failure it focuses the password input with a red border and an accessible error. "Remember on this device" opts into 30-day local storage after Done. Handles storage fallback: a `write-failed` / `removal-failed` result keeps the dialog open with a notice and requires a second Done.
- **Key visual states:** idle / testing / success / error status indicator (see color table), field-error state, storage-fallback notice, optional "Remove saved key".

### Inline chrome regions (in [App.tsx](../App.tsx))

Not standalone components, but distinct design regions:

1. **Title bar:** white, `border-gray-300`; quick actions (Save Project, Undo, Redo), centered "Untitled - Sketch Air", API key button (shows `✓` when a key is active), Gallery toggle with count.
2. **Ribbon (`h-32`):** groups in fixed order File, Tools, Colors, Styles, Magic, separated by vertical `border-r` dividers with bottom captions.
3. **Workspace:** flexible camera/canvas region (`flex-1 bg-black`) beside the optional gallery, on an `#e0e4eb` surround with `overflow-hidden`.
4. **Result overlay:** `absolute inset-0 z-40 bg-black/80 backdrop-blur-sm` with a centered white card.
5. **Gallery sidebar (`w-64`):** white, internal `overflow-y-auto`, newest-first thumbnails with hover download/delete.
6. **Status bar:** `#f0f0f0` strip showing canvas mode, color swatch, and `Size: {n}px`.

## Interaction and state patterns

Observed states and their feedback (consistent with the States table in [DESIGN.md](../DESIGN.md)):

| State / trigger | Visible response | Source |
| --- | --- | --- |
| Model loading | "Loading components..." with a blue spinner (`animate-spin ... border-blue-500`) | [components/AirCanvas.tsx](../components/AirCanvas.tsx) |
| Camera inactive | "Enable Webcam" card with Start (`Play`) / Cancel (`Power`) | [components/AirCanvas.tsx](../components/AirCanvas.tsx) |
| Camera active | Mirrored video at `opacity-50` (`transform -scale-x-100`), ink + cursor overlays, gesture legend, Drawing ON/OFF and Stop controls; 2000ms warmup blocks triggers | [components/AirCanvas.tsx](../components/AirCanvas.tsx) |
| Drawing toggled off | "Drawing: OFF" in `text-red-600`; "Drawing: ON" in `text-green-700` | [components/AirCanvas.tsx](../components/AirCanvas.tsx) |
| Voice listening | Red pulsing mic button | [components/VoiceInput.tsx](../components/VoiceInput.tsx) |
| Generation pending | Purple `RefreshCw animate-spin`; Transform, API-key, visible mic, and result-style buttons disabled | [App.tsx](../App.tsx), [components/VoiceInput.tsx](../components/VoiceInput.tsx) |
| Generation failure | Red strip above the canvas; "Canvas is empty!" clears after 3000ms, request errors persist | [App.tsx](../App.tsx) |
| Result visible | Artwork card over `bg-black/80 backdrop-blur-sm animate-in fade-in duration-300`; tracking continues, ink hidden, drawing disabled | [App.tsx](../App.tsx) |
| Gallery empty vs populated | Gesture-save guidance, or newest-first thumbnails with description, local time, download and delete | [App.tsx](../App.tsx) |

### Motion treatments

| Treatment | Current use | Source |
| --- | --- | --- |
| `animate-spin` | Model loading, Transform pending, selected result style during regeneration | [App.tsx](../App.tsx), [components/AirCanvas.tsx](../components/AirCanvas.tsx) |
| `animate-pulse` | Listening mic, three-finger save hint | [components/VoiceInput.tsx](../components/VoiceInput.tsx), [App.tsx](../App.tsx) |
| `animate-bounce` | Feedback toast (messages last ~1-2s) | [components/AirCanvas.tsx](../components/AirCanvas.tsx) |
| Opacity transition `duration-500` | Camera and ink layer visibility | [components/AirCanvas.tsx](../components/AirCanvas.tsx) |
| Transition `duration-300` | Mic button idle/listening | [components/VoiceInput.tsx](../components/VoiceInput.tsx) |
| `hover:scale-110 transition-transform` | Color swatch hover | [App.tsx](../App.tsx) |

Note: the result overlay declares `animate-in fade-in duration-300`, but the repository supplies no matching animation plugin or custom keyframes, so a working entrance fade is **unverified**. No `prefers-reduced-motion` variants exist. See [DESIGN.md Motion](../DESIGN.md#motion) for intent.

## Gesture model

Gesture recognition and all thresholds live in [components/AirCanvas.tsx](../components/AirCanvas.tsx). Normalized values are MediaPipe landmark coordinates (0-1). Frame counts assume roughly 30fps; elapsed hold time depends on frame rate.

| Gesture | Action | Recognition rule |
| --- | --- | --- |
| Thumb/index pinch (hold) | Draw | pinch distance `< START_THRESHOLD 0.04` for `REQUIRED_CONSISTENT_FRAMES = 5`; stroke stops when distance `> STOP_THRESHOLD 0.08` |
| Thumbs up | Stop active stroke | `THUMBS_UP_POSE` held `> 5` frames |
| One extended finger | Toggle voice input | `ONE_FINGER_POSE` held `> HOLD_FRAMES (30)` |
| Two extended fingers | Transform (Magic) | `PEACE_SIGN_POSE` held `> 30` |
| Three extended fingers | Save visible result to gallery | `THREE_FINGER_POSE` held `> 30` |
| Fast swipe | Erase | wrist `dx` magnitude `> SWIPE_SPEED_THRESHOLD 0.06` per frame |

Cooldowns and gating:

- `TRIGGER_COOLDOWN = 3000` ms shared across voice / transform / save triggers.
- `isWarmup` blocks all triggers for `2000` ms after camera start.
- Swipe erase has its own `COOLDOWN_MS = 1000` ms.
- A pinch must not be active for one/two/three-finger triggers to count; `thumbIsNotPinching` requires pinch distance `> 0.20` for one-finger and thumbs-up poses.

Gesture feedback reports recognition, not completion: "🎤 Listening...", "✨ Transforming...", "💾 Saving to Gallery..." can appear even when the callback performs no action. The legend emoji/finger-count/action triples are in the control overlay. This matches [DESIGN.md Canvas and interaction](../DESIGN.md#canvas-and-interaction).

## Implementation-to-source mapping

"Code Connect" here maps a design concern to its source file. The repository has **no** Figma Code Connect integration or design-to-code binding files, matching DESIGN.md's framing. Visual values are distributed, so changing a repeated utility in one component does not update the others.

| Design concern | Source of truth |
| --- | --- |
| Global font, body background/overflow, scrollbars, Tailwind CDN | [index.html](../index.html) |
| Ribbon, palette presets, selections, result overlay and gallery chrome, status bar | [App.tsx](../App.tsx) |
| Camera, ink/overlay layers, hand tracking, gestures, canvas controls | [components/AirCanvas.tsx](../components/AirCanvas.tsx) |
| Microphone appearance and recognition lifecycle | [components/VoiceInput.tsx](../components/VoiceInput.tsx) |
| Dialog dimensions, field validation, connection indicators | [components/ApiKeyDialog.tsx](../components/ApiKeyDialog.tsx) |
| Style labels, icons, generation prompt modifiers | [types.ts](../types.ts) (`ArtStyle`), [constants.ts](../constants.ts) (`STYLE_ICONS`, `STYLE_PROMPTS`) |
| Browser-to-Google requests and prompt construction | [services/geminiService.ts](../services/geminiService.ts) |
| Credential expiry, persistence, and removal | [services/apiKeyStorage.ts](../services/apiKeyStorage.ts) |

This matches the Code Connect table in [DESIGN.md](../DESIGN.md#code-connect-implementation-mapping) and the structure table in [AGENTS.md](../AGENTS.md#project-structure). Keep style labels, icons, and prompt modifiers synchronized when adding an art style.

## Reconciliation and known gaps

All values above were verified against the current source. Where DESIGN.md is intentionally brief, this document adds exact class names and literals without contradicting it. No source-versus-DESIGN.md numeric conflicts were found during this pass; the few points worth noting:

- **Save File icon color.** DESIGN.md describes Download emphasis generically; the source uses `text-blue-600` for the File-group `Download` icon ([App.tsx](../App.tsx)). Documented from source.
- **Default art style.** DESIGN.md states the default is Illustration; the source confirms `useState<ArtStyle>(ArtStyle.ILLUSTRATION)` ([App.tsx](../App.tsx)). Consistent.
- **Sketch export MIME.** Normal export composites ink onto white and encodes **JPEG** (`toDataURL('image/jpeg', 0.95)`), undo emits **PNG** (`toDataURL("image/png")`), while [services/geminiService.ts](../services/geminiService.ts) always labels the sketch input `mimeType: 'image/png'`. This MIME mismatch is an existing implementation gap. Trust the source.

Carried-forward, design-system-relevant gaps (see [DESIGN.md Maintenance standards and known gaps](../DESIGN.md#maintenance-standards-and-known-gaps)):

- No `prefers-reduced-motion` support; existing animation classes do not establish reduced-motion behavior.
- The result overlay is a styled `div` without dialog semantics or focus management; its icon-only close button lacks an accessible name.
- The title-bar Save Project icon has no handler (not functional).
- Redo is disabled.
- `animate-in fade-in` has no matching plugin or keyframes in the repo (unverified entrance animation).

For design intent, tone, and maintenance rationale, see [DESIGN.md Design intent](../DESIGN.md#design-intent) and [DESIGN.md Maintenance standards and known gaps](../DESIGN.md#maintenance-standards-and-known-gaps) rather than duplicating that prose here.

## Verification scope

This reference was reverse-engineered from the current source. It is not a record of live browser, webcam, microphone, or Gemini validation. Source ownership for each concern is listed under [Implementation-to-source mapping](#implementation-to-source-mapping). Treat inferred intent and declared animation classes separately from verified runtime behavior, as in [DESIGN.md Verification scope](../DESIGN.md#verification-scope).
