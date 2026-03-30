class GameParticleSystem {
    constructor(scene, config) {
        this.scene = scene;
        this.particles = [];
        this.playerColor = config.playerColor || 0xC0C0C0;
        this.opponentColor = config.opponentColor || 0x8B00FF;
        this.playerColorAlt = config.playerColorAlt || 0xE8E8FF;
        this.opponentColorAlt = config.opponentColorAlt || 0x4B0082;
        this.totalPerSide = config.totalPerSide || 50;

        // Arena bounds (above the rhythm track)
        this.bounds = {
            x: 40, y: 60,
            width: 1200, height: 420
        };
        this.midX = this.bounds.x + this.bounds.width / 2;

        this.playerEnchanted = 0;
        this.opponentEnchanted = 0;
        this.container = scene.add.container(0, 0).setDepth(50);
        this.sparkles = [];
        this.beatPulse = 0;

        this.init();
    }

    init() {
        // Player particles (left side)
        for (let i = 0; i < this.totalPerSide; i++) {
            this.createParticle('player', i);
        }
        // Opponent particles (right side)
        for (let i = 0; i < this.totalPerSide; i++) {
            this.createParticle('opponent', i);
        }
    }

    createParticle(side, index) {
        const isLeft = side === 'player';
        const x = isLeft
            ? Phaser.Math.Between(this.bounds.x, this.midX - 30)
            : Phaser.Math.Between(this.midX + 30, this.bounds.x + this.bounds.width);
        const y = Phaser.Math.Between(this.bounds.y, this.bounds.y + this.bounds.height);

        const circle = this.scene.add.circle(x, y, 4, 0x666666, 0.4);
        circle.setDepth(51);
        this.container.add(circle);

        const particle = {
            sprite: circle,
            side: side,
            enchanted: false,
            x: x,
            y: y,
            homeX: x,
            homeY: y,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            phase: Math.random() * Math.PI * 2,
            speed: 0.3 + Math.random() * 0.5,
            size: 4,
            index: index
        };

        this.particles.push(particle);
        return particle;
    }

    enchantParticle(side) {
        // Find a non-enchanted particle on this side
        const candidates = this.particles.filter(p => p.side === side && !p.enchanted);
        if (candidates.length === 0) return;

        const p = candidates[Math.floor(Math.random() * candidates.length)];
        p.enchanted = true;

        const color = side === 'player' ? this.playerColor : this.opponentColor;
        p.sprite.setFillStyle(color, 1);
        p.sprite.setRadius(6);
        p.size = 6;

        if (side === 'player') {
            this.playerEnchanted++;
        } else {
            this.opponentEnchanted++;
        }

        // Burst sparkle on enchant
        this.spawnSparkle(p.x, p.y, color);
    }

    disenchantParticle(side) {
        const candidates = this.particles.filter(p => p.side === side && p.enchanted);
        if (candidates.length === 0) return;

        const p = candidates[Math.floor(Math.random() * candidates.length)];
        p.enchanted = false;
        p.sprite.setFillStyle(0x666666, 0.4);
        p.sprite.setRadius(4);
        p.size = 4;

        if (side === 'player') {
            this.playerEnchanted = Math.max(0, this.playerEnchanted - 1);
        } else {
            this.opponentEnchanted = Math.max(0, this.opponentEnchanted - 1);
        }
    }

    stealParticle(fromSide, toSide) {
        const candidates = this.particles.filter(p => p.side === fromSide && p.enchanted);
        if (candidates.length === 0) return;

        const p = candidates[Math.floor(Math.random() * candidates.length)];
        const newColor = toSide === 'player' ? this.playerColor : this.opponentColor;
        const isLeft = toSide === 'player';

        // Animate across midline
        const newX = isLeft
            ? Phaser.Math.Between(this.bounds.x, this.midX - 30)
            : Phaser.Math.Between(this.midX + 30, this.bounds.x + this.bounds.width);

        p.side = toSide;
        p.homeX = newX;

        if (fromSide === 'player') this.playerEnchanted--;
        else this.opponentEnchanted--;
        if (toSide === 'player') this.playerEnchanted++;
        else this.opponentEnchanted++;

        this.scene.tweens.add({
            targets: p,
            x: newX,
            duration: 800,
            ease: 'Sine.easeInOut',
            onUpdate: () => {
                const t = Math.abs(p.x - p.sprite.x) > 100 ? 0.5 : 1;
                p.sprite.setFillStyle(newColor, t);
            },
            onComplete: () => {
                p.sprite.setFillStyle(newColor, 1);
            }
        });
    }

    spawnSparkle(x, y, color) {
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI * 2 / 4) * i + Math.random() * 0.5;
            const dist = 15 + Math.random() * 20;
            const sparkle = this.scene.add.circle(x, y, 2, color, 1).setDepth(55);
            this.container.add(sparkle);
            this.scene.tweens.add({
                targets: sparkle,
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                alpha: 0,
                scaleX: 0.3,
                scaleY: 0.3,
                duration: 400 + Math.random() * 200,
                onComplete: () => sparkle.destroy()
            });
        }
    }

    pulseBeat() {
        this.beatPulse = 1;
    }

    update(time, delta) {
        const dt = delta / 1000;
        this.beatPulse *= 0.95;

        for (const p of this.particles) {
            if (p.enchanted) {
                // Dancing motion - swirl around home position
                p.phase += dt * (2 + p.speed);
                const swirl = 20 + this.beatPulse * 15;
                const targetX = p.homeX + Math.sin(p.phase) * swirl;
                const targetY = p.homeY + Math.cos(p.phase * 1.3) * swirl * 0.7;
                p.x += (targetX - p.x) * 0.08;
                p.y += (targetY - p.y) * 0.08;

                // Pulsing size
                const pulseSize = 6 + Math.sin(p.phase * 2) * 2 + this.beatPulse * 3;
                p.sprite.setRadius(pulseSize);

                // Alpha pulsing
                p.sprite.setAlpha(0.8 + Math.sin(p.phase * 3) * 0.2);

                // Occasional sparkle trail
                if (Math.random() < 0.01 + this.beatPulse * 0.05) {
                    const color = p.side === 'player' ? this.playerColorAlt : this.opponentColorAlt;
                    const trail = this.scene.add.circle(p.x, p.y, 2, color, 0.6).setDepth(49);
                    this.container.add(trail);
                    this.scene.tweens.add({
                        targets: trail,
                        alpha: 0,
                        scaleX: 0.1,
                        scaleY: 0.1,
                        duration: 500,
                        onComplete: () => trail.destroy()
                    });
                }
            } else {
                // Lazy float
                p.phase += dt * 0.5;
                p.x += Math.sin(p.phase) * 0.2;
                p.y += Math.cos(p.phase * 0.7) * 0.15;

                // Keep in bounds
                const isLeft = p.side === 'player';
                const minX = isLeft ? this.bounds.x : this.midX + 10;
                const maxX = isLeft ? this.midX - 10 : this.bounds.x + this.bounds.width;
                p.x = Phaser.Math.Clamp(p.x, minX, maxX);
                p.y = Phaser.Math.Clamp(p.y, this.bounds.y, this.bounds.y + this.bounds.height);
            }

            p.sprite.x = p.x;
            p.sprite.y = p.y;
        }
    }

    getEnchantedCount(side) {
        return side === 'player' ? this.playerEnchanted : this.opponentEnchanted;
    }

    destroy() {
        this.container.destroy();
    }
}
