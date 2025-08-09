import { PhysicsObject } from './physics-object.model';

export type EnemyType = 'punk' | 'homeless';

export class Enemy extends PhysicsObject {
  type: EnemyType = 'punk';
  damage = 15;

  patrolMinX = 0;
  patrolMaxX = 0;
  speed = 40; // px/sec
  dir = 1; // 1 or -1

  constructor(init?: Partial<Enemy>) {
    super(init);
    if (init?.type) this.type = init.type;
    if (init?.damage !== undefined) this.damage = init.damage;
    if (init?.patrolMinX !== undefined) this.patrolMinX = init.patrolMinX;
    if (init?.patrolMaxX !== undefined) this.patrolMaxX = init.patrolMaxX;
    if (init?.speed !== undefined) this.speed = init.speed;
    if (init?.dir !== undefined) this.dir = init.dir;
  }
}
