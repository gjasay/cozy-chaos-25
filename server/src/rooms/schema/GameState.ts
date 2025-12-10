import { Schema, type } from "@colyseus/schema";

export class PhysicsObjectState extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") vx: number = 0;
  @type("number") vy: number = 0;
  @type("number") angle: number = 0;

  constructor(x: number = 0, y: number = 0, angle: number = 0) {
    super();
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.angle = angle;
  }
}

export class CircleState extends PhysicsObjectState {
  @type("number") radius: number = 10;

  constructor(x: number = 0, y: number = 0, radius: number = 10) {
    super(x, y);
    this.radius = radius;
  }
}

export class BoxState extends PhysicsObjectState {
  @type("number") width: number;
  @type("number") height: number;

  constructor(
    x: number = 0,
    y: number = 0,
    width: number = 10,
    height: number = 10,
  ) {
    super(x, y);
    this.width = width;
    this.height = height;
  }
}

export class GameState extends Schema {
  @type([CircleState]) balls: CircleState[] = [];
  @type([BoxState]) boxes: BoxState[] = [];
}
