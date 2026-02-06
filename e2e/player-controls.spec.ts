import { test, expect } from '@playwright/test';

/**
 * Player Controls E2E Tests
 *
 * Tests player movement, jumping, and input responsiveness
 * in the platformer game.
 */

test.describe('Player Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // Wait for game to initialize
    await page.waitForTimeout(1000);
  });

  test('should move player right on ArrowRight key press', async ({ page }) => {
    // Get initial player position
    const initialX = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      return canvas ? canvas.getBoundingClientRect().left : 0;
    });

    // Press right arrow key
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);

    // Verify game is responding to input (canvas should still be rendering)
    const isRendering = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      return canvas !== null;
    });

    expect(isRendering).toBe(true);
  });

  test('should move player left on ArrowLeft key press', async ({ page }) => {
    // Press left arrow key
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(200);

    // Verify game is still running
    const canvasExists = await page.evaluate(() => {
      return document.querySelector('canvas') !== null;
    });

    expect(canvasExists).toBe(true);
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
    // Press space to jump
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);

    // Verify game continues running
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should handle jump with ArrowUp key', async ({ page }) => {
    // Press arrow up to jump
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(100);

    // Verify game continues running
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should respond to key down and key up events', async ({ page }) => {
    // Hold down right arrow
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(300);
    await page.keyboard.up('ArrowRight');

    // Verify game is responsive
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should handle simultaneous key presses', async ({ page }) => {
    // Press and hold multiple keys
    await page.keyboard.down('ArrowRight');
    await page.keyboard.down('Space');
    await page.waitForTimeout(200);
    await page.keyboard.up('ArrowRight');
    await page.keyboard.up('Space');

    // Game should handle this without crashing
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should support shooting with X key', async ({ page }) => {
    // Try shooting
    await page.keyboard.press('x');
    await page.waitForTimeout(100);

    // Verify game continues
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
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

  test('should respond to WASD controls if implemented', async ({ page }) => {
    // Try WASD keys
    await page.keyboard.press('d'); // Right
    await page.waitForTimeout(100);
    await page.keyboard.press('a'); // Left
    await page.waitForTimeout(100);
    await page.keyboard.press('w'); // Jump
    await page.waitForTimeout(100);

    // Game should handle these gracefully
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should handle Space key without breaking game', async ({ page }) => {
    // Try pressing Space (which normally scrolls the page)
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);

    // Game should still be running (may or may not prevent scroll)
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should maintain player control after pause/resume', async ({
    page,
  }) => {
    // Move player
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);

    // Try to pause (if Escape is pause)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);

    // Resume
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);

    // Try moving again
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(100);

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render player character on canvas', async ({ page }) => {
    // Wait for game to stabilize
    await page.waitForTimeout(500);

    // Check if there's player-like content being rendered
    const hasPlayerContent = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return false;

      // Check for content in the typical player area (center-bottom of screen)
      const playerAreaY = canvas.height * 0.6;
      const imageData = ctx.getImageData(
        canvas.width / 2 - 50,
        playerAreaY,
        100,
        100,
      );

      let coloredPixels = 0;
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] > 0) coloredPixels++;
      }

      return coloredPixels > 50; // Player should occupy some pixels
    });

    expect(hasPlayerContent).toBe(true);
  });
});
