import _random from 'lodash/random';
import { BodyType } from 'matter';
import { Scene } from 'phaser';

import { eitherOr, CollisionCategories } from '../lib';

export class Game extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    cursors_2: any;
    background: Phaser.GameObjects.Image;
    msg_text: Phaser.GameObjects.Text;
    player: Phaser.Physics.Matter.Image;
    boot: Phaser.Physics.Matter.Image;
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

        this.load.json('shapes', 'assets/SHF-dump/json/shapes.json');
    }

    create() {
        const {
            categoryBoot,
            categoryFootball,
            categoryPlatform,
            categoryPlayer,
        } = CollisionCategories;

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

        const shapes = this.cache.json.get('shapes');

        this.matter.world.setBounds();

        this.platforms = this.matter.add
            .image(512, 600, 'ground', undefined, { label: 'ground' })
            .setStatic(true)
            .setScale(1.3, 1)
            .setCollisionCategory(categoryPlatform)
            .setCollidesWith(categoryPlayer | categoryFootball);

        this.player = this.matter.add
            .image(100, 550, 'sprite-1')
            .setCircle(22, { label: 'player' })
            .setMass(20)
            .setFixedRotation()
            .setCollisionCategory(categoryPlayer)
            .setCollidesWith(categoryFootball | categoryPlatform);

        this.ball = this.matter.add
            .image(250, 500, 'football')
            .setCircle(10, { label: 'football' })
            .setMass(3)
            .setBounce(0.9)
            .setFriction(0.1, 0.005)
            .setCollisionCategory(categoryFootball)
            .setCollidesWith(categoryBoot | categoryPlayer | categoryPlatform);

        this.boot = this.matter.add
            .image(100, 500, 'boot-1', undefined, { shape: shapes.boot })
            .setRotation(-1.3)
            .setFixedRotation();
        // Join player and boot together
        this.matter.add.constraint(
            this.player.body as BodyType,
            this.boot.body as BodyType,
            7,
            0.8,
            { pointA: { x: 15, y: 15 } },
        );

        this.player.setOnCollideWith(this.platforms, () => {
            this.isGrounded = true;
        });

        this.ball.setOnCollide(
            ({
                bodyA: { label: labelA },
                bodyB: { label: labelB },
            }: Phaser.Types.Physics.Matter.MatterCollisionData) => {
                // Collides with boot
                if (eitherOr(labelA, labelB, 'football', 'boot')) {
                    this.sound.play('ball-touch');
                    if (this.cursors.space.isDown) {
                        this.ball.setVelocity(
                            this.ball.getVelocity().x + 5,
                            this.ball.getVelocity().y + -8,
                        );
                        this.ball.setAngularVelocity(
                            this.ball.getAngularVelocity() + 0.5,
                        );
                    }
                }
                // Collides with ground
                if (eitherOr(labelA, labelB, 'football', 'ground')) {
                    this.sound.play('ball-touch');
                }
                // Collides with player
                if (eitherOr(labelA, labelB, 'football', 'player')) {
                    this.sound.play('ball-touch');
                    const newVelocity = this.matter.vector.add(
                        this.ball.getVelocity(),
                        this.FOOTBALL_VELOCITY_MODIFIER,
                    );
                    this.ball.setVelocity(newVelocity.x, newVelocity.y);
                }
            },
        );
        this.sound.mute = true;
    }

    update(_time: number, _delta: number) {
        const { left, right, up, space, shift } = this.cursors;
        // const { W, A, S, D } = this.cursors_2;

        if (left.isDown) {
            this.player.setVelocityX(-2);
            this.FOOTBALL_VELOCITY_MODIFIER = {
                x: _random(-3, -1.5, true),
                y: _random(-2, -0.5, true),
            };
        } else if (right.isDown) {
            this.player.setVelocityX(2);
            this.FOOTBALL_VELOCITY_MODIFIER = {
                x: _random(3, 1.5, true),
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
