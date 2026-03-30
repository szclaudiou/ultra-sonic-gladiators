# CLAUDE.md — Ultra Sonic Gladiators

## What This Is
A rhythm-based fighting game prototype. Two musician gladiators face off in an interdimensional arena. You play musical notes on a 4-lane rhythm track — the better your accuracy, the more particles you enchant, the more damage your sonic beam deals.

## Tech Stack
- **Phaser 3** (via CDN, no build step needed)
- **HTML5 Canvas** — runs in any browser
- **Vanilla JavaScript** — no framework, keep it simple
- **GitHub Pages** deployment — the game must work as static files

## Project Structure
```
/
├── index.html          # Entry point, loads Phaser from CDN
├── src/
│   ├── main.js         # Phaser game config, scene registration
│   ├── scenes/
│   │   ├── MenuScene.js       # Main menu
│   │   ├── CharSelectScene.js # Character selection (VS mode)
│   │   ├── BattleScene.js     # The main battle (all 3 phases)
│   │   └── ResultScene.js     # Win/lose screen
│   ├── systems/
│   │   ├── RhythmEngine.js    # Note spawning, hit detection, scoring
│   │   ├── ParticleSystem.js  # Enchanted/non-enchanted particles
│   │   ├── BattleManager.js   # Phase management, HP, damage calc
│   │   └── AudioManager.js    # Music playback, sync
│   └── data/
│       └── characters.js      # Character definitions
├── assets/
│   ├── portraits/      # Character headshots (already generated)
│   ├── arena/          # Arena and menu backgrounds
│   ├── audio/          # OGG music files + JSON beat maps
│   ├── sprites/        # Pixel art (generate programmatically or simple shapes)
│   └── ui/             # UI elements
└── scripts/            # Build/compose scripts (not part of game)
```

## Game Design

