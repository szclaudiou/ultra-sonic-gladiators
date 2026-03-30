class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.tracks = {};
        this.musicStartTime = 0;
        this.playing = false;
    }

    addTrack(key, audioKey) {
        const sound = this.scene.sound.add(audioKey, { loop: false, volume: 0 });
        this.tracks[key] = sound;
        return sound;
    }

    startBattle() {
        this.musicStartTime = this.scene.time.now;
        Object.values(this.tracks).forEach(track => {
            track.play();
        });
        this.playing = true;
    }

    getMusicTime() {
        if (!this.playing) return 0;
        const firstTrack = Object.values(this.tracks)[0];
        if (firstTrack && firstTrack.isPlaying) {
            return firstTrack.seek;
        }
        return (this.scene.time.now - this.musicStartTime) / 1000;
    }

    setVolume(key, volume) {
        if (this.tracks[key]) {
            this.tracks[key].setVolume(volume);
        }
    }

    setPhaseVolumes(phase, playerChar, opponentChar) {
        if (phase === 1) {
            this.setVolume(playerChar, 1.0);
            this.setVolume(opponentChar, 0.15);
        } else if (phase === 2) {
            this.setVolume(playerChar, 0.15);
            this.setVolume(opponentChar, 1.0);
        } else {
            this.setVolume(playerChar, 1.0);
            this.setVolume(opponentChar, 1.0);
        }
    }

    stopAll() {
        this.playing = false;
        Object.values(this.tracks).forEach(track => {
            if (track.isPlaying) track.stop();
        });
    }

    destroy() {
        this.stopAll();
        this.tracks = {};
    }
}
