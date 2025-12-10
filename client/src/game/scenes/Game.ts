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
import { NetworkManager } from "../util/NetworkManager";
import { CircleState } from "../../../schema/CircleState";

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  world: World;
  ball: PhysicsSprite;
  accumulator: number = 0;
  nm: NetworkManager;
  constructor() {
    super("Game");

    this.world = new World({
      gravity: WorldConfig.gravity,
    });
  }

  async create() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0xffffff);

    this.nm = NetworkManager.getInstance();

    await this.nm.connect({
      endpoint: "ws://localhost:2567",
      roomName: "my_room",
    });

    this.nm.onAdd("balls", (ball: CircleState) => {
      const $ = this.nm.getCallbacks();
      $(ball).listen("y", (cur: any, _prev: any) => {
        console.log(cur);
      })
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
