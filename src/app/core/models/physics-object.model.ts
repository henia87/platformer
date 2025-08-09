export class PhysicsObject {
  position = { x: 0, y: 0 };
  velocity = { x: 0, y: 0 };
  acceleration = { x: 0, y: 0 };
  width = 0;
  height = 0;
  grounded = false;

  constructor(init?: Partial<PhysicsObject>) {
    if (!init) return;

    if (init.position) {
      this.position = { ...this.position, ...init.position };
    }
    if (init.velocity) {
      this.velocity = { ...this.velocity, ...init.velocity };
    }
    if (init.acceleration) {
      this.acceleration = { ...this.acceleration, ...init.acceleration };
    }

    if (init.width !== undefined) this.width = init.width;
    if (init.height !== undefined) this.height = init.height;
    if (init.grounded !== undefined) this.grounded = init.grounded;
  }
}
