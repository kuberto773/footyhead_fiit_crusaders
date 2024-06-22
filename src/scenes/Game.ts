import { BodyType } from 'matter';
import { Scene } from 'phaser';
import _random from 'lodash/random';

export class Game extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    cursors_2: any;
    background: Phaser.GameObjects.Image;
    msg_text: Phaser.GameObjects.Text;
    player: Phaser.Physics.Matter.Sprite;
    boot: Phaser.Physics.Matter.Sprite;
    ball: Phaser.Physics.Matter.Image;
    platforms: Phaser.Physics.Matter.Image;
    isGrounded: boolean;
    FOOTBALL_VELOCITY_MODIFIER: Phaser.Types.Math.Vector2Like;

    constructor() {
        super('Game');
        this.FOOTBALL_VELOCITY_MODIFIER = { x: 0, y: 0 };
    }

    preload() {
        this.load.image('sprite-1', 'assets/SHF-dump/players/274.png');
        this.load.image('boot-1', 'assets/SHF-dump/boots/320.png');
        this.load.image('ground', 'assets/SHF-dump/109.png');
        this.load.image(
            'football',
            'assets/SHF-dump/sprites/DefineSprite_86/1.png',
        );

        this.load.audio('ball-touch', 'assets/sounds/5_KickSound.mp3');
        this.load.audio('jump', 'assets/sounds/6_JumpSound.mp3');

        // this.load.json('shapes', 'assets/SHF-dump/json/shapes.json');
    }

    create() {
        const cat_ball = 0b0100;
        const cat_boot = 0b1000;

        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x4287f5); // What's the difference between camera and image bg?

        this.background = this.add.image(512, 384, 'background');
        this.background.setAlpha(0.5);

        this.sound.add('ball-touch');
        this.sound.add('jump');

        this.msg_text = this.add.text(512, 75, 'FOOTY HEAD', {
            fontFamily: 'Arial Black',
            fontSize: 64,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center',
        });
        this.msg_text.setOrigin(0.5);

        this.cursors =
            this.input.keyboard?.createCursorKeys() as Phaser.Types.Input.Keyboard.CursorKeys;
        this.cursors_2 = this.input.keyboard?.addKeys('W,A,S,D');

        // const shapes = this.cache.json.get('shapes');

        this.matter.world.setBounds();

        this.platforms = this.matter.add
            .image(512, 600, 'ground', undefined, {
                isStatic: true,
                label: 'ground',
            })
            .setScale(1.3, 1);

        this.player = this.matter.add
            .sprite(100, 550, 'sprite-1')
            .setCircle(22, { label: 'player' })
            .setMass(20)
            .setFixedRotation();

        this.ball = this.matter.add
            .image(250, 500, 'football')
            .setCircle(10, { label: 'football' })
            .setMass(5)
            .setBounce(0.9)
            .setFriction(0.1)
            .setCollisionCategory(cat_ball);

        this.boot = this.matter.add
            .sprite(100, 500, 'boot-1', undefined, {
                label: 'boot',
                // shape: shapes.boot,
            })
            .setRotation(-1.3)
            .setFixedRotation()
            .setCollisionCategory(cat_boot)
            .setCollidesWith(cat_ball);
        this.boot.body

        this.matter.add.constraint(
            this.player.body as BodyType,
            this.boot.body as BodyType,
            10  , 
            1,
            { pointA: { x: 15, y: 15 }, damping: 1 },
        );

        // TODO: Merge these two into one
        this.player.setOnCollideWith(this.platforms, () => {
            this.isGrounded = true;
        });
        this.player.setOnCollideWith(this.ball, () => {
            this.sound.play('ball-touch');
            this.ball.setVelocity(
                this.ball.getVelocity().x + this.FOOTBALL_VELOCITY_MODIFIER.x,
                this.ball.getVelocity().y + this.FOOTBALL_VELOCITY_MODIFIER.y,
            );
        });
        this.boot.setOnCollideWith(this.ball, () => {
            this.sound.play('ball-touch');
            if (this.cursors.space.isDown) {
                this.ball.setVelocity(
                    this.ball.getVelocity().x + 5,
                    this.ball.getVelocity().y + -8,
                );
            }
        });
        this.ball.setOnCollideWith(this.platforms, () => {
            this.sound.play('ball-touch');
        });
    }

    update(_time: number, _delta: number) {
        const { left, right, up, space, shift } = this.cursors;
        // const { W, A, S, D } = this.cursors_2;

        if (left.isDown) {
            this.player.setVelocityX(-2);
            this.FOOTBALL_VELOCITY_MODIFIER = {
                x: -3,
                y: _random(-2, -0.5, true),
            };
        } else if (right.isDown) {
            this.player.setVelocityX(2);
            this.FOOTBALL_VELOCITY_MODIFIER = {
                x: 3,
                y: _random(-2, -0.5, true),
            };
        }

        if (up.isDown && this.isGrounded) {
            this.sound.play('jump');
            this.player.setVelocityY(-8);
            this.isGrounded = false;
        }

        if (space.isDown) {
            if (space.getDuration() < 25) {
                this.boot.setVelocityX(10);
                this.boot.setVelocityX(10);
                this.player.setVelocityY(-1);
            }
        }

        // Debug
        if (shift.isDown && shift.ctrlKey) {
            this.ball.setX(250);
            this.ball.setY(500);
            this.player.setX(150);
            this.player.setY(500);
        }
    }
}
