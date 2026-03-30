const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: document.body,
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [MenuScene, CharSelectScene, BattleScene, ResultScene],
    audio: {
        disableWebAudio: false
    },
    input: {
        activePointers: 4
    }
};

const game = new Phaser.Game(config);
