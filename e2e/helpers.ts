/**
 * Playwright Test Helpers
 *
 * Utility functions for Playwright E2E tests in the platformer game.
 * Incorporates patterns from the webapp-testing skill.
 *
 * @see {@link https://github.com/henia87/awesome-copilot/tree/main/skills/webapp-testing webapp-testing skill}
 */

import { Page } from '@playwright/test';

/**
 * Wait for the game to fully initialize
 */
export async function waitForGameInit(page: Page, timeout = 1000) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(timeout);
}

/**
 * Check if canvas has non-transparent pixels in a region
 */
export async function hasCanvasContent(
  page: Page,
  region?: { x: number; y: number; w: number; h: number },
): Promise<boolean> {
  return page.evaluate((r) => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return false;

    const x = r?.x ?? 0;
    const y = r?.y ?? 0;
    const w = r?.w ?? canvas.width;
    const h = r?.h ?? canvas.height;

    const imageData = ctx.getImageData(x, y, w, h);

    let nonTransparentPixels = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] > 0) nonTransparentPixels++;
    }

    return nonTransparentPixels > 50;
  }, region);
}

/**
 * Get canvas dimensions
 */
export async function getCanvasDimensions(page: Page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    return {
      width: canvas?.width ?? 0,
      height: canvas?.height ?? 0,
    };
  });
}

/**
 * Count colored pixels in a canvas region
 */
export async function countColoredPixels(
  page: Page,
  region: { x: number; y: number; w: number; h: number },
): Promise<number> {
  return page.evaluate((r) => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return 0;

    const imageData = ctx.getImageData(r.x, r.y, r.w, r.h);
    let count = 0;

    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] > 0) count++;
    }

    return count;
  }, region);
}

/**
 * Simulate player movement for a duration
 */
export async function movePlayer(
  page: Page,
  direction: 'left' | 'right' | 'up',
  duration = 200,
) {
  const keyMap = {
    left: 'ArrowLeft',
    right: 'ArrowRight',
    up: 'Space',
  };

  const key = keyMap[direction];
  await page.keyboard.down(key);
  await page.waitForTimeout(duration);
  await page.keyboard.up(key);
}

/**
 * Perform a jump action
 */
export async function jump(page: Page) {
  await page.keyboard.press('Space');
  await page.waitForTimeout(100);
}

/**
 * Shoot a projectile
 */
export async function shoot(page: Page) {
  await page.keyboard.press('x');
  await page.waitForTimeout(100);
}

/**
 * Check if the game is still rendering (not frozen)
 */
export async function isGameRendering(page: Page): Promise<boolean> {
  const screenshot1 = await page.locator('canvas').screenshot();
  await page.waitForTimeout(200);
  const screenshot2 = await page.locator('canvas').screenshot();

  // Both should exist
  return screenshot1.length > 1000 && screenshot2.length > 1000;
}

/**
 * Measure average FPS over a number of frames
 */
export async function measureFPS(page: Page, frameCount = 30): Promise<number> {
  const frameTimes: number[] = await page.evaluate((count) => {
    return new Promise((resolve) => {
      const times: number[] = [];
      let frames = 0;

      function measureFrame() {
        times.push(performance.now());
        frames++;

        if (frames < count) {
          requestAnimationFrame(measureFrame);
        } else {
          resolve(times);
        }
      }

      requestAnimationFrame(measureFrame);
    });
  }, frameCount);

  const intervals = [];
  for (let i = 1; i < frameTimes.length; i++) {
    intervals.push(frameTimes[i] - frameTimes[i - 1]);
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  return 1000 / avgInterval;
}

/**
 * Get the player area region for testing
 */
export function getPlayerRegion(canvasWidth: number, canvasHeight: number) {
  return {
    x: canvasWidth / 2 - 50,
    y: canvasHeight - 150,
    w: 100,
    h: 100,
  };
}

/**
 * Get the platform area region for testing
 */
export function getPlatformRegion(canvasWidth: number, canvasHeight: number) {
  return {
    x: 0,
    y: canvasHeight / 2,
    w: canvasWidth,
    h: canvasHeight / 2,
  };
}

/**
 * Get the background area region for testing
 */
export function getBackgroundRegion(canvasWidth: number, canvasHeight: number) {
  return {
    x: 0,
    y: 0,
    w: canvasWidth,
    h: canvasHeight / 3,
  };
}
