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
import { Subscription } from 'rxjs';

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PARALLAX_SMOOTH,
  ENEMY_WIDTH,
  ENEMY_HEIGHT,
  PICKUP_FADE_TIME,
  PICKUP_RISE_PIXELS,
  LABEL_TTL_SEC,
  LABEL_VY_PX_PER_SEC,
} from '../../../core/game.config';
import { Collectible } from '../../../core/models/collectible.model';
import { Enemy } from '../../../core/models/enemy.model';
import { Platform } from '../../../core/models/platform.model';
import { AssetLoaderService } from '../../../core/services/asset-loader.service';
import { GameLoopService } from '../../../core/services/game-loop.service';
import { RendererService } from '../../../core/services/renderer.service';
import { Vector2 } from '../../../core/utils/vector2';
import { GameStateService } from '../../../state/game-state.service';
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

  /** Collectibles */
  @Input() collectibles: Collectible[] = [];

  /** Enemies */
  @Input() enemies: Enemy[] = [];

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

  canvasWidth = CANVAS_WIDTH;
  canvasHeight = CANVAS_HEIGHT;

  private gameLoop = inject(GameLoopService);
  private assetLoaderService = inject(AssetLoaderService);
  private rendererService = inject(RendererService);
  private gameStateService = inject(GameStateService);

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
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get 2D rendering context');
      return;
    }
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
      alpha,
    ).x;

    const p = Vector2.lerp(
      { x: this.snapshotPrev.playerX, y: this.snapshotPrev.playerY },
      { x: this.snapshot.playerX, y: this.snapshot.playerY },
      alpha,
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
        layer.color,
      );
    }

    // WORLD (platform, collectibles, enemies and player rendering)
    for (const plat of this.platforms) {
      this.rendererService.drawRect(
        this.ctx,
        plat.position.x - cam,
        plat.position.y,
        plat.width,
        plat.height,
        'gray',
      );
    }

    // COLLECTIBLES
    for (const c of this.collectibles) {
      if (c.collected && c.fade <= 0) continue;

      let key = 'coin';
      if (c.type === 'beer') {
        key = c.beerVariant === 'small' ? 'small-beer' : 'big-beer';
      }

      // fade alpha & rise offset
      const alpha = c.collected ? c.fade / PICKUP_FADE_TIME : 1; // 1..0 over fade time
      const t = 1 - alpha; // 0..1 time-normalized
      const rise = c.collected ? t * PICKUP_RISE_PIXELS : 0;

      // POP SCALE (centered)
      const easeOut = (x: number) => 1 - (1 - x) * (1 - x);
      const popScale = 1 + 0.2 * easeOut(t);
      const drawW = c.width * popScale;
      const drawH = c.height * popScale;
      const drawX = c.position.x - cam - (drawW - c.width) / 2;
      const drawY = c.position.y - rise - (drawH - c.height) / 2;

      const img = this.assetLoaderService.getImage(key);

      const prevAlpha = this.ctx.globalAlpha;
      this.ctx.globalAlpha = alpha;
      this.rendererService.drawImage(this.ctx, img, drawX, drawY, drawW, drawH);
      this.ctx.globalAlpha = prevAlpha;
    }

    // ENEMIES
    for (const e of this.enemies) {
      const key = e.type; // 'punk' | 'homeless'
      const img = this.assetLoaderService.getImage(key);
      const w = ENEMY_WIDTH;
      const h = ENEMY_HEIGHT;
      this.rendererService.drawImage(
        this.ctx,
        img,
        e.position.x - cam,
        e.position.y,
        w,
        h,
      );
    }

    // PROJECTILES (above world, below floaters)
    for (const p of this.gameStateService.projectiles) {
      this.rendererService.drawRect(
        this.ctx,
        p.position.x - cam, // camera parallax
        p.position.y,
        p.width,
        p.height,
        '#ffd166', // temp color; swap to sprite later
      );
    }

    const playerImg = this.assetLoaderService.getImage('player');
    this.rendererService.drawImage(
      this.ctx,
      playerImg,
      playerX - cam,
      playerY,
      PLAYER_WIDTH,
      PLAYER_HEIGHT,
    );

    for (const f of this.gameStateService.floaters) {
      const tSec = (now - f.bornAt) / 1000;
      const a = Math.max(0, 1 - tSec / LABEL_TTL_SEC);
      if (a <= 0) continue;

      const y = f.y0 + LABEL_VY_PX_PER_SEC * tSec;

      this.rendererService.drawText(
        this.ctx,
        f.text,
        f.x - cam,
        y,
        a,
        'bold 12px monospace',
        '#ffd54a',
        'center',
      );
    }
  }
}
