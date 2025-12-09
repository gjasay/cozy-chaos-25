import {
  World,
  Body,
  BodyDef,
  Vec2,
  FixtureDef,
  Circle,
  Box,
  BoxShape,
} from "planck";
import { Game } from "../scenes/Game";
import { PIXELS_PER_METER } from "../../../../config/World";

export type BodyOptions = Partial<BodyDef & FixtureDef>;

interface DebugOptions {
  enabled?: boolean;
  color?: number;
  alpha?: number;
  lineWidth?: number;
}

class PhysicsSprite {
  protected scene: Game;
  protected world: World;
  public sprite: Phaser.GameObjects.Sprite;
  public body: Body;
  protected initialX: number;
  protected initialY: number;
  protected debugGraphics: Phaser.GameObjects.Graphics | null = null;
  protected debugOptions: DebugOptions = {
    enabled: false,
    color: 0x00ff00,
    alpha: 0.8,
    lineWidth: 2,
  };

  constructor(
    scene: Game,
    x: number,
    y: number,
    texture: string,
    frame?: string | number,
    debugOptions?: DebugOptions,
  ) {
    this.scene = scene;
    this.world = scene.world;
    this.sprite = scene.add.sprite(x, y, texture, frame);
    this.initialX = x / PIXELS_PER_METER;
    this.initialY = y / PIXELS_PER_METER;

    if (debugOptions) {
      this.debugOptions = { ...this.debugOptions, ...debugOptions };
    }

    if (this.debugOptions.enabled) {
      this.createDebugGraphics();
    }

    this.scene.events.on("fixedUpdate", () => this.sync());
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

    const widthInMeters = width / PIXELS_PER_METER;
    const heightInMeters = height / PIXELS_PER_METER;

    const fixtureDef: FixtureDef = {
      shape: new Box(widthInMeters / 2, heightInMeters / 2),
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

    if (this.debugOptions.enabled && this.debugGraphics) {
      this.updateDebugGraphics();
    }
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

  public setDebugEnabled(enabled: boolean): void {
    this.debugOptions.enabled = enabled;
    if (enabled && !this.debugGraphics) {
      this.createDebugGraphics();
    } else if (!enabled && this.debugGraphics) {
      this.debugGraphics.clear();
      this.debugGraphics.destroy();
    } else if (enabled && this.debugGraphics) {
      this.createDebugGraphics();
      this.updateDebugGraphics();
    }
  }

  protected update(): void {}

  private createDebugGraphics(): void {
    this.debugGraphics = this.scene.add.graphics();
    this.debugGraphics.setDepth(this.sprite.depth + 1);
  }

  private updateDebugGraphics(): void {
    if (!this.debugGraphics || !this.body) return;
    this.debugGraphics.clear();
    this.debugGraphics.lineStyle(
      this.debugOptions.lineWidth!,
      this.debugOptions.color!,
      this.debugOptions.alpha!,
    );

    const pos = this.body.getPosition();
    const angle = this.body.getAngle();
    const fixture = this.body.getFixtureList();
    if (!fixture) return;

    const shape = fixture?.getShape();
    const shapeType = shape?.getType();

    if (shapeType === "circle") {
      this.debugGraphics.strokeCircle(
        this.body.getPosition().x * PIXELS_PER_METER,
        this.body.getPosition().y * PIXELS_PER_METER,
        shape!.getRadius() * PIXELS_PER_METER,
      );
    } else if (shapeType === "polygon") {
      const polyShape = shape as BoxShape; // Box extends Polygon
      const vertices = polyShape.m_vertices;

      if (vertices && vertices.length > 0) {
        const worldVertices: Vec2[] = [];
        for (let i = 0; i < vertices.length; i++) {
          const v = vertices[i];
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const worldX = (pos.x + (v.x * cos - v.y * sin)) * PIXELS_PER_METER;
          const worldY = (pos.y + (v.x * sin + v.y * cos)) * PIXELS_PER_METER;
          worldVertices.push(new Vec2(worldX, worldY));
        }

        this.debugGraphics.beginPath();
        this.debugGraphics.moveTo(worldVertices[0].x, worldVertices[0].y);
        for (let i = 1; i < worldVertices.length; i++) {
          this.debugGraphics.lineTo(worldVertices[i].x, worldVertices[i].y);
        }
        this.debugGraphics.closePath();
        this.debugGraphics.strokePath();
      }
    }
  }

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
