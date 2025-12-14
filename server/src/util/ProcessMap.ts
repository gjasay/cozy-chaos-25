import fs from "node:fs";
import path from "node:path";
import { Box, Vec2 } from "planck";
import { MapConfig, pixelsToMeters } from "../../../config/World";
import { BoxState } from "../rooms/schema/GameState";
import type { MyRoom } from "../rooms/MyRoom";

interface MapLayerPosition {
  x: number;
  y: number;
  id: number;
}

interface MapLayer {
  name: string;
  positions: MapLayerPosition[];
}

interface MapDefinition {
  tile_size: number;
  map_width: number;
  map_height: number;
  layers: MapLayer[];
}

export interface ProcessedMap {
  map: MapDefinition;
  platforms: BoxState[];
}

function loadMap(mapName: string): MapDefinition {
  const mapPath = path.resolve(
    process.cwd(),
    "../config",
    mapName,
    `${mapName}.json`,
  );

  const raw = fs.readFileSync(mapPath, "utf-8");
  return JSON.parse(raw) as MapDefinition;
}

export function generateCollidersFromMap(
  room: MyRoom,
  mapName = "Map_1",
): ProcessedMap {
  const map = loadMap(mapName);
  const platformsLayer = map.layers.find((layer) => layer.name === "Platforms");

  if (!platformsLayer) {
    return { map, platforms: [] };
  }

  const tileSize = map.tile_size * MapConfig.scale;
  const platforms: BoxState[] = [];
  const rows = new Map<number, number[]>();

  for (const tile of platformsLayer.positions) {
    const list = rows.get(tile.y) ?? [];
    list.push(tile.x);
    rows.set(tile.y, list);
  }

  for (const [y, xs] of rows.entries()) {
    xs.sort((a, b) => a - b);
    let start = xs[0];
    let prev = xs[0];

    const flushRun = (end: number) => {
      const runLength = end - start + 1;
      const width = runLength * tileSize;
      const height = tileSize;
      const centerX = (start + runLength / 2) * tileSize;
      const centerY = (y + 0.5) * tileSize + MapConfig.offsetY;

      const boxState = new BoxState(
        centerX,
        centerY,
        width,
        height,
        "platform",
      );
      platforms.push(boxState);
      room.state.boxes.push(boxState);

      const body = room.world.createBody({
        type: "static",
        position: new Vec2(pixelsToMeters(centerX), pixelsToMeters(centerY)),
      });

      body.createFixture({
        shape: new Box(pixelsToMeters(width) / 2, pixelsToMeters(height) / 2),
        restitution: 0.0,
        friction: 0.0,
      });

      body.setUserData(boxState);
    };

    for (let i = 1; i < xs.length; i++) {
      const x = xs[i];
      if (x === prev + 1) {
        prev = x;
        continue;
      }
      flushRun(prev);
      start = x;
      prev = x;
    }
    flushRun(prev);
  }

  return { map, platforms };
}
