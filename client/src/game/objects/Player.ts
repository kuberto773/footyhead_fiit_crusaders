import { CollisionCategories, PlayerNumber } from '../lib';
import { BodyType } from 'matter';

const { categoryPlayer, categoryFootball, categoryPlatform } =
    CollisionCategories;
const playerPosX = { 1: 200, 2: 824 };

export class Player {
    player: Phaser.Physics.Matter.Image;
    boot: Phaser.Physics.Matter.Image;
    isGrounded: boolean;
    constraintA: MatterJS.ConstraintType;
    constraintB: MatterJS.ConstraintType;
    constructor(
        world: Phaser.Physics.Matter.World,
        playerNumber: PlayerNumber,
        playerOptions?: Phaser.Types.Physics.Matter.MatterBodyConfig,
        bootOptions?: Phaser.Types.Physics.Matter.MatterBodyConfig,
    ) {
        this.player = new Phaser.Physics.Matter.Image(
            world,
            playerPosX[playerNumber],
            500,
            `sprite-${playerNumber}`,
            undefined,
        );
        this.player.setCircle(22, {
            ...playerOptions,
            label: `player-${playerNumber}`,
        });
        this.player.setMass(20);
        this.player.setBounce(0.3);
        this.player.setFixedRotation();
        this.player.setFlipX(playerNumber == PlayerNumber.Two);
        this.player.setCollisionCategory(categoryPlayer);
        this.player.setCollidesWith(
            categoryFootball | categoryPlatform | categoryPlayer,
        );
        world.scene.add.existing(this.player);

        this.boot = new Phaser.Physics.Matter.Image(
            world,
            playerPosX[playerNumber],
            515,
            `boot-${playerNumber}`,
            undefined,
            {
                ...bootOptions,
                label: `boot-${playerNumber}`,
            },
        );
        this.boot.setRotation(playerNumber == PlayerNumber.One ? -1.3 : 1.3);
        this.boot.setFixedRotation();
        world.scene.add.existing(this.boot);

        // Add joints between boot and body
        if (playerNumber == PlayerNumber.One) {
            this.constraintA = this.player.scene.matter.add.constraint(
                this.player.body as BodyType,
                this.boot.body as BodyType,
                7,
                0.2,
                { pointA: { x: 5, y: 20 } },
            );
            this.constraintB = this.player.scene.matter.add.constraint(
                this.player.body as BodyType,
                this.boot.body as BodyType,
                30,
                0.8,
                { pointA: { x: -15, y: 10 } },
            );
        } else if (playerNumber == PlayerNumber.Two) {
            this.constraintA = this.player.scene.matter.add.constraint(
                this.player.body as BodyType,
                this.boot.body as BodyType,
                30,
                0.8,
                { pointA: { x: 15, y: 10 } },
            );
            this.constraintB = this.player.scene.matter.add.constraint(
                this.player.body as BodyType,
                this.boot.body as BodyType,
                7,
                0.2,
                { pointA: { x: -5, y: 20 } },
            );
        }
        this.isGrounded = false;
    }
    destroy(world: Phaser.Physics.Matter.World) {
        this.player.destroy()
        this.boot.destroy()
        world.removeConstraint([this.constraintA, this.constraintB]);
    }
}
