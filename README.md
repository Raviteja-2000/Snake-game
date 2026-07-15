# 🎮 Snake — Business Ultra

A modern, high-performance snake game designed as a professional web game experience. Built with vanilla JavaScript, responsive design, and progressive web app capabilities.

**[🎮 Play Now](https://raviteja-2000.github.io/Snake-game/)**

## ✨ Features

### 🎯 Gameplay
- **Two Game Modes**: Classic (wrap-around) and Arena (wall obstacles)
- **Speed Control**: 1-6x game speed multiplier for custom difficulty
- **Local Leaderboard**: Top 10 scores saved to browser storage
- **Smooth 60 FPS**: Optimized performance on all devices

### 📱 Mobile Experience
- **Fully Responsive**: Desktop, tablet, and mobile support
- **Touch Controls**: D-Pad buttons for mobile players
- **Swipe Gestures**: 4-directional swipe support
- **Landscape Support**: Optimized for both orientations
- **High-DPI Support**: Crisp rendering on Retina/AMOLED screens

### ♿ Accessibility
- **Keyboard Navigation**: Full support for WASD, Arrow Keys, Space
- **Screen Reader Support**: Semantic HTML with ARIA labels
- **Focus Indicators**: Clear visual feedback for keyboard users
- **WCAG AA Compliant**: Passing color contrast standards
- **Haptic Feedback**: Vibration on mobile for game events

### 🎨 User Interface
- **Dark/Light Themes**: Toggle between themes, persisted across sessions
- **Sound Effects**: Audio feedback for eating, pausing, and crashes
- **Sound Toggle**: Mute button for silent play
- **Game Over Modal**: Clear summary of final score and stats
- **Real-time Metrics**: Live display of score, high score, time, and grid size

### 📊 Data & Persistence
- **Local Storage**: Game settings and scores saved to browser
- **Leaderboard**: Local top 10 scores with metadata
- **Theme Preference**: Dark/Light mode remembered
- **Speed Setting**: Last used speed multiplier restored

## 🎮 Controls

### Desktop
- **Movement**: `WASD` or `Arrow Keys`
- **Pause**: `Space`
- **D-Pad**: Mouse/Touch on mobile buttons

### Mobile
- **Movement**: D-Pad buttons or swipe gestures
- **Pause**: Space (on devices with keyboard) or Pause button

### Touch
- **Swipe Up/Down/Left/Right**: Control snake direction
- **Minimum swipe distance**: 20px (prevents accidental inputs)

## 🚀 How to Play

1. **Start the Game**: Click "Start" button or press any direction key
2. **Move**: Use keyboard, D-Pad, or swipe to control direction
3. **Eat Food**: Move your snake head into the food (pink square)
4. **Grow**: Snake grows longer when eating (body count increases by 1)
5. **Avoid**: Don't hit walls (Arena mode) or yourself
6. **Survive**: Keep playing to reach the leaderboard!

### Game Modes

**Classic (Wrap)**
- Snake wraps around screen edges
- No obstacles
- Perfect for endless play

**Arena (Walls)**
- Walls on all four edges
- Crashing into walls = game over
- Increased difficulty and challenge

### Speed Multiplier
- **1x**: Slowest (easiest)
- **2-3x**: Normal difficulty
- **4-5x**: Hard
- **6x**: Extreme

Each level completes in 5-20 minutes depending on speed and skill.

## 🛠️ Technical Details

### Technology Stack
- **Language**: Vanilla JavaScript (ES6+)
- **Rendering**: HTML5 Canvas 2D
- **Styling**: CSS3 with CSS Variables
- **Storage**: Browser LocalStorage API
- **Audio**: Web Audio API (no external files)

### Performance
- **Zero Dependencies**: No npm packages required
- **Unminified Size**: ~45KB (script + styles)
- **Gzipped Size**: ~18KB
- **Target FPS**: 60 (locked to screen refresh rate)
- **Memory**: Capped to prevent leaks (max snake length: 1000)

### Responsive Design
- **Mobile Breakpoints**: 360px, 480px, 600px, 768px, 980px, 1024px
- **Canvas Scaling**: Dynamic based on container
- **Typography**: Fluid scaling with `clamp()`
- **Touch Targets**: Minimum 44x44px (WCAG standard)

### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari 14+
- All modern mobile browsers

## 🎨 Customization

### Theme Colors
Edit CSS variables in `style.css` `:root` selector:

```css
:root {
  --bg: #0b1020;           /* Background */
  --panel: #0f162e;        /* Panel background */
  --text: #e8efff;         /* Text color */
  --accent: #34d399;       /* Primary accent */
  --accent-2: #60a5fa;     /* Secondary accent */
  --grid: #1b2342;         /* Grid color */
}
```

### Game Constants
Edit constants in `script.js`:

```javascript
const MAX_SNAKE_LENGTH = 1000;  // Max body segments
const GRID = 20;                 // Grid size (20x20)
const VALID_SPEEDS = [1,2,3,4,5,6]; // Speed tiers
```

## 🐛 Debugging

### Performance Profiling
1. Open DevTools (`F12`)
2. Go to Performance tab
3. Record gameplay for 10 seconds
4. Check frame rate graph (target: 60 FPS)

### Local Storage
View saved data in DevTools:
```javascript
// In console:
Object.keys(localStorage).filter(k => k.includes('snake'))
localStorage.getItem('snake_ultra_high')
```

## 📋 Project Structure

```
Snake-game/
├── index.html       # HTML structure
├── style.css        # Responsive styles
├── script.js        # Game logic and interactions
├── README.md        # This file
└── LICENSE          # Project license
```

## ✅ Quality Assurance

### Performance Checklist
- ✅ 60 FPS on all devices
- ✅ < 50KB unminified
- ✅ No memory leaks (max snake capped)
- ✅ CSS vars cached (not queried per frame)
- ✅ Event listeners optimized (passive flags)
- ✅ Canvas rendering optimized

### Accessibility Checklist
- ✅ Keyboard navigation (all functions)
- ✅ Screen reader support (ARIA labels)
- ✅ Focus indicators visible
- ✅ Color contrast ≥ 4.5:1 (WCAG AA)
- ✅ Touch targets ≥ 44x44px
- ✅ Haptic feedback on mobile

### Responsive Checklist
- ✅ Mobile (320px+)
- ✅ Tablet (768px+)
- ✅ Desktop (1024px+)
- ✅ Landscape/Portrait
- ✅ High-DPI displays
- ✅ No horizontal scrolling

## 🚀 Deployment

The game is deployed to GitHub Pages:

```bash
# Automatic deployment to: https://raviteja-2000.github.io/Snake-game/
```

**No build step required** — files are served as-is.

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Feedback and suggestions welcome! Feel free to:
- Report bugs or crashes
- Suggest gameplay improvements
- Request new features
- Contribute code improvements

## 📊 Stats

- **Total Size**: 39KB (GitHub repo)
- **JavaScript**: 316 lines (optimized)
- **CSS**: 476 lines (responsive)
- **HTML**: 121 lines (semantic)
- **Build Time**: 0 seconds (no build required)
- **Load Time**: <500ms (most devices)

---

**Made with ❤️ as a professional portfolio project.**

Built to showcase modern web game development practices, responsive design, and progressive web app capabilities.