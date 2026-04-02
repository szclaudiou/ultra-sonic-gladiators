class CharSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharSelectScene' });
    }

    create() {
        const { width, height } = this.cameras.main;
        const cx = width / 2;
        const cy = height / 2;

        // Background
        this.add.image(cx, cy, 'menu-bg').setDisplaySize(width, height).setAlpha(0.5);
        this.add.rectangle(cx, cy, width, height, 0x0a0a1a, 0.7);

        // Title
        const titleSize = Math.max(20, Math.min(36, width * 0.028)) + 'px';
        this.add.text(cx, height * 0.06, 'SELECT YOUR GLADIATOR', {
            fontSize: titleSize,
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
        const cellW = Math.max(120, Math.min(180, width * 0.14));
        const cellH = Math.max(140, Math.min(200, height * 0.28));
        const gap = Math.max(8, Math.min(16, width * 0.012));
        const totalW = cols * cellW + (cols - 1) * gap;
        const startX = (width - totalW) / 2 + cellW / 2;
        const startY = height * 0.24;

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
        const detailNameSize = Math.max(20, Math.min(32, width * 0.025)) + 'px';
        const detailTitleSize = Math.max(12, Math.min(18, width * 0.014)) + 'px';
        const detailTagSize = Math.max(11, Math.min(16, width * 0.0125)) + 'px';

        this.detailName = this.add.text(cx, height * 0.71, '', {
            fontSize: detailNameSize, fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff'
        }).setOrigin(0.5);
        this.detailTitle = this.add.text(cx, height * 0.76, '', {
            fontSize: detailTitleSize, fontFamily: 'monospace', color: '#C0C0C0'
        }).setOrigin(0.5);
        this.detailTagline = this.add.text(cx, height * 0.80, '', {
            fontSize: detailTagSize, fontFamily: 'Arial', fontStyle: 'italic', color: '#8888aa'
        }).setOrigin(0.5);

        // FIGHT button (hidden initially)
        this.fightContainer = this.add.container(cx, height * 0.90).setAlpha(0);
        const fightBtnW = Math.max(160, Math.min(240, width * 0.19));
        const fightBtnH = Math.max(40, Math.min(56, height * 0.078));
        const fightBg = this.add.graphics();
        fightBg.fillStyle(0x8B00FF, 0.9);
        fightBg.fillRoundedRect(-fightBtnW / 2, -fightBtnH / 2, fightBtnW, fightBtnH, 12);
        fightBg.lineStyle(2, 0xC0C0C0, 1);
        fightBg.strokeRoundedRect(-fightBtnW / 2, -fightBtnH / 2, fightBtnW, fightBtnH, 12);
        const fightTextSize = Math.max(20, Math.min(30, width * 0.023)) + 'px';
        const fightText = this.add.text(0, 0, 'FIGHT!', {
            fontSize: fightTextSize, fontFamily: 'Arial Black, Impact', fontStyle: 'bold', color: '#ffffff'
        }).setOrigin(0.5);
        this.fightContainer.add([fightBg, fightText]);

        const fightZone = this.add.zone(cx, height * 0.90, fightBtnW + 60, fightBtnH + 14).setInteractive({ useHandCursor: true });
        let fightButtonDebounce = false;
        fightZone.on('pointerdown', () => {
            if (!this.selectedChar || fightButtonDebounce) return;
            fightButtonDebounce = true;
            const opponent = this.selectedChar === 'argentum' ? 'morgana' : 'argentum';
            this.scene.start('BattleScene', { player: this.selectedChar, opponent });
        });

        // Back button
        const backSize = Math.max(12, Math.min(18, width * 0.014)) + 'px';
        const back = this.add.text(width * 0.047, height * 0.96, '< BACK', {
            fontSize: backSize, fontFamily: 'monospace', color: '#888888'
        }).setInteractive({ useHandCursor: true });
        back.on('pointerdown', () => this.scene.start('MenuScene'));
        back.on('pointerover', () => back.setColor('#ffffff'));
        back.on('pointerout', () => back.setColor('#888888'));

        // Listen for resize
        this.scale.on('resize', (gameSize) => {
            this.scene.restart();
        });
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
            .setDisplaySize(w - 30, h - 65)
            .setInteractive({ useHandCursor: true });
        portrait.on('pointerdown', () => this.selectCharacter(charData.id));

        portrait.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x1a1a2e, 0.95);
            bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
            bg.lineStyle(3, charData.color, 0.8);
            bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
        });
        portrait.on('pointerout', () => {
            if (this.selectedChar !== charData.id) {
                bg.clear();
                bg.fillStyle(0x1a1a2e, 0.85);
                bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
                bg.lineStyle(2, charData.color, 0.5);
                bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
            }
        });
        container.add(portrait);

        // Name
        const nameSize = Math.max(11, Math.min(16, w * 0.089)) + 'px';
        const name = this.add.text(0, h / 2 - 28, charData.name, {
            fontSize: nameSize, fontFamily: 'Arial', fontStyle: 'bold', color: charData.colorHex
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

        const qSize = Math.max(28, Math.min(48, w * 0.27)) + 'px';
        this.add.text(x, y - 10, '?', {
            fontSize: qSize, fontFamily: 'Arial', fontStyle: 'bold', color: '#222244'
        }).setOrigin(0.5);

        const lockSize = Math.max(8, Math.min(11, w * 0.061)) + 'px';
        this.add.text(x, y + 35, 'LOCKED', {
            fontSize: lockSize, fontFamily: 'monospace', color: '#333355'
        }).setOrigin(0.5);
    }
}
