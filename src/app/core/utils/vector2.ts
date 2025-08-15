/**
 * Vec2Like is a simple interface for any object with x and y number properties.
 * Useful for interoperability with plain objects and other vector-like shapes.
 * @interface
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 */
export interface Vec2Like {
  x: number;
  y: number;
}

/**
 * Vector2 is a tiny, dependency-free 2D vector utility class.
 * Provides both instance and static methods for common vector math operations.
 * Can be used with any {x, y} shaped object.
 *
 * @example
 *   const v = new Vector2(1, 2);
 *   v.add({x: 3, y: 4}); // v is now (4, 6)
 *   const u = Vector2.lerp({x: 0, y: 0}, {x: 10, y: 10}, 0.5); // (5, 5)
 */
export class Vector2 implements Vec2Like {
  /**
   * Creates a new Vector2.
   * @param x - X coordinate (default 0)
   * @param y - Y coordinate (default 0)
   */
  constructor(
    public x = 0,
    public y = 0,
  ) {}

  // ---- instance ops (mutating) ----

  /**
   * Sets the vector's x and y values.
   * @param x - X value
   * @param y - Y value
   * @returns this
   */
  set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  /**
   * Copies another vector's values into this one.
   * @param v - Vector to copy
   * @returns this
   */
  copy(v: Vec2Like): this {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  /**
   * Returns a new clone of this vector.
   * @returns New Vector2 with same values
   */
  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  /**
   * Adds another vector to this one.
   * @param v - Vector to add
   * @returns this
   */
  add(v: Vec2Like): this {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  /**
   * Subtracts another vector from this one.
   * @param v - Vector to subtract
   * @returns this
   */
  sub(v: Vec2Like): this {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  /**
   * Scales this vector by a scalar.
   * @param s - Scalar value
   * @returns this
   */
  scale(s: number): this {
    this.x *= s;
    this.y *= s;
    return this;
  }

  /**
   * Returns the length (magnitude) of the vector.
   * @returns Length
   */
  length(): number {
    return Math.hypot(this.x, this.y);
  }

  /**
   * Normalizes the vector to length 1 (if not zero).
   * @returns this
   */
  normalize(): this {
    const len = this.length();
    if (len > 0) {
      this.x /= len;
      this.y /= len;
    }
    return this;
  }

  // ---- static helpers (non‑mutating) ----

  /**
   * Creates a Vector2 from any {x, y} object.
   * @param v - Object with x and y
   * @returns New Vector2
   */
  static from(v: Vec2Like): Vector2 {
    return new Vector2(v.x, v.y);
  }

  /**
   * Returns the sum of two vectors.
   * @param a - First vector
   * @param b - Second vector
   * @returns New Vector2
   */
  static add(a: Vec2Like, b: Vec2Like): Vector2 {
    return new Vector2(a.x + b.x, a.y + b.y);
  }

  /**
   * Returns the difference of two vectors.
   * @param a - First vector
   * @param b - Second vector
   * @returns New Vector2
   */
  static sub(a: Vec2Like, b: Vec2Like): Vector2 {
    return new Vector2(a.x - b.x, a.y - b.y);
  }

  /**
   * Scales a vector by a scalar.
   * @param v - Vector to scale
   * @param s - Scalar value
   * @returns New Vector2
   */
  static scale(v: Vec2Like, s: number): Vector2 {
    return new Vector2(v.x * s, v.y * s);
  }

  /**
   * Returns the dot product of two vectors.
   * @param a - First vector
   * @param b - Second vector
   * @returns Dot product
   */
  static dot(a: Vec2Like, b: Vec2Like): number {
    return a.x * b.x + a.y * b.y;
  }

  /**
   * Returns the distance between two vectors.
   * @param a - First vector
   * @param b - Second vector
   * @returns Distance
   */
  static distance(a: Vec2Like, b: Vec2Like): number {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  /**
   * Linear interpolation between two vectors.
   * @param a - Start vector
   * @param b - End vector
   * @param t - Interpolation factor (0..1)
   * @returns New Vector2
   */
  static lerp(a: Vec2Like, b: Vec2Like, t: number): Vector2 {
    return new Vector2(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
  }
}
