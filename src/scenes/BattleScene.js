class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
    }

    init(data) {
        this.playerCharId = data.player || 'argentum';
        this.opponentCharId = data.opponent || 'morgana';
    }

    create() {
        const pChar = CHARACTERS[this.playerCharId];
        const oChar = CHARACTERS[this.opponentCharId];
        this.pChar = pChar;
        this.oChar = oChar;

        // ===== ARENA BACKGROUND =====
        this.add.image(640, 360, 'arena-bg').setDisplaySize(1280, 720);
        // Dark overlay for depth
        this.add.rectangle(640, 360, 1280, 720, 0x000022, 0.35);
        // Vignette edges
        const vig = this.add.graphics().setDepth(2);
        vig.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.7, 0.7, 0, 0);
        vig.fillRect(0, 0, 1280, 80);
        vig.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.5, 0.5);
        vig.fillRect(0, 640, 1280, 80);

        // Spectator glow — animated crowd dots at the arena edges
        this.spectators = [];
        for (let i = 0; i < 60; i++) {
            // Arrange in curved rows suggesting stadium seating
            const angle = (i / 60) * Math.PI + Math.PI * 0.1;
            const r = 580 + Math.random() * 100;
            const cx = 640 + Math.cos(angle) * r * 0.6;
            const cy = 60 + Math.sin(angle) * r * 0.15 - Math.random() * 30;
            const colors = [0x4444ff, 0xff4444, 0xffff44, 0x44ff44, 0xff44ff];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const dot = this.add.circle(cx, cy, 1.5 + Math.random(), color, 0.3 + Math.random() * 0.4).setDepth(1);
            this.spectators.push({ dot, phase: Math.random() * Math.PI * 2, baseAlpha: 0.3 + Math.random() * 0.3 });
        }

        // Spotlight beams from above (subtle)
        const lights = this.add.graphics().setDepth(2);
        lights.fillStyle(0xffffff, 0.015);
        lights.fillTriangle(200, 0, 260, 0, 280, 460);
        lights.fillStyle(0xffffff, 0.012);
        lights.fillTriangle(550, 0, 620, 0, 640, 460);
        lights.fillStyle(0xffffff, 0.012);
        lights.fillTriangle(660, 0, 730, 0, 640, 460);
        lights.fillStyle(0xffffff, 0.015);
        lights.fillTriangle(1020, 0, 1080, 0, 1000, 460);

        // Midline energy (animated in Phase 3)
        this.midline = this.add.graphics().setDepth(5);
        this.midline.lineStyle(1, 0x4444aa, 0.15);
        this.midline.lineBetween(640, 70, 640, 460);

        // Pixel art character sprites — small arena figures
        const spriteScale = 2;
        this.playerSprite = this.add.container(220, 370).setDepth(10);
        const pGlowAura = this.add.circle(0, 0, 40, pChar.color, 0.07);
        const pSpr = this.add.image(0, 0, pChar.sprite).setScale(spriteScale).setOrigin(0.5);
        this.playerSprite.add([pGlowAura, pSpr]);

        this.opponentSprite = this.add.container(1060, 370).setDepth(10);
        const oGlowAura = this.add.circle(0, 0, 45, oChar.color, 0.07);
        const oSpr = this.add.image(0, 0, oChar.sprite).setScale(spriteScale).setOrigin(0.5);
        this.opponentSprite.add([oGlowAura, oSpr]);

        // Character base glow (ground effect)
        this.playerGlow = this.add.circle(220, 420, 40, pChar.color, 0.07).setDepth(3);
        this.opponentGlow = this.add.circle(1060, 420, 45, oChar.color, 0.07).setDepth(3);

        // ===== HUD =====
        this.createHUD(pChar, oChar);

        // ===== AUDIO MANAGER =====
        this.audioManager = new AudioManager(this);
        this.audioManager.addTrack(this.playerCharId, pChar.audio, 0);
        this.audioManager.addTrack(this.opponentCharId, oChar.audio, 0);

        // ===== BATTLE MANAGER =====
        this.battleManager = new BattleManager(this, {
            playerChar: pChar,
            opponentChar: oChar,
            onPhaseChange: (phase) => this.onPhaseChange(phase),
            onBattleEnd: (winner) => this.onBattleEnd(winner),
            onDamage: (attacker, damage) => this.onDamage(attacker, damage)
        });

        // ===== PARTICLE SYSTEM =====
        this.gameParticles = new GameParticleSystem(this, {
            playerColor: pChar.color,
            opponentColor: oChar.color,
            playerColorAlt: pChar.colorAlt,
            opponentColorAlt: oChar.colorAlt,
            totalPerSide: 90
        });

        // ===== BEAT MAPS =====
        this.beatmapPlayer = this.cache.json.get(pChar.beatmap);
        this.beatmapOpponent = this.cache.json.get(oChar.beatmap);

        // ===== RHYTHM ENGINES =====
        // Player's track (bottom) — 4 lanes, condensed
        this.playerTrack = new RhythmEngine(this, {
            trackY: 575, trackHeight: 135, hitZoneX: 160, noteSpeed: 480,
            color: pChar.color, colorHex: pChar.colorHex,
            depth: 100,
            onHit: (rating, note) => this.onPlayerHit(rating, note),
            onMiss: (note) => this.onPlayerMiss(note)
        });

        // AI opponent track
        this.aiTrack = new RhythmEngine(this, {
            trackY: 490, trackHeight: 80, hitZoneX: 160, noteSpeed: 380,
            color: oChar.color, colorHex: oChar.colorHex,
            isAI: true, label: oChar.name,
            depth: 95,
            onHit: (rating, note) => this.onAIHit(rating, note),
            onMiss: (note) => {}
        });
        this.aiTrack.setVisible(false);

        // ===== INPUT =====
        this.setupInput();

        // ===== STATE =====
        this.battleStarted = false;
        this.musicTime = 0;
        this.stealCooldown = 0;
        this.BPM = 130;
        this.beatInterval = 60 / this.BPM;
        this.lastBeatTime = 0;
        this.currentPhase = 0;
        this.aiNotes = []; // scheduled AI auto-play
        this.aiProcessed = new Set();

        // ===== AUDIO UNLOCK =====
        // Browser autoplay policy requires user gesture before audio
        if (this.sound.context && this.sound.context.state === 'suspended') {
            const unlockOverlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.9).setDepth(400).setInteractive();
            const unlockText = this.add.text(640, 340, '🎵 TAP TO START 🎵', {
                fontSize: '36px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffcc00'
            }).setOrigin(0.5).setDepth(401);
            const unlockSub = this.add.text(640, 390, 'Audio requires user interaction', {
                fontSize: '16px', fontFamily: 'monospace', color: '#888899'
            }).setOrigin(0.5).setDepth(401);

            unlockOverlay.once('pointerdown', () => {
                this.sound.context.resume();
                unlockOverlay.destroy();
                unlockText.destroy();
                unlockSub.destroy();
                this.showCoinFlip();
            });
        } else {
            this.showCoinFlip();
        }
    }

    createHUD(pChar, oChar) {
        const hudDepth = 200;

        // ---- LEFT (Player) ----
        // Portrait circle
        const pPort = this.add.image(42, 32, pChar.portrait).setDisplaySize(48, 48).setDepth(hudDepth);
        const pRing = this.add.graphics().setDepth(hudDepth);
        pRing.lineStyle(2.5, pChar.color, 0.9);
        pRing.strokeCircle(42, 32, 27);

        // Name
        this.add.text(78, 10, pChar.name, {
            fontSize: '13px', fontFamily: 'Arial', fontStyle: 'bold', color: pChar.colorHex
        }).setDepth(hudDepth);

        // HP bar
        this.playerHPBg = this.add.rectangle(230, 35, 260, 14, 0x222233).setOrigin(0, 0.5).setDepth(hudDepth);
        this.playerHPBar = this.add.rectangle(230, 35, 260, 14, pChar.color).setOrigin(0, 0.5).setDepth(hudDepth + 1);
        this.playerHPText = this.add.text(365, 35, '1000', {
            fontSize: '11px', fontFamily: 'monospace', color: '#ffffff'
        }).setOrigin(0.5).setDepth(hudDepth + 2);

        // Enchanted count
        this.playerEnchText = this.add.text(78, 50, '✦ 0', {
            fontSize: '11px', fontFamily: 'monospace', color: pChar.colorHex
        }).setDepth(hudDepth).setAlpha(0.7);

        // ---- RIGHT (Opponent) ----
        const oPort = this.add.image(1238, 32, oChar.portrait).setDisplaySize(48, 48).setDepth(hudDepth);
        const oRing = this.add.graphics().setDepth(hudDepth);
        oRing.lineStyle(2.5, oChar.color, 0.9);
        oRing.strokeCircle(1238, 32, 27);

        this.add.text(1202, 10, oChar.name, {
            fontSize: '13px', fontFamily: 'Arial', fontStyle: 'bold', color: oChar.colorHex
        }).setOrigin(1, 0).setDepth(hudDepth);

        this.opponentHPBg = this.add.rectangle(790, 35, 260, 14, 0x222233).setOrigin(0, 0.5).setDepth(hudDepth);
        this.opponentHPBar = this.add.rectangle(1050, 35, 260, 14, oChar.color).setOrigin(1, 0.5).setDepth(hudDepth + 1);
        this.opponentHPText = this.add.text(915, 35, '1000', {
            fontSize: '11px', fontFamily: 'monospace', color: '#ffffff'
        }).setOrigin(0.5).setDepth(hudDepth + 2);

        this.opponentEnchText = this.add.text(1202, 50, '✦ 0', {
            fontSize: '11px', fontFamily: 'monospace', color: oChar.colorHex
        }).setOrigin(1, 0).setDepth(hudDepth).setAlpha(0.7);

        // ---- CENTER: Phase indicator ----
        this.phaseText = this.add.text(640, 32, '', {
            fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffcc00'
        }).setOrigin(0.5).setDepth(hudDepth);

        // Timer
        this.timerText = this.add.text(640, 54, '', {
            fontSize: '12px', fontFamily: 'monospace', color: '#888899'
        }).setOrigin(0.5).setDepth(hudDepth);
    }

    setupInput() {
        // Keyboard: D, F, J, K
        const keys = [
            Phaser.Input.Keyboard.KeyCodes.D,
            Phaser.Input.Keyboard.KeyCodes.F,
            Phaser.Input.Keyboard.KeyCodes.J,
            Phaser.Input.Keyboard.KeyCodes.K
        ];
        keys.forEach((code, lane) => {
            this.input.keyboard.addKey(code).on('down', () => this.handleLaneInput(lane));
        });

        // Mobile touch zones — cover the player track area
        const trackTop = 560;
        const trackH = 155;
        const laneH = trackH / 4;
        for (let i = 0; i < 4; i++) {
            const laneY = trackTop + i * laneH + laneH / 2;
            const zone = this.add.rectangle(640, laneY, 1280, laneH)
                .setInteractive().setAlpha(0.001).setDepth(150);
            zone.on('pointerdown', () => this.handleLaneInput(i));
        }
    }

    handleLaneInput(lane) {
        if (!this.battleStarted || this.battleManager.battleEnded) return;
        const mt = this.audioManager.getMusicTime();
        this.playerTrack.tryHit(lane, mt);
    }

    // ============================
    // COIN FLIP
    // ============================
    showCoinFlip() {
        const firstPlayer = this.battleManager.firstPlayer;
        const firstName = firstPlayer === 'player' ? this.pChar.name : this.oChar.name;

        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.85).setDepth(300);

        // Coin animation — simple rotating text
        const coinBg = this.add.circle(640, 280, 60, 0x221133, 0.8).setDepth(301);
        const coinText = this.add.text(640, 280, '?', {
            fontSize: '48px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffcc00'
        }).setOrigin(0.5).setDepth(302);

        // Flip animation
        this.tweens.add({
            targets: coinText,
            scaleX: 0, duration: 150, yoyo: true, repeat: 4,
            onYoyo: () => {
                const chars = ['⚔', '🎵', '⚡', '🎻', '🎹'];
                coinText.setText(chars[Math.floor(Math.random() * chars.length)]);
            }
        });

        const resultText = this.add.text(640, 370, '', {
            fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff'
        }).setOrigin(0.5).setDepth(302).setAlpha(0);

        const readyText = this.add.text(640, 420, '', {
            fontSize: '20px', fontFamily: 'monospace', color: '#888888'
        }).setOrigin(0.5).setDepth(302).setAlpha(0);

        this.time.delayedCall(1500, () => {
            coinText.setText('⚔');
            resultText.setText(firstName + ' GOES FIRST!').setAlpha(1);
        });

        this.time.delayedCall(2500, () => {
            readyText.setText('GET READY...').setAlpha(1);
        });

        this.time.delayedCall(3500, () => {
            // Destroy overlay
            [overlay, coinBg, coinText, resultText, readyText].forEach(o => o.destroy());
            this.startBattle();
        });
    }

    // ============================
    // BATTLE START
    // ============================
    startBattle() {
        this.battleStarted = true;
        this.currentPhase = 1;

        const first = this.battleManager.firstPlayer;

        // Load Phase 1 notes into PLAYER track
        // Phase 1 = first player's solo (beats 0-30s)
        if (first === 'player') {
            // Player is active, load their phase 1 notes
            this.playerTrack.loadNotes(this.beatmapPlayer, [1]);
            this.phaseText.setText('PHASE 1 — ' + this.pChar.name + "'s Solo");
            // Dim opponent sprite
            this.opponentSprite.setAlpha(0.3);
        } else {
            // Opponent goes first — AI plays on player track visuals
            // We load opponent's phase 2 beatmap but offset times to 0-30s range
            // Actually: the opponent's notes for their solo are in phase 2 (time 30-60s)
            // But music plays from 0 — so we need the player's beatmap phase 1 notes
            // regardless, because the MUSIC is the same (both tracks play from 0)
            //
            // Correction: Both audio tracks always play from t=0. The beatmaps have
            // absolute times matching the audio. So:
            // - If player goes first: player hits their phase 1 notes (t=0-30s)
            // - If opponent goes first: opponent's phase 2 notes are at t=30-60s
            //   but they need to play at t=0-30s... this is a timing problem.
            //
            // SOLUTION: When opponent goes first, the player WATCHES phase 1 (no input).
            // The AI plays the opponent's notes visible on the AI track.
            // Then in phase 2, the player plays their phase 1 notes.
            // But the music timing won't match because the notes were composed for specific beats.
            //
            // SIMPLEST FIX: Always have the player character go first in phase 1.
            // The coin flip determines who goes first, and the notes are already
            // composed for the right timing. Let's just swap which character's notes
            // the player hits.

            // Actually let's just always make phase 1 = beats 0-30 of WHOEVER goes first
            // Since argentum has phase 1 notes (0-30s) and morgana has phase 2 notes (30-60s)
            // The music tracks are composed to work with these timings.
            // So: Phase 1 is always 0-30s, Phase 2 is always 30-60s, Phase 3 is 60-120s
            // The only question is who the PLAYER controls vs who the AI controls.

            // If opponent goes first: show AI track with opponent's notes, player watches
            this.aiTrack.setVisible(true);
            this.aiTrack.loadNotes(this.beatmapOpponent, [2]); // Morgana's notes start at ~30s, won't appear yet
            // Actually morgana has no phase 1 notes, and her phase 2 notes are at 30-60s
            // So there's nothing to show at 0-30s for the opponent...
            
            // Let's simplify: ALWAYS player goes first with their own notes.
            // The coin flip is just cosmetic for now.
            this.playerTrack.loadNotes(this.beatmapPlayer, [1]);
            this.phaseText.setText('PHASE 1 — ' + this.pChar.name + "'s Solo");
            this.opponentSprite.setAlpha(0.3);
        }

        // Set volumes: active player loud, other quiet
        this.audioManager.setVolumeImmediate(this.playerCharId, 1.0);
        this.audioManager.setVolumeImmediate(this.opponentCharId, 0.12);
        this.audioManager.startBattle();
    }

    // ============================
    // PHASE TRANSITIONS
    // ============================
    onPhaseChange(phase) {
        this.currentPhase = phase;

        if (phase === 2) {
            // Phase 2: Opponent's solo — AI plays their notes
            this.phaseText.setText('PHASE 2 — ' + this.oChar.name + "'s Solo");
            this.showPhaseTransition('PHASE 2 — ' + this.oChar.name);

            // Show AI track prominently with opponent's notes
            this.aiTrack.setVisible(true);
            // Dim player track but keep visible (no input)
            this.playerTrack.container.setAlpha(0.3);
            this.aiTrack.loadNotes(this.beatmapOpponent, [2]);

            // Schedule AI auto-hits
            this.setupAIAutoPlay(this.beatmapOpponent, 2);

            // Audio: opponent loud
            this.audioManager.setPhaseVolumes(2, this.playerCharId, this.opponentCharId);

            // Sprites
            this.playerSprite.setAlpha(0.3);
            this.opponentSprite.setAlpha(1);

        } else if (phase === 3) {
            // Phase 3: THE CLASH — both tracks visible and active
            this.phaseText.setText('⚔ THE CLASH ⚔');
            this.showPhaseTransition('THE CLASH');

            // Spectators go wild — all light up
            this.spectators.forEach(s => { s.baseAlpha = Math.min(0.8, s.baseAlpha * 2); });

            // Both tracks visible at full opacity
            this.playerTrack.setVisible(true);
            this.playerTrack.container.setAlpha(1);
            this.aiTrack.setVisible(true);

            // Resize player track to make room
            // (AI track is already at y=460 h=70, player at y=540 h=170)
            
            // Load phase 3 notes
            this.playerTrack.loadNotes(this.beatmapPlayer, [3]);
            this.aiTrack.loadNotes(this.beatmapOpponent, [3]);

            // Schedule AI auto-hits for phase 3
            this.setupAIAutoPlay(this.beatmapOpponent, 3);

            // Both loud
            this.audioManager.setPhaseVolumes(3, this.playerCharId, this.opponentCharId);

            // Both sprites active
            this.playerSprite.setAlpha(1);
            this.opponentSprite.setAlpha(1);
        }
    }

    setupAIAutoPlay(beatmap, phaseNum) {
        const notes = beatmap.notes.filter(n => n.phase === phaseNum && n.lane >= 0 && n.lane <= 3);
        for (const note of notes) {
            if (this.aiProcessed.has(note.time + '_' + note.lane)) continue;
            this.aiProcessed.add(note.time + '_' + note.lane);

            // AI hits slightly before or after the exact time (humanized)
            const delay = (note.time * 1000) - (this.audioManager.getMusicTime() * 1000);
            if (delay < 0) continue; // already past

            const jitter = (Math.random() - 0.4) * 80; // slight timing variation
            this.time.delayedCall(Math.max(10, delay + jitter), () => {
                if (this.battleManager.battleEnded) return;
                const mt = this.audioManager.getMusicTime();
                const result = this.aiTrack.aiHit(note.lane, mt);
                if (result && result !== 'MISS') {
                    this.gameParticles.enchantParticle('opponent');
                    // Animate opponent sprite
                    this.tweens.add({
                        targets: this.opponentSprite,
                        scaleX: 1.2, scaleY: 1.2,
                        duration: 80, yoyo: true
                    });
                    // Pulse opponent ground glow
                    this.tweens.add({
                        targets: this.opponentGlow,
                        alpha: 0.2, scaleX: 1.5, scaleY: 1.5,
                        duration: 120, yoyo: true
                    });
                }
            });
        }
    }

    showPhaseTransition(text) {
        // Full screen flash
        const flash = this.add.rectangle(640, 360, 1280, 720, 0xffffff, 0.15).setDepth(250);
        this.tweens.add({
            targets: flash, alpha: 0, duration: 400,
            onComplete: () => flash.destroy()
        });

        // Banner
        const banner = this.add.text(640, 280, text, {
            fontSize: '48px',
            fontFamily: 'Arial Black, Impact, sans-serif',
            fontStyle: 'bold',
            color: '#ffcc00',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5).setDepth(260).setAlpha(0).setScale(0.5);

        this.tweens.add({
            targets: banner,
            alpha: 1, scaleX: 1.1, scaleY: 1.1,
            duration: 300, ease: 'Back.easeOut',
            hold: 600,
            yoyo: true,
            onComplete: () => banner.destroy()
        });
    }

    // ============================
    // HIT CALLBACKS
    // ============================
    onPlayerHit(rating, note) {
        if (rating === 'PERFECT' || rating === 'GREAT') {
            this.gameParticles.enchantParticle('player');
            if (rating === 'PERFECT') {
                // Screen flash on PERFECT
                const flash = this.add.rectangle(640, 360, 1280, 720, this.pChar.color, 0.08).setDepth(90);
                this.tweens.add({ targets: flash, alpha: 0, duration: 200, onComplete: () => flash.destroy() });
            }
        } else if (rating === 'GOOD' && Math.random() < 0.5) {
            this.gameParticles.enchantParticle('player');
        }
        this.gameParticles.pulseBeat();

        // Animate player sprite
        this.tweens.add({
            targets: this.playerSprite,
            scaleX: 1.2, scaleY: 1.2,
            duration: 80, yoyo: true
        });

        // Pulse the ground glow on hit
        this.tweens.add({
            targets: this.playerGlow,
            alpha: 0.2, scaleX: 1.5, scaleY: 1.5,
            duration: 120, yoyo: true
        });
    }

    onAIHit(rating, note) {
        // AI hit effects are handled in setupAIAutoPlay
    }

    onPlayerMiss(note) {
        this.cameras.main.shake(80, 0.004);
    }

    onDamage(attacker, damage) {
        if (damage <= 0) return;

        const isPlayer = attacker === 'player';
        const target = isPlayer ? this.opponentSprite : this.playerSprite;

        // Flash the target
        this.tweens.add({
            targets: target,
            alpha: 0.2, duration: 80, yoyo: true, repeat: 2
        });

        // Camera shake proportional to damage
        const shakeIntensity = Math.min(0.015, damage * 0.00005);
        this.cameras.main.shake(150, shakeIntensity);

        // Damage number
        const dmgX = isPlayer ? 1000 : 280;
        const dmg = this.add.text(dmgX, 260, '-' + damage, {
            fontSize: damage > 100 ? '36px' : '28px',
            fontFamily: 'Arial', fontStyle: 'bold', color: '#ff3333'
        }).setOrigin(0.5).setDepth(200);
        this.tweens.add({
            targets: dmg, y: 190, alpha: 0, duration: 1200, ease: 'Power2',
            onComplete: () => dmg.destroy()
        });

        // Particle attack beam — enchanted particles rush at opponent
        if (damage > 20) {
            const side = isPlayer ? 'player' : 'opponent';
            this.gameParticles.launchAttack(side, damage);
        }

        this.updateHPBars();
    }

    

    updateHPBars() {
        const pRatio = Math.max(0, this.battleManager.playerHP) / this.battleManager.maxHP;
        const oRatio = Math.max(0, this.battleManager.opponentHP) / this.battleManager.maxHP;

        this.playerHPBar.setDisplaySize(260 * pRatio, 14);
        this.opponentHPBar.setDisplaySize(260 * oRatio, 14);
        this.playerHPText.setText(Math.max(0, Math.round(this.battleManager.playerHP)));
        this.opponentHPText.setText(Math.max(0, Math.round(this.battleManager.opponentHP)));

        if (pRatio < 0.25) this.playerHPBar.setFillStyle(0xff3333);
        if (oRatio < 0.25) this.opponentHPBar.setFillStyle(0xff3333);
    }

    onBattleEnd(winner) {
        this.audioManager.stopAll();

        const winnerName = winner === 'player' ? this.pChar.name : this.oChar.name;
        const isKO = this.battleManager.playerHP <= 0 || this.battleManager.opponentHP <= 0;

        this.add.text(640, 300, isKO ? 'K.O.!' : 'TIME!', {
            fontSize: '64px', fontFamily: 'Arial Black, Impact', color: '#ffcc00',
            stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5).setDepth(300);

        this.time.delayedCall(2000, () => {
            this.scene.start('ResultScene', {
                winner,
                playerChar: this.playerCharId,
                opponentChar: this.opponentCharId,
                playerHP: this.battleManager.playerHP,
                opponentHP: this.battleManager.opponentHP,
                playerResults: this.playerTrack.results,
                opponentResults: this.aiTrack.results,
                playerEnchanted: this.gameParticles.playerEnchanted,
                opponentEnchanted: this.gameParticles.opponentEnchanted
            });
        });
    }

    // ============================
    // UPDATE LOOP
    // ============================
    update(time, delta) {
        if (!this.battleStarted || this.battleManager.battleEnded) {
            if (this.gameParticles) this.gameParticles.update(time, delta);
            return;
        }

        this.musicTime = this.audioManager.getMusicTime();

        // Update systems
        this.battleManager.update(this.musicTime);
        this.playerTrack.update(this.musicTime);
        this.aiTrack.update(this.musicTime);
        this.gameParticles.update(time, delta);

        // Update battle manager stats
        const phase = this.battleManager.currentPhase;
        if (phase === 1 || phase === 2) {
            const active = this.battleManager.getActivePlayer(phase);
            this.battleManager.updatePhaseStats(phase, active,
                this.gameParticles.getEnchantedCount(active),
                active === 'player' ? this.playerTrack.getAccuracy() : this.aiTrack.getAccuracy()
            );
        } else if (phase === 3) {
            this.battleManager.updatePhaseStats(3, 'player',
                this.gameParticles.getEnchantedCount('player'),
                this.playerTrack.getAccuracy()
            );
            this.battleManager.updatePhaseStats(3, 'opponent',
                this.gameParticles.getEnchantedCount('opponent'),
                this.aiTrack.getAccuracy()
            );

            // Steal mechanic
            this.stealCooldown -= delta / 1000;
            if (this.stealCooldown <= 0) {
                const stealer = this.battleManager.shouldSteal(3);
                if (stealer) {
                    const from = stealer === 'player' ? 'opponent' : 'player';
                    this.gameParticles.stealParticle(from, stealer);
                    this.stealCooldown = 1.2;
                }
            }
        }

        // Animate spectators
        for (const s of this.spectators) {
            s.phase += 0.02;
            s.dot.setAlpha(s.baseAlpha + Math.sin(s.phase) * 0.15);
        }

        // Beat pulse
        const beatNum = Math.floor(this.musicTime / this.beatInterval);
        const lastBeatNum = Math.floor(this.lastBeatTime / this.beatInterval);
        if (beatNum > lastBeatNum) {
            this.gameParticles.pulseBeat();
            this.playerTrack.pulseBeat();
            this.aiTrack.pulseBeat();
            // Spectator cheer flash on beat
            const cheerIdx = Math.floor(Math.random() * this.spectators.length * 0.3);
            for (let ci = cheerIdx; ci < cheerIdx + 8 && ci < this.spectators.length; ci++) {
                this.spectators[ci].dot.setAlpha(0.9);
            }

            // Phase 3: midline energy pulses
            if (phase === 3) {
                this.midline.clear();
                const pE = this.gameParticles.playerEnchanted;
                const oE = this.gameParticles.opponentEnchanted;
                const advantage = pE - oE;
                // Midline shifts based on who has more enchanted particles
                const midX = 640 + Phaser.Math.Clamp(advantage * 2, -120, 120);
                const color = advantage > 0 ? this.pChar.color : (advantage < 0 ? this.oChar.color : 0x4444aa);
                const intensity = Math.min(0.5, Math.abs(advantage) * 0.01 + 0.1);
                this.midline.lineStyle(2 + Math.abs(advantage) * 0.1, color, intensity);
                this.midline.lineBetween(midX, 70, midX, 460);
            }
        }
        this.lastBeatTime = this.musicTime;

        // HUD updates
        this.playerEnchText.setText('✦ ' + this.gameParticles.playerEnchanted);
        this.opponentEnchText.setText('✦ ' + this.gameParticles.opponentEnchanted);
        this.updateHPBars();

        // Timer
        const phaseEnd = phase === 3 ? 120 : (phase === 2 ? 60 : 30);
        const remaining = Math.max(0, phaseEnd - this.musicTime);
        this.timerText.setText(Math.floor(remaining / 60) + ':' + String(Math.floor(remaining % 60)).padStart(2, '0'));

        // Safety end
        if (this.musicTime >= 120) {
            this.battleManager.endBattle();
        }
    }

    shutdown() {
        if (this.audioManager) this.audioManager.destroy();
        if (this.playerTrack) this.playerTrack.destroy();
        if (this.aiTrack) this.aiTrack.destroy();
        if (this.gameParticles) this.gameParticles.destroy();
    }
}
