class GameParticleSystem {
    constructor(scene, config) {
        this.scene = scene;
        this.particles = [];
        this.playerColor = config.playerColor || 0xC0C0C0;
        this.opponentColor = config.opponentColor || 0x8B00FF;
        this.playerColorAlt = config.playerColorAlt || 0xE8E8FF;
        this.opponentColorAlt = config.opponentColorAlt || 0x4B0082;
        this.totalPerSide = config.totalPerSide || 90;

        // Arena bounds — taller now that tracks are more compact
        this.bounds = { x: 30, y: 70, width: 1220, height: 400 };
        this.midX = this.bounds.x + this.bounds.width / 2;

        this.playerEnchanted = 0;
        this.opponentEnchanted = 0;
        this.beatPulse = 0;
        this.flowTime = 0;

        // Flow formation centers
        this.playerCenter = { x: 240, y: 280 };
        this.opponentCenter = { x: 1040, y: 280 };

        this.container = scene.add.container(0, 0).setDepth(50);
        this.init();
    }

    init() {
        for (let i = 0; i < this.totalPerSide; i++) {
            this.createParticle('player', i);
        }
        for (let i = 0; i < this.totalPerSide; i++) {
            this.createParticle('opponent', i);
        }
    }

    createParticle(side, index) {
        const isLeft = side === 'player';
        const center = isLeft ? this.playerCenter : this.opponentCenter;
        const spread = 160;
        const x = center.x + (Math.random() - 0.5) * spread;
        const y = center.y + (Math.random() - 0.5) * spread * 0.9;

        const dot = this.scene.add.circle(x, y, 3.5, 0x667788, 0.35).setDepth(52);
        this.container.add(dot);
        const halo = this.scene.add.circle(x, y, 10, 0x667788, 0).setDepth(51);
        this.container.add(halo);

        const particle = {
            dot, halo, side, enchanted: false,
            x, y, homeX: x, homeY: y,
            formX: x, formY: y, // formation target
            phase: Math.random() * Math.PI * 2,
            speed: 0.3 + Math.random() * 0.7,
            index
        };

        this.particles.push(particle);
        return particle;
    }

    // =========================================
    // FORMATION PATTERNS
    // =========================================

    // Argentum (player): heroic arc — particles form a rising crescent/wave
    getPlayerFormation(index, totalEnchanted, time) {
        const center = this.playerCenter;
        const i = index % totalEnchanted;
        const t = i / Math.max(1, totalEnchanted - 1); // 0 to 1

        // Wave/crescent formation
        const angle = -Math.PI * 0.4 + t * Math.PI * 0.8; // arc from -72° to +72°
        const radius = 50 + totalEnchanted * 0.8;
        const wave = Math.sin(time * 2 + t * Math.PI * 3) * 12;

        return {
            x: center.x + Math.cos(angle) * radius + wave,
            y: center.y + Math.sin(angle) * radius * 0.6 - 20
        };
    }

    // Morgana (opponent): web pattern — particles form concentric rings connected by threads
    getOpponentFormation(index, totalEnchanted, time) {
        const center = this.opponentCenter;
        const i = index % totalEnchanted;

        // Concentric web rings
        const ring = Math.floor(i / 8); // 8 particles per ring
        const pos = i % 8;
        const angle = (pos / 8) * Math.PI * 2 + time * 0.5 + ring * 0.4;
        const radius = 25 + ring * 22;
        const pulse = Math.sin(time * 1.5 + ring) * 6;

        return {
            x: center.x + Math.cos(angle) * (radius + pulse),
            y: center.y + Math.sin(angle) * (radius + pulse) * 0.7
        };
    }

    updateFormations(time) {
        let playerIdx = 0;
        let opponentIdx = 0;

        for (const p of this.particles) {
            if (!p.enchanted) continue;

            if (p.side === 'player') {
                const form = this.getPlayerFormation(playerIdx, this.playerEnchanted, time);
                p.formX = form.x;
                p.formY = form.y;
                playerIdx++;
            } else {
                const form = this.getOpponentFormation(opponentIdx, this.opponentEnchanted, time);
                p.formX = form.x;
                p.formY = form.y;
                opponentIdx++;
            }
        }
    }

