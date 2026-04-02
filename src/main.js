const config = {
    type: Phaser.AUTO,
    parent: document.body,
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%',
        min: { width: 320, height: 480 },
        max: { width: 1920, height: 1080 }
    },
    scene: [MenuScene, CharSelectScene, BattleScene, ResultScene],
    audio: {
        disableWebAudio: false
    },
    input: {
        activePointers: 4
    },
    render: {
        antialias: true,
        pixelArt: false,
        transparent: false
    }
};

window.game = new Phaser.Game(config);
