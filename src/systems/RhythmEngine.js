class RhythmEngine {
    constructor(scene, config) {
        this.scene = scene;
        this.laneCount = 4;
        this.notes = [];
        this.activeNotes = [];
        this.nextNoteIndex = 0;
        this.results = { perfect: 0, great: 0, good: 0, miss: 0, combo: 0, maxCombo: 0, score: 0 };

        // Layout
        this.trackY = config.trackY || 510;
        this.trackHeight = config.trackHeight || 200;
        this.trackWidth = config.trackWidth || 1280;
        this.hitZoneX = config.hitZoneX || 150;
        this.laneHeight = this.trackHeight / this.laneCount;
        this.noteSpeed = config.noteSpeed || 500; // px per second
        this.spawnAheadTime = (this.trackWidth - this.hitZoneX) / this.noteSpeed;

        // Timing windows (in seconds)
        this.PERFECT_WINDOW = 0.050;
        this.GREAT_WINDOW = 0.100;
        this.GOOD_WINDOW = 0.150;

        // Visual containers
        this.container = scene.add.container(0, 0).setDepth(100);
        this.notePool = [];

        // Track identifier for dual-track mode
        this.trackId = config.trackId || 'primary';
        this.color = config.color || 0xffffff;
        this.isSecondary = config.isSecondary || false;

        this.callbacks = {
            onHit: config.onHit || (() => {}),
            onMiss: config.onMiss || (() => {})
        };

        this.drawTrack();
    }

    drawTrack() {
        // Semi-transparent track background
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x000000, 0.7);
        bg.fillRoundedRect(0, this.trackY, this.trackWidth, this.trackHeight, 8);
        this.container.add(bg);

        // Lane dividers
        const lines = this.scene.add.graphics();
        lines.lineStyle(1, 0x333366, 0.5);
        for (let i = 1; i < this.laneCount; i++) {
            const y = this.trackY + i * this.laneHeight;
            lines.lineBetween(0, y, this.trackWidth, y);
        }
        this.container.add(lines);

        // Hit zone glow
        const hitZone = this.scene.add.graphics();
        hitZone.fillStyle(this.color, 0.15);
        hitZone.fillRect(this.hitZoneX - 30, this.trackY, 60, this.trackHeight);
        hitZone.lineStyle(2, this.color, 0.6);
        hitZone.lineBetween(this.hitZoneX, this.trackY, this.hitZoneX, this.trackY + this.trackHeight);
        this.container.add(hitZone);

        // Lane labels
        const keys = this.isSecondary ? ['', '', '', ''] : ['D', 'F', 'J', 'K'];
        for (let i = 0; i < this.laneCount; i++) {
            const y = this.trackY + i * this.laneHeight + this.laneHeight / 2;
            if (keys[i]) {
                const label = this.scene.add.text(this.hitZoneX, y, keys[i], {
                    fontSize: '20px', fontFamily: 'monospace', color: '#666688'
                }).setOrigin(0.5).setAlpha(0.5);
                this.container.add(label);
            }
        }

        // Feedback text
        this.feedbackText = this.scene.add.text(this.hitZoneX + 80, this.trackY - 30, '', {
            fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(110);
        this.container.add(this.feedbackText);

        // Combo text
        this.comboText = this.scene.add.text(this.hitZoneX + 80, this.trackY + this.trackHeight + 25, '', {
            fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: '#ffcc00'
        }).setOrigin(0.5).setDepth(110);
        this.container.add(this.comboText);
    }

    loadNotes(beatmapData, phaseFilter) {
        this.notes = beatmapData.notes
            .filter(n => {
                if (phaseFilter && !phaseFilter.includes(n.phase)) return false;
                if (n.lane < 0 || n.lane > 3) return false; // filter invalid lanes
                return true;
            })
            .map((n, i) => ({
                id: i,
                time: n.time,
                lane: n.lane,
                type: n.type,
                phase: n.phase,
                hit: false,
                missed: false
            }));
        this.nextNoteIndex = 0;
        this.activeNotes = [];
    }

    update(musicTime) {
        // Spawn notes that are approaching
        while (this.nextNoteIndex < this.notes.length) {
            const note = this.notes[this.nextNoteIndex];
            if (note.time - musicTime <= this.spawnAheadTime) {
                this.spawnNote(note);
                this.activeNotes.push(note);
                this.nextNoteIndex++;
            } else {
                break;
            }
        }

        // Update active note positions & check for misses
        for (let i = this.activeNotes.length - 1; i >= 0; i--) {
            const note = this.activeNotes[i];
            if (note.sprite) {
                const timeDiff = note.time - musicTime;
                const x = this.hitZoneX + timeDiff * this.noteSpeed;
                note.sprite.x = x;
                if (note.glow) note.glow.x = x;

                // Missed - past the hit zone by too much
                if (timeDiff < -this.GOOD_WINDOW && !note.hit) {
                    note.missed = true;
                    this.handleMiss(note);
                    this.activeNotes.splice(i, 1);
                }

                // Way past - cleanup
                if (x < -50) {
                    this.destroyNoteVisual(note);
                    this.activeNotes.splice(i, 1);
                }
            }
        }
    }

    spawnNote(note) {
        const y = this.trackY + note.lane * this.laneHeight + this.laneHeight / 2;
        const x = this.trackWidth + 50;
        const isAccent = note.type === 'accent';

        // Glow behind accent notes
        if (isAccent) {
            const glow = this.scene.add.circle(x, y, 20, this.color, 0.3).setDepth(101);
            note.glow = glow;
            this.container.add(glow);
        }

        // Note visual
        const size = isAccent ? 16 : 12;
        const noteColor = isAccent ? 0xffffff : this.color;
        const sprite = this.scene.add.circle(x, y, size, noteColor).setDepth(102);

        // Inner dot for accent
        if (isAccent) {
            const inner = this.scene.add.circle(x, y, 6, this.color).setDepth(103);
            note.inner = inner;
            this.container.add(inner);
        }

        note.sprite = sprite;
        this.container.add(sprite);
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
        this.feedbackText.setAlpha(1);
        this.feedbackText.setScale(1.3);

        this.scene.tweens.add({
            targets: this.feedbackText,
            alpha: 0,
            scaleX: 1,
            scaleY: 1,
            duration: 500,
            ease: 'Power2'
        });

        // Update combo display
        if (this.results.combo > 1) {
            this.comboText.setText(this.results.combo + 'x COMBO');
            this.comboText.setAlpha(1);
        } else if (rating === 'MISS') {
            this.comboText.setAlpha(0);
        }
    }

    showHitEffect(note) {
        const y = this.trackY + note.lane * this.laneHeight + this.laneHeight / 2;
        const circle = this.scene.add.circle(this.hitZoneX, y, 5, this.color, 1).setDepth(105);
        this.scene.tweens.add({
            targets: circle,
            scaleX: 4,
            scaleY: 4,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => circle.destroy()
        });
    }

    destroyNoteVisual(note) {
        if (note.sprite) { note.sprite.destroy(); note.sprite = null; }
        if (note.glow) { note.glow.destroy(); note.glow = null; }
        if (note.inner) { note.inner.destroy(); note.inner = null; }
    }

    getAccuracy() {
        const total = this.results.perfect + this.results.great + this.results.good + this.results.miss;
        if (total === 0) return 0;
        return (this.results.perfect * 1.5 + this.results.great * 1.0 + this.results.good * 0.5) / total;
    }

    getTotalNotes() {
        return this.results.perfect + this.results.great + this.results.good + this.results.miss;
    }

    destroy() {
        this.container.destroy();
    }
}
