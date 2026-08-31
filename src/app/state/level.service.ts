import { Injectable, inject } from '@angular/core';

import {
  PLATFORM_WIDTH,
  PLATFORM_HEIGHT,
  ENEMY_HEIGHT,
} from '../core/game.config';
import { Collectible } from '../core/models/collectible.model';
import { Enemy } from '../core/models/enemy.model';
import { Platform } from '../core/models/platform.model';
import { ViewportService } from '../core/services/viewport.service';

/** The entities that make up a level's initial layout. */
export interface LevelData {
  platforms: Platform[];
  collectibles: Collectible[];
  enemies: Enemy[];
}

/**
 * LevelService builds the entity layout for a given level.
 *
 * A factory, not a store: GameStateService holds/owns the live entities,
 * LevelService just knows how to construct them for a given levelId.
 */
@Injectable({ providedIn: 'root' })
export class LevelService {
  private viewportService = inject(ViewportService);

  /** Builds the entity layout for the given level. Only level 1 exists today. */
  loadLevel(levelId: number): LevelData {
    if (levelId !== 1) {
      throw new Error(`LevelService: no level data for levelId ${levelId}`);
    }

    const canvasHeight = this.viewportService.getCanvasHeight();

    return {
      platforms: [
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
      ],
      collectibles: [
        new Collectible({
          type: 'coin',
          value: 1,
          position: { x: 220, y: 420 },
        }),
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
      ],
      enemies: [
        new Enemy({
          position: { x: 400, y: canvasHeight - ENEMY_HEIGHT },
          type: 'punk',
          damage: 15,
          patrolMinX: 350,
          patrolMaxX: 450,
          speed: 40,
          dir: 1,
        }),
        new Enemy({
          position: { x: 600, y: canvasHeight - ENEMY_HEIGHT },
          type: 'homeless',
          damage: 10,
          patrolMinX: 550,
          patrolMaxX: 650,
          speed: 30,
          dir: -1,
        }),
      ],
    };
  }
}
