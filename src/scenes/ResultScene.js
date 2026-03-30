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
        const playerChar = CHARACTERS[this.playerCharId];
        const opponentChar = CHARACTERS[this.opponentCharId];
        const isPlayerWinner = this.winner === 'player';
        const winnerChar = isPlayerWinner ? playerChar : opponentChar;
        const loserChar = isPlayerWinner ? opponentChar : playerChar;

        // Background
        this.add.image(640, 360, 'arena-bg').setDisplaySize(1280, 720).setAlpha(0.3);
        this.add.rectangle(640, 360, 1280, 720, 0x0a0a1a, 0.7);

        // Victory/Defeat banner
        const bannerText = isPlayerWinner ? 'VICTORY' : 'DEFEAT';
        const bannerColor = isPlayerWinner ? '#ffcc00' : '#ff3333';
        this.add.text(640, 60, bannerText, {
            fontSize: '64px',
            fontFamily: 'Arial Black, Impact, sans-serif',
            fontStyle: 'bold',
            color: bannerColor,
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Winner portrait (large)
        const winnerPortrait = this.add.image(640, 220, winnerChar.portrait)
            .setDisplaySize(160, 160);
        const winnerGlow = this.add.graphics();
        winnerGlow.lineStyle(4, winnerChar.color, 1);
        winnerGlow.strokeCircle(640, 220, 85);

        this.add.text(640, 315, winnerChar.name + ' WINS!', {
            fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: winnerChar.colorHex
        }).setOrigin(0.5);

        // Final HP bars
        const barY = 370;
        this.add.text(200, barY - 15, playerChar.name, {
            fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: playerChar.colorHex
        }).setOrigin(0.5);
        this.add.rectangle(200, barY + 5, 200, 12, 0x333333).setOrigin(0.5);
        const pHPRatio = Math.max(0, this.playerHP) / 1000;
        this.add.rectangle(200 - 100 + 100 * pHPRatio, barY + 5, 200 * pHPRatio, 12, playerChar.color).setOrigin(0.5);
        this.add.text(200, barY + 22, this.playerHP + ' HP', {
            fontSize: '12px', fontFamily: 'monospace', color: '#aaaacc'
        }).setOrigin(0.5);

        this.add.text(1080, barY - 15, opponentChar.name, {
            fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: opponentChar.colorHex
        }).setOrigin(0.5);
        this.add.rectangle(1080, barY + 5, 200, 12, 0x333333).setOrigin(0.5);
        const oHPRatio = Math.max(0, this.opponentHP) / 1000;
        this.add.rectangle(1080 - 100 + 100 * oHPRatio, barY + 5, 200 * oHPRatio, 12, opponentChar.color).setOrigin(0.5);
        this.add.text(1080, barY + 22, this.opponentHP + ' HP', {
            fontSize: '12px', fontFamily: 'monospace', color: '#aaaacc'
        }).setOrigin(0.5);

        // Player stats
        const r = this.playerResults;
        const totalNotes = (r.perfect || 0) + (r.great || 0) + (r.good || 0) + (r.miss || 0);
        const accuracy = totalNotes > 0
            ? Math.round(((r.perfect || 0) + (r.great || 0) * 0.8 + (r.good || 0) * 0.5) / totalNotes * 100)
            : 0;

        const statsY = 430;
        this.add.text(640, statsY, 'YOUR STATS', {
            fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff'
        }).setOrigin(0.5);

        const statLines = [
            ['Total Notes', totalNotes],
            ['Perfect', r.perfect || 0],
            ['Great', r.great || 0],
            ['Good', r.good || 0],
            ['Miss', r.miss || 0],
            ['Max Combo', r.maxCombo || 0],
            ['Accuracy', accuracy + '%'],
            ['Particles Enchanted', this.playerEnchanted],
            ['Score', r.score || 0]
        ];

        const colX = [520, 760];
        statLines.forEach((stat, i) => {
            const y = statsY + 30 + Math.floor(i / 1) * 22;
            this.add.text(colX[0], y, stat[0], {
                fontSize: '14px', fontFamily: 'monospace', color: '#8888aa'
            }).setOrigin(0, 0.5);
            this.add.text(colX[1], y, '' + stat[1], {
                fontSize: '14px', fontFamily: 'monospace', color: '#ffffff'
            }).setOrigin(1, 0.5);
        });

        // Buttons
        const btnY = 670;
        this.createButton(480, btnY, 'REMATCH', () => {
            this.scene.start('BattleScene', {
                player: this.playerCharId,
                opponent: this.opponentCharId
            });
        });

        this.createButton(800, btnY, 'MENU', () => {
            this.scene.start('MenuScene');
        });

        // Ambient particles
        this.ambientParticles = [];
        for (let i = 0; i < 40; i++) {
            const color = Math.random() > 0.5 ? winnerChar.color : 0xffffff;
            const p = this.add.circle(
                Math.random() * 1280,
                Math.random() * 720,
                2 + Math.random() * 3,
                color,
                0.3 + Math.random() * 0.4
            );
            this.ambientParticles.push({
                sprite: p,
                vy: -0.3 - Math.random() * 0.5,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    createButton(x, y, text, callback) {
        const w = 180, h = 44;
        const bg = this.add.graphics();
        bg.fillStyle(0x4B0082, 0.8);
        bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
        bg.lineStyle(2, 0x8B00FF, 1);
        bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);

        const label = this.add.text(x, y, text, {
            fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff'
        }).setOrigin(0.5);

        const hitArea = this.add.rectangle(x, y, w, h).setInteractive({ useHandCursor: true }).setAlpha(0.001);
        hitArea.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x6B20A2, 0.9);
            bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
            bg.lineStyle(2, 0xC0C0C0, 1);
            bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
        });
        hitArea.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x4B0082, 0.8);
            bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
            bg.lineStyle(2, 0x8B00FF, 1);
            bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
        });
        hitArea.on('pointerdown', callback);
    }

    update(time) {
        for (const p of this.ambientParticles) {
            p.phase += 0.01;
            p.sprite.x += Math.sin(p.phase) * 0.3;
            p.sprite.y += p.vy;
            if (p.sprite.y < -10) {
                p.sprite.y = 730;
                p.sprite.x = Math.random() * 1280;
            }
        }
    }
}
