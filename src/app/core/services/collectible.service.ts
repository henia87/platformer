import { Injectable, inject } from '@angular/core';

import {
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PICKUP_FADE_TIME,
  SMALL_BEER_HP,
  BIG_BEER_HP,
  PLAYER_MAX_HEALTH,
  COIN_VALUE,
} from '../game.config';
import { CollisionService } from './collision.service';
import { FloaterEvent } from './combat.service';
import { Collectible } from '../models/collectible.model';
import { Player } from '../models/player.model';

/**
 * CollectibleService resolves player-vs-collectible pickups (coins, beers): detection,
 * scoring, health restoration, and the post-pickup fade-out timer.
 *
 * Mutates the passed-in player/collectibles in place (same convention as CombatService)
 * and returns the floater popups the caller should spawn via GameStateService.
 */
@Injectable({ providedIn: 'root' })
export class CollectibleService {
  private collisionService = inject(CollisionService);

  /**
   * Checks all collectibles against the player for pickups, applies score/health,
   * and ticks down the fade-out timer for already-collected items.
   */
  checkPickups(
    player: Player,
    collectibles: Collectible[],
    deltaTime: number,
  ): FloaterEvent[] {
    const events: FloaterEvent[] = [];

    for (const c of collectibles) {
      if (c.collected) {
        if (c.fade > 0) {
          c.fade -= deltaTime;
          if (c.fade < 0) c.fade = 0;
        }
        continue;
      }

      const hit = this.collisionService.checkAABBCollision(
        {
          position: player.position,
          size: { width: PLAYER_WIDTH, height: PLAYER_HEIGHT },
        },
        { position: c.position, size: { width: c.width, height: c.height } },
      );
      if (!hit) continue;

      c.collected = true;
      c.fade = PICKUP_FADE_TIME;

      const label =
        c.type === 'coin'
          ? `+${COIN_VALUE}`
          : c.beerVariant === 'small'
            ? `+${SMALL_BEER_HP} HP`
            : `+${BIG_BEER_HP} HP`;

      events.push({ x: c.position.x, y: c.position.y - 4, text: label });

      if (c.type === 'coin') {
        player.score += COIN_VALUE;
      } else {
        const heal = c.beerVariant === 'small' ? SMALL_BEER_HP : BIG_BEER_HP;
        player.health = Math.min(PLAYER_MAX_HEALTH, player.health + heal);
      }
      // TODO: SFX/particles
    }

    return events;
  }
}
