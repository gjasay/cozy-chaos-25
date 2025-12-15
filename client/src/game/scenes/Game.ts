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
import { NetworkedSprite } from "../objects/NetworkedSprite";
import { LocalPlayer } from "../objects/LocalPlayer";
import { InputHandler } from "../util/InputHandler";
import { PlayerState } from "../../../schema/PlayerState";
import { BoxState } from "../../../schema/BoxState";
import { Vec2, Box as BoxShape, Body } from "planck";
import { MapConfig, PIXELS_PER_METER } from "../../../../config/World";
import mapData from "../../../../config/Map_1/Map_1.json";

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  world: World;
  ball: PhysicsSprite;
  accumulator: number = 0;
  nm: NetworkManager;
  inputHandler: InputHandler;
  private platformBodies: Map<string, Body> = new Map();
  private platformSprites: Phaser.GameObjects.Image[] = [];
  constructor() {
    super("Game");

    this.world = new World({
      gravity: WorldConfig.gravity,
    });
  }

  async create() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0xffffff);
    this.renderMapPlatforms();

    this.nm = NetworkManager.getInstance();
    this.inputHandler = new InputHandler(this, {
      left: ["A", Phaser.Input.Keyboard.KeyCodes.LEFT],
      right: ["D", Phaser.Input.Keyboard.KeyCodes.RIGHT],
      jump: [
        "W",
        Phaser.Input.Keyboard.KeyCodes.SPACE,
        Phaser.Input.Keyboard.KeyCodes.UP,
      ],
    });

    this.inputHandler.startListening();
    console.log("Connecting to server...");
    await this.nm.connect({
      endpoint: "wss://us-dfw-73cadcad.colyseus.cloud",
      roomName: "my_room",
    });
    console.log("Connected to server.");

    this.nm.onAdd("players", (player: PlayerState, key: string) => {
      const isLocal = key === this.nm.getSessionId();
      const sprite = isLocal
        ? new LocalPlayer(this, player.x, player.y, "ball", this.inputHandler, {
            enabled: false,
          })
        : new NetworkedSprite(this, player.x, player.y, "ball", false, {
            enabled: false,
          });
      const $ = this.nm.getCallbacks();
      $(player).onChange(() => {
        sprite.applyServerState(player);
      });
    });

    this.nm.onAdd("boxes", (box: BoxState, key: string) => {
      const createStaticBody = (state: BoxState) => {
        const body = this.world.createBody({
          type: "static",
          position: new Vec2(
            state.x / PIXELS_PER_METER,
            state.y / PIXELS_PER_METER,
          ),
        });
        body.createFixture({
          shape: new BoxShape(
            state.width / PIXELS_PER_METER / 2,
            state.height / PIXELS_PER_METER / 2,
          ),
          friction: 0,
          restitution: 0,
        });
        return body;
      };

      const body = createStaticBody(box);
      this.platformBodies.set(key, body);

      const $ = this.nm.getCallbacks();
      $(box).onChange(() => {
        const existingBody = this.platformBodies.get(key);
        if (existingBody) {
          this.world.destroyBody(existingBody);
        }
        const newBody = createStaticBody(box);
        this.platformBodies.set(key, newBody);
      });
    });

    this.nm.onRemove("boxes", (_box: BoxState, key: string) => {
      const body = this.platformBodies.get(key);
      if (body) {
        this.world.destroyBody(body);
      }
      this.platformBodies.delete(key);
    });
  }

  private renderMapPlatforms() {
    const platformsLayer = mapData.layers.find((l) => l.name === "Platforms");
    if (!platformsLayer) return;

    const tileSize = mapData.tile_size * MapConfig.scale;
    for (const tile of platformsLayer.positions) {
      const cx = (tile.x + 0.5) * tileSize;
      const cy = (tile.y + 0.5) * tileSize + MapConfig.offsetY;
      const sprite = this.add.image(cx, cy, "map_tiles", tile.id);
      sprite.setScale(MapConfig.scale);
      sprite.setDepth(2);
      this.platformSprites.push(sprite);
    }
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
