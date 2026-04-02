class ResultScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ResultScene' });
    }

    init(data) {
        this.winner = data.winner || 'player';
        this.playerCharId = data.playerChar || 'argentum';
        this.opponentCharId = data.opponentChar || 'morgana';
        this.playerHP = data.playerHP || 0;
        this.opponentHP = data.opponentHP || 0;
        this.playerResults = data.playerResults || {};
        this.opponentResults = data.opponentResults || {};
        this.playerEnchanted = data.playerEnchanted || 0;
        this.opponentEnchanted = data.opponentEnchanted || 0;
    }

    create() {
        const { width, height } = this.cameras.main;
        const cx = width / 2;
        const cy = height / 2;

        const pChar = CHARACTERS[this.playerCharId];
        const oChar = CHARACTERS[this.opponentCharId];
        const isWin = this.winner === 'player';
        const winnerChar = isWin ? pChar : oChar;

        // Full opaque background
        this.add.rectangle(cx, cy, width, height, 0x050510);
        this.add.image(cx, cy, 'arena-bg').setDisplaySize(width, height).setAlpha(0.2);
        this.add.rectangle(cx, cy, width, height, 0x0a0a1a, 0.6);

        // Banner
        const bannerText = isWin ? 'VICTORY' : 'DEFEAT';
        const bannerColor = isWin ? '#ffcc00' : '#ff3333';
        const bannerSize = Math.max(28, Math.min(56, width * 0.044)) + 'px';
        this.add.text(cx, height * 0.076, bannerText, {
            fontSize: bannerSize,
            fontFamily: 'Arial Black, Impact, sans-serif',
            fontStyle: 'bold',
            color: bannerColor,
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5);

        // Winner portrait
        const portraitSize = Math.max(80, Math.min(140, width * 0.11));
        this.add.image(cx, height * 0.27, winnerChar.portrait).setDisplaySize(portraitSize, portraitSize);
        const ring = this.add.graphics();
        ring.lineStyle(3, winnerChar.color, 1);
        ring.strokeCircle(cx, height * 0.27, portraitSize * 0.536);

        const winNameSize = Math.max(16, Math.min(26, width * 0.02)) + 'px';
        this.add.text(cx, height * 0.39, winnerChar.name + ' WINS!', {
            fontSize: winNameSize, fontFamily: 'Arial', fontStyle: 'bold', color: winnerChar.colorHex
        }).setOrigin(0.5);

        // HP comparison
        const barW = Math.max(120, Math.min(200, width * 0.156));
        const barH = Math.max(8, Math.min(12, height * 0.017));
        const barY = height * 0.45;
        const pBarX = width * 0.156;
        const oBarX = width * 0.844;

        const hpLabelSize = Math.max(10, Math.min(13, width * 0.01)) + 'px';
        const hpValSize = Math.max(9, Math.min(11, width * 0.0086)) + 'px';

        // Player HP
        this.add.text(pBarX, barY - 18, pChar.name, {
            fontSize: hpLabelSize, fontFamily: 'Arial', fontStyle: 'bold', color: pChar.colorHex
        }).setOrigin(0.5);
        this.add.rectangle(pBarX, barY, barW, barH, 0x222233).setOrigin(0.5);
        const pRatio = Math.max(0, this.playerHP) / 1000;
        if (pRatio > 0) {
            this.add.rectangle(pBarX - barW / 2, barY, barW * pRatio, barH, pChar.color).setOrigin(0, 0.5);
        }
        this.add.text(pBarX, barY + 18, Math.max(0, Math.round(this.playerHP)) + ' HP', {
            fontSize: hpValSize, fontFamily: 'monospace', color: '#aaaacc'
        }).setOrigin(0.5);

        // Opponent HP
        this.add.text(oBarX, barY - 18, oChar.name, {
            fontSize: hpLabelSize, fontFamily: 'Arial', fontStyle: 'bold', color: oChar.colorHex
        }).setOrigin(0.5);
        this.add.rectangle(oBarX, barY, barW, barH, 0x222233).setOrigin(0.5);
        const oRatio = Math.max(0, this.opponentHP) / 1000;
        if (oRatio > 0) {
            this.add.rectangle(oBarX - barW / 2, barY, barW * oRatio, barH, oChar.color).setOrigin(0, 0.5);
        }
        this.add.text(oBarX, barY + 18, Math.max(0, Math.round(this.opponentHP)) + ' HP', {
            fontSize: hpValSize, fontFamily: 'monospace', color: '#aaaacc'
        }).setOrigin(0.5);

        // Stats
        const r = this.playerResults;
        const total = (r.perfect || 0) + (r.great || 0) + (r.good || 0) + (r.miss || 0);
        const acc = total > 0
            ? Math.round(((r.perfect || 0) + (r.great || 0) * 0.8 + (r.good || 0) * 0.5) / total * 100)
            : 0;

        const perfTitleSize = Math.max(12, Math.min(18, width * 0.014)) + 'px';
        this.add.text(cx, height * 0.535, 'YOUR PERFORMANCE', {
            fontSize: perfTitleSize, fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff'
        }).setOrigin(0.5);

        const stats = [
            ['Notes Hit', `${(r.perfect||0)+(r.great||0)+(r.good||0)} / ${total}`],
            ['Perfect', r.perfect || 0],
            ['Great', r.great || 0],
            ['Good', r.good || 0],
            ['Miss', r.miss || 0],
            ['Max Combo', r.maxCombo || 0],
            ['Accuracy', acc + '%'],
            ['Particles', this.playerEnchanted + ' enchanted'],
            ['Score', r.score || 0]
        ];

        const statSize = Math.max(10, Math.min(13, width * 0.01)) + 'px';
        const leftCol = cx - width * 0.125;
        const rightCol = cx + width * 0.125;
        const statRowH = Math.max(16, Math.min(22, height * 0.031));
        stats.forEach((stat, i) => {
            const y = height * 0.576 + i * statRowH;
            this.add.text(leftCol, y, stat[0], {
                fontSize: statSize, fontFamily: 'monospace', color: '#7777aa'
            }).setOrigin(0, 0.5);
            this.add.text(rightCol, y, '' + stat[1], {
                fontSize: statSize, fontFamily: 'monospace', color: '#ffffff'
            }).setOrigin(1, 0.5);
        });

        // Buttons
        const btnY = height * 0.917;
        this.createButton(cx - width * 0.156, btnY, 'REMATCH', () => {
            this.scene.start('BattleScene', {
                player: this.playerCharId,
                opponent: this.opponentCharId
            });
        });
        this.createButton(cx + width * 0.156, btnY, 'MENU', () => {
            this.scene.start('MenuScene');
        });

        // Ambient particles
        this.floaters = [];
        for (let i = 0; i < 30; i++) {
            const color = Math.random() > 0.5 ? winnerChar.color : 0x666688;
            const p = this.add.circle(
                Math.random() * width, Math.random() * height,
                2 + Math.random() * 2, color, 0.25 + Math.random() * 0.3
            );
            this.floaters.push({ sprite: p, vy: -0.2 - Math.random() * 0.4, phase: Math.random() * 6.28 });
        }

        // Listen for resize
        this.scale.on('resize', () => {
            this.scene.restart();
        });
    }

    createButton(x, y, text, cb) {
        const { width } = this.cameras.main;
        const w = Math.max(140, Math.min(200, width * 0.156));
        const h = Math.max(36, Math.min(48, width * 0.0375));
        const fontSize = Math.max(14, Math.min(20, width * 0.0156)) + 'px';

        const bg = this.add.graphics();
        bg.fillStyle(0x4B0082, 0.85);
        bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
        bg.lineStyle(2, 0x8B00FF, 1);
        bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 10);

        this.add.text(x, y, text, {
            fontSize: fontSize, fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff'
        }).setOrigin(0.5);

        const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
        zone.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x6B20A2, 0.9);
            bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
            bg.lineStyle(2, 0xC0C0C0, 1);
            bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 10);
        });
        zone.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x4B0082, 0.85);
            bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
            bg.lineStyle(2, 0x8B00FF, 1);
            bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 10);
        });
        zone.on('pointerdown', cb);
    }

    update() {
        const { width, height } = this.cameras.main;
        for (const f of this.floaters) {
            f.phase += 0.008;
            f.sprite.x += Math.sin(f.phase) * 0.25;
            f.sprite.y += f.vy;
            if (f.sprite.y < -10) { f.sprite.y = height + 10; f.sprite.x = Math.random() * width; }
        }
    }
}
