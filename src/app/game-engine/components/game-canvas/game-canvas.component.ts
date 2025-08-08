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
} from '../../../core/game.config';

@Component({
  selector: 'app-game-canvas',
  standalone: false,
  templateUrl: './game-canvas.component.html',
  styleUrl: './game-canvas.component.scss',
})
export class GameCanvasComponent implements OnInit, AfterViewInit, OnDestroy {
  /**
   * The player object to render on the canvas.
   */
  @Input() player!: {
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    acceleration: { x: number; y: number };
    grounded: boolean;
  };
  /**
   * The platform object to render on the canvas.
   */
  @Input() platform!: {
    position: { x: number; y: number };
    size: { width: number; height: number };
  };
  @Input() cameraX = 0;
  @Input() layers: {
    key: string;
    speed: number;
    color?: string;
    height: number;
    yFromBottom?: number; // Optional property for y offset
  }[] = [];

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

  /**
   * Initializes the canvas context after the view has been initialized.
   * Sets the canvas width and height based on the component's properties.
   */
  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    this.ctx = canvas.getContext('2d')!;
  }

  /**
   * Initializes the game canvas component.
   * Sets up the canvas size and starts the game loop.
   */
  ngOnInit(): void {
    this.gameLoop.start();
    this.frameSub = this.gameLoop.frame.subscribe((dt: number) => {
      this.update(dt);
      this.render();
    });
  }

  /**
   * Cleans up the game loop subscription when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.frameSub?.unsubscribe();
    this.gameLoop.stop();
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

    // BACKGROUND → FOREGROUND
    for (const layer of this.layers) {
      const img = this.assetLoaderService.getImage(layer.key);
      const offsetX = this.cameraX * layer.speed;
      this.rendererService.drawParallaxLayer(
        this.ctx,
        img,
        this.canvasWidth,
        this.canvasHeight,
        offsetX,
        layer.yFromBottom || 0, // Pass yFromBottom from the layer
        layer.height,
        layer.color
      );
    }

    // WORLD (example platform and player rendering)
    this.rendererService.drawRect(
      this.ctx,
      this.platform.position.x - this.cameraX,
      this.platform.position.y,
      this.platform.size.width,
      this.platform.size.height,
      'gray'
    );

    const playerImg = this.assetLoaderService.getImage('player');
    this.rendererService.drawImage(
      this.ctx,
      playerImg,
      this.player.position.x - this.cameraX, // Use dynamic player position
      this.player.position.y, // Use dynamic player position
      PLAYER_WIDTH,
      PLAYER_HEIGHT
    );
  }
}
