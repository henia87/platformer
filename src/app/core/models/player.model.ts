import { PhysicsObject } from './physics-object.model';

type PlayerInit = Partial<PhysicsObject> &
  Partial<Pick<Player, 'health' | 'score'>>;

export class Player extends PhysicsObject {
  health = 100;
  score = 0;

  constructor(init?: PlayerInit) {
    super(init);
    if (!init) return;

    if (init.health !== undefined) this.health = init.health;
    if (init.score !== undefined) this.score = init.score;
  }
}
