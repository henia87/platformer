import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GameEngineModule } from './game-engine/game-engine.module';
import { CoreModule } from './core/core.module';
@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, AppRoutingModule, CoreModule, GameEngineModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
