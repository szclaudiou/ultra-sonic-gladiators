class GameParticleSystem {
    constructor(scene, config) {
        this.scene = scene;
        this.particles = [];
        this.playerColor = config.playerColor || 0xC0C0C0;
        this.opponentColor = config.opponentColor || 0x8B00FF;
        this.playerColorAlt = config.playerColorAlt || 0xE8E8FF;
        this.opponentColorAlt = config.opponentColorAlt || 0x4B0082;
        this.totalPerSide = config.totalPerSide || 65;

        // Arena bounds (above rhythm tracks)
        this.bounds = { x: 30, y: 70, width: 1220, height: 380 };
        this.midX = this.bounds.x + this.bounds.width / 2;

        this.playerEnchanted = 0;
        this.opponentEnchanted = 0;
        this.beatPulse = 0;

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
        const x = isLeft
            ? Phaser.Math.Between(this.bounds.x + 20, this.midX - 40)
            : Phaser.Math.Between(this.midX + 40, this.bounds.x + this.bounds.width - 20);
        const y = Phaser.Math.Between(this.bounds.y + 10, this.bounds.y + this.bounds.height - 10);

        // Core dot — visible but subtle
        const dot = this.scene.add.circle(x, y, 3.5, 0x667788, 0.4);
        dot.setDepth(52);
        this.container.add(dot);

        // Glow halo (hidden until enchanted)
        const halo = this.scene.add.circle(x, y, 10, 0x667788, 0);
        halo.setDepth(51);
        this.container.add(halo);

        const particle = {
            dot, halo, side, enchanted: false,
            x, y, homeX: x, homeY: y,
            phase: Math.random() * Math.PI * 2,
            speed: 0.3 + Math.random() * 0.7,
            index
        };

        this.particles.push(particle);
        return particle;
    }

    enchantParticle(side) {
        const candidates = this.particles.filter(p => p.side === side && !p.enchanted);
        if (candidates.length === 0) return;

        const p = candidates[Math.floor(Math.random() * candidates.length)];
        p.enchanted = true;

        const color = side === 'player' ? this.playerColor : this.opponentColor;
        const colorAlt = side === 'player' ? this.playerColorAlt : this.opponentColorAlt;

        p.dot.setFillStyle(color, 1);
        p.dot.setRadius(4);
        p.halo.setFillStyle(colorAlt, 0.18);
        p.halo.setRadius(14);

        if (side === 'player') this.playerEnchanted++;
        else this.opponentEnchanted++;

        // Burst sparkle
        this.spawnSparkle(p.x, p.y, color, 5);
    }

    disenchantParticle(side) {
        const candidates = this.particles.filter(p => p.side === side && p.enchanted);
        if (candidates.length === 0) return;

        const p = candidates[Math.floor(Math.random() * candidates.length)];
        p.enchanted = false;
        p.dot.setFillStyle(0x555566, 0.3);
        p.dot.setRadius(3);
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
        const isLeft = toSide === 'player';

        const newX = isLeft
            ? Phaser.Math.Between(this.bounds.x + 20, this.midX - 40)
            : Phaser.Math.Between(this.midX + 40, this.bounds.x + this.bounds.width - 20);

        // Update counts
        if (fromSide === 'player') this.playerEnchanted--;
        else this.opponentEnchanted--;
        if (toSide === 'player') this.playerEnchanted++;
        else this.opponentEnchanted++;

        p.side = toSide;
        p.homeX = newX;

        // Animate the steal — dramatic arc
        const midY = p.y - 40 - Math.random() * 40;
        this.scene.tweens.add({
            targets: p,
            x: newX,
            duration: 900,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                p.dot.setFillStyle(newColor, 1);
                p.halo.setFillStyle(newColorAlt, 0.18);
                this.spawnSparkle(p.x, p.y, newColor, 3);
            }
        });

        // Color transition during travel
        this.scene.time.delayedCall(450, () => {
            p.dot.setFillStyle(0xffffff, 0.9);
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
        this.beatPulse *= 0.93;

        for (const p of this.particles) {
            if (p.enchanted) {
                // Dancing swirl
                p.phase += dt * (1.8 + p.speed);
                const swirl = 18 + this.beatPulse * 20;
                const targetX = p.homeX + Math.sin(p.phase) * swirl;
                const targetY = p.homeY + Math.cos(p.phase * 1.4) * swirl * 0.6;
                p.x += (targetX - p.x) * 0.07;
                p.y += (targetY - p.y) * 0.07;

                // Pulsing
                const pulse = 4 + Math.sin(p.phase * 2) * 1.5 + this.beatPulse * 2.5;
                p.dot.setRadius(pulse);
                p.dot.setAlpha(0.85 + Math.sin(p.phase * 3) * 0.15);

                // Halo pulse
                const haloPulse = 14 + this.beatPulse * 8 + Math.sin(p.phase * 2) * 3;
                p.halo.setRadius(haloPulse);
                p.halo.setAlpha(0.12 + this.beatPulse * 0.12);

                // Occasional sparkle trail
                if (Math.random() < 0.008 + this.beatPulse * 0.03) {
                    const color = p.side === 'player' ? this.playerColorAlt : this.opponentColorAlt;
                    const trail = this.scene.add.circle(p.x, p.y, 1.5, color, 0.5).setDepth(49);
                    this.container.add(trail);
                    this.scene.tweens.add({
                        targets: trail, alpha: 0, scaleX: 0.1, scaleY: 0.1,
                        duration: 400, onComplete: () => trail.destroy()
                    });
                }
            } else {
                // Lazy drift
                p.phase += dt * 0.4;
                p.x += Math.sin(p.phase) * 0.15;
                p.y += Math.cos(p.phase * 0.6) * 0.1;

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
