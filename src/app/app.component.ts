import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_JUMP,
  PLAYER_ACCELERATION,
  WORLD_WIDTH,
  LABEL_TTL_SEC,
} from './core/game.config';
import { AssetLoaderService } from './core/services/asset-loader.service';
import { CameraService } from './core/services/camera.service';
import { CollectibleService } from './core/services/collectible.service';
import { CollisionService } from './core/services/collision.service';
import { CombatService } from './core/services/combat.service';
import { EnemyService } from './core/services/enemy.service';
import { GameLoopService } from './core/services/game-loop.service';
import { InputService } from './core/services/input.service';
import { ParallaxLayersService } from './core/services/parallax-layers.service';
import { PhysicsService } from './core/services/physics.service';
import { ProjectileService } from './core/services/projectile.service';
import { GameStateService } from './state/game-state.service';

/**
 * AppComponent is the root component that wires up all core game services and manages the main game state.
 * It handles player input, physics, collisions, camera, asset loading and the main game loop.
 * This is where the game world, player and platform are initialized and updated each frame.
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
export class AppComponent implements OnInit, OnDestroy {
  private inputService = inject(InputService);
  private gameLoopService = inject(GameLoopService);
  private physicsService = inject(PhysicsService);
  private assetLoaderService = inject(AssetLoaderService);
  private collisionService = inject(CollisionService);
  private combatService = inject(CombatService);
  private projectileService = inject(ProjectileService);
  private cameraService = inject(CameraService);
  private collectibleService = inject(CollectibleService);
  private enemyService = inject(EnemyService);
  private parallaxLayersService = inject(ParallaxLayersService);
  private gameStateService = inject(GameStateService);

  private inputSnapshot = {
    left: false,
    right: false,
    jump: false,
    shoot: false,
  };

  private inputSub?: Subscription;
  private updateSub?: Subscription;

  /** Current game state snapshot for rendering. */
  snapshot = { cam: 0, playerX: 0, playerY: 0 };

  /** Previous game state snapshot for interpolation. */
  snapshotPrev = { cam: 0, playerX: 0, playerY: 0 };

  /** Timestamp of last physics update. */
  lastUpdateAtMs = 0;

  player = this.gameStateService.player;
  platforms = this.gameStateService.platforms;
  collectibles = this.gameStateService.collectibles;
  enemies = this.gameStateService.enemies;
  floaters = this.gameStateService.floaters;
  projectiles = this.gameStateService.projectiles;

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
        'assets/sprites/player.png',
      );

      // Backgrounds
      await this.assetLoaderService.loadImage('bg-sky', 'assets/bg/bg-sky.png');
      await this.assetLoaderService.loadImage(
        'bg-hills',
        'assets/bg/bg-hills.png',
      );
      await this.assetLoaderService.loadImage(
        'bg-buildings',
        'assets/bg/bg-buildings.png',
      );
      await this.assetLoaderService.loadImage(
        'bg-near',
        'assets/bg/bg-near.png',
      );

      // Collectibles
      await this.assetLoaderService.loadImage(
        'big-beer',
        'assets/sprites/big-beer.png',
      );
      await this.assetLoaderService.loadImage(
        'small-beer',
        'assets/sprites/small-beer.png',
      );
      await this.assetLoaderService.loadImage(
        'coin',
        'assets/sprites/coin.png',
      );

      // Enemies
      await this.assetLoaderService.loadImage(
        'punk',
        'assets/sprites/punk.png',
      );
      await this.assetLoaderService.loadImage(
        'homeless',
        'assets/sprites/homeless.png',
      );

      console.log(
        'Assets loaded:',
        this.assetLoaderService.getImage('player'),
        this.assetLoaderService.getImage('bg-sky'),
        this.assetLoaderService.getImage('bg-hills'),
        this.assetLoaderService.getImage('bg-buildings'),
        this.assetLoaderService.getImage('bg-near'),
        this.assetLoaderService.getImage('big-beer'),
        this.assetLoaderService.getImage('small-beer'),
        this.assetLoaderService.getImage('coin'),
        this.assetLoaderService.getImage('punk'),
        this.assetLoaderService.getImage('homeless'),
      );
    } catch (error) {
      console.error('Asset loading failed:', error);
    }
  }

  ngOnInit(): void {
    this.cameraService.setWorldWidth(WORLD_WIDTH);

    /** First-frame player placement */
    this.player.position.x = 0;
    this.player.position.y = CANVAS_HEIGHT - PLAYER_HEIGHT - 5;
    this.player.grounded = true;

    /** Initial camera and snapshot */
    const playerCenterX = this.player.position.x + PLAYER_WIDTH / 2;
    this.cameraService.update(playerCenterX);

    this.snapshot = {
      cam: this.cameraService.xPos,
      playerX: this.player.position.x,
      playerY: this.player.position.y,
    };

    /** Start game loop */
    this.gameLoopService.start();

    /** Input service */
    this.inputSub = this.inputService.inputState.subscribe((state) => {
      this.inputSnapshot = state;
      this.player.acceleration.x = 0;
      if (state.left) {
        this.player.acceleration.x = -PLAYER_ACCELERATION;
      }
      if (state.right) {
        this.player.acceleration.x = PLAYER_ACCELERATION;
      }
      if (state.jump) this.jumpBuffer = this.JUMP_BUFFER_MAX;
    });

    /** Subscription to game loop updates */
    this.updateSub = this.gameLoopService.update$.subscribe((dtSec) => {
      const deltaTime = dtSec; // fixed 1/60s
      const nowMs = performance.now();

      // Coyote / Jump buffer
      if (this.jumpBuffer > 0) this.jumpBuffer -= deltaTime;
      if (this.player.grounded) this.coyoteTime = this.COYOTE_TIME_MAX;
      else if (this.coyoteTime > 0) this.coyoteTime -= deltaTime;

      if (this.jumpBuffer > 0 && this.coyoteTime > 0) {
        this.player.velocity.y = PLAYER_JUMP;
        this.player.grounded = false;
        this.coyoteTime = 0;
        this.jumpBuffer = 0;
      }

      // Physics
      this.physicsService.updatePlayer(
        this.player,
        this.inputSnapshot,
        deltaTime,
      );

      // ===== COLLISIONS vs ALL PLATFORMS =====
      let groundedThisFrame = false;

      const playerBox = {
        position: this.player.position,
        size: { width: PLAYER_WIDTH, height: PLAYER_HEIGHT },
      };

      for (const plat of this.platforms) {
        const platformBox = {
          position: plat.position,
          size: { width: plat.width, height: plat.height },
        };

        const isColliding = this.collisionService.checkAABBCollision(
          playerBox,
          platformBox,
        );
        if (!isColliding) continue;

        const playerBottom = this.player.position.y + PLAYER_HEIGHT;
        const playerTop = this.player.position.y;
        const platformTop = platformBox.position.y;
        const platformBottom = platformBox.position.y + platformBox.size.height;

        if (this.player.velocity.y > 0 && playerBottom > platformTop) {
          groundedThisFrame = true;
          this.player.velocity.y = 0;
          this.player.position.y = platformTop - PLAYER_HEIGHT;
        } else if (this.player.velocity.y < 0 && playerTop < platformBottom) {
          this.player.velocity.y = 0;
          this.player.position.y = platformBottom;
        }
      }

      this.player.grounded = groundedThisFrame;

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
      const maxY = CANVAS_HEIGHT - PLAYER_HEIGHT - 5;
      if (this.player.position.y > maxY) {
        this.player.position.y = maxY;
        this.player.velocity.y = 0;
        this.player.grounded = true;
      }

      // --- Enemy patrol ---
      this.enemyService.updateEnemies(this.enemies, deltaTime);

      // --- Collectible pickups + fade-out timer ---
      for (const ev of this.collectibleService.checkPickups(
        this.player,
        this.collectibles,
        deltaTime,
      )) {
        this.gameStateService.spawnFloater(ev.x, ev.y, ev.text);
      }

      // --- Weapon: facing, firing, movement, and projectile-vs-enemy hits ---
      for (const ev of this.projectileService.update(
        this.projectiles,
        this.player,
        this.enemies,
        this.inputSnapshot,
        deltaTime,
        nowMs,
      )) {
        this.gameStateService.spawnFloater(ev.x, ev.y, ev.text);
      }

      // --- Enemy collision: stomp vs side-only hit + i-frames ---
      for (const ev of this.combatService.handlePlayerEnemyCollision(
        this.player,
        this.enemies,
        nowMs,
      )) {
        this.gameStateService.spawnFloater(ev.x, ev.y, ev.text);
      }

      this.gameStateService.pruneFloaters(nowMs, LABEL_TTL_SEC * 1000);
      this.gameStateService.pruneProjectiles(nowMs, deltaTime * 1000);

      /** Camera */
      const playerCenterX = this.player.position.x + PLAYER_WIDTH / 2;
      this.cameraService.update(playerCenterX);
      this.cameraX = this.cameraService.xPos;

      /** Copy current -> prev (field by field) */
      this.snapshotPrev.cam = this.snapshot.cam;
      this.snapshotPrev.playerX = this.snapshot.playerX;
      this.snapshotPrev.playerY = this.snapshot.playerY;

      /** Write new current (field by field) */
      this.snapshot.cam = this.cameraService.xPos;
      this.snapshot.playerX = this.player.position.x;
      this.snapshot.playerY = this.player.position.y;

      this.lastUpdateAtMs = nowMs;
    });

    this.loadAssets();
  }

  ngOnDestroy(): void {
    this.inputSub?.unsubscribe();
    this.updateSub?.unsubscribe();
    this.gameLoopService.stop();
  }
}
