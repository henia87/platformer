import { PhysicsObject } from './physics-object.model';
import {
  COIN_WIDTH,
  COIN_HEIGHT,
  BEER_WIDTH,
  BEER_HEIGHT,
} from '../game.config';

export type CollectibleType = 'coin' | 'beer';
export type BeerVariant = 'big' | 'small';

export class Collectible extends PhysicsObject {
  type: CollectibleType = 'coin';
  beerVariant: BeerVariant = 'big';
  collected = false;
  fade = 0;
  value = 1;

  constructor(init?: Partial<Collectible>) {
    super(init);
    if (init?.type) this.type = init.type;
    if (init?.beerVariant) this.beerVariant = init.beerVariant;
    if (init?.value !== undefined) this.value = init.value;

    if (this.type === 'coin') {
      this.width = COIN_WIDTH;
      this.height = COIN_HEIGHT;
    } else {
      this.width = BEER_WIDTH;
      this.height = BEER_HEIGHT;
    }

    this.velocity = { x: 0, y: 0 };
    this.acceleration = { x: 0, y: 0 };
  }
}
