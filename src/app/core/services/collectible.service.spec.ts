import { TestBed } from '@angular/core/testing';

import {
  COIN_VALUE,
  SMALL_BEER_HP,
  BIG_BEER_HP,
  PLAYER_MAX_HEALTH,
  PICKUP_FADE_TIME,
} from '../game.config';
import { CollectibleService } from './collectible.service';
import { Collectible } from '../models/collectible.model';
import { Player } from '../models/player.model';

describe('CollectibleService', () => {
  let service: CollectibleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CollectibleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('checkPickups', () => {
    it('coin pickup: adds score, marks collected, and returns a floater', () => {
      const player = new Player({ position: { x: 100, y: 100 } });
      const coin = new Collectible({ type: 'coin', position: { x: 100, y: 100 } });

      const events = service.checkPickups(player, [coin], 1 / 60);

      expect(player.score).toBe(COIN_VALUE);
      expect(coin.collected).toBe(true);
      expect(coin.fade).toBe(PICKUP_FADE_TIME);
      expect(events).toEqual([
        expect.objectContaining({ text: `+${COIN_VALUE}` }),
      ]);
    });

    it('small beer pickup: heals the player and returns a floater', () => {
      const player = new Player({ position: { x: 100, y: 100 } });
      player.health = 10;
      const beer = new Collectible({
        type: 'beer',
        beerVariant: 'small',
        position: { x: 100, y: 100 },
      });

      const events = service.checkPickups(player, [beer], 1 / 60);

      expect(player.health).toBe(10 + SMALL_BEER_HP);
      expect(events).toEqual([
        expect.objectContaining({ text: `+${SMALL_BEER_HP} HP` }),
      ]);
    });

    it('big beer pickup: heals the player, capped at max health', () => {
      const player = new Player({ position: { x: 100, y: 100 } });
      player.health = PLAYER_MAX_HEALTH - 1;
      const beer = new Collectible({
        type: 'beer',
        beerVariant: 'big',
        position: { x: 100, y: 100 },
      });

      const events = service.checkPickups(player, [beer], 1 / 60);

      expect(player.health).toBe(PLAYER_MAX_HEALTH);
      expect(events).toEqual([
        expect.objectContaining({ text: `+${BIG_BEER_HP} HP` }),
      ]);
    });

    it('does not re-collect an already-collected item', () => {
      const player = new Player({ position: { x: 100, y: 100 } });
      const coin = new Collectible({ type: 'coin', position: { x: 100, y: 100 } });
      coin.collected = true;
      coin.fade = 0;

      const events = service.checkPickups(player, [coin], 1 / 60);

      expect(player.score).toBe(0);
      expect(events).toEqual([]);
    });

    it('ignores collectibles the player is not overlapping', () => {
      const player = new Player({ position: { x: 0, y: 0 } });
      const coin = new Collectible({ type: 'coin', position: { x: 900, y: 900 } });

      const events = service.checkPickups(player, [coin], 1 / 60);

      expect(coin.collected).toBe(false);
      expect(player.score).toBe(0);
      expect(events).toEqual([]);
    });

    it('ticks down the fade timer for a collected item and clamps at 0', () => {
      const player = new Player({ position: { x: 100, y: 100 } });
      const coin = new Collectible({ type: 'coin', position: { x: 900, y: 900 } });
      coin.collected = true;
      coin.fade = 0.05;

      service.checkPickups(player, [coin], 1 / 60);
      expect(coin.fade).toBeCloseTo(0.05 - 1 / 60, 5);

      service.checkPickups(player, [coin], 1);
      expect(coin.fade).toBe(0);
    });
  });
});
