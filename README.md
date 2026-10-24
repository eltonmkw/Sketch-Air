<h1 align="center">✨ Sketch Air</h1>

<p align="center">
  <img src="./sketch-air-thumbnail.jpg" alt="Sketch Air Thumbnail" width="400" />
</p>

<p align="center">
  <b>Sketch Air</b> lets you draw in mid-air using just your hand and a webcam.<br>
  Your sketches are then transformed into <b>beautiful artwork by AI</b>.
</p>

---

## Bring your own API key

On first launch, a native browser dialog asks for your Gemini API key. Click **Test Connection** to validate your key, then **Done** to activate it. Close the dialog to
draw without a key. API usage may incur charges.

By default, keys stay in memory and clear on refresh. **Remember on this device**
keeps the key across refreshes for 30 days or until removed. **Remove saved key** clears both browser
stores and the in-memory key. If storage is blocked, the key works in memory until
reload. Browser storage is not a secure vault: scripts on this origin can access
it. Use a trusted deployment and device. Generation requests go directly to Google.

For static self-hosting, run `npm run build` and serve `dist` over HTTPS (required
for webcam access, except localhost). No server API key is required or bundled.
The app still needs internet access for Google and its external CDN resources.

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

<p align="center">
  Built with <span style="color: #e25555;">❤️</span> for <b>AI Hackathon</b>
</p>
