import {Scene} from "phaser";
import {World} from "planck";

export class Game extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    world: World;

    constructor() {
        super("Game");

        this.world = new World({
            gravity: { x: 0, y: 0 },
        });
    }

    create() {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x00ff00);
    }
}
