<h1 align="center">✨ Sketch Air</h1>

<p align="center">
  <img src="./sketch-air-thumbnail.jpg" alt="Sketch Air: draw with your hand and turn sketches into artwork" width="400" />
</p>

Sketch Air lets you draw in mid-air using your hand and a webcam, then turn your sketch into AI artwork.

## Open Sketch Air

**[Launch Sketch Air](https://play-sketch-air.vercel.app)** — no installation needed.

Use a desktop browser with a webcam and an internet connection. Allow camera access when prompted. Voice input is optional and appears only in browsers that support speech recognition.

You can draw without an API key. To generate artwork, you need your own [Gemini API key](https://aistudio.google.com/apikey) with image-generation access; Google charges may apply.

## Create your first artwork

1. If the API-key dialog appears, close it with **X** or **Escape** to start drawing, or connect your key as described below.
2. Click **Start** and allow camera access. Wait for the camera to start, then keep your hand clearly visible.
3. Pinch your thumb and index finger together and move your hand to draw. Release the pinch to stop. Choose a color and brush size from the toolbar; use **Undo** or **Clear** to correct your sketch.
4. Type what you want to create in **Describe object...**, or use the microphone button if available. For example: “A cat sitting beside a window.”
5. Choose **Illustration**, **Realistic Photo**, or **Pixel Art**, then click **Transform**. If prompted, connect your key and click Transform again.
6. View the result. Selecting a different style beneath it generates another version and may incur another Google charge. Close the result with **X** to return to your sketch.

The description guides what the artwork depicts; your sketch loosely guides its placement and size.

## Hand gestures

| Gesture | Action |
| --- | --- |
| Hold a thumb–index pinch | Draw |
| Thumbs up | Stop the active stroke |
| Hold one finger up | Toggle voice input |
| Hold two fingers up | Transform the sketch |
| Hold three fingers up while viewing a result | Save the result to the gallery |
| Fast swipe | Erase the sketch |

Hold action gestures steady and pause between them to avoid accidental triggers. Use **Drawing: ON/OFF** to pause drawing while keeping hand tracking active. **Stop** turns off the camera and clears the sketch and undo history.

## Save your artwork

Click **Save File** while a result is visible to download a PNG. You can also hold three fingers up to add the result to **Saved Gallery**, then use a gallery item's download or delete button. The **Gallery** button shows or hides the sidebar.

**The gallery lasts only for the current session. Download artwork you want to keep before refreshing or closing the page.**

## Connect or remove your Gemini key

Open **API key**, enter your key, click **Test Connection**, and then click **Done** after a successful test. A successful connection test does not guarantee generation quota or billing access.

Your key stays in memory and clears on refresh unless you select **Remember on this device** before Done. Remembered keys are stored as plaintext in this browser with a 30-day expiry checked when the app loads; browser storage is not a secure vault.

Your key, sketch, and description are sent directly from your browser to Google for generation. Use **Remove saved key** in the dialog to clear the active key and remove saved browser data. If the app cannot confirm removal, clear this site's data in your browser settings. Removing a key here does not revoke it at Google.

## Need help?

- **Camera will not start:** allow camera access in your browser's site settings, connect a webcam, and close other apps using it. Click Start to retry. Cancel is available while startup is pending.
- **Loading does not finish:** check your internet connection and whether your browser or network blocks external resources, then reload.
- **No microphone button:** type your description instead; speech recognition is not available in every browser.
- **Generation fails:** check the key, its API and website restrictions, Gemini image-generation access, quota, and billing. Read the error message before retrying.

## For developers and contributors

- [Developer setup and technical notes](./docs/DEVELOPMENT.md)
- [Testing guide](./docs/TESTING.md)
- [Contributing](./CONTRIBUTING.md)

<p align="center">Built with ❤️ for <b>AI Hackathon</b></p>
