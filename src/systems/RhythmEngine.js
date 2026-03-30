class RhythmEngine {
    constructor(scene, config) {
        this.scene = scene;
        this.laneCount = 4;
        this.notes = [];
        this.activeNotes = [];
        this.nextNoteIndex = 0;
        this.results = { perfect: 0, great: 0, good: 0, miss: 0, combo: 0, maxCombo: 0, score: 0 };

        // Layout
        this.trackY = config.trackY || 520;
        this.trackHeight = config.trackHeight || 180;
        this.trackWidth = 1280;
        this.hitZoneX = config.hitZoneX || 160;
        this.laneHeight = this.trackHeight / this.laneCount;
        this.noteSpeed = config.noteSpeed || 450;
        this.spawnAheadTime = (this.trackWidth - this.hitZoneX + 100) / this.noteSpeed;

        // Timing windows
        this.PERFECT_WINDOW = 0.055;
        this.GREAT_WINDOW = 0.110;
        this.GOOD_WINDOW = 0.160;

        this.color = config.color || 0xffffff;
        this.colorHex = config.colorHex || '#ffffff';
        this.isAI = config.isAI || false;
        this.label = config.label || '';

        this.callbacks = {
            onHit: config.onHit || (() => {}),
            onMiss: config.onMiss || (() => {})
        };

        this.container = scene.add.container(0, 0).setDepth(config.depth || 100);

        // Synthesized hit sounds
        this.audioCtx = scene.sound.context;

        this.drawTrack();
    }

    drawTrack() {
        const y = this.trackY;
        const h = this.trackHeight;

        // Track background — gradient dark panel
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x0a0a1e, 0.82);
        bg.fillRoundedRect(0, y, this.trackWidth, h, 6);
        // Top edge glow
        bg.lineStyle(1, this.color, 0.25);
        bg.lineBetween(0, y, this.trackWidth, y);
        this.container.add(bg);

        // Lane dividers (subtle)
        const lanes = this.scene.add.graphics();
        lanes.lineStyle(1, 0x222244, 0.35);
        for (let i = 1; i < this.laneCount; i++) {
            const ly = y + i * this.laneHeight;
            lanes.lineBetween(40, ly, this.trackWidth, ly);
        }
        this.container.add(lanes);

        // Hit zone
        const hz = this.scene.add.graphics();
        // Glow area
        hz.fillStyle(this.color, 0.08);
        hz.fillRect(this.hitZoneX - 35, y, 70, h);
        // Center line
        hz.lineStyle(2, this.color, 0.7);
        hz.lineBetween(this.hitZoneX, y + 2, this.hitZoneX, y + h - 2);
        // Hit markers per lane
        for (let i = 0; i < this.laneCount; i++) {
            const ly = y + i * this.laneHeight + this.laneHeight / 2;
            hz.fillStyle(this.color, 0.12);
            hz.fillCircle(this.hitZoneX, ly, 18);
        }
        this.container.add(hz);

        // Hit zone pulse (animated)
        this.hitPulse = this.scene.add.graphics().setDepth(101);
        this.container.add(this.hitPulse);

        // Lane labels
        if (!this.isAI) {
            const keys = ['D', 'F', 'J', 'K'];
            for (let i = 0; i < 4; i++) {
                const ly = y + i * this.laneHeight + this.laneHeight / 2;
                const lbl = this.scene.add.text(this.hitZoneX, ly, keys[i], {
                    fontSize: '16px', fontFamily: 'monospace', color: '#444466', fontStyle: 'bold'
                }).setOrigin(0.5).setAlpha(0.6);
                this.container.add(lbl);
            }
        } else {
            // AI label
            const lbl = this.scene.add.text(20, y + h / 2, this.label || 'AI', {
                fontSize: '12px', fontFamily: 'monospace', color: this.colorHex
            }).setOrigin(0, 0.5).setAlpha(0.5);
            this.container.add(lbl);
        }

        // Feedback text
        this.feedbackText = this.scene.add.text(this.hitZoneX + 90, y - 22, '', {
            fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(120);
        this.container.add(this.feedbackText);

        // Combo text — more prominent
        this.comboText = this.scene.add.text(this.hitZoneX + 90, y + h + 22, '', {
            fontSize: '22px', fontFamily: 'Arial Black, Impact, sans-serif', fontStyle: 'bold', color: '#ffcc00',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(120);
        this.container.add(this.comboText);
    }

    loadNotes(beatmapData, phaseFilter) {
        // Filter notes for requested phases
        const filtered = beatmapData.notes.filter(n => {
            if (phaseFilter && !phaseFilter.includes(n.phase)) return false;
            if (n.lane < 0 || n.lane > 3) return false;
            return true;
        });

        // Append to existing notes (for phase transitions)
        const startId = this.notes.length;
        const newNotes = filtered.map((n, i) => ({
            id: startId + i,
            time: n.time,
            lane: n.lane,
            type: n.type || 'normal',
            phase: n.phase,
            hit: false,
            missed: false,
            sprite: null,
            glow: null
        }));

        this.notes = this.notes.concat(newNotes);
        // Sort by time
        this.notes.sort((a, b) => a.time - b.time);
        // Reset next index to handle merged notes
        this.nextNoteIndex = this.notes.findIndex(n => !n.hit && !n.missed && !n.sprite);
        if (this.nextNoteIndex < 0) this.nextNoteIndex = this.notes.length;
    }

    clearNotes() {
        this.activeNotes.forEach(n => this.destroyNoteVisual(n));
        this.activeNotes = [];
        this.notes = [];
        this.nextNoteIndex = 0;
    }

    update(musicTime) {
        // Spawn approaching notes
        while (this.nextNoteIndex < this.notes.length) {
            const note = this.notes[this.nextNoteIndex];
            if (note.hit || note.missed) { this.nextNoteIndex++; continue; }
            if (note.time - musicTime <= this.spawnAheadTime) {
                this.spawnNote(note);
                this.activeNotes.push(note);
                this.nextNoteIndex++;
            } else {
                break;
            }
        }

        // Update positions + check misses
        for (let i = this.activeNotes.length - 1; i >= 0; i--) {
            const note = this.activeNotes[i];
            if (!note.sprite) { this.activeNotes.splice(i, 1); continue; }

            const timeDiff = note.time - musicTime;
            const x = this.hitZoneX + timeDiff * this.noteSpeed;
            note.sprite.x = x;
            if (note.glow) note.glow.x = x;
            if (note.trail) note.trail.x = x;

            // Miss check
            if (timeDiff < -this.GOOD_WINDOW && !note.hit) {
                note.missed = true;
                this.handleMiss(note);
                this.activeNotes.splice(i, 1);
            }

            // Cleanup far past notes
            if (x < -60) {
                this.destroyNoteVisual(note);
                this.activeNotes.splice(i, 1);
            }
        }
    }

    spawnNote(note) {
        const laneY = this.trackY + note.lane * this.laneHeight + this.laneHeight / 2;
        const x = this.trackWidth + 60;
        const isAccent = note.type === 'accent';

        // Glow behind note
        const glowSize = isAccent ? 24 : 16;
        const glow = this.scene.add.circle(x, laneY, glowSize, this.color, isAccent ? 0.3 : 0.15);
        glow.setDepth(101);
        note.glow = glow;
        this.container.add(glow);

        // Diamond shape using a rotated rectangle
        const size = isAccent ? 14 : 10;
        const diamond = this.scene.add.rectangle(x, laneY, size, size, isAccent ? 0xffffff : this.color);
        diamond.setRotation(Math.PI / 4);
        diamond.setDepth(102);
        note.sprite = diamond;
        this.container.add(diamond);

        // Small trail line for accent
        if (isAccent) {
            const trail = this.scene.add.rectangle(x + size, laneY, 20, 2, this.color, 0.4);
            trail.setDepth(101);
            note.trail = trail;
            this.container.add(trail);
        }
    }

    tryHit(lane, musicTime) {
        let bestNote = null;
        let bestDiff = Infinity;

        for (const note of this.activeNotes) {
            if (note.lane !== lane || note.hit || note.missed) continue;
            const diff = Math.abs(note.time - musicTime);
            if (diff < bestDiff && diff <= this.GOOD_WINDOW) {
                bestDiff = diff;
                bestNote = note;
            }
        }

        if (!bestNote) return null;

        bestNote.hit = true;
        let rating;
        if (bestDiff <= this.PERFECT_WINDOW) {
            rating = 'PERFECT';
            this.results.perfect++;
            this.results.score += bestNote.type === 'accent' ? 300 : 200;
        } else if (bestDiff <= this.GREAT_WINDOW) {
            rating = 'GREAT';
            this.results.great++;
            this.results.score += bestNote.type === 'accent' ? 200 : 100;
        } else {
            rating = 'GOOD';
            this.results.good++;
            this.results.score += bestNote.type === 'accent' ? 100 : 50;
        }

        this.results.combo++;
        if (this.results.combo > this.results.maxCombo) {
            this.results.maxCombo = this.results.combo;
        }

        this.showFeedback(rating);
        this.showHitEffect(bestNote);
        this.playHitSound(rating);
        this.destroyNoteVisual(bestNote);

        const idx = this.activeNotes.indexOf(bestNote);
        if (idx >= 0) this.activeNotes.splice(idx, 1);

        this.callbacks.onHit(rating, bestNote);
        return rating;
    }

    // AI auto-hit: organic, streaky, makes mistakes
    aiHit(lane, musicTime) {
        let bestNote = null;
        let bestDiff = Infinity;

        for (const note of this.activeNotes) {
            if (note.lane !== lane || note.hit || note.missed) continue;
            const diff = Math.abs(note.time - musicTime);
            if (diff < bestDiff && diff <= 0.2) {
                bestDiff = diff;
                bestNote = note;
            }
        }

        if (!bestNote) return null;

        bestNote.hit = true;

        // Organic AI: streaky behavior
        // Track mood: AI goes through hot/cold streaks
        if (!this._aiMood) this._aiMood = 0.6; // 0=terrible, 1=on fire
        // Drift mood organically
        this._aiMood += (Math.random() - 0.48) * 0.08; // slightly biased upward
        this._aiMood = Phaser.Math.Clamp(this._aiMood, 0.15, 0.92);

        // Combo affects mood: long combos = more confident, misses = nervous
        if (this.results.combo > 10) this._aiMood = Math.min(0.92, this._aiMood + 0.02);
        if (this.results.combo === 0) this._aiMood = Math.max(0.2, this._aiMood - 0.05);

        // Accent notes are harder — mood penalty
        const isAccent = bestNote.type === 'accent';
        const effectiveMood = isAccent ? this._aiMood * 0.85 : this._aiMood;

        const roll = Math.random();
        let rating;
        if (roll < effectiveMood * 0.4) { rating = 'PERFECT'; this.results.perfect++; }
        else if (roll < effectiveMood * 0.75) { rating = 'GREAT'; this.results.great++; }
        else if (roll < effectiveMood * 0.92) { rating = 'GOOD'; this.results.good++; }
        else { rating = 'MISS'; this.results.miss++; }

        if (rating !== 'MISS') {
            this.results.combo++;
            if (this.results.combo > this.results.maxCombo) this.results.maxCombo = this.results.combo;
            this.showFeedback(rating);
            this.showHitEffect(bestNote);
        } else {
            this.results.combo = 0;
            this.showFeedback('MISS');
            // Mood tanks after a miss
            this._aiMood = Math.max(0.2, this._aiMood - 0.1);
        }

        this.destroyNoteVisual(bestNote);
        const idx = this.activeNotes.indexOf(bestNote);
        if (idx >= 0) this.activeNotes.splice(idx, 1);

        this.callbacks.onHit(rating, bestNote);
        return rating;
    }

    handleMiss(note) {
        this.results.miss++;
        this.results.combo = 0;
        this.showFeedback('MISS');
        this.playMissSound();
        this.destroyNoteVisual(note);
        this.callbacks.onMiss(note);
    }

    showFeedback(rating) {
        const colors = {
            'PERFECT': '#00ffff',
            'GREAT': '#00ff88',
            'GOOD': '#ffcc00',
            'MISS': '#ff3333'
        };
        this.feedbackText.setText(rating);
        this.feedbackText.setColor(colors[rating]);
        this.feedbackText.setAlpha(1).setScale(1.2);

        this.scene.tweens.add({
            targets: this.feedbackText,
            alpha: 0, scaleX: 1, scaleY: 1,
            duration: 450, ease: 'Power2'
        });

        if (this.results.combo > 1) {
            this.comboText.setText(this.results.combo + 'x COMBO');
            this.comboText.setAlpha(1).setScale(1.2);
            this.scene.tweens.add({ targets: this.comboText, scaleX: 1, scaleY: 1, duration: 150 });
        } else if (rating === 'MISS') {
            this.comboText.setAlpha(0);
        }
    }

    showHitEffect(note) {
        const laneY = this.trackY + note.lane * this.laneHeight + this.laneHeight / 2;
        // Expanding ring
        const ring = this.scene.add.circle(this.hitZoneX, laneY, 5, this.color, 0.8).setDepth(110);
        this.scene.tweens.add({
            targets: ring,
            scaleX: 4, scaleY: 4, alpha: 0,
            duration: 250, ease: 'Power2',
            onComplete: () => ring.destroy()
        });
        // Flash on lane
        const flash = this.scene.add.rectangle(this.hitZoneX, laneY, 80, this.laneHeight - 4, this.color, 0.2).setDepth(105);
        this.scene.tweens.add({
            targets: flash, alpha: 0, duration: 150,
            onComplete: () => flash.destroy()
        });
    }

    playHitSound(rating) {
        if (!this.audioCtx || this.isAI) return;
        try {
            const ctx = this.audioCtx;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (rating === 'PERFECT') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.05);
                gain.gain.setValueAtTime(0.12, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.12);
            } else if (rating === 'GREAT') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(660, ctx.currentTime);
                gain.gain.setValueAtTime(0.08, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.08);
            } else if (rating === 'GOOD') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, ctx.currentTime);
                gain.gain.setValueAtTime(0.05, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.06);
            }
        } catch(e) {}
    }

    playMissSound() {
        if (!this.audioCtx || this.isAI) return;
        try {
            const ctx = this.audioCtx;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.06, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.1);
        } catch(e) {}
    }

    pulseBeat() {
        if (!this.hitPulse) return;
        this.hitPulse.clear();
        this.hitPulse.lineStyle(2, this.color, 0.4);
        this.hitPulse.lineBetween(this.hitZoneX, this.trackY + 2, this.hitZoneX, this.trackY + this.trackHeight - 2);
        this.scene.tweens.addCounter({
            from: 0.4, to: 0, duration: 200,
            onUpdate: (t) => {
                this.hitPulse.clear();
                this.hitPulse.lineStyle(2, this.color, t.getValue());
                this.hitPulse.lineBetween(this.hitZoneX, this.trackY + 2, this.hitZoneX, this.trackY + this.trackHeight - 2);
            }
        });
    }

    destroyNoteVisual(note) {
        if (note.sprite) { note.sprite.destroy(); note.sprite = null; }
        if (note.glow) { note.glow.destroy(); note.glow = null; }
        if (note.trail) { note.trail.destroy(); note.trail = null; }
    }

    getAccuracy() {
        const total = this.results.perfect + this.results.great + this.results.good + this.results.miss;
        if (total === 0) return 0;
        return (this.results.perfect * 1.5 + this.results.great * 1.0 + this.results.good * 0.5) / total;
    }

    setVisible(v) {
        this.container.setVisible(v);
    }

    destroy() {
        this.activeNotes.forEach(n => this.destroyNoteVisual(n));
        this.container.destroy();
    }
}
