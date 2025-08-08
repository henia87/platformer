import { Injectable } from '@angular/core';
import { PhysicsObject } from '../models/physics-object.model';
import {
  GRAVITY,
  TERMINAL_VELOCITY,
  FRICTION,
  VELOCITY_THRESHOLD,
  FRICTION_GRACE_PERIOD,
  FRICTION_RAMP_DURATION,
  FRICTION_MIN,
} from '../game.config';

@Injectable({
  providedIn: 'root',
})
export class PhysicsService {
  private gravity = GRAVITY;
  private terminalVelocity = TERMINAL_VELOCITY;

  // Track how long the player has been grounded
  private groundedTime = 0;
  private wasGrounded = false;

  updatePlayer(player: PhysicsObject, deltaTime: number): void {
    player.acceleration.y = player.grounded ? 0 : this.gravity;

    // Integrate acceleration into velocity
    player.velocity.x += player.acceleration.x * deltaTime;
    player.velocity.y += player.acceleration.y * deltaTime;

    this.applyFriction(player, deltaTime);

    // Clamp vertical velocity
    if (player.velocity.y > this.terminalVelocity) {
      player.velocity.y = this.terminalVelocity;
    }

    // Apply velocity to position
    player.position.x += player.velocity.x * deltaTime;
    player.position.y += player.velocity.y * deltaTime;

    // Reset acceleration for next frame
    player.acceleration = { x: 0, y: 0 };
  }

  private applyFriction(player: PhysicsObject, deltaTime: number): void {
    if (player.grounded && player.acceleration.x === 0) {
      player.velocity.x -= player.velocity.x * FRICTION * deltaTime;

      // Snap to 0 if very slow
      if (Math.abs(player.velocity.x) < VELOCITY_THRESHOLD) {
        player.velocity.x = 0;
      }
    } else if (player.grounded) {
      if (!this.wasGrounded) {
        this.groundedTime = 0;
      } else {
        this.groundedTime += deltaTime;
      }

      if (player.acceleration.x === 0) {
        let friction = 0;

        if (this.groundedTime < FRICTION_GRACE_PERIOD) {
          friction = 0;
        } else if (
          this.groundedTime <
          FRICTION_GRACE_PERIOD + FRICTION_RAMP_DURATION
        ) {
          const t =
            (this.groundedTime - FRICTION_GRACE_PERIOD) /
            FRICTION_RAMP_DURATION;
          friction = FRICTION_MIN + t * (FRICTION - FRICTION_MIN);
        } else {
          friction = FRICTION;
        }

        player.velocity.x -= player.velocity.x * friction * deltaTime;

        // Snap to zero
        if (Math.abs(player.velocity.x) < VELOCITY_THRESHOLD) {
          player.velocity.x = 0;
        }
      }
    } else {
      this.groundedTime = 0;
    }

    this.wasGrounded = player.grounded;
  }

  applyImpulse(obj: PhysicsObject, dx: number, dy: number): void {
    obj.velocity.x += dx;
    obj.velocity.y += dy;
  }
}
