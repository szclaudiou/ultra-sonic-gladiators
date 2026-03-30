class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        this.load.image('menu-bg', 'assets/arena/menu-bg.png');
        this.load.image('arena-bg', 'assets/arena/arena-bg.png');
        this.load.image('portrait-argentum', 'assets/portraits/argentum.png');
        this.load.image('portrait-morgana', 'assets/portraits/morgana.png');
        this.load.image('locked-grid', 'assets/portraits/locked-grid.png');
        this.load.audio('audio-argentum', 'assets/audio/argentum.ogg');
        this.load.audio('audio-morgana', 'assets/audio/morgana.ogg');
        this.load.json('beatmap-argentum', 'assets/audio/beatmap-argentum.json');
        this.load.json('beatmap-morgana', 'assets/audio/beatmap-morgana.json');
    }

    create() {
        // Background
        const bg = this.add.image(640, 360, 'menu-bg').setDisplaySize(1280, 720);
        bg.setAlpha(0.8);

        // Dark overlay
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.4);

        // Ambient particles
        this.menuParticles = [];
        for (let i = 0; i < 60; i++) {
            const x = Math.random() * 1280;
            const y = Math.random() * 720;
            const color = Math.random() > 0.5 ? 0xC0C0C0 : 0x8B00FF;
            const p = this.add.circle(x, y, 2 + Math.random() * 3, color, 0.3 + Math.random() * 0.4);
            this.menuParticles.push({
                sprite: p,
                vx: (Math.random() - 0.5) * 0.5,
                vy: -0.2 - Math.random() * 0.5,
                phase: Math.random() * Math.PI * 2
            });
        }

        // Title with glow effect
        const titleShadow = this.add.text(640, 140, 'ULTRA SONIC\nGLADIATORS', {
            fontSize: '72px',
            fontFamily: 'Arial Black, Impact, sans-serif',
            fontStyle: 'bold',
            color: '#8B00FF',
            align: 'center',
            lineSpacing: 5
        }).setOrigin(0.5).setAlpha(0.3).setScale(1.02);

        const title = this.add.text(640, 140, 'ULTRA SONIC\nGLADIATORS', {
            fontSize: '72px',
            fontFamily: 'Arial Black, Impact, sans-serif',
            fontStyle: 'bold',
            color: '#ffffff',
            align: 'center',
            stroke: '#4B0082',
            strokeThickness: 4,
            lineSpacing: 5
        }).setOrigin(0.5);

        // Subtle title pulse
        this.tweens.add({
            targets: [title, titleShadow],
            scaleX: 1.02,
            scaleY: 1.02,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Subtitle
        this.add.text(640, 240, 'RHYTHM  \u2022  BATTLE  \u2022  DOMINATE', {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#C0C0C0',
            letterSpacing: 8
        }).setOrigin(0.5);

        // VS MODE button
        const vsBtn = this.createButton(640, 380, 'VS MODE', () => {
            this.scene.start('CharSelectScene');
        });

        // Story mode (disabled)
        const storyBtn = this.createButton(640, 460, 'STORY MODE', null, true);

        // Footer
        this.add.text(640, 660, 'D  F  J  K  \u2014  Master the rhythm, command the particles', {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#666688'
        }).setOrigin(0.5);
    }

    createButton(x, y, text, callback, disabled) {
        const width = 280;
        const height = 56;
        const bg = this.add.graphics();

        if (disabled) {
            bg.fillStyle(0x222233, 0.6);
            bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 8);
            const label = this.add.text(x, y, text, {
                fontSize: '22px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: '#444466'
            }).setOrigin(0.5);
            this.add.text(x, y + 30, 'COMING SOON', {
                fontSize: '11px', fontFamily: 'monospace', color: '#444466'
            }).setOrigin(0.5);
            return;
        }

        bg.fillStyle(0x4B0082, 0.8);
        bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 8);
        bg.lineStyle(2, 0x8B00FF, 1);
        bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 8);

        const label = this.add.text(x, y, text, {
            fontSize: '26px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        const hitArea = this.add.rectangle(x, y, width, height).setInteractive({ useHandCursor: true }).setAlpha(0.001);

        hitArea.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x6B20A2, 0.9);
            bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 8);
            bg.lineStyle(2, 0xC0C0C0, 1);
            bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 8);
            label.setScale(1.05);
        });

        hitArea.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x4B0082, 0.8);
            bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 8);
            bg.lineStyle(2, 0x8B00FF, 1);
            bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 8);
            label.setScale(1);
        });

        hitArea.on('pointerdown', callback);
        return hitArea;
    }

    update(time) {
        for (const p of this.menuParticles) {
            p.phase += 0.01;
            p.sprite.x += p.vx + Math.sin(p.phase) * 0.3;
            p.sprite.y += p.vy;
            if (p.sprite.y < -10) {
                p.sprite.y = 730;
                p.sprite.x = Math.random() * 1280;
            }
            if (p.sprite.x < -10) p.sprite.x = 1290;
            if (p.sprite.x > 1290) p.sprite.x = -10;
        }
    }
}
