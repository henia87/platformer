import { PhysicsObject } from './physics-object.model';
import { PLAYER_MAX_HEALTH, PLAYER_MIN_HEALTH } from '../game.config';

type PlayerInit = Partial<PhysicsObject> &
  Partial<Pick<Player, 'health' | 'score'>>;

export class Player extends PhysicsObject {
  health = PLAYER_MAX_HEALTH;
  score = 0;
  invulnUntilMs = 0;

  constructor(init?: PlayerInit) {
    super(init);
    if (!init) return;

    if (init.health !== undefined) this.health = init.health;
    if (init.score !== undefined) this.score = init.score;
  }

  isInvulnerable(nowMs: number): boolean {
    return nowMs < this.invulnUntilMs;
  }

  applyDamage(amount: number): number {
    this.health = Math.max(PLAYER_MIN_HEALTH, this.health - amount);
    return this.health;
  }
}
