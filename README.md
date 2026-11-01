# Dave Flaps! — Sausage Roll Run 🪽🥐

A ridiculous mobile-friendly, one-tap game: flap Dave's winged head between towers of sausage rolls. Built with plain HTML, CSS and JavaScript. **No paid hosting, app store, coding tools, build step, ads, trackers or account are needed to play.**

## What you get

- Dave's head with animated wing-flapping effect
- Realistic, stacked sausage-roll obstacles that get faster and tighter as you score
- Tap-to-flap touch controls, plus Space, Up Arrow or W on a computer
- Sounds (mute button), pause/resume, score, and best score saved on your device
- Installable on Android and iPhone using the home screen (a **Progressive Web App**, or PWA)
- Works offline **after visiting the published site successfully once**

## Upload to GitHub (beginner-friendly)

1. Sign in at [github.com](https://github.com) and click **+ → New repository**.
2. Call the repository `dave-flaps`. Choose **Public** (free GitHub Pages for a public repo). Click **Create repository**.
3. Click **Add file → Upload files** on the new repository page. **Open the downloaded `dave-flaps` folder and upload its contents** (not the ZIP itself). Keep the `assets` folder with the two `.webp` files in it. You can drag and drop the files and `assets` folder at the same time in most desktop browsers.
4. At the bottom, click **Commit changes**.
5. In the repository, select **Settings → Pages** (left menu). Under **Build and deployment**, pick **Deploy from a branch**, set branch to **main**, folder to **/(root)**, and select **Save**.
6. Your game should become available at:

   `https://YOUR-GITHUB-USERNAME.github.io/dave-flaps/`

   Replace `YOUR-GITHUB-USERNAME` with your own GitHub username. The Pages screen will show the exact URL once deployment finishes.

**Important:** Do not put everything inside an extra nested folder in the repository. `index.html` must be at the *top level*. Make sure `assets/dave-wings.webp` and `assets/sausage-roll.webp` retain those exact paths.

## Install on your phone

**Android (Chrome):** Open your published GitHub Pages URL in Chrome → tap the **⋮** menu → **Install app** or **Add to Home screen** → confirm.

**iPhone (Safari):** Open your published GitHub Pages URL in **Safari** (not inside another app) → tap the **Share** button → **Add to Home Screen** → **Add**.

You'll get a Dave Flaps icon that opens the game like an app. An internet connection is needed for the first visit; it should then run offline after its initial files are cached.

## Local testing

For a quick preview, you can open `index.html` on a computer. To test full PWA installation/offline behaviour locally, use a local web server or GitHub Pages (service workers won't work from `file://`). For example, if Python is installed:

```bash
cd dave-flaps
python -m http.server 8000
```

Then open http://localhost:8000/ in a browser.

## Customising

- **Dave's photo:** replace `assets/dave-wings.webp` with another image of the same name; images with transparent backgrounds work best.
- **Sausage rolls:** replace `assets/sausage-roll.webp` with another transparent sausage roll image.
- **Difficulty:** in `game.js`, search for `const gap` and `const speed` in the game logic.
- **Title and colours:** edit `index.html` and `style.css`.
- **After editing:** change `const CACHE = 'dave-flaps-v1.0';` in `sw.js` to a new version (e.g. `v1.1`), so installed devices download the latest files after reopening the game.

**Privacy:** best score and sound preference are only kept on your own device in browser storage. No data is uploaded. The GitHub repository itself, including Dave's photo, will be **public** if you use the free public Pages method, so make sure Dave is happy for his picture to be published.

**Version:** 1.0 · GitHub Pages-friendly static PWA.
