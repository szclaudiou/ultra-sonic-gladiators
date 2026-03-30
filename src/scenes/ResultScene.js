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
        const pChar = CHARACTERS[this.playerCharId];
        const oChar = CHARACTERS[this.opponentCharId];
        const isWin = this.winner === 'player';
        const winnerChar = isWin ? pChar : oChar;

        // Full opaque background (prevents bleed-through)
        this.add.rectangle(640, 360, 1280, 720, 0x050510);
        this.add.image(640, 360, 'arena-bg').setDisplaySize(1280, 720).setAlpha(0.2);
        this.add.rectangle(640, 360, 1280, 720, 0x0a0a1a, 0.6);

        // Banner
        const bannerText = isWin ? 'VICTORY' : 'DEFEAT';
        const bannerColor = isWin ? '#ffcc00' : '#ff3333';
        this.add.text(640, 55, bannerText, {
            fontSize: '56px',
            fontFamily: 'Arial Black, Impact, sans-serif',
            fontStyle: 'bold',
            color: bannerColor,
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5);

        // Winner portrait
        this.add.image(640, 195, winnerChar.portrait).setDisplaySize(140, 140);
        const ring = this.add.graphics();
        ring.lineStyle(3, winnerChar.color, 1);
        ring.strokeCircle(640, 195, 75);

        this.add.text(640, 280, winnerChar.name + ' WINS!', {
            fontSize: '26px', fontFamily: 'Arial', fontStyle: 'bold', color: winnerChar.colorHex
        }).setOrigin(0.5);

        // HP comparison
        const barW = 200, barH = 12, barY = 325;
        // Player HP
        this.add.text(200, barY - 18, pChar.name, {
            fontSize: '13px', fontFamily: 'Arial', fontStyle: 'bold', color: pChar.colorHex
        }).setOrigin(0.5);
        this.add.rectangle(200, barY, barW, barH, 0x222233).setOrigin(0.5);
        const pRatio = Math.max(0, this.playerHP) / 1000;
        if (pRatio > 0) {
            this.add.rectangle(200 - barW/2, barY, barW * pRatio, barH, pChar.color).setOrigin(0, 0.5);
        }
        this.add.text(200, barY + 18, Math.max(0, Math.round(this.playerHP)) + ' HP', {
            fontSize: '11px', fontFamily: 'monospace', color: '#aaaacc'
        }).setOrigin(0.5);

        // Opponent HP
        this.add.text(1080, barY - 18, oChar.name, {
            fontSize: '13px', fontFamily: 'Arial', fontStyle: 'bold', color: oChar.colorHex
        }).setOrigin(0.5);
        this.add.rectangle(1080, barY, barW, barH, 0x222233).setOrigin(0.5);
        const oRatio = Math.max(0, this.opponentHP) / 1000;
        if (oRatio > 0) {
            this.add.rectangle(1080 - barW/2, barY, barW * oRatio, barH, oChar.color).setOrigin(0, 0.5);
        }
        this.add.text(1080, barY + 18, Math.max(0, Math.round(this.opponentHP)) + ' HP', {
            fontSize: '11px', fontFamily: 'monospace', color: '#aaaacc'
        }).setOrigin(0.5);

        // Stats
        const r = this.playerResults;
        const total = (r.perfect || 0) + (r.great || 0) + (r.good || 0) + (r.miss || 0);
        const acc = total > 0
            ? Math.round(((r.perfect || 0) + (r.great || 0) * 0.8 + (r.good || 0) * 0.5) / total * 100)
            : 0;

        this.add.text(640, 385, 'YOUR PERFORMANCE', {
            fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff'
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

        const leftCol = 480, rightCol = 800;
        stats.forEach((stat, i) => {
            const y = 415 + i * 22;
            this.add.text(leftCol, y, stat[0], {
                fontSize: '13px', fontFamily: 'monospace', color: '#7777aa'
            }).setOrigin(0, 0.5);
            this.add.text(rightCol, y, '' + stat[1], {
                fontSize: '13px', fontFamily: 'monospace', color: '#ffffff'
            }).setOrigin(1, 0.5);
        });

        // Buttons
        this.createButton(440, 660, 'REMATCH', () => {
            this.scene.start('BattleScene', {
                player: this.playerCharId,
                opponent: this.opponentCharId
            });
        });
        this.createButton(840, 660, 'MENU', () => {
            this.scene.start('MenuScene');
        });

        // Ambient particles
        this.floaters = [];
        for (let i = 0; i < 30; i++) {
            const color = Math.random() > 0.5 ? winnerChar.color : 0x666688;
            const p = this.add.circle(
                Math.random() * 1280, Math.random() * 720,
                2 + Math.random() * 2, color, 0.25 + Math.random() * 0.3
            );
            this.floaters.push({ sprite: p, vy: -0.2 - Math.random() * 0.4, phase: Math.random() * 6.28 });
        }
    }

    createButton(x, y, text, cb) {
        const w = 200, h = 48;
        const bg = this.add.graphics();
        bg.fillStyle(0x4B0082, 0.85);
        bg.fillRoundedRect(x - w/2, y - h/2, w, h, 10);
        bg.lineStyle(2, 0x8B00FF, 1);
        bg.strokeRoundedRect(x - w/2, y - h/2, w, h, 10);

        this.add.text(x, y, text, {
            fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff'
        }).setOrigin(0.5);

        const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
        zone.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x6B20A2, 0.9);
            bg.fillRoundedRect(x - w/2, y - h/2, w, h, 10);
            bg.lineStyle(2, 0xC0C0C0, 1);
            bg.strokeRoundedRect(x - w/2, y - h/2, w, h, 10);
        });
        zone.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x4B0082, 0.85);
            bg.fillRoundedRect(x - w/2, y - h/2, w, h, 10);
            bg.lineStyle(2, 0x8B00FF, 1);
            bg.strokeRoundedRect(x - w/2, y - h/2, w, h, 10);
        });
        zone.on('pointerdown', cb);
    }

    update() {
        for (const f of this.floaters) {
            f.phase += 0.008;
            f.sprite.x += Math.sin(f.phase) * 0.25;
            f.sprite.y += f.vy;
            if (f.sprite.y < -10) { f.sprite.y = 730; f.sprite.x = Math.random() * 1280; }
        }
    }
}
