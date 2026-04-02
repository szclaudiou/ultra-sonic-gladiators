# Mobile Responsiveness Fix

## Problem
The game uses Phaser.Scale.FIT with fixed 1280x720, causing:
1. Portrait mode: massive black space above, game squished at bottom
2. Landscape on small screens: game doesn't fill the viewport, black bars on sides

## Solution

### 1. Change Phaser Scale Mode
In src/main.js, change scale config to RESIZE mode so the game fills the viewport:
```js
scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%',
    min: { width: 320, height: 480 },
    max: { width: 1920, height: 1080 }
}
```
Remove the fixed width/height from top-level config (keep only in scale).

### 2. Make ALL scenes use relative positioning
Every scene currently has hardcoded pixel positions (640 for center-x, 360 for center-y, 1280 for width, 720 for height).

Replace ALL hardcoded positions with dynamic calculations based on camera/scene dimensions:
```js
const { width, height } = this.cameras.main;
const cx = width / 2;   // center x (replaces all 640)
const cy = height / 2;  // center y (replaces all 360)
```

### 3. Files to modify:

**src/main.js** — Scale config change

**src/scenes/MenuScene.js** — Replace all 1280/720/640/360 with dynamic values. Scale fonts/buttons for small screens.

**src/scenes/CharSelectScene.js** — Same: dynamic positions, responsive layout.

**src/scenes/BattleScene.js** — This is the big one:
- Arena background: fill the viewport
- Character positions: relative to screen dimensions
- HUD: anchor to edges (health bars top, rhythm track bottom)
- Particle system: distribute across actual viewport
- Rhythm track: position relative to bottom of screen
- Phase text: center dynamically

**src/scenes/ResultScene.js** — Dynamic positioning for results display.

**src/systems/RhythmEngine.js** — The rhythm track uses hardcoded Y positions and lane X positions. Make these relative to the viewport.

**src/systems/ParticleSystem.js** — Particle bounds should use actual viewport dimensions.

**src/systems/BattleManager.js** — Check if any positioning is done here.

### 4. Add resize handler
Each scene should listen for the resize event:
```js
this.scale.on('resize', (gameSize) => {
    this.onResize(gameSize.width, gameSize.height);
});
```

### 5. Portrait mode handling
For portrait phones, the game should:
- Force landscape orientation hint OR
- Adapt the layout vertically (rhythm track at bottom, arena above, HUD stacked)
- At minimum, show a "rotate your device" message if aspect ratio is too tall

### 6. Font scaling
All font sizes should scale with screen width:
```js
const baseFontSize = Math.max(16, Math.min(72, width * 0.056));
```

### 7. Touch zones
Touch zone sizes in BattleScene should scale with viewport, not be fixed pixel values.

## Key Rule
NEVER use hardcoded pixel values. Always calculate from `this.cameras.main.width/height` or `this.scale.width/height`.

## When Done
1. Test that all scenes look correct at various sizes
2. `git add -A && git commit -m "feat: mobile responsive scaling for all scenes"`
3. `git push origin feat/mobile-responsive`
4. `gh pr create --base main --title "feat: mobile responsive scaling" --body "Fix mobile responsiveness - game now fills viewport on all screen sizes. Replaced all hardcoded positions with dynamic calculations. Added portrait mode handling."`
5. Run: `openclaw system event --text "Done: USG mobile responsive fix - PR created" --mode now`
