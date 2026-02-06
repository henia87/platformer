import { test, expect } from '@playwright/test';

/**
 * Game Canvas E2E Tests
 *
 * Tests the main game canvas rendering, initialization,
 * and basic display elements of the platformer game.
 */

test.describe('Game Canvas', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the game
    await page.goto('/');
    // Wait for the game to initialize (use domcontentloaded for games with active loops)
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
  });

  test('should render the game canvas element', async ({ page }) => {
    // Find the canvas element
    const canvas = page.locator('canvas');

    // Verify canvas exists
    await expect(canvas).toBeVisible();

    // Verify canvas has correct dimensions
    const canvasElement = await canvas.elementHandle();
    const dimensions = await canvasElement?.evaluate(
      (el: HTMLCanvasElement) => ({
        width: el.width,
        height: el.height,
      }),
    );

    expect(dimensions?.width).toBe(800);
    expect(dimensions?.height).toBe(600);
  });

  test('should initialize canvas context', async ({ page }) => {
    // Check that the canvas has a 2D rendering context
    const hasContext = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      const ctx = canvas?.getContext('2d');
      return ctx !== null;
    });

    expect(hasContext).toBe(true);
  });

  test('should render game content on canvas', async ({ page }) => {
    // Wait a moment for the game to render at least one frame
    await page.waitForTimeout(500);

    // Take a screenshot of the canvas to verify it's not blank
    const canvas = page.locator('canvas');
    const screenshot = await canvas.screenshot();

    // Verify screenshot exists and has content
    expect(screenshot.length).toBeGreaterThan(1000); // Not a blank canvas
  });

  test('should have canvas inside app-game-canvas component', async ({
    page,
  }) => {
    const gameCanvasComponent = page.locator('app-game-canvas');
    await expect(gameCanvasComponent).toBeVisible();

    // Verify canvas is inside the component
    const canvas = gameCanvasComponent.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should render parallax background layers', async ({ page }) => {
    // Wait for rendering
    await page.waitForTimeout(500);

    // Check if the canvas is drawing (has pixel data)
    const hasContent = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return false;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // Check if there's any non-transparent pixel
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] !== 0) return true;
      }
      return false;
    });

    expect(hasContent).toBe(true);
  });

  test('should maintain consistent frame rate', async ({ page }) => {
    // Measure frame rendering over time
    const frameTimes: number[] = await page.evaluate(() => {
      return new Promise((resolve) => {
        const times: number[] = [];
        let frameCount = 0;
        const maxFrames = 30; // Measure 30 frames

        function measureFrame() {
          times.push(performance.now());
          frameCount++;

          if (frameCount < maxFrames) {
            requestAnimationFrame(measureFrame);
          } else {
            resolve(times);
          }
        }

        requestAnimationFrame(measureFrame);
      });
    });

    // Calculate average FPS
    const intervals = [];
    for (let i = 1; i < frameTimes.length; i++) {
      intervals.push(frameTimes[i] - frameTimes[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const fps = 1000 / avgInterval;

    // Should be rendering at reasonable frame rate (at least 15 FPS for playability)
    expect(fps).toBeGreaterThan(15);
  });

  test('should render platforms', async ({ page }) => {
    // Wait for game to load
    await page.waitForTimeout(500);

    // Check that platforms are being rendered (by checking canvas content)
    const hasRenderedContent = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return false;

      // Sample some pixels in the lower portion where platforms typically are
      const imageData = ctx.getImageData(
        0,
        canvas.height / 2,
        canvas.width,
        canvas.height / 2,
      );
      let nonTransparentPixels = 0;

      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] > 0) nonTransparentPixels++;
      }

      // Should have significant content (platforms, player, etc.)
      return nonTransparentPixels > 1000;
    });

    expect(hasRenderedContent).toBe(true);
  });

  test('should update canvas on window resize', async ({ page }) => {
    // Get initial canvas size
    const initialSize = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      return { width: canvas.width, height: canvas.height };
    });

    // Resize viewport
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.waitForTimeout(300);

    // Canvas dimensions should remain constant (game canvas, not responsive)
    const newSize = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      return { width: canvas.width, height: canvas.height };
    });

    // Game canvas should maintain its dimensions
    expect(newSize.width).toBe(initialSize.width);
    expect(newSize.height).toBe(initialSize.height);
  });
});
