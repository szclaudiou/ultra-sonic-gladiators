const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: document.body,
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720,
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
