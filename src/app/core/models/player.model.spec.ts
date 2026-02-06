import { PLAYER_MIN_HEALTH } from '../game.config';
import { Player } from './player.model';

describe('Player', () => {
  describe('applyDamage', () => {
    it('should subtract health and return the new health', () => {
      const player = new Player({ health: 10 });

      const newHealth = player.applyDamage(3);

      expect(newHealth).toBe(7);
      expect(player.health).toBe(7);
    });

    it('should clamp health to PLAYER_MIN_HEALTH and return it', () => {
      const player = new Player({ health: 10 });

      const newHealth = player.applyDamage(999);

      expect(newHealth).toBe(PLAYER_MIN_HEALTH);
      expect(player.health).toBe(PLAYER_MIN_HEALTH);
    });
  });
});
