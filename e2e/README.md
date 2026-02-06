# E2E Tests for Platformer Game

This directory contains end-to-end tests for the platformer game using Playwright.

## Test Files

### 1. `game-canvas.spec.ts`

Tests the game canvas rendering and initialization:

- Canvas element existence and dimensions
- Canvas context initialization
- Frame rate consistency
- Platform rendering
- Parallax background layers
- Responsive behavior

### 2. `player-controls.spec.ts`

Tests player input and controls:

- Arrow key movement (left/right)
- Jump controls (Space, ArrowUp)
- WASD alternative controls
- Shooting mechanics (X key)
- Simultaneous key presses
- Rapid input handling
- Keyboard focus management
- Prevention of browser default shortcuts

### 3. `hud-display.spec.ts`

Tests the HUD and game display elements:

- Game world rendering
- Collectibles display
- Enemy rendering
- Platform visibility
- Floating text on item collection
- Visual feedback for player actions
- Projectile rendering
- Parallax background layers
- Combat visual updates

## Running Tests

### Run all E2E tests

```bash
npm run test:e2e
```

### Run tests in UI mode (interactive)

```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser)

```bash
npm run test:e2e:headed
```

### Debug tests

```bash
npm run test:e2e:debug
```

### View test report

```bash
npm run playwright:report
```

## Test Configuration

Tests are configured in `playwright.config.ts` with:

- **Base URL**: http://localhost:4200
- **Test timeout**: Default Playwright timeout
- **Browsers**: Chromium, Firefox, WebKit
- **Screenshots**: On failure
- **Videos**: Retained on failure
- **Traces**: On first retry

## Development Server

Tests automatically start the development server before running. The server will be reused if already running.

## Test Structure

Each test suite follows this pattern:

1. **beforeEach**: Navigate to the game and wait for initialization
2. **Individual tests**: Test specific functionality
3. **Assertions**: Use Playwright's expect API for validation

## Writing New Tests

When adding new tests:

1. Create a new `.spec.ts` file in the `e2e` directory
2. Import `test` and `expect` from `@playwright/test`
3. Use `test.describe()` to group related tests
4. Add `beforeEach()` hook to set up common navigation
5. Write individual test cases with descriptive names

Example:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should do something", async ({ page }) => {
    // Test implementation
  });
});
```

## Canvas Testing Tips

Since the game renders to a canvas:

- Use `page.evaluate()` to inspect canvas content
- Take screenshots for visual regression testing
- Check pixel data using `ctx.getImageData()`
- Verify canvas dimensions and context initialization
- Test interactive elements through keyboard/mouse events

## CI/CD Integration

These tests are designed to run in CI environments:

- Tests retry twice on CI
- Single worker on CI to avoid conflicts
- `forbidOnly` prevents accidental `.only` usage
- Screenshots and videos help debug failures

## Best Practices

1. **Wait for initialization**: Always wait for the game to load
2. **Use waitForTimeout sparingly**: Prefer deterministic waits
3. **Test user-facing behavior**: Focus on what users see and do
4. **Keep tests independent**: Each test should work in isolation
5. **Use descriptive test names**: Clear intent improves maintainability
