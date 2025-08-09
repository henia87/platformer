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
  WORLD_WIDTH,
} from './core/game.config';

/**
 * AppComponent is the root component that wires up all core game services and manages the main game state.
 * It handles player input, physics, collisions, camera, asset loading and the main game loop.
 * This is where the game world, player and platform are initialized and updated each frame.
 *
 * Injected services:
 * - InputService: Handles keyboard input and exposes input state.
 * - GameLoopService: Provides the main update and render loop.
 * - PhysicsService: Updates player physics and movement.
 * - AssetLoaderService: Loads and caches game assets.
 * - CollisionService: Detects collisions between game objects.
 * - CameraService: Manages camera position and viewport.
 * - ParallaxLayersService: Provides parallax background layers.
 *
 * Main properties:
 * - player: The player object (position, velocity, acceleration, grounded).
 * - platform: The main platform object (position, size).
 * - snapshot/snapshotPrev: State snapshots for smooth rendering.
 * - layers: Parallax background layers.
 * - canvasWidth/canvasHeight: Canvas dimensions.
 * - cameraX: Current camera X position.
 *
 * The component subscribes to input and game loop events, updates the game state and manages asset loading.
 */
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
  private inputSnapshot = { left: false, right: false, jump: false };

  /** Current game state snapshot for rendering. */
  snapshot = { cam: 0, playerX: 0, playerY: 0, platformX: 0, platformY: 0 };

  /** Previous game state snapshot for interpolation. */
  snapshotPrev = { cam: 0, playerX: 0, playerY: 0, platformX: 0, platformY: 0 };

  /** Timestamp of last physics update. */
  lastUpdateAtMs = 0;

  /**
   * The player object, including position, velocity, acceleration, and grounded state.
   * @property position - Player's position (x, y)
   * @property velocity - Player's velocity (x, y)
   * @property acceleration - Player's acceleration (x, y)
   * @property grounded - Whether the player is on the ground
   */
  player = {
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
    grounded: false,
  };

  /** Coyote time counter (seconds). Allows jumping shortly after leaving a platform. */
  private coyoteTime = 0;
  /** Maximum coyote time allowed (seconds). */
  private readonly COYOTE_TIME_MAX = 0.12;

  /**
   * Jump buffer counter (seconds). Allows jump input to be buffered before landing.
   */
  private jumpBuffer = 0;
  /** Maximum jump buffer time allowed (seconds). */
  private readonly JUMP_BUFFER_MAX = 0.12;

  /** The main platform object (position and size). */
  platform = {
    position: { x: 100, y: PLATFORM_Y },
    size: { width: PLATFORM_WIDTH, height: PLATFORM_HEIGHT },
  };

  canvasWidth = CANVAS_WIDTH;
  canvasHeight = CANVAS_HEIGHT;

  /** Current camera X position. */
  cameraX = 0;
  /** Parallax background layers. */
  layers = this.parallaxLayersService.getLayers();

  /**
   * Loads all required image assets for the game and logs the results.
   * @private
   */
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
    this.cameraService.setWorldWidth(WORLD_WIDTH);

    /** Place player on the platform for the first frame */
    this.player.position.x = 0; // wherever you want to start
    this.player.position.y = CANVAS_HEIGHT - PLAYER_HEIGHT;
    this.player.grounded = true;

    /** Compute initial camera and snapshot BEFORE starting the loop */
    const playerCenterX = this.player.position.x + PLAYER_WIDTH / 2;
    this.cameraService.update(playerCenterX);

    this.snapshot = {
      cam: this.cameraService.xPos,
      playerX: this.player.position.x,
      playerY: this.player.position.y,
      platformX: this.platform.position.x,
      platformY: this.platform.position.y,
    };

    /** Start game loop */
    this.gameLoopService.start();

    /** Input service */
    this.inputService.inputState.subscribe((state) => {
      this.inputSnapshot = state;
      this.player.acceleration.x = 0;
      if (state.left) this.player.acceleration.x = -PLAYER_ACCELERATION;
      if (state.right) this.player.acceleration.x = PLAYER_ACCELERATION;
      if (state.jump) this.jumpBuffer = this.JUMP_BUFFER_MAX;
    });

    /** Subscription to game loop updates */
    this.gameLoopService.update$.subscribe((dtSec) => {
      const deltaTime = dtSec; // fixed 1/60s

      /** Coyote/Jump buffer */
      if (this.jumpBuffer > 0) this.jumpBuffer -= deltaTime;
      if (this.player.grounded) this.coyoteTime = this.COYOTE_TIME_MAX;
      else if (this.coyoteTime > 0) this.coyoteTime -= deltaTime;

      if (this.jumpBuffer > 0 && this.coyoteTime > 0) {
        this.player.velocity.y = PLAYER_JUMP;
        this.player.grounded = false;
        this.coyoteTime = 0;
        this.jumpBuffer = 0;
      }

      /** Physics step */
      this.physicsService.updatePlayer(
        this.player,
        this.inputSnapshot,
        deltaTime
      );

      /** Collisions */
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
          this.player.grounded = true;
          this.player.velocity.y = 0;
          this.player.position.y = platformTop - PLAYER_HEIGHT;
        } else if (this.player.velocity.y < 0 && playerTop < platformBottom) {
          this.player.velocity.y = 0;
          this.player.position.y = platformBottom;
        } else {
          this.player.grounded = false;
        }
      } else {
        this.player.grounded = false;
      }

      /** World bounds */
      if (this.player.position.x < 0) {
        this.player.position.x = 0;
        if (this.player.acceleration.x < 0) this.player.velocity.x = 0;
      } else if (this.player.position.x > WORLD_WIDTH - PLAYER_WIDTH) {
        this.player.position.x = WORLD_WIDTH - PLAYER_WIDTH;
        if (this.player.acceleration.x > 0) this.player.velocity.x = 0;
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

      /** Camera */
      const playerCenterX = this.player.position.x + PLAYER_WIDTH / 2;
      this.cameraService.update(playerCenterX);
      this.cameraX = this.cameraService.xPos;

      /** Copy current -> prev (field by field) */
      this.snapshotPrev.cam = this.snapshot.cam;
      this.snapshotPrev.playerX = this.snapshot.playerX;
      this.snapshotPrev.playerY = this.snapshot.playerY;
      this.snapshotPrev.platformX = this.snapshot.platformX;
      this.snapshotPrev.platformY = this.snapshot.platformY;

      /** Write new current (field by field) */
      this.snapshot.cam = this.cameraService.xPos;
      this.snapshot.playerX = this.player.position.x;
      this.snapshot.playerY = this.player.position.y;
      this.snapshot.platformX = this.platform.position.x;
      this.snapshot.platformY = this.platform.position.y;

      this.lastUpdateAtMs = performance.now();
    });

    this.loadAssets();
  }
}
