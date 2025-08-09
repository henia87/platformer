/**
 * AABB (Axis-Aligned Bounding Box) represents a rectangle for collision detection.
 *
 * @property position - The top-left corner of the box (x, y).
 * @property size - The dimensions of the box (width, height).
 */
export interface AABB {
  position: { x: number; y: number };
  size: { width: number; height: number };
}
