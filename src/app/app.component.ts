import { Component, inject, OnInit } from '@angular/core';

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_JUMP,
  PLAYER_ACCELERATION,
  WORLD_WIDTH,
  PICKUP_FADE_TIME,
  LABEL_TTL_SEC,
  SMALL_BEER_HP,
  BIG_BEER_HP,
  PLAYER_MAX_HEALTH,
  COIN_VALUE,
  PLAYER_MIN_HEALTH,
  PLAYER_IFRAME_MS,
  STOMP_BOUNCE_VY,
  STOMP_VERTICAL_TOLERANCE,
  PLAYER_DAMAGE_AGAINST_PUNK,
  PLAYER_DAMAGE_AGAINST_HOMELESS,
  SIDE_HIT_BAND_PX,
  PROJECTILE_WIDTH,
  PROJECTILE_HEIGHT,
  PROJECTILE_SPEED,
  PROJECTILE_TTL_MS,
  PROJECTILE_FIRE_COOLDOWN_MS,
  PROJECTILE_SPAWN_OFFSET_X,
  PROJECTILE_SPAWN_OFFSET_Y,
  PROJECTILE_DAMAGE,
} from './core/game.config';
import { AssetLoaderService } from './core/services/asset-loader.service';
import { CameraService } from './core/services/camera.service';
import { CollisionService } from './core/services/collision.service';
import { GameLoopService } from './core/services/game-loop.service';
import { InputService } from './core/services/input.service';
import { ParallaxLayersService } from './core/services/parallax-layers.service';
import { PhysicsService } from './core/services/physics.service';
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
export class AppComponent implements OnInit {
  private inputService = inject(InputService);
  private gameLoopService = inject(GameLoopService);
  private physicsService = inject(PhysicsService);
  private assetLoaderService = inject(AssetLoaderService);
  private collisionService = inject(CollisionService);
  private cameraService = inject(CameraService);
  private parallaxLayersService = inject(ParallaxLayersService);
  private gameStateService = inject(GameStateService);

  private inputSnapshot = {
    left: false,
    right: false,
    jump: false,
    shoot: false,
  };

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

  private facing = 1;
  private fireReadyAtMs = 0;

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

  private handleProjectileFiring(nowMs: number): void {
    if (!this.inputSnapshot.shoot || nowMs < this.fireReadyAtMs) return;

    const dir = this.facing >= 0 ? 1 : -1;
    const spawnX =
      this.player.position.x +
      (dir > 0 ? PLAYER_WIDTH : 0) +
      dir * PROJECTILE_SPAWN_OFFSET_X;
    const spawnY = this.player.position.y + PROJECTILE_SPAWN_OFFSET_Y;
    const vx = dir * PROJECTILE_SPEED;

    this.gameStateService.spawnProjectile(
      spawnX,
      spawnY,
      vx,
      0,
      PROJECTILE_WIDTH,
      PROJECTILE_HEIGHT,
      PROJECTILE_TTL_MS,
    );

    this.fireReadyAtMs = nowMs + PROJECTILE_FIRE_COOLDOWN_MS;
  }

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
    this.inputService.inputState.subscribe((state) => {
      this.inputSnapshot = state;
      this.player.acceleration.x = 0;
      if (state.left) {
        this.player.acceleration.x = -PLAYER_ACCELERATION;
        this.facing = -1;
      }
      if (state.right) {
        this.player.acceleration.x = PLAYER_ACCELERATION;
        this.facing = 1;
      }
      if (state.jump) this.jumpBuffer = this.JUMP_BUFFER_MAX;
    });

