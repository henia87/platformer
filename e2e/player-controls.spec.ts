import { test, expect } from '@playwright/test';

import { getCanvasPixels, countDifferingPixels, movePlayer } from './helpers';

/**
 * Player Controls E2E Tests
 *
 * Tests player movement, jumping, and input responsiveness
 * in the platformer game.
 */

// The player starts at world (0, ~550) with the camera also at x=0, so at
// game start this region is where the player renders and moves - and it's
// clear of enemies/collectibles (all further right or higher up), and its
// pixels are static at rest (0 diff over time with no input, calibrated
// empirically), so any change here reflects the player, not ambient motion.
const PLAYER_START_REGION = { x: 0, y: 480, w: 250, h: 120 };

// A real player movement/jump changes at least ~1500 pixels in
// PLAYER_START_REGION when compared against a truly-at-rest baseline
// (calibrated empirically; idle-from-a-fresh-page changes 0). This sits
// well clear of both, tolerating timing jitter without becoming a no-op check.
const MOVEMENT_THRESHOLD = 300;

// A fired projectile is only PROJECTILE_WIDTH x PROJECTILE_HEIGHT (12x6px,
// game.config.ts) - far smaller than a player-scale move, so it needs its
// own much smaller bar.
const PROJECTILE_THRESHOLD = 30;

// Once the camera has actually moved and then settled, its lerp smoothing
// (CameraService, SMOOTH = 0.15) decays asymptotically rather than snapping
// to zero, so a "definitely nothing happened" baseline is no longer exactly
// 0 the way it is on a fresh page - empirically up to ~900 in that specific
// window. Used only for the negative "w does nothing" assertion below,
// where the baseline follows an earlier real move rather than a fresh load.
const POST_SETTLE_NOISE_CEILING = 1200;

test.describe('Player Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // Wait for game to initialize
    await page.waitForTimeout(1000);
  });

  test('should move player right on ArrowRight key press', async ({ page }) => {
    const before = await getCanvasPixels(page, PLAYER_START_REGION);
    await movePlayer(page, 'right', 300);
    const after = await getCanvasPixels(page, PLAYER_START_REGION);

    expect(countDifferingPixels(before, after)).toBeGreaterThan(
      MOVEMENT_THRESHOLD,
    );
  });

  test('should move player left on ArrowLeft key press', async ({ page }) => {
    // Player starts at the world's left edge, so move right first to have
    // room to move left (and to settle before the measured window).
    await movePlayer(page, 'right', 300);
    await page.waitForTimeout(200);

    const before = await getCanvasPixels(page, PLAYER_START_REGION);
    await movePlayer(page, 'left', 300);
    const after = await getCanvasPixels(page, PLAYER_START_REGION);

    expect(countDifferingPixels(before, after)).toBeGreaterThan(
      MOVEMENT_THRESHOLD,
    );
  });

  test('should respond to multiple key presses', async ({ page }) => {
    // Press multiple keys in sequence
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(100);

    // Verify game is still responsive
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should handle jump with Space key', async ({ page }) => {
    const before = await getCanvasPixels(page, PLAYER_START_REGION);
    await page.keyboard.press('Space');
    await page.waitForTimeout(150);
    const after = await getCanvasPixels(page, PLAYER_START_REGION);

    expect(countDifferingPixels(before, after)).toBeGreaterThan(
      MOVEMENT_THRESHOLD,
    );
  });

  test('should handle jump with ArrowUp key', async ({ page }) => {
    const before = await getCanvasPixels(page, PLAYER_START_REGION);
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(150);
    const after = await getCanvasPixels(page, PLAYER_START_REGION);

    expect(countDifferingPixels(before, after)).toBeGreaterThan(
      MOVEMENT_THRESHOLD,
    );
  });

  test('should respond to key down and key up events', async ({ page }) => {
    const before = await getCanvasPixels(page, PLAYER_START_REGION);
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(300);
    await page.keyboard.up('ArrowRight');
    const after = await getCanvasPixels(page, PLAYER_START_REGION);

    expect(countDifferingPixels(before, after)).toBeGreaterThan(
      MOVEMENT_THRESHOLD,
    );
  });

  test('should handle simultaneous key presses', async ({ page }) => {
    // Press and hold multiple keys - this is a robustness smoke test
    // (does it crash / stop rendering), not a movement-correctness check.
    await page.keyboard.down('ArrowRight');
    await page.keyboard.down('Space');
    await page.waitForTimeout(200);
    await page.keyboard.up('ArrowRight');
    await page.keyboard.up('Space');

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should support shooting with X key', async ({ page }) => {
    const before = await getCanvasPixels(page, PLAYER_START_REGION);
    // ProjectileService.handleFiring checks input.shoot on the exact frame
    // it ticks - unlike jump, it isn't buffered, so a bare .press() can
    // complete faster than one 60fps tick and get missed entirely. Hold it
    // down long enough to guarantee a tick observes shoot: true.
    await page.keyboard.down('x');
    await page.waitForTimeout(50);
    await page.keyboard.up('x');
    await page.waitForTimeout(100);
    const after = await getCanvasPixels(page, PLAYER_START_REGION);

    expect(countDifferingPixels(before, after)).toBeGreaterThan(
      PROJECTILE_THRESHOLD,
    );
  });

  test('should maintain game state during rapid input', async ({ page }) => {
    // Rapid input test
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Space');
      await page.waitForTimeout(50);
    }

    // Game should still be running smoothly
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Verify canvas is still rendering
    const screenshot = await canvas.screenshot();
    expect(screenshot.length).toBeGreaterThan(1000);
  });

  test('should handle keyboard focus correctly', async ({ page }) => {
    // Click on the page to ensure focus
    await page.click('body');

    // Press movement keys
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);

    // Verify canvas is still visible and game is running
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should move on a/d, but w does not jump (not mapped)', async ({
    page,
  }) => {
    // InputService maps 'a'/'d' to left/right alongside the arrow keys, but
    // only Space/ArrowUp trigger a jump - 'w' is not bound to anything.
    const beforeD = await getCanvasPixels(page, PLAYER_START_REGION);
    await page.keyboard.down('d');
    await page.waitForTimeout(300);
    await page.keyboard.up('d');
    const afterD = await getCanvasPixels(page, PLAYER_START_REGION);
    expect(countDifferingPixels(beforeD, afterD)).toBeGreaterThan(
      MOVEMENT_THRESHOLD,
    );

    // Let ground friction fully settle the player before the negative
    // assertion below - FRICTION_RAMP_DURATION means residual sliding can
    // otherwise get misattributed to the 'w' press that follows.
    await page.waitForTimeout(600);

    const beforeW = await getCanvasPixels(page, PLAYER_START_REGION);
    await page.keyboard.press('w');
    await page.waitForTimeout(150);
    const afterW = await getCanvasPixels(page, PLAYER_START_REGION);
    // A real jump/move would exceed MOVEMENT_THRESHOLD (~1500+); assert we
    // stay under the post-settle ambient-drift ceiling instead of exactly 0,
    // see POST_SETTLE_NOISE_CEILING above.
    expect(countDifferingPixels(beforeW, afterW)).toBeLessThan(
      POST_SETTLE_NOISE_CEILING,
    );
  });

  test('should handle Space key without breaking game', async ({ page }) => {
    // Try pressing Space (which normally scrolls the page)
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);

    // Game should still be running (may or may not prevent scroll)
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  // No pause feature exists yet - see issue #27 (PauseOverlayComponent,
  // still open in the backlog). Marked fixme instead of testing nothing.
  test.fixme('should pause/resume with Escape', async () => {
    expect(true).toBe(true);
  });
});
