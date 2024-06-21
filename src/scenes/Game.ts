import { Scene } from 'phaser';

export class Game extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    background: Phaser.GameObjects.Image;
    msg_text: Phaser.GameObjects.Text;
    player: Phaser.Physics.Arcade.Sprite;
    boot: Phaser.Physics.Arcade.Sprite;
    ball: Phaser.Physics.Arcade.Image;
    container: Phaser.Physics.Arcade.Group;
    platforms: Phaser.Physics.Arcade.StaticGroup;
    music: Phaser.Sound.BaseSound;

    constructor() {
        super('Game');
    }

    preload() {
        this.load.image('sprite-1', 'assets/SHF-dump/players/274.png');
        this.load.image('boot-1', 'assets/SHF-dump/boots/320.png');
        this.load.image('ground', 'assets/SHF-dump/109.png');
        this.load.image(
            'football',
            'assets/SHF-dump/sprites/DefineSprite_86/1.png',
        );
        this.load.audio('kick', 'assets/sounds/5_KickSound.mp3');
    }

    create() {
        this.msg_text = this.add.text(512, 75, 'FOOTY HEAD', {
            fontFamily: 'Arial Black',
            fontSize: 64,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center',
        });
        this.msg_text.setOrigin(0.5);

        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x4287f5); // What's the difference between camera and image bg?

        this.background = this.add.image(512, 384, 'background');
        this.background.setAlpha(0.5);

        // TODO: Sound effects
        // this.music = this.sound.add('kick')

        this.ball = this.physics.add.image(150, 500, 'football');
        this.ball.setCircle(10);
        this.ball.setCollideWorldBounds(true);
        this.ball.setBounce(1, 0.5);
        this.ball.setDragX(200);
        this.ball.setAngularDrag(700);

        this.platforms = this.physics.add.staticGroup();
        this.platforms
            .create(512, 600, 'ground')
            .setScale(1.3, 1)
            .refreshBody();

        this.player = this.physics.add.sprite(100, 500, 'sprite-1');
        // TODO: Custom hitbox https://github.com/phaserjs/examples/blob/master/public/src/input/mouse/polygon%20hit%20area.js
        this.player.setCircle(22, 4, 2);
        this.player.setCollideWorldBounds(true);
        this.player.setDragX(500);

        // TODO: Add boot
        // this.boot = this.physics.add.sprite(100, 500, 'boot-1')
        // this.container = this.physics.add.group({ collideWorldBounds: true, dragX: 500 })
        // this.container.add(this.player)
        // this.container.add(this.boot)

        this.cursors = this.input.keyboard?.createCursorKeys();
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.player, this.ball);
        this.physics.add.collider(this.platforms, this.ball);
    }

    update(_time: number, _delta: number) {
        if (
            this.player.body?.velocity == undefined ||
            this.ball.body?.velocity == undefined
        ) {
            console.log('undefined');
            return;
        }

        let footballVelocityModifierX = 0;
        let footballVelocityModifierY = 0;
        let footballAngularVelocity = 0;

        if (this.cursors?.left.isDown) {
            if (this.cursors?.left.getDuration() < 500) {
                footballVelocityModifierX = -40;
            } else {
                footballVelocityModifierX = -100;
                footballVelocityModifierY = -100;
            }
            this.player.setVelocityX(-160);
            footballAngularVelocity = -700;
        } else if (this.cursors?.right.isDown) {
            if (this.cursors?.right.getDuration() < 500) {
                footballVelocityModifierX = 40;
            } else {
                footballVelocityModifierX = 100;
                footballVelocityModifierY = -100;
            }
            this.player.setVelocityX(160);
            footballAngularVelocity = 700;
        }

        // TODO: Add boot
        // if (this.cursors?.space.isDown) { }

        if (this.cursors?.up.isDown && this.player.body?.touching.down) {
            this.player.setVelocityY(-180);
        }

        if (
            this.physics.overlap(this.player, this.ball) &&
            this.player.body.velocity.x != 0
        ) {
            this.ball.setAngularVelocity(footballAngularVelocity);
            this.ball.setVelocity(
                this.player.body?.velocity.x + footballVelocityModifierX,
                footballVelocityModifierY,
            );
        }
    }

    // getRandomIntInclusive(min: number, max: number) {
    //     const minCeiled = Math.ceil(min);
    //     const maxFloored = Math.floor(max);
    //     return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled); // The maximum is inclusive and the minimum is inclusive
    // }
}
