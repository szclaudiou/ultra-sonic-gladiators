# Ultra Sonic Gladiators — Technical Architecture

## Tech Stack Overview

**Core Framework**: Phaser 3 (via CDN)
- Version: 3.80.1+ 
- Delivery: `https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js`
- No build step required — pure static files

**Language**: Vanilla JavaScript (ES6+)
- No transpilation or bundling
- Direct browser execution
- Modern browser features (Web Audio API, Canvas 2D)

**Audio**: Pre-rendered OGG files + JSON beat maps
- MIDI → FluidSynth → OGG pipeline (external to game)
- Web Audio API for dynamic effects
- AudioContext management for mobile compatibility

**Deployment**: Vercel
- GitHub integration with automatic deploys
- Static file serving from repository root
- No server-side processing required

## Project Structure

```
ultra-sonic-gladiators/
├── index.html                 # Entry point, Phaser CDN import
├── README.md                  # Repository overview
├── DESIGN.md                  # Game design document
├── ARCHITECTURE.md            # This document
├── PROJECT_INDEX.md           # Project status and overview
├── CLAUDE.md                  # Technical specifications
├── TASK.md                    # Known issues and TODO items
├── AUDIT.md                   # Code review findings and fixes
│
├── docs/                      # Documentation and concept art
│   └── concept-art/
│       ├── solo-phase-concept.png      # UI layout reference
│       ├── clash-phase-concept.png     # Dual-track reference
│       └── morgana-original-comic.jpg  # Character design reference
│
├── src/                       # Game source code
│   ├── main.js               # Phaser configuration and game initialization
│   │
│   ├── scenes/               # Game scenes (Phaser Scene classes)
│   │   ├── MenuScene.js      # Main menu with title and mode selection
│   │   ├── CharSelectScene.js # Character selection interface
│   │   ├── BattleScene.js    # Primary gameplay scene (all 3 phases)
│   │   └── ResultScene.js    # Post-battle results and stats
│   │
│   ├── systems/              # Core game systems
│   │   ├── RhythmEngine.js   # Note spawning, hit detection, scoring
│   │   ├── ParticleSystem.js # Enchanted/non-enchanted particle management  
│   │   ├── BattleManager.js  # Phase management, HP, damage calculations
│   │   └── AudioManager.js   # Music playback and synchronization
│   │
│   └── data/                 # Game data and configuration
│       └── characters.js     # Character definitions and properties
│
└── assets/                   # Game assets (images, audio, data)
    ├── portraits/            # Character headshot images
    │   ├── argentum.png      # Argentum character portrait
    │   ├── morgana.png       # Morgana character portrait
    │   └── locked-grid.png   # Grid of locked character silhouettes
    │
    ├── arena/                # Environment backgrounds
    │   ├── arena-bg.png      # Cosmic colosseum background
    │   └── menu-bg.png       # Main menu background
    │
    ├── sprites/              # Character sprite assets
    │   ├── argentum-sprite.png  # Arena floor sprite
    │   └── morgana-sprite.png   # Arena floor sprite  
    │
    └── audio/                # Music and beat map data
        ├── argentum.ogg      # Argentum full battle music (120s)
        ├── morgana.ogg       # Morgana full battle music (120s)  
        ├── battle-mix.ogg    # Reference mix for balancing
        ├── argentum.mid      # MIDI source (not loaded by game)
        ├── morgana.mid       # MIDI source (not loaded by game)
        ├── beatmap-argentum.json  # Rhythm game note data
        └── beatmap-morgana.json   # Rhythm game note data
```

## Scene Flow Architecture

### Scene Transition Graph
```
MenuScene
    ↓ (VS MODE button)
CharSelectScene  
    ↓ (character selection + FIGHT button)
BattleScene
    ↓ (battle completion)
ResultScene
    ↓ (MENU button)
MenuScene (loop)
```

### Scene Responsibilities

