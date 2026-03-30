class CharSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharSelectScene' });
    }

    create() {
        // Background
        this.add.image(640, 360, 'menu-bg').setDisplaySize(1280, 720).setAlpha(0.5);
        this.add.rectangle(640, 360, 1280, 720, 0x0a0a1a, 0.7);

        // Title
        this.add.text(640, 45, 'SELECT YOUR GLADIATOR', {
            fontSize: '36px',
            fontFamily: 'Arial Black, Impact, sans-serif',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#4B0082',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.selectedChar = null;
        this.charSlots = {};

        // Character grid — centered, 2 rows x 4 cols
        const cols = 4;
        const cellW = 180, cellH = 200, gap = 16;
        const totalW = cols * cellW + (cols - 1) * gap;
        const startX = (1280 - totalW) / 2 + cellW / 2;
        const startY = 170;

        const selectableChars = ['argentum', 'morgana'];

        for (let i = 0; i < 8; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * (cellW + gap);
            const y = startY + row * (cellH + gap);

            if (i < 2) {
                this.createCharSlot(x, y, cellW, cellH, CHARACTERS[selectableChars[i]]);
            } else {
                this.createLockedSlot(x, y, cellW, cellH);
            }
        }

        // Detail panel
        this.detailName = this.add.text(640, 510, '', {
            fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff'
        }).setOrigin(0.5);
        this.detailTitle = this.add.text(640, 545, '', {
            fontSize: '18px', fontFamily: 'monospace', color: '#C0C0C0'
        }).setOrigin(0.5);
        this.detailTagline = this.add.text(640, 575, '', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'italic', color: '#8888aa'
        }).setOrigin(0.5);

        // FIGHT button (hidden initially)
        this.fightContainer = this.add.container(640, 645).setAlpha(0);
        const fightBg = this.add.graphics();
        fightBg.fillStyle(0x8B00FF, 0.9);
        fightBg.fillRoundedRect(-120, -28, 240, 56, 12);
        fightBg.lineStyle(2, 0xC0C0C0, 1);
        fightBg.strokeRoundedRect(-120, -28, 240, 56, 12);
        const fightText = this.add.text(0, 0, 'FIGHT!', {
            fontSize: '30px', fontFamily: 'Arial Black, Impact', fontStyle: 'bold', color: '#ffffff'
        }).setOrigin(0.5);
        this.fightContainer.add([fightBg, fightText]);

        const fightZone = this.add.zone(640, 645, 240, 56).setInteractive({ useHandCursor: true });
        fightZone.on('pointerdown', () => {
            if (!this.selectedChar) return;
            const opponent = this.selectedChar === 'argentum' ? 'morgana' : 'argentum';
            this.scene.start('BattleScene', { player: this.selectedChar, opponent });
        });

        // Back button
        const back = this.add.text(60, 690, '< BACK', {
            fontSize: '18px', fontFamily: 'monospace', color: '#888888'
        }).setInteractive({ useHandCursor: true });
        back.on('pointerdown', () => this.scene.start('MenuScene'));
        back.on('pointerover', () => back.setColor('#ffffff'));
        back.on('pointerout', () => back.setColor('#888888'));
    }

    createCharSlot(x, y, w, h, charData) {
        const container = this.add.container(x, y);

        // Background card
        const bg = this.add.graphics();
        bg.fillStyle(0x1a1a2e, 0.85);
        bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
        bg.lineStyle(2, charData.color, 0.5);
        bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
        container.add(bg);

        // Portrait
        const portrait = this.add.image(0, -15, charData.portrait)
            .setDisplaySize(w - 30, h - 65);
        container.add(portrait);

        // Name
        const name = this.add.text(0, h / 2 - 28, charData.name, {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: charData.colorHex
        }).setOrigin(0.5);
        container.add(name);

        // Selection highlight (hidden)
        const highlight = this.add.graphics();
        container.add(highlight);

        // Interactive zone — the FULL card area
        const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });

        zone.on('pointerover', () => {
            if (this.selectedChar !== charData.id) {
                highlight.clear();
                highlight.lineStyle(3, 0xffffff, 0.5);
                highlight.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
            }
        });

        zone.on('pointerout', () => {
            if (this.selectedChar !== charData.id) {
                highlight.clear();
            }
        });

        zone.on('pointerdown', () => {
            this.selectCharacter(charData.id);
        });

        this.charSlots[charData.id] = { container, highlight, w, h, charData };
    }

    selectCharacter(charId) {
        // Clear all highlights
        Object.values(this.charSlots).forEach(slot => {
            slot.highlight.clear();
        });

        this.selectedChar = charId;
        const slot = this.charSlots[charId];
        const { w, h, charData } = slot;

        // Show selection
        slot.highlight.clear();
        slot.highlight.lineStyle(3, 0xffffff, 1);
        slot.highlight.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);

        // Pulse effect
        this.tweens.add({
            targets: slot.container,
            scaleX: 1.05, scaleY: 1.05,
            duration: 150, yoyo: true
        });

        // Update detail
        this.detailName.setText(charData.name);
        this.detailTitle.setText(charData.title + '  •  ' + charData.instrument);
        this.detailTagline.setText('"' + charData.tagline + '"');

        // Show FIGHT button
        this.tweens.add({
            targets: this.fightContainer,
            alpha: 1, duration: 200
        });
    }

    createLockedSlot(x, y, w, h) {
        const bg = this.add.graphics();
        bg.fillStyle(0x111122, 0.5);
        bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 12);
        bg.lineStyle(1, 0x222244, 0.5);
        bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);

        this.add.text(x, y - 10, '?', {
            fontSize: '48px', fontFamily: 'Arial', fontStyle: 'bold', color: '#222244'
        }).setOrigin(0.5);

        this.add.text(x, y + 35, 'LOCKED', {
            fontSize: '11px', fontFamily: 'monospace', color: '#333355'
        }).setOrigin(0.5);
    }
}
