# Ultra Sonic Gladiators — Game Design Document

## Concept & Story

Ultra Sonic Gladiators tells the story of a street musician who, while playing violin in deep focus, enters a transcendent flow state and finds themselves transported to an interdimensional gladiator arena. In this cosmic colosseum, musicians from across the universe are compelled to fight using their instruments as weapons. The main character discovers they cannot recreate the exact flow state needed to return home, and must now survive in this arena where music is both art and combat.

The game explores themes of artistic mastery under pressure, the power of music as a universal language, and the fine line between creative flow and competitive performance. Each character represents a different musical tradition and fighting philosophy, brought together in this otherworldly tournament.

## Core Mechanics

### Rhythm-Based Combat System
The fundamental gameplay loop centers on **musical accuracy driving combat effectiveness**. Players must perform on a 4-lane rhythm track similar to Guitar Hero or Rock Band. The better their timing and accuracy, the more **enchanted particles** they generate, which directly translates to damage output through sonic particle beams.

- **Perfect timing** (±50ms) enchants particles with full power and 1.5x score
- **Great timing** (±100ms) enchants particles normally with 1.0x score  
- **Good timing** (±150ms) partially enchants particles (0.5x power) with 0.5x score
- **Missed notes** (>150ms) break combos and cause particles to fizzle out

### Particle-to-Damage Conversion
Each player begins with 90 particles on their side of the arena. These particles exist in two states:
- **Non-enchanted**: Grey, dormant, floating passively
- **Enchanted**: Bright character-colored, dancing with sparkle trails, pulsing to the beat

At the end of each performance phase, damage is calculated as:
**Damage = (Enchanted Particles × 5) × Accuracy Multiplier**

Where Accuracy Multiplier = (Perfects×1.5 + Greats×1.0 + Goods×0.5) ÷ Total Notes

## Battle Structure

Each battle consists of three distinct phases with dynamic turn order determined by cosmic forces:

### Phase 1: First Solo (30 seconds)
A cosmic coin toss determines which gladiator performs first. During this phase:
- The active player performs on their rhythm track while their character takes center stage
- The opponent's track is dimmed and inactive, their character waits in the shadows
- Only the active player's music plays at full volume (opponent's track at 15% volume for atmosphere)
- Particles enchant based on the active player's performance
- Damage is calculated and applied at phase end

### Phase 2: Second Solo (30 seconds)  
The second gladiator takes their turn with the same mechanics:
- Roles reverse: previous opponent now performs actively
- Fresh particle pool to enchant (particles reset between phases)
- Different musical style and rhythm patterns challenge the player differently
- Damage calculated and applied, potentially ending the battle if HP reaches zero

### Phase 3: The Clash (60 seconds)
Both gladiators perform simultaneously in an epic musical duel:
- **Dual rhythm tracks**: Both players have active tracks on screen
- **Both music tracks** play at full volume, creating harmonic complexity
- **Particle steal mechanic**: If one player's enchanted count exceeds the other's by >15%, they begin stealing the opponent's enchanted particles
- Stolen particles gradually change color and drift across the arena midline
- Continuous small damage ticks based on enchanted particle advantage
- Winner determined by remaining HP when time expires

## Rhythm System

### 4-Lane Track Design
The rhythm interface uses a horizontal 4-lane system inspired by Guitar Hero:
- **Lane assignment**: D, F, J, K keys (left to right) for desktop
- **Mobile controls**: Four touch zones at screen bottom
- **Note visualization**: Diamond-shaped notes with glow trails scroll from right to left
- **Hit zones**: Bright vertical lines with beat pulse animations
- **Visual feedback**: Lane flashes and particle burst effects on successful hits

### Beat Map Structure
All rhythm patterns derive from MIDI compositions at 130 BPM:
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

**Note types**:
- **Normal notes**: Standard timing and scoring
- **Accent notes**: Larger visual size, worth more points, harder AI timing

**Timing windows**:
- Perfect: ±50ms (full enchant, 1.5× score)
- Great: ±100ms (full enchant, 1.0× score)
- Good: ±150ms (half enchant, 0.5× score)  
- Miss: >150ms (no enchant, combo break)

## Particle System

### Visual Spectacle
Particles are the primary visual element, filling the cosmic arena with dynamic energy:

**Non-enchanted particles (potential energy)**:
- Appearance: Small grey dots, barely visible
- Behavior: Float lazily with subtle drift patterns
- Purpose: Represent untapped musical potential