**MenuScene** (`src/scenes/MenuScene.js`):
- Game title presentation
- Mode selection (VS MODE active, STORY MODE locked)
- Background particle effects for atmosphere
- Audio unlock handling for mobile browsers

**CharSelectScene** (`src/scenes/CharSelectScene.js`):
- 2×4 character grid display (2 active, 6 locked)
- Character selection with visual feedback
- Character information display (name, instrument, tagline)
- FIGHT button activation when both sides selected

**BattleScene** (`src/scenes/BattleScene.js`):
- Complete 3-phase battle system
- Dual rhythm track management (player + AI)
- Real-time particle system updates
- Audio synchronization and phase transitions
- HUD management (health, enchanted particles, phase status)
- Input handling for rhythm gameplay

**ResultScene** (`src/scenes/ResultScene.js`):
- Battle outcome presentation (winner/loser)
- Performance statistics display
- Final health bar visualization  
- Navigation back to menu or rematch options

## System Interaction Architecture

### Core System Dependencies
```
BattleScene (orchestrator)
    ├── AudioManager (music playback)
    ├── BattleManager (game state, HP, damage)
    ├── RhythmEngine (×2: player + AI tracks)  
    ├── ParticleSystem (visual effects)
    └── Input System (keyboard + touch)
```

### Data Flow Patterns

**Rhythm Input → Particle Enchantment**:
1. RhythmEngine detects note hit/miss
2. Fires callback to BattleScene with rating
3. BattleScene triggers ParticleSystem.enchantParticles()
4. ParticleSystem updates visual state and counts
5. BattleManager.getEnchantedCount() used for damage calculation

**Phase Transitions**:
1. BattleManager tracks elapsed time and triggers phase change
2. BattleScene.onPhaseChange() updates UI and track visibility  
3. AudioManager adjusts volume levels for active/inactive tracks
4. RhythmEngine filters notes by current phase
5. ParticleSystem enables/disables steal mechanics

**AI Performance**:
1. BattleScene schedules AI notes based on beat map and mood system
2. RhythmEngine (AI instance) processes auto-hits with humanized timing
3. Visual feedback shows AI performance on dedicated track
4. ParticleSystem enchants opponent particles based on AI accuracy

## Beat Map Data Format

### JSON Structure
```json
{
  "bpm": 130,
  "character": "argentum",
  "notes": [
    {
      "beat": 0,           // Beat number from start (0, 0.25, 0.5, etc.)
      "time": 0.0,         // Absolute time in seconds
      "lane": 1,           // Lane index 0-3 (left to right)
      "type": "normal",    // "normal" or "accent"
      "phase": 1           // Battle phase 1, 2, or 3
    }
  ]
}
```

### Timing Calculations
- **BPM**: Fixed at 130 beats per minute
- **Beat duration**: 60/130 = 0.4615 seconds per beat
- **Phase timing**:
  - Phase 1: Beats 0-65 (0-30 seconds)
  - Phase 2: Beats 65-130 (30-60 seconds)  
  - Phase 3: Beats 130-260 (60-120 seconds)

### Note Type Properties
- **Normal notes**: Standard scoring and AI difficulty
- **Accent notes**: 
  - Larger visual representation with glow effects
  - Worth more points in scoring calculation
  - Slightly harder for AI opponent to hit (increased miss chance)

## Audio Architecture

### Multi-Track Playback System
**File organization**:
- Each character has a complete 120-second track
- All three battle phases contained in single file
- Tracks designed to harmonize during Phase 3 clash

**Volume management**:
```javascript
// Solo phases: active track 100%, inactive 15%
activeTrack.setVolume(1.0);
inactiveTrack.setVolume(0.15);

// Clash phase: both tracks 100%  
playerTrack.setVolume(1.0);
opponentTrack.setVolume(1.0);
```

**Synchronization**:
- `AudioManager.getCurrentTime()` provides master timing reference
- `track.seek(time)` for phase transitions and restart
- Fallback timing using `scene.time` if audio seek unavailable

