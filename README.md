# Nom Nom BOOM! · 吃吃碰！

A little game. A very big appetite.

Wander through an afternoon picnic as an original sleepy apricot creature. Eat five oblivious dumplings, double in **both dimensions** after every bite, and become much too big for the screen. There is no losing, time limit, or hurry.

A complete static browser game in English and Traditional Chinese. No runtime dependencies, backend, accounts, external fonts, downloaded audio, or asset service. All artwork is original vector drawing; music and effects are synthesized locally with Web Audio.

## Run locally

Use Node.js 22 or newer (tested here with Node 24):

```sh
npm run dev
```

Open `http://localhost:4173` in a modern browser. **No install is required to play or build.** Serve over HTTP rather than opening the HTML as a file, because the game uses native JavaScript modules. You can also use any static HTTP server.

Optional port: `PORT=8080 npm run dev` (POSIX shell). Stop with Ctrl+C.

## Play

- **Arrow keys / WASD:** move; diagonals are normalized.
- **Touch:** hold the large directional buttons; two fingers allow diagonal movement.
- **Escape / P:** pause or resume.
- **Enter / Space:** start or replay; focused buttons also support normal keyboard activation.
- Switch **English / 繁體中文** on the title, pause, or results screen.
- Sound and reduced-motion controls are on the footer and pause screen. System reduced-motion is respected by default. Audio begins only after interaction.
- Restarting or leaving an active run asks for confirmation. Backgrounding or losing window focus pauses the run; resume deliberately.

The timer starts on the first actual movement, continues while you linger, excludes pauses, and stops on the fifth meal. Top ten times and dates stay in this browser’s localStorage. With storage blocked, play still works and records last for the current page session. Records are personal mementos, with no medals or grades.

## Test

The pure simulation tests need no packages:

```sh
npm test
```

For browser integration tests:

```sh
npm ci
npx playwright install chromium
npm run test:browser
```

On Linux CI, use `npx playwright install --with-deps chromium`. To use an installed Chromium instead:

```sh
CHROMIUM_PATH=/usr/bin/chromium npm run test:browser
```

If the home directory is read-only, pass `--cache /tmp/nom-nom-npm-cache` to `npm ci`.

Browser tests save screenshots to `test-results/` and an HTML report to `playwright-report/`. They exercise the actual interface and input events; no teleportation, test-only game API, or forced completion. The mobile run uses real-time CDP multitouch. Other runs use Playwright’s controllable browser clock for reproducibility.

See [TESTING.md](./TESTING.md) for the verified results and remaining physical-device checks.

## Build and GitHub Pages

```sh
npm run build
```

This copies the static game into `dist/`. To check that build locally:

```sh
SERVE_DIR=dist npm run dev
```

All application URLs are relative, so it works at both a domain root and a repository path such as `/nom_nom_boom/`. The built folder can be hosted by any static server. Once the game is loaded, gameplay makes no network requests; there is no service worker or promise of an offline first visit.

The included [Pages workflow](./.github/workflows/pages.yml) runs the logic tests, browser tests, builds, and deploys on pushes to `main` or manual workflow dispatch. To publish:

1. Commit and push this project to the repository’s `main` branch.
2. In GitHub **Settings → Pages → Build and deployment → Source**, choose **GitHub Actions**.
3. Run **Test and deploy picnic** (or push to `main`). The workflow provides the deployed address.

The repository’s Actions tab shows the current deployment status. A successful local build alone does not publish the site.

## Small architecture

- `src/core.js`: pure 120 Hz fixed-step simulation, five analytic routes, immediate collision-resolution loop, timer, storage validation and ordering.
- `src/app.js`: screen states, frame accumulator, keyboard/pointer input, auto-pause, dialogs, persistence and finale.
- `src/art.js`: original Canvas sprites and garden; character dimensions follow the true ×1 → ×32 radius. The camera never zooms out. Finale composition keeps the smiling features visible on portrait screens while the giant body exceeds the viewport.
- `src/audio.js`: quiet melodic accompaniment, descending munches, pops, and a low, friendly final chord.
- `src/i18n.js`: every interface string in English and zh-TW.
- `assets/`: original SVG favicon and character illustration; no third-party art or music.

The simulation resolves every overlapping meal in the same update and triggers the finale once. Animation and sequential sound pulses never gate collision checks. The logical arena stays 960 × 540 at every viewport size, movement stays 180 logical pixels/second, and all five paths have fixed initial conditions.

Canvas gameplay is visual. Controls and dialogs have keyboard focus, labels, and status announcements, but this is not a fully nonvisual game. Reduced motion removes bobbing, particles, squash, and wobble, with a brief transition to the same gigantic final state. No flashing effects are used.

## 繁體中文快速開始

執行 `npm run dev`，再用瀏覽器開啟 `http://localhost:4173`。不需要先安裝套件就能遊玩或建置。方向鍵、WASD 或觸控方向按鈕皆可移動；Escape / P 可暫停。首頁與暫停選單可切換語言、音效與動態效果。

每吃一隻小糰子，身體的寬和高都會變成兩倍。五隻吃完，連螢幕都裝不下你！沒有失敗，也沒有時間限制。個人前十筆紀錄只儲存在目前裝置的瀏覽器中。

執行 `npm test` 測試遊戲邏輯；`npm run build` 產生可部署的 `dist/` 靜態網站。GitHub Pages 部署方式如上。實體 iOS / Android 裝置的觸控與音效仍需實機確認。