### Characters
- **Argentum** (Silver Cellist): Silver armor, flowing hair, heroic. Color: silver/blue-white (#C0C0C0, #E8E8FF)
- **Morgana Vex** (Black Widow): Gothic, pale, calculating. Color: purple (#8B00FF, #4B0082)
- 4-6 more characters shown as locked silhouettes on character select

### Battle Structure (3 Phases)
1. **Phase 1** (30 seconds): First player's solo. They play the rhythm track, opponent is dimmed/waiting. A cosmic coin flip at the start decides who goes first.
2. **Phase 2** (30 seconds): Second player's solo. Same mechanics, different character's music.
3. **Phase 3 — The Clash** (60 seconds): BOTH play simultaneously. Two rhythm tracks stacked. Steal mechanic active.

**Damage**: Calculated at the end of each solo phase. Enchanted particle count × accuracy multiplier = damage.

### Rhythm Mechanic (4 Lanes)
- 4 lanes at the bottom of the screen (like Guitar Hero)
- Notes scroll from RIGHT to LEFT toward hit zones on the LEFT
- Desktop controls: D, F, J, K keys (one per lane)
- Mobile controls: 4 tap zones at bottom
- Timing windows:
  - **PERFECT** (±50ms): Full particle enchant, 1.5x score
  - **GREAT** (±100ms): Full enchant, 1.0x score  
  - **GOOD** (±150ms): Partial enchant (0.5x), 0.5x score
  - **MISS** (>150ms): No enchant, breaks combo, particle fizzles
- Combo system: consecutive non-miss hits multiply score
- Beat map data is in `assets/audio/beatmap-argentum.json` and `beatmap-morgana.json`

### Particle System
- Each side starts with an equal number of particles (e.g., 50 each)
- **Non-enchanted particles**: Grey, dim, float lazily. These are potential.
- **Enchanted particles**: Bright, character-colored, DANCE. They swirl, trail sparkles, pulse with the beat.
- When player hits notes well, non-enchanted particles become enchanted (grey → colored, dormant → dancing)
- **Steal mechanic (Phase 3 only)**: If your enchanted count exceeds opponent's by >15%, you start slowly stealing their enchanted particles. Stolen particles transition color (purple → silver or vice versa) as they drift across the midline.

### Visual Design (CRITICAL — Reference: v3 concepts)
- **Portraits**: Small circular headshots in top corners (coin-sized). Health bars extend from them.
- **Arena**: Dark cosmic colosseum background (pre-rendered image). The image is in `assets/arena/arena-bg.png`.
- **Characters in arena**: VERY small pixel-art sprites or simple geometric shapes. They are NOT the focus.
- **Particles DOMINATE the visual**. They should fill the arena space. Hundreds of them.
- **Rhythm track**: Bottom 25-30% of screen. Dark translucent background. Bright note markers.
- **Color palette**: Dark cosmic (deep purple/blue void), silver vs purple as the character colors.

### Audio
- Pre-rendered OGG files for each character's full battle track
- `assets/audio/argentum.ogg` — Argentum's cello (all 3 phases in one file)
- `assets/audio/morgana.ogg` — Morgana's organ (all 3 phases in one file)  
- `assets/audio/battle-mix.ogg` — Both mixed (for reference/Phase 3)
- BPM: 130. Phase timing:
  - Phase 1: 0-30 seconds (beats 0-65)
  - Phase 2: 30-60 seconds (beats 65-130)  
  - Phase 3: 60-120 seconds (beats 130-260)
- During solo phases, play BOTH tracks but the inactive character's track should be very quiet (volume 0.15)
- During Phase 3, both tracks at full volume

### Beat Map Format
```json
{
  "bpm": 130,
  "character": "argentum",
  "notes": [
    {"beat": 0, "time": 0.0, "lane": 1, "type": "normal", "phase": 1},
    {"beat": 0.66, "time": 0.305, "lane": 2, "type": "accent", "phase": 1}
  ]
}
```
- `time` is in seconds from music start
- `lane` is 0-3 (left to right)
- `type`: "normal" or "accent" (accent = stronger visual, worth more)
- `phase`: which phase this note belongs to

### HP and Damage
- Each character starts with 1000 HP
- After Phase 1: attacker deals damage = (enchanted_particles × 5) × accuracy_multiplier
- After Phase 2: same for other player
- Phase 3: continuous damage ticks based on enchanted advantage
- accuracy_multiplier: (perfects×1.5 + greats×1.0 + goods×0.5) / total_notes
- If HP hits 0, battle ends immediately with a KO

### Main Menu
- Background: `assets/arena/menu-bg.png`
- Title: "ULTRA SONIC GLADIATORS" (can be text, styled with glow)
- Buttons: "VS MODE", "COMING SOON: STORY MODE" (greyed out)
- Subtle particle effects in background

### Character Select
- Grid layout: 2 rows × 4 columns = 8 slots
- Argentum and Morgana are selectable with their portraits
- Other 6 slots show locked silhouettes with "?" or lock icon
- Player picks their character, opponent is auto-assigned the other
- Show character name, instrument, and a short tagline

### Result Screen
- Winner's portrait large, loser dimmed
- Final HP bars shown
- "VICTORY" or "DEFEAT" text
- Stats: total notes, accuracy %, max combo, particles enchanted
- "REMATCH" and "MENU" buttons

## Technical Notes

### Phaser 3 Setup
Use Phaser 3 from CDN. The game should work with a simple HTTP server (no bundler).
```html
<script src="https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js"></script>
```

### Responsive Design
- Target: 1280×720 base resolution
- Scale mode: Phaser.Scale.FIT with autoCenter
- Must work on mobile (touch input for rhythm lanes)

### GitHub Pages
- The repo root serves as the site
- index.html at root
- All paths relative
- No server-side anything

### Performance
- Particle system should handle 100+ particles smoothly
- Use Phaser's built-in particle emitter OR custom sprite-based particles
- Don't create/destroy objects every frame — pool them

## Assets Already Available
- `assets/portraits/argentum.png` — Argentum headshot
- `assets/portraits/morgana.png` — Morgana headshot  
- `assets/portraits/locked-grid.png` — Grid of 4 locked character silhouettes
- `assets/arena/arena-bg.png` — Arena background
- `assets/arena/menu-bg.png` — Menu background
- `assets/audio/argentum.ogg` — Argentum's full battle music
- `assets/audio/morgana.ogg` — Morgana's full battle music
- `assets/audio/battle-mix.ogg` — Mixed battle music
- `assets/audio/argentum.mid` — MIDI source
- `assets/audio/morgana.mid` — MIDI source
- `assets/audio/beatmap-argentum.json` — Rhythm game note data
- `assets/audio/beatmap-morgana.json` — Rhythm game note data

## What You Need to Build
1. `index.html` — entry point
2. All JS files in `src/`
3. Any additional simple assets (can be drawn programmatically — colored circles for particles, simple shapes for note markers, etc.)
4. The game should be FULLY PLAYABLE from start to finish: menu → character select → battle (all 3 phases) → result screen

## IMPORTANT
- This is a PROTOTYPE. Polish where it matters (rhythm feel, particle spectacle) but don't over-engineer.
- The rhythm game timing MUST feel tight. Input latency kills rhythm games.
- Particles are the visual star. Make them look alive.
- Test on both desktop and mobile (touch events).
- Commit often with clear messages.
- When done, the game must be playable at: https://szclaudiou.github.io/ultra-sonic-gladiators/
