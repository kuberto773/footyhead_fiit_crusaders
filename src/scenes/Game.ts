import { Scene } from 'phaser';

export class Game extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    cursors?: Phaser.Types.Input.Keyboard.CursorKeys
    background: Phaser.GameObjects.Image;
    msg_text: Phaser.GameObjects.Text;
    player: Phaser.Physics.Arcade.Sprite
    boot: Phaser.Physics.Arcade.Sprite
    ball: Phaser.Physics.Arcade.Image
    container: Phaser.Physics.Arcade.Group
    platforms: Phaser.Physics.Arcade.StaticGroup
    music: Phaser.Sound.BaseSound

    constructor() {
        super('Game');
    }

    preload() {
        this.load.image("sprite-1", "assets/SHF-dump/players/274.png")
        this.load.image("boot-1", "assets/SHF-dump/boots/320.png")
        this.load.image("ground", "assets/SHF-dump/109.png")
        this.load.image("football", "assets/SHF-dump/sprites/DefineSprite_86/1.png")
        this.load.audio('kick', "assets/sounds/5_KickSound.mp3")
    }

    create() {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x4287f5);   // What's the difference between camera and image bg?

        this.background = this.add.image(512, 384, 'background');
        this.background.setAlpha(0.5);

        // TODO: Sound effects
        // this.music = this.sound.add('kick')

        this.ball = this.physics.add.image(150, 500, 'football')
        this.ball.setCircle(10)
        this.ball.setCollideWorldBounds(true);
        this.ball.setBounce(1, 0.5)
        this.ball.setDragX(200)

        this.platforms = this.physics.add.staticGroup()
        this.platforms.create(512, 600, 'ground').setScale(1.3, 1).refreshBody();

        this.player = this.physics.add.sprite(100, 500, 'sprite-1')
        this.player.setCollideWorldBounds(true)
        this.player.setDragX(500)
        this.player.setCircle(24, 1)

        // TODO: Add boot
        // this.boot = this.physics.add.sprite(100, 500, 'boot-1')
        // this.container = this.physics.add.group({ collideWorldBounds: true, dragX: 500 })
        // this.container.add(this.player)
        // this.container.add(this.boot)

        this.cursors = this.input.keyboard?.createCursorKeys()
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.player, this.ball);
        this.physics.add.collider(this.platforms, this.ball);
    }

    update(_time: number, _delta: number) {
        if (this.player.body?.velocity == undefined || this.ball.body?.velocity == undefined) {
            console.log("undefined")
            return
        }

        if (this.cursors?.left.isDown) {
            this.player.setVelocityX(-160);
        }
        else if (this.cursors?.right.isDown) {
            this.player.setVelocityX(160);
        }

        // TODO: Add boot
        // if (this.cursors?.space.isDown) { }

        if (this.cursors?.up.isDown && this.player.body?.touching.down) {
            this.player.setVelocityY(-200);
        }

        if (this.physics.overlap(this.player, this.ball)) {
            const modifier = this.player.body?.velocity.x > 0 ? 50 : -50
            this.ball.setVelocity(this.player.body?.velocity.x + modifier, this.getRandomIntInclusive(-125, -50))
        }
    }

    getRandomIntInclusive(min: number, max: number) {
        const minCeiled = Math.ceil(min);
        const maxFloored = Math.floor(max);
        return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled); // The maximum is inclusive and the minimum is inclusive
    }
}
