import { Injectable, inject } from '@angular/core';

import { LevelService } from './level.service';
import { PLAYER_WIDTH, PLAYER_HEIGHT } from '../core/game.config';
import { Collectible } from '../core/models/collectible.model';
import { Enemy } from '../core/models/enemy.model';
import { FloatingText } from '../core/models/floating-text.model';
import { Platform } from '../core/models/platform.model';
import { Player } from '../core/models/player.model';
import { Projectile } from '../core/models/projectile.model';
import { Vector2 } from '../core/utils/vector2';

/** Manages the game state, including player, platforms, collectibles, enemies, and floating text. */
@Injectable({
  providedIn: 'root',
})
export class GameStateService {
  private levelService = inject(LevelService);

  private level = this.levelService.loadLevel(1);

  player = new Player({
    position: { x: 0, y: 0 },
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
  });

  platforms: Platform[] = this.level.platforms;
  collectibles: Collectible[] = this.level.collectibles;
  enemies: Enemy[] = this.level.enemies;

  floaters: FloatingText[] = [];

  spawnFloater(x: number, y: number, text: string) {
    this.floaters.push({ text, x, y0: y, bornAt: performance.now() });
  }

  /** In-place prune to avoid breaking the array reference */
  pruneFloaters(nowMs: number, ttlMs: number) {
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      if (nowMs - this.floaters[i].bornAt >= ttlMs) {
        this.floaters.splice(i, 1);
      }
    }
  }

  projectiles: Projectile[] = [];

  spawnProjectile(
    x: number,
    y: number,
    vx: number,
    vy: number,
    w: number,
    h: number,
    ttlMs: number,
  ) {
    this.projectiles.push(
      new Projectile({
        position: new Vector2(x, y),
        velocity: new Vector2(vx, vy),
        width: w,
        height: h,
        ttlMs,
      }),
    );
  }

  pruneProjectiles(nowMs: number, dtMs: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.ttlMs -= dtMs;
      if (p.ttlMs <= 0) this.projectiles.splice(i, 1);
    }
  }
}