    enchantParticle(side) {
        const candidates = this.particles.filter(p => p.side === side && !p.enchanted);
        if (candidates.length === 0) return;

        const p = candidates[Math.floor(Math.random() * candidates.length)];
        p.enchanted = true;

        const color = side === 'player' ? this.playerColor : this.opponentColor;
        const colorAlt = side === 'player' ? this.playerColorAlt : this.opponentColorAlt;

        p.dot.setFillStyle(color, 1);
        p.dot.setRadius(4.5);
        p.halo.setFillStyle(colorAlt, 0.2);
        p.halo.setRadius(15);

        if (side === 'player') this.playerEnchanted++;
        else this.opponentEnchanted++;

        this.spawnSparkle(p.x, p.y, color, 5);
    }

    disenchantParticle(side) {
        const candidates = this.particles.filter(p => p.side === side && p.enchanted);
        if (candidates.length === 0) return;

        const p = candidates[Math.floor(Math.random() * candidates.length)];
        p.enchanted = false;
        p.dot.setFillStyle(0x667788, 0.35);
        p.dot.setRadius(3.5);
        p.halo.setAlpha(0);

        if (side === 'player') this.playerEnchanted = Math.max(0, this.playerEnchanted - 1);
        else this.opponentEnchanted = Math.max(0, this.opponentEnchanted - 1);
    }

    stealParticle(fromSide, toSide) {
        const candidates = this.particles.filter(p => p.side === fromSide && p.enchanted);
        if (candidates.length === 0) return;

        const p = candidates[Math.floor(Math.random() * candidates.length)];
        const newColor = toSide === 'player' ? this.playerColor : this.opponentColor;
        const newColorAlt = toSide === 'player' ? this.playerColorAlt : this.opponentColorAlt;
        const newCenter = toSide === 'player' ? this.playerCenter : this.opponentCenter;

        if (fromSide === 'player') this.playerEnchanted--;
        else this.opponentEnchanted--;
        if (toSide === 'player') this.playerEnchanted++;
        else this.opponentEnchanted++;

        p.side = toSide;
        p.homeX = newCenter.x + (Math.random() - 0.5) * 120;
        p.homeY = newCenter.y + (Math.random() - 0.5) * 100;

        // Dramatic arc animation
        this.scene.tweens.add({
            targets: p,
            x: p.homeX, y: p.homeY,
            duration: 900, ease: 'Sine.easeInOut',
            onComplete: () => {
                p.dot.setFillStyle(newColor, 1);
                p.halo.setFillStyle(newColorAlt, 0.2);
                this.spawnSparkle(p.x, p.y, newColor, 3);
            }
        });
        // Flash white during transition
        this.scene.time.delayedCall(400, () => { p.dot.setFillStyle(0xffffff, 0.9); });
    }

    // =========================================
    // ATTACK BEAM: particles rush toward opponent
    // =========================================
    launchAttack(fromSide, damage) {
        const enchanted = this.particles.filter(p => p.side === fromSide && p.enchanted);
        if (enchanted.length === 0) return;

        const targetCenter = fromSide === 'player' ? this.opponentCenter : this.playerCenter;
        const color = fromSide === 'player' ? this.playerColor : this.opponentColor;

        // Select particles for the beam (proportional to damage)
        const beamCount = Math.min(enchanted.length, Math.max(5, Math.floor(damage / 8)));
        const beamParticles = Phaser.Utils.Array.Shuffle(enchanted).slice(0, beamCount);

        // Phase 1: particles converge to a point
        const launchX = fromSide === 'player' ? 400 : 880;
        const launchY = 280;

        beamParticles.forEach((p, i) => {
            const delay = i * 20;

            // Rush to convergence point
            this.scene.tweens.add({
                targets: p,
                x: launchX + (Math.random() - 0.5) * 20,
                y: launchY + (Math.random() - 0.5) * 20,
                duration: 250, delay, ease: 'Power2'
            });

            // Then fire at target
            this.scene.time.delayedCall(300 + delay, () => {
                this.scene.tweens.add({
                    targets: p,
                    x: targetCenter.x + (Math.random() - 0.5) * 60,
                    y: targetCenter.y + (Math.random() - 0.5) * 60,
                    duration: 200, ease: 'Cubic.easeIn',
                    onComplete: () => {
                        // Explode on impact
                        this.spawnSparkle(p.x, p.y, color, 4);
                        // Bounce back to formation
                        this.scene.tweens.add({
                            targets: p,
                            x: p.homeX + (Math.random() - 0.5) * 40,
                            y: p.homeY + (Math.random() - 0.5) * 40,
                            duration: 600, ease: 'Bounce.easeOut'
                        });
                    }
                });
            });
        });

        // Central beam line effect
        const beam = this.scene.add.rectangle(
            (launchX + targetCenter.x) / 2, launchY,
            Math.abs(targetCenter.x - launchX), 3, color, 0.5
        ).setDepth(55);
        this.scene.time.delayedCall(350, () => {
            this.scene.tweens.add({
                targets: beam, alpha: 0, scaleY: 5,
                duration: 300, onComplete: () => beam.destroy()
            });
        });
    }

