import { Room, Client } from "@colyseus/core";
import { BoxState, CircleState, GameState } from "./schema/GameState";
import { World } from "planck";
import {
  FIXED_TIMESTEP,
  PHYSICS_TIMESTEP,
  POSITION_ITERATIONS,
  VELOCITY_ITERATIONS,
  WorldConfig,
} from "../../../config/World";
import { EventEmitter } from "events";
import PhysicsObject from "../objects/PhysicsObject";

export class MyRoom extends Room<GameState> {
  maxClients = 4;
  world: World;
  accumulator = 0;
  state = new GameState();
  eventEmitter = new EventEmitter();

  onCreate(options: any) {
    this.world = new World({ gravity: WorldConfig.gravity });
    this.state.balls.push(new CircleState(400, 300, 15));
    this.state.boxes.push(new BoxState(400, 600, 500, 100));
    const ball = new PhysicsObject(this, 400, 300, this.state.balls[0]);
    ball.createCircleBody(15, {
      restitution: 0.8,
    });
    const platform = new PhysicsObject(this, 400, 600, this.state.boxes[0]);
    platform.createBoxBody(500, 100, {
      type: "static",
    });
    this.setSimulationInterval((dt) => {
      this.accumulator += dt;

      while (this.accumulator >= FIXED_TIMESTEP) {
        this.accumulator -= FIXED_TIMESTEP;
        this.fixedUpdate(FIXED_TIMESTEP);
      }
    });
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

  fixedUpdate(dt: number) {
    this.world?.step(
      PHYSICS_TIMESTEP,
      VELOCITY_ITERATIONS,
      POSITION_ITERATIONS,
    );
    this.eventEmitter.emit("fixedUpdate", dt);
  }
}
