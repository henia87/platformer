export class PhysicsObject {
  position = { x: 0, y: 0 };
  velocity = { x: 0, y: 0 };
  acceleration = { x: 0, y: 0 };
  grounded = false;
  width = 0;
  height = 0;

  constructor(init?: Partial<PhysicsObject>) {
    Object.assign(this, init);
  }
}
