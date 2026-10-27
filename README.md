<h1 align="center">✨ Sketch Air</h1>

<p align="center">
  <img src="./sketch-air-thumbnail.jpg" alt="Sketch Air Thumbnail" width="400" />
</p>

<p align="center">
  <b>Sketch Air</b> lets you draw in mid-air using just your hand and a webcam.<br>
  Your sketches are then transformed into <b>beautiful artwork by AI</b>.
</p>

---

## 🚀 Quick Start

<ol>
  <li>
    <b>Install dependencies</b>
    <br>
    <pre><code>npm install</code></pre>
  </li>
  <li>
    <b>Start the app</b>
    <br>
    <pre><code>npm run dev</code></pre>
  </li>
  <li>
    <b>Open in your browser</b>
    <br>
    Visit <a href="http://localhost:3000">http://localhost:3000</a>
  </li>
</ol>

<hr>

## API-key verification without Google access

Run `npm run dev:testing` (or `ENV=TESTING npm run dev`) locally and enter
the **dummy value** `sketch-air-test-key`. Test Connection succeeds without
contacting Google, then Done activates the dummy key. Other values are rejected.
Image generation is disabled in this mode, so verification cannot incur Google
charges. A TESTING notice identifies the mocked environment. Do not enter real
credentials in testing mode.

`ENV` is a Node environment selector for the local development server. It must
equal `TESTING` to enable mocks. `ENV=PRODUCTION`, an unset or unrecognized value,
and `NODE_ENV=test` alone keep real validation. Production mode, preview,
and every build use the real Gemini service, even with `ENV=TESTING` or
`--mode test`. Never enable test flags in a shared deployment.

Keys are kept in memory unless Remember on this device is selected before Done.
Remembered keys are plaintext browser data with a 30-day expiry checked on load;
browser storage is not a secure vault. Removal clears the active key and attempts
to delete browser data. If deletion cannot be confirmed, the dialog warns that a
saved key may return after refresh and tells you to clear this site's browser
data. Removal does not revoke a key at Google.

Verification commands:

```sh
npm ci
npm test
npx playwright install chromium
npm run test:browser
npm run typecheck
npm run build
```

Browser tests cover memory-only refresh, opt-in persistence after Done, removal,
blocked-storage feedback, and production-build rejection of the dummy key. They
mock Google responses and block external CDN resources; they do not verify live
Gemini access, billing, camera, or microphone behavior.

<p align="center">
  Built with <span style="color: #e25555;">❤️</span> for <b>AI Hackathon</b>
</p>
