/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Math, Scene } from "phaser";
import { Client as ColyseusClient, Room } from "colyseus.js";

import { CollisionCategories, PlayerNumber } from "../lib";
import { Ball, Goal, Player } from "../objects";

export class Game extends Scene {
  client = new ColyseusClient("http://192.168.0.201:2567");
  room: Room;
  camera: Phaser.Cameras.Scene2D.Camera;
  cursors: Record<string, Phaser.Input.Keyboard.Key>;
  background: Phaser.GameObjects.Image;
  scoreText: Phaser.GameObjects.Text;
  platforms: Phaser.Physics.Matter.Image;
  players: Record<string, Player>;
  ball: Ball;
  PLAYER_SPEED_X = 4;
  PLAYER_SPEED_Y = -6;
  lastUpdateTime = 0;
  tickRate = 1000 / 120;
  clientText: Phaser.GameObjects.Text;
  remoteText: Phaser.GameObjects.Text;
  constructor() {
    super("Game");
    this.players = {};
  }

  preload() {
    this.camera = this.cameras.main;
    this.cursors = this.input.keyboard?.addKeys(
      "up, left, right, space , W, A, D, C, ctrl, enter"
    ) as Record<string, Phaser.Input.Keyboard.Key>;
  }

  async create(_time: number, _delta: number) {
    const { categoryFootball, categoryPlatform, categoryPlayer } =
      CollisionCategories;
    const shapes = this.cache.json.get("shapes");

    try {
      this.room = await this.client.joinOrCreate("game_room", {
        password: "foo",
      });
      console.log("Joined successfully!");
    } catch (e) {
      console.error(e);
    }
    // this.clientText = this.add
    //     .text(100, 75, '1', {
    //         fontFamily: 'Arial Black',
    //         fontSize: '49px',
    //         color: '#ffffff',
    //         stroke: '#000000',
    //         strokeThickness: 6,
    //         align: 'left',
    //     })
    //     .setOrigin(0.5);

    // this.remoteText = this.add
    //     .text(800, 75, '2', {
    //         fontFamily: 'Arial Black',
    //         fontSize: '22px',
    //         color: '#ffffff',
    //         stroke: '#000000',
    //         strokeThickness: 6,
    //         align: 'left',
    //     })
    //     .setOrigin(0.5);

    this.scoreText = this.add
      .text(512, 175, "0 : 0", {
        fontFamily: "Arial Black",
        fontSize: 64,
        stroke: "#000000",
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    this.matter.world.setBounds();

    // this.background = this.add.image(512, 384, "background");
    // this.background.setAlpha(0.5);

    this.platforms = this.matter.add
      .image(512, 600, "ground", undefined, { label: "ground" })
      .setStatic(true)
      .setFriction(0.3)
      .setScale(1.3, 1)
      .setCollisionCategory(categoryPlatform)
      .setCollidesWith(categoryPlayer | categoryFootball);
    this.sound.add("ball-touch");
    this.sound.add("jump");
    this.sound.add("die");

    new Goal(this.matter.world, PlayerNumber.One, {
      shape: shapes.goal,
    });
    new Goal(this.matter.world, PlayerNumber.Two, {
      shape: shapes.goal_2,
    });

    this.room.state.players.onAdd((player: any, sessionId: string) => {
      console.log(`Player has been added with sessionId: ${sessionId}`);

      // add player entity to the game world
      const playerEntity = new Player(
        this.matter.world,
        player.team,
        undefined,
        {
          shape: shapes[`boot_${player.team}`],
        }
      );

      this.players[sessionId] = playerEntity;

      // listen for changes to this player
      player.onChange(() => {
        playerEntity.player.setData("serverX", player.x);
        playerEntity.player.setData("serverY", player.y);
        playerEntity.player.setData("serverVX", player.vx);
        playerEntity.player.setData("serverVY", player.vy);
      });

      playerEntity.player.setOnCollideWith([this.platforms], () => {
        playerEntity.isGrounded = true;
      });
    });
    this.room.state.players.onRemove((player: any, sessionId: string) => {
      const playerEntity = this.players[sessionId];
      if (playerEntity) {
        playerEntity.destroy(this.matter.world);
        delete this.players[sessionId];
      }
    });

    this.ball = new Ball(this.matter.world, 512, 500);
    this.ball.setOnCollide(
      ({
        bodyA: { label: labelA },
        bodyB: { label: labelB },
      }: Phaser.Types.Physics.Matter.MatterCollisionData) => {
        // Collides with boot
        if (
          this.cursors.space.isDown &&
          (labelA == "boot-1" || labelB == "boot-1")
        ) {
          this.ball.setVelocity(
            this.ball.getVelocity().x + 5,
            this.ball.getVelocity().y + -8
          );
          this.ball.setAngularVelocity(this.ball.getAngularVelocity() + 0.5);
          this.room.send("kick");
        } else if (
          this.cursors.C.isDown &&
          (labelA == "boot-2" || labelB == "boot-2")
        ) {
          if (this.cursors.space.isDown) {
            this.ball.setVelocity(
              this.ball.getVelocity().x + -5,
              this.ball.getVelocity().y + -8
            );
            this.ball.setAngularVelocity(this.ball.getAngularVelocity() + 0.5);
          }
        }
        // Collides with player
        if (
          (labelA == "player-1" ||
            labelB == "player-1" ||
            labelA == "player-2" ||
            labelB == "player-2") &&
          (this.cursors.up.isDown ||
            this.cursors.right.isDown ||
            this.cursors.left.isDown ||
            this.cursors.W.isDown ||
            this.cursors.A.isDown ||
            this.cursors.D.isDown)
        ) {
          const newVelocity = this.matter.vector.add(
            this.ball.getVelocity(),
            this.ball.getVelocityModifier()
          );
          this.ball.setVelocity(newVelocity.x, newVelocity.y);
        }
        // Scores Goal
        if (labelA == "goal-sensor-1" || labelB == "goal-sensor-1") {
          // this.scoreGoal(PlayerNumber.Two);
        } else if (labelA == "goal-sensor-2" || labelB == "goal-sensor-2") {
          // this.scoreGoal(PlayerNumber.One);
        }

        // Dead ball
        if (labelA == "goal-sensor-top-1" || labelB == "goal-sensor-top-1") {
          this.ball.setVelocityX(1.5);
        } else if (
          labelA == "goal-sensor-top-2" ||
          labelB == "goal-sensor-top-2"
        ) {
          this.ball.setVelocityX(-1.5);
        }
        this.sound.play("ball-touch");
      }
    );
    this.room.state.ball.onChange(() => {
      const ballState = this.room.state.ball;
      this.ball.setData("ballX", ballState.x);
      this.ball.setData("ballY", ballState.y);
      this.ball.setData("ballVX", ballState.vx);
      this.ball.setData("ballVY", ballState.vy);
      this.ball.setData("ballAngle", ballState.angle);
    });

    this.room.state.score.onChange(() => {
      const score = this.room.state.score;
      this.scoreText.setText(
        `${score[PlayerNumber.One]} : ${score[PlayerNumber.Two]}`
      );
    });

    // this.sound.setMute(this.matter.getConfig().debug as boolean);
    // EventBus.emit("current-scene-ready", this);
  }

  update(time: number, _delta: number) {
    if (!this.room) return;
    const { W, A, D, space } = this.cursors;

    if (A.isDown) {
      this.ball.setVelocityModifier({
        x: -Math.FloatBetween(2, 1.5),
        y: Math.FloatBetween(-2, -0.5),
      });
      this.room.send("move", { direction: "left" });
    } else if (D.isDown) {
      this.ball.setVelocityModifier({
        x: Math.FloatBetween(2, 1.5),
        y: Math.FloatBetween(-2, -0.5),
      });
      this.room.send("move", { direction: "right" });
    }

    for (const sessionId in this.players) {
      // interpolate all player entities
      const p = this.players[sessionId];
      if (W.isDown && p.isGrounded) {
        this.room.send("move", { direction: "up" });
        p.isGrounded = false;
      }
      if (space.isDown && space.getDuration() < 75) {
        p.boot.setVelocityX(-15);
      }
      this.interpolatePlayer(sessionId);
    }
    this.interpolateBall();
  }

  interpolatePlayer(sessionId: string) {
    const entity = this.players[sessionId];
    const { serverX, serverY, serverVX, serverVY } = entity.player.data.values;

    entity.player.setPosition(
      Phaser.Math.Linear(entity.player.x, serverX, 0.2),
      Phaser.Math.Linear(entity.player.y, serverY, 0.2)
    );
    entity.player.setVelocity(
      Phaser.Math.Linear(entity.player.getVelocity().x, serverVX, 0.2),
      Phaser.Math.Linear(entity.player.getVelocity().y, serverVY, 0.2)
    );
  }

  interpolateBall() {
    if (!this.ball.data) return;

    const { ballX, ballY, ballVX, ballVY, ballAngle } = this.ball.data.values;
    this.ball.setPosition(
      Phaser.Math.Linear(this.ball.x, ballX, 0.1),
      Phaser.Math.Linear(this.ball.y, ballY, 0.2)
    );
    this.ball.setVelocity(
      Phaser.Math.Linear(this.ball.getVelocity().x, ballVX, 0.1),
      Phaser.Math.Linear(this.ball.getVelocity().y, ballVY, 0.2)
    );
    this.ball.setAngularVelocity(
      Phaser.Math.Linear(this.ball.getAngularVelocity(), ballAngle, 0.001)
    );
  }

  scoreGoal(playerNumber: PlayerNumber) {
    this.room.send("goal", playerNumber);

    this.matter.pause();
    this.sound.play("die");

    this.time.delayedCall(750, () => {
      this.room.send("serve", playerNumber);
      this.serveBall(playerNumber);
      this.matter.resume();
    });
  }

  serveBall(from: PlayerNumber) {
    from == PlayerNumber.One
      ? this.ball.setVelocity(
          Math.FloatBetween(3, 5),
          Math.FloatBetween(-3, -2)
        )
      : this.ball.setVelocity(
          Math.FloatBetween(-5, -3),
          Math.FloatBetween(-3, -2)
        );
  }
}
