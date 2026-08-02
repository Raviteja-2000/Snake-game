# Changelog

All notable changes to this project are documented in this file.

## [v2.0.0] - 2026-08-02
Added features and improvements since the initial implementation (version 1):

### UI / UX
- Responsive layout and typography improvements for desktop, tablet, and mobile.
- Header with controls: Start, Pause, Restart, Speed slider, Mode select (Classic/Arena), Theme select (Light/Dark), and Mute toggle.
- HUD showing Score, High score, Time, and Grid size.
- Result modal with final score, length, time, and Play Again / Close actions.
- Local Top‑10 leaderboard rendered in the sidebar.
- Grid overlay on the canvas that scales with the grid size.
- On-screen D‑Pad for touch devices.

### Controls & Input
- Keyboard controls: WASD and Arrow keys; Space to pause.
- Touch swipe gestures to change direction.
- D‑Pad click controls for mobile friendliness.
- Prevent scrolling on Arrow/Space keys while playing.
- Prevention of immediate 180° reversal into the snake's body.

### Gameplay
- Two game modes: Classic (wrap-around edges) and Arena (walls kill the snake).
- Scoring: eating food awards points; score increment scales with game speed (+10 * speed).
- Food spawns in empty cells (never on the snake body).
- Proper collision detection for tail and walls with descriptive game-over reasons.

### Audio & Haptics
- WebAudio-based tone generation for feedback when eating and on game over.
- Vibration API usage for tactile feedback on supported devices.
- Mute toggle persisted in local storage.

### Persistence & Leaderboard
- localStorage persistence for: theme, muted, speed, high score, and leaderboard (keys prefixed with `snake_ultra_`).
- Leaderboard sorted descending and capped at top 10 entries.

### Rendering & Performance
- Canvas sized responsively and scaled using devicePixelRatio for crisp rendering on high-DPI screens.
- Improved resize handling and orientationchange support.
- requestAnimationFrame-based game loop with fixed-step updates controlled by speed.
- Timing based on performance.now() for smoother animation and accurate elapsed time.

### Visuals & Drawing
- Rounded rectangle drawing for snake segments and food (with roundRect fallback).
- Arena walls rendered when in arena mode.
- Cell padding for improved look and feel.
- CSS variables and light/dark theme support.

### Accessibility & Polishing
- ARIA attributes and aria-live regions for dynamic content (score, time, etc.).
- Game auto-pauses on document visibilitychange (when tab/window is hidden).
- Many small UX improvements: button states, responsive controls, and mobile optimizations.

### Misc
- Project branding constants and helper utilities for save/load/clamp/random.
- Improved code structure and comments for maintainability.


If you want a different semantic version (for example `v1.1.0` instead of `v2.0.0`) or to create a GitHub Release, tell me and I will update accordingly.
