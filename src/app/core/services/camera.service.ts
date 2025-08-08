import { Injectable } from '@angular/core';
import { getCanvasWidth, WORLD_WIDTH, SMOOTHING_FACTOR } from '../game.config'; // SSR-safe

@Injectable({ providedIn: 'root' })
export class CameraService {
  private worldWidth = WORLD_WIDTH; // Initialize with default from game.config
  private viewportWidth = getCanvasWidth(); // match canvas
  private x = 0;

  setWorldWidth(px: number) {
    this.worldWidth = px;
  }

  setViewportWidth(px: number) {
    this.viewportWidth = px;
  }

  update(playerX: number) {
    const target = playerX - this.viewportWidth / 2;
    const max = Math.max(0, this.worldWidth - this.viewportWidth);
    // simple smoothing (lerp)
    this.x += (Math.max(0, Math.min(target, max)) - this.x) * SMOOTHING_FACTOR;
  }

  get xPos() {
    return this.x;
  }
}
