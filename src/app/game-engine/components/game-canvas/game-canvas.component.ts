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
  PARALLAX_SMOOTH,
} from '../../../core/game.config';
import { Vector2 } from '../../../core/utils/vector2';
import { Platform } from '../../../core/models/platform.model';

/**
 * GameCanvasComponent is responsible for rendering the main game canvas.
 * It draws the player, platforms, and other entities using the RendererService.
 * The component subscribes to the game loop and updates the canvas every frame.
 *
 * @input layers - Parallax layers to render.
 * @input platforms - Platforms to draw (read-only render data).
 * @input snapshot / snapshotPrev - Interpolated camera & player position.
 * @input lastUpdateAtMs - Timestamp of last physics tick for interpolation.
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
  };

  /**
   * The previous game state snapshot for interpolation.
   * @input
   */
  @Input() snapshotPrev!: {
    cam: number;
    playerX: number;
    playerY: number;
  };

  /**
   * Timestamp of the last physics update (for interpolation).
   * @input
   */
  @Input() lastUpdateAtMs = 0;

  /** Platforms */
  @Input() platforms: Platform[] = [];

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
  private readonly FIXED_DT_MS = 1000 / 60;

  /**
   * Current parallax offset for each layer.
   */
  private parallaxX: Record<string, number> = {};

  /**
   * Clamps a value between 0 and 1.
   * @param x - Value to clamp
   * @returns Clamped value
   */
  private clamp01(x: number) {
    return x < 0 ? 0 : x > 1 ? 1 : x;
  }

  /**
   * Ensures the parallax cache is initialized for the current camera position.
   * @param cam - The current camera position
   */
  private ensureParallaxCache(cam: number) {
    if (Object.keys(this.parallaxX).length !== this.layers.length) {
      this.parallaxX = {};
      for (const layer of this.layers) {
        this.parallaxX[layer.key] = cam * layer.speed;
      }
    }
  }

  /**
   * Initializes the canvas context after the view has been initialized.
   * Sets the canvas width and height based on the component's properties.
   */
  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    this.ctx = ctx;

    // Logical size
    const w = CANVAS_WIDTH;
    const h = CANVAS_HEIGHT;

    // Physical size (matching device pixels)
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(w * ratio);
    canvas.height = Math.floor(h * ratio);

    // Keep CSS size the same (so layout doesn’t change)
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    // Map logical coordinates -> physical pixels
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

    // Compute alpha based on time since last physics tick
    const now = performance.now();
    const alpha = this.clamp01((now - this.lastUpdateAtMs) / this.FIXED_DT_MS);

    // Interpolate camera, player and platform
    const cam = Vector2.lerp(
      { x: this.snapshotPrev.cam, y: 0 },
      { x: this.snapshot.cam, y: 0 },
      alpha
    ).x;

    const p = Vector2.lerp(
      { x: this.snapshotPrev.playerX, y: this.snapshotPrev.playerY },
      { x: this.snapshot.playerX, y: this.snapshot.playerY },
      alpha
    );
    const playerX = p.x;
    const playerY = p.y;

    // BACKGROUND → FOREGROUND
    this.ensureParallaxCache(cam);

    for (const layer of this.layers) {
      const img = this.assetLoaderService.getImage(layer.key);

      const target = cam * layer.speed;

      const prev = this.parallaxX[layer.key] ?? target;
      const eased = prev + (target - prev) * PARALLAX_SMOOTH;
      this.parallaxX[layer.key] = eased;

      this.rendererService.drawParallaxLayer(
        this.ctx,
        img,
        this.canvasWidth,
        this.canvasHeight,
        eased,
        layer.yFromBottom || 0,
        layer.height,
        layer.color
      );
    }

    // WORLD (platform and player rendering)
    for (const plat of this.platforms) {
      this.rendererService.drawRect(
        this.ctx,
        plat.position.x - cam,
        plat.position.y,
        plat.width,
        plat.height,
        'gray'
      );
    }

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