### Browser Compatibility
**Autoplay policy handling**:
- Audio Context starts suspended in modern browsers
- "TAP TO START" overlay requires user gesture
- `audioContext.resume()` called on first interaction
- Graceful fallback if Web Audio API unavailable

### Dynamic Sound Effects  
**Web Audio API synthesis**:
```javascript
// Hit effects: harmonic oscillator + envelope
createHitEffect(frequency, duration) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  // Configure frequency, ADSR envelope, routing...
}
```

## Asset Pipeline

### Visual Asset Generation
**Programmatic creation**: Most sprites generated via code
- Particle effects: Colored circles with alpha blending
- UI elements: Phaser Graphics API for shapes and lines
- Hit zone markers: Diamond shapes with glow shaders

**External assets**: Key visual elements
- Character portraits: High-detail illustrations (Nano Banana Pro generated)
- Arena backgrounds: Pre-rendered cosmic environments
- Character sprites: Pixel art representations for arena floor

### Audio Asset Pipeline (External)
**Production workflow** (separate from game runtime):
1. **MIDI composition**: Character themes with 3-phase structure
2. **FluidSynth rendering**: 
   ```bash
   fluidsynth -F output.wav soundfont.sf2 input.mid
   ```
3. **OGG encoding**: Web-optimized compression
4. **Beat map extraction**: MIDI note data → JSON format

**Beat map generation**:
- Parse MIDI note on/off events
- Calculate timing relative to 130 BPM grid
- Assign lanes based on pitch ranges or manual mapping
- Tag notes by phase based on timestamp ranges

## Deployment Architecture

### Static File Deployment
**Vercel configuration**:
- Repository root serves as web root
- No build step required — direct file serving
- Automatic deployment on GitHub push to main branch
- CDN distribution for global performance

**File optimization**:
- OGG audio files: Pre-compressed for web delivery
- PNG images: Optimized with transparency preservation  
- JavaScript: ES6+ features, no minification needed for prototype

### Development Workflow
```bash
# Local development
cd ultra-sonic-gladiators
python -m http.server 8000  # or any static file server

# Deployment  
git add -A
git commit -m "feat: description"
git push origin main        # Triggers Vercel build
```

### Performance Considerations
**Target performance**:
- 60 FPS with 180+ active particles
- <3 second initial load time
- <100ms input latency for rhythm accuracy

**Optimization strategies**:
- Object pooling for particles (avoid GC pressure)
- RAF-based update loops (not setTimeout)
- Texture atlasing for sprite batching
- Audio buffer preloading before battle start

## Mobile Compatibility

### Input Handling
**Touch zones**: Four equal-width areas at screen bottom
```javascript
// Touch zone mapping
const zoneWidth = gameWidth / 4;
const laneIndex = Math.floor(touchX / zoneWidth);
```

**Responsive scaling**:
- Base resolution: 1280×720
- Scale mode: `Phaser.Scale.FIT` with auto-centering
- Maintains aspect ratio across device sizes

### Performance Adaptations
**Mobile optimizations**:
- Reduced particle count on low-end devices (detection via performance timing)
- Simplified particle effects (fewer trails/glows)
- Audio buffer size adjustments for latency control
- Touch feedback with haptic vibration where available

## Memory Management

### Object Lifecycle
**Particle pooling**:
```javascript
class ParticlePool {
  constructor(size) {
    this.available = [];
    this.active = [];
    // Pre-allocate particle objects
  }
  
  acquire() { /* return from pool */ }
  release(particle) { /* return to pool */ }
}
```

**Scene cleanup**:
- Event listener removal on scene shutdown
- Audio track disposal and buffer cleanup
- Texture cache management for large assets

### Event System
**Callback management**:
- Scene-scoped event listeners
- Automatic cleanup on scene transitions
- Weak references where appropriate to prevent memory leaks

This architecture enables Ultra Sonic Gladiators to run efficiently as a pure web game while maintaining clear separation of concerns between visual presentation, audio synchronization, game logic, and user input handling.