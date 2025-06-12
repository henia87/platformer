import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  Input,
} from '@angular/core';
import { GameLoopService } from '../../../core/services/game-loop.service';
import { Subscription } from 'rxjs';
import { AssetLoaderService } from '../../../core/services/asset-loader.service';
import { RendererService } from '../../../core/services/renderer.service';

@Component({
  selector: 'app-game-canvas',
  standalone: false,
  templateUrl: './game-canvas.component.html',
  styleUrl: './game-canvas.component.scss',
})
export class GameCanvasComponent implements OnInit, OnDestroy {
  @Input() player!: {
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    acceleration: { x: number; y: number };
    grounded: boolean;
  };
  @Input() platform!: {
    position: { x: number; y: number };
    size: { width: number; height: number };
  };

  @ViewChild('gameCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private frameSub?: Subscription;
  private x = 0;

  private gameLoop = inject(GameLoopService);
  private assetLoaderService = inject(AssetLoaderService);
  private rendererService = inject(RendererService);

  ngOnInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.gameLoop.start();
    this.frameSub = this.gameLoop.frame.subscribe((dt: number) => {
      this.update(dt);
      this.render();
    });
  }

  ngOnDestroy(): void {
    this.frameSub?.unsubscribe();
    this.gameLoop.stop();
  }

  update(dt: number) {
    this.x += 100 * dt; // Move 100px/sec
    if (this.x > 300) this.x = 0;
  }

  render() {
    // Clear the canvas
    this.rendererService.clear(this.ctx, 400, 300);

    // Draw platform
    this.rendererService.drawRect(
      this.ctx,
      this.platform.position.x,
      this.platform.position.y,
      this.platform.size.width,
      this.platform.size.height,
      'gray'
    );

    // Draw player
    const playerImg = this.assetLoaderService.getImage('player');
    this.rendererService.drawImage(
      this.ctx,
      playerImg,
      this.player.position.x,
      this.player.position.y,
      40,
      60
    );
  }
}
