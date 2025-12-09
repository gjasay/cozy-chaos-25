export const WorldConfig = {
  gravity: { x: 0, y: 10 },
};

export const PIXELS_PER_METER = 50;
export const FIXED_TIMESTEP = 1000 / 60;
export const PHYSICS_TIMESTEP = FIXED_TIMESTEP / 1000;

export function pixelsToMeters(pixels: number): number {
  return pixels / PIXELS_PER_METER;
}

export function metersToPixels(meters: number): number {
  return meters * PIXELS_PER_METER;
}
