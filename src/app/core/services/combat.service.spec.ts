import { TestBed } from '@angular/core/testing';

import {
  ENEMY_DAMAGE_PUNK,
  PLAYER_DAMAGE_AGAINST_PUNK,
  PLAYER_IFRAME_MS,
  PROJECTILE_DAMAGE,
  STOMP_BOUNCE_VY,
} from '../game.config';
import { CombatService } from './combat.service';
import { Enemy } from '../models/enemy.model';
import { Player } from '../models/player.model';
import { Projectile } from '../models/projectile.model';

describe('CombatService', () => {
  let service: CombatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CombatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('handlePlayerEnemyCollision', () => {
    function makeStompScenario() {
      const enemy = new Enemy({ type: 'punk', position: { x: 100, y: 100 } });
      // Feet overlap the enemy's top by 5px — within STOMP_VERTICAL_TOLERANCE,
      // and enough overlap for the AABB check (which requires strict overlap).
      const player = new Player({ position: { x: 100, y: 100 - 45 + 5 } });
      player.velocity.y = 50; // falling
      return { player, enemy };
    }

    function makeSideHitScenario() {
      const enemy = new Enemy({ type: 'punk', position: { x: 100, y: 100 } });
      const player = new Player({ position: { x: 90, y: 100 } }); // approaching from the left
      player.velocity.y = 0; // not falling
      return { player, enemy };
    }

    it('stomp: damages the enemy, bounces the player, and does not kill it below its max health', () => {
      const { player, enemy } = makeStompScenario();

      const events = service.handlePlayerEnemyCollision(player, [enemy], 1000);

      expect(enemy.health).toBe(100 - PLAYER_DAMAGE_AGAINST_PUNK);
      expect(enemy.alive).toBe(true);
      expect(player.velocity.y).toBe(-STOMP_BOUNCE_VY);
      expect(player.grounded).toBe(false);
      expect(events).toEqual([
        expect.objectContaining({ text: `⚔️ -${PLAYER_DAMAGE_AGAINST_PUNK}` }),
      ]);
    });

    it('stomp: kills the enemy, awards score, removes it, and emits a death floater', () => {
      const { player, enemy } = makeStompScenario();
      enemy.health = 5; // dies from a single stomp

      const enemies = [enemy];
      const events = service.handlePlayerEnemyCollision(player, enemies, 1000);

      expect(enemy.alive).toBe(false);
      expect(enemies).toHaveLength(0);
      expect(player.score).toBe(50);
      expect(events.map((e) => e.text)).toEqual([
        `⚔️ -${PLAYER_DAMAGE_AGAINST_PUNK}`,
        '💀',
      ]);
    });

    it('side hit: damages the player, applies knockback, and starts i-frames when not invulnerable', () => {
      const { player, enemy } = makeSideHitScenario();
      const startHealth = player.health;

      const events = service.handlePlayerEnemyCollision(player, [enemy], 1000);

      expect(player.health).toBe(startHealth - ENEMY_DAMAGE_PUNK);
      expect(player.velocity.x).toBeLessThan(0); // knocked back to the left (away from enemy)
      expect(player.invulnUntilMs).toBe(1000 + PLAYER_IFRAME_MS);
      expect(events).toEqual([
        expect.objectContaining({ text: `🩸 -${ENEMY_DAMAGE_PUNK}` }),
      ]);
    });

    it('side hit: does no damage while the player is still invulnerable', () => {
      const { player, enemy } = makeSideHitScenario();
      player.invulnUntilMs = 2000; // still active at nowMs=1000
      const startHealth = player.health;

      const events = service.handlePlayerEnemyCollision(player, [enemy], 1000);

      expect(player.health).toBe(startHealth);
      expect(events).toEqual([]);
    });
  });

  describe('handleProjectileEnemyCollisions', () => {
    function makeHitScenario() {
      const enemy = new Enemy({ type: 'punk', position: { x: 200, y: 50 } });
      const projectile = new Projectile({ position: { x: 200, y: 50 } });
      const player = new Player();
      return { player, enemy, projectile };
    }

    it('damages the enemy and always consumes the projectile, without killing a healthy enemy', () => {
      const { player, enemy, projectile } = makeHitScenario();

      const projectiles = [projectile];
      const enemies = [enemy];
      const events = service.handleProjectileEnemyCollisions(
        projectiles,
        enemies,
        player,
      );

      expect(enemy.health).toBe(100 - PROJECTILE_DAMAGE);
      expect(enemy.alive).toBe(true);
      expect(projectiles).toHaveLength(0);
      expect(enemies).toHaveLength(1);
      expect(events).toEqual([
        expect.objectContaining({ text: `⚔️ -${PROJECTILE_DAMAGE}` }),
      ]);
    });

    it('kills a low-health enemy, awards score, and removes both the enemy and the projectile', () => {
      const { player, enemy, projectile } = makeHitScenario();
      enemy.health = 10;

      const projectiles = [projectile];
      const enemies = [enemy];
      const events = service.handleProjectileEnemyCollisions(
        projectiles,
        enemies,
        player,
      );

      expect(enemy.alive).toBe(false);
      expect(projectiles).toHaveLength(0);
      expect(enemies).toHaveLength(0);
      expect(player.score).toBe(50);
      expect(events.map((e) => e.text)).toEqual([
        `⚔️ -${PROJECTILE_DAMAGE}`,
        '💀',
      ]);
    });
  });
});
