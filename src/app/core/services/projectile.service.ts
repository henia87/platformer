import { Injectable, inject } from '@angular/core';

import {
  PLAYER_WIDTH,
  PROJECTILE_WIDTH,
  PROJECTILE_HEIGHT,
  PROJECTILE_SPEED,
  PROJECTILE_TTL_MS,
  PROJECTILE_FIRE_COOLDOWN_MS,
  PROJECTILE_SPAWN_OFFSET_X,
  PROJECTILE_SPAWN_OFFSET_Y,
} from '../game.config';
import { CombatService, FloaterEvent } from './combat.service';
import { Enemy } from '../models/enemy.model';
import { Player } from '../models/player.model';
import { Projectile } from '../models/projectile.model';

/** Subset of the input snapshot ProjectileService cares about. */
export interface ShootingInput {
  left: boolean;
  right: boolean;
  shoot: boolean;
}

/**
 * ProjectileService owns the player's weapon: facing direction, fire cooldown,
 * spawning, and moving projectiles. Collision resolution is delegated to
 * CombatService, whose FloaterEvent[] is passed straight through.
 */
@Injectable({ providedIn: 'root' })
export class ProjectileService {
  private combatService = inject(CombatService);

  private facing = 1;
  private fireReadyAtMs = 0;

  /**
   * Advances the weapon system by one frame: tracks facing, fires if requested
   * and off cooldown, moves existing projectiles, then resolves projectile-vs-enemy hits.
   */
  update(
    projectiles: Projectile[],
    player: Player,
    enemies: Enemy[],
    input: ShootingInput,
    dt: number,
    nowMs: number,
  ): FloaterEvent[] {
    if (input.left) this.facing = -1;
    if (input.right) this.facing = 1;

    this.handleFiring(projectiles, player, input, nowMs);

    for (const p of projectiles) {
      p.position.x += p.velocity.x * dt;
      p.position.y += p.velocity.y * dt;
    }

    return this.combatService.handleProjectileEnemyCollisions(
      projectiles,
      enemies,
      player,
    );
  }

  private handleFiring(
    projectiles: Projectile[],
    player: Player,
    input: ShootingInput,
    nowMs: number,
  ): void {
    if (!input.shoot || nowMs < this.fireReadyAtMs) return;

    const dir = this.facing >= 0 ? 1 : -1;
    const spawnX =
      player.position.x +
      (dir > 0 ? PLAYER_WIDTH : 0) +
      dir * PROJECTILE_SPAWN_OFFSET_X;
    const spawnY = player.position.y + PROJECTILE_SPAWN_OFFSET_Y;

    projectiles.push(
      new Projectile({
        position: { x: spawnX, y: spawnY },
        velocity: { x: dir * PROJECTILE_SPEED, y: 0 },
        width: PROJECTILE_WIDTH,
        height: PROJECTILE_HEIGHT,
        ttlMs: PROJECTILE_TTL_MS,
      }),
    );

    this.fireReadyAtMs = nowMs + PROJECTILE_FIRE_COOLDOWN_MS;
  }
}
