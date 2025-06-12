import { Injectable } from '@angular/core';

export interface AABB {
  position: { x: number; y: number };
  size: { width: number; height: number };
}
@Injectable({
  providedIn: 'root',
})
export class CollisionService {
  checkAABBCollision(a: AABB, b: AABB): boolean {
    return (
      a.position.x < b.position.x + b.size.width &&
      a.position.x + a.size.width > b.position.x &&
      a.position.y < b.position.y + b.size.height &&
      a.position.y + a.size.height > b.position.y
    );
  }
}
