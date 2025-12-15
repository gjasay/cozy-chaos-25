export const PlayerConfig = {
  physicsBody: {
    width: 32,
    height: 32,
    density: 1.0,
    friction: 0.0,
    linearDamping: 0.25,
    restitution: 0.0,
    fixedRotation: true,
    allowSleep: false,
  },
  speed: 6,
  horizontalAccel: 120,
  horizontalDecel: 40,
  jumpImpulse: 3.5,
};

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
}
