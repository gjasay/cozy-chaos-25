import { Room, Client } from "@colyseus/core";
import { GameState } from "./schema/GameState";
import { World } from "planck";
import { FIXED_TIMESTEP } from "../../../config/World";

export class MyRoom extends Room<GameState> {
  maxClients = 4;
  world: World;
  accumulator = 0;
  state = new GameState();

  onCreate(options: any) {
    this.onMessage("type", (client, message) => {});

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

  fixedUpdate(dt: number) {}
}
