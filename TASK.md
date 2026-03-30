# CRITICAL FIXES — Ultra Sonic Gladiators

## Issues to Fix (in priority order)

### 1. Game Flow is BROKEN — Nothing works past main menu
The VS MODE button click doesn't reliably transition to CharSelectScene. Debug and fix the full flow:
- Menu → CharSelect → Battle → Results must all work
- Test by adding `console.log` at each scene transition
- The Phaser input system needs proper interactive zones
- **Browser autoplay policy**: Audio won't play without user gesture. Add a "CLICK TO START" overlay or use Phaser's unlock audio on first interaction.

### 2. AI Opponent Must Be VISIBLE
The opponent needs their own rhythm track that the player can SEE being played:
- **Two rhythm tracks in battle**: Player's track at bottom, AI's track slightly above (or mirrored at top)
- AI has its OWN notes scrolling on its OWN track
- When AI hits a note, show the same visual feedback (PERFECT/GREAT flash, hit effect)
- AI accuracy should vary: ~70-85% hit rate, with occasional misses
- AI should have visible "fingers" hitting the lanes (flash the lane on hit)
- During solo phases, only the active player's track is visible
- During Phase 3 (clash), BOTH tracks visible simultaneously

### 3. Battle Screen Visual Quality — Must Match Reference
The current battle screen is bare rectangles on black. It needs to look like our concept art:

**Arena**: 
- The arena-bg.png should fill the screen as background
- Add a dark vignette overlay for depth
- Subtle parallax: background slightly shifts with particle activity

**Portraits (HUD)**:
- Small circular portraits in top corners with glowing borders
- Health bars should have gradient fills and glow effects
- Phase indicator should be prominent and animated

**Particles**:
- Must be the DOMINANT visual element — they should fill the arena space
- Non-enchanted: small grey dots, barely visible, floating lazily
- Enchanted: BRIGHT, character-colored, leave sparkle trails, pulse with the beat
- More particles: increase to 60-70 per side
- Add glow/bloom effect to enchanted particles (larger semi-transparent circle behind each)

**Rhythm Track**:
- Semi-transparent dark panel at bottom
- Notes should be diamond shapes (not circles) with glow trails
- Hit zone should have a bright vertical line with pulse animation on beat
- Lane dividers should be subtle
- Accent notes should be larger and have a glow aura

**Phase Transitions**:
- Full-screen flash on phase change
- "PHASE 2" / "THE CLASH" text should be dramatic with scale animation

**Coin Flip**:
- Show an actual spinning coin animation (can be simple: alternating text with scale tween)

### 4. Character Select Must Work
- Clicking a character portrait MUST highlight it and show FIGHT button
- Make the hit areas larger and more forgiving
- Add hover glow effect
- Selected character should have a pulsing border
- FIGHT button should be prominently visible

### 5. Audio Timing
- Audio tracks start at volume 0 — must set phase volumes BEFORE calling play
- Use `firstTrack.seek` for timing (already done, but verify it works with OGG)
- Add fallback timing using scene.time if audio seek fails
- Handle browser autoplay: resume AudioContext on first user click

### 6. Beat Map Phase Timing Issue
The beat maps have notes with phase 1/2/3 markers, but the time values are ABSOLUTE from beat 0:
- Phase 1 notes: time 0-30s (correct for phase 1)
- Phase 2 notes: time 30-60s (need offset since they're in Morgana's file starting from beat 65)
- Phase 3 notes: time 60-120s (need offset since they start at beat 130)
- **VERIFY**: The time values in beatmap JSONs — do they already account for the phase offsets or not?
- The rhythm engine needs to filter notes by current music time, not by phase number

Check `assets/audio/beatmap-argentum.json` and `assets/audio/beatmap-morgana.json` to verify the actual time values.

## Files to Modify
- `src/scenes/BattleScene.js` — Major rewrite for visuals + AI track
- `src/scenes/CharSelectScene.js` — Fix click detection
- `src/systems/RhythmEngine.js` — Add diamond notes, glow effects, support dual tracks
- `src/systems/ParticleSystem.js` — More particles, better effects, glow/bloom
- `src/systems/AudioManager.js` — Fix volume timing, add autoplay handling
- `src/systems/BattleManager.js` — May need fixes for phase transitions
- `src/main.js` — Expose game object globally for debugging: `window.game = new Phaser.Game(config)`

## DO NOT TOUCH
- `src/scenes/MenuScene.js` — Main menu looks great, leave it exactly as is
- Asset files in `assets/` — Don't modify images or audio

## Testing
After every change, verify:
1. Can you click VS MODE from menu?
2. Can you select a character?
3. Does FIGHT button appear and work?
4. Does the coin flip play?
5. Does music start playing?
6. Do notes scroll on the rhythm track?
7. Can you hit notes with D/F/J/K?
8. Do particles enchant on hits?
9. Does Phase 2 transition work?
10. Does Phase 3 show both tracks?
11. Does AI opponent play and hit notes visibly?
12. Does the result screen show after battle?

## When Done
- Commit everything with descriptive message
- Push to origin main (Vercel auto-deploys)
- Verify the deploy at https://ultra-sonic-gladiators.vercel.app
