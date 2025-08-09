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

@Component({
  selector: 'app-game-canvas',
  standalone: false,
  templateUrl: './game-canvas.component.html',
  styleUrl: './game-canvas.component.scss',
})
export class GameCanvasComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() layers: {
    key: string;
    speed: number;
    color?: string;
    height: number;
    yFromBottom?: number;
  }[] = [];

  @Input() snapshot!: {
    cam: number;
    playerX: number;
    playerY: number;
    platformX: number;
    platformY: number;
  };
  @Input() snapshotPrev!: {
    cam: number;
    playerX: number;
    playerY: number;
    platformX: number;
    platformY: number;
  };
  @Input() lastUpdateAtMs = 0;

  @ViewChild('gameCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private frameSub?: Subscription;
  private x = 0;

  canvasWidth = CANVAS_WIDTH;
  canvasHeight = CANVAS_HEIGHT;

  private gameLoop = inject(GameLoopService);
  private assetLoaderService = inject(AssetLoaderService);
  private rendererService = inject(RendererService);

  private readonly FIXED_DT_MS = 1000 / 60; // your Physics dt

  private lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }
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
   * Initializes the game canvas component.
   * Sets up the canvas size and starts the game loop.
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
