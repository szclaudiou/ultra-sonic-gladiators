class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.tracks = {};
        this.musicStartTime = 0;
        this.playing = false;
        this.startOffset = 0;
    }

    addTrack(key, audioKey, initialVolume = 0) {
        const sound = this.scene.sound.add(audioKey, { loop: false, volume: initialVolume });
        this.tracks[key] = sound;
        return sound;
    }

    setPhaseVolumes(phase, playerCharKey, opponentCharKey) {
        if (phase === 1) {
            this.setVolume(playerCharKey, 1.0);
            this.setVolume(opponentCharKey, 0.12);
        } else if (phase === 2) {
            this.setVolume(playerCharKey, 0.12);
            this.setVolume(opponentCharKey, 1.0);
        } else {
            this.setVolume(playerCharKey, 1.0);
            this.setVolume(opponentCharKey, 1.0);
        }
    }

    startBattle() {
        // Unlock audio context if needed (browser autoplay policy)
        if (this.scene.sound.context && this.scene.sound.context.state === 'suspended') {
            this.scene.sound.context.resume();
        }

        this.musicStartTime = this.scene.time.now;
        Object.values(this.tracks).forEach(track => {
            track.play();
        });
        this.playing = true;
    }

    getMusicTime() {
        if (!this.playing) return 0;
        // Use the first track's seek position for accurate timing
        const firstTrack = Object.values(this.tracks)[0];
        if (firstTrack && firstTrack.isPlaying) {
            return firstTrack.seek;
        }
        // Fallback to scene timer
        return (this.scene.time.now - this.musicStartTime) / 1000;
    }

    setVolume(key, volume) {
        if (this.tracks[key]) {
            this.scene.tweens.add({
                targets: this.tracks[key],
                volume: volume,
                duration: 300
            });
        }
    }

    setVolumeImmediate(key, volume) {
        if (this.tracks[key]) {
            this.tracks[key].setVolume(volume);
        }
    }

    stopAll() {
        this.playing = false;
        Object.values(this.tracks).forEach(track => {
            try { if (track.isPlaying) track.stop(); } catch(e) {}
        });
    }

    destroy() {
        this.stopAll();
        // Properly dispose of sound objects
        Object.values(this.tracks).forEach(track => {
            if (track && !track.destroyed) {
                track.destroy();
            }
        });
        this.tracks = {};
    }
}
