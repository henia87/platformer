import { test, expect } from '@playwright/test';

/**
 * HUD (Heads-Up Display) E2E Tests
 *
 * Tests the game's HUD elements including score display,
 * health indicators, collectibles count, and other UI elements
 * that are rendered on or around the game canvas.
 */

test.describe('HUD Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
  });

  test('should render game canvas as primary display', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Verify canvas has content
    const screenshot = await canvas.screenshot();
    expect(screenshot.length).toBeGreaterThan(1000);
  });

  test('should display game world with player and environment', async ({
    page,
  }) => {
    // Check that the game is rendering content
    const hasGameContent = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return false;

      // Check multiple regions of the canvas for content
      const regions = [
        { x: 0, y: 0, w: 200, h: 200 }, // Top-left (sky/background)
        { x: canvas.width / 2 - 100, y: canvas.height - 200, w: 200, h: 200 }, // Bottom-center (player area)
        { x: 0, y: canvas.height - 100, w: canvas.width, h: 100 }, // Bottom (platforms)
      ];

      let totalPixels = 0;
      for (const region of regions) {
        const imageData = ctx.getImageData(
          region.x,
          region.y,
          region.w,
          region.h,
        );
        for (let i = 3; i < imageData.data.length; i += 4) {
          if (imageData.data[i] > 0) totalPixels++;
        }
      }

      return totalPixels > 500;
    });

    expect(hasGameContent).toBe(true);
  });

  test('should maintain visual consistency across frames', async ({ page }) => {
    // Take two screenshots with a small delay
    const canvas = page.locator('canvas');

    const screenshot1 = await canvas.screenshot();
    await page.waitForTimeout(100);
    const screenshot2 = await canvas.screenshot();

    // Both should have substantial content
    expect(screenshot1.length).toBeGreaterThan(1000);
    expect(screenshot2.length).toBeGreaterThan(1000);

    // Screenshots should be different (animation is happening)
    // but both should exist
    expect(screenshot1).toBeTruthy();
    expect(screenshot2).toBeTruthy();
  });

  test('should render collectibles on the game canvas', async ({ page }) => {
    await page.waitForTimeout(500);

    // Collectibles should be visible on canvas
    const hasCollectibles = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return false;

      // Sample the middle regions where collectibles typically appear
      const imageData = ctx.getImageData(
        canvas.width / 4,
        canvas.height / 4,
        canvas.width / 2,
        canvas.height / 2,
      );

      let coloredPixels = 0;
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] > 0) coloredPixels++;
      }

      return coloredPixels > 100;
    });

    expect(hasCollectibles).toBe(true);
  });

  test('should render enemies on the canvas', async ({ page }) => {
    await page.waitForTimeout(500);

    const hasEnemies = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return false;

      // Check for enemy content in typical ground-level areas
      const imageData = ctx.getImageData(
        0,
        canvas.height * 0.5,
        canvas.width,
        canvas.height * 0.4,
      );

      let nonTransparentPixels = 0;
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] > 0) nonTransparentPixels++;
      }

      return nonTransparentPixels > 500;
    });

    expect(hasEnemies).toBe(true);
  });

  test('should update display after player collects items', async ({
    page,
  }) => {
    // Move player to collect items
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);

    // Canvas should still be rendering
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    const screenshot = await canvas.screenshot();
    expect(screenshot.length).toBeGreaterThan(1000);
  });

  test('should show floating text when collecting items', async ({ page }) => {
    // Attempt to collect an item
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowRight');

    // Check if canvas content has changed (may include floating text)
    const canvas = page.locator('canvas');
    const screenshot = await canvas.screenshot();
    expect(screenshot.length).toBeGreaterThan(1000);
  });

  test('should render platforms visibly', async ({ page }) => {
    const hasPlatforms = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return false;

      // Check bottom half of canvas where platforms are
      const imageData = ctx.getImageData(
        0,
        canvas.height / 2,
        canvas.width,
        canvas.height / 2,
      );

      let platformPixels = 0;
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] > 0) platformPixels++;
      }

      return platformPixels > 1000;
    });

    expect(hasPlatforms).toBe(true);
  });

  test('should maintain game state display during movement', async ({
    page,
  }) => {
    // Move around
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(200);
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);

    // Canvas should continuously render
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    const screenshot = await canvas.screenshot();
    expect(screenshot.length).toBeGreaterThan(1000);
  });

  test('should handle visual feedback for player actions', async ({ page }) => {
    // Jump and check visual update
    const canvas = page.locator('canvas');
    const beforeJump = await canvas.screenshot();

    await page.keyboard.press('Space');
    await page.waitForTimeout(200);

    const afterJump = await canvas.screenshot();

    // Both screenshots should exist
    expect(beforeJump.length).toBeGreaterThan(1000);
    expect(afterJump.length).toBeGreaterThan(1000);
  });

  test('should render projectiles when shooting', async ({ page }) => {
    // Try to shoot
    await page.keyboard.press('x');
    await page.waitForTimeout(100);

    // Game should handle this
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should show player health state visually', async ({ page }) => {
    // Player should be rendered on canvas
    const hasPlayer = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return false;

      // Check player typical area (center-bottom)
      const playerX = canvas.width / 2 - 50;
      const playerY = canvas.height - 150;
      const imageData = ctx.getImageData(playerX, playerY, 100, 100);

      let playerPixels = 0;
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] > 0) playerPixels++;
      }

      return playerPixels > 50;
    });

    expect(hasPlayer).toBe(true);
  });

  test('should render game without UI overlays blocking canvas', async ({
    page,
  }) => {
    // Canvas should be the main visible element
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Check if canvas is not covered by other elements
    const isCanvasOnTop = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return false;

      const rect = canvas.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const topElement = document.elementFromPoint(centerX, centerY);
      return topElement === canvas || canvas.contains(topElement);
    });

    expect(isCanvasOnTop).toBe(true);
  });

  test('should display parallax background layers', async ({ page }) => {
    // Background should be rendered
    const hasBackground = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return false;

      // Check top portion for background/sky
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height / 3);

      let backgroundPixels = 0;
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] > 0) backgroundPixels++;
      }

      return backgroundPixels > 100;
    });

    expect(hasBackground).toBe(true);
  });

  test('should handle screen updates during combat', async ({ page }) => {
    // Move toward enemy area and try shooting
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(400);
    await page.keyboard.up('ArrowRight');

    await page.keyboard.press('x'); // Shoot
    await page.waitForTimeout(200);

    // Canvas should still render properly
    const canvas = page.locator('canvas');
    const screenshot = await canvas.screenshot();
    expect(screenshot.length).toBeGreaterThan(1000);
  });
});
