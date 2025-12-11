import PhysicsSprite from "./PhysicsSprite";
import { PIXELS_PER_METER } from "../../../../config/World";
import { Vec2 } from "planck";
import { Game } from "../scenes/Game";
import { PhysicsObjectState } from "../../../schema/PhysicsObjectState";
import { CircleState } from "../../../schema/CircleState";
import { BoxState } from "../../../schema/BoxState";

interface NetworkDebugOptions {
  enabled?: boolean;
  serverPosColor?: number;
  interpolationLineColor?: number;
  ghostOutlineColor?: number;
  alpha?: number;
}

export class NetworkedSprite {
  scene: Game;
  isLocal: boolean;

  physicsSprite: PhysicsSprite | null = null;
  ghostSprite: Phaser.GameObjects.Sprite | null = null;
  ghostTween: Phaser.Tweens.Tween | null = null;

  debugOptions: NetworkDebugOptions = {
    enabled: false,
    serverPosColor: 0xff4444,
    interpolationLineColor: 0xffcc00,
    ghostOutlineColor: 0x44aaff,
    alpha: 0.9,
  };
  debugGraphics: Phaser.GameObjects.Graphics | null = null;

  serverX = 0;
  serverY = 0;
  serverVx = 0;
  serverVy = 0;
  serverAngle = 0;
  lastUpdate = 0;

  shape: "circle" | "box" = "circle";
  radius = 16;
  width = 32;
  height = 32;

  constructor(
    scene: Game,
    x: number,
    y: number,
    texture: string,
    isLocal: boolean,
    debugOptions?: NetworkDebugOptions,
  ) {
    this.scene = scene;
    this.isLocal = isLocal;

    if (debugOptions) {
      this.debugOptions = { ...this.debugOptions, ...debugOptions };
    }

    if (isLocal) {
      this.physicsSprite = new PhysicsSprite(scene, x, y, texture);
    } else {
      this.ghostSprite = scene.add.sprite(x, y, texture);
      this.serverX = x;
      this.serverY = y;
    }

    if (this.debugOptions.enabled) {
      this.debugGraphics = scene.add.graphics();
      this.debugGraphics.setDepth(9999);
    }

    scene.events.on("fixedUpdate", () => this.update());
  }

  applyServerState(state: PhysicsObjectState) {
    this.serverX = state.x;
    this.serverY = state.y;
    this.serverVx = state.vx;
    this.serverVy = state.vy;
    this.serverAngle = state.angle;
    this.lastUpdate = performance.now();

    if (state.hasOwnProperty("radius")) {
      this.shape = "circle";
      this.radius = (state as CircleState).radius;
    } else if (
      state.hasOwnProperty("width") &&
      state.hasOwnProperty("height")
    ) {
      this.shape = "box";
      this.width = (state as BoxState).width;
      this.height = (state as BoxState).height;
    }

    // Local reconciliation
    if (this.isLocal && this.physicsSprite) {
      const body = this.physicsSprite.body;
      if (!body) return;

      const pos = body.getPosition();
      const px = pos.x * PIXELS_PER_METER;
      const py = pos.y * PIXELS_PER_METER;

      const dx = this.serverX - px;
      const dy = this.serverY - py;
      const dist = Math.hypot(dx, dy);

      if (dist > 40) {
        body.setPosition(
          new Vec2(
            this.serverX / PIXELS_PER_METER,
            this.serverY / PIXELS_PER_METER,
          ),
        );
      } else {
        body.setLinearVelocity(
          new Vec2(this.serverVx + dx * 0.1, this.serverVy + dy * 0.1),
        );
      }
    }
    if (!this.isLocal && this.ghostSprite) {
      const g = this.ghostSprite;

      if (this.ghostTween) {
        this.ghostTween.destroy();
      }

      this.ghostTween = this.scene.tweens.add({
        targets: g,
        x: this.serverX,
        y: this.serverY,
        rotation: this.serverAngle,
        ease: "Linear",
        duration: 45,
      });
    }
  }

  update() {
    if (this.isLocal && this.physicsSprite) {
      this.drawDebug();
      return;
    }

    if (!this.isLocal && this.ghostSprite) {
      this.drawDebug();
    }
  }

  setInputVelocity(vx: number, vy: number) {
    if (!this.isLocal || !this.physicsSprite) return;
    this.physicsSprite.setVelocity(vx, vy);
  }

  drawDebug() {
    if (!this.debugOptions.enabled || !this.debugGraphics) return;

    const g = this.debugGraphics;
    g.clear();
    g.alpha = this.debugOptions.alpha!;

    g.fillStyle(this.debugOptions.serverPosColor!, 1);
    g.fillCircle(this.serverX, this.serverY, 4);

    const sx = this.isLocal
      ? this.physicsSprite?.sprite.x
      : this.ghostSprite?.x;

    const sy = this.isLocal
      ? this.physicsSprite?.sprite.y
      : this.ghostSprite?.y;

    if (sx != null && sy != null) {
      g.lineStyle(2, this.debugOptions.interpolationLineColor!, 1);
      g.beginPath();
      g.moveTo(sx, sy);
      g.lineTo(this.serverX, this.serverY);
      g.strokePath();
    }

    if (!this.isLocal && this.ghostSprite) {
      const x = this.ghostSprite.x;
      const y = this.ghostSprite.y;
      const rot = this.ghostSprite.rotation;

      g.lineStyle(2, this.debugOptions.ghostOutlineColor!, 1);

      if (this.shape === "circle") {
        g.strokeCircle(x, y, this.radius);
      } else if (this.shape === "box") {
        const hw = this.width / 2;
        const hh = this.height / 2;

        const corners = [
          { x: -hw, y: -hh },
          { x: hw, y: -hh },
          { x: hw, y: hh },
          { x: -hw, y: hh },
        ];

        const cos = Math.cos(rot);
        const sin = Math.sin(rot);

        const rotated = corners.map((p) => ({
          x: x + p.x * cos - p.y * sin,
          y: y + p.x * sin + p.y * cos,
        }));

        g.beginPath();
        g.moveTo(rotated[0].x, rotated[0].y);
        for (let i = 1; i < rotated.length; i++) {
          g.lineTo(rotated[i].x, rotated[i].y);
        }
        g.closePath();
        g.strokePath();
      }
    }
  }
}
