import { TestBed } from '@angular/core/testing';

import { EnemyService } from './enemy.service';
import { Enemy } from '../models/enemy.model';

describe('EnemyService', () => {
  let service: EnemyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnemyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('updateEnemies', () => {
    it('moves the enemy within patrol bounds', () => {
      const enemy = new Enemy({
        position: { x: 100, y: 0 },
        patrolMinX: 50,
        patrolMaxX: 150,
        speed: 40,
        dir: 1,
      });

      service.updateEnemies([enemy], 1);

      expect(enemy.position.x).toBe(140);
      expect(enemy.dir).toBe(1);
    });

    it('clamps at patrolMaxX and flips direction to -1', () => {
      const enemy = new Enemy({
        position: { x: 145, y: 0 },
        patrolMinX: 50,
        patrolMaxX: 150,
        speed: 40,
        dir: 1,
      });

      service.updateEnemies([enemy], 1);

      expect(enemy.position.x).toBe(150);
      expect(enemy.dir).toBe(-1);
    });

    it('clamps at patrolMinX and flips direction to 1', () => {
      const enemy = new Enemy({
        position: { x: 55, y: 0 },
        patrolMinX: 50,
        patrolMaxX: 150,
        speed: 40,
        dir: -1,
      });

      service.updateEnemies([enemy], 1);

      expect(enemy.position.x).toBe(50);
      expect(enemy.dir).toBe(1);
    });

    it('does not move a stationary enemy (patrolMaxX <= patrolMinX)', () => {
      const enemy = new Enemy({
        position: { x: 100, y: 0 },
        patrolMinX: 100,
        patrolMaxX: 100,
        speed: 40,
        dir: 1,
      });

      service.updateEnemies([enemy], 1);

      expect(enemy.position.x).toBe(100);
    });
  });
});
