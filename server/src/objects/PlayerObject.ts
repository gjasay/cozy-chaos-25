import { Vec2 } from "planck";
import { InputState, PlayerConfig } from "../../../config/Player";
import { PIXELS_PER_METER } from "../../../config/World";
import { MyRoom } from "../rooms/MyRoom";
import { BoxState, PlayerState } from "../rooms/schema/GameState";
import PhysicsObject from "./PhysicsObject";

export class PlayerObject extends PhysicsObject {
  private grounded = false;
  private lastStompAt = 0;
  private readonly stompCooldownMs = 200;

  constructor(
    sessionId: string,
    room: MyRoom,
    x: number,
    y: number,
    state: PlayerState,
  ) {
    super(room, x, y, state);

    const radius = Math.min(state.width, state.height) / 2;
    this.createCircleBody(radius, PlayerConfig.physicsBody);

    room.eventEmitter.addListener(sessionId, (input: InputState) =>
      this.handleInput(input),
    );
  }

  private checkGround() {
    if (!this.body) return;
    this.grounded = false;

    for (let edge = this.body.getContactList(); edge; edge = edge.next) {
      const contact = edge.contact;
      if (!contact.isTouching()) continue;

      const fixtureA = contact.getFixtureA();
      const fixtureB = contact.getFixtureB();
      const bodyA = fixtureA.getBody();
      const bodyB = fixtureB.getBody();
      if (bodyA !== this.body && bodyB !== this.body) continue;

      const otherBody = bodyA === this.body ? bodyB : bodyA;
      const userData = otherBody.getUserData() as
        | { layer?: string }
        | undefined;
      if (userData?.layer !== "platform") continue;

      const manifold = contact.getWorldManifold(null);
      const normal =
        bodyB === this.body
          ? new Vec2(-manifold.normal.x, -manifold.normal.y)
          : manifold.normal;
      if (normal.y >= 0.55) {
        this.grounded = true;
        break;
      }
    }
  }

  private handleInput(input: InputState) {
    if (!this.body) return;

    let targetVX = 0;
    if (input.left) {
      targetVX = -PlayerConfig.speed;
    } else if (input.right) {
      targetVX = PlayerConfig.speed;
    }

    const vel = this.body.getLinearVelocity();
    const deltaVX = targetVX - vel.x;

    if (Math.abs(deltaVX) > 0.01) {
      const impulseX = deltaVX * this.body.getMass();
      this.body.applyLinearImpulse(
        new Vec2(impulseX, 0),
        this.body.getWorldCenter(),
        true,
      );
    }

    if (input.jump && this.grounded) {
      this.applyImpluse(0, -PlayerConfig.jumpImpulse);
      this.grounded = false;
    }
  }

  protected update(): void {
    if (!this.body) return;
    this.checkGround();
    this.checkStomp();
  }

  // Detect if we landed on another player's head and notify the room.
  private checkStomp() {
    if (!this.body) return;

    const now = Date.now();
    if (now - this.lastStompAt < this.stompCooldownMs) return;

    const vel = this.body.getLinearVelocity();
    if (vel.y <= 0) return; // only when descending (positive y is downward)

    const myPos = this.body.getPosition();
    for (let edge = this.body.getContactList(); edge; edge = edge.next) {
      const contact = edge.contact;
      if (!contact.isTouching()) continue;

      const fixtureA = contact.getFixtureA();
      const fixtureB = contact.getFixtureB();
      const bodyA = fixtureA.getBody();
      const bodyB = fixtureB.getBody();
      if (bodyA !== this.body && bodyB !== this.body) continue;

      const otherBody = bodyA === this.body ? bodyB : bodyA;
      const userData = otherBody.getUserData() as
        | { layer?: string; state?: BoxState }
        | BoxState
        | undefined;
      const layer = (userData as any)?.layer ?? (userData as any)?.state?.layer;
      if (layer !== "player") continue;

      const otherPos = otherBody.getPosition();
      // Require we are above the other player.
      if (myPos.y + 0.05 >= otherPos.y) continue;

      this.room.handlePlayerStomp(this.state as PlayerState, userData as any);
      this.lastStompAt = now;
      break;
    }
  }
}
