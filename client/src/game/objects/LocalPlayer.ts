import { Vec2 } from "planck";
import { LocalInputState } from "../util/InputHandler";
import { NetworkedSprite } from "./NetworkedSprite";
import { Game } from "../scenes/Game";
import { PlayerConfig } from "../../../../config/Player";

export class LocalPlayer extends NetworkedSprite {
  private inputHandler: { input: LocalInputState };
  private prevJump = false;

  constructor(
    scene: Game,
    x: number,
    y: number,
    texture: string,
    inputHandler: { input: LocalInputState },
    debugOptions?: any,
  ) {
    super(scene, x, y, texture, true, debugOptions);
    this.inputHandler = inputHandler;

    // Build a local physics body that mirrors the server (circle body sized to player).
    if (this.physicsSprite) {
      const radius = Math.min(
        PlayerConfig.physicsBody.width,
        PlayerConfig.physicsBody.height,
      );
      this.physicsSprite.createCircleBody(radius / 2, {
        density: PlayerConfig.physicsBody.density,
        friction: PlayerConfig.physicsBody.friction,
        restitution: PlayerConfig.physicsBody.restitution,
        fixedRotation: PlayerConfig.physicsBody.fixedRotation,
        allowSleep: PlayerConfig.physicsBody.allowSleep,
        linearDamping: PlayerConfig.physicsBody.linearDamping,
      });
    }

    // Apply local prediction every fixed update.
    scene.events.on("fixedUpdate", () => this.applyPrediction());
  }

  private applyPrediction() {
    if (!this.physicsSprite?.body) return;
    const input = this.inputHandler.input;
    const body = this.physicsSprite.body;
    const vel = body.getLinearVelocity();

    let targetVX = 0;
    if (input.left) targetVX = -PlayerConfig.speed;
    else if (input.right) targetVX = PlayerConfig.speed;

    const deltaVX = targetVX - vel.x;
    if (Math.abs(deltaVX) > 0.01) {
      body.applyLinearImpulse(
        new Vec2(deltaVX * body.getMass(), 0),
        body.getWorldCenter(),
        true,
      );
    }

    const wantsJump = !!input.jump;
    if (wantsJump && !this.prevJump) {
      body.applyLinearImpulse(
        new Vec2(0, -PlayerConfig.jumpImpulse * body.getMass()),
        body.getWorldCenter(),
        true,
      );
    }
    this.prevJump = wantsJump;
  }
}
