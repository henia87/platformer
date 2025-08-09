import { Injectable } from '@angular/core';
import { getCanvasWidth, WORLD_WIDTH } from '../game.config';
import { Vector2 } from '../utils/vector2';

@Injectable({ providedIn: 'root' })
export class CameraService {
  private worldWidth = WORLD_WIDTH;
  private viewportWidth = getCanvasWidth();
  private x = 0;

  // Dead-zone: keep player within center ± margin
  private margin = Math.floor(this.viewportWidth * 0.25);

  setWorldWidth(px: number) {
    this.worldWidth = px;
  }
  setViewportWidth(px: number) {
    this.viewportWidth = px;
    this.margin = Math.floor(px * 0.25);
  }

  // playerCenterX in world coords
  update(playerCenterX: number): void {
    const leftBound = this.x + this.margin;
    const rightBound = this.x + this.viewportWidth - this.margin;

    let target = this.x;

    if (playerCenterX < leftBound) {
      // only pull left if we actually can move left (x > 0)
      if (this.x > 0) {
        target = playerCenterX - this.margin;
      }
    } else if (playerCenterX > rightBound) {
      target = playerCenterX - (this.viewportWidth - this.margin);
    }

    // clamp to world
    const max = Math.max(0, this.worldWidth - this.viewportWidth);
    target = Math.min(Math.max(0, target), max);

    // smooth (constant factor works fine with your fixed timestep)
    const SMOOTH = 0.15; // tweak 0.1..0.2
    this.x = Vector2.lerp({ x: this.x, y: 0 }, { x: target, y: 0 }, SMOOTH).x;
  }

  get xPos(): number {
    return this.x;
  }
}
