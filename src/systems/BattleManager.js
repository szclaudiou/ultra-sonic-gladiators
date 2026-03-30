class BattleManager {
    constructor(scene, config) {
        this.scene = scene;
        this.playerChar = config.playerChar;
        this.opponentChar = config.opponentChar;

        // Coin flip (cosmetic for now — player always plays phase 1)
        this.firstPlayer = Math.random() < 0.5 ? 'player' : 'opponent';

        this.playerHP = 1000;
        this.opponentHP = 1000;
        this.maxHP = 1000;

        this.currentPhase = 0;
        this.battleEnded = false;

        // Phase timing (absolute music time in seconds)
        this.PHASE1_END = 30;
        this.PHASE2_END = 60;
        this.PHASE3_END = 120;

        this.phaseStats = {
            1: { enchanted: 0, accuracy: 0 },
            2: { enchanted: 0, accuracy: 0 },
            3: { playerEnchanted: 0, opponentEnchanted: 0, playerAccuracy: 0, opponentAccuracy: 0 }
        };

        this.callbacks = {
            onPhaseChange: config.onPhaseChange || (() => {}),
            onBattleEnd: config.onBattleEnd || (() => {}),
            onDamage: config.onDamage || (() => {})
        };

        this.lastDamageTick = 0;
        this.phase1DamageApplied = false;
        this.phase2DamageApplied = false;
    }

    getActivePlayer(phase) {
        // Phase 1: player plays (their notes are at 0-30s)
        // Phase 2: opponent plays (their notes are at 30-60s)
        // Phase 3: both
        if (phase === 1) return 'player';
        if (phase === 2) return 'opponent';
        return 'both';
    }

    update(musicTime) {
        if (this.battleEnded) return;

        let newPhase = 0;
        if (musicTime >= 60) newPhase = 3;
        else if (musicTime >= 30) newPhase = 2;
        else if (musicTime >= 0) newPhase = 1;

        if (newPhase !== this.currentPhase && newPhase > 0) {
            // Apply end-of-phase damage
            if (this.currentPhase === 1 && !this.phase1DamageApplied) {
                this.applyPhaseDamage(1);
                this.phase1DamageApplied = true;
            }
            if (this.currentPhase === 2 && !this.phase2DamageApplied) {
                this.applyPhaseDamage(2);
                this.phase2DamageApplied = true;
            }

            this.currentPhase = newPhase;
            this.callbacks.onPhaseChange(newPhase);
        }

        // Phase 3 continuous damage ticks (every 3 seconds)
        if (this.currentPhase === 3 && musicTime - this.lastDamageTick > 3) {
            this.lastDamageTick = musicTime;
            this.applyPhase3Tick();
        }

        // End at 120s
        if (musicTime >= this.PHASE3_END && !this.battleEnded) {
            this.endBattle();
        }
    }

    applyPhaseDamage(phase) {
        const stats = this.phaseStats[phase];
        const accuracy = Math.max(stats.accuracy, 0.1);
        const damage = Math.floor(stats.enchanted * 5 * accuracy);
        const active = this.getActivePlayer(phase);

        if (damage <= 0) return;

        if (active === 'player') {
            this.opponentHP = Math.max(0, this.opponentHP - damage);
            this.callbacks.onDamage('player', damage);
        } else {
            this.playerHP = Math.max(0, this.playerHP - damage);
            this.callbacks.onDamage('opponent', damage);
        }

        if (this.playerHP <= 0 || this.opponentHP <= 0) {
            this.endBattle();
        }
    }

    applyPhase3Tick() {
        const stats = this.phaseStats[3];
        const diff = stats.playerEnchanted - stats.opponentEnchanted;
        const tickDmg = Math.floor(Math.abs(diff) * 2.5);
        if (tickDmg <= 0) return;

        if (diff > 0) {
            this.opponentHP = Math.max(0, this.opponentHP - tickDmg);
            this.callbacks.onDamage('player', tickDmg);
        } else {
            this.playerHP = Math.max(0, this.playerHP - tickDmg);
            this.callbacks.onDamage('opponent', tickDmg);
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
                this.phaseStats[3].playerAccuracy = accuracy;
            } else {
                this.phaseStats[3].opponentEnchanted = enchantedCount;
                this.phaseStats[3].opponentAccuracy = accuracy;
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
        const pE = this.phaseStats[3].playerEnchanted;
        const oE = this.phaseStats[3].opponentEnchanted;
        const total = pE + oE;
        if (total < 5) return null;

        if (pE > oE * 1.15 && pE - oE > 3) return 'player';
        if (oE > pE * 1.15 && oE - pE > 3) return 'opponent';
        return null;
    }
}
