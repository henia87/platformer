import { Injectable } from '@angular/core';
import { PhysicsObject } from '../models/physics-object.model';
import {
  GRAVITY,
  TERMINAL_VELOCITY,
  FRICTION, // base ground friction 0..1 per second
  PLAYER_ACCEL_X, // add this to config if not present (e.g., 2200)
  PLAYER_DRAG_AIR, // 0..1 per second (e.g., 1.5)
  PLAYER_DRAG_GROUND, // 0..1 per second (e.g., 6)
  PLAYER_MAX_SPEED_X, // optional, we’ll clamp *softly*
} from '../game.config';

@Injectable({ providedIn: 'root' })
export class PhysicsService {
  private sign(n: number) {
    return n < 0 ? -1 : n > 0 ? 1 : 0;
  }

  updatePlayer(
    player: PhysicsObject,
    input: { left: boolean; right: boolean; jump: boolean },
    dt: number
  ): void {
    // Horizontal input -> acceleration
    let ax = 0;
    if (input.left) ax -= PLAYER_ACCEL_X;
    if (input.right) ax += PLAYER_ACCEL_X;

    // Apply drag (different on air/ground). Drag is proportional to velocity.
    const drag = player.grounded ? PLAYER_DRAG_GROUND : PLAYER_DRAG_AIR;
    const dragForce = -player.velocity.x * drag;

    // Horizontal dynamics
    player.velocity.x += (ax + dragForce) * dt;

    // Optional gentle clamp (pre‑integration), not hard snap
    if (PLAYER_MAX_SPEED_X > 0) {
      const sgn = this.sign(player.velocity.x);
      player.velocity.x =
        Math.min(Math.abs(player.velocity.x), PLAYER_MAX_SPEED_X) * sgn;
    }

    // Gravity
    player.velocity.y += GRAVITY * dt;
    // Terminal velocity
    if (player.velocity.y > TERMINAL_VELOCITY)
      player.velocity.y = TERMINAL_VELOCITY;

    // Integrate
    player.position.x += player.velocity.x * dt;
    player.position.y += player.velocity.y * dt;

    // Call your collision resolver AFTER integration
    // and ensure it adjusts both position *and* velocity tangentially:
    // e.g., if floor hit: player.position.y = floorY; player.velocity.y = 0; player.grounded = true;
    // if wall hit: player.position.x = wallX; player.velocity.x = 0;

    // If you have “friction” as a scalar, apply only when grounded & no input:
    if (player.grounded && !input.left && !input.right) {
      const f = Math.max(0, 1 - FRICTION * dt);
      player.velocity.x *= f;
      if (Math.abs(player.velocity.x) < 0.01) player.velocity.x = 0;
    }
  }
}
