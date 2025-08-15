import { PhysicsObject } from './physics-object.model';
import {
  ENEMY_WIDTH,
  ENEMY_HEIGHT,
  ENEMY_MAX_HEALTH,
  ENEMY_DAMAGE_PUNK,
  ENEMY_DAMAGE_HOMELESS,
} from '../game.config';

export type EnemyType = 'punk' | 'homeless';

export class Enemy extends PhysicsObject {
  override width = ENEMY_WIDTH;
  override height = ENEMY_HEIGHT;

  type: EnemyType = 'punk';
  health = ENEMY_MAX_HEALTH;
  alive = true;
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

    // Always start with full health
    this.health = ENEMY_MAX_HEALTH;

    // Default contact damage from type if not overridden
    if (init?.damage === undefined) {
      this.damage =
        this.type === 'punk' ? ENEMY_DAMAGE_PUNK : ENEMY_DAMAGE_HOMELESS;
    }
  }

  takeDamage(amount: number) {
    this.health = Math.max(0, this.health - amount);
    this.alive = this.health > 0;
    return !this.alive; // true if died
  }
}
