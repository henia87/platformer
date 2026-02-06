import { Enemy } from './enemy.model';

describe('Enemy', () => {
  describe('takeDamage', () => {
    it('should subtract health, keep alive=true, and return the new health when health stays above 0', () => {
      const enemy = new Enemy();
      enemy.health = 10;
      enemy.alive = true;

      const newHealth = enemy.takeDamage(3);

      expect(newHealth).toBe(7);
      expect(enemy.health).toBe(7);
      expect(enemy.alive).toBe(true);
    });

    it('should clamp health to 0, set alive=false, and return 0 when damage would drop below 0', () => {
      const enemy = new Enemy();
      enemy.health = 10;
      enemy.alive = true;

      const newHealth = enemy.takeDamage(999);

      expect(newHealth).toBe(0);
      expect(enemy.health).toBe(0);
      expect(enemy.alive).toBe(false);
    });
  });
});
