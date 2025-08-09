// platform.model.ts
import { PhysicsObject } from './physics-object.model';
import { PLATFORM_WIDTH, PLATFORM_HEIGHT } from '../game.config';

export type PlatformInit = Omit<
  Partial<PhysicsObject>,
  'velocity' | 'acceleration' | 'grounded'
> &
  Partial<Pick<Platform, 'type' | 'isStatic'>>;

export class Platform extends PhysicsObject {
  override width = PLATFORM_WIDTH;
  override height = PLATFORM_HEIGHT;

  type: 'grass' | 'stone' | 'ice' = 'grass';
  isStatic = true;

  constructor(init?: PlatformInit) {
    super(init as Partial<PhysicsObject>);

    if (init?.type) this.type = init.type;
    if (init?.isStatic !== undefined) this.isStatic = init.isStatic;

    if (this.isStatic) {
      this.velocity = { x: 0, y: 0 };
      this.acceleration = { x: 0, y: 0 };
    }
  }
}
