import { PhysicsObject } from './physics-object.model';

type PlayerInit = Partial<PhysicsObject> &
  Partial<Pick<Player, 'lives' | 'score'>>;

export class Player extends PhysicsObject {
  lives = 3;
  score = 0;

  constructor(init?: PlayerInit) {
    super(init);
    if (!init) return;

    if (init.lives !== undefined) this.lives = init.lives;
    if (init.score !== undefined) this.score = init.score;
  }
}
