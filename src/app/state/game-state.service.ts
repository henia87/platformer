import { Injectable } from '@angular/core';
import { Player } from '../core/models/player.model';
import { Platform } from '../core/models/platform.model';
import { Collectible } from '../core/models/collectible.model';
import { Enemy } from '../core/models/enemy.model';
import { FloatingText } from '../core/models/floating-text.model';
import {
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLATFORM_WIDTH,
  PLATFORM_HEIGHT,
  ENEMY_HEIGHT,
  CANVAS_HEIGHT,
} from '../core/game.config';
import { Projectile } from '../core/models/projectile.model';
import { Vector2 } from '../core/utils/vector2';

/** Manages the game state, including player, platforms, collectibles, enemies, and floating text. */
@Injectable({
  providedIn: 'root',
})
export class GameStateService {
  player = new Player({
    position: { x: 0, y: 0 },
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
  });

  platforms: Platform[] = [
    new Platform({
      position: { x: 200, y: 450 },
      width: PLATFORM_WIDTH,
      height: PLATFORM_HEIGHT,
    }),
    new Platform({
      position: { x: 300, y: 300 },
      width: PLATFORM_WIDTH,
      height: PLATFORM_HEIGHT,
    }),
    new Platform({
      position: { x: 500, y: 200 },
      width: PLATFORM_WIDTH,
      height: PLATFORM_HEIGHT,
    }),
  ];

  collectibles: Collectible[] = [
    new Collectible({ type: 'coin', value: 1, position: { x: 220, y: 420 } }),
    new Collectible({
      type: 'beer',
      beerVariant: 'big',
      value: 5,
      position: { x: 300, y: 300 },
    }),
    new Collectible({
      type: 'beer',
      beerVariant: 'small',
      value: 2,
      position: { x: 500, y: 260 },
    }),
  ];

  enemies: Enemy[] = [
    new Enemy({
      position: { x: 400, y: CANVAS_HEIGHT - ENEMY_HEIGHT },
      type: 'punk',
      damage: 15,
      patrolMinX: 350,
      patrolMaxX: 450,
      speed: 40,
      dir: 1,
    }),
    new Enemy({
      position: { x: 600, y: CANVAS_HEIGHT - ENEMY_HEIGHT },
      type: 'homeless',
      damage: 10,
      patrolMinX: 550,
      patrolMaxX: 650,
      speed: 30,
      dir: -1,
    }),
  ];

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
    ttlMs: number
  ) {
    this.projectiles.push(
      new Projectile({
        position: new Vector2(x, y),
        velocity: new Vector2(vx, vy),
        width: w,
        height: h,
        ttlMs,
      })
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
