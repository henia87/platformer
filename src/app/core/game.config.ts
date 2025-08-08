// Canvas
export function getCanvasWidth(): number {
  if (typeof window !== 'undefined' && typeof window.innerWidth === 'number') {
    return Math.min(window.innerWidth, 800);
  }
  return 800;
}

export function getCanvasHeight(): number {
  if (typeof window !== 'undefined' && typeof window.innerHeight === 'number') {
    return Math.min(window.innerHeight, 600);
  }
  return 600;
}

// Update CANVAS_WIDTH and CANVAS_HEIGHT to use the new functions
export const CANVAS_WIDTH = getCanvasWidth();
export const CANVAS_HEIGHT = getCanvasHeight();
export const LEVEL_PADDING = 200; // Padding for platform culling

// Player
export const PLAYER_WIDTH = 40;
export const PLAYER_HEIGHT = 60;
export const PLAYER_SPEED = 300; // pixels/sec
export const PLAYER_JUMP = -600; // jump impulse (pixels/sec)
export const PLAYER_ACCELERATION = 2500; // How quickly the player reaches top speed (pixels/sec^2)
export const VELOCITY_THRESHOLD = 5; // Minimum velocity before snapping to zero

// Physics
export const GRAVITY = 1000; // pixels/sec²
export const TERMINAL_VELOCITY = 2000; // pixels/sec
export const FRICTION = 8; // Friction coefficient for grounded player
export const FRICTION_GRACE_PERIOD = 0.08; // Seconds after landing with no/low friction
export const FRICTION_RAMP_DURATION = 0.18; // Seconds to ramp from min to max friction
export const FRICTION_MIN = 0.5; // Initial friction value after grace period

// Platform
export const PLATFORM_WIDTH = 200;
export const PLATFORM_HEIGHT = 20;
export const PLATFORM_Y = CANVAS_HEIGHT - 100;

// Colors
export const PLATFORM_COLOR = 'gray';
export const PLAYER_FALLBACK_COLOR = 'deepskyblue';

// Parallax scrolling
export const WORLD_WIDTH = 6000; // Example default value
export const Y_FROM_BOTTOM_GRASS = -5; //

// Camera
export const SMOOTHING_FACTOR = 0.1;