    spawnSparkle(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.8;
            const dist = 12 + Math.random() * 18;
            const s = this.scene.add.circle(x, y, 1.5, color, 0.9).setDepth(55);
            this.container.add(s);
            this.scene.tweens.add({
                targets: s,
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                alpha: 0, scaleX: 0.2, scaleY: 0.2,
                duration: 350 + Math.random() * 200,
                onComplete: () => s.destroy()
            });
        }
    }

    pulseBeat() {
        this.beatPulse = 1;
    }

    update(time, delta) {
        const dt = delta / 1000;
        this.beatPulse *= 0.92;
        this.flowTime += dt;

        // Update formation targets
        this.updateFormations(this.flowTime);

        for (const p of this.particles) {
            if (p.enchanted) {
                // Move toward formation position with organic lag
                p.phase += dt * (1.5 + p.speed);
                const formBlend = 0.04; // how tightly they follow formation
                const targetX = p.formX + Math.sin(p.phase) * (8 + this.beatPulse * 12);
                const targetY = p.formY + Math.cos(p.phase * 1.3) * (6 + this.beatPulse * 10);
                p.x += (targetX - p.x) * formBlend;
                p.y += (targetY - p.y) * formBlend;

                // Pulsing size
                const pulse = 4.5 + Math.sin(p.phase * 2) * 1.2 + this.beatPulse * 3;
                p.dot.setRadius(pulse);
                p.dot.setAlpha(0.85 + Math.sin(p.phase * 3) * 0.15);

                // Halo
                const haloPulse = 15 + this.beatPulse * 10 + Math.sin(p.phase * 2) * 3;
                p.halo.setRadius(haloPulse);
                p.halo.setAlpha(0.15 + this.beatPulse * 0.15);

                // Sparkle trails
                if (Math.random() < 0.006 + this.beatPulse * 0.025) {
                    const color = p.side === 'player' ? this.playerColorAlt : this.opponentColorAlt;
                    const trail = this.scene.add.circle(p.x, p.y, 1.5, color, 0.5).setDepth(49);
                    this.container.add(trail);
                    this.scene.tweens.add({
                        targets: trail, alpha: 0, scaleX: 0.1, scaleY: 0.1,
                        duration: 400, onComplete: () => trail.destroy()
                    });
                }
            } else {
                // Lazy dormant drift
                p.phase += dt * 0.35;
                p.x += Math.sin(p.phase) * 0.12;
                p.y += Math.cos(p.phase * 0.6) * 0.08;

                // Keep in bounds
                const isLeft = p.side === 'player';
                const minX = isLeft ? this.bounds.x : this.midX + 10;
                const maxX = isLeft ? this.midX - 10 : this.bounds.x + this.bounds.width;
                p.x = Phaser.Math.Clamp(p.x, minX, maxX);
                p.y = Phaser.Math.Clamp(p.y, this.bounds.y, this.bounds.y + this.bounds.height);

                p.halo.setAlpha(0);
            }

            p.dot.x = p.x;
            p.dot.y = p.y;
            p.halo.x = p.x;
            p.halo.y = p.y;
        }
    }

    getEnchantedCount(side) {
        return side === 'player' ? this.playerEnchanted : this.opponentEnchanted;
    }

    destroy() {
        this.container.destroy();
    }
}
