import { PhysicsObject } from './physics-object.model';

export class Platform extends PhysicsObject {
  type: 'grass' | 'stone' | 'ice' = 'grass';
  isStatic = true;

  constructor(init?: Partial<Platform>) {
    super(init);
  }
}
