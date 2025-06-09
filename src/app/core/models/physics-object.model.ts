export interface PhysicsObject {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  acceleration: { x: number; y: number };
  grounded?: boolean;
}
