import { Injectable } from '@angular/core';
import { Player } from '../core/models/player.model';
import { Platform } from '../core/models/platform.model';
import {
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLATFORM_WIDTH,
  PLATFORM_HEIGHT,
} from '../core/game.config';

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
}
