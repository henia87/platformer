import { Component, inject, OnInit } from '@angular/core';
import { InputService } from './core/services/input.service';
import { GameLoopService } from './core/services/game-loop.service';
import { PhysicsService } from './core/services/physics.service';
import { AssetLoaderService } from './core/services/asset-loader.service';
import { CollisionService } from './core/services/collision.service';
import { CameraService } from './core/services/camera.service';
import { ParallaxLayersService } from './core/services/parallax-layers.service';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_JUMP,
  PLATFORM_WIDTH,
  PLATFORM_HEIGHT,
  PLATFORM_Y,
  PLAYER_ACCELERATION,
} from './core/game.config';

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
  private assetLoaderService = inject(AssetLoaderService);
  private collisionService = inject(CollisionService);
  private cameraService = inject(CameraService);
  private parallaxLayersService = inject(ParallaxLayersService);

  title = 'platformer';

  player = {
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
    grounded: false,
  };
  // --- Coyote Time ---
  private coyoteTime = 0;
  private readonly COYOTE_TIME_MAX = 0.12; // seconds

  // --- Jump Buffer ---
  private jumpBuffer = 0;
  private readonly JUMP_BUFFER_MAX = 0.12; // seconds

  platform = {
    position: { x: 100, y: PLATFORM_Y },
    size: { width: PLATFORM_WIDTH, height: PLATFORM_HEIGHT },
  };
  canvasWidth = CANVAS_WIDTH;
  canvasHeight = CANVAS_HEIGHT;

  cameraX = 0;
  layers = this.parallaxLayersService.getLayers();

  private async loadAssets() {
    try {
      await this.assetLoaderService.loadImage(
        'player',
        'assets/sprites/player.png'
      );
      await this.assetLoaderService.loadImage('bg-sky', 'assets/bg/bg-sky.png');
      await this.assetLoaderService.loadImage(
        'bg-hills',
        'assets/bg/bg-hills.png'
      );
      await this.assetLoaderService.loadImage(
        'bg-buildings',
        'assets/bg/bg-buildings.png'
      );
      await this.assetLoaderService.loadImage(
        'bg-near',
        'assets/bg/bg-near.png'
      );

      console.log(
        'Assets loaded:',
        this.assetLoaderService.getImage('player'),
        this.assetLoaderService.getImage('bg-sky'),
        this.assetLoaderService.getImage('bg-hills'),
        this.assetLoaderService.getImage('bg-buildings'),
        this.assetLoaderService.getImage('bg-near')
      );
    } catch (error) {
      console.error('Asset loading failed:', error);
    }
  }

  ngOnInit(): void {
    this.inputService.inputState.subscribe((state) => {
      this.player.acceleration.x = 0;

      if (state.left) this.player.acceleration.x = -PLAYER_ACCELERATION;
      if (state.right) this.player.acceleration.x = PLAYER_ACCELERATION;

      if (state.jump) {
        this.jumpBuffer = this.JUMP_BUFFER_MAX;
      }
    });

    this.gameLoopService.start();

    this.gameLoopService.frame.subscribe((deltaTime) => {
      // --- Coyote Time update ---
      if (this.jumpBuffer > 0) {
        this.jumpBuffer -= deltaTime;
      }

      if (this.player.grounded) {
        this.coyoteTime = this.COYOTE_TIME_MAX;
      } else if (this.coyoteTime > 0) {
        this.coyoteTime -= deltaTime;
      }

      // --- Jump Buffer update and jump logic ---
      if (this.jumpBuffer > 0 && this.coyoteTime > 0) {
        this.physicsService.applyImpulse(this.player, 0, PLAYER_JUMP);
        this.player.grounded = false;
        this.coyoteTime = 0;
        this.jumpBuffer = 0;
      }

      this.physicsService.updatePlayer(this.player, deltaTime);

      const playerBox = {
        position: this.player.position,
        size: { width: PLAYER_WIDTH, height: PLAYER_HEIGHT },
      };
      const platformBox = {
        position: this.platform.position,
        size: this.platform.size,
      };

      const isColliding = this.collisionService.checkAABBCollision(
        playerBox,
        platformBox
      );

      if (isColliding) {
        const playerBottom = this.player.position.y + PLAYER_HEIGHT;
        const playerTop = this.player.position.y;
        const platformTop = platformBox.position.y;
        const platformBottom = platformBox.position.y + platformBox.size.height;

        if (this.player.velocity.y > 0 && playerBottom > platformTop) {
          // Landing on top of platform
          this.player.grounded = true;
          this.player.velocity.y = 0;
          this.player.position.y = platformTop - PLAYER_HEIGHT;
        } else if (this.player.velocity.y < 0 && playerTop < platformBottom) {
          // Hitting from below
          this.player.velocity.y = 0;
          this.player.position.y = platformBottom;
        } else {
          this.player.grounded = false;
        }
      } else {
        this.player.grounded = false;
      }

      // Prevent player from leaving the canvas area
      if (this.player.position.x < 0) {
        this.player.position.x = 0;
        this.player.velocity.x = 0;
      }
      if (this.player.position.x > CANVAS_WIDTH - PLAYER_WIDTH) {
        this.player.position.x = CANVAS_WIDTH - PLAYER_WIDTH;
        this.player.velocity.x = 0;
      }
      if (this.player.position.y < 0) {
        this.player.position.y = 0;
        this.player.velocity.y = 0;
      }
      const maxY = CANVAS_HEIGHT - PLAYER_HEIGHT;
      if (this.player.position.y > maxY) {
        this.player.position.y = maxY;
        this.player.velocity.y = 0;
        this.player.grounded = true;
      }

      const playerX = this.player.position.x; // Get the updated player position
      this.cameraService.update(playerX); // Update camera based on player position
      this.cameraX = this.cameraService.xPos; // Sync cameraX with CameraService position
    });

    this.loadAssets();
  }
}
