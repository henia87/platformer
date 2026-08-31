import { TestBed } from '@angular/core/testing';

import {
  PROJECTILE_DAMAGE,
  PROJECTILE_FIRE_COOLDOWN_MS,
  PROJECTILE_SPEED,
} from '../game.config';
import { ProjectileService, ShootingInput } from './projectile.service';
import { Enemy } from '../models/enemy.model';
import { Player } from '../models/player.model';
import { Projectile } from '../models/projectile.model';

describe('ProjectileService', () => {
  let service: ProjectileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  function input(overrides: Partial<ShootingInput> = {}): ShootingInput {
    return { left: false, right: false, shoot: false, ...overrides };
  }

  it('does not fire while shoot is not held', () => {
    const player = new Player();

    const events = service.update(
      [],
      player,
      [],
      input({ shoot: false }),
      1 / 60,
      1000,
    );

    expect(events).toEqual([]);
  });

  it('fires a projectile facing right by default, and blocks a second shot before cooldown elapses', () => {
    const player = new Player({ position: { x: 100, y: 100 } });
    const projectiles: Projectile[] = [];

    service.update(
      projectiles,
      player,
      [],
      input({ shoot: true }),
      1 / 60,
      1000,
    );
    expect(projectiles).toHaveLength(1);
    expect(projectiles[0].velocity.x).toBe(PROJECTILE_SPEED);

    // Still within the cooldown window — no second projectile.
    service.update(
      projectiles,
      player,
      [],
      input({ shoot: true }),
      1 / 60,
      1000 + PROJECTILE_FIRE_COOLDOWN_MS - 1,
    );
    expect(projectiles).toHaveLength(1);
  });

  it('fires facing left after moving left, and re-fires once the cooldown has elapsed', () => {
    const player = new Player({ position: { x: 100, y: 100 } });
    const projectiles: Projectile[] = [];

    service.update(
      projectiles,
      player,
      [],
      input({ left: true }),
      1 / 60,
      1000,
    );
    service.update(
      projectiles,
      player,
      [],
      input({ shoot: true }),
      1 / 60,
      1000,
    );
    expect(projectiles[0].velocity.x).toBe(-PROJECTILE_SPEED);

    service.update(
      projectiles,
      player,
      [],
      input({ shoot: true }),
      1 / 60,
      1000 + PROJECTILE_FIRE_COOLDOWN_MS,
    );
    expect(projectiles).toHaveLength(2);
  });

  it('moves existing projectiles by velocity * dt', () => {
    const player = new Player();
    const projectile = new Projectile({
      position: { x: 0, y: 0 },
      velocity: { x: 100, y: 50 },
    });

    service.update([projectile], player, [], input(), 0.1, 1000);

    expect(projectile.position.x).toBeCloseTo(10);
    expect(projectile.position.y).toBeCloseTo(5);
  });

  it('delegates to CombatService and returns its events when a projectile reaches an enemy', () => {
    const player = new Player();
    const enemy = new Enemy({ type: 'punk', position: { x: 100, y: 100 } });
    const projectile = new Projectile({ position: { x: 100, y: 100 } });

    const projectiles = [projectile];
    const enemies = [enemy];
    const events = service.update(
      projectiles,
      player,
      enemies,
      input(),
      0,
      1000,
    );

    expect(enemy.health).toBe(100 - PROJECTILE_DAMAGE);
    expect(projectiles).toHaveLength(0);
    expect(events).toEqual([
      expect.objectContaining({ text: `⚔️ -${PROJECTILE_DAMAGE}` }),
    ]);
  });
});
