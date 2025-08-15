import { Vector2 } from '../../core/utils/vector2';
import {
  PROJECTILE_WIDTH,
  PROJECTILE_HEIGHT,
  PROJECTILE_TTL_MS,
} from '../game.config';

// Accept Vector2 or a plain {x,y} without using `any`
type VecLike = Vector2 | { x: number; y: number };

export interface ProjectileInit {
  position?: VecLike;
  velocity?: VecLike;
  width?: number;
  height?: number;
  ttlMs?: number;
  fromPlayer?: boolean;
}

export class Projectile {
  position: Vector2 = new Vector2(0, 0);
  velocity: Vector2 = new Vector2(0, 0);
  width: number = PROJECTILE_WIDTH;
  height: number = PROJECTILE_HEIGHT;
  ttlMs: number = PROJECTILE_TTL_MS;
  fromPlayer = true; // future-proofing

  constructor(init: ProjectileInit = {}) {
    const { position, velocity, width, height, ttlMs, fromPlayer } = init;

    if (position) {
      if (position instanceof Vector2) this.position.copy(position);
      else this.position.set(position.x, position.y);
    }

    if (velocity) {
      if (velocity instanceof Vector2) this.velocity.copy(velocity);
      else this.velocity.set(velocity.x, velocity.y);
    }

    if (typeof width === 'number') this.width = width;
    if (typeof height === 'number') this.height = height;
    if (typeof ttlMs === 'number') this.ttlMs = ttlMs;
    if (typeof fromPlayer === 'boolean') this.fromPlayer = fromPlayer;
  }
}
