import { PhysicsObject } from './physics-object.model';

export class Player extends PhysicsObject {
  lives = 3;
  score = 0;

  constructor(init?: Partial<Player>) {
    super(init);
  }
}
