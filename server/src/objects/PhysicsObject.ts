import { World, Body, BodyDef, Vec2, FixtureDef, Circle, Box } from "planck";
import { PIXELS_PER_METER } from "../../../config/World";
import { PhysicsObjectState } from "../rooms/schema/GameState";
import { MyRoom } from "../rooms/MyRoom";
import { EventEmitter } from "events";

export type BodyOptions = Partial<BodyDef & FixtureDef>;

class PhysicsObject {
  protected world: World;
  protected room: MyRoom;
  public body: Body;
  protected initialX: number;
  protected initialY: number;
  protected state: PhysicsObjectState;
  protected eventEmitter: EventEmitter;

  constructor(room: MyRoom, x: number, y: number, state: PhysicsObjectState) {
    this.world = room.world;
    this.room = room;
    this.eventEmitter = room.eventEmitter;
    this.state = state;
    this.initialX = x / PIXELS_PER_METER;
    this.initialY = y / PIXELS_PER_METER;

    this.eventEmitter.on("fixedUpdate", () => {
      this.sync();
    });
  }

  public createCircleBody(radius: number, options: BodyOptions = {}): Body {
    const bodyDef: BodyDef = this.defineBody(options);
    this.body = this.world.createBody(bodyDef);

    const radiusInMeters = radius / PIXELS_PER_METER;

    const fixtureDef: FixtureDef = {
      shape: new Circle(radiusInMeters),
      density: options.density ?? 1.0,
      friction: options.friction ?? 0.3,
      restitution: options.restitution ?? 0.2,
    };

    this.body.createFixture(fixtureDef);
    this.body.setUserData(this.state);

    return this.body;
  }

  public createBoxBody(
    width: number,
    height: number,
    options: BodyOptions,
  ): Body {
    const bodyDef: BodyDef = this.defineBody(options);

    this.body = this.world.createBody(bodyDef);

    const widthInMeters = width / PIXELS_PER_METER;
    const heightInMeters = height / PIXELS_PER_METER;

    const fixtureDef: FixtureDef = {
      shape: new Box(widthInMeters / 2, heightInMeters / 2),
      density: options.density ?? 1.0,
      friction: options.friction ?? 0.3,
      restitution: options.restitution ?? 0.2,
    };

    this.body.createFixture(fixtureDef);
    this.body.setUserData(this.state);

    return this.body;
  }

  public sync(): void {
    this.update();
    if (!this.body) return;

    const pos = this.body.getPosition();
    const angle = this.body.getAngle();

    this.state.x = pos.x * PIXELS_PER_METER;
    this.state.y = pos.y * PIXELS_PER_METER;
    this.state.vx = this.body.getLinearVelocity().x;
    this.state.vy = this.body.getLinearVelocity().y;
    this.state.angle = angle;
  }

  public applyForce(
    forceX: number,
    forceY: number,
    worldX?: number,
    worldY?: number,
  ): void {
    if (!this.body) return;

    const force = new Vec2(forceX, forceY);
    const point =
      worldX !== undefined && worldY !== undefined
        ? new Vec2(worldX, worldY)
        : this.body.getWorldCenter();

    this.body.applyForce(force, point, true);
  }

  public applyImpluse(
    impulseX: number,
    impulseY: number,
    worldX?: number,
    worldY?: number,
  ): void {
    if (!this.body) return;

    const impulse = new Vec2(impulseX, impulseY);
    const point =
      worldX !== undefined && worldY !== undefined
        ? new Vec2(worldX, worldY)
        : this.body.getWorldCenter();

    this.body.applyLinearImpulse(impulse, point, true);
  }

  public setVelocity(vx: number, vy: number): void {
    if (!this.body) return;
    this.body.setLinearVelocity(new Vec2(vx, vy));
  }

  public getBody(): Body | undefined {
    return this.body;
  }

  public getVelocity(): { x: number; y: number } {
    if (!this.body) return { x: 0, y: 0 };

    const vel = this.body.getLinearVelocity();
    return { x: vel.x, y: vel.y };
  }

  public setPosition(x: number, y: number) {
    if (!this.body) return;
    this.body.setPosition(new Vec2(x / PIXELS_PER_METER, y / PIXELS_PER_METER));
  }

  // radians btw
  public setRotation(angle: number) {
    if (!this.body) return;
    this.body.setAngle(angle);
  }

  protected update(): void {}

  private defineBody(options: BodyOptions): BodyDef {
    return {
      type: options.type || "dynamic",
      position: new Vec2(this.initialX, this.initialY),
      angle: options.angle || 0,
      fixedRotation: options.fixedRotation || false,
    };
  }
}

export default PhysicsObject;
