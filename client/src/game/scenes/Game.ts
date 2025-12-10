import { Scene } from "phaser";
import { World } from "planck";
import {
  FIXED_TIMESTEP,
  PHYSICS_TIMESTEP,
  POSITION_ITERATIONS,
  VELOCITY_ITERATIONS,
  WorldConfig,
} from "../../../../config/World";
import PhysicsSprite from "../objects/PhysicsSprite";
import { Client, getStateCallbacks, Room } from "colyseus.js";
import { CircleState } from "../../../schema/CircleState";
import { GameState } from "../../../schema/GameState";

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  world: World;
  ball: PhysicsSprite;
  accumulator: number = 0;
  client: Client;
  room: Room<GameState>;
  $: any;

  constructor() {
    super("Game");

    this.world = new World({
      gravity: WorldConfig.gravity,
    });
  }

  async create() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0xffffff);

    this.client = new Client("ws://localhost:2567");

    try {
      this.room = await this.client.joinOrCreate("my_room");
      console.log("joined successfully", this.room);
    } catch (error) {
      console.error("Failed to join room:", error);
    }

    this.$ = getStateCallbacks(this.room);

    this.$(this.room.state).balls.onAdd((ball: CircleState) => {
      const sprite = this.add.circle(ball.x, ball.y, ball.radius, 0x00ff00, 1);

      this.$(ball).listen("y", (value: number) => {
        this.add.tween({
          targets: sprite,
          y: value,
          duration: 50,
          ease: "Linear",
        });
      });
      this.$(ball).listen("x", (value: number) => {
        this.add.tween({
          targets: sprite,
          x: value,
          duration: 50,
          ease: "Linear",
        });
      });
    });

    this.ball = new PhysicsSprite(this, 400, 300, "ball", 0, {
      enabled: true,
    });
    this.ball.createCircleBody(15, {
      restitution: 0.8,
    });

    const logo = new PhysicsSprite(this, 400, 600, "logo", 0, {
      enabled: true,
    });
    logo.createBoxBody(500, 100, {
      type: "static",
    });
  }

  update(_time: number, dt: number) {
    if (!this.world) return;

    this.accumulator += dt;
    while (this.accumulator >= FIXED_TIMESTEP) {
      this.accumulator -= FIXED_TIMESTEP;
      this.fixedUpdate(FIXED_TIMESTEP);
      this.events.emit("fixedUpdate");
    }
  }

  fixedUpdate(_dt: number) {
    this.world.step(PHYSICS_TIMESTEP, VELOCITY_ITERATIONS, POSITION_ITERATIONS);
  }
}
