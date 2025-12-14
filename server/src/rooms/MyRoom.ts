import { Room, Client } from "@colyseus/core";
import { GameState, PlayerState } from "./schema/GameState";
import { World } from "planck";
import {
  FIXED_TIMESTEP,
  PHYSICS_TIMESTEP,
  POSITION_ITERATIONS,
  VELOCITY_ITERATIONS,
  WorldConfig,
} from "../../../config/World";
import { EventEmitter } from "events";
import { PlayerConfig, InputState } from "../../../config/Player";
import { PlayerObject } from "../objects/PlayerObject";
import { generateCollidersFromMap } from "../util/ProcessMap";

export class MyRoom extends Room<GameState> {
  maxClients = 4;
  world: World;
  accumulator = 0;
  state = new GameState();
  eventEmitter = new EventEmitter();
  jumpTimer: NodeJS.Timeout | null;
  playerObjects: Map<string, PlayerObject> = new Map();

  onCreate(options: any) {
    this.onMessage("input", (client: Client, input: InputState) =>
      this.eventEmitter.emit(client.sessionId, input),
    );
    this.world = new World({ gravity: WorldConfig.gravity });
    generateCollidersFromMap(this);
    this.setSimulationInterval((dt) => {
      this.accumulator += dt;

      while (this.accumulator >= FIXED_TIMESTEP) {
        this.accumulator -= FIXED_TIMESTEP;
        this.fixedUpdate(FIXED_TIMESTEP);
      }
    });
  }

  onJoin(client: Client, options: any) {
    const position = this.generateRandomPosition();
    const player = new PlayerState(
      position.x,
      position.y,
      PlayerConfig.physicsBody.width,
      PlayerConfig.physicsBody.height,
    );

    const obj = new PlayerObject(
      client.sessionId,
      this,
      position.x,
      position.y,
      player,
    );
    this.playerObjects.set(client.sessionId, obj);
    this.state.players.set(client.sessionId, player);
    console.log(
      client.sessionId,
      `Dropped in at (${position.x}, ${position.y})`,
    );
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    this.playerObjects.delete(client.sessionId);
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

  private generateRandomPosition(): { x: number; y: number } {
    const x = Math.floor(Math.random() * 800) + 50;
    const y = Math.floor(Math.random() * 600) + 50;
    return { x, y };
  }

  // Handle a stomp: killer gains score, victim respawns.
  public handlePlayerStomp(
    killerState: PlayerState,
    victimState: PlayerState,
  ): void {
    let killerId: string | undefined;
    let victimId: string | undefined;

    this.state.players.forEach((value, key) => {
      if (value === killerState) killerId = key;
      if (value === victimState) victimId = key;
    });

    if (!killerId || !victimId || killerId === victimId) return;

    killerState.score += 1;
    this.respawnPlayer(victimId);
  }

  private respawnPlayer(sessionId: string) {
    const playerState = this.state.players.get(sessionId);
    const obj = this.playerObjects.get(sessionId);
    if (!playerState || !obj) return;

    const pos = this.generateRandomPosition();
    playerState.x = pos.x;
    playerState.y = pos.y;
    playerState.vx = 0;
    playerState.vy = 0;
    obj.setPosition(pos.x, pos.y);
    obj.setVelocity(0, 0);
  }
}
