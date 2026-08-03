# Snake — Nokia Authenticity Mode (Snake Game)

Version: v2.0.0-nokia-authenticity

A lightweight, responsive vanilla JavaScript Snake game tuned to feel like the classic Nokia 3310 Snake. Pixel-perfect 84×48 logical canvas, tick-based movement, retro beeps, and a green monochrome LCD theme.

Features
- Pixel-perfect rendering (logical 84×48). Scales with nearest-neighbor for crisp, blocky pixels.
- Tick-based, grid-aligned movement (cell-by-cell) — faithful to Nokia Snake.
- 4-direction controls: Arrow keys, WASD, Numpad (2/4/6/8), virtual D-Pad, and touch swipe.
- Classic (wrap) and Arena (walls kill) modes.
- Local high-score and leaderboard persisted in localStorage (keys prefixed with `snake_ultra_`), with a safe fallback for private browsing.
- Retro WebAudio beeps (eat / crash) with mute toggle and reduced-motion respect.
- Mobile-first, small memory and CPU footprint.
- Accessibility improvements: skip link, ARIA attributes, keyboard focus, modal focus restoration.
- Configurable speed (1–12 ticks per base unit).

Controls
- Arrow keys / WASD / Numpad: Move the snake.
- Space: Pause / resume.
- Virtual D-Pad on small screens.
- Swipe on mobile: swipe in the direction you want to move.
- Start / Pause / Restart buttons available in UI.

How to run locally
1. Clone the repository:
   git clone https://github.com/Raviteja-2000/Snake-game.git
2. Switch to the nokia-authenticity branch:
   git checkout nokia-authenticity
3. Serve the repo (recommended — some browsers restrict AudioContext when opened as file://):
   python -m http.server 8000
4. Open http://localhost:8000 in your browser.

Testing checklist (QA)
- Confirm pixelated rendering at multiple sizes (mobile & desktop).
- Test controls (Arrow, WASD, Numpad, D-Pad, swipe).
- Verify sound plays on eat/crash and mute persists across reloads (user gesture might be required on some browsers).
- Verify high score persists and leaderboard updates.
- Test Classic & Arena modes for wrap/collision behavior.
- Confirm accessibility: skip link, keyboard focus, modal focus management.
- Test on Chrome, Firefox, Edge, Android Chrome, Safari (desktop & mobile).

Browser Support
- Modern evergreen browsers (Chrome, Edge, Firefox, Safari).
- Mobile: Android Chrome & Mobile Safari (iOS 13+ recommended).
- Not supported: IE11 and older browsers.

Deployment (GitHub Pages)
- Static site — enable GitHub Pages in repo settings, publish branch root or choose the default branch after merge.

Credits
- Inspired by the classic Nokia 3310 Snake game.
- Pixel font: Press Start 2P (Google Fonts).

License
- MIT
