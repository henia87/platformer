import { Component, inject, OnInit } from '@angular/core';
import { InputService } from './core/services/input.service';
import { GameLoopService } from './core/services/game-loop.service';
import { PhysicsService } from './core/services/physics.service';
import { AssetLoaderService } from './core/services/asset-loader.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private inputService = inject(InputService);
  private gameLoopService = inject(GameLoopService);
  private physicsService = inject(PhysicsService);
  public assetLoaderService = inject(AssetLoaderService);

  title = 'platformer';

  player = {
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
    grounded: false,
  };

  private async loadAssets() {
    try {
      await this.assetLoaderService.loadImage(
        'player',
        'assets/sprites/player.png'
      );
      console.log(
        '🎨 Loaded player image!',
        this.assetLoaderService.getImage('player')
      );
    } catch (error) {
      console.error('Asset loading failed:', error);
    }
  }

  ngOnInit(): void {
    // this.inputService.inputState.subscribe((state) => {
    //   console.log('🕹️ Input:', state);

    //   // Example: move left/right
    //   const speed = 200; // pixels/sec

    //   this.player.acceleration.x = 0;
    //   if (state.left) this.player.acceleration.x = -speed;
    //   if (state.right) this.player.acceleration.x = speed;

    //   // Simple jump logic (one-time impulse)
    //   if (state.jump && this.player.grounded) {
    //     this.physicsService.applyImpulse(this.player, 0, -500);
    //     this.player.grounded = false; // temporarily unset ground
    //   }
    // });

    // this.gameLoopService.start();

    // this.gameLoopService.frame.subscribe((deltaTime) => {
    //   this.physicsService.updatePlayer(this.player, deltaTime);
    //   console.log('🎸 Position:', this.player.position);
    // });

    this.loadAssets();
  }
}
