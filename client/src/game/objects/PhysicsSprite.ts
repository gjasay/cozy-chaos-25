import { World, Body, BodyDef, Vec2, FixtureDef, Circle, Box } from "planck";
import { Game } from "../scenes/Game";
import { PIXELS_PER_METER } from "../../../../config/World";

export type BodyOptions = Partial<BodyDef & FixtureDef>;

class PhysicsSprite {
  protected scene: Game;
  protected world: World;

  public sprite: Phaser.GameObjects.Sprite;
  public body: Body;

  protected initialX: number;
  protected initialY: number;

  constructor(
    scene: Game,
    x: number,
    y: number,
    texture: string,
    frame?: string | number,
  ) {
    this.scene = scene;
    this.world = scene.world;

    this.sprite = scene.add.sprite(x, y, texture, frame);

    this.initialX = x / PIXELS_PER_METER;
    this.initialY = y / PIXELS_PER_METER;

    this.scene.events.on("update", () => this.sync());
  }

  public createCircleBody(radius: number, options: BodyOptions = {}): Body {
    const bodyDef: BodyDef = this.defineBody(options);

    this.body = this.world.createBody(bodyDef);

    const fixtureDef: FixtureDef = {
      shape: new Circle(radius),
      density: options.density ?? 1.0,
      friction: options.friction ?? 0.3,
      restitution: options.restitution ?? 0.2,
    };

    this.body.createFixture(fixtureDef);
    this.body.setUserData(this);

    return this.body;
  }

  public createBoxBody(
    width: number,
    height: number,
    options: BodyOptions,
  ): Body {
    const bodyDef: BodyDef = this.defineBody(options);

    this.body = this.world.createBody(bodyDef);

    const fixtureDef: FixtureDef = {
      shape: new Box(width / 2, height / 2),
      density: options.density ?? 1.0,
      friction: options.friction ?? 0.3,
      restitution: options.restitution ?? 0.2,
    };

    this.body.createFixture(fixtureDef);
    this.body.setUserData(this);

    return this.body;
  }

  public sync(): void {
    this.update();
    if (!this.body || !this.sprite.active) return;

    const pos = this.body.getPosition();
    const angle = this.body.getAngle();

    this.sprite.x = pos.x * PIXELS_PER_METER;
    this.sprite.y = pos.y * PIXELS_PER_METER;
    this.sprite.rotation = angle;
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

  public getVelocity(): { x: number; y: number } {
    if (!this.body) return { x: 0, y: 0 };

    const vel = this.body.getLinearVelocity();
    return { x: vel.x, y: vel.y };
  }

  public setPosition(x: number, y: number) {
    if (!this.body || !this.sprite) return;
    this.body.setPosition(new Vec2(x / PIXELS_PER_METER, y / PIXELS_PER_METER));
    this.sprite.setPosition(x, y);
  }

  // radians btw
  public setRotation(angle: number) {
    if (!this.body || !this.sprite) return;
    this.body.setAngle(angle);
    this.sprite.setRotation(angle);
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

export default PhysicsSprite;
