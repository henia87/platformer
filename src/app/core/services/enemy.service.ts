import { Injectable } from '@angular/core';

import { Enemy } from '../models/enemy.model';

/**
 * EnemyService owns enemy behavior updates each frame.
 *
 * Currently handles patrol movement (bouncing between patrolMinX/patrolMaxX).
 * This is the seam for future AI behaviors — chase, flee, ranged attacks —
 * as those grow beyond a simple per-frame position update.
 *
 * Mutates the passed-in enemies in place (same convention as CombatService).
 */
@Injectable({ providedIn: 'root' })
export class EnemyService {
  /** Advances patrol movement for all enemies by one frame. */
  updateEnemies(enemies: Enemy[], deltaTime: number): void {
    for (const e of enemies) {
      if (e.patrolMaxX <= e.patrolMinX) continue;

      e.position.x += e.speed * e.dir * deltaTime;
      if (e.position.x < e.patrolMinX) {
        e.position.x = e.patrolMinX;
        e.dir = 1;
      }
      if (e.position.x > e.patrolMaxX) {
        e.position.x = e.patrolMaxX;
        e.dir = -1;
      }
    }
  }
}
