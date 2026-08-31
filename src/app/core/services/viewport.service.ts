import { Injectable } from '@angular/core';

/**
 * ViewportService computes the game canvas size from the browser viewport,
 * capped at 800x600.
 *
 * Values are computed on demand (not cached at module load), so they're
 * SSR-safe and testable in isolation, unlike the module-level constants
 * this replaces.
 */
@Injectable({ providedIn: 'root' })
export class ViewportService {
  getCanvasWidth(): number {
    return typeof window !== 'undefined' &&
      typeof window.innerWidth === 'number'
      ? Math.min(window.innerWidth, 800)
      : 800;
  }

  getCanvasHeight(): number {
    return typeof window !== 'undefined' &&
      typeof window.innerHeight === 'number'
      ? Math.min(window.innerHeight, 600)
      : 600;
  }
}
