/**
 * GameLoopService manages the main game loop, providing fixed update and render steps.
 * It emits observables for both physics updates and rendering frames.
 *
 * @file GameLoopService provides the main loop for the game engine.
 */
import { Injectable, NgZone, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GameLoopService {
  private ngZone = inject(NgZone);

  private running = false;

  // Fixed update step ~16.6667ms (60Hz)
  private readonly step = 1000 / 60;
  private accumulator = 0;
  private lastTime = 0;

  // Emits once per fixed update (dt in seconds)
  private updateSubject = new Subject<number>();
  public update$: Observable<number> = this.updateSubject.asObservable();

  // Emits once per render frame (alpha is interpolation 0..1)
  private renderSubject = new Subject<number>();
  public render$: Observable<number> = this.renderSubject.asObservable();

  /**
   * Starts the game loop, emitting update and render events.
   */
  start(): void {
    if (this.running) return;
    this.running = true;

    this.ngZone.runOutsideAngular(() => {
      const loop = (now: number) => {
        if (!this.running) return;

        if (this.lastTime === 0) this.lastTime = now;
        let frameTime = now - this.lastTime;
        this.lastTime = now;

        // Clamp huge frame jumps to avoid spiral of death after tab-sleep
        if (frameTime > 250) frameTime = 250;

        this.accumulator += frameTime;

        let panic = 0;
        while (this.accumulator >= this.step) {
          // Fixed dt in seconds:
          this.updateSubject.next(this.step / 1000);
          this.accumulator -= this.step;

          // Safety: avoid > 240 physics steps if tab hibernates
          if (++panic > 240) {
            this.accumulator = 0;
            break;
          }
        }

        // Interpolation alpha for smooth rendering (0..1)
        const alpha = this.accumulator / this.step;
        this.renderSubject.next(alpha);

        requestAnimationFrame(loop);
      };

      requestAnimationFrame(loop);
    });
  }

  /**
   * Stops the game loop and resets timing state.
   */
  stop(): void {
    this.running = false;
    this.lastTime = 0;
    this.accumulator = 0;
  }
}
