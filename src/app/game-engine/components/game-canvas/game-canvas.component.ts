import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { GameLoopService } from '../../../core/services/game-loop.service';
import { Subscription } from 'rxjs';
import { AssetLoaderService } from '../../../core/services/asset-loader.service';

@Component({
  selector: 'app-game-canvas',
  standalone: false,
  templateUrl: './game-canvas.component.html',
  styleUrl: './game-canvas.component.scss',
})
export class GameCanvasComponent implements OnInit, OnDestroy {
  @ViewChild('gameCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private frameSub?: Subscription;
  private x = 0;

  private gameLoop = inject(GameLoopService);
  private assetLoaderService = inject(AssetLoaderService);

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
    this.ctx.clearRect(0, 0, 400, 300);
    // Draw player sprite if loaded, else fallback to rectangle
    const playerImg = this.assetLoaderService.getImage('player');
    if (playerImg) {
      this.ctx.drawImage(playerImg, this.x, 120, 40, 40);
    } else {
      this.ctx.fillStyle = 'deepskyblue';
      this.ctx.fillRect(this.x, 120, 40, 40);
    }
  }
}
