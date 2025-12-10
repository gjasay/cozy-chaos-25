import * as Colyseus from "colyseus.js";
import { GameState } from "../../../schema/GameState";

interface NetworkConfig {
  endpoint: string;
  roomName: string;
  options?: any;
}

type NonFunctionPropNames<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

export class NetworkManager {
  private static instance: NetworkManager;
  private client: Colyseus.Client;
  private room: Colyseus.Room<GameState> | null = null;
  private reconnectionToken: string | null = null;

  private isConnecting: boolean = false;
  private isConnected: boolean = false;

  private messageHandlers: Map<string, Array<(message: any) => void>> =
    new Map();

  private constructor() {
    this.client = new Colyseus.Client();
  }

  public static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  public async connect(config: NetworkConfig): Promise<Colyseus.Room> {
    if (this.isConnecting) {
      throw new Error("Connection already in progress");
    }

    if (this.isConnected && this.room) {
      console.warn("Already connected to room");
      return this.room;
    }

    this.isConnecting = true;

    try {
      this.client = new Colyseus.Client(config.endpoint);

      if (this.reconnectionToken) {
        try {
          this.room = await this.client.reconnect(this.reconnectionToken);
          console.log("Reconnected to existing room");
        } catch (e) {
          console.log("Reconnection failed, joining new room");
          this.room = await this.client.joinOrCreate(
            config.roomName,
            config.options,
          );
        }
      } else {
        this.room = await this.client.joinOrCreate(
          config.roomName,
          config.options,
        );
      }

      this.setupRoomHandlers();
      this.isConnected = true;
      this.isConnecting = false;
      console.log("Connected to room :)");

      return this.room;
    } catch (error) {
      this.isConnecting = false;
      console.error("Failed to connect:", error);
      throw error;
    }
  }

  private setupRoomHandlers(): void {
    if (!this.room) return;

    this.room!.onError((code, message) => {
      console.error("Room error:", code, message);
    });

    this.room!.onLeave((code) => {
      console.log("Left room with code:", code);
      this.isConnected = false;

      if (code === 1000) {
        this.reconnectionToken = this.room?.reconnectionToken || null;
      }
    });

    this.messageHandlers.forEach((handlers, messageType) => {
      handlers.forEach((handler) => {
        this.room!.onMessage(messageType, handler);
      });
    });
  }

  public send(type: string, message?: any): void {
    if (!this.room) {
      console.error("Cannot send message: not connected to room");
      return;
    }
    this.room.send(type, message);
  }

  public onMessage(type: string, callback: (message: any) => void): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(callback);

    if (this.room) {
      this.room.onMessage(type, callback);
    }
  }

  public offMessage(type: string, callback: (message: any) => void): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(callback);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  public listen(
    state: string,
    property: NonFunctionPropNames<GameState>,
    callback: (currentValue: any, previousValue: any) => void,
  ): void {
    if (this.room) {
      const $ = Colyseus.getStateCallbacks(this.room);
      
      //@ts-ignore implicity any type
      $(this.room.state)[state].listen(property, callback);
    }
  }

  public onAdd(
    collectionPath: string,
    callback: (entity: any, key: string) => void,
  ): void {
    if (this.room) {
      const $ = Colyseus.getStateCallbacks(this.room);

      //@ts-ignore implicity any type
      $(this.room.state)[collectionPath].onAdd(callback);
    }
  }

  public onRemove(
    collectionPath: string,
    callback: (entity: any, key: string) => void,
  ): void {
    if (this.room) {
      const $ = Colyseus.getStateCallbacks(this.room);

      //@ts-ignore implicity any type
      $(this.room.state)[collectionPath].onRemove(callback);
    }
  }

  public onChange(
    collectionPath: string,
    callback: (entity: any, key: string) => void,
  ): void {
    if (this.room) {
      const $ = Colyseus.getStateCallbacks(this.room);

      //@ts-ignore implicity any type
      $(this.room.state)[collectionPath].onChange(callback);
    }
  }

  public getState(): any {
    return this.room?.state;
  }

  public getCallbacks(): any {
    if (this.room) {
      return Colyseus.getStateCallbacks(this.room);
    }
    return null;
  }

  public getSessionId(): string | undefined {
    return this.room?.sessionId;
  }

  public async disconnect(): Promise<void> {
    if (this.room) {
      await this.room.leave();
      this.room = null;
      this.isConnected = false;
    }
  }

  public get connected(): boolean {
    return this.isConnected;
  }

  public getRoom(): Colyseus.Room | null {
    return this.room;
  }

  public cleanup(): void {
    this.messageHandlers.clear();
  }
}
