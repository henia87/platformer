import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssetLoaderService } from './services/asset-loader.service';
import { CollisionService } from './services/collision.service';
import { GameLoopService } from './services/game-loop.service';
import { InputService } from './services/input.service';
import { PhysicsService } from './services/physics.service';
import { RendererService } from './services/renderer.service';
@NgModule({
  declarations: [],
  imports: [CommonModule],
  providers: [
    AssetLoaderService,
    CollisionService,
    GameLoopService,
    InputService,
    RendererService,
    PhysicsService,
  ],
})
export class CoreModule {}
