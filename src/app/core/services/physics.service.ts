import { Injectable } from '@angular/core';
import { PhysicsObject } from '../models/physics-object.model';

@Injectable({
  providedIn: 'root',
})
export class PhysicsService {
  private gravity = 1000; // pixels/sec²
  private terminalVelocity = 2000; // pixels/sec

  updatePlayer(player: PhysicsObject, deltaTime: number): void {
    // Apply gravity as acceleration
    player.acceleration.y = player.grounded ? 0 : this.gravity;

    // Integrate acceleration into velocity
    player.velocity.x += player.acceleration.x * deltaTime;
    player.velocity.y += player.acceleration.y * deltaTime;

    // Clamp vertical velocity
    if (player.velocity.y > this.terminalVelocity) {
      player.velocity.y = this.terminalVelocity;
    }

    // Integrate velocity into position
    player.position.x += player.velocity.x * deltaTime;
    player.position.y += player.velocity.y * deltaTime;

    // Reset acceleration
    player.acceleration = { x: 0, y: 0 };
  }

  applyImpulse(obj: PhysicsObject, dx: number, dy: number) {
    obj.velocity.x += dx;
    obj.velocity.y += dy;
  }
}
