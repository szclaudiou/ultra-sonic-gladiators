class BattleManager {
    constructor(scene, config) {
        this.scene = scene;
        this.playerChar = config.playerChar;
        this.opponentChar = config.opponentChar;

        // Decide who goes first via coin flip
        this.firstPlayer = Math.random() < 0.5 ? 'player' : 'opponent';

        this.playerHP = 1000;
        this.opponentHP = 1000;
        this.maxHP = 1000;

        this.currentPhase = 0; // 0=not started, 1, 2, 3
        this.phaseStartTime = 0;
        this.battleEnded = false;

        // Phase timing (in seconds from music start)
        this.PHASE1_START = 0;
        this.PHASE1_END = 30;
        this.PHASE2_START = 30;
        this.PHASE2_END = 60;
        this.PHASE3_START = 60;
        this.PHASE3_END = 120;

        // Stats per phase
        this.phaseStats = {
            1: { enchanted: 0, accuracy: 0 },
            2: { enchanted: 0, accuracy: 0 },
            3: { playerEnchanted: 0, opponentEnchanted: 0 }
        };

        this.callbacks = {
            onPhaseChange: config.onPhaseChange || (() => {}),
            onBattleEnd: config.onBattleEnd || (() => {}),
            onDamage: config.onDamage || (() => {})
        };

        this.lastDamageTick = 0;
    }

    getActivePlayer(phase) {
        if (phase === 1) return this.firstPlayer;
        if (phase === 2) return this.firstPlayer === 'player' ? 'opponent' : 'player';
        return 'both';
    }

    update(musicTime) {
        if (this.battleEnded) return;

        let newPhase = 0;
        if (musicTime >= this.PHASE3_START) {
            newPhase = 3;
        } else if (musicTime >= this.PHASE2_START) {
            newPhase = 2;
        } else if (musicTime >= this.PHASE1_START) {
            newPhase = 1;
        }

        if (newPhase !== this.currentPhase && newPhase > 0) {
            // End of previous phase damage
            if (this.currentPhase === 1 || this.currentPhase === 2) {
                this.applyPhaseDamage(this.currentPhase);
            }
            this.currentPhase = newPhase;
            this.callbacks.onPhaseChange(newPhase);
        }

        // Phase 3 continuous damage ticks
        if (this.currentPhase === 3 && musicTime - this.lastDamageTick > 2) {
            this.lastDamageTick = musicTime;
            this.applyPhase3Tick();
        }

        // End of battle
        if (musicTime >= this.PHASE3_END && !this.battleEnded) {
            this.endBattle();
        }
    }

    applyPhaseDamage(phase) {
        const stats = this.phaseStats[phase];
        const damage = Math.floor(stats.enchanted * 5 * Math.max(stats.accuracy, 0.1));
        const activePlayer = this.getActivePlayer(phase);

        if (activePlayer === 'player') {
            this.opponentHP = Math.max(0, this.opponentHP - damage);
        } else {
            this.playerHP = Math.max(0, this.playerHP - damage);
        }
        this.callbacks.onDamage(activePlayer, damage);

        if (this.playerHP <= 0 || this.opponentHP <= 0) {
            this.endBattle();
        }
    }

    applyPhase3Tick() {
        const playerAdv = this.phaseStats[3].playerEnchanted - this.phaseStats[3].opponentEnchanted;
        const tickDamage = Math.floor(Math.abs(playerAdv) * 2);
        if (tickDamage <= 0) return;

        if (playerAdv > 0) {
            this.opponentHP = Math.max(0, this.opponentHP - tickDamage);
            this.callbacks.onDamage('player', tickDamage);
        } else {
            this.playerHP = Math.max(0, this.playerHP - tickDamage);
            this.callbacks.onDamage('opponent', tickDamage);
        }

        if (this.playerHP <= 0 || this.opponentHP <= 0) {
            this.endBattle();
        }
    }

    updatePhaseStats(phase, side, enchantedCount, accuracy) {
        if (phase === 1 || phase === 2) {
            this.phaseStats[phase].enchanted = enchantedCount;
            this.phaseStats[phase].accuracy = accuracy;
        } else if (phase === 3) {
            if (side === 'player') {
                this.phaseStats[3].playerEnchanted = enchantedCount;
            } else {
                this.phaseStats[3].opponentEnchanted = enchantedCount;
            }
        }
    }

    endBattle() {
        if (this.battleEnded) return;
        this.battleEnded = true;

        let winner;
        if (this.playerHP <= 0) winner = 'opponent';
        else if (this.opponentHP <= 0) winner = 'player';
        else winner = this.playerHP >= this.opponentHP ? 'player' : 'opponent';

        this.callbacks.onBattleEnd(winner);
    }

    shouldSteal(phase) {
        if (phase !== 3) return null;
        const pEnch = this.phaseStats[3].playerEnchanted;
        const oEnch = this.phaseStats[3].opponentEnchanted;
        const total = pEnch + oEnch;
        if (total === 0) return null;

        if (pEnch > oEnch * 1.15 && pEnch - oEnch > 3) return 'player';
        if (oEnch > pEnch * 1.15 && oEnch - pEnch > 3) return 'opponent';
        return null;
    }
}
