<h1 align="center">✨ Sketch Air</h1>

<p align="center">
  <img src="./sketch-air-thumbnail.jpg" alt="Sketch Air Thumbnail" width="400" />
</p>

<p align="center">
  <b>Sketch Air</b> lets you draw in mid-air using just your hand and a webcam.<br>
  Your sketches are then transformed into <b>beautiful artwork by AI</b>.
</p>

---

## Continuous integration

GitHub Actions runs **Build and typecheck** on pushes to `development` and on
non-draft pull requests when opened, reopened, updated, or marked ready for review.
Draft pull request jobs are skipped. Using Node.js 22, it installs the locked dependencies
with `npm ci`, runs `npm run typecheck`, and builds with `npm run build`.
No API key is needed. These checks validate source types and bundling; they do
not test webcam, speech recognition, CDN availability, or live Gemini requests.

The MediaPipe CDN import uses declarations from the matching `0.10.0` development
dependency. Keep both versions aligned when upgrading hand tracking.

To make this check mandatory before merging, select **Build and typecheck** in
the target branch's GitHub ruleset or branch protection settings after its first run.

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
