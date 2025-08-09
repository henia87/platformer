/**
 * GameCanvasComponent is responsible for rendering the main game canvas.
 * It draws the player, platforms, and other entities using the RendererService.
 * The component subscribes to the game loop and updates the canvas every frame.
 *
 * @input player - The player object to render (position, velocity, etc.).
 * @input platform - The platform object to render (position, size).
 */
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  Input,
  AfterViewInit,
} from '@angular/core';
import { GameLoopService } from '../../../core/services/game-loop.service';
import { Subscription } from 'rxjs';
import { AssetLoaderService } from '../../../core/services/asset-loader.service';
import { RendererService } from '../../../core/services/renderer.service';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLATFORM_WIDTH,
  PLATFORM_HEIGHT,
} from '../../../core/game.config';

/**
 * GameCanvasComponent is responsible for rendering the main game canvas.
 * It draws the player, platforms, and other entities using the RendererService.
 * The component subscribes to the game loop and updates the canvas every frame.
 *
 * @input layers - Array of parallax background layers to render.
 * @input snapshot - The current game state snapshot (camera, player, platform positions).
 * @input snapshotPrev - The previous game state snapshot for interpolation.
 * @input lastUpdateAtMs - Timestamp of the last physics update (for interpolation).
 */
@Component({
  selector: 'app-game-canvas',
  standalone: false,
  templateUrl: './game-canvas.component.html',
  styleUrl: './game-canvas.component.scss',
})
export class GameCanvasComponent implements OnInit, AfterViewInit, OnDestroy {
  /**
   * Array of parallax background layers to render.
   * @input
   */
  @Input() layers: {
    key: string;
    speed: number;
    color?: string;
    height: number;
    yFromBottom?: number;
  }[] = [];

  /**
   * The current game state snapshot (camera, player, platform positions).
   * @input
   */
  @Input() snapshot!: {
    cam: number;
    playerX: number;
    playerY: number;
    platformX: number;
    platformY: number;
  };

  /**
   * The previous game state snapshot for interpolation.
   * @input
   */
  @Input() snapshotPrev!: {
    cam: number;
    playerX: number;
    playerY: number;
    platformX: number;
    platformY: number;
  };

  /**
   * Timestamp of the last physics update (for interpolation).
   * @input
   */
  @Input() lastUpdateAtMs = 0;

  /**
   * Reference to the canvas element in the template.
   */
  @ViewChild('gameCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  /**
   * The 2D rendering context for the canvas.
   */
  private ctx!: CanvasRenderingContext2D;

  /**
   * Subscription to the game loop's render observable.
   */
  private frameSub?: Subscription;
  private x = 0;

  canvasWidth = CANVAS_WIDTH;
  canvasHeight = CANVAS_HEIGHT;

  private gameLoop = inject(GameLoopService);
  private assetLoaderService = inject(AssetLoaderService);
  private rendererService = inject(RendererService);

  /**
   * Fixed delta time for physics updates (ms).
   */
  private readonly FIXED_DT_MS = 1000 / 60; // your Physics dt

  /**
   * Linearly interpolates between two values.
   * @param a - Start value
   * @param b - End value
   * @param t - Interpolation factor (0..1)
   * @returns Interpolated value
   */
  private lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }

  /**
   * Clamps a value between 0 and 1.
   * @param x - Value to clamp
   * @returns Clamped value
   */
  private clamp01(x: number) {
    return x < 0 ? 0 : x > 1 ? 1 : x;
  }

  /**
   * Initializes the canvas context after the view has been initialized.
   * Sets the canvas width and height based on the component's properties.
   */
  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    this.ctx = ctx;

    // Logical size (what your game uses)
    const w = CANVAS_WIDTH;
    const h = CANVAS_HEIGHT;

    // Physical size (match device pixels)
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(w * ratio);
    canvas.height = Math.floor(h * ratio);

    // Keep CSS size the same (so layout doesn’t change)
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    // Map logical coordinates -> physical pixels
    // Important: do NOT also call ctx.scale(); setTransform replaces it.
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  /**
   * Initializes the game canvas component and subscribes to the game loop.
   * Starts rendering on each frame.
   */
  ngOnInit(): void {
    this.frameSub = this.gameLoop.render$.subscribe(() => {
      this.render();
    });
  }

  /**
   * Cleans up the game loop subscription when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.frameSub?.unsubscribe();
  }

  /**
   * Updates the game state for the current frame.
   * @param dt - Delta time in seconds since the last frame.
   */
  update(dt: number) {
    this.x += 100 * dt; // Move 100px/sec
    if (this.x > 300) this.x = 0;
  }

  /**
   * Renders the current game state to the canvas.
   * Interpolates between previous and current snapshots for smooth rendering.
   */
  render() {
    this.rendererService.clear(this.ctx, this.canvasWidth, this.canvasHeight);

    // compute alpha based on time since last physics tick
    const now = performance.now();
    const alpha = this.clamp01((now - this.lastUpdateAtMs) / this.FIXED_DT_MS);

    // interpolate world & camera
    const cam = this.lerp(this.snapshotPrev.cam, this.snapshot.cam, alpha);
    const playerX = this.lerp(
      this.snapshotPrev.playerX,
      this.snapshot.playerX,
      alpha
    );
    const playerY = this.lerp(
      this.snapshotPrev.playerY,
      this.snapshot.playerY,
      alpha
    );
    const platformX = this.lerp(
      this.snapshotPrev.platformX,
      this.snapshot.platformX,
      alpha
    );
    const platformY = this.lerp(
      this.snapshotPrev.platformY,
      this.snapshot.platformY,
      alpha
    );

    // BACKGROUND → FOREGROUND
    for (const layer of this.layers) {
      const img = this.assetLoaderService.getImage(layer.key);
      this.rendererService.drawParallaxLayer(
        this.ctx,
        img,
        this.canvasWidth,
        this.canvasHeight,
        cam * layer.speed,
        layer.yFromBottom || 0, // Pass yFromBottom from the layer
        layer.height,
        layer.color
      );
    }

    // WORLD (platform and player rendering, with cameraY)
    this.rendererService.drawRect(
      this.ctx,
      platformX - cam,
      platformY,
      PLATFORM_WIDTH,
      PLATFORM_HEIGHT,
      'gray'
    );

    const playerImg = this.assetLoaderService.getImage('player');
    this.rendererService.drawImage(
      this.ctx,
      playerImg,
      playerX - cam,
      playerY,
      PLAYER_WIDTH,
      PLAYER_HEIGHT
    );
  }
}
