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
    <pre><code>npm ci</code></pre>
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

## Development → Preview → Production

Use Node 24.x. See the [deployment guide](./docs/DEPLOYMENT.md) for local setup,
Preview tests, service isolation, and the Vercel/Git settings checklist.
The application selector is `ENV=DEVELOPMENT` locally, `ENV=TESTING` for Preview
QA, and `ENV=PRODUCTION` for live use. Vercel's scopes remain Development,
Preview, and Production. Copy `.env.example` to `.env.local` and replace its
placeholder with `DEVELOPMENT`; never add a shared Gemini key to environment files.

## API-key verification without Google access

Run `npm run dev:testing` (or `ENV=TESTING npm run dev`) locally and enter
the **dummy value** `TESTING`. Test Connection succeeds without
contacting Google, then Done activates the dummy key. Other values are rejected.
Image generation is disabled in this mode, so verification cannot incur Google
charges. A TESTING notice identifies the mocked environment. Do not enter real
credentials in testing mode.

`ENV` is a case-sensitive build-time selector. `ENV=TESTING` enables the offline
mock in local development and Vercel Preview builds (`VERCEL_ENV=preview`).
`ENV=DEVELOPMENT`, `ENV=PRODUCTION`, unset, and unrecognized values keep real validation. Vercel
Production always uses real validation, even if `ENV=TESTING` is accidentally set.
Ordinary local builds also keep real validation unless explicitly simulating Vercel Preview.

### Enable testing on Vercel Preview

1. Open **sketch-air → Settings → Environment Variables** in Vercel.
2. Add `ENV` with value `TESTING`, selecting **Preview only**. No `VITE_` prefix is needed.
3. Redeploy the Preview after saving; environment changes do not alter existing builds.
4. Open the new Preview, enter `TESTING` as the API key, click **Test Connection**, then **Done**.

The TESTING notice identifies the mock. Test Connection makes no Google request,
and generation stays disabled. For normal Preview validation, change Preview's
`ENV` to `PRODUCTION` and redeploy. Production may explicitly use `ENV=PRODUCTION`;
its deployment target also prevents the mock from being bundled. Release through
a fresh production build rather than copying testing build files.

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
