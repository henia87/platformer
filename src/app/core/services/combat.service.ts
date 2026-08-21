import { Injectable, inject } from '@angular/core';

import {
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  STOMP_BOUNCE_VY,
  STOMP_VERTICAL_TOLERANCE,
  PLAYER_DAMAGE_AGAINST_PUNK,
  PLAYER_DAMAGE_AGAINST_HOMELESS,
  SIDE_HIT_BAND_PX,
  PLAYER_IFRAME_MS,
  PROJECTILE_DAMAGE,
} from '../game.config';
import { CollisionService } from './collision.service';
import { Enemy } from '../models/enemy.model';
import { Player } from '../models/player.model';
import { Projectile } from '../models/projectile.model';

const ENEMY_KILL_SCORE = 50;

/** A floating combat-text popup (damage, kill, etc.) for the caller to spawn. */
export interface FloaterEvent {
  x: number;
  y: number;
  text: string;
}

/**
 * CombatService resolves damage exchanges between the player, enemies, and projectiles:
 * stomp vs. side-hit detection, i-frames, death handling, and scoring.
 *
 * Methods mutate the passed-in player/enemies/projectiles in place (same convention as
 * PhysicsService) and return the floater popups the caller should spawn via GameStateService.
 */
@Injectable({ providedIn: 'root' })
export class CombatService {
  private collisionService = inject(CollisionService);

  /**
   * Resolves player-vs-enemy contact: stomp kills/damages the enemy and bounces the player;
   * a side hit damages the player (respecting i-frames) and knocks them back.
   */
  handlePlayerEnemyCollision(
    player: Player,
    enemies: Enemy[],
    nowMs: number,
  ): FloaterEvent[] {
    const events: FloaterEvent[] = [];

    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      if (!enemy.alive) continue;

      const hit = this.collisionService.checkAABBCollision(
        {
          position: player.position,
          size: { width: PLAYER_WIDTH, height: PLAYER_HEIGHT },
        },
        {
          position: enemy.position,
          size: { width: enemy.width, height: enemy.height },
        },
      );
      if (!hit) continue;

      if (this.isStompAttack(player, enemy)) {
        const stompDmg =
          enemy.type === 'punk'
            ? PLAYER_DAMAGE_AGAINST_PUNK
            : PLAYER_DAMAGE_AGAINST_HOMELESS;

        const died = this.applyEnemyDamage(enemy, stompDmg, player, events);

        player.velocity.y = -STOMP_BOUNCE_VY;
        player.grounded = false;

        if (died) enemies.splice(i, 1);
        continue;
      }

      // Side-hit: classic AABB penetration-depth heuristic, restricted to a
      // "shoulder band" so near-top grazes aren't counted as lateral hits.
      const px = player.position.x;
      const py = player.position.y;
      const ex = enemy.position.x;
      const ey = enemy.position.y;

      const playerCenterX = px + PLAYER_WIDTH * 0.5;
      const playerCenterY = py + PLAYER_HEIGHT * 0.5;
      const enemyCenterX = ex + enemy.width * 0.5;
      const enemyCenterY = ey + enemy.height * 0.5;

      const dx = playerCenterX - enemyCenterX;
      const dy = playerCenterY - enemyCenterY;
      const penX = PLAYER_WIDTH * 0.5 + enemy.width * 0.5 - Math.abs(dx);
      const penY = PLAYER_HEIGHT * 0.5 + enemy.height * 0.5 - Math.abs(dy);
      const isHorizontalHit = penX < penY;

      const bandTop = ey + SIDE_HIT_BAND_PX;
      const bandBottom = ey + enemy.height - SIDE_HIT_BAND_PX;
      const inSideBand =
        playerCenterY >= bandTop && playerCenterY <= bandBottom;

      if (isHorizontalHit && inSideBand && !player.isInvulnerable(nowMs)) {
        const dmg = enemy.damage;
        player.applyDamage(dmg);

        events.push({
          x: px + PLAYER_WIDTH / 2,
          y: py - 6,
          text: `🩸 -${dmg}`,
        });

        const kb = 140;
        player.velocity.x = px < ex ? -kb : kb;
        player.velocity.y = -120;
        player.grounded = false;

        player.invulnUntilMs = nowMs + PLAYER_IFRAME_MS;
      }
    }

    return events;
  }

  /** Resolves projectile-vs-enemy contact: damages (and may kill) the enemy, consumes the projectile. */
  handleProjectileEnemyCollisions(
    projectiles: Projectile[],
    enemies: Enemy[],
    player: Player,
  ): FloaterEvent[] {
    const events: FloaterEvent[] = [];

    for (let pi = projectiles.length - 1; pi >= 0; pi--) {
      const projectile = projectiles[pi];

      for (let ei = enemies.length - 1; ei >= 0; ei--) {
        const enemy = enemies[ei];
        if (!enemy.alive) continue;

        const hit = this.collisionService.checkAABBCollision(
          {
            position: projectile.position,
            size: { width: projectile.width, height: projectile.height },
          },
          {
            position: enemy.position,
            size: { width: enemy.width, height: enemy.height },
          },
        );
        if (!hit) continue;

        const died = this.applyEnemyDamage(
          enemy,
          PROJECTILE_DAMAGE,
          player,
          events,
        );

        projectiles.splice(pi, 1);
        if (died) enemies.splice(ei, 1);

        break; // stop checking other enemies for this projectile
      }
    }

    return events;
  }

  /** True if the player is falling onto the enemy from above, within stomp tolerance. */
  private isStompAttack(player: Player, enemy: Enemy): boolean {
    const playerFeet = player.position.y + PLAYER_HEIGHT;
    const isFalling = player.velocity.y > 0;
    return (
      isFalling && playerFeet - enemy.position.y <= STOMP_VERTICAL_TOLERANCE
    );
  }

  /** Damages an enemy, pushes the resulting floater(s), and awards score on death. */
  private applyEnemyDamage(
    enemy: Enemy,
    amount: number,
    player: Player,
    events: FloaterEvent[],
  ): boolean {
    enemy.takeDamage(amount);

    events.push({
      x: enemy.position.x + enemy.width / 2,
      y: enemy.position.y - 6,
      text: `⚔️ -${amount}`,
    });

    const died = !enemy.alive;
    if (died) {
      player.score += ENEMY_KILL_SCORE;
      events.push({
        x: enemy.position.x + enemy.width / 2,
        y: enemy.position.y - 16,
        text: '💀',
      });
    }

    return died;
  }
}
