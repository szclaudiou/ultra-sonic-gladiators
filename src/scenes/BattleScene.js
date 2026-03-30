class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
    }

    init(data) {
        this.playerCharId = data.player || 'argentum';
        this.opponentCharId = data.opponent || 'morgana';
    }

    create() {
        const playerChar = CHARACTERS[this.playerCharId];
        const opponentChar = CHARACTERS[this.opponentCharId];

        // Arena background
        this.add.image(640, 360, 'arena-bg').setDisplaySize(1280, 720);
        this.add.rectangle(640, 360, 1280, 720, 0x000022, 0.3);

        // Midline divider
        const midline = this.add.graphics().setDepth(5);
        midline.lineStyle(1, 0x4444aa, 0.3);
        midline.lineBetween(640, 60, 640, 480);

        // Small character sprites (simple geometric shapes in the arena)
        this.playerSprite = this.createCharSprite(280, 300, playerChar.color);
        this.opponentSprite = this.createCharSprite(1000, 300, opponentChar.color);

        // --- HUD ---
        this.createHUD(playerChar, opponentChar);

        // --- Audio Manager ---
        this.audioManager = new AudioManager(this);
        this.audioManager.addTrack(this.playerCharId, playerChar.audio);
        this.audioManager.addTrack(this.opponentCharId, opponentChar.audio);

        // --- Battle Manager ---
        this.battleManager = new BattleManager(this, {
            playerChar: playerChar,
            opponentChar: opponentChar,
            onPhaseChange: (phase) => this.onPhaseChange(phase),
            onBattleEnd: (winner) => this.onBattleEnd(winner),
            onDamage: (attacker, damage) => this.onDamage(attacker, damage)
        });

        // --- Particle System ---
        this.gameParticles = new GameParticleSystem(this, {
            playerColor: playerChar.color,
            opponentColor: opponentChar.color,
            playerColorAlt: playerChar.colorAlt,
            opponentColorAlt: opponentChar.colorAlt,
            totalPerSide: 50
        });

        // --- Rhythm Engine(s) ---
        const beatmapPlayer = this.cache.json.get(playerChar.beatmap);
        const beatmapOpponent = this.cache.json.get(opponentChar.beatmap);

        // Primary rhythm track (always visible)
        this.rhythmEngine = new RhythmEngine(this, {
            trackY: 510,
            trackHeight: 200,
            hitZoneX: 150,
            noteSpeed: 500,
            color: playerChar.color,
            trackId: 'primary',
            onHit: (rating, note) => this.onPlayerHit(rating, note),
            onMiss: (note) => this.onPlayerMiss(note)
        });

        // Secondary track for Phase 3 (opponent's notes, auto-played)
        this.rhythmEngineSecondary = null;

        // Store beatmaps
        this.beatmapPlayer = beatmapPlayer;
        this.beatmapOpponent = beatmapOpponent;
        this.playerChar = playerChar;
        this.opponentChar = opponentChar;

        // --- Input ---
        this.setupInput();

        // --- Coin flip intro ---
        this.showCoinFlip();

        // State
        this.battleStarted = false;
        this.musicTime = 0;
        this.stealCooldown = 0;

        // Beat tracking for particle pulse
        this.lastBeatTime = 0;
        this.BPM = 130;
        this.beatInterval = 60 / this.BPM;

        // Opponent AI for Phase 3 auto-play
        this.opponentAutoResults = { perfect: 0, great: 0, good: 0, miss: 0, combo: 0, maxCombo: 0 };
    }

    createCharSprite(x, y, color) {
        const container = this.add.container(x, y).setDepth(10);

        // Simple geometric character: body + head
        const body = this.add.rectangle(0, 10, 20, 30, color, 0.8);
        const head = this.add.circle(0, -12, 10, color, 0.9);
        const glow = this.add.circle(0, 0, 30, color, 0.1);

        container.add([glow, body, head]);
        return container;
    }

    createHUD(playerChar, opponentChar) {
        const hud = this.add.container(0, 0).setDepth(200);

        // Player portrait (top-left)
        const pPortrait = this.add.image(45, 35, playerChar.portrait)
            .setDisplaySize(50, 50);
        const pCircle = this.add.graphics();
        pCircle.lineStyle(3, playerChar.color, 1);
        pCircle.strokeCircle(45, 35, 28);
        hud.add([pPortrait, pCircle]);

        // Player name
        hud.add(this.add.text(80, 10, playerChar.name, {
            fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: playerChar.colorHex
        }));

        // Player HP bar
        this.playerHPBg = this.add.rectangle(250, 38, 300, 16, 0x333333).setOrigin(0, 0.5);
        this.playerHPBar = this.add.rectangle(250, 38, 300, 16, playerChar.color).setOrigin(0, 0.5);
        this.playerHPText = this.add.text(405, 38, '1000', {
            fontSize: '12px', fontFamily: 'monospace', color: '#ffffff'
        }).setOrigin(0.5);
        hud.add([this.playerHPBg, this.playerHPBar, this.playerHPText]);

        // Opponent portrait (top-right)
        const oPortrait = this.add.image(1235, 35, opponentChar.portrait)
            .setDisplaySize(50, 50);
        const oCircle = this.add.graphics();
        oCircle.lineStyle(3, opponentChar.color, 1);
        oCircle.strokeCircle(1235, 35, 28);
        hud.add([oPortrait, oCircle]);

        // Opponent name
        hud.add(this.add.text(1200, 10, opponentChar.name, {
            fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: opponentChar.colorHex
        }).setOrigin(1, 0));

        // Opponent HP bar
        this.opponentHPBg = this.add.rectangle(730, 38, 300, 16, 0x333333).setOrigin(0, 0.5);
        this.opponentHPBar = this.add.rectangle(1030, 38, 300, 16, opponentChar.color).setOrigin(1, 0.5);
        this.opponentHPText = this.add.text(875, 38, '1000', {
            fontSize: '12px', fontFamily: 'monospace', color: '#ffffff'
        }).setOrigin(0.5);
        hud.add([this.opponentHPBg, this.opponentHPBar, this.opponentHPText]);

        // Phase indicator
        this.phaseText = this.add.text(640, 35, '', {
            fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffcc00'
        }).setOrigin(0.5).setDepth(200);

        // Enchanted particle counts
        this.playerEnchText = this.add.text(80, 55, 'Enchanted: 0/50', {
            fontSize: '11px', fontFamily: 'monospace', color: '#aaaacc'
        }).setDepth(200);
        this.opponentEnchText = this.add.text(1200, 55, 'Enchanted: 0/50', {
            fontSize: '11px', fontFamily: 'monospace', color: '#aaaacc'
        }).setOrigin(1, 0).setDepth(200);
    }

    setupInput() {
        // Keyboard: D, F, J, K
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
        this.keyJ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
        this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);

        this.keyD.on('down', () => this.handleLaneInput(0));
        this.keyF.on('down', () => this.handleLaneInput(1));
        this.keyJ.on('down', () => this.handleLaneInput(2));
        this.keyK.on('down', () => this.handleLaneInput(3));

        // Mobile touch zones
        const trackY = 510;
        const laneH = 50;
        for (let i = 0; i < 4; i++) {
            const zone = this.add.rectangle(640, trackY + i * laneH + laneH / 2, 1280, laneH)
                .setInteractive().setAlpha(0.001).setDepth(150);
            zone.on('pointerdown', () => this.handleLaneInput(i));
        }
    }

    handleLaneInput(lane) {
        if (!this.battleStarted || this.battleManager.battleEnded) return;

        const musicTime = this.audioManager.getMusicTime();
        this.rhythmEngine.tryHit(lane, musicTime);

        // Flash the lane
        this.flashLane(lane);
    }

    flashLane(lane) {
        const y = 510 + lane * 50 + 25;
        const flash = this.add.rectangle(150, y, 60, 45, 0xffffff, 0.3).setDepth(105);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 150,
            onComplete: () => flash.destroy()
        });
    }

    showCoinFlip() {
        const firstPlayer = this.battleManager.firstPlayer;
        const firstName = firstPlayer === 'player'
            ? this.playerChar.name
            : this.opponentChar.name;

        // Coin flip overlay
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.8).setDepth(300);
        const coinText = this.add.text(640, 300, 'COSMIC COIN FLIP...', {
            fontSize: '36px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffcc00'
        }).setOrigin(0.5).setDepth(301);

        const resultText = this.add.text(640, 380, firstName + ' GOES FIRST!', {
            fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff'
        }).setOrigin(0.5).setDepth(301).setAlpha(0);

        const readyText = this.add.text(640, 460, 'GET READY...', {
            fontSize: '22px', fontFamily: 'monospace', color: '#888888'
        }).setOrigin(0.5).setDepth(301).setAlpha(0);

        // Animate
        this.time.delayedCall(1000, () => {
            resultText.setAlpha(1);
        });

        this.time.delayedCall(2000, () => {
            readyText.setAlpha(1);
        });

        this.time.delayedCall(3000, () => {
            overlay.destroy();
            coinText.destroy();
            resultText.destroy();
            readyText.destroy();
            this.startBattle();
        });
    }

    startBattle() {
        this.battleStarted = true;

        // Determine which character's beatmap to load based on who goes first
        const firstPlayer = this.battleManager.firstPlayer;
        let phase1Beatmap, phase1Char;

        if (firstPlayer === 'player') {
            phase1Beatmap = this.beatmapPlayer;
            phase1Char = this.playerCharId;
        } else {
            phase1Beatmap = this.beatmapOpponent;
            phase1Char = this.opponentCharId;
        }

        // Load Phase 1 notes
        this.rhythmEngine.loadNotes(phase1Beatmap, [1]);

        // Set audio volumes for Phase 1
        this.audioManager.setPhaseVolumes(1, this.playerCharId, this.opponentCharId);
        this.audioManager.startBattle();

        this.phaseText.setText('PHASE 1 - ' + (firstPlayer === 'player' ? this.playerChar.name : this.opponentChar.name) + "'s Solo");
    }

    onPhaseChange(phase) {
        if (phase === 2) {
            const secondPlayer = this.battleManager.getActivePlayer(2);
            let phase2Beatmap;

            if (secondPlayer === 'player') {
                phase2Beatmap = this.beatmapPlayer;
            } else {
                phase2Beatmap = this.beatmapOpponent;
            }

            this.rhythmEngine.loadNotes(phase2Beatmap, [2]);
            this.audioManager.setPhaseVolumes(2, this.playerCharId, this.opponentCharId);
            this.phaseText.setText('PHASE 2 - ' + (secondPlayer === 'player' ? this.playerChar.name : this.opponentChar.name) + "'s Solo");

            // Phase transition flash
            this.showPhaseTransition('PHASE 2');

        } else if (phase === 3) {
            // Load both beatmaps for Phase 3
            this.rhythmEngine.loadNotes(this.beatmapPlayer, [3]);

            // Create secondary track visuals for opponent auto-play
            this.setupOpponentAutoPlay();

            this.audioManager.setPhaseVolumes(3, this.playerCharId, this.opponentCharId);
            this.phaseText.setText('PHASE 3 - THE CLASH');

            this.showPhaseTransition('THE CLASH');
        }
    }

    setupOpponentAutoPlay() {
        // Opponent plays automatically in Phase 3 with ~80% accuracy
        const opponentNotes = this.beatmapOpponent.notes.filter(n => n.phase === 3 && n.lane >= 0 && n.lane <= 3);
        this.opponentPhase3Notes = opponentNotes.map(n => ({ ...n, processed: false }));
    }

    updateOpponentAutoPlay(musicTime) {
        if (!this.opponentPhase3Notes) return;

        for (const note of this.opponentPhase3Notes) {
            if (note.processed) continue;
            if (musicTime >= note.time - 0.05) {
                note.processed = true;
                // ~80% chance of good hit
                const roll = Math.random();
                if (roll < 0.3) {
                    this.opponentAutoResults.perfect++;
                    this.gameParticles.enchantParticle('opponent');
                } else if (roll < 0.6) {
                    this.opponentAutoResults.great++;
                    this.gameParticles.enchantParticle('opponent');
                } else if (roll < 0.8) {
                    this.opponentAutoResults.good++;
                    if (Math.random() < 0.5) this.gameParticles.enchantParticle('opponent');
                } else {
                    this.opponentAutoResults.miss++;
                }
            }
        }
    }

    showPhaseTransition(text) {
        const banner = this.add.text(640, 280, text, {
            fontSize: '52px',
            fontFamily: 'Arial Black, Impact, sans-serif',
            fontStyle: 'bold',
            color: '#ffcc00',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(250).setAlpha(0);

        this.tweens.add({
            targets: banner,
            alpha: 1,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 300,
            yoyo: true,
            hold: 700,
            ease: 'Back.easeOut',
            onComplete: () => banner.destroy()
        });
    }

    onPlayerHit(rating, note) {
        const activePlayer = this.battleManager.getActivePlayer(this.battleManager.currentPhase);
        const side = (activePlayer === 'both') ? 'player' : activePlayer;

        if (rating === 'PERFECT' || rating === 'GREAT') {
            this.gameParticles.enchantParticle(side);
        } else if (rating === 'GOOD') {
            if (Math.random() < 0.5) this.gameParticles.enchantParticle(side);
        }

        this.gameParticles.pulseBeat();

        // Animate character sprite
        const sprite = side === 'player' ? this.playerSprite : this.opponentSprite;
        this.tweens.add({
            targets: sprite,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 100,
            yoyo: true
        });
    }

    onPlayerMiss(note) {
        // Camera shake on miss
        this.cameras.main.shake(100, 0.005);
    }

    onDamage(attacker, damage) {
        if (damage <= 0) return;

        // Flash the damaged side
        const target = attacker === 'player' ? this.opponentSprite : this.playerSprite;
        this.tweens.add({
            targets: target,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 2
        });

        // Damage number
        const x = attacker === 'player' ? 1000 : 280;
        const dmgText = this.add.text(x, 250, '-' + damage, {
            fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ff3333'
        }).setOrigin(0.5).setDepth(200);
        this.tweens.add({
            targets: dmgText,
            y: 180,
            alpha: 0,
            duration: 1200,
            ease: 'Power2',
            onComplete: () => dmgText.destroy()
        });

        this.updateHPBars();
    }

    updateHPBars() {
        const pRatio = this.battleManager.playerHP / this.battleManager.maxHP;
        const oRatio = this.battleManager.opponentHP / this.battleManager.maxHP;

        this.playerHPBar.setDisplaySize(300 * pRatio, 16);
        this.opponentHPBar.setDisplaySize(300 * oRatio, 16);
        this.playerHPText.setText(Math.max(0, this.battleManager.playerHP));
        this.opponentHPText.setText(Math.max(0, this.battleManager.opponentHP));

        // Color shift on low HP
        if (pRatio < 0.3) this.playerHPBar.setFillStyle(0xff3333);
        if (oRatio < 0.3) this.opponentHPBar.setFillStyle(0xff3333);
    }

    onBattleEnd(winner) {
        this.audioManager.stopAll();

        // Short delay then go to results
        this.time.delayedCall(1500, () => {
            this.scene.start('ResultScene', {
                winner: winner,
                playerChar: this.playerCharId,
                opponentChar: this.opponentCharId,
                playerHP: this.battleManager.playerHP,
                opponentHP: this.battleManager.opponentHP,
                playerResults: this.rhythmEngine.results,
                opponentResults: this.opponentAutoResults,
                playerEnchanted: this.gameParticles.playerEnchanted,
                opponentEnchanted: this.gameParticles.opponentEnchanted
            });
        });

        // Victory/KO text
        const winnerName = winner === 'player'
            ? CHARACTERS[this.playerCharId].name
            : CHARACTERS[this.opponentCharId].name;

        const isKO = this.battleManager.playerHP <= 0 || this.battleManager.opponentHP <= 0;
        const label = isKO ? 'K.O.!' : 'TIME!';

        this.add.text(640, 300, label, {
            fontSize: '72px',
            fontFamily: 'Arial Black, Impact, sans-serif',
            color: '#ffcc00',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(300);
    }

    update(time, delta) {
        if (!this.battleStarted || this.battleManager.battleEnded) {
            if (this.gameParticles) this.gameParticles.update(time, delta);
            return;
        }

        this.musicTime = this.audioManager.getMusicTime();

        // Update systems
        this.battleManager.update(this.musicTime);
        this.rhythmEngine.update(this.musicTime);
        this.gameParticles.update(time, delta);

        // Opponent auto-play in Phase 3
        if (this.battleManager.currentPhase === 3) {
            this.updateOpponentAutoPlay(this.musicTime);
        }

        // Update battle manager with enchanted counts
        const phase = this.battleManager.currentPhase;
        const activePlayer = this.battleManager.getActivePlayer(phase);

        if (phase === 1 || phase === 2) {
            const side = activePlayer;
            this.battleManager.updatePhaseStats(
                phase, side,
                this.gameParticles.getEnchantedCount(side),
                this.rhythmEngine.getAccuracy()
            );
        } else if (phase === 3) {
            this.battleManager.updatePhaseStats(3, 'player',
                this.gameParticles.getEnchantedCount('player'),
                this.rhythmEngine.getAccuracy()
            );
            this.battleManager.updatePhaseStats(3, 'opponent',
                this.gameParticles.getEnchantedCount('opponent'), 0
            );

            // Steal mechanic
            this.stealCooldown -= delta / 1000;
            if (this.stealCooldown <= 0) {
                const stealer = this.battleManager.shouldSteal(3);
                if (stealer) {
                    const from = stealer === 'player' ? 'opponent' : 'player';
                    this.gameParticles.stealParticle(from, stealer);
                    this.stealCooldown = 1.5;
                }
            }
        }

        // Beat pulse for particles
        const beatTime = this.musicTime / this.beatInterval;
        if (Math.floor(beatTime) > Math.floor(this.lastBeatTime / this.beatInterval * this.beatInterval / this.beatInterval)) {
            this.gameParticles.pulseBeat();
        }
        this.lastBeatTime = this.musicTime;

        // Update HUD
        this.playerEnchText.setText('Enchanted: ' + this.gameParticles.playerEnchanted + '/50');
        this.opponentEnchText.setText('Enchanted: ' + this.gameParticles.opponentEnchanted + '/50');
        this.updateHPBars();

        // Auto-end if music is done (safety)
        if (this.musicTime >= 120) {
            this.battleManager.endBattle();
        }
    }

    shutdown() {
        if (this.audioManager) this.audioManager.destroy();
        if (this.rhythmEngine) this.rhythmEngine.destroy();
        if (this.gameParticles) this.gameParticles.destroy();
    }
}
