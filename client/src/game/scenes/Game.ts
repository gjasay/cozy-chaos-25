import { Scene } from "phaser";
import { World } from "planck";
import { WorldConfig } from "../../../../config/World";

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  world: World;

  constructor() {
    super("Game");

    this.world = new World({
      gravity: WorldConfig.gravity,
    });
  }

  create() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x00ff00);
  }
}