**Enchanted particles (kinetic energy)**:
- Appearance: Bright character-colored orbs with sparkle trails
- Behavior: Dance and swirl in rhythm, pulse with the beat
- Advanced effects: Bloom/glow halos, formation patterns

### Character-Specific Formations
Each gladiator has unique particle choreography reflecting their musical style:

**Argentum (Silver Cellist)**:
- **Formation**: Crescent wave patterns
- **Movement**: Flowing, galloping rhythms like bow strokes
- **Color palette**: Silver (#C0C0C0) and blue-white (#E8E8FF)

**Morgana Vex (Black Widow)**:
- **Formation**: Concentric web rings
- **Movement**: Precise geometric patterns, chromatic strikes
- **Color palette**: Purple (#8B00FF) and indigo (#4B0082)

### Attack Beam Sequence
When major damage is dealt, particles perform a dramatic attack animation:
1. **Convergence**: Enchanted particles rush toward arena center
2. **Beam formation**: Particles align into a focused energy beam
3. **Impact**: Beam fires toward opponent with explosive visual effect
4. **Rebound**: Particles bounce back to original positions, now dimmed

## Characters

### Argentum — The Silver Cellist
**Archetype**: Heroic virtuoso, silver-armored champion
**Instrument**: Power cello with metallic strings
**Personality**: Flashy, plays to the crowd, believes in music as heroic expression
**Visual design**: 
- Silver armor with flowing hair
- Cello integrated as both instrument and weapon
- Color scheme: Metallic silver with blue-white accents

**Musical style**:
- Galloping rhythms and fast arpeggios
- Heroic, soaring melodies
- Dynamic range from delicate passages to thunderous fortissimo

### Morgana Vex — The Black Widow  
**Archetype**: Gothic mastermind, spider-being with supernatural calm
**Instrument**: Massive pipe organ with spider-leg pipes
**Personality**: Cold, calculating, views combat as chess with sound
**Visual design**:
- Spider anatomy with 6 arms for complex organ playing
- Victorian gothic aesthetic with pale skin
- Web pattern motifs throughout design
- *Reference*: Joe's original Black Widow comic illustration

**Musical style**:
- Sustained dissonance and chromatic harmony
- Web-like interconnected patterns
- Cold precision over emotional expression

### Future Characters (Locked)
The character select screen shows 6-8 total slots with only Argentum and Morgana playable in the prototype. Locked characters appear as silhouettes, representing the broader universe of musical gladiators to be revealed in future updates.

## Visual Design

### Cosmic Arena Setting
The battle takes place in a **dark cosmic colosseum** that evokes both ancient Roman amphitheaters and interdimensional space:

**Arena background**: 
- Pre-rendered cosmic environment with nebulae and distant stars
- Dark purple/blue void palette creating depth
- Ancient architectural elements floating in space
- Subtle parallax movement responding to particle activity

**Atmospheric elements**:
- Spectator dots in distant arena stands (small colored lights)
- Spotlight beams illuminating the performance area
- Dark vignette overlay for cinematic depth

### Character Representation
**HUD portraits**: Detailed circular headshots (coin-sized) in screen corners
- High-detail character art showing personality and instrument
- Glowing borders matching character colors
- Health bars extending horizontally from portraits

**Arena sprites**: Small pixel-art figures on the arena floor
- Deliberately minimal detail — particles are the visual star
- 2.5x scale from base pixel art
- Ground glow circles that pulse with successful hits
- Positioned to create clear left/right opposition

### UI Design Philosophy
The interface prioritizes the particle spectacle while maintaining clear gameplay information:
- **Rhythm tracks**: Semi-transparent dark panels at bottom
- **Particles**: Fill the majority of screen real estate
- **HUD elements**: Minimal, non-intrusive, character-themed colors
- **Phase transitions**: Full-screen dramatic text animations

## Audio Pipeline

### Music Production Workflow
**MIDI Composition → FluidSynth Rendering → OGG Format**

1. **MIDI creation**: Character themes composed with narrative structure
2. **FluidSynth rendering**: Clean instrument separation using MuseScore General soundfont
3. **OGG encoding**: Web-optimized audio files with metadata
4. **Beat map derivation**: Rhythm game data extracted directly from MIDI timing

### Audio Architecture
**Per-character audio tracks**:
- `argentum.ogg` — Full battle music (all 3 phases, 120 seconds)
- `morgana.ogg` — Full battle music with different instrumental arrangement
- `battle-mix.ogg` — Reference mix for Phase 3 balancing

**Phase-based mixing**:
- **Solo phases**: Active character at 100% volume, inactive at 15%
- **Clash phase**: Both tracks at 100% volume for harmonic complexity
- **BPM**: Consistent 130 BPM for precise rhythm game timing

### Dynamic Sound Effects
Synthesized using Web Audio API oscillators:
- **Hit sounds**: Bright harmonic chimes for successful notes
- **Miss sounds**: Discordant buzz for failed attempts
- **Particle effects**: Sparkle and whoosh sounds for enchantment
- **Damage effects**: Bass-heavy impact sounds for beam attacks

## AI Opponent System

### Mood-Based Performance
The AI opponent features an organic performance system that simulates human-like inconsistency:

**Mood states**:
- **Hot streak**: 85-90% accuracy, confident timing
- **Cold streak**: 65-75% accuracy, nervous timing variations
- **Baseline**: 70-80% accuracy, steady performance

**Humanization factors**:
- **Timing jitter**: ±30ms variation even on successful hits
- **Streak psychology**: Success breeds confidence, failure causes doubt
- **Accent note difficulty**: AI struggles more with accent/special notes
- **Pattern fatigue**: Slight accuracy decrease during long sequences

### Visual AI Feedback  
The AI opponent plays on their own visible rhythm track with full visual feedback:
- **AI track positioning**: Above player track during solos, visible during clash
- **Hit visualization**: Lane flashes and rating text (PERFECT/GREAT/MISS)
- **Miss animation**: Visual stutter and particle fizzle effects
- **Performance variety**: Visible combo building and breaking

## Art Style

### Color Palette
**Primary colors**:
- **Cosmic background**: Deep purples (#2B1B59) and dark blues (#1B2B59)
- **Argentum theme**: Silver (#C0C0C0) and ice blue (#E8E8FF)  
- **Morgana theme**: Purple (#8B00FF) and indigo (#4B0082)
- **Neutral elements**: Dark greys and muted whites for UI

**Visual hierarchy**:
1. **Enchanted particles** — Brightest, most saturated colors
2. **Character elements** — Strong but secondary color presence
3. **Arena/environment** — Muted, atmospheric colors
4. **UI elements** — Subtle, non-competing colors

### Concept Art References
Located in `docs/concept-art/`:
- `solo-phase-concept.png` — Reference for single-player phase layout
- `clash-phase-concept.png` — Reference for dual-player clash phase
- `morgana-original-comic.jpg` — Joe's canonical Black Widow illustration

## Planned Features (Future Vision)

### Technology Evolution
**Godot port consideration**: If the concept validates, consider porting to Godot for:
- Enhanced 3D arena environments
- More sophisticated particle physics
- Advanced audio processing capabilities
- Cross-platform mobile optimization

### Content Expansion
**Additional characters**: Expand roster to 6-8 total gladiators
- Each with unique instrument, visual style, and musical patterns
- Diverse cultural musical traditions represented
- Escalating difficulty and complexity

**Story mode**: Single-player campaign exploring the lore
- Character backstories and motivations
- Progressive difficulty and mechanics introduction
- Arena environments matching character themes

**Online multiplayer**: Real-time battles between players
- Ranked competitive modes
- Spectator systems with audience participation
- Tournament bracket systems

### Gameplay Evolution
**Advanced mechanics**:
- Multi-instrument characters with switching mechanics
- Environmental hazards affecting particle behavior
- Combo abilities and special moves
- Dynamic difficulty based on performance

**Arena varieties**:
- Character-specific arena designs
- Environmental effects on particle physics
- Interactive audience systems
- Weather and cosmic events affecting gameplay

## Technical Architecture Summary

**Development approach**: Phaser 3 web game with vanilla JavaScript
**Deployment**: Static files via Vercel with automatic GitHub integration
**Audio**: Pre-rendered OGG files with JSON beat map data
**Assets**: Programmatic generation where possible, minimal external dependencies
**Performance target**: 100+ particles at 60fps on mid-range mobile devices
**Input support**: Keyboard (D/F/J/K) and multi-touch mobile controls

This design document establishes Ultra Sonic Gladiators as a rhythm-fighting hybrid that prioritizes musical expression, visual spectacle, and accessible competitive gameplay. The particle-based damage system creates a unique connection between musical skill and combat effectiveness, while the three-phase battle structure ensures varied pacing and strategic depth.