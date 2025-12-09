import { Scene } from "phaser";
import { World } from "planck";
import {
  FIXED_TIMESTEP,
  PHYSICS_TIMESTEP,
  WorldConfig,
} from "../../../../config/World";
import PhysicsSprite from "../objects/PhysicsSprite";

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  world: World;
  ball: PhysicsSprite;
  accumulator: number = 0;

  constructor() {
    super("Game");

    this.world = new World({
      gravity: WorldConfig.gravity,
    });
  }

  create() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0xffffff);

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
    this.world.step(PHYSICS_TIMESTEP, 8, 3);
  }
}