    /** Subscription to game loop updates */
    this.gameLoopService.update$.subscribe((dtSec) => {
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

      // --- Enemy patrol (minimal) ---
      for (const e of this.enemies) {
        if (e.patrolMaxX > e.patrolMinX) {
          e.position.x += e.speed * e.dir * deltaTime;
          if (e.position.x < e.patrolMinX) {
            e.position.x = e.patrolMinX;
            e.dir = 1;
          }
          if (e.position.x > e.patrolMaxX) {
            e.position.x = e.patrolMaxX;
            e.dir = -1;
          }
        }
      }

      // --- Collectible pickup ---
      for (const c of this.collectibles) {
        if (c.collected) continue;
        const hit = this.collisionService.checkAABBCollision(
          {
            position: this.player.position,
            size: { width: PLAYER_WIDTH, height: PLAYER_HEIGHT },
          },
          { position: c.position, size: { width: c.width, height: c.height } },
        );
        if (hit) {
          c.collected = true;
          c.fade = PICKUP_FADE_TIME;

          const label =
            c.type === 'coin'
              ? `+${COIN_VALUE}`
              : c.beerVariant === 'small'
                ? `+${SMALL_BEER_HP} HP`
                : `+${BIG_BEER_HP} HP`;

          this.gameStateService.spawnFloater(
            c.position.x,
            c.position.y - 4,
            label,
          );

          if (c.type === 'coin') {
            this.player.score += COIN_VALUE;
          } else {
            const heal =
              c.beerVariant === 'small' ? SMALL_BEER_HP : BIG_BEER_HP;
            this.player.health = Math.min(
              PLAYER_MAX_HEALTH,
              this.player.health + heal,
            );
          }
          // TODO: SFX/particles
        }
      }

      this.handleProjectileFiring(nowMs);

      for (const p of this.projectiles) {
        p.position.x += p.velocity.x * deltaTime;
        p.position.y += p.velocity.y * deltaTime;
      }

      // --- Projectiles hit enemies ---
      for (let pi = this.projectiles.length - 1; pi >= 0; pi--) {
        const p = this.projectiles[pi];

        for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
          const e = this.enemies[ei];
          if (!e.alive) continue;

          const hit = this.collisionService.checkAABBCollision(
            {
              position: p.position,
              size: { width: p.width, height: p.height },
            },
            {
              position: e.position,
              size: { width: e.width, height: e.height },
            },
          );
          if (!hit) continue;

          // apply projectile damage
          const died = e.takeDamage(PROJECTILE_DAMAGE);

          // enemy damage floater
          this.gameStateService.spawnFloater(
            e.position.x + e.width / 2,
            e.position.y - 6,
            `⚔️ -${PROJECTILE_DAMAGE}`,
          );

          // consume projectile
          this.projectiles.splice(pi, 1);

          if (died) {
            this.player.score = (this.player.score ?? 0) + 50;
            this.gameStateService.spawnFloater(
              e.position.x + e.width / 2,
              e.position.y - 16,
              '💀',
            );
            this.enemies.splice(ei, 1);
          }
          break; // stop checking other enemies for this projectile
        }
      }

      // Enemy collision: stomp vs side-only hit + i-frames + clearer floaters
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        if (!e.alive) continue;

        // AABB test
        const hit = this.collisionService.checkAABBCollision(
          {
            position: this.player.position,
            size: { width: PLAYER_WIDTH, height: PLAYER_HEIGHT },
          },
          { position: e.position, size: { width: e.width, height: e.height } },
        );
        if (!hit) continue;

        // --- Compute collision context ---
        const px = this.player.position.x;
        const py = this.player.position.y;
        const ex = e.position.x;
        const ey = e.position.y;

        const playerCenterX = px + PLAYER_WIDTH * 0.5;
        const playerCenterY = py + PLAYER_HEIGHT * 0.5;
        const enemyCenterX = ex + e.width * 0.5;
        const enemyCenterY = ey + e.height * 0.5;

        // penetration depths (Manhattan-style AABB)
        const dx = playerCenterX - enemyCenterX;
        const dy = playerCenterY - enemyCenterY;
        const penX = PLAYER_WIDTH * 0.5 + e.width * 0.5 - Math.abs(dx);
        const penY = PLAYER_HEIGHT * 0.5 + e.height * 0.5 - Math.abs(dy);

        // "True lateral" if we overlap less along X than Y (classic AABB resolution heuristic)
        const isHorizontalHit = penX < penY;

        // Shoulder band: avoid counting near-top grazes as lateral hits
        const bandTop = ey + SIDE_HIT_BAND_PX;
        const bandBottom = ey + e.height - SIDE_HIT_BAND_PX;
        const inSideBand =
          playerCenterY >= bandTop && playerCenterY <= bandBottom;

        // Stomp detection (from above with some tolerance)
        const playerFeet = py + PLAYER_HEIGHT;
        const enemyTop = ey;
        const isFalling = this.player.velocity.y > 0;
        const isFromAbove =
          isFalling && playerFeet - enemyTop <= STOMP_VERTICAL_TOLERANCE;

        // --- Prioritize stomp if it's a from-above contact ---
        if (isFromAbove) {
          const stompDmg =
            e.type === 'punk'
              ? PLAYER_DAMAGE_AGAINST_PUNK
              : PLAYER_DAMAGE_AGAINST_HOMELESS;

          const died = e.takeDamage(stompDmg);

          // Enemy damage floater
          this.gameStateService.spawnFloater(
            ex + e.width / 2,
            ey - 6,
            `⚔️ -${stompDmg}`,
          );

          // Player bounce
          this.player.velocity.y = -STOMP_BOUNCE_VY;
          this.player.grounded = false;

          if (died) {
            // Score + skull
            this.player.score = (this.player.score ?? 0) + 50;
            this.gameStateService.spawnFloater(ex + e.width / 2, ey - 16, '💀');
            this.enemies.splice(i, 1);
          }

          // Stomp never damages the player
          continue;
        }

        // --- Only damage player on true side hits (front/back), inside the side band ---
        if (isHorizontalHit && inSideBand) {
          // respect i-frames
          if (nowMs >= (this.player.invulnUntilMs ?? 0)) {
            const dmg = e.damage; // per-enemy damage
            this.player.health = Math.max(
              PLAYER_MIN_HEALTH,
              this.player.health - dmg,
            );

            // Player damage floater
            this.gameStateService.spawnFloater(
              px + PLAYER_WIDTH / 2,
              py - 6,
              `🩸 -${dmg}`,
            );

            // Knockback away from enemy
            const kb = 140;
            this.player.velocity.x = px < ex ? -kb : kb;
            this.player.velocity.y = -120;
            this.player.grounded = false;

            // start i-frames
            this.player.invulnUntilMs = nowMs + PLAYER_IFRAME_MS;
          }

          continue;
        }

        // (possibly head-bump behavior)
      }

      // Fade-out timer for collected items
      for (const c of this.collectibles) {
        if (c.collected && c.fade > 0) {
          c.fade -= deltaTime;
          if (c.fade < 0) c.fade = 0;
        }
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
}
