/**
 * CollisionService provides methods for collision detection between game objects.
 *
 * @file CollisionService provides collision detection utilities for the game engine.
 */
import { Injectable } from '@angular/core';

import { AABB } from '../models/aabb.model';

@Injectable({
  providedIn: 'root',
})
export class CollisionService {
  /**
   * Checks for axis-aligned bounding box (AABB) collision between two objects.
   * @param a - First AABB object.
   * @param b - Second AABB object.
   * @returns True if the objects overlap, false otherwise.
   */
  checkAABBCollision(a: AABB, b: AABB): boolean {
    return (
      a.position.x < b.position.x + b.size.width &&
      a.position.x + a.size.width > b.position.x &&
      a.position.y < b.position.y + b.size.height &&
      a.position.y + a.size.height > b.position.y
    );
  }
}
