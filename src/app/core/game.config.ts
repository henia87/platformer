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

export const CANVAS_WIDTH = getCanvasWidth();
export const CANVAS_HEIGHT = getCanvasHeight();

// Player
export const PLAYER_WIDTH = 40;
export const PLAYER_HEIGHT = 45;
export const PLAYER_SPEED = 300; // pixels/sec
export const PLAYER_JUMP = -600; // jump impulse (pixels/sec)
export const PLAYER_ACCELERATION = 1200; // How quickly the player reaches top speed (pixels/sec^2), before: 2500
export const PLAYER_ACCEL_X = 2200;
export const VELOCITY_THRESHOLD = 5; // Minimum velocity before snapping to zero
export const PLAYER_MAX_SPEED_X = 450; // tuned for smooth camera
export const PLAYER_DRAG_AIR = 1.5; // 0..1 per second (e.g., 1.5)
export const PLAYER_DRAG_GROUND = 6; // 0..1 per second (e.g., 6)
export const PLAYER_MAX_HEALTH = 100; // HP
export const PLAYER_MIN_HEALTH = 0; // HP
export const PLAYER_DAMAGE_AGAINST_PUNK = 10; // HP
export const PLAYER_DAMAGE_AGAINST_HOMELESS = 20; // HP
export const STOMP_BOUNCE_VY = 240; // bounce velocity after stomp
export const STOMP_VERTICAL_TOLERANCE = 10; // how "from above" is detected
export const SIDE_HIT_BAND_PX = 8; // "shoulder padding" to avoid near-top side hits
export const PLAYER_IFRAME_MS = 600; // invulnerability after getting hit

// Collectibles
export const COIN_WIDTH = 16;
export const COIN_HEIGHT = 16;
export const COIN_VALUE = 1;
export const BEER_WIDTH = 32;
export const BEER_HEIGHT = 32;
export const SMALL_BEER_HP = 5; // HP
export const BIG_BEER_HP = 10; // HP

// Collectible FX
export const PICKUP_FADE_TIME = 0.3; // seconds
export const PICKUP_RISE_PIXELS = 12; // total rise over fade
export const LABEL_TTL_SEC = 0.6; // seconds
export const LABEL_VY_PX_PER_SEC = -40; // px/sec (upwards)

// Enemies
export const ENEMY_WIDTH = 40;
export const ENEMY_HEIGHT = 50;
export const ENEMY_MAX_HEALTH = 100; // HP
export const ENEMY_DAMAGE_PUNK = 15; // HP
export const ENEMY_DAMAGE_HOMELESS = 10; // HP

// Projectiles
export const PROJECTILE_WIDTH = 12;
export const PROJECTILE_HEIGHT = 6;
export const PROJECTILE_SPEED = 700; // px/sec
export const PROJECTILE_TTL_MS = 900; // lifetime
export const PROJECTILE_DAMAGE = 25; // damage to enemy
export const PROJECTILE_FIRE_COOLDOWN_MS = 220;
export const PROJECTILE_SPAWN_OFFSET_X = 16; // from player edge
export const PROJECTILE_SPAWN_OFFSET_Y = 18; // roughly mid-body

// Physics
export const GRAVITY = 1000; // pixels/sec²
export const TERMINAL_VELOCITY = 800; // pixels/sec, before: 2000
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
export const WORLD_WIDTH = 24000; // Increased from 12000 for more expansive world
export const Y_FROM_BOTTOM_GRASS = -5; // Lowering grass layer to avoid empty space below
export const PARALLAX_SMOOTH = 0.12; // 0.08..0.18, visual only

// Camera
export const SMOOTHING_FACTOR = 0.1; // Smoothing factor for camera movement
