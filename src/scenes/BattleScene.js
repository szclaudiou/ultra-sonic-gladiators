class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
    }

    init(data) {
        this.playerCharId = data.player || 'argentum';
        this.opponentCharId = data.opponent || 'morgana';
    }

    create() {
        const { width, height } = this.cameras.main;
        const cx = width / 2;
        const cy = height / 2;

        const pChar = CHARACTERS[this.playerCharId];
        const oChar = CHARACTERS[this.opponentCharId];
        this.pChar = pChar;
        this.oChar = oChar;

        // ===== ARENA BACKGROUND =====
        this.add.image(cx, cy, 'arena-bg').setDisplaySize(width, height);
        this.add.rectangle(cx, cy, width, height, 0x000011, 0.2);

        // Spectators — only in the UPPER background
        this.spectators = [];
        for (let i = 0; i < 50; i++) {
            const sx = width * 0.078 + Math.random() * width * 0.844;
            const sy = height * 0.042 + Math.random() * height * 0.194;
            const colors = [0x4444ff, 0xff4444, 0xffff44, 0x44ff44, 0xff44ff, 0x44ffff];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const dot = this.add.circle(sx, sy, 1 + Math.random() * 1.5, color, 0.2 + Math.random() * 0.3).setDepth(1);
            this.spectators.push({ dot, phase: Math.random() * Math.PI * 2, baseAlpha: 0.2 + Math.random() * 0.3 });
        }

        // Spotlight beams onto the floor
        const lights = this.add.graphics().setDepth(2).setAlpha(0.6);
        lights.fillStyle(0xffffff, 0.02);
        lights.fillTriangle(width * 0.219, 0, width * 0.266, 0, width * 0.258, height * 0.583);
        lights.fillStyle(0xffffff, 0.015);
        lights.fillTriangle(width * 0.484, 0, width * 0.516, 0, cx, height * 0.583);
        lights.fillStyle(0xffffff, 0.02);
        lights.fillTriangle(width * 0.734, 0, width * 0.781, 0, width * 0.742, height * 0.583);

        // Midline energy
        this.midline = this.add.graphics().setDepth(5);
        this.midline.lineStyle(1, 0x4444aa, 0.12);
        this.midline.lineBetween(cx, height * 0.139, cx, height * 0.556);

        // Characters standing ON the arena floor
        const floorY = height * 0.549;
        const spriteScale = 2.5;

        this.playerSprite = this.add.container(width * 0.234, floorY).setDepth(10);
        const pGlowAura = this.add.circle(0, 10, 45, pChar.color, 0.08);
        const pSpr = this.add.image(0, 0, pChar.sprite).setScale(spriteScale).setOrigin(0.5, 0.8);
        this.playerSprite.add([pGlowAura, pSpr]);

        this.opponentSprite = this.add.container(width * 0.766, floorY).setDepth(10);
        const oGlowAura = this.add.circle(0, 10, 50, oChar.color, 0.08);
        const oSpr = this.add.image(0, 0, oChar.sprite).setScale(spriteScale).setOrigin(0.5, 0.8);
        this.opponentSprite.add([oGlowAura, oSpr]);

        // Character base glow on the floor
        this.playerGlow = this.add.ellipse(width * 0.234, floorY + 15, 70, 20, pChar.color, 0.1).setDepth(3);
        this.opponentGlow = this.add.ellipse(width * 0.766, floorY + 15, 80, 22, oChar.color, 0.1).setDepth(3);

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
            trackY: height * 0.799, trackHeight: height * 0.188, hitZoneX: width * 0.125, noteSpeed: 480,
            color: pChar.color, colorHex: pChar.colorHex,
            depth: 100,
            onHit: (rating, note) => this.onPlayerHit(rating, note),
            onMiss: (note) => this.onPlayerMiss(note)
        });

        // AI opponent track
        this.aiTrack = new RhythmEngine(this, {
            trackY: height * 0.681, trackHeight: height * 0.111, hitZoneX: width * 0.125, noteSpeed: 380,
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
        this.aiNotes = [];
        this.aiProcessed = new Set();

        // ===== AUDIO UNLOCK =====
        if (this.sound.context && this.sound.context.state === 'suspended') {
            const unlockOverlay = this.add.rectangle(cx, cy, width, height, 0x000000, 0.9).setDepth(400).setInteractive();
            const unlockFontSize = Math.max(20, Math.min(36, width * 0.028)) + 'px';
            const unlockText = this.add.text(cx, cy - 20, '🎵 TAP TO START 🎵', {
                fontSize: unlockFontSize, fontFamily: 'Arial', fontStyle: 'bold', color: '#ffcc00'
            }).setOrigin(0.5).setDepth(401);
            const unlockSubSize = Math.max(12, Math.min(16, width * 0.0125)) + 'px';
            const unlockSub = this.add.text(cx, cy + 30, 'Audio requires user interaction', {
                fontSize: unlockSubSize, fontFamily: 'monospace', color: '#888899'
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
        const { width, height } = this.cameras.main;
        const hudDepth = 200;

        const portSize = Math.max(32, Math.min(48, width * 0.0375));
        const portX = width * 0.033;
        const portY = height * 0.044;
        const ringR = portSize * 0.5625;
        const nameSize = Math.max(10, Math.min(13, width * 0.01)) + 'px';
        const hpBarW = Math.max(140, Math.min(260, width * 0.203));
        const hpBarH = Math.max(8, Math.min(14, height * 0.019));
        const hpBarX = portX + portSize + width * 0.09;

        // ---- LEFT (Player) ----
        this.add.image(portX, portY, pChar.portrait).setDisplaySize(portSize, portSize).setDepth(hudDepth);
        const pRing = this.add.graphics().setDepth(hudDepth);
        pRing.lineStyle(2.5, pChar.color, 0.9);
        pRing.strokeCircle(portX, portY, ringR);

        this.add.text(portX + portSize * 0.75, portY - portSize * 0.46, pChar.name, {
            fontSize: nameSize, fontFamily: 'Arial', fontStyle: 'bold', color: pChar.colorHex
        }).setDepth(hudDepth);

        this.playerHPBg = this.add.rectangle(hpBarX, portY + 3, hpBarW, hpBarH, 0x222233).setOrigin(0, 0.5).setDepth(hudDepth);
        this.playerHPBar = this.add.rectangle(hpBarX, portY + 3, hpBarW, hpBarH, pChar.color).setOrigin(0, 0.5).setDepth(hudDepth + 1);
        this.playerHPText = this.add.text(hpBarX + hpBarW / 2, portY + 3, '1000', {
            fontSize: Math.max(9, Math.min(11, width * 0.0086)) + 'px', fontFamily: 'monospace', color: '#ffffff'
        }).setOrigin(0.5).setDepth(hudDepth + 2);

        this.playerEnchText = this.add.text(portX + portSize * 0.75, portY + portSize * 0.38, '✦ 0', {
            fontSize: Math.max(9, Math.min(11, width * 0.0086)) + 'px', fontFamily: 'monospace', color: pChar.colorHex
        }).setDepth(hudDepth).setAlpha(0.7);

        // Store HP bar width for updateHPBars
        this._hpBarW = hpBarW;
        this._hpBarH = hpBarH;

        // ---- RIGHT (Opponent) ----
        const oPortX = width - portX;
        this.add.image(oPortX, portY, oChar.portrait).setDisplaySize(portSize, portSize).setDepth(hudDepth);
        const oRing = this.add.graphics().setDepth(hudDepth);
        oRing.lineStyle(2.5, oChar.color, 0.9);
        oRing.strokeCircle(oPortX, portY, ringR);

        this.add.text(oPortX - portSize * 0.75, portY - portSize * 0.46, oChar.name, {
            fontSize: nameSize, fontFamily: 'Arial', fontStyle: 'bold', color: oChar.colorHex
        }).setOrigin(1, 0).setDepth(hudDepth);

        const oHpBarX = oPortX - portSize * 0.75 - hpBarW - width * 0.02;
        this.opponentHPBg = this.add.rectangle(oHpBarX, portY + 3, hpBarW, hpBarH, 0x222233).setOrigin(0, 0.5).setDepth(hudDepth);
        this.opponentHPBar = this.add.rectangle(oHpBarX + hpBarW, portY + 3, hpBarW, hpBarH, oChar.color).setOrigin(1, 0.5).setDepth(hudDepth + 1);
        this.opponentHPText = this.add.text(oHpBarX + hpBarW / 2, portY + 3, '1000', {
            fontSize: Math.max(9, Math.min(11, width * 0.0086)) + 'px', fontFamily: 'monospace', color: '#ffffff'
        }).setOrigin(0.5).setDepth(hudDepth + 2);

        this.opponentEnchText = this.add.text(oPortX - portSize * 0.75, portY + portSize * 0.38, '✦ 0', {
            fontSize: Math.max(9, Math.min(11, width * 0.0086)) + 'px', fontFamily: 'monospace', color: oChar.colorHex
        }).setOrigin(1, 0).setDepth(hudDepth).setAlpha(0.7);

        // ---- CENTER: Phase indicator ----
        const cx = width / 2;
        const phaseSize = Math.max(12, Math.min(18, width * 0.014)) + 'px';
        this.phaseText = this.add.text(cx, portY, '', {
            fontSize: phaseSize, fontFamily: 'Arial', fontStyle: 'bold', color: '#ffcc00'
        }).setOrigin(0.5).setDepth(hudDepth);

        const timerSize = Math.max(9, Math.min(12, width * 0.0094)) + 'px';
        this.timerText = this.add.text(cx, portY + 22, '', {
            fontSize: timerSize, fontFamily: 'monospace', color: '#888899'
        }).setOrigin(0.5).setDepth(hudDepth);
    }

    setupInput() {
        const { width, height } = this.cameras.main;

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

        // Mobile touch zones — cover the player track area (dynamic)
        const trackTop = height * 0.778;
        const trackH = height * 0.215;
        const laneH = trackH / 4;
        for (let i = 0; i < 4; i++) {
            const laneY = trackTop + i * laneH + laneH / 2;
            const zone = this.add.rectangle(width / 2, laneY, width, laneH)
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
        const { width, height } = this.cameras.main;
        const cx = width / 2;
        const cy = height / 2;
        const firstPlayer = this.battleManager.firstPlayer;
        const firstName = firstPlayer === 'player' ? this.pChar.name : this.oChar.name;

        const overlay = this.add.rectangle(cx, cy, width, height, 0x000000, 0.85).setDepth(300);

        const coinBg = this.add.circle(cx, height * 0.389, 60, 0x221133, 0.8).setDepth(301);
        const coinFontSize = Math.max(28, Math.min(48, width * 0.0375)) + 'px';
        const coinText = this.add.text(cx, height * 0.389, '?', {
            fontSize: coinFontSize, fontFamily: 'Arial', fontStyle: 'bold', color: '#ffcc00'
        }).setOrigin(0.5).setDepth(302);

        this.tweens.add({
            targets: coinText,
            scaleX: 0, duration: 150, yoyo: true, repeat: 4,
            onYoyo: () => {
                const chars = ['⚔', '🎵', '⚡', '🎻', '🎹'];
                coinText.setText(chars[Math.floor(Math.random() * chars.length)]);
            }
        });

        const resultFontSize = Math.max(18, Math.min(28, width * 0.022)) + 'px';
        const resultText = this.add.text(cx, height * 0.514, '', {
            fontSize: resultFontSize, fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff'
        }).setOrigin(0.5).setDepth(302).setAlpha(0);

        const readyFontSize = Math.max(14, Math.min(20, width * 0.0156)) + 'px';
        const readyText = this.add.text(cx, height * 0.583, '', {
            fontSize: readyFontSize, fontFamily: 'monospace', color: '#888888'
        }).setOrigin(0.5).setDepth(302).setAlpha(0);

        this.time.delayedCall(1500, () => {
            coinText.setText('⚔');
            resultText.setText(firstName + ' GOES FIRST!').setAlpha(1);
        });

        this.time.delayedCall(2500, () => {
            readyText.setText('GET READY...').setAlpha(1);
        });

        this.time.delayedCall(3500, () => {
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

        if (first === 'player') {
            this.playerTrack.loadNotes(this.beatmapPlayer, [1]);
            this.phaseText.setText('PHASE 1 — ' + this.pChar.name + "'s Solo");
            this.opponentSprite.setAlpha(0.3);
        } else {
            this.aiTrack.setVisible(true);
            this.aiTrack.loadNotes(this.beatmapOpponent, [2]);
            this.playerTrack.loadNotes(this.beatmapPlayer, [1]);
            this.phaseText.setText('PHASE 1 — ' + this.pChar.name + "'s Solo");
            this.opponentSprite.setAlpha(0.3);
        }

        this.audioManager.setVolumeImmediate(this.playerCharId, 1.0);
        this.audioManager.setVolumeImmediate(this.opponentCharId, 0.12);
        this.audioManager.startBattle();
    }

    // ============================
    // PHASE TRANSITIONS
    // ============================
    onPhaseChange(phase) {
        this.currentPhase = phase;
        this.aiProcessed.clear();

        if (phase === 2) {
            this.phaseText.setText('PHASE 2 — ' + this.oChar.name + "'s Solo");
            this.showPhaseTransition('PHASE 2 — ' + this.oChar.name);

            this.aiTrack.setVisible(true);
            this.playerTrack.container.setAlpha(0.3);
            this.aiTrack.loadNotes(this.beatmapOpponent, [2]);

            this.setupAIAutoPlay(this.beatmapOpponent, 2);
            this.audioManager.setPhaseVolumes(2, this.playerCharId, this.opponentCharId);

            this.playerSprite.setAlpha(0.3);
            this.opponentSprite.setAlpha(1);

        } else if (phase === 3) {
            this.phaseText.setText('⚔ THE CLASH ⚔');
            this.showPhaseTransition('THE CLASH');

            this.spectators.forEach(s => { s.baseAlpha = Math.min(0.8, s.baseAlpha * 2); });

            this.playerTrack.setVisible(true);
            this.playerTrack.container.setAlpha(1);
            this.aiTrack.setVisible(true);

            this.playerTrack.loadNotes(this.beatmapPlayer, [3]);
            this.aiTrack.loadNotes(this.beatmapOpponent, [3]);

            this.setupAIAutoPlay(this.beatmapOpponent, 3);
            this.audioManager.setPhaseVolumes(3, this.playerCharId, this.opponentCharId);

            this.playerSprite.setAlpha(1);
            this.opponentSprite.setAlpha(1);
        }
    }

    setupAIAutoPlay(beatmap, phaseNum) {
        const notes = beatmap.notes.filter(n => n.phase === phaseNum && n.lane >= 0 && n.lane <= 3);
        for (const note of notes) {
            if (this.aiProcessed.has(note.time + '_' + note.lane)) continue;
            this.aiProcessed.add(note.time + '_' + note.lane);

            const delay = (note.time * 1000) - (this.audioManager.getMusicTime() * 1000);
            if (delay < 0) continue;

            const jitter = (Math.random() - 0.4) * 80;
            this.time.delayedCall(Math.max(10, delay + jitter), () => {
                if (this.battleManager.battleEnded) return;
                const mt = this.audioManager.getMusicTime();
                const result = this.aiTrack.aiHit(note.lane, mt);
                if (result && result !== 'MISS') {
                    this.gameParticles.enchantParticle('opponent');
                    this.tweens.add({
                        targets: this.opponentSprite,
                        scaleX: 1.2, scaleY: 1.2,
                        duration: 80, yoyo: true
                    });
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
        const { width, height } = this.cameras.main;
        const cx = width / 2;
        const cy = height / 2;

        const flash = this.add.rectangle(cx, cy, width, height, 0xffffff, 0.15).setDepth(250);
        this.tweens.add({
            targets: flash, alpha: 0, duration: 400,
            onComplete: () => flash.destroy()
        });

        const bannerSize = Math.max(24, Math.min(48, width * 0.0375)) + 'px';
        const banner = this.add.text(cx, height * 0.389, text, {
            fontSize: bannerSize,
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
        const { width, height } = this.cameras.main;

        if (rating === 'PERFECT' || rating === 'GREAT') {
            this.gameParticles.enchantParticle('player');
            if (rating === 'PERFECT') {
                const flash = this.add.rectangle(width / 2, height / 2, width, height, this.pChar.color, 0.08).setDepth(90);
                this.tweens.add({ targets: flash, alpha: 0, duration: 200, onComplete: () => flash.destroy() });
            }
        } else if (rating === 'GOOD' && Math.random() < 0.5) {
            this.gameParticles.enchantParticle('player');
        }
        this.gameParticles.pulseBeat();

        this.tweens.add({
            targets: this.playerSprite,
            scaleX: 1.2, scaleY: 1.2,
            duration: 80, yoyo: true
        });

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

        const { width, height } = this.cameras.main;
        const isPlayer = attacker === 'player';
        const target = isPlayer ? this.opponentSprite : this.playerSprite;

        this.tweens.add({
            targets: target,
            alpha: 0.2, duration: 80, yoyo: true, repeat: 2
        });

        const shakeIntensity = Math.min(0.015, damage * 0.00005);
        this.cameras.main.shake(150, shakeIntensity);

        // Damage number — positioned relative to character sprites
        const dmgX = isPlayer ? width * 0.781 : width * 0.219;
        const dmgFontSize = (damage > 100 ? Math.max(24, Math.min(36, width * 0.028)) : Math.max(18, Math.min(28, width * 0.022))) + 'px';
        const dmg = this.add.text(dmgX, height * 0.361, '-' + damage, {
            fontSize: dmgFontSize,
            fontFamily: 'Arial', fontStyle: 'bold', color: '#ff3333'
        }).setOrigin(0.5).setDepth(200);
        this.tweens.add({
            targets: dmg, y: height * 0.264, alpha: 0, duration: 1200, ease: 'Power2',
            onComplete: () => dmg.destroy()
        });

        if (damage > 20) {
            const side = isPlayer ? 'player' : 'opponent';
            this.gameParticles.launchAttack(side, damage);
        }

        this.updateHPBars();
    }

    updateHPBars() {
        const pRatio = Math.max(0, this.battleManager.playerHP) / this.battleManager.maxHP;
        const oRatio = Math.max(0, this.battleManager.opponentHP) / this.battleManager.maxHP;

        this.playerHPBar.setDisplaySize(this._hpBarW * pRatio, this._hpBarH);
        this.opponentHPBar.setDisplaySize(this._hpBarW * oRatio, this._hpBarH);
        this.playerHPText.setText(Math.max(0, Math.round(this.battleManager.playerHP)));
        this.opponentHPText.setText(Math.max(0, Math.round(this.battleManager.opponentHP)));

        if (pRatio < 0.25) this.playerHPBar.setFillStyle(0xff3333);
        if (oRatio < 0.25) this.opponentHPBar.setFillStyle(0xff3333);
    }

    onBattleEnd(winner) {
        const { width, height } = this.cameras.main;
        this.audioManager.stopAll();

        const winnerName = winner === 'player' ? this.pChar.name : this.oChar.name;
        const isKO = this.battleManager.playerHP <= 0 || this.battleManager.opponentHP <= 0;

        const endFontSize = Math.max(32, Math.min(64, width * 0.05)) + 'px';
        this.add.text(width / 2, height * 0.417, isKO ? 'K.O.!' : 'TIME!', {
            fontSize: endFontSize, fontFamily: 'Arial Black, Impact', color: '#ffcc00',
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

        const { width, height } = this.cameras.main;
        const cx = width / 2;

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
            const cheerIdx = Math.floor(Math.random() * this.spectators.length * 0.3);
            for (let ci = cheerIdx; ci < cheerIdx + 8 && ci < this.spectators.length; ci++) {
                this.spectators[ci].dot.setAlpha(0.9);
            }

            if (phase === 3) {
                this.midline.clear();
                const pE = this.gameParticles.playerEnchanted;
                const oE = this.gameParticles.opponentEnchanted;
                const advantage = pE - oE;
                const midX = cx + Phaser.Math.Clamp(advantage * 2, -width * 0.094, width * 0.094);
                const color = advantage > 0 ? this.pChar.color : (advantage < 0 ? this.oChar.color : 0x4444aa);
                const intensity = Math.min(0.5, Math.abs(advantage) * 0.01 + 0.1);
                this.midline.lineStyle(2 + Math.abs(advantage) * 0.1, color, intensity);
                this.midline.lineBetween(midX, height * 0.139, midX, height * 0.556);
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

        this.spectators = null;

        if (this.aiNotes) this.aiNotes.length = 0;
        if (this.aiProcessed) this.aiProcessed.clear();

        if (this.input && this.input.keyboard) {
            this.input.keyboard.removeAllKeys();
        }
    }
}
