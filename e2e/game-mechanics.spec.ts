import { test, expect } from '@playwright/test';
import {
  waitForGameInit,
  hasCanvasContent,
  getCanvasDimensions,
  movePlayer,
  jump,
  shoot,
  isGameRendering,
  measureFPS,
  getPlayerRegion,
  getPlatformRegion,
  countColoredPixels,
} from './helpers';

/**
 * Game Mechanics Integration Tests
 *
 * Tests that verify the integration of various game mechanics
 * using helper utilities for cleaner test code.
 */

test.describe('Game Mechanics Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForGameInit(page);
  });

  test('should have proper canvas setup', async ({ page }) => {
    const dimensions = await getCanvasDimensions(page);

    expect(dimensions.width).toBe(800);
    expect(dimensions.height).toBe(600);

    const hasContent = await hasCanvasContent(page);
    expect(hasContent).toBe(true);
  });

  test('should render player in expected region', async ({ page }) => {
    const dimensions = await getCanvasDimensions(page);
    const playerRegion = getPlayerRegion(dimensions.width, dimensions.height);

    const pixelCount = await countColoredPixels(page, playerRegion);
    expect(pixelCount).toBeGreaterThan(50);
  });

  test('should render platforms in expected region', async ({ page }) => {
    const dimensions = await getCanvasDimensions(page);
    const platformRegion = getPlatformRegion(
      dimensions.width,
      dimensions.height,
    );

    const pixelCount = await countColoredPixels(page, platformRegion);
    expect(pixelCount).toBeGreaterThan(1000);
  });

  test('should handle movement and jumping', async ({ page }) => {
    // Move right
    await movePlayer(page, 'right', 300);

    // Jump
    await jump(page);

    // Move left
    await movePlayer(page, 'left', 200);

    // Verify game is still rendering
    const rendering = await isGameRendering(page);
    expect(rendering).toBe(true);
  });

  test('should handle shooting mechanic', async ({ page }) => {
    // Move and shoot
    await movePlayer(page, 'right', 200);
    await shoot(page);
    await shoot(page);

    // Game should still be running
    const hasContent = await hasCanvasContent(page);
    expect(hasContent).toBe(true);
  });

  test('should maintain playable FPS', async ({ page }) => {
    const fps = await measureFPS(page, 30);

    // Should maintain at least 15 FPS for playability
    expect(fps).toBeGreaterThan(15);

    // Log FPS for debugging
    console.log(`Measured FPS: ${fps.toFixed(2)}`);
  });

  test('should handle complex movement sequence', async ({ page }) => {
    // Simulate a complex gameplay sequence
    await movePlayer(page, 'right', 200);
    await jump(page);
    await page.waitForTimeout(100);
    await movePlayer(page, 'right', 200);
    await jump(page);
    await shoot(page);
    await movePlayer(page, 'left', 300);
    await shoot(page);

    // Verify game is still functional
    const rendering = await isGameRendering(page);
    expect(rendering).toBe(true);
  });

  test('should render content in all major regions', async ({ page }) => {
    const dimensions = await getCanvasDimensions(page);

    // Check player region
    const playerHasContent = await hasCanvasContent(
      page,
      getPlayerRegion(dimensions.width, dimensions.height),
    );
    expect(playerHasContent).toBe(true);

    // Check platform region
    const platformHasContent = await hasCanvasContent(
      page,
      getPlatformRegion(dimensions.width, dimensions.height),
    );
    expect(platformHasContent).toBe(true);
  });

  test('should handle rapid input without degrading performance', async ({
    page,
  }) => {
    // Measure FPS before rapid input
    const fpsBefore = await measureFPS(page, 20);

    // Rapid input sequence
    for (let i = 0; i < 5; i++) {
      await movePlayer(page, 'right', 100);
      await jump(page);
      await shoot(page);
      await movePlayer(page, 'left', 100);
    }

    // Measure FPS after rapid input
    const fpsAfter = await measureFPS(page, 20);

    // FPS should not degrade significantly (within 50% for tolerance)
    expect(fpsAfter).toBeGreaterThan(fpsBefore * 0.5);

    console.log(
      `FPS before: ${fpsBefore.toFixed(2)}, after: ${fpsAfter.toFixed(2)}`,
    );
  });

  test('should maintain canvas content during extended gameplay', async ({
    page,
  }) => {
    // Simulate 3 seconds of gameplay
    for (let i = 0; i < 6; i++) {
      await movePlayer(page, 'right', 250);
      await jump(page);
      await movePlayer(page, 'left', 250);
    }

    // Canvas should still have content
    const hasContent = await hasCanvasContent(page);
    expect(hasContent).toBe(true);

    // Should still be rendering
    const rendering = await isGameRendering(page);
    expect(rendering).toBe(true);
  });
});
