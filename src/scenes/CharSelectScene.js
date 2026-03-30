class CharSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharSelectScene' });
    }

    create() {
        // Background
        this.add.image(640, 360, 'menu-bg').setDisplaySize(1280, 720).setAlpha(0.5);
        this.add.rectangle(640, 360, 1280, 720, 0x0a0a1a, 0.7);

        // Title
        this.add.text(640, 50, 'SELECT YOUR GLADIATOR', {
            fontSize: '36px',
            fontFamily: 'Arial Black, Impact, sans-serif',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#4B0082',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Character grid: 2 rows x 4 columns
        const gridStartX = 240;
        const gridStartY = 160;
        const cellWidth = 200;
        const cellHeight = 200;
        const cols = 4;

        const selectableChars = ['argentum', 'morgana'];
        this.selectedChar = null;

        // Detail panel (right side)
        this.detailBg = this.add.graphics();
        this.detailName = this.add.text(640, 520, '', {
            fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff'
        }).setOrigin(0.5);
        this.detailTitle = this.add.text(640, 555, '', {
            fontSize: '18px', fontFamily: 'monospace', color: '#C0C0C0'
        }).setOrigin(0.5);
        this.detailTagline = this.add.text(640, 585, '', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'italic', color: '#8888aa'
        }).setOrigin(0.5);

        // Create 8 grid slots
        for (let i = 0; i < 8; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = gridStartX + col * cellWidth;
            const y = gridStartY + row * cellHeight;

            if (i < 2) {
                // Selectable characters
                const charId = selectableChars[i];
                const charData = CHARACTERS[charId];
                this.createCharSlot(x, y, cellWidth - 20, cellHeight - 20, charData);
            } else {
                // Locked slots
                this.createLockedSlot(x, y, cellWidth - 20, cellHeight - 20);
            }
        }

        // Fight button (initially hidden)
        this.fightBtnBg = this.add.graphics();
        this.fightBtnText = this.add.text(640, 650, 'FIGHT!', {
            fontSize: '30px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffffff'
        }).setOrigin(0.5).setAlpha(0);
        this.fightBtn = this.add.rectangle(640, 650, 220, 50).setInteractive({ useHandCursor: true }).setAlpha(0.001).setVisible(false);
        this.fightBtn.on('pointerdown', () => {
            if (this.selectedChar) {
                const opponent = this.selectedChar === 'argentum' ? 'morgana' : 'argentum';
                this.scene.start('BattleScene', {
                    player: this.selectedChar,
                    opponent: opponent
                });
            }
        });

        // Back button
        const backBtn = this.add.text(60, 680, '< BACK', {
            fontSize: '18px', fontFamily: 'monospace', color: '#888888'
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
        backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
        backBtn.on('pointerover', () => backBtn.setColor('#ffffff'));
        backBtn.on('pointerout', () => backBtn.setColor('#888888'));
    }

    createCharSlot(x, y, w, h, charData) {
        const bg = this.add.graphics();
        bg.fillStyle(0x1a1a2e, 0.8);
        bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
        bg.lineStyle(2, charData.color, 0.6);
        bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 10);

        // Portrait
        const portrait = this.add.image(x, y - 20, charData.portrait)
            .setDisplaySize(w - 40, h - 60);

        // Name
        this.add.text(x, y + h / 2 - 25, charData.name, {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: charData.colorHex
        }).setOrigin(0.5);

        // Hit area
        const hitArea = this.add.rectangle(x, y, w, h).setInteractive({ useHandCursor: true }).setAlpha(0.001);
        const highlight = this.add.graphics();

        hitArea.on('pointerover', () => {
            highlight.clear();
            highlight.lineStyle(3, 0xffffff, 0.8);
            highlight.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 10);
        });

        hitArea.on('pointerout', () => {
            if (this.selectedChar !== charData.id) {
                highlight.clear();
            }
        });

        hitArea.on('pointerdown', () => {
            this.selectCharacter(charData, x, y, w, h, highlight);
        });

        // Store references for deselection
        charData._highlight = highlight;
        charData._slotX = x;
        charData._slotY = y;
        charData._slotW = w;
        charData._slotH = h;
    }

    selectCharacter(charData, x, y, w, h, highlight) {
        // Clear previous selection
        Object.values(CHARACTERS).forEach(c => {
            if (c._highlight) c._highlight.clear();
        });

        this.selectedChar = charData.id;

        // Highlight selected
        highlight.clear();
        highlight.lineStyle(3, 0xffffff, 1);
        highlight.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 10);

        // Update detail panel
        this.detailName.setText(charData.name);
        this.detailTitle.setText(charData.title + '  \u2022  ' + charData.instrument);
        this.detailTagline.setText('"' + charData.tagline + '"');

        // Show fight button
        this.fightBtnBg.clear();
        this.fightBtnBg.fillStyle(0x8B00FF, 0.9);
        this.fightBtnBg.fillRoundedRect(530, 625, 220, 50, 10);
        this.fightBtnBg.lineStyle(2, 0xC0C0C0, 1);
        this.fightBtnBg.strokeRoundedRect(530, 625, 220, 50, 10);
        this.fightBtnText.setAlpha(1);
        this.fightBtn.setVisible(true);
    }

    createLockedSlot(x, y, w, h) {
        const bg = this.add.graphics();
        bg.fillStyle(0x111122, 0.6);
        bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
        bg.lineStyle(1, 0x333344, 0.5);
        bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 10);

        // Lock icon (simple text)
        this.add.text(x, y - 10, '?', {
            fontSize: '48px', fontFamily: 'Arial', fontStyle: 'bold', color: '#333344'
        }).setOrigin(0.5);

        this.add.text(x, y + 40, 'LOCKED', {
            fontSize: '12px', fontFamily: 'monospace', color: '#333344'
        }).setOrigin(0.5);
    }
}
