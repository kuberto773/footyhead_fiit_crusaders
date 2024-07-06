import { Room, Client, matchMaker } from "@colyseus/core";
import { Ball, GameState, Player, Score } from "./schema/GameState";
import {
  Engine,
  Events,
  Bodies,
  Composite,
  World,
  Body,
  Sleeping,
  Collision,
} from "matter-js";
import db from "../../db/init";

export class GameRoom extends Room<GameState> {
  engine: Engine;
  world: World;
  initId: string;
  playerOne: Body;
  playerTwo: Body;
  ball: Body;
  maxClients = 2;

  onCreate(options: any) {
    this.setState(new GameState());

    this.engine = Engine.create({ gravity: { y: 0.7 }, enableSleeping: true });
    this.world = this.engine.world;

    const leftWall = Bodies.rectangle(-10, 300, 20, 768, { isStatic: true });
    const rightWall = Bodies.rectangle(1034, 300, 20, 768, { isStatic: true });
    const ceiling = Bodies.rectangle(400, -10, 1024, 20, { isStatic: true });
    const ground = Bodies.rectangle(512, 600, 1024, 20, {
      isStatic: true,
      friction: 0.3,
    });
    this.playerOne = Bodies.circle(200, 500, 22, {
      mass: 20,
      restitution: 0.3,
    });
    this.playerTwo = Bodies.circle(824, 500, 22, {
      mass: 20,
      restitution: 0.3,
    });
    this.ball = Bodies.circle(512, 500, 10, {
      mass: 3,
      restitution: 1,
      friction: 0.05,
      frictionAir: 0.005,
    });

    const goalOne = Bodies.rectangle(40, 465, 80, 5, {
      isStatic: true,
      angle: 0.05,
      restitution: 0.4,
    });
    const goalTwo = Bodies.rectangle(984, 465, 80, 5, {
      isStatic: true,
      angle: -0.05,
      restitution: 0.4,
    });

    Composite.add(this.world, [
      ground,
      leftWall,
      rightWall,
      ceiling,
      this.ball,
      goalOne,
      goalTwo,
    ]);

    this.setSimulationInterval((timeDelta) => {
      Engine.update(this.engine, timeDelta);
    }, 1000 / 60);

    Events.on(this.engine, "afterUpdate", () => {
      const goalOneCollision = Collision.collides(goalOne, this.ball);
      const goalTwoCollision = Collision.collides(goalTwo, this.ball);

      if (goalOneCollision?.collided) {
        Body.setVelocity(this.ball, { x: 1.5, y: this.ball.velocity.y });
      } else if (goalTwoCollision?.collided) {
        Body.setVelocity(this.ball, { x: -1.5, y: this.ball.velocity.y });
      }

      this.state.ball.x = this.ball.position.x;
      this.state.ball.y = this.ball.position.y;
      this.state.ball.vx = this.ball.velocity.x;
      this.state.ball.vy = this.ball.velocity.y;
      this.state.ball.angle = this.ball.angularVelocity;

      this.state.players.forEach((p, sessionId) => {
        const player =
          sessionId == this.initId ? this.playerOne : this.playerTwo;

        p.x = player.position.x;
        p.y = player.position.y;
        p.vx = player.velocity.x;
        p.vy = player.velocity.y;
        this.state.players.set(sessionId, p);
      });
    });

    this.onMessage("move", (client, data) => {
      const player =
        client.sessionId == this.initId ? this.playerOne : this.playerTwo;
      Sleeping.set(player, false);
      if (data.direction == "right") {
        Body.setVelocity(player, { x: 4, y: player.velocity.y });
      } else if (data.direction == "left") {
        Body.setVelocity(player, { x: -4, y: player.velocity.y });
      }
      if (data.direction == "up") {
        Body.setVelocity(player, { x: player.velocity.x, y: -6 });
      }
    });

    this.onMessage("kick", () => {
      Body.setVelocity(this.ball, {
        x: this.ball.velocity.x + 5,
        y: this.ball.velocity.y - 8,
      });
      Body.setAngularVelocity(this.ball, this.ball.angularVelocity + 0.5);
    });

    this.onMessage("goal", (_, player: 1 | 2) => {
      this.state.score[player]++;
      Body.setVelocity(this.playerOne, { x: 0, y: 0 });
      Body.setVelocity(this.playerTwo, { x: 0, y: 0 });
      this.engine.enabled = false;
    });

    this.onMessage("serve", (_, player: 1 | 2) => {
      this.resetPositions();
      this.serveBall(player);
    });
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    let player;

    db.prepare("UPDATE game SET active = active + 1 WHERE pin = ?").run(
      options.pin
    );

    if (!this.initId) {
      this.initId = client.sessionId;
      World.add(this.world, this.playerOne);
      player = new Player(1);
    } else {
      World.add(this.world, this.playerTwo);
      player = new Player(2);
    }
    this.state.ball = new Ball();
    this.state.score = new Score();
    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    const player = this.state.players.get(client.sessionId);
    World.remove(
      this.world,
      player.team == 1 ? this.playerOne : this.playerTwo
    );
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
    db.prepare("DELETE FROM game WHERE roomId = ?").run(this.roomId);
  }

  resetPositions() {
    Body.setPosition(this.playerOne, { x: 200, y: 550 });
    Body.setVelocity(this.playerOne, { x: 0, y: 0 });

    Body.setPosition(this.playerTwo, { x: 824, y: 550 });
    Body.setVelocity(this.playerTwo, { x: 0, y: 0 });

    Body.setPosition(this.ball, { x: 512, y: 400 });
    Body.setVelocity(this.ball, { x: 0, y: 0 });
    Body.setAngularVelocity(this.ball, 0);
  }

  serveBall(from: 1 | 2) {
    from == 1
      ? Body.setVelocity(this.ball, { x: 4, y: -3 })
      : Body.setVelocity(this.ball, { x: -4, y: -3 });
  }
}
