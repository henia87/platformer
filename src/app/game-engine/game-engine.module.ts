import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { GameCanvasComponent } from './components/game-canvas/game-canvas.component';

@NgModule({
  declarations: [GameCanvasComponent],
  imports: [CommonModule],
  exports: [GameCanvasComponent],
})
export class GameEngineModule {}
