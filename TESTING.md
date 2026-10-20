# v1.0 verification

Verified on 2026-10-20 in the development workspace with Node.js **24.19.0**, Playwright **1.61.1**, and system Chromium **154.0.8037.57** on Linux.

## Results

| Check | Result |
| --- | --- |
| `npm test` | **10 passed**, 0 failed, 0 skipped |
| `CHROMIUM_PATH=/usr/bin/chromium npm run test:browser` | **8 passed**, 0 failed, 0 skipped |
| `npm run build` | Passed; static output in `dist/` |
| Production build at a nested URL | Full playthrough passed at `/dist/`, exercising repository-relative paths |
| Offline after loading | Completed a full run and displayed loaded artwork with network disabled; no failed network requests |
| Dependency audit | 0 known vulnerabilities reported |

The browser runner executes actual controls. Keyboard playthroughs use the browser clock; the emulated phone playthrough uses **real elapsed time and multi-finger touch events**. Completion is never injected into the application.

## Logic coverage

1. Exact ×1, ×2, ×4, ×8, ×16, and ×32 linear progression.
2. Immediate same-update collision chains, including revisiting enemies earlier in the list.
3. Any enemy can be eaten first; no duplicate consumption; exactly one finale.
4. All five deterministic routes remain inside the arena across repeated loops; distinct directions, oval period, and rectangle corner pauses.
5. Normalized diagonals, constant speed at every playable size, and constrained center.
6. Timer waits for movement, counts active idle time, excludes pauses, and stops at completion.
7. Identical fixed-step results across different rendering-frame groupings.
8. Persistent fastest-first top ten, including deterministic ties.
9. Corrupt, denied, and full storage fail gracefully.
10. Complete matching localization dictionaries.

## Browser coverage

1. Full keyboard run through ×1 → ×32, four-corner pixel check proving the body engulfs the viewport, results, frozen final time, saved record after refresh, and replay reset.
2. Traditional Chinese pause menu, stopped clock, localized restart/exit confirmation, cancellation, mute/reduced-motion preferences after refresh, and blur auto-pause.
3. Full real-time two-finger touch run at **390 × 844**; portrait and **844 × 390** landscape layouts; all touch controls inside the viewport; no application exceptions.
4. Two full Traditional Chinese runs with storage denied and reduced motion enabled; in-memory records remain usable.
5. Visibility-change auto-pause, no background timer progress, and explicit resume.
6. Static production output at a nested path, completing a run offline after initial loading, including result artwork.
7. Offline Web Audio rendering of first/fifth munches and the final chord: nonzero output, no clipping, and low peak/RMS amplitude.
8. **320 × 568** compact phone: all directional targets at least 44 × 44, sound control visible, page scrolling prevented.

## Visual review

Inspected the title illustration, active garden, Traditional Chinese pause dialog, landscape controls, results, and the actual fullscreen finale screenshots. Corrected missing font symbols, hidden landscape controls, compact-screen overflow, finale caption contrast, and portrait facial composition during this review.

Reference screenshots from the final passing run:

- [The picnic](./docs/picnic.png)
- [Much too much friend](./docs/finale.png)

`npm run test:browser` regenerates additional desktop, portrait, landscape, and Traditional Chinese screenshots under `test-results/`, plus a browsable report under `playwright-report/`.

## Remaining verification and limits

- Physical **iOS Safari and Android Chrome** still need hands-on checks for simultaneous touches, browser chrome/orientation changes, audio unlock and comfortable speaker volume, and app switching. Mobile tests here are Chromium emulation, not physical hardware.
- Firefox and WebKit were not executed in this workspace. The implementation uses standard modern Canvas, native dialogs, pointer events, Web Audio, and ES modules.
- Audio amplitude was measured automatically; subjective loudness on device speakers still needs listening. Sound can be muted, and unsupported/blocked Web Audio does not prevent play.
- Canvas play is visual. Keyboard/touch controls, dialog focus, localized labels, and live meal announcements are included; fully nonvisual navigation of the garden is not implemented.
- Very direct play can finish in a few seconds. There is deliberately no artificial pacing or chain delay to stretch runs toward the GDD’s approximate session length.
- These local checks do not establish a live deployment. The repository’s Actions tab tracks deployment after GitHub Pages is configured.
