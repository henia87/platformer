/**
 * PhysicsService handles physics simulation for game objects, including player movement and gravity.
 * It updates player state based on input and applies forces such as acceleration, drag, and friction.
 *
 * @file PhysicsService provides physics simulation for the game engine.
 */
import { Injectable } from '@angular/core';

import {
  GRAVITY,
  TERMINAL_VELOCITY,
  FRICTION,
  PLAYER_ACCEL_X,
  PLAYER_DRAG_AIR,
  PLAYER_DRAG_GROUND,
  PLAYER_MAX_SPEED_X,
} from '../game.config';
import { Vector2 } from '../utils/vector2';

@Injectable({ providedIn: 'root' })
export class PhysicsService {
  /**
   * Returns the sign of a number (-1, 0, or 1).
   * @param n - The number to check.
   * @returns The sign of the number.
   */
  private sign(n: number) {
    return n < 0 ? -1 : n > 0 ? 1 : 0;
  }

  /**
   * Updates the player's physics state based on input and elapsed time.
   * @param player - The player object to update.
   * @param input - The current input state (left, right, jump).
   * @param dt - Delta time in seconds since the last update.
   */
  updatePlayer(
    player: {
      position: { x: number; y: number };
      velocity: { x: number; y: number };
      acceleration: { x: number; y: number };
      grounded: boolean;
    },
    input: { left: boolean; right: boolean; jump: boolean },
    dt: number,
  ): void {
    const vel = Vector2.from(player.velocity);

    /** Horizontal input -> acceleration */
    let ax = 0;
    if (input.left) ax -= PLAYER_ACCEL_X;
    if (input.right) ax += PLAYER_ACCEL_X;

    /** Apply drag (different on air/ground). Drag is proportional to velocity. */
    const drag = player.grounded ? PLAYER_DRAG_GROUND : PLAYER_DRAG_AIR;
    const dragForce = -vel.x * drag;

    /** Horizontal dynamics */
    vel.x += (ax + dragForce) * dt;

    /** Optional gentle clamp (pre-integration), not hard snap */
    if (PLAYER_MAX_SPEED_X > 0) {
      const sgn = this.sign(vel.x);
      vel.x = Math.min(Math.abs(vel.x), PLAYER_MAX_SPEED_X) * sgn;
    }

    /** Gravity */
    vel.y += GRAVITY * dt;
    /** Terminal velocity */
    if (vel.y > TERMINAL_VELOCITY) vel.y = TERMINAL_VELOCITY;

    /** Integrate */
    player.position.x += vel.x * dt;
    player.position.y += vel.y * dt;

    /** If "friction" as a scalar, apply only when grounded & no input: */
    if (player.grounded && !input.left && !input.right) {
      const f = Math.max(0, 1 - FRICTION * dt);
      player.velocity.x *= f;
      if (Math.abs(player.velocity.x) < 0.01) player.velocity.x = 0;
    }

    player.velocity.x = vel.x;
    player.velocity.y = vel.y;
  }
}
