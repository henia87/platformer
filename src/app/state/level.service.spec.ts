import { TestBed } from '@angular/core/testing';

import { LevelService } from './level.service';
import { ENEMY_HEIGHT } from '../core/game.config';
import { ViewportService } from '../core/services/viewport.service';

describe('LevelService', () => {
  let service: LevelService;
  let viewportService: ViewportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LevelService);
    viewportService = TestBed.inject(ViewportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadLevel', () => {
    it('level 1: returns the expected platforms, collectibles, and enemies', () => {
      const level = service.loadLevel(1);

      expect(level.platforms).toHaveLength(3);
      expect(level.collectibles).toHaveLength(3);
      expect(level.enemies).toHaveLength(2);

      expect(level.platforms[0].position).toEqual({ x: 200, y: 450 });
      expect(level.collectibles[0]).toEqual(
        expect.objectContaining({ type: 'coin', value: 1 }),
      );
      expect(level.enemies[0]).toEqual(
        expect.objectContaining({
          type: 'punk',
          position: {
            x: 400,
            y: viewportService.getCanvasHeight() - ENEMY_HEIGHT,
          },
        }),
      );
    });

    it('returns fresh entity instances on each call', () => {
      const first = service.loadLevel(1);
      const second = service.loadLevel(1);

      expect(first.platforms[0]).not.toBe(second.platforms[0]);
    });

    it('throws for an unknown level id', () => {
      expect(() => service.loadLevel(2)).toThrow();
    });
  });
});
